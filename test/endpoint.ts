import * as point3Saga from "../Saga";
import { Executable, TxContext } from "../UnitOfWork/main";
import { ExampleFailureResponseChannel, ExampleLocalFailureResponseChannel, ExampleLocalSuccessResponseChannel, ExampleRequestChannel, ExampleSuccessResponseChannel } from "./channel";
import {
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse,
} from "./command";

export class ExampleEndpoint<Tx extends TxContext> extends point3Saga.endpoint.endpoint.CommandEndpoint<
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse
> {
    constructor(
        commandRepository: point3Saga.endpoint.commandRepository.CommandRepository<ExampleRequestCommand, Tx>,
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

export class AlwaysSuccessLocalEndpoint<Tx extends TxContext> extends point3Saga.endpoint.endpoint.LocalEndpoint<
    ExampleSuccessResponse,
    ExampleFailureResponse
> {
    handle<Tx extends TxContext, S extends point3Saga.saga.session.SagaSession>(sagaSession: S): Executable<Tx> {
        console.log("Handling saga session", sagaSession.getSagaId());
        return async (tx: Tx) => {
            console.log("Handled saga session", sagaSession.getSagaId());
        }
    }
    
    constructor(
        successCommandRepository: point3Saga.endpoint.commandRepository.CommandRepository<ExampleSuccessResponse, Tx>,
        failureCommandRepository: point3Saga.endpoint.commandRepository.CommandRepository<ExampleFailureResponse, Tx>,
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
    handle<Tx extends TxContext, S extends point3Saga.saga.session.SagaSession>(sagaSession: S): Executable<Tx> {
        throw new Error("Always fails");
    }
}