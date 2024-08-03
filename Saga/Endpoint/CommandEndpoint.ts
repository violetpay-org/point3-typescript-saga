import { ChannelName } from "./Channel";
import { CommandRepository, ResponseRepository } from "./CommandRepository";
import { Executable, TxContext } from "../../UnitOfWork/main";
import { randomUUID } from "crypto";
import { SagaSession } from "../SagaSession/SagaSession";

export interface AbstractSagaMessage {
    getSagaId(): string;
    getId(): string;
    getTriggeredReason(): string;
}

export interface AbstractSagaMessageWithOrigin<M extends AbstractSagaMessage> {
    getOrigin(): ChannelName;
    getSagaMessage(): M;
}

export class CommandArguments {
    constructor(
        public sagaId: string,
        public id: string,
    ) {}
}

export class ResponseArguments {
    constructor(
        public sagaId: string,
        public id: string,
    ) {}
}

export abstract class Command<
    S extends SagaSession, 
    A extends CommandArguments
> implements AbstractSagaMessage {
    protected _sagaId: string
    protected _id: string;

    constructor(
        args?: S | A,
    ) {
        if (args == undefined) {
            this._id = randomUUID();
            return this;
        }

        if (args instanceof SagaSession) {
            this._sagaId = args.getSagaId();
            this._id = randomUUID();
            return this;
        } 

        if (args instanceof CommandArguments) {
            this._sagaId = args.sagaId;
            this._id = args.id;
            return this;
        }
    }

    abstract getTriggeredReason(): string;

    getId(): string {
        return this._id;
    }
    
    getSagaId(): string {
        return this._sagaId;
    }
}

export abstract class Response implements AbstractSagaMessage {
    protected _sagaId: string;
    protected _id: string;

    constructor(record: Record<string, string>) {
        if (record == undefined) {
            return
        }

        if (record.sagaId != undefined) {
            this._sagaId = record.sagaId;
        }

        if (record.id != undefined) {
            this._id = record.id;
            return this;
        }

        this._id = randomUUID();
    }

    abstract getTriggeredReason(): string;

    getId(): string {
        return this._id;
    }

    getSagaId(): string {
        return this._sagaId;
    }
}

export interface CommandConstructor<C extends AbstractSagaMessage, S extends SagaSession> {
    new (sagaSession: S): C;
}

export interface ResponseConstructor<C extends AbstractSagaMessage> {
    new (record: Record<string, string>): C;
}

export type MessageHandlerFunc<C extends AbstractSagaMessage, O> = (message: C) => Promise<O>;

export abstract class EndpointWithSuccessFailureRes<
    SuccessRes extends Response,
    FailureRes extends Response
> {
    constructor(
        private _successResChannelName: ChannelName,
        private _failureResChannelName: ChannelName,
        private _commandSuccessResCtor: ResponseConstructor<SuccessRes>,
        private _commandFailureResCtor: ResponseConstructor<FailureRes>,
    ) {}

    public getSuccessResChannelName(): string {
        return this._successResChannelName;
    }

    public getFailureResChannelName(): string {
        return this._failureResChannelName;
    }

    public getCommandSuccessResCtor(): ResponseConstructor<SuccessRes> {
        return this._commandSuccessResCtor;
    }

    public getCommandFailureResCtor(): ResponseConstructor<FailureRes> {
        return this._commandFailureResCtor;
    }
}

export abstract class CommandEndpoint<
    S extends SagaSession,
    ReqC extends Command<S, CommandArguments>,
    SuccessRes extends Response,
    FailureRes extends Response,
    Tx extends TxContext
> extends EndpointWithSuccessFailureRes<SuccessRes, FailureRes> {
    private _reqChannelName: ChannelName;
    private _commandReqCtor: CommandConstructor<ReqC, S>;
    private _commandRepository: CommandRepository<ReqC, Tx>;

    constructor(
        reqChannelName: ChannelName,
        successResChannelName: ChannelName,
        failureResChannelName: ChannelName,
        commandReqCtor: CommandConstructor<ReqC, S>,
        commandSuccessResCtor: ResponseConstructor<SuccessRes>,
        commandFailureResCtor: ResponseConstructor<FailureRes>,
        commandRepository: CommandRepository<ReqC, Tx>,
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

    public getCommandReqCtor(): CommandConstructor<ReqC, S> {
        return this._commandReqCtor;
    }

    public getCommandRepository(): CommandRepository<ReqC, TxContext> {
        return this._commandRepository;
    }
}

export abstract class LocalEndpoint<
    S extends SagaSession,
    SuccessRes extends Response,
    FailureRes extends Response,
    Tx extends TxContext
> extends EndpointWithSuccessFailureRes<SuccessRes, FailureRes>{
    private _successCommandRepository: ResponseRepository<SuccessRes, Tx>;
    private _failureCommandRepository: ResponseRepository<FailureRes, Tx>;
    
    constructor(
        successResChannelName: ChannelName,
        failureResChannelName: ChannelName,
        commandSuccessResCtor: ResponseConstructor<SuccessRes>,
        commandFailureResCtor: ResponseConstructor<FailureRes>,
        successCommandRepository: ResponseRepository<SuccessRes, Tx>,
        failureCommandRepository: ResponseRepository<FailureRes, Tx>,
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

    public getSuccessResponseRepository(): ResponseRepository<SuccessRes, Tx> {
        return this._successCommandRepository;
    }

    public getFailureResponseRepository(): ResponseRepository<FailureRes, Tx> {
        return this._failureCommandRepository;
    }

    // Handle should be able to fix sagaSession passed in as argument...
    abstract handle(
        sagaSession: S,
    ): Promise<Executable<Tx>>
}
