import * as point3Saga from "../Saga";
import { ChannelName } from "../Saga/Endpoint/Channel";
import { TxContext } from "../UnitOfWork/main";

enum ExampleSagaResponseStatus {
    Success = "Success",
    Failure = "Failure"
}

export class ExampleRequestCommand extends point3Saga.endpoint.endpoint.Command {    
    constructor(sagaId: string) {
        super(sagaId);
    }
}

export class ExampleSuccessResponse extends point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Success;
    
    constructor(sagaId: string) {
        super(sagaId);
    }
}

export class ExampleFailureResponse extends point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Failure;
    
    constructor(sagaId: string) {
        super(sagaId);
    }
}