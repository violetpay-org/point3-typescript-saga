import * as endpoint from "../Endpoint/index";
export declare class ChannelRegistry {
    protected channels: Map<endpoint.ChannelName, endpoint.Channel<endpoint.AbstractSagaMessage>>;
    constructor();
    registerChannel(channel: endpoint.Channel<endpoint.AbstractSagaMessage>): void;
    hasChannelWithName(channelName: endpoint.ChannelName): boolean;
    getChannelByName(channelName: endpoint.ChannelName): endpoint.Channel<endpoint.AbstractSagaMessage>;
    getChannels(): endpoint.Channel<endpoint.AbstractSagaMessage>[];
}
