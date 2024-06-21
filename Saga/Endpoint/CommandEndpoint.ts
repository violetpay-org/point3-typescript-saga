import { ChannelName } from "./Channel";
import { CommandRepository } from "./Command.repository";
import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";

import * as saga from '../SagaSession'

export interface AbstractSagaMessage {
    getSagaId(): string
}

export interface AbstractSagaMessageWithOrigin<M extends AbstractSagaMessage> {
    getOrigin(): ChannelName;
    getSagaMessage(): M;
}

export abstract class Command implements AbstractSagaMessage {
    protected _sagaId: string

    constructor(sagaId: string) {
        this._sagaId = sagaId;
    }
    
    getSagaId(): string {
        return this._sagaId;
    }
}

export abstract class LocalResCommand extends Command {
    protected _isConsumed: boolean;
    
    constructor(
        sagaId: string,
        isConsumed?: boolean
    ) {
        super(sagaId);

        if (isConsumed == undefined) {
            this._isConsumed = false;
        } else {
            this._isConsumed = isConsumed;
        }
    }

    consume() {
        this._isConsumed = true;
    }
}

export interface MessageConstructor<C extends AbstractSagaMessage> {
    new (sagaId: string): C;
}
export type MessageHandlerFunc<C extends AbstractSagaMessage, O> = (message: C) => Promise<O>;

export abstract class EndpointWithSuccessFailureRes<
    SuccessResC extends Command,
    FailureResC extends Command
> {
    constructor(
        private _successResChannelName: ChannelName,
        private _failureResChannelName: ChannelName,
        private _commandSuccessResCtor: MessageConstructor<SuccessResC>,
        private _commandFailureResCtor: MessageConstructor<FailureResC>,
    ) {}

    public getSuccessResChannelName(): string {
        return this._successResChannelName;
    }

    public getFailureResChannelName(): string {
        return this._failureResChannelName;
    }

    public getCommandSuccessResCtor(): MessageConstructor<SuccessResC> {
        return this._commandSuccessResCtor;
    }

    public getCommandFailureResCtor(): MessageConstructor<FailureResC> {
        return this._commandFailureResCtor;
    }
}

export abstract class CommandEndpoint<
    ReqC extends Command,
    SuccessResC extends Command,
    FailureResC extends Command
> extends EndpointWithSuccessFailureRes<SuccessResC, FailureResC> {
    private _reqChannelName: ChannelName;
    private _commandReqCtor: MessageConstructor<ReqC>;
    private _commandRepository: CommandRepository<ReqC, TxContext>;

    constructor(
        reqChannelName: ChannelName,
        successResChannelName: ChannelName,
        failureResChannelName: ChannelName,
        commandReqCtor: MessageConstructor<ReqC>,
        commandSuccessResCtor: MessageConstructor<SuccessResC>,
        commandFailureResCtor: MessageConstructor<FailureResC>,
        commandRepository: CommandRepository<ReqC, TxContext>,
    ) {
        super(
            successResChannelName, 
            failureResChannelName,
            commandSuccessResCtor,
            commandFailureResCtor,
        );

        this._reqChannelName = reqChannelName;
        this._commandReqCtor = commandReqCtor;
        this._commandRepository = commandRepository;
    }

    public getReqChannelName(): string {
        return this._reqChannelName;
    }

    public getCommandReqCtor(): MessageConstructor<ReqC> {
        return this._commandReqCtor;
    }

    public getCommandRepository(): CommandRepository<ReqC, TxContext> {
        return this._commandRepository;
    }
}

export abstract class LocalEndpoint<
    SuccessResC extends Command,
    FailureResC extends Command
> extends EndpointWithSuccessFailureRes<SuccessResC, FailureResC>{
    private _successCommandRepository: CommandRepository<SuccessResC, TxContext>;
    private _failureCommandRepository: CommandRepository<FailureResC, TxContext>;
    
    constructor(
        successResChannelName: ChannelName,
        failureResChannelName: ChannelName,
        commandSuccessResCtor: MessageConstructor<SuccessResC>,
        commandFailureResCtor: MessageConstructor<FailureResC>,
        successCommandRepository: CommandRepository<SuccessResC, TxContext>,
        failureCommandRepository: CommandRepository<FailureResC, TxContext>,
    ) {
        super(
            successResChannelName,
            failureResChannelName,
            commandSuccessResCtor,
            commandFailureResCtor,
        );

        this._successCommandRepository = successCommandRepository;
        this._failureCommandRepository = failureCommandRepository;
    }

    public getSuccessCommandRepository(): CommandRepository<SuccessResC, TxContext> {
        return this._successCommandRepository;
    }

    public getFailureCommandRepository(): CommandRepository<FailureResC, TxContext> {
        return this._failureCommandRepository;
    }

    abstract handle<Tx extends TxContext, S extends saga.session.SagaSession>(
        sagaSession: S,
    ): Executable<Tx>
}
