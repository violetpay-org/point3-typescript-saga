import { endpoint, saga } from "../Saga/index";

enum ExampleSagaResponseStatus {
    Success = "Success",
    Failure = "Failure"
}
export class ExampleRequestCommandArguments extends endpoint.CommandArguments {
    constructor(
        sagaId: string,
        id: string,
    ) {
        super(
            sagaId,
            id
        );
    }
}
export class ExampleRequestCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments> {    
    constructor(
        args?: saga.SagaSession | endpoint.CommandArguments,
    ) {
        super(args);
    }

    getTriggeredReason(): string {
        return "Triggered because example command was requested";
    }
}

export class ExampleSuccessResponse extends endpoint.Response {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Success;

    constructor(
        record: Record<string, string>
    ) {
        super(record);
    }

    getTriggeredReason(): string {
        return "Triggered because example command is processed successfully";
    }
}

export class ExampleFailureResponse extends endpoint.Response {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Failure;
    
    constructor(
        record: Record<string, string>
    ) {
        super(record);
    }

    getTriggeredReason(): string {
        return "Triggered because example command is failed to process";
    }
}