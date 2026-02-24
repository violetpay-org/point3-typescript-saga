import * as endpoint from "../Endpoint/index";
import * as saga from "../SagaSession/index";
import { Executable, TxContext } from "../../UnitOfWork/main";
import { CompensationSagaAction, InvocationSagaAction, LocalCompensationSagaAction, LocalInvocationSagaAction } from "./SagaAction";
export declare class Step<Tx extends TxContext> {
    private name;
    constructor(name: string);
    compensationAction: CompensationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>> | LocalCompensationSagaAction<Tx>;
    invocationAction: InvocationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>> | LocalInvocationSagaAction<Tx>;
    retry: boolean;
    onReplies: Array<endpoint.MessageHandlerFunc<endpoint.AbstractSagaMessage, saga.SagaSession, Executable<Tx>>>;
    getStepName(): string;
    isInvocable(): boolean;
    isCompensatable(): boolean;
    hasReplyHandlers(): boolean;
    mustComplete(): boolean;
}
export declare const CENTINEL_STEP_NAME = "sentinel";
export declare class CentinelStep<Tx extends TxContext> extends Step<Tx> {
    constructor();
}
