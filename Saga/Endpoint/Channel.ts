import { Command } from "./CommandEndpoint";

export type ChannelName = string;

export abstract class Channel<C extends Command> {
    private _channelName: ChannelName;

    abstract send(command: C): void;

    public getChannelName(): ChannelName {
        return this._channelName;
    }
}