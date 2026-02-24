import * as point3Saga from "../Saga/index";
import { TxContext } from "../UnitOfWork/main";
import { ExampleSagaSessionArguments, ExampleSagaSession } from "./sagaSession";
export declare class ExampleSaga<T extends TxContext> extends point3Saga.api.AbstractSaga<T, ExampleSagaSessionArguments, ExampleSagaSession> {
    protected static sagaName: string;
    private sagaDefinition;
    private sagaSessionRepository;
    constructor(builder: point3Saga.api.StepBuilder<T>, schema: (builder: point3Saga.api.StepBuilder<T>) => point3Saga.planning.SagaDefinition<T>, sagaSessionRepository: point3Saga.saga.SagaSessionRepository<T, ExampleSagaSession>);
    static getName(): string;
    getDefinition(): point3Saga.planning.SagaDefinition<T>;
    getSagaRepository(): point3Saga.saga.SagaSessionRepository<T, ExampleSagaSession>;
    getName(): string;
    createSession(arg: ExampleSagaSessionArguments): Promise<ExampleSagaSession>;
}
