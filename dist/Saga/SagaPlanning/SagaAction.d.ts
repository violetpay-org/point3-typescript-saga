import * as endpoint from '../Endpoint/index';
import * as saga from '../SagaSession/index';
import { Executable, TxContext } from "../../UnitOfWork/main";
export declare class LocalInvocationSagaAction<Tx extends TxContext> {
    invocationDestination: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>;
    constructor(endpoint: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>);
    executeInvocation<S extends saga.SagaSession>(sagaSession: S): Promise<Executable<Tx>>;
}
export declare class LocalCompensationSagaAction<Tx extends TxContext> {
    compensationDestination: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>;
    constructor(endpoint: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>);
    executeCompensation<S extends saga.SagaSession>(sagaSession: S): Promise<Executable<Tx>>;
}
export declare class InvocationSagaAction<Tx extends TxContext, InvocationCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>> {
    protected commandRepository: endpoint.CommandRepository<InvocationCommand, Tx>;
    invocationDestination: endpoint.CommandEndpoint<saga.SagaSession, InvocationCommand, endpoint.Response, endpoint.Response, Tx>;
    constructor(commandRepository: endpoint.CommandRepository<InvocationCommand, Tx>, endpoint: endpoint.CommandEndpoint<saga.SagaSession, InvocationCommand, endpoint.Response, endpoint.Response, Tx>);
    executeInvocation(sagaSession: saga.SagaSession): Promise<Executable<Tx>>;
}
export declare class CompensationSagaAction<Tx extends TxContext, CompensationCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>> {
    protected commandRepository: endpoint.CommandRepository<CompensationCommand, Tx>;
    compensationDestination: endpoint.CommandEndpoint<saga.SagaSession, CompensationCommand, endpoint.Response, endpoint.Response, Tx>;
    constructor(commandRepository: endpoint.CommandRepository<CompensationCommand, Tx>, endpoint: endpoint.CommandEndpoint<saga.SagaSession, CompensationCommand, endpoint.Response, endpoint.Response, Tx>);
    executeCompensation(sagaSession: saga.SagaSession): Promise<Executable<Tx>>;
}
