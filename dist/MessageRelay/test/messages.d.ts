import { ExampleSagaSession } from '../../test/sagaSession';
import { p3saga } from '../../index';
export declare class InMemoryCommand extends p3saga.endpoint.Command<ExampleSagaSession, p3saga.endpoint.CommandArguments> {
    constructor(args: p3saga.endpoint.CommandArguments | ExampleSagaSession);
    getTriggeredReason(): string;
}
export declare class InMemoryResponse extends p3saga.endpoint.Response {
    constructor(records: Record<string, string>);
    getTriggeredReason(): string;
}
