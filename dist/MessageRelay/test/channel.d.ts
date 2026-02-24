import { p3saga, uowMemory } from '../../index';
import { InMemoryCommand } from './messages';
import { ExampleSagaSession } from './session';
import { ChannelFromMessageRelay } from '../Channel';
export declare class ExampleSavableCommandChannel extends p3saga.endpoint.AbstractChannel<InMemoryCommand> implements ChannelFromMessageRelay<InMemoryCommand, uowMemory.InMemoryTxContext> {
    static readonly CHANNAL_NAME: p3saga.endpoint.ChannelName;
    private _dispatchers;
    private _repository;
    constructor(repository: p3saga.endpoint.AbstractMessageRepository<InMemoryCommand, uowMemory.InMemoryTxContext>);
    addDispatcher(dispatcher: MessageDispatcher<InMemoryCommand>): void;
    send(command: p3saga.endpoint.AbstractSagaMessage): Promise<void>;
    getChannelName(): string;
    getRepository(): p3saga.endpoint.AbstractMessageRepository<InMemoryCommand, ExampleSagaSession>;
}
export declare class MessageDispatcher<C extends p3saga.endpoint.AbstractSagaMessage> {
    private _commands;
    notice(command: C): void;
    getNumberOfCommands(): number;
    reset(): void;
}
