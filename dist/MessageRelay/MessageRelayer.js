"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageRelayer = void 0;
const async_mutex_1 = require("async-mutex");
const BatchJob_1 = require("./BatchJob");
class RemainingBatchSize {
    constructor(initialBatchSize) {
        this.remainingBatchSize = initialBatchSize;
        this.mutex = new async_mutex_1.Mutex();
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
class MessageRelayer extends BatchJob_1.BatchJob {
    constructor(batchSize, channelRegistry, unitOfWorkFactory) {
        super();
        this._unitOfWorkFactory = unitOfWorkFactory;
        this._channelRegistry = channelRegistry;
        this._messageRelayerMutex = new async_mutex_1.Mutex();
        this.BATCH_SIZE = batchSize;
    }
    async execute() {
        try {
            await this._messageRelayerMutex.acquire();
            await this.relayAndSave();
        }
        catch (e) {
            console.error(e);
        }
        finally {
            this._messageRelayerMutex.release();
        }
    }
    async relayAndSave() {
        const remainingBatchSize = new RemainingBatchSize(this.BATCH_SIZE);
        var { messagesSuccessfullyPublished } = await this.publishMessages(remainingBatchSize, true);
        for (const channelName of messagesSuccessfullyPublished.keys()) {
            const channel = await this._channelRegistry.getChannelByName(channelName);
            const messagesToDelete = messagesSuccessfullyPublished.get(channelName);
            await this.deleteDeadLetters(channel, messagesToDelete);
        }
        if ((await remainingBatchSize.get()) <= 0) {
            return;
        }
        var { messagesFailedToPublish, messagesSuccessfullyPublished } = await this.publishMessages(remainingBatchSize, false);
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
    async saveDeadLetters(channel, deadLetters) {
        const unitOfWork = this._unitOfWorkFactory();
        const deadLetterSaver = channel.getRepository().saveDeadLetters(deadLetters);
        unitOfWork.addToWork(deadLetterSaver);
        await unitOfWork.Commit();
    }
    async deleteMessagesFromOutbox(channel, messages) {
        for (const message of messages) {
            const unitOfWork = this._unitOfWorkFactory();
            const deleter = channel.getRepository().deleteMessage(message.getId());
            unitOfWork.addToWork(deleter);
            await unitOfWork.Commit();
        }
    }
    async deleteDeadLetters(channel, deadLetters) {
        const unitOfWork = this._unitOfWorkFactory();
        const deadLettersDeleter = channel
            .getRepository()
            .deleteDeadLetters(deadLetters.map((message) => message.getId()));
        unitOfWork.addToWork(deadLettersDeleter);
        await unitOfWork.Commit();
    }
    async publishMessages(batchSize, fromDeadLetters) {
        const assignedBatchSize = await batchSize.get();
        const messagesFailedToPublish = new Map();
        const messagesSuccessfullyPublished = new Map();
        const messagesFailedToPublishMutex = new async_mutex_1.Mutex();
        const messagesSuccessfullyPublishedMutex = new async_mutex_1.Mutex();
        const messagesByChannel = await this.getRelayingMessages(assignedBatchSize, fromDeadLetters);
        for (let channelName of messagesByChannel.keys()) {
            messagesFailedToPublish.set(channelName, []);
            messagesSuccessfullyPublished.set(channelName, []);
            const messages = messagesByChannel.get(channelName);
            await Promise.all(messages.map(async (message) => {
                await this.sendMessageToChannel(channelName, message.getSagaMessage(), messagesSuccessfullyPublished, messagesFailedToPublish, messagesSuccessfullyPublishedMutex, messagesFailedToPublishMutex, batchSize.decrease.bind(batchSize));
            }));
        }
        return {
            messagesFailedToPublish,
            messagesSuccessfullyPublished,
        };
    }
    async sendMessageToChannel(channelName, message, successfulMessages, failedMessages, successfulMessagesMutex, failedMessagesMutex, callback) {
        const channel = await this._channelRegistry.getChannelByName(channelName);
        try {
            await channel.send(message);
            await this.pushToResultMap(channelName, successfulMessages, successfulMessagesMutex, message);
        }
        catch (e) {
            console.error(e);
            await this.pushToResultMap(channelName, failedMessages, failedMessagesMutex, message);
        }
        if (callback) {
            await callback();
        }
    }
    async pushToResultMap(channelName, map, mapMutex, message) {
        await mapMutex.acquire();
        try {
            if (!map.has(channelName)) {
                map.set(channelName, []);
            }
            map.get(channelName).push(message);
        }
        finally {
            mapMutex.release();
        }
    }
    async getRelayingMessages(batchSize, fromDeadLetters) {
        if (batchSize <= 0) {
            throw new Error('Batch size must be greater than 0');
        }
        const messagesByChannel = new Map();
        for (const channel of await this._channelRegistry.getChannels()) {
            const messageRepo = channel.getRepository();
            var messages = [];
            if (fromDeadLetters) {
                messages = await messageRepo.getMessagesFromDeadLetter(batchSize);
            }
            else {
                messages = await messageRepo.getMessagesFromOutbox(batchSize);
            }
            const messagesWithOrigin = [];
            for (const message of messages) {
                const messageWithOrigin = channel.parseMessageWithOrigin(message);
                messagesWithOrigin.push(messageWithOrigin);
            }
            messagesByChannel.set(channel.getChannelName(), messagesWithOrigin);
        }
        return messagesByChannel;
    }
}
exports.MessageRelayer = MessageRelayer;
//# sourceMappingURL=MessageRelayer.js.map