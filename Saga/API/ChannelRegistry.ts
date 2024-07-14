import { uow } from "index";
import { TxContext } from "../../UnitOfWork/main";
import * as endpoint from "../Endpoint/index";

export class ChannelRegistry<Tx extends TxContext> {
    protected channels: Map<
        endpoint.ChannelName, 
        endpoint.Channel<endpoint.AbstractSagaMessage>
    >;

    constructor() {
        this.channels = new Map();
    }

    public registerChannel(
        channel: endpoint.Channel<endpoint.AbstractSagaMessage>
    ) {
        if (this.hasChannelWithName(channel.getChannelName())) {
            throw new Error(`Channel with name ${channel.getChannelName()} already exists`);
        }

        this.channels.set(channel.getChannelName(), channel);
    }

    public hasChannelWithName(channelName: endpoint.ChannelName): boolean {
        return this.channels.has(channelName);
    }

    public getChannelByName(channelName: endpoint.ChannelName): endpoint.Channel<endpoint.AbstractSagaMessage> {
        if (!this.hasChannelWithName(channelName)) {
            throw new Error(`Channel with name ${channelName} does not exist`);
        }

        return this.channels.get(channelName);
    }

    public getChannels(): endpoint.Channel<endpoint.AbstractSagaMessage>[] {
        return Array.from(this.channels.values());
    }
}

