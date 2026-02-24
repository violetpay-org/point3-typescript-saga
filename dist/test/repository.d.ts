import { endpoint, saga } from '../Saga/index';
import { Executable, TxContext } from '../UnitOfWork/main';
export declare class InMemoryCommandRepository<M extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>> implements endpoint.CommandRepository<M, TxContext> {
    private readonly _commands;
    private readonly _deadLetters;
    private readonly _outbox;
    saveMessage(command: M): Executable<TxContext>;
    saveDeadLetters(commands: M[]): Executable<TxContext>;
    deleteMessage(messageId: string): Executable<TxContext>;
    deleteDeadLetters(messageIds: string[]): Executable<TxContext>;
    getMessagesFromOutbox(batchSize: number): Promise<M[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<M[]>;
    getCommands(): IterableIterator<M>;
    getCommandsAsMap(): Map<string, M>;
}
export declare class InMemoryResponseRepository<M extends endpoint.Response> implements endpoint.ResponseRepository<M, TxContext> {
    private readonly _outbox;
    saveMessage(response: M): Executable<TxContext>;
    saveDeadLetters(responseRecords: M[]): Executable<TxContext>;
    deleteMessage(messageId: string): Executable<TxContext>;
    deleteDeadLetters(messageIds: string[]): Executable<TxContext>;
    getMessagesFromOutbox(batchSize: number): Promise<M[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<M[]>;
    getCommands(): IterableIterator<M>;
    getCommandsAsMap(): Map<string, M>;
}
