import { TxContext } from "../../UnitOfWork/main";
import * as saga from "../SagaSession/index";

import { AbstractSagaMessage, Command, CommandArguments, Response } from "./CommandEndpoint";
import { CommandRepository, ResponseRepository } from "./CommandRepository";
import { AbstractSagaMessageWithOrigin } from "./CommandEndpoint";

export type ChannelName = string;

export abstract class Channel<C extends AbstractSagaMessage> {
    abstract send(command: C): Promise<void>;
    abstract getChannelName(): ChannelName;

    public parseMessageWithOrigin(message: C): AbstractSagaMessageWithOrigin<C> {
        return new MessageWithOrigin(this.getChannelName(), message);
    }
}

class MessageWithOrigin<M extends AbstractSagaMessage> implements AbstractSagaMessageWithOrigin<M> {
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

export type SavableMessageChannel<Tx extends TxContext> = SavableCommandChannel<Command<saga.SagaSession, CommandArguments>, Tx> | SavableResponseChannel<Response, Tx>;

export abstract class SavableCommandChannel<C extends Command<saga.SagaSession, CommandArguments>, Tx extends TxContext> extends Channel<C> {
    private _commandRepository: CommandRepository<C, Tx>;

    constructor(commandRepository: CommandRepository<C, Tx>) {
        super();
        this._commandRepository = commandRepository;
    }

    public getRepository(): CommandRepository<C, Tx> {
        return this._commandRepository;
    }
}

export abstract class SavableResponseChannel<R extends Response, Tx extends TxContext> extends Channel<R> {
    private _responseRepository: ResponseRepository<R, Tx>;

    constructor(responseRepository: ResponseRepository<R, Tx>) {
        super();
        this._responseRepository = responseRepository;
    }

    public getRepository(): ResponseRepository<R, Tx> {
        return this._responseRepository;
    }
}

