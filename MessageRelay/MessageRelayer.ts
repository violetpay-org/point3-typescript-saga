import { endpoint } from '../Saga/index';
import { Mutex } from 'async-mutex';
import { BatchJob } from './BatchJob';
import { ChannelFromMessageRelay, ChannelRegistryForMessageRelay } from './Channel';
import { Propagation, Transactional, TransactionContext } from '@tranjs/core';

class RemainingBatchSize {
    private remainingBatchSize: number;
    private mutex: Mutex;

    constructor(initialBatchSize: number) {
        this.remainingBatchSize = initialBatchSize;
        this.mutex = new Mutex();
    }

    async decrease() {
        await this.mutex.acquire();
        this.remainingBatchSize -= 1;
        this.mutex.release();
    }

    async increase() {
        await this.mutex.acquire();
        this.remainingBatchSize += 1;
        this.mutex.release();
    }

    async get() {
        await this.mutex.acquire();
        const remainingBatchSize = this.remainingBatchSize;
        this.mutex.release();
        return remainingBatchSize;
    }
}

export class MessageRelayer<Tx extends TransactionContext> extends BatchJob {
    private BATCH_SIZE: number; // Dead letter batch size == Message batch size
    private _channelRegistry: ChannelRegistryForMessageRelay<Tx>;
    private _messageRelayerMutex: Mutex;

    constructor(batchSize: number, channelRegistry: ChannelRegistryForMessageRelay<Tx>) {
        super();
        this._channelRegistry = channelRegistry;
        this._messageRelayerMutex = new Mutex();
        this.BATCH_SIZE = batchSize;
    }

    public async execute(): Promise<void> {
        try {
            await this._messageRelayerMutex.acquire();
            await this.relayAndSave();
        } catch (e) {
            console.error(e);
        } finally {
            this._messageRelayerMutex.release();
        }
    }

    private async relayAndSave(): Promise<void> {
        const remainingBatchSize = new RemainingBatchSize(this.BATCH_SIZE);

        var { messagesSuccessfullyPublished } = await this.publishMessages(
            remainingBatchSize,
            true, // get batch from dead letters first
        );

        for (const channelName of messagesSuccessfullyPublished.keys()) {
            const channel = await this._channelRegistry.getChannelByName(channelName);
            const messagesToDelete = messagesSuccessfullyPublished.get(channelName);
            await this.deleteDeadLetters(channel, messagesToDelete);
        }

        if ((await remainingBatchSize.get()) <= 0) {
            return;
        }

        var { messagesFailedToPublish, messagesSuccessfullyPublished } = await this.publishMessages(
            remainingBatchSize,
            false, // get batch from outbox
        );

        for (const channelName of messagesFailedToPublish.keys()) {
            const channel = await this._channelRegistry.getChannelByName(channelName);
            const messages = messagesFailedToPublish.get(channelName);
            await this.deleteMessagesFromOutbox(channel, messages);
            await this.saveDeadLetters(channel, messages);
        }

        for (const channelName of messagesSuccessfullyPublished.keys()) {
            const channel = await this._channelRegistry.getChannelByName(channelName);
            const messagesToDelete = messagesSuccessfullyPublished.get(channelName);
            await this.deleteMessagesFromOutbox(channel, messagesToDelete);
        }
    }

    @Transactional(Propagation.REQUIRES_NEW)
    private async saveDeadLetters<M extends endpoint.AbstractSagaMessage>(
        channel: ChannelFromMessageRelay<M, Tx>,
        deadLetters: M[],
    ) {
        await channel.getRepository().saveDeadLetters(deadLetters);
    }

    private async deleteMessagesFromOutbox<M extends endpoint.AbstractSagaMessage>(
        channel: ChannelFromMessageRelay<M, Tx>,
        messages: M[],
    ) {
        for (const message of messages) {
            await channel.getRepository().deleteMessage(message.getId());
        }
    }

    @Transactional(Propagation.REQUIRES_NEW)
    private async deleteSingleMessage<M extends endpoint.AbstractSagaMessage>(
        channel: ChannelFromMessageRelay<M, Tx>,
        message: M,
    ) {
        await channel.getRepository().deleteMessage(message.getId());
    }

    @Transactional(Propagation.REQUIRES_NEW)
    private async deleteDeadLetters<M extends endpoint.AbstractSagaMessage>(
        channel: ChannelFromMessageRelay<M, Tx>,
        deadLetters: M[],
    ) {
        // 이거 한꺼번에 지우는건 좀 위험할 수도 있음
        // 메모리에 올라가는 메시지가 많아지면 문제가 생길 수 있고,
        // 트랜잭션 시 한번에 업데이트하는 양이 많아지면 또한 문제가 생길 수 있음
        await channel.getRepository().deleteDeadLetters(deadLetters.map((message) => message.getId()));
    }

    private async publishMessages(
        batchSize: RemainingBatchSize,
        fromDeadLetters?: boolean,
    ): Promise<{
        messagesFailedToPublish: Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>;
        messagesSuccessfullyPublished: Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>;
    }> {
        const assignedBatchSize = await batchSize.get();
        const messagesFailedToPublish = new Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>();
        const messagesSuccessfullyPublished = new Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>();
        const messagesFailedToPublishMutex = new Mutex();
        const messagesSuccessfullyPublishedMutex = new Mutex();

        const messagesByChannel = await this.getRelayingMessages(assignedBatchSize, fromDeadLetters);

        for (let channelName of messagesByChannel.keys()) {
            messagesFailedToPublish.set(channelName, []);
            messagesSuccessfullyPublished.set(channelName, []);
            const messages = messagesByChannel.get(channelName);

            await Promise.all(
                messages.map(async (message) => {
                    await this.sendMessageToChannel(
                        channelName,
                        message.getSagaMessage(),
                        messagesSuccessfullyPublished,
                        messagesFailedToPublish,
                        messagesSuccessfullyPublishedMutex,
                        messagesFailedToPublishMutex,
                        batchSize.decrease.bind(batchSize), // decrease remaining batch size
                    );
                }),
            );
        }

        return {
            messagesFailedToPublish,
            messagesSuccessfullyPublished,
        };
    }

    private async sendMessageToChannel(
        channelName: endpoint.ChannelName,
        message: endpoint.AbstractSagaMessage,
        successfulMessages: Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>,
        failedMessages: Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>,
        successfulMessagesMutex: Mutex,
        failedMessagesMutex: Mutex,
        callback?: () => Promise<void>,
    ) {
        const channel = await this._channelRegistry.getChannelByName(channelName);

        try {
            await channel.send(message);
            await this.pushToResultMap(channelName, successfulMessages, successfulMessagesMutex, message);
        } catch (e) {
            console.error(e); // this should be sent to a logger
            await this.pushToResultMap(channelName, failedMessages, failedMessagesMutex, message);
        }

        if (callback) {
            await callback();
        }
    }

    private async pushToResultMap(
        channelName: endpoint.ChannelName,
        map: Map<endpoint.ChannelName, endpoint.AbstractSagaMessage[]>,
        mapMutex: Mutex,
        message: endpoint.AbstractSagaMessage,
    ) {
        await mapMutex.acquire();
        try {
            if (!map.has(channelName)) {
                map.set(channelName, []);
            }

            map.get(channelName).push(message);
        } finally {
            mapMutex.release();
        }
    }

    private async getRelayingMessages(
        batchSize: number,
        fromDeadLetters?: boolean,
    ): Promise<Map<endpoint.ChannelName, endpoint.AbstractSagaMessageWithOrigin<endpoint.AbstractSagaMessage>[]>> {
        if (batchSize <= 0) {
            throw new Error('Batch size must be greater than 0');
        }

        const messagesByChannel: Map<
            endpoint.ChannelName,
            endpoint.AbstractSagaMessageWithOrigin<endpoint.AbstractSagaMessage>[]
        > = new Map();

        for (const channel of await this._channelRegistry.getChannels()) {
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
