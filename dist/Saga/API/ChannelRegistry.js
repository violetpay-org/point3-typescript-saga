"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChannelRegistry = void 0;
class ChannelRegistry {
    constructor() {
        this.channels = new Map();
    }
    registerChannel(channel) {
        if (this.hasChannelWithName(channel.getChannelName())) {
            throw new Error(`Channel with name ${channel.getChannelName()} already exists`);
        }
        this.channels.set(channel.getChannelName(), channel);
    }
    hasChannelWithName(channelName) {
        return this.channels.has(channelName);
    }
    getChannelByName(channelName) {
        if (!this.hasChannelWithName(channelName)) {
            throw new Error(`Channel with name ${channelName} does not exist`);
        }
        return this.channels.get(channelName);
    }
    getChannels() {
        return Array.from(this.channels.values());
    }
}
exports.ChannelRegistry = ChannelRegistry;
//# sourceMappingURL=ChannelRegistry.js.map