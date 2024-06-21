import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { CompensationSagaAction, InvocationSagaAction, LocalCompensationSagaAction, LocalInvocationSagaAction } from "./SagaAction";
import { endpoint } from "../Endpoint";

export class Step<Tx extends TxContext> {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    compensationAction: CompensationSagaAction<Tx, endpoint.Command> | LocalCompensationSagaAction<Tx>;
    invocationAction: InvocationSagaAction<Tx, endpoint.Command> | LocalInvocationSagaAction<Tx>;
    retry: boolean;
    onReplies: Array<endpoint.MessageHandlerFunc<endpoint.AbstractSagaMessage, Executable<Tx>>> = [];

    public getStepName(): string {
        return this.name;
    }

    public isInvocable(): boolean {
        if (this.invocationAction) {
            return true;
        }
        return false;
    }

    public isCompensatable(): boolean {
        if (this.compensationAction) {
            return true;
        }
        return false;
    }

    public hasReplyHandlers(): boolean {
        return this.onReplies.length > 0;
    }

    public mustComplete(): boolean {
        return this.retry;
    }

    public isLocallyInvocable(): boolean {
        if (this.invocationAction instanceof LocalInvocationSagaAction) {
            return true;
        }
        return false;
    }

    public isLocallyCompensatable(): boolean {
        if (this.compensationAction instanceof LocalCompensationSagaAction) {
            return true;
        }
        return false;
    }
}