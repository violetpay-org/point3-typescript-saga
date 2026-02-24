"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageDispatcher = exports.ExampleSavableCommandChannel = void 0;
const index_1 = require("../../index");
class ExampleSavableCommandChannel extends index_1.p3saga.endpoint.AbstractChannel {
    constructor(repository) {
        super();
        this._dispatchers = [];
        this._repository = repository;
    }
    addDispatcher(dispatcher) {
        this._dispatchers.push(dispatcher);
    }
    send(command) {
        if (Math.random() > 0.5) {
            return Promise.reject(new Error('failed to send'));
        }
        for (let dispatcher of this._dispatchers) {
            dispatcher.notice(command);
        }
        return Promise.resolve();
    }
    getChannelName() {
        return ExampleSavableCommandChannel.CHANNAL_NAME;
    }
    getRepository() {
        return this._repository;
    }
}
exports.ExampleSavableCommandChannel = ExampleSavableCommandChannel;
ExampleSavableCommandChannel.CHANNAL_NAME = 'ExampleSavableCommandChannel';
class MessageDispatcher {
    constructor() {
        this._commands = [];
    }
    notice(command) {
        this._commands.push(command);
    }
    getNumberOfCommands() {
        return this._commands.length;
    }
    reset() {
        this._commands = [];
    }
}
exports.MessageDispatcher = MessageDispatcher;
//# sourceMappingURL=channel.js.map