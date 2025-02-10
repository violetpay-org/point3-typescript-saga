import { randomUUID } from 'crypto';
import { endpoint, saga } from '../Saga/index';
import { InMemoryTransactionContext } from '../Saga/Endpoint';
import { Propagation, Transactional, TransactionContext } from '@tranjs/core';

export class InMemoryCommandRepository<M extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>>
    implements endpoint.CommandRepository<M, InMemoryTransactionContext>
{
    private readonly _commands: Map<string, M> = new Map();
    private readonly _deadLetters: Map<string, M> = new Map();
    private readonly _outbox: Map<string, M> = new Map();

    @Transactional(Propagation.MANDATORY)
    async saveMessage(command: M) {
        this._outbox.set(randomUUID(), command);
    }

    @Transactional(Propagation.MANDATORY)
    async saveDeadLetters(commands: M[]) {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async deleteMessage(messageId: string) {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async deleteDeadLetters(messageIds: string[]) {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async getMessagesFromOutbox(batchSize: number): Promise<M[]> {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async getMessagesFromDeadLetter(batchSize: number): Promise<M[]> {
        throw new Error('Method not implemented.');
    }

    // For testing purposes only
    getCommands(): IterableIterator<M> {
        return this._outbox.values();
    }
    getCommandsAsMap(): Map<string, M> {
        return this._outbox;
    }
}

export class InMemoryResponseRepository<M extends endpoint.Response>
    implements endpoint.ResponseRepository<M, TransactionContext>
{
    private readonly _outbox: Map<string, M> = new Map();

    @Transactional(Propagation.MANDATORY)
    async saveMessage(response: M) {
        this._outbox.set(randomUUID(), response);
    }

    @Transactional(Propagation.MANDATORY)
    async saveDeadLetters(responseRecords: M[]) {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async deleteMessage(messageId: string) {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async deleteDeadLetters(messageIds: string[]) {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async getMessagesFromOutbox(batchSize: number): Promise<M[]> {
        throw new Error('Method not implemented.');
    }

    @Transactional()
    async getMessagesFromDeadLetter(batchSize: number): Promise<M[]> {
        throw new Error('Method not implemented.');
    }

    // For testing purposes only
    getCommands(): IterableIterator<M> {
        return this._outbox.values();
    }
    getCommandsAsMap(): Map<string, M> {
        return this._outbox;
    }
}
