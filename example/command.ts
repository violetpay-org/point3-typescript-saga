import * as point3Saga from "../Saga";
import { ChannelName } from "../Saga/Endpoint/Channel";
import { TxContext } from "../UnitOfWork/main";

enum ExampleSagaResponseStatus {
    Success = "Success",
    Failure = "Failure"
}

export class ExampleRequestCommand implements point3Saga.endpoint.endpoint.Command {
    private sagaId: string;
    
    constructor(sagaId: string) {
        this.sagaId = sagaId;
    }
    
    public getSagaId(): string {
        return this.sagaId;
    }
}

export class ExampleSuccessResponse implements point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Success;
    private sagaId: string;
    
    constructor(sagaId: string) {
        this.sagaId = sagaId;
    }
    
    public getSagaId(): string {
        return this.sagaId;
    }
}

export class ExampleFailureResponse implements point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Failure;
    private sagaId: string;
    
    constructor(sagaId: string) {
        this.sagaId = sagaId;
    }
    
    public getSagaId(): string {
        return this.sagaId;
    }
}