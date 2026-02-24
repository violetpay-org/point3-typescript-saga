import * as point3Saga from "../Saga/index";
import { Executable, TxContext } from "../UnitOfWork";
import { ExampleRequestCommand, ExampleSuccessResponse, ExampleFailureResponse } from "./command";
export declare class ExampleEndpoint<Tx extends TxContext> extends point3Saga.endpoint.CommandEndpoint<point3Saga.saga.SagaSession, ExampleRequestCommand, ExampleSuccessResponse, ExampleFailureResponse, Tx> {
    constructor(commandRepository: point3Saga.endpoint.CommandRepository<ExampleRequestCommand, Tx>);
}
export declare class AlwaysSuccessLocalEndpoint<Tx extends TxContext> extends point3Saga.endpoint.LocalEndpoint<point3Saga.saga.SagaSession, ExampleSuccessResponse, ExampleFailureResponse, Tx> {
    handle(sagaSession: point3Saga.saga.SagaSession): Promise<Executable<Tx>>;
    constructor(successCommandRepository: point3Saga.endpoint.ResponseRepository<ExampleSuccessResponse, Tx>, failureCommandRepository: point3Saga.endpoint.ResponseRepository<ExampleFailureResponse, Tx>);
}
export declare class AlwaysFailingLocalEndpoint<Tx extends TxContext> extends AlwaysSuccessLocalEndpoint<Tx> {
    handle<Tx extends TxContext>(sagaSession: point3Saga.saga.SagaSession): Promise<Executable<Tx>>;
}
