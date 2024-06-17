import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { SagaInstance } from "./Saga";
import { SagaDefinition } from "./SagaDefinition";
import { endpoint } from "../Endpoint";


export interface IStepBuilder<S extends SagaInstance, Tx extends TxContext> {
    step(name: string): IInvokableStepBuilder<S, Tx>;
    build(): SagaDefinition<S, Tx>;
}

export interface ReplyDispatchableStepBuilder<
    StepBuilderType extends IStepBuilder<S, Tx>,
    S extends SagaInstance,
    Tx extends TxContext
> extends IStepBuilder<S, Tx> {
    onReply(handler: endpoint.MessageHandlerFunc<endpoint.AbstractSagaMessage, Executable<Tx>>): StepBuilderType;
}

export interface MustCompleteStepBuilder<
    S extends SagaInstance, 
    Tx extends TxContext
> extends IStepBuilder<S, Tx> {
    retry(): IncompensatableStepBuilder<S, Tx>;
}

export interface IInvokableStepBuilder<
    S extends SagaInstance,
    Tx extends TxContext
> extends IStepBuilder<S, Tx> {
    invoke(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): AfterInvokationStepBuilder<S, Tx>;
}

export interface AfterInvokationStepBuilder<
    S extends SagaInstance, 
    Tx extends TxContext
> extends 
    IStepBuilder<S, Tx>, 
    ReplyDispatchableStepBuilder<
        AfterInvokationStepBuilder<S, Tx>, 
        S, 
        Tx
    >, 
    MustCompleteStepBuilder<S, Tx> 
{
    withCompensation(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): IncompensatableStepBuilder<S, Tx>;
}

export interface IncompensatableStepBuilder<
    S extends SagaInstance, 
    Tx extends TxContext
> extends 
    IStepBuilder<S, Tx>, 
    ReplyDispatchableStepBuilder<
        AfterInvokationStepBuilder<S, Tx>, 
        S, 
        Tx
    >
{}
