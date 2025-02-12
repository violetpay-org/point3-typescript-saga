import { AbstractSagaMessage, Command, CommandArguments, Response } from './CommandEndpoint';
import * as saga from '../SagaSession/index';
import { Mutex } from 'async-mutex';
import { PlatformTransactionManager, Transactional, TransactionContext } from '@tranjs/core';

export class InMemoryTransactionContext implements TransactionContext {
    constructor() {}

    execute(query: string, params?: any[]): Promise<any> {
        return Promise.resolve();
    }
}

export class InMemoryTransactionManager extends PlatformTransactionManager<InMemoryTransactionContext> {
    constructor() {
        super();
    }

    protected async beginTransaction(): Promise<InMemoryTransactionContext> {
        console.log('begin transaction');
        return new InMemoryTransactionContext();
    }
    protected async commitTransaction(tx: InMemoryTransactionContext): Promise<void> {
        console.log('commit transaction');
    }
    protected async rollbackTransaction(tx: InMemoryTransactionContext): Promise<void> {
        console.log('rollback transaction');
    }
}

export interface AbstractMessageRepository<M extends AbstractSagaMessage, Tx extends TransactionContext> {
    saveMessage(message: M): Promise<void>;
    saveDeadLetters(messages: M[]): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
    deleteDeadLetters(messageIds: string[]): Promise<void>;
    getMessagesFromOutbox(batchSize: number): Promise<M[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<M[]>;
}

export interface CommandRepository<C extends Command<saga.SagaSession, CommandArguments>, Tx extends TransactionContext>
    extends AbstractMessageRepository<C, Tx> {
    saveMessage(command: C): Promise<void>;
    saveDeadLetters(commands: C[]): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
    deleteDeadLetters(messageIds: string[]): Promise<void>;
    getMessagesFromOutbox(batchSize: number): Promise<C[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<C[]>;
}

export interface ResponseRepository<R extends Response, Tx extends TransactionContext>
    extends AbstractMessageRepository<R, Tx> {
    saveMessage(response: R): Promise<void>;
    saveDeadLetters(responseRecords: R[]): Promise<void>;
    deleteMessage(messageId: string): Promise<void>;
    deleteDeadLetters(messageIds: string[]): Promise<void>;
    getMessagesFromOutbox(batchSize: number): Promise<R[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<R[]>;
}

export class MemoryCommandRepository<C extends Command<saga.SagaSession, CommandArguments>>
    implements CommandRepository<C, InMemoryTransactionContext>
{
    private _commands = new Map<string, C>();
    private _deadLetters = new Map<string, C>();
    private _commandMutex = new Mutex();
    private _deadLetterMutex = new Mutex();

    @Transactional()
    async saveMessage(command: C): Promise<void> {
        await this._commandMutex.acquire();
        // save message
        this._commands.set(command.getId(), command);
        this._commandMutex.release();
        return;
    }

    @Transactional()
    async saveDeadLetters(commands: C[]): Promise<void> {
        await this._deadLetterMutex.acquire();
        // save dead letters
        commands.forEach((command) => {
            this._deadLetters.set(command.getId(), command);
        });
        this._deadLetterMutex.release();
        return;
    }

    @Transactional()
    async deleteMessage(messageId: string): Promise<void> {
        await this._commandMutex.acquire();
        // delete message
        this._commands.delete(messageId);
        this._commandMutex.release();
        return;
    }

    @Transactional()
    async deleteDeadLetters(messageIds: string[]): Promise<void> {
        await this._deadLetterMutex.acquire();
        // delete dead letters
        messageIds.forEach((messageId) => {
            this._deadLetters.delete(messageId);
        });
        this._deadLetterMutex.release();
        return;
    }

    @Transactional()
    async getMessagesFromOutbox(batchSize: number): Promise<C[]> {
        await this._commandMutex.acquire();
        const commands = Array.from(this._commands.values()).slice(0, batchSize);
        this._commandMutex.release();
        return commands;
    }

    @Transactional()
    async getMessagesFromDeadLetter(batchSize: number): Promise<C[]> {
        await this._deadLetterMutex.acquire();
        const commands = Array.from(this._deadLetters.values()).slice(0, batchSize);
        this._deadLetterMutex.release();
        return commands;
    }
}

export class MemoryResponseRepository<R extends Response> implements ResponseRepository<R, InMemoryTransactionContext> {
    private _responses = new Map<string, R>();
    private _deadLetters = new Map<string, R>();
    private _responseMutex = new Mutex();
    private _deadLetterMutex = new Mutex();

    @Transactional()
    async saveMessage(response: R): Promise<void> {
        await this._responseMutex.acquire();
        // save message
        this._responses.set(response.getId(), response);
        this._responseMutex.release();
        return;
    }

    @Transactional()
    async saveDeadLetters(responseRecords: R[]): Promise<void> {
        await this._deadLetterMutex.acquire();
        // save dead letters
        responseRecords.forEach((response) => {
            this._deadLetters.set(response.getId(), response);
        });
        this._deadLetterMutex.release();
        return;
    }

    @Transactional()
    async deleteMessage(messageId: string): Promise<void> {
        await this._responseMutex.acquire();
        // delete message
        this._responses.delete(messageId);
        this._responseMutex.release();
        return;
    }

    @Transactional()
    async deleteDeadLetters(messageIds: string[]): Promise<void> {
        await this._deadLetterMutex.acquire();
        // delete dead letters
        messageIds.forEach((messageId) => {
            this._deadLetters.delete(messageId);
        });
        this._deadLetterMutex.release();
        return;
    }

    @Transactional()
    async getMessagesFromOutbox(batchSize: number): Promise<R[]> {
        await this._responseMutex.acquire();
        const responses = Array.from(this._responses.values()).slice(0, batchSize);
        this._responseMutex.release();
        return responses;
    }

    @Transactional()
    async getMessagesFromDeadLetter(batchSize: number): Promise<R[]> {
        await this._deadLetterMutex.acquire();
        const responses = Array.from(this._deadLetters.values()).slice(0, batchSize);
        this._deadLetterMutex.release();
        return responses;
    }
}
