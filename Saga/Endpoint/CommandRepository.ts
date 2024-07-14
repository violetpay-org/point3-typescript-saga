import { Executable, TxContext } from "../../UnitOfWork/main";
import { AbstractSagaMessage, Command, CommandArguments, Response } from "./CommandEndpoint";
import * as saga from "../SagaSession/index";
import { uowMemory } from "index";

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

export class MemoryCommandRepository<C extends Command<saga.SagaSession, CommandArguments>> 
    implements CommandRepository<C, uowMemory.InMemoryTxContext> 
{
    private _commands = new Map<string, C>();
    private _deadLetters = new Map<string, C>();

    saveMessage(command: C): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // save message
            this._commands.set(command.getId(), command);
            return;
        }
    }

    saveDeadLetters(commands: C[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // save dead letters
            commands.forEach(command => {
                this._deadLetters.set(command.getId(), command);
            });
            return;
        }
    }

    deleteMessage(messageId: string): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // delete message
            this._commands.delete(messageId);
            return;
        }
    }

    deleteDeadLetters(messageIds: string[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // delete dead letters
            messageIds.forEach(messageId => {
                this._deadLetters.delete(messageId);
            });
            return;
        }
    }

    getMessagesFromOutbox(batchSize: number): Promise<C[]> {
        const commands = Array.from(this._commands.values()).slice(0, batchSize);
        return Promise.resolve(commands);
    }

    getMessagesFromDeadLetter(batchSize: number): Promise<C[]> {
        const commands = Array.from(this._deadLetters.values()).slice(0, batchSize);
        return Promise.resolve(commands);
    }
}

export class MemoryResponseRepository<R extends Response> 
    implements ResponseRepository<R, uowMemory.InMemoryTxContext> 
{
    private _responses = new Map<string, R>();
    private _deadLetters = new Map<string, R>();

    saveMessage(response: R): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // save message
            this._responses.set(response.getId(), response);
            return;
        }
    }

    saveDeadLetters(responseRecords: R[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // save dead letters
            responseRecords.forEach(response => {
                this._deadLetters.set(response.getId(), response);
            });
            return;
        }
    }

    deleteMessage(messageId: string): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // delete message
            this._responses.delete(messageId);
            return;
        }
    }

    deleteDeadLetters(messageIds: string[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            // delete dead letters
            messageIds.forEach(messageId => {
                this._deadLetters.delete(messageId);
            });
            return;
        }
    }

    getMessagesFromOutbox(batchSize: number): Promise<R[]> {
        const responses = Array.from(this._responses.values()).slice(0, batchSize);
        return Promise.resolve(responses);
    }

    getMessagesFromDeadLetter(batchSize: number): Promise<R[]> {
        const responses = Array.from(this._deadLetters.values()).slice(0, batchSize);
        return Promise.resolve(responses);
    }
}