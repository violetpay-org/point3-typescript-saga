import { ChannelName } from "./Channel";
import { CommandRepository } from "./CommandRepository";
import { Executable, TxContext } from "../../UnitOfWork/main";
import { randomUUID } from "crypto";
import { SagaSession } from "../SagaSession/SagaSession";

export interface AbstractSagaMessage {
    getSagaId(): string;
    getId(): string;
}

export interface AbstractSagaMessageWithOrigin<M extends AbstractSagaMessage> {
    getOrigin(): ChannelName;
    getSagaMessage(): M;
}

export abstract class Command<S extends SagaSession> implements AbstractSagaMessage {
    protected _sagaId: string
    protected _id: string;

    constructor(
        sagaSession?: S,
        id?: string,
    ) {
        this._sagaId = sagaSession.getSagaId();

        if (id == undefined) {
            this._id = randomUUID();
            return this;
        }
        
        this._id = id;
    }

    getId(): string {
        return this._id;
    }
    
    getSagaId(): string {
        return this._sagaId;
    }
}

export interface MessageConstructor<C extends AbstractSagaMessage, S extends SagaSession> {
    new (sagaSession: S): C;
}
export type MessageHandlerFunc<C extends AbstractSagaMessage, O> = (message: C) => Promise<O>;

export abstract class EndpointWithSuccessFailureRes<
    S extends SagaSession,
    SuccessResC extends Command<S>,
    FailureResC extends Command<S>
> {
    constructor(
        private _successResChannelName: ChannelName,
        private _failureResChannelName: ChannelName,
        private _commandSuccessResCtor: MessageConstructor<SuccessResC, S>,
        private _commandFailureResCtor: MessageConstructor<FailureResC, S>,
    ) {}

    public getSuccessResChannelName(): string {
        return this._successResChannelName;
    }

    public getFailureResChannelName(): string {
        return this._failureResChannelName;
    }

    public getCommandSuccessResCtor(): MessageConstructor<SuccessResC, S> {
        return this._commandSuccessResCtor;
    }

    public getCommandFailureResCtor(): MessageConstructor<FailureResC, S> {
        return this._commandFailureResCtor;
    }
}

export abstract class CommandEndpoint<
    S extends SagaSession,
    ReqC extends Command<S>,
    SuccessResC extends Command<S>,
    FailureResC extends Command<S>
> extends EndpointWithSuccessFailureRes<S, SuccessResC, FailureResC> {
    private _reqChannelName: ChannelName;
    private _commandReqCtor: MessageConstructor<ReqC, S>;
    private _commandRepository: CommandRepository<ReqC, TxContext>;

    constructor(
        reqChannelName: ChannelName,
        successResChannelName: ChannelName,
        failureResChannelName: ChannelName,
        commandReqCtor: MessageConstructor<ReqC, S>,
        commandSuccessResCtor: MessageConstructor<SuccessResC, S>,
        commandFailureResCtor: MessageConstructor<FailureResC, S>,
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

    public getCommandReqCtor(): MessageConstructor<ReqC, S> {
        return this._commandReqCtor;
    }

    public getCommandRepository(): CommandRepository<ReqC, TxContext> {
        return this._commandRepository;
    }
}

export abstract class LocalEndpoint<
    S extends SagaSession,
    SuccessResC extends Command<S>,
    FailureResC extends Command<S>
> extends EndpointWithSuccessFailureRes<S, SuccessResC, FailureResC>{
    private _successCommandRepository: CommandRepository<SuccessResC, TxContext>;
    private _failureCommandRepository: CommandRepository<FailureResC, TxContext>;
    
    constructor(
        successResChannelName: ChannelName,
        failureResChannelName: ChannelName,
        commandSuccessResCtor: MessageConstructor<SuccessResC, S>,
        commandFailureResCtor: MessageConstructor<FailureResC, S>,
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

    // Handle should be able to fix sagaSession passed in as argument...
    abstract handle<Tx extends TxContext>(
        sagaSession: S,
    ): Executable<Tx>
}
