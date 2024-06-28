import { TxContext } from "../../UnitOfWork/main";
import * as endpoint from "../Endpoint/index";

export class ChannelRegistry<Tx extends TxContext> {
    protected channels: Map<
        endpoint.ChannelName, 
        endpoint.SavableMessageChannel<Tx>
    >;

    constructor() {
        this.channels = new Map();
    }

    public registerChannel(
        channel: endpoint.SavableMessageChannel<Tx>
    ) {
        if (this.hasChannelWithName(channel.getChannelName())) {
            throw new Error(`Channel with name ${channel.getChannelName()} already exists`);
        }

        this.channels.set(channel.getChannelName(), channel);
    }

    public hasChannelWithName(channelName: endpoint.ChannelName): boolean {
        return this.channels.has(channelName);
    }

    public getChannelByName(channelName: endpoint.ChannelName): endpoint.SavableMessageChannel<Tx> {
        if (!this.hasChannelWithName(channelName)) {
            throw new Error(`Channel with name ${channelName} does not exist`);
        }

        return this.channels.get(channelName);
    }

    public getChannels(): endpoint.SavableMessageChannel<Tx>[] {
        return Array.from(this.channels.values());
    }
}

