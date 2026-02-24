"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseRemoteCommandChannel = exports.BaseLocalResponseChannel = exports.ChannelRegistryForMessageRelay = void 0;
const index_1 = require("../Saga/index");
const async_mutex_1 = require("async-mutex");
class ChannelRegistryForMessageRelay {
    constructor(channelRegistry) {
        this._channelRegistry = channelRegistry;
        this._channelMutex = new async_mutex_1.Mutex();
    }
    isChannelFromMessageRelay(channel) {
        return 'getRepository' in channel;
    }
    async getChannelByName(channelName) {
        await this._channelMutex.acquire();
        try {
            const channel = this._channelRegistry.getChannelByName(channelName);
            if (!this.isChannelFromMessageRelay(channel)) {
                return null;
            }
            return channel;
        }
        finally {
            this._channelMutex.release();
        }
    }
    async getChannels() {
        try {
            return this._channelRegistry.getChannels().filter(this.isChannelFromMessageRelay);
        }
        finally {
            this._channelMutex.release();
        }
    }
}
exports.ChannelRegistryForMessageRelay = ChannelRegistryForMessageRelay;
class BaseLocalResponseChannel extends index_1.api.ChannelToSagaRegistry {
    constructor(sagaRegistry, repository) {
        super(sagaRegistry);
        this._repository = repository;
    }
    getRepository() {
        return this._repository;
    }
}
exports.BaseLocalResponseChannel = BaseLocalResponseChannel;
class BaseRemoteCommandChannel extends index_1.endpoint.AbstractChannel {
    constructor(repository) {
        super();
        this._repository = repository;
    }
    getRepository() {
        return this._repository;
    }
}
exports.BaseRemoteCommandChannel = BaseRemoteCommandChannel;
//# sourceMappingURL=Channel.js.map