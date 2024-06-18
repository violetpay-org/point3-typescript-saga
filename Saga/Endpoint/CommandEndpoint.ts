import { ChannelName } from "./Channel";

export interface AbstractSagaMessage {
    getSagaId(): string
}

export interface AbstractSagaMessageWithOrigin<M extends AbstractSagaMessage> {
    getOrigin(): ChannelName;
    getSagaMessage(): M;
}

export interface Command extends AbstractSagaMessage {}

export type MessageConstructor<C extends AbstractSagaMessage> = (() => C) | Constructor<C>;
export type MessageHandlerFunc<C extends AbstractSagaMessage, O> = (message: C) => Promise<O>;

export abstract class CommandEndpoint<
    ReqC extends Command,
    SuccessResC extends Command,
    FailureResC extends Command
> {
    private _reqChannelName: ChannelName;
    private _successResChannelName: ChannelName;
    private _failureResChannelName: ChannelName;
    private _commandReqCtor: MessageConstructor<ReqC>;
    private _commandSuccessResCtor: MessageConstructor<SuccessResC>;
    private _commandFailureResCtor: MessageConstructor<FailureResC>;

    constructor(
        reqChannelName: ChannelName,
        successResChannelName: ChannelName,
        failureResChannelName: ChannelName,
        commandReqCtor: MessageConstructor<ReqC>,
        commandSuccessResCtor: MessageConstructor<SuccessResC>,
        commandFailureResCtor: MessageConstructor<FailureResC>,
    ) {
        this._reqChannelName = reqChannelName;
        this._successResChannelName = successResChannelName;
        this._failureResChannelName = failureResChannelName;
        this._commandReqCtor = commandReqCtor;
        this._commandSuccessResCtor = commandSuccessResCtor;
        this._commandFailureResCtor = commandFailureResCtor;
    }

    public getReqChannelName(): string {
        return this._reqChannelName;
    }

    public getSuccessResChannelName(): string {
        return this._successResChannelName;
    }

    public getFailureResChannelName(): string {
        return this._failureResChannelName;
    }

    public getCommandReqCtor(): MessageConstructor<ReqC> {
        return this._commandReqCtor;
    }

    public getCommandSuccessResCtor(): MessageConstructor<SuccessResC> {
        return this._commandSuccessResCtor;
    }

    public getCommandFailureResCtor(): MessageConstructor<FailureResC> {
        return this._commandFailureResCtor;
    }
}
