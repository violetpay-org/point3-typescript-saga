import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { CompensationSagaAction, InvocationSagaAction } from "./Saga";
import { endpoint } from "../Endpoint";

export class Step<Tx extends TxContext> {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    compensationAction: CompensationSagaAction<Tx, endpoint.Command>;
    invocationAction: InvocationSagaAction<Tx, endpoint.Command>;
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
}