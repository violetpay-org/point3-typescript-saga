import { TxContext } from "../../UnitOfWork/main";
import * as saga from "../SagaSession/index";

import { Command } from "./CommandEndpoint";
import { CommandRepository } from "./CommandRepository";
import { AbstractSagaMessageWithOrigin } from "./CommandEndpoint";

export type ChannelName = string;

export abstract class Channel<C extends Command<saga.SagaSession>> {
    abstract send(command: C): Promise<void>;
    abstract getChannelName(): ChannelName;

    public parseMessageWithOrigin(message: C): AbstractSagaMessageWithOrigin<C> {
        return new MessageWithOrigin(this.getChannelName(), message);
    }
}

class MessageWithOrigin<M extends Command<saga.SagaSession>> implements AbstractSagaMessageWithOrigin<M> {
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

export abstract class SavableCommandChannel<C extends Command<saga.SagaSession>, Tx extends TxContext> extends Channel<C> {
    private _commandRepository: CommandRepository<C, Tx>;

    constructor(commandRepository: CommandRepository<C, Tx>) {
        super();
        this._commandRepository = commandRepository;
    }

    public getCommandRepository(): CommandRepository<C, Tx> {
        return this._commandRepository;
    }
}

