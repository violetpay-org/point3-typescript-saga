import * as point3Saga from "../Saga";
import { TxContext } from "../UnitOfWork/main";

import {
    ExampleSagaSessionArguments,
    ExampleSagaSession,
    ExampleSagaSession2,
} from "./sagaSession";

export class ExampleSaga extends point3Saga.api.registry.AbstractSaga<
    TxContext,
    ExampleSagaSessionArguments,
    ExampleSagaSession
> {
    protected sagaName: string = "ExampleSaga";

    private sagaDefinition: point3Saga.core.sagaDefinition.SagaDefinition<TxContext>;
    private sagaSessionRepository: point3Saga.core.sagaRepository.SagaSessionRepository<TxContext, ExampleSagaSession>;
    
    private static applySagaSchemaTo(
        sagaBuilder: point3Saga.api.sagaBuilder.StepBuilder<TxContext>,        
    ): point3Saga.core.sagaDefinition.SagaDefinition<TxContext> {
        throw new Error("Method not implemented.");
    }
    
    constructor(
        builder: point3Saga.api.sagaBuilder.StepBuilder<TxContext>,
        sagaSessionRepository: point3Saga.core.sagaRepository.SagaSessionRepository<TxContext, ExampleSagaSession>,
    ) {
        super();
        this.sagaDefinition = ExampleSaga.applySagaSchemaTo(builder);
        this.sagaSessionRepository = sagaSessionRepository;
    }

    getDefinition(): point3Saga.core.sagaDefinition.SagaDefinition<TxContext> {
        return this.sagaDefinition;
    }

    getSagaRepository(): point3Saga.core.sagaRepository.SagaSessionRepository<TxContext, ExampleSagaSession> {
        return this.sagaSessionRepository;
    }

    getName(): string {
        return this.sagaName;
    }

    createSession(arg: ExampleSagaSessionArguments): Promise<ExampleSagaSession> {
        const sagaSession = new ExampleSagaSession(arg);
        return Promise.resolve(sagaSession);
    }
}