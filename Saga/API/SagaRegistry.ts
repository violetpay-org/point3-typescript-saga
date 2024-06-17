import { TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { SagaOrchestrator } from "./SagaOrchestrator";
import { ErrSagaNotFound, ErrStepNotFound } from "../Errors";

import { endpoint } from "../Endpoint";
import { saga, stepBuilder, step, sagaDefinition, sagaRepository } from "../Saga";


interface SagaNameAndIdConvention {
    makeSagaIdFromName(sagaName: string): string;
    getSagaNameFromId(sagaId: string): string;
}

export abstract class AbstractSaga<Tx extends TxContext, A extends saga.SagaCreationArguments, I extends saga.SagaSession> {
    abstract getDefinition(): sagaDefinition.SagaDefinition<I, Tx>;
    abstract getSagaRepository(): sagaRepository.SagaSessionRepository<Tx>;
    abstract getName(): string;
    protected sagaNameIdConvention: Constructor<SagaNameAndIdConvention>;
    
    public hasPublishedSagaWithId(sagaId: string): boolean {
        const sagaName = new this.sagaNameIdConvention().getSagaNameFromId(sagaId);
        return this.getName() === sagaName;
    }

    public abstract createSaga(arg: A): Promise<saga.SagaSession>
}

export class SagaRegistry<Tx extends TxContext> {
    protected sagas: Array<AbstractSaga<Tx, saga.SagaCreationArguments, saga.SagaSession>> = [];
    protected orchestrator: SagaOrchestrator<Tx>;

    constructor(orchestrator: SagaOrchestrator<Tx>) {
        this.orchestrator = orchestrator;
    }

    public registerSaga(saga: AbstractSaga<Tx, saga.SagaCreationArguments, saga.SagaSession>) {
        this.sagas.push(saga);
    }

    public async consumeEvent<M extends endpoint.AbstractSagaMessageWithOrigin>(message: M) {
        const sagaId = message.getSagaId();

        for (const saga of this.sagas) {
            if (saga.hasPublishedSagaWithId(sagaId)) {
                await this.orchestrator.orchestrate(saga, message);
            }
        }
    }

    public async startSaga<
        A extends saga.SagaCreationArguments, 
        I extends saga.SagaSession, 
        S extends AbstractSaga<Tx, A, I>
    >(
        sagaClass: Constructor<S>,
        sagaName: string,
        arg: A
    ) {
        const saga = this.sagas.find(saga => saga.getName() === sagaName);

        if (!saga || !(saga instanceof sagaClass)) {
            throw ErrSagaNotFound
        }

        await this.orchestrator.startSaga<A, I>(saga, arg);
    }
}