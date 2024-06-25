import { TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { channel, endpoint } from "../Endpoint";
import { session } from "../SagaSession";

export class ChannelRegistry<Tx extends TxContext> {
    protected channels: Map<
        channel.ChannelName, 
        channel.SavableCommandChannel<endpoint.Command<session.SagaSession>, Tx>
    >;

    public registerChannel(
        channel: channel.SavableCommandChannel<endpoint.Command<session.SagaSession>, Tx>
    ) {
        if (this.hasChannelWithName(channel.getChannelName())) {
            throw new Error(`Channel with name ${channel.getChannelName()} already exists`);
        }

        this.channels.set(channel.getChannelName(), channel);
    }

    public hasChannelWithName(channelName: channel.ChannelName): boolean {
        return this.channels.has(channelName);
    }

    public getChannelByName(channelName: channel.ChannelName): channel.SavableCommandChannel<endpoint.Command<session.SagaSession>, Tx> {
        if (!this.hasChannelWithName(channelName)) {
            throw new Error(`Channel with name ${channelName} does not exist`);
        }

        return this.channels.get(channelName);
    }

    public getChannels(): channel.SavableCommandChannel<endpoint.Command<session.SagaSession>, Tx>[] {
        return Array.from(this.channels.values());
    }
}

