"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemoryResponseRepository = exports.MemoryCommandRepository = void 0;
const async_mutex_1 = require("async-mutex");
class MemoryCommandRepository {
    constructor() {
        this._commands = new Map();
        this._deadLetters = new Map();
        this._commandMutex = new async_mutex_1.Mutex();
        this._deadLetterMutex = new async_mutex_1.Mutex();
    }
    saveMessage(command) {
        return async (tx) => {
            await this._commandMutex.acquire();
            this._commands.set(command.getId(), command);
            this._commandMutex.release();
            return;
        };
    }
    saveDeadLetters(commands) {
        return async (tx) => {
            await this._deadLetterMutex.acquire();
            commands.forEach(command => {
                this._deadLetters.set(command.getId(), command);
            });
            this._deadLetterMutex.release();
            return;
        };
    }
    deleteMessage(messageId) {
        return async (tx) => {
            await this._commandMutex.acquire();
            this._commands.delete(messageId);
            this._commandMutex.release();
            return;
        };
    }
    deleteDeadLetters(messageIds) {
        return async (tx) => {
            await this._deadLetterMutex.acquire();
            messageIds.forEach(messageId => {
                this._deadLetters.delete(messageId);
            });
            this._deadLetterMutex.release();
            return;
        };
    }
    async getMessagesFromOutbox(batchSize) {
        await this._commandMutex.acquire();
        const commands = Array.from(this._commands.values()).slice(0, batchSize);
        this._commandMutex.release();
        return commands;
    }
    async getMessagesFromDeadLetter(batchSize) {
        await this._deadLetterMutex.acquire();
        const commands = Array.from(this._deadLetters.values()).slice(0, batchSize);
        this._deadLetterMutex.release();
        return commands;
    }
}
exports.MemoryCommandRepository = MemoryCommandRepository;
class MemoryResponseRepository {
    constructor() {
        this._responses = new Map();
        this._deadLetters = new Map();
        this._responseMutex = new async_mutex_1.Mutex();
        this._deadLetterMutex = new async_mutex_1.Mutex();
    }
    saveMessage(response) {
        return async (tx) => {
            await this._responseMutex.acquire();
            this._responses.set(response.getId(), response);
            this._responseMutex.release();
            return;
        };
    }
    saveDeadLetters(responseRecords) {
        return async (tx) => {
            await this._deadLetterMutex.acquire();
            responseRecords.forEach(response => {
                this._deadLetters.set(response.getId(), response);
            });
            this._deadLetterMutex.release();
            return;
        };
    }
    deleteMessage(messageId) {
        return async (tx) => {
            await this._responseMutex.acquire();
            this._responses.delete(messageId);
            this._responseMutex.release();
            return;
        };
    }
    deleteDeadLetters(messageIds) {
        return async (tx) => {
            await this._deadLetterMutex.acquire();
            messageIds.forEach(messageId => {
                this._deadLetters.delete(messageId);
            });
            this._deadLetterMutex.release();
            return;
        };
    }
    async getMessagesFromOutbox(batchSize) {
        await this._responseMutex.acquire();
        const responses = Array.from(this._responses.values()).slice(0, batchSize);
        this._responseMutex.release();
        return responses;
    }
    async getMessagesFromDeadLetter(batchSize) {
        await this._deadLetterMutex.acquire();
        const responses = Array.from(this._deadLetters.values()).slice(0, batchSize);
        this._deadLetterMutex.release();
        return responses;
    }
}
exports.MemoryResponseRepository = MemoryResponseRepository;
//# sourceMappingURL=CommandRepository.js.map