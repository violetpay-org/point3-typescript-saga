import * as point3Saga from "../Saga";
import {
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse,
} from "./command";

export class ExampleEndpoint extends point3Saga.endpoint.endpoint.CommandEndpoint<
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse
> {
    constructor() {
        super(
            "ExampleSagaReqChan",
            "ExampleSagaSuccessChan",
            "ExampleSagaFailureChan",
            ExampleRequestCommand,
            ExampleSuccessResponse,
            ExampleFailureResponse,
        );
    }
}