import * as point3Saga from "../Saga";
import { TxContext } from "../UnitOfWork/main";

class ExampleSagaSession extends point3Saga.core.saga.SagaSession {
    constructor() {
        super();
    }
}

enum ExampleSagaResponseStatus {
    Success = "Success",
    Failure = "Failure"
}

class ExampleRequestCommand extends point3Saga.endpoint.endpoint.Command {
    private constructor() {
        super();
        this.sagaId = "ExampleSaga";
    }

    public static create(): ExampleRequestCommand {
        return new ExampleRequestCommand;
    }
}

class ExampleSuccessResponse extends point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Success;

    private constructor() {
        super();
        this.sagaId = "ExampleSaga";
    }

    public static create(): ExampleSuccessResponse {
        return new ExampleSuccessResponse();
    }
}

class ExampleFailureResponse extends point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Failure;

    private constructor() {
        super();
        this.sagaId = "ExampleSaga";
    }

    public static create(): ExampleFailureResponse {
        return new ExampleFailureResponse();
    }
}

class ExampleEndpoint extends point3Saga.endpoint.endpoint.CommandEndpoint<
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse
> {
    constructor() {
        super(
            "ExampleSagaReqChan",
            "ExampleSagaSuccessChan",
            "ExampleSagaFailureChan",
            ExampleRequestCommand.create,
            ExampleSuccessResponse.create,
            ExampleFailureResponse.create,
        );
    }
}

function build() {
    const builder = new point3Saga.api.sagaBuilder.StepBuilder<ExampleSagaSession, TxContext>("ExampleSaga");

    builder
        .step("Step1")
        .invoke(new ExampleEndpoint())
        .withCompensation(new ExampleEndpoint())
        .step("Step2")
        

}