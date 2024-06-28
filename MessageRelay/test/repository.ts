import { p3saga, uow } from "index";
import { InMemoryCommand } from "./messages";

export class InMemoryCommandRepository<Tx extends uow.TxContext> implements p3saga.endpoint.CommandRepository<
    InMemoryCommand,
    Tx
> {
    private _commands: Map<string, InMemoryCommand> = new Map();
    private _deadLetters: Map<string, InMemoryCommand> = new Map();

    saveMessage(command: InMemoryCommand): uow.Executable<Tx> {
        return async (tx: Tx) => {
            this._commands.set(command.getId(), command);
        }
    }

    saveDeadLetters(commands: InMemoryCommand[]): uow.Executable<Tx> {
        return async (tx: Tx) => {
            for (let command of commands) {
                this._deadLetters.set(command.getId(), command);
            }
        }
    }

    deleteMessage(messageId: string): uow.Executable<Tx> {
        return async (tx: Tx) => {
            this._commands.delete(messageId);
        }
    }

    deleteDeadLetters(messageIds: string[]): uow.Executable<Tx> {
        return async (tx: Tx) => {
            for (let messageId of messageIds) {
                this._deadLetters.delete(messageId);
            }
        }
    }

    getMessagesFromOutbox(batchSize: number): Promise<InMemoryCommand[]> {
        const messages = Array.from(this._commands.values())
        const messagesToReturn = messages.slice(0, batchSize);
        return Promise.resolve(messagesToReturn);
    }

    getMessagesFromDeadLetter(batchSize: number): Promise<InMemoryCommand[]> {
        const deadLetters = Array.from(this._deadLetters.values());
        const deadLettersToReturn = deadLetters.slice(0, batchSize);
        return Promise.resolve(deadLettersToReturn);
    }
}

export class InMemoryResponseRepository<Tx extends uow.TxContext> implements p3saga.endpoint.ResponseRepository<
    p3saga.endpoint.Response,
    Tx
> {
    private _responses: Map<string, p3saga.endpoint.Response> = new Map();
    private _deadLetters: Map<string, p3saga.endpoint.Response> = new Map();

    saveMessage(response: p3saga.endpoint.Response): uow.Executable<Tx> {
        return async (tx: Tx) => {
            this._responses.set(response.getId(), response);
        }
    }

    saveDeadLetters(responseRecords: p3saga.endpoint.Response[]): uow.Executable<Tx> {
        return async (tx: Tx) => {
            for (let response of responseRecords) {
                this._deadLetters.set(response.getId(), response);
            }
        }
    }

    deleteMessage(messageId: string): uow.Executable<Tx> {
        return async (tx: Tx) => {
            this._responses.delete(messageId);
        }
    }

    deleteDeadLetters(messageIds: string[]): uow.Executable<Tx> {
        return async (tx: Tx) => {
            for (let messageId of messageIds) {
                this._deadLetters.delete(messageId);
            }
        }
    }

    getMessagesFromOutbox(batchSize: number): Promise<p3saga.endpoint.Response[]> {
        const responses = Array.from(this._responses.values());
        const responsesToReturn = responses.slice(0, batchSize as number);
        return Promise.resolve(responsesToReturn);
    }

    getMessagesFromDeadLetter(batchSize: number): Promise<p3saga.endpoint.Response[]> {
        const deadLetters = Array.from(this._deadLetters.values());
        const deadLettersToReturn = deadLetters.slice(0, batchSize as number);
        return Promise.resolve(deadLettersToReturn);
    }
    
}
