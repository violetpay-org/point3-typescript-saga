import { randomUUID } from 'crypto';
import * as point3Saga from '../Saga/index'
import { Executable, TxContext } from '../UnitOfWork/main';

export class InMemoryExampleMessageRepository<M extends point3Saga.endpoint.Command<point3Saga.saga.SagaSession>> implements point3Saga.endpoint.CommandRepository<M, TxContext> {
    private readonly _commands: Map<string, M> = new Map();
    private readonly _deadLetters: Map<string, M> = new Map();
    private readonly _outbox: Map<string, M> = new Map();

    saveCommand(command: M): Executable<TxContext> {
        return async (tx: TxContext) => {
            this._outbox.set(randomUUID(), command)
        }
    }

    saveDeadLetters(command: M[]): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    deleteCommands(commands: M[]): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    deleteDeadLetters(commands: M[]): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    getCommandsFromOutbox(batchSize: number): Promise<M[]> {
        throw new Error('Method not implemented.');
    }

    getCommandsFromDeadLetter(batchSize: number): Promise<M[]> {
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