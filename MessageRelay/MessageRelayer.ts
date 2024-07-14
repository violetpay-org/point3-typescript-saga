import { Channel } from "diagnostics_channel";
import { saga, endpoint, api } from "../Saga/index";
import * as uow from "../UnitOfWork/main";
import { TxContext } from "../UnitOfWork/main";
import { BatchJob } from "./BatchJob";
import { ChannelFromMessageRelay, ChannelRegistryForMessageRelay } from "./Channel";

export class MessageRelayer<Tx extends TxContext> extends BatchJob {
    private BATCH_SIZE = 500; // Dead letter batch size == Message batch size
    private _channelRegistry: ChannelRegistryForMessageRelay<Tx>;
    private _unitOfWorkFactory: uow.UnitOfWorkFactory<Tx>;

    constructor(
        channelRegistry: ChannelRegistryForMessageRelay<Tx>,
        unitOfWorkFactory: uow.UnitOfWorkFactory<Tx>
    ) {
        super();
        this._unitOfWorkFactory = unitOfWorkFactory;
        this._channelRegistry = channelRegistry;
    }

    public async execute(): Promise<void> {
        try {
            await this.relayAndSave();
        } catch (e) {
            console.error(e);
        }
    }

    private async relayAndSave(): Promise<void> {
        var { messagesSuccessfullyPublished, remainingBatchSize } = await this.publishMessages(
            this.BATCH_SIZE,
            true, // get batch from dead letters first
        );

        for (const channelName of messagesSuccessfullyPublished.keys()) {
            const channel = this._channelRegistry.getChannelByName(channelName);
            const messagesToDelete = messagesSuccessfullyPublished.get(channelName);
            await this.deleteDeadLetters(channel, messagesToDelete);
        }

        if (remainingBatchSize <= 0) {
            return;
        }

        var { messagesFailedToPublish, messagesSuccessfullyPublished } = await this.publishMessages(
            remainingBatchSize,
            false, // get batch from outbox
        );

        for (const channelName of messagesFailedToPublish.keys()) {
            const channel = this._channelRegistry.getChannelByName(channelName);
            const messages = messagesFailedToPublish.get(channelName);
            await this.deleteMessagesFromOutbox(channel, messages);
            await this.saveDeadLetters(channel, messages);
        }

        for (const channelName of messagesSuccessfullyPublished.keys()) {
            const channel = this._channelRegistry.getChannelByName(channelName);
            const messagesToDelete = messagesSuccessfullyPublished.get(channelName);
            await this.deleteMessagesFromOutbox(channel, messagesToDelete);
        }
    }

    private async saveDeadLetters<M extends endpoint.AbstractSagaMessage>(
        channel: ChannelFromMessageRelay<M, Tx>,
        deadLetters: M[],
    ) {
        const unitOfWork = this._unitOfWorkFactory();

        const deadLetterSaver = channel
            .getRepository()
            .saveDeadLetters(deadLetters);

        unitOfWork.addToWork(deadLetterSaver);
        unitOfWork.Commit();
    }

    private async deleteMessagesFromOutbox<M extends endpoint.AbstractSagaMessage>(
        channel: ChannelFromMessageRelay<M, Tx>,
        messages: M[],
    ) {
        messages.forEach((message) => {
            const unitOfWork = this._unitOfWorkFactory()

            const deleter = channel
                .getRepository()
                .deleteMessage(message.getId());

            unitOfWork.addToWork(deleter);
            unitOfWork.Commit();
        });
    }

    private async deleteDeadLetters<M extends endpoint.AbstractSagaMessage>(
        channel: ChannelFromMessageRelay<M, Tx>,
        deadLetters: M[],
    ) {
        const unitOfWork = this._unitOfWorkFactory()

        // 이거 한꺼번에 지우는건 좀 위험할 수도 있음
        // 메모리에 올라가는 메시지가 많아지면 문제가 생길 수 있고, 
        // 트랜잭션 시 한번에 업데이트하는 양이 많아지면 또한 문제가 생길 수 있음
        const deadLettersDeleter = channel
            .getRepository()
            .deleteDeadLetters(deadLetters.map((message) => message.getId()));

        unitOfWork.addToWork(deadLettersDeleter);
        unitOfWork.Commit();
    }

    private async publishMessages(
        batchSize: number,
        fromDeadLetters?: boolean
    ): Promise<{
        messagesFailedToPublish: Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>,
        messagesSuccessfullyPublished: Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>,
        remainingBatchSize: number
    }> {
        const messagesFailedToPublish = new Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>();
        const messagesSuccessfullyPublished = new Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>();

        const messagesByChannel = await this.getRelayingMessages(
            this.BATCH_SIZE,
            fromDeadLetters,
        );
        var remainingBatchSize = batchSize;

        for (let channelName of messagesByChannel.keys()) {
            messagesFailedToPublish.set(channelName, []);
            messagesSuccessfullyPublished.set(channelName, []);
            const messages = messagesByChannel.get(channelName);

            for (let message of messages) {
                // 이부분 Promise.all로 바꿔서 동시에 보내도록 수정해야함
                // 현재는 순차적으로 보내기 때문에 성능이 떨어질 수 있음.
                try {
                    await this._channelRegistry
                        .getChannelByName(channelName)
                        .send(message.getSagaMessage());

                    messagesSuccessfullyPublished
                        .get(channelName)
                        .push(message.getSagaMessage());
                } catch (e) {
                    console.error(e);
                    messagesFailedToPublish
                        .get(channelName)
                        .push(message.getSagaMessage());
                }

                remainingBatchSize -= 1;
            }
        }

        return {
            messagesFailedToPublish,
            messagesSuccessfullyPublished,
            remainingBatchSize
        };
    }

    private async getRelayingMessages(
        batchSize: number,
        fromDeadLetters?: boolean
    ): Promise<
        Map<
            endpoint.ChannelName,
            endpoint.AbstractSagaMessageWithOrigin<endpoint.AbstractSagaMessage>[]
        >
    > {
        if (batchSize <= 0) {
            throw new Error("Batch size must be greater than 0");
        }

        const messagesByChannel: Map<
            endpoint.ChannelName,
            endpoint.AbstractSagaMessageWithOrigin<endpoint.AbstractSagaMessage>[]
        > = new Map();

        for (const channel of this._channelRegistry.getChannels()) {
            const messageRepo = channel.getRepository();
            var messages: endpoint.AbstractSagaMessage[] = [];

            if (fromDeadLetters) {
                messages = await messageRepo.getMessagesFromDeadLetter(batchSize);
            } else {
                messages = await messageRepo.getMessagesFromOutbox(batchSize);
            }

            const messagesWithOrigin: endpoint.AbstractSagaMessageWithOrigin<endpoint.AbstractSagaMessage>[] = [];

            for (const message of messages) {
                const messageWithOrigin = channel.parseMessageWithOrigin(message);
                messagesWithOrigin.push(messageWithOrigin);
            }

            messagesByChannel.set(channel.getChannelName(), messagesWithOrigin);
        }

        return messagesByChannel;
    }
}


