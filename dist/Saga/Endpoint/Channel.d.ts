import { AbstractSagaMessage } from "./CommandEndpoint";
import { AbstractSagaMessageWithOrigin } from "./CommandEndpoint";
export type ChannelName = string;
export interface Channel<C extends AbstractSagaMessage> {
    send(command: AbstractSagaMessage): Promise<void>;
    getChannelName(): ChannelName;
    parseMessageWithOrigin(message: C): AbstractSagaMessageWithOrigin<C>;
}
export declare abstract class AbstractChannel<C extends AbstractSagaMessage> implements Channel<C> {
    abstract send(command: AbstractSagaMessage): Promise<void>;
    abstract getChannelName(): ChannelName;
    parseMessageWithOrigin(message: C): AbstractSagaMessageWithOrigin<C>;
}
