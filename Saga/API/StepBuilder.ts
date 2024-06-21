import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { endpoint } from "../Endpoint";
import { definition } from "../SagaPlanning";

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
    invoke(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): AfterInvokationStepBuilder<Tx>;
}

export interface AfterInvokationStepBuilder<Tx extends TxContext> extends 
    IStepBuilder<Tx>, 
    ReplyDispatchableStepBuilder<
        AfterInvokationStepBuilder<Tx>, 
        Tx
    >, 
    MustCompleteStepBuilder<Tx> 
{
    withCompensation(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): IncompensatableStepBuilder<Tx>;
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
    localInvoke(endpoint: endpoint.LocalEndpoint<endpoint.Command, endpoint.Command>): AfterLocalInvocationStepBuilder<Tx>;
}
export interface AfterLocalInvocationStepBuilder<Tx extends TxContext> extends 
    IStepBuilder<Tx>,
    ILocalMustCompleteStepBuilder<Tx>
{
    withLocalCompensation(endpoint: endpoint.LocalEndpoint<endpoint.Command, endpoint.Command>): IStepBuilder<Tx>;
}
export interface ILocalMustCompleteStepBuilder<Tx extends TxContext> extends IStepBuilder<Tx> {
    localRetry(): IStepBuilder<Tx>;
}



