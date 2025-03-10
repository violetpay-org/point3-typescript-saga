import * as point3Saga from "../Saga/index";
import { TxContext } from "../UnitOfWork/main";

import {
    ExampleSagaSessionArguments,
    ExampleSagaSession,
} from "./sagaSession";

export class ExampleSaga<T extends TxContext> extends point3Saga.api.AbstractSaga<
    T,
    ExampleSagaSessionArguments,
    ExampleSagaSession
> {
    protected static sagaName: string = "ExampleSaga";

    private sagaDefinition: point3Saga.planning.SagaDefinition<T>;
    private sagaSessionRepository: point3Saga.saga.SagaSessionRepository<T, ExampleSagaSession>;
    
    constructor(
        builder: point3Saga.api.StepBuilder<T>,
        schema: (builder: point3Saga.api.StepBuilder<T>) => point3Saga.planning.SagaDefinition<T>,    
        sagaSessionRepository: point3Saga.saga.SagaSessionRepository<T, ExampleSagaSession>,
    ) {
        super();
        this.sagaDefinition = schema(builder);
        console.log(this.sagaDefinition)
        this.sagaSessionRepository = sagaSessionRepository;
    }

    static getName(): string {
        return ExampleSaga.sagaName;
    }

    getDefinition(): point3Saga.planning.SagaDefinition<T> {
        return this.sagaDefinition;
    }

    getSagaRepository(): point3Saga.saga.SagaSessionRepository<T, ExampleSagaSession> {
        return this.sagaSessionRepository;
    }

    getName(): string {
        return ExampleSaga.sagaName;
    }

    createSession(arg: ExampleSagaSessionArguments): Promise<ExampleSagaSession> {
        const newSessionId = this.makeSagaId();
        const sagaSession = new ExampleSagaSession(newSessionId, arg);
        return Promise.resolve(sagaSession);
    }
}

