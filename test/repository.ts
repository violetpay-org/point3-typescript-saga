import { randomUUID } from 'crypto';
import { endpoint, saga } from '../Saga/index'
import { Executable, TxContext } from '../UnitOfWork/main';

export class InMemoryCommandRepository<
    M extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>
> implements endpoint.CommandRepository<M, TxContext> {
    private readonly _commands: Map<string, M> = new Map();
    private readonly _deadLetters: Map<string, M> = new Map();
    private readonly _outbox: Map<string, M> = new Map();

    saveMessage(command: M): Executable<TxContext> {
        return async (tx: TxContext) => {
            this._outbox.set(randomUUID(), command)
        }
    }

    saveDeadLetters(commands: M[]): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    deleteMessage(messageId: string): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    deleteDeadLetters(messageIds: string[]): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    getMessagesFromOutbox(batchSize: number): Promise<M[]> {
        throw new Error('Method not implemented.');
    }

    getMessagesFromDeadLetter(batchSize: number): Promise<M[]> {
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

export class InMemoryResponseRepository<
    M extends endpoint.Response
> implements endpoint.ResponseRepository<M, TxContext> {
    private readonly _outbox: Map<string, M> = new Map();

    saveMessage(response: M): Executable<TxContext> {
        return async (tx: TxContext) => {
            this._outbox.set(randomUUID(), response);
        }
    }

    saveDeadLetters(responseRecords: M[]): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    deleteMessage(messageId: string): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    deleteDeadLetters(messageIds: string[]): Executable<TxContext> {
        throw new Error('Method not implemented.');
    }

    getMessagesFromOutbox(batchSize: number): Promise<M[]> {
        throw new Error('Method not implemented.');
    };

    // For testing purposes only
    getCommands(): IterableIterator<M> {
        return this._outbox.values();
    }
    getCommandsAsMap(): Map<string, M> {
        return this._outbox;
    }
}