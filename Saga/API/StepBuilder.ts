import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { endpoint } from "../Endpoint";
import { definition } from "../SagaPlanning";
import { session } from "../SagaSession";

export interface IStepBuilder<Tx extends TxContext> {
    step(name: string): IInvokableStepBuilder<Tx> & ILocalInvocableStepBuilder<Tx>;
    build(): definition.SagaDefinition<Tx>;
}

export interface ReplyDispatchableStepBuilder<
    StepBuilderType extends IStepBuilder<Tx>,
    Tx extends TxContext
> extends IStepBuilder<Tx> {
    onReply(handler: endpoint.MessageHandlerFunc<endpoint.AbstractSagaMessage, Executable<Tx>>): StepBuilderType;
}

export interface MustCompleteStepBuilder<Tx extends TxContext> extends IStepBuilder<Tx> {
    retry(): IncompensatableStepBuilder<Tx>;
}

export interface IInvokableStepBuilder<Tx extends TxContext> extends IStepBuilder<Tx> {
    invoke(endpoint: endpoint.CommandEndpoint<
            session.SagaSession, 
            endpoint.Command<session.SagaSession>, 
            endpoint.Command<session.SagaSession>, 
            endpoint.Command<session.SagaSession>
        >): AfterInvokationStepBuilder<Tx>;
}

export interface AfterInvokationStepBuilder<Tx extends TxContext> extends 
    IStepBuilder<Tx>, 
    ReplyDispatchableStepBuilder<
        AfterInvokationStepBuilder<Tx>, 
        Tx
    >, 
    MustCompleteStepBuilder<Tx> 
{
    withCompensation(endpoint: endpoint.CommandEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>
    >): IncompensatableStepBuilder<Tx>;
}

export interface IncompensatableStepBuilder<Tx extends TxContext> extends 
    IStepBuilder<Tx>, 
    ReplyDispatchableStepBuilder<
        AfterInvokationStepBuilder<Tx>, 
        Tx
    >
{}

// For Local invocation
export interface ILocalInvocableStepBuilder<Tx extends TxContext> {
    localInvoke(endpoint: endpoint.LocalEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>
    >): AfterLocalInvocationStepBuilder<Tx>;
}
export interface AfterLocalInvocationStepBuilder<Tx extends TxContext> extends 
    IStepBuilder<Tx>,
    ILocalMustCompleteStepBuilder<Tx>
{
    withLocalCompensation(endpoint: endpoint.LocalEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>
    >): IStepBuilder<Tx>;
}
export interface ILocalMustCompleteStepBuilder<Tx extends TxContext> extends IStepBuilder<Tx> {
    localRetry(): IStepBuilder<Tx>;
}