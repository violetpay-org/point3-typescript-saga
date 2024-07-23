import { Executable, TxContext } from "../../UnitOfWork/main";
import { AbstractSagaMessage, Command, CommandArguments, Response } from "./CommandEndpoint";
import * as saga from "../SagaSession/index";
import * as uowMemory from "../../UnitOfWork/inMemory";
import { Mutex } from "async-mutex";

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
    private _commandMutex = new Mutex();
    private _deadLetterMutex = new Mutex();

    saveMessage(command: C): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._commandMutex.acquire();
            // save message
            this._commands.set(command.getId(), command);
            this._commandMutex.release();
            return;
        }
    }

    saveDeadLetters(commands: C[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._deadLetterMutex.acquire();
            // save dead letters
            commands.forEach(command => {
                this._deadLetters.set(command.getId(), command);
            });
            this._deadLetterMutex.release();
            return;
        }
    }

    deleteMessage(messageId: string): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._commandMutex.acquire();
            // delete message
            this._commands.delete(messageId);
            this._commandMutex.release();
            return;
        }
    }

    deleteDeadLetters(messageIds: string[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._deadLetterMutex.acquire();
            // delete dead letters
            messageIds.forEach(messageId => {
                this._deadLetters.delete(messageId);
            });
            this._deadLetterMutex.release();
            return;
        }
    }

    async getMessagesFromOutbox(batchSize: number): Promise<C[]> {
        await this._commandMutex.acquire();
        const commands = Array.from(this._commands.values()).slice(0, batchSize);
        this._commandMutex.release();
        return commands;
    }

    async getMessagesFromDeadLetter(batchSize: number): Promise<C[]> {
        await this._deadLetterMutex.acquire();
        const commands = Array.from(this._deadLetters.values()).slice(0, batchSize);
        this._deadLetterMutex.release();
        return commands;
    }
}

export class MemoryResponseRepository<R extends Response> 
    implements ResponseRepository<R, uowMemory.InMemoryTxContext> 
{
    private _responses = new Map<string, R>();
    private _deadLetters = new Map<string, R>();
    private _responseMutex = new Mutex();
    private _deadLetterMutex = new Mutex();

    saveMessage(response: R): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._responseMutex.acquire();
            // save message
            this._responses.set(response.getId(), response);
            this._responseMutex.release();
            return;
        }
    }

    saveDeadLetters(responseRecords: R[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._deadLetterMutex.acquire();
            // save dead letters
            responseRecords.forEach(response => {
                this._deadLetters.set(response.getId(), response);
            });
            this._deadLetterMutex.release();
            return;
        }
    }

    deleteMessage(messageId: string): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._responseMutex.acquire();
            // delete message
            this._responses.delete(messageId);
            this._responseMutex.release();
            return;
        }
    }

    deleteDeadLetters(messageIds: string[]): Executable<uowMemory.InMemoryTxContext> {
        return async (tx: uowMemory.InMemoryTxContext) => {
            await this._deadLetterMutex.acquire();
            // delete dead letters
            messageIds.forEach(messageId => {
                this._deadLetters.delete(messageId);
            });
            this._deadLetterMutex.release();
            return;
        }
    }

    async getMessagesFromOutbox(batchSize: number): Promise<R[]> {
        await this._responseMutex.acquire();
        const responses = Array.from(this._responses.values()).slice(0, batchSize);
        this._responseMutex.release();
        return responses;
    }

    async getMessagesFromDeadLetter(batchSize: number): Promise<R[]> {
        await this._deadLetterMutex.acquire();
        const responses = Array.from(this._deadLetters.values()).slice(0, batchSize);
        this._deadLetterMutex.release();
        return responses;
    }
}