import { Executable, TxContext } from "../../UnitOfWork/main";
import * as endpoint from "../Endpoint/index";
import * as planning from "../SagaPlanning/index";
import * as saga from "../SagaSession/index";

export interface IStepBuilder<Tx extends TxContext> {
    step(name: string): IInvokableStepBuilder<Tx> & ILocalInvocableStepBuilder<Tx>;
    build(): planning.SagaDefinition<Tx>;
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
    invoke<S extends saga.SagaSession>(endpoint: endpoint.CommandEndpoint<
            S, 
            endpoint.Command<S, endpoint.CommandArguments>, 
            endpoint.Response, 
            endpoint.Response,
            Tx
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
    withCompensation<S extends saga.SagaSession>(endpoint: endpoint.CommandEndpoint<
        S, 
        endpoint.Command<S, endpoint.CommandArguments>, 
        endpoint.Response, 
        endpoint.Response,
        Tx
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
        saga.SagaSession, 
        endpoint.Response, 
        endpoint.Response,
        Tx
    >): AfterLocalInvocationStepBuilder<Tx>;
}
export interface AfterLocalInvocationStepBuilder<Tx extends TxContext> extends 
    IStepBuilder<Tx>,
    ILocalMustCompleteStepBuilder<Tx>
{
    withLocalCompensation(endpoint: endpoint.LocalEndpoint<
        saga.SagaSession, 
        endpoint.Response, 
        endpoint.Response,
        Tx
    >): IStepBuilder<Tx>;
}
export interface ILocalMustCompleteStepBuilder<Tx extends TxContext> extends IStepBuilder<Tx> {
    localRetry(): IStepBuilder<Tx>;
}