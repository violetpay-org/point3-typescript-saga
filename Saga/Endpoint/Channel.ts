import { TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { endpoint } from ".";
import { AbstractSagaMessageWithOrigin, Command } from "./CommandEndpoint";
import { CommandRepository } from "./Command.repository";
import { saga } from "..";

export type ChannelName = string;

export abstract class Channel<C extends Command<saga.session.SagaSession>> {
    abstract send(command: C): Promise<void>;
    abstract getChannelName(): ChannelName;

    public parseMessageWithOrigin(message: C): endpoint.AbstractSagaMessageWithOrigin<C> {
        return new MessageWithOrigin(this.getChannelName(), message);
    }
}

class MessageWithOrigin<M extends Command<saga.session.SagaSession>> implements AbstractSagaMessageWithOrigin<M> {
    private origin: ChannelName;
    private message: M;

    constructor(origin: ChannelName, message: M) {
        this.origin = origin;
        this.message = message;
    }

    getOrigin(): ChannelName {
        return this.origin;
    }

    getSagaMessage(): M {
        return this.message;
    }
}

export abstract class SavableCommandChannel<C extends Command<saga.session.SagaSession>, Tx extends TxContext> extends Channel<C> {
    private _commandRepository: CommandRepository<C, Tx>;

    constructor(commandRepository: CommandRepository<C, Tx>) {
        super();
        this._commandRepository = commandRepository;
    }

    public getCommandRepository(): CommandRepository<C, Tx> {
        return this._commandRepository;
    }
}

