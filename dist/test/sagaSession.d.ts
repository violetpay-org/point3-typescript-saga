import * as point3Saga from '../Saga/index';
import { Executable, TxContext } from '../UnitOfWork/main';
export declare class ExampleSagaSessionArguments2 implements point3Saga.saga.SagaSessionArguments {
    private readonly _arg2;
    getArg2(): string;
}
export declare class ExampleSagaSessionArguments implements point3Saga.saga.SagaSessionArguments {
    private readonly _arg1;
    getArg1(): string;
}
export declare class ExampleSagaSession extends point3Saga.saga.SagaSession {
    constructor(sagaId: string, arg: ExampleSagaSessionArguments);
}
export declare class InMemoryExampleSagaSaver implements point3Saga.saga.SagaSessionRepository<TxContext, ExampleSagaSession> {
    private readonly _sessions;
    constructor();
    saveTx(sagaSession: ExampleSagaSession): Executable<TxContext>;
    load(sagaSessionId: string): Promise<ExampleSagaSession>;
    getSessions(): IterableIterator<ExampleSagaSession>;
    getSagaSessionsAsMap(): Map<string, ExampleSagaSession>;
}
