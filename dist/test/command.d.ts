import { endpoint, saga } from "../Saga/index";
export declare class ExampleRequestCommandArguments extends endpoint.CommandArguments {
    constructor(sagaId: string, id: string);
}
export declare class ExampleRequestCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments> {
    constructor(args?: saga.SagaSession | endpoint.CommandArguments);
    getTriggeredReason(): string;
}
export declare class ExampleSuccessResponse extends endpoint.Response {
    private readonly _responseStatus;
    constructor(record: Record<string, string>);
    getTriggeredReason(): string;
}
export declare class ExampleFailureResponse extends endpoint.Response {
    private readonly _responseStatus;
    constructor(record: Record<string, string>);
    getTriggeredReason(): string;
}
