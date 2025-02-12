import * as endpoint from '../Endpoint/index';
import * as planning from '../SagaPlanning/index';
import * as saga from '../SagaSession/index';
import { TransactionContext } from '@tranjs/core';

export interface IStepBuilder<Tx extends TransactionContext> {
    step(name: string): IInvokableStepBuilder<Tx> & ILocalInvocableStepBuilder<Tx>;
    build(): planning.SagaDefinition<Tx>;
}

export interface MustCompleteStepBuilder<Tx extends TransactionContext> extends IStepBuilder<Tx> {
    retry(): IncompensatableStepBuilder<Tx>;
}

export interface IInvokableStepBuilder<Tx extends TransactionContext> extends IStepBuilder<Tx> {
    invoke<S extends saga.SagaSession>(
        endpoint: endpoint.CommandEndpoint<
            S,
            endpoint.Command<S, endpoint.CommandArguments>,
            endpoint.Response,
            endpoint.Response,
            Tx
        >,
    ): AfterInvokationStepBuilder<Tx>;
}

export interface AfterInvokationStepBuilder<Tx extends TransactionContext>
    extends IStepBuilder<Tx>,
        MustCompleteStepBuilder<Tx> {
    withCompensation<S extends saga.SagaSession>(
        endpoint: endpoint.CommandEndpoint<
            S,
            endpoint.Command<S, endpoint.CommandArguments>,
            endpoint.Response,
            endpoint.Response,
            Tx
        >,
    ): IncompensatableStepBuilder<Tx>;
}

export interface IncompensatableStepBuilder<Tx extends TransactionContext> extends IStepBuilder<Tx> {}

// For Local invocation
export interface ILocalInvocableStepBuilder<Tx extends TransactionContext> {
    localInvoke(
        endpoint: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>,
    ): AfterLocalInvocationStepBuilder<Tx>;
}
export interface AfterLocalInvocationStepBuilder<Tx extends TransactionContext>
    extends IStepBuilder<Tx>,
        ILocalMustCompleteStepBuilder<Tx> {
    withLocalCompensation(
        endpoint: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>,
    ): IStepBuilder<Tx>;
}
export interface ILocalMustCompleteStepBuilder<Tx extends TransactionContext> extends IStepBuilder<Tx> {
    localRetry(): IStepBuilder<Tx>;
}
