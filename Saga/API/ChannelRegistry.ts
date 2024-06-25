import { TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import * as endpoint from "../Endpoint/index";
import * as saga from "../SagaSession/index";

export class ChannelRegistry<Tx extends TxContext> {
    protected channels: Map<
        endpoint.ChannelName, 
        endpoint.SavableCommandChannel<endpoint.Command<saga.SagaSession>, Tx>
    >;

    public registerChannel(
        channel: endpoint.SavableCommandChannel<endpoint.Command<saga.SagaSession>, Tx>
    ) {
        if (this.hasChannelWithName(channel.getChannelName())) {
            throw new Error(`Channel with name ${channel.getChannelName()} already exists`);
        }

        this.channels.set(channel.getChannelName(), channel);
    }

    public hasChannelWithName(channelName: endpoint.ChannelName): boolean {
        return this.channels.has(channelName);
    }

    public getChannelByName(channelName: endpoint.ChannelName): endpoint.SavableCommandChannel<endpoint.Command<saga.SagaSession>, Tx> {
        if (!this.hasChannelWithName(channelName)) {
            throw new Error(`Channel with name ${channelName} does not exist`);
        }

        return this.channels.get(channelName);
    }

    public getChannels(): endpoint.SavableCommandChannel<endpoint.Command<saga.SagaSession>, Tx>[] {
        return Array.from(this.channels.values());
    }
}

