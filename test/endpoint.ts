import * as point3Saga from "../Saga/index";
import { Executable, TxContext } from "../UnitOfWork/main";
import { ExampleFailureResponseChannel, ExampleLocalFailureResponseChannel, ExampleLocalSuccessResponseChannel, ExampleRequestChannel, ExampleSuccessResponseChannel } from "./channel";
import {
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse,
} from "./command";

export class ExampleEndpoint<Tx extends TxContext> extends point3Saga.endpoint.CommandEndpoint<
    point3Saga.saga.SagaSession,
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse
> {
    constructor(
        commandRepository: point3Saga.endpoint.CommandRepository<ExampleRequestCommand, Tx>,
    ) {
        super(
            ExampleRequestChannel.CHANNEL_NAME,
            ExampleSuccessResponseChannel.CHANNEL_NAME,
            ExampleFailureResponseChannel.CHANNEL_NAME,
            ExampleRequestCommand,
            ExampleSuccessResponse,
            ExampleFailureResponse,
            commandRepository,
        );
    }
}

export class AlwaysSuccessLocalEndpoint<Tx extends TxContext> extends point3Saga.endpoint.LocalEndpoint<
    point3Saga.saga.SagaSession,
    ExampleSuccessResponse,
    ExampleFailureResponse,
    Tx
> {
    async handle(sagaSession: point3Saga.saga.SagaSession): Promise<Executable<Tx>> {
        console.log("Handling saga session", sagaSession.getSagaId());
        return async (tx: Tx) => {
            console.log("Handled saga session", sagaSession.getSagaId());
        }
    }
    
    constructor(
        successCommandRepository: point3Saga.endpoint.ResponseRepository<ExampleSuccessResponse, Tx>,
        failureCommandRepository: point3Saga.endpoint.ResponseRepository<ExampleFailureResponse, Tx>,
    ) {
        super(
            ExampleLocalSuccessResponseChannel.CHANNEL_NAME,
            ExampleLocalFailureResponseChannel.CHANNEL_NAME,
            ExampleSuccessResponse,
            ExampleFailureResponse,
            successCommandRepository,
            failureCommandRepository,
        );
    }
}

export class AlwaysFailingLocalEndpoint<Tx extends TxContext> extends AlwaysSuccessLocalEndpoint<Tx> {
    async handle<Tx extends TxContext>(sagaSession: point3Saga.saga.SagaSession): Promise<Executable<Tx>> {
        throw new Error("Always fails");
    }
}