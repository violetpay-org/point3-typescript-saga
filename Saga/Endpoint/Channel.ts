import { endpoint } from ".";
import { AbstractSagaMessageWithOrigin, Command } from "./CommandEndpoint";

export type ChannelName = string;

export abstract class Channel<C extends Command> {
    abstract send(command: C): void;
    abstract getChannelName(): ChannelName;

    public parseMessageWithOrigin(message: C): endpoint.AbstractSagaMessageWithOrigin<C> {
        return new MessageWithOrigin(this.getChannelName(), message);
    }
}

class MessageWithOrigin<M extends Command> implements AbstractSagaMessageWithOrigin<M> {
    private origin: ChannelName;
    private message: M;

    constructor(origin: ChannelName, message: M) {
        this.origin = origin;
        this.message = message;
    }

    getOrigin(): ChannelName {
        return this.origin;
    }

    getSagaMessage(): M {
        return this.message;
    }
}