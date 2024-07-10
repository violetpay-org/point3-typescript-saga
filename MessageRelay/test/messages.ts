import { ExampleSagaSession } from 'test/sagaSession';
import { p3saga, uow } from '../../index';

export class InMemoryCommand extends p3saga.endpoint.Command<
    ExampleSagaSession,
    p3saga.endpoint.CommandArguments
> {
    constructor(
        args: p3saga.endpoint.CommandArguments | ExampleSagaSession,
    ) {
        super(args);
    }

    getTriggeredReason(): string {
        return "Triggered because example command is processed successfully";
    } 
}

export class InMemoryResponse extends p3saga.endpoint.Response {
    constructor(
        records: Record<string, string>,
    ) {
        super(records);
    }

    getTriggeredReason(): string {
        return "Triggered because example command is processed successfully";
    }
}