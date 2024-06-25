import * as point3Saga from "../Saga";

enum ExampleSagaResponseStatus {
    Success = "Success",
    Failure = "Failure"
}

export class ExampleRequestCommand extends point3Saga.endpoint.endpoint.Command<point3Saga.saga.session.SagaSession> {    
    constructor(
        sagaSession?: point3Saga.saga.session.SagaSession,
        id?: string
    ) {
        super(sagaSession, id);
    }
}

export class ExampleSuccessResponse extends point3Saga.endpoint.endpoint.Command<point3Saga.saga.session.SagaSession> {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Success;

    constructor(
        sagaSession?: point3Saga.saga.session.SagaSession,
        id?: string
    ) {
        super(sagaSession, id);
    }
}

export class ExampleFailureResponse extends point3Saga.endpoint.endpoint.Command<point3Saga.saga.session.SagaSession> {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Failure;
    
    constructor(
        sagaSession?: point3Saga.saga.session.SagaSession,
        id?: string
    ) {
        super(sagaSession, id);
    }
}

export type ExampleMessage = point3Saga.endpoint.endpoint.Command<point3Saga.saga.session.SagaSession>;