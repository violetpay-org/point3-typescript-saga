import * as point3Saga from "../Saga";
import { TxContext, UnitOfWork } from "../UnitOfWork/main";
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
            "ExampleSagaReqChan",
            "ExampleSagaSuccessChan",
            "ExampleSagaFailureChan",
            ExampleRequestCommand,
            ExampleSuccessResponse,
            ExampleFailureResponse,
            commandRepository,
        );
    }
}