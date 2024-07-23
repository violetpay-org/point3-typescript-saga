import { AbstractSagaMessage } from "./CommandEndpoint";
import { AbstractSagaMessageWithOrigin } from "./CommandEndpoint";

export type ChannelName = string;

export interface Channel<C extends AbstractSagaMessage> {
    send(command: AbstractSagaMessage): Promise<void>;
    getChannelName(): ChannelName;
    parseMessageWithOrigin(message: C): AbstractSagaMessageWithOrigin<C>;
}

export abstract class AbstractChannel<C extends AbstractSagaMessage> implements Channel<C> {
    abstract send(command: AbstractSagaMessage): Promise<void>;
    abstract getChannelName(): ChannelName;

    public parseMessageWithOrigin(message: C): AbstractSagaMessageWithOrigin<C> {
        return new MessageWithOrigin(this.getChannelName(), message);
    }
}

class MessageWithOrigin<M extends AbstractSagaMessage> implements AbstractSagaMessageWithOrigin<M> {
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

