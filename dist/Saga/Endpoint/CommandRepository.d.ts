import { Executable, TxContext } from "../../UnitOfWork/main";
import { AbstractSagaMessage, Command, CommandArguments, Response } from "./CommandEndpoint";
import * as saga from "../SagaSession/index";
import * as uowMemory from "../../UnitOfWork/memory";
export interface AbstractMessageRepository<M extends AbstractSagaMessage, Tx extends TxContext> {
    saveMessage(message: M): Executable<Tx>;
    saveDeadLetters(messages: M[]): Executable<Tx>;
    deleteMessage(messageId: string): Executable<Tx>;
    deleteDeadLetters(messageIds: string[]): Executable<Tx>;
    getMessagesFromOutbox(batchSize: number): Promise<M[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<M[]>;
}
export interface CommandRepository<C extends Command<saga.SagaSession, CommandArguments>, Tx extends TxContext> extends AbstractMessageRepository<C, Tx> {
    saveMessage(command: C): Executable<Tx>;
    saveDeadLetters(commands: C[]): Executable<Tx>;
    deleteMessage(messageId: string): Executable<Tx>;
    deleteDeadLetters(messageIds: string[]): Executable<Tx>;
    getMessagesFromOutbox(batchSize: number): Promise<C[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<C[]>;
}
export interface ResponseRepository<R extends Response, Tx extends TxContext> extends AbstractMessageRepository<R, Tx> {
    saveMessage(response: R): Executable<Tx>;
    saveDeadLetters(responseRecords: R[]): Executable<Tx>;
    deleteMessage(messageId: string): Executable<Tx>;
    deleteDeadLetters(messageIds: string[]): Executable<Tx>;
    getMessagesFromOutbox(batchSize: number): Promise<R[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<R[]>;
}
export declare class MemoryCommandRepository<C extends Command<saga.SagaSession, CommandArguments>> implements CommandRepository<C, uowMemory.InMemoryTxContext> {
    private _commands;
    private _deadLetters;
    private _commandMutex;
    private _deadLetterMutex;
    saveMessage(command: C): Executable<uowMemory.InMemoryTxContext>;
    saveDeadLetters(commands: C[]): Executable<uowMemory.InMemoryTxContext>;
    deleteMessage(messageId: string): Executable<uowMemory.InMemoryTxContext>;
    deleteDeadLetters(messageIds: string[]): Executable<uowMemory.InMemoryTxContext>;
    getMessagesFromOutbox(batchSize: number): Promise<C[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<C[]>;
}
export declare class MemoryResponseRepository<R extends Response> implements ResponseRepository<R, uowMemory.InMemoryTxContext> {
    private _responses;
    private _deadLetters;
    private _responseMutex;
    private _deadLetterMutex;
    saveMessage(response: R): Executable<uowMemory.InMemoryTxContext>;
    saveDeadLetters(responseRecords: R[]): Executable<uowMemory.InMemoryTxContext>;
    deleteMessage(messageId: string): Executable<uowMemory.InMemoryTxContext>;
    deleteDeadLetters(messageIds: string[]): Executable<uowMemory.InMemoryTxContext>;
    getMessagesFromOutbox(batchSize: number): Promise<R[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<R[]>;
}
