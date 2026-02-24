import { ChannelName } from "./Channel";
import { CommandRepository, ResponseRepository } from "./CommandRepository";
import { Executable, TxContext } from "../../UnitOfWork/main";
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
export declare class CommandArguments {
    sagaId: string;
    id: string;
    constructor(sagaId: string, id: string);
}
export declare class ResponseArguments {
    sagaId: string;
    id: string;
    constructor(sagaId: string, id: string);
}
export declare abstract class Command<S extends SagaSession, A extends CommandArguments> implements AbstractSagaMessage {
    protected _sagaId: string;
    protected _id: string;
    constructor(args?: S | A);
    abstract getTriggeredReason(): string;
    getId(): string;
    getSagaId(): string;
}
export declare abstract class Response implements AbstractSagaMessage {
    protected _sagaId: string;
    protected _id: string;
    constructor(record: Record<string, string>);
    abstract getTriggeredReason(): string;
    getId(): string;
    getSagaId(): string;
}
export interface CommandConstructor<C extends AbstractSagaMessage, S extends SagaSession> {
    new (sagaSession: S): C;
}
export interface ResponseConstructor<C extends AbstractSagaMessage> {
    new (record: Record<string, string>): C;
}
export type MessageHandlerFunc<MessageType extends AbstractSagaMessage, SagaSessionType extends SagaSession, ReturnType> = (message: MessageType, sagaSession?: SagaSessionType) => Promise<ReturnType>;
export declare abstract class EndpointWithSuccessFailureRes<SuccessRes extends Response, FailureRes extends Response> {
    private _successResChannelName;
    private _failureResChannelName;
    private _commandSuccessResCtor;
    private _commandFailureResCtor;
    constructor(_successResChannelName: ChannelName, _failureResChannelName: ChannelName, _commandSuccessResCtor: ResponseConstructor<SuccessRes>, _commandFailureResCtor: ResponseConstructor<FailureRes>);
    getSuccessResChannelName(): string;
    getFailureResChannelName(): string;
    getCommandSuccessResCtor(): ResponseConstructor<SuccessRes>;
    getCommandFailureResCtor(): ResponseConstructor<FailureRes>;
}
export declare abstract class CommandEndpoint<S extends SagaSession, ReqC extends Command<S, CommandArguments>, SuccessRes extends Response, FailureRes extends Response, Tx extends TxContext> extends EndpointWithSuccessFailureRes<SuccessRes, FailureRes> {
    private _reqChannelName;
    private _commandReqCtor;
    private _commandRepository;
    constructor(reqChannelName: ChannelName, successResChannelName: ChannelName, failureResChannelName: ChannelName, commandReqCtor: CommandConstructor<ReqC, S>, commandSuccessResCtor: ResponseConstructor<SuccessRes>, commandFailureResCtor: ResponseConstructor<FailureRes>, commandRepository: CommandRepository<ReqC, Tx>);
    getReqChannelName(): string;
    getCommandReqCtor(): CommandConstructor<ReqC, S>;
    getCommandRepository(): CommandRepository<ReqC, TxContext>;
}
export declare abstract class LocalEndpoint<S extends SagaSession, SuccessRes extends Response, FailureRes extends Response, Tx extends TxContext> extends EndpointWithSuccessFailureRes<SuccessRes, FailureRes> {
    private _successCommandRepository;
    private _failureCommandRepository;
    constructor(successResChannelName: ChannelName, failureResChannelName: ChannelName, commandSuccessResCtor: ResponseConstructor<SuccessRes>, commandFailureResCtor: ResponseConstructor<FailureRes>, successCommandRepository: ResponseRepository<SuccessRes, Tx>, failureCommandRepository: ResponseRepository<FailureRes, Tx>);
    getSuccessResponseRepository(): ResponseRepository<SuccessRes, Tx>;
    getFailureResponseRepository(): ResponseRepository<FailureRes, Tx>;
    abstract handle(sagaSession: S): Promise<Executable<Tx>>;
}
