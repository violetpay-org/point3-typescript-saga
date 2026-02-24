"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryResponseRepository = exports.InMemoryCommandRepository = void 0;
const crypto_1 = require("crypto");
class InMemoryCommandRepository {
    constructor() {
        this._commands = new Map();
        this._deadLetters = new Map();
        this._outbox = new Map();
    }
    saveMessage(command) {
        return async (tx) => {
            this._outbox.set((0, crypto_1.randomUUID)(), command);
        };
    }
    saveDeadLetters(commands) {
        throw new Error('Method not implemented.');
    }
    deleteMessage(messageId) {
        throw new Error('Method not implemented.');
    }
    deleteDeadLetters(messageIds) {
        throw new Error('Method not implemented.');
    }
    getMessagesFromOutbox(batchSize) {
        throw new Error('Method not implemented.');
    }
    getMessagesFromDeadLetter(batchSize) {
        throw new Error('Method not implemented.');
    }
    getCommands() {
        return this._outbox.values();
    }
    getCommandsAsMap() {
        return this._outbox;
    }
}
exports.InMemoryCommandRepository = InMemoryCommandRepository;
class InMemoryResponseRepository {
    constructor() {
        this._outbox = new Map();
    }
    saveMessage(response) {
        return async (tx) => {
            this._outbox.set((0, crypto_1.randomUUID)(), response);
        };
    }
    saveDeadLetters(responseRecords) {
        throw new Error('Method not implemented.');
    }
    deleteMessage(messageId) {
        throw new Error('Method not implemented.');
    }
    deleteDeadLetters(messageIds) {
        throw new Error('Method not implemented.');
    }
    getMessagesFromOutbox(batchSize) {
        throw new Error('Method not implemented.');
    }
    ;
    getMessagesFromDeadLetter(batchSize) {
        throw new Error('Method not implemented.');
    }
    getCommands() {
        return this._outbox.values();
    }
    getCommandsAsMap() {
        return this._outbox;
    }
}
exports.InMemoryResponseRepository = InMemoryResponseRepository;
//# sourceMappingURL=repository.js.map