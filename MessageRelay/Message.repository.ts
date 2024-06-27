import { saga, endpoint, api } from "../Saga/index";
import * as uow from "../UnitOfWork/main";
import { TxContext } from "../UnitOfWork/main";

export class MessageRelayer<Tx extends TxContext> {
    private BATCH_SIZE = 200; // Dead letter batch size == Message batch size
    private _channelRegistry: api.ChannelRegistry<Tx>;
    private _unitOfWorkFactory: uow.UnitOfWorkFactory<Tx>;

    constructor(
        channelRegistry: api.ChannelRegistry<Tx>,
        unitOfWorkFactory: uow.UnitOfWorkFactory<Tx>
    ) {
        this._unitOfWorkFactory = unitOfWorkFactory;
        this._channelRegistry = channelRegistry;
    }

    public async relay(): Promise<void> {
        const unitOfWork = this._unitOfWorkFactory();

        const toDeadLettersByChannel: Map<
            endpoint.ChannelName,
            (
                endpoint.Command<saga.SagaSession, endpoint.CommandArguments> |
                endpoint.Response
            )[]
        > = new Map();

        const messagesToDeleteByChannel: Map<
            endpoint.ChannelName,
            (
                endpoint.Command<saga.SagaSession, endpoint.CommandArguments> |
                endpoint.Response
            )[]
        > = new Map();

        const messagesByChannel = await this.getRelayingMessages(this.BATCH_SIZE);
        for (let channelName of messagesByChannel.keys()) {
            toDeadLettersByChannel.set(channelName, []);
            messagesToDeleteByChannel.set(channelName, []);
            const messages = messagesByChannel.get(channelName);
            for (let message of messages) {
                try {
                    await this._channelRegistry
                        .getChannelByName(channelName)
                        .send(message.getSagaMessage());

                    messagesToDeleteByChannel
                        .get(channelName)
                        .push(message.getSagaMessage());
                } catch (e) {
                    console.error(e);
                    toDeadLettersByChannel
                        .get(channelName)
                        .push(message.getSagaMessage());
                }
            }
        }

        for (const channelName of toDeadLettersByChannel.keys()) {
            const channel = this._channelRegistry.getChannelByName(channelName);
            const deadLetters = toDeadLettersByChannel.get(channelName);

            if (channel instanceof endpoint.SavableCommandChannel) {
                const deadLetterSaver = channel
                    .getRepository()
                    .saveDeadLetters(deadLetters as endpoint.Command<
                        saga.SagaSession, 
                        endpoint.CommandArguments
                    >[]);

                unitOfWork.addToWork(deadLetterSaver);
            } else if (channel instanceof endpoint.SavableResponseChannel) {
                const deadLetterSaver = channel
                    .getRepository()
                    .saveDeadLetters(deadLetters as endpoint.Response[]);

                unitOfWork.addToWork(deadLetterSaver);
            }
        }

        for (const channelName of messagesToDeleteByChannel.keys()) {
            const channel = this._channelRegistry.getChannelByName(channelName);
            const messagesToDelete = messagesToDeleteByChannel.get(channelName);

            messagesToDelete.forEach((message) => {
                if (channel instanceof endpoint.SavableCommandChannel) {
                    const deleter = channel
                        .getRepository()
                        .deleteMessage(message.getId());

                    unitOfWork.addToWork(deleter);
                } else if (channel instanceof endpoint.SavableResponseChannel) {
                    const deleter = channel
                        .getRepository()
                        .deleteMessage(message.getId());

                    unitOfWork.addToWork(deleter);
                }
            });
        }

        await unitOfWork.Commit();
    }

    private async getRelayingMessages(batchSize: number): Promise<
        Map<
            endpoint.ChannelName,
            endpoint.AbstractSagaMessageWithOrigin<
                endpoint.Command<saga.SagaSession, endpoint.CommandArguments> |
                endpoint.Response
            >[]
        >
    > {
        if (batchSize <= 0) {
            throw new Error("Batch size must be greater than 0");
        }

        const messagesByChannel: Map<
            endpoint.ChannelName,
            endpoint.AbstractSagaMessageWithOrigin<
                endpoint.Command<saga.SagaSession, endpoint.CommandArguments> |
                endpoint.Response
            >[]
        > = new Map();

        for (const channel of this._channelRegistry.getChannels()) {
            const commandRepo = channel.getRepository();

            if (channel instanceof endpoint.SavableCommandChannel) {
                const messages = await commandRepo.getMessagesFromOutbox(batchSize);
                const messagesWithOrigin: endpoint.AbstractSagaMessageWithOrigin<
                    endpoint.Command<saga.SagaSession, endpoint.CommandArguments>
                >[] = [];

                for (const message of messages) {
                    const messageWithOrigin = channel.parseMessageWithOrigin(message as
                        endpoint.Command<saga.SagaSession, endpoint.CommandArguments>);
                    messagesWithOrigin.push(messageWithOrigin);
                }

                messagesByChannel.set(channel.getChannelName(), messagesWithOrigin);
            }

            if (channel instanceof endpoint.SavableResponseChannel) {
                const messages = await commandRepo.getMessagesFromOutbox(batchSize);
                const messagesWithOrigin: endpoint.AbstractSagaMessageWithOrigin<endpoint.Response>[] = [];

                for (const message of messages) {
                    const messageWithOrigin = channel.parseMessageWithOrigin(message as endpoint.Response);
                    messagesWithOrigin.push(messageWithOrigin);
                }

                messagesByChannel.set(channel.getChannelName(), messagesWithOrigin);
            }
        }

        return messagesByChannel;
    }
}


