import * as endpoint from '../Endpoint/index';
import * as saga from '../SagaSession/index';

import {
    CompensationSagaAction,
    InvocationSagaAction,
    LocalCompensationSagaAction,
    LocalInvocationSagaAction,
} from './SagaAction';
import { TransactionContext } from '@tranjs/core';
export class Step<Tx extends TransactionContext> {
    private name: string;

    constructor(name: string) {
        this.name = name;
    }

    compensationAction:
        | CompensationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>>
        | LocalCompensationSagaAction<Tx>;
    invocationAction:
        | InvocationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>>
        | LocalInvocationSagaAction<Tx>;
    retry: boolean;

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

    public mustComplete(): boolean {
        return this.retry;
    }
}

export const CENTINEL_STEP_NAME = 'sentinel';
export class CentinelStep<Tx extends TransactionContext> extends Step<Tx> {
    constructor() {
        super(CENTINEL_STEP_NAME);
    }
}
