import { TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { SagaOrchestrator } from "./SagaOrchestrator";
import { ErrEventConsumptionError, ErrSagaNotFound, ErrStepNotFound } from "../Errors";

import { endpoint } from "../Endpoint";
import { saga, sagaDefinition, sagaRepository } from "../Saga";
import { randomUUID } from "crypto";
import { AbstractSagaMessage } from "../Endpoint/CommandEndpoint";


export interface SagaNameAndIdConvention {
    makeSagaIdFromName(sagaName: string): string;
    getSagaNameFromId(sagaId: string): string;
}

export abstract class AbstractSaga<
    Tx extends TxContext,
    A extends saga.SagaSessionArguments,
    I extends saga.SagaSession
> {
    abstract getDefinition(): sagaDefinition.SagaDefinition<Tx>;
    abstract getSagaRepository(): sagaRepository.SagaSessionRepository<Tx, I>;
    abstract getName(): string;
    abstract createSession(arg: A): Promise<I>

    public makeSagaId(): string {
        return this.getName() + "-" + randomUUID();
    };

    public getSagaNameFromId(sagaId: string): string {
        return sagaId.split("-")[0];
    };

    public hasPublishedSagaWithId(sagaId: string): boolean {
        const sagaName = this.getSagaNameFromId(sagaId);
        return this.getName() === sagaName;
    }
}

export class SagaRegistry<Tx extends TxContext> {
    protected sagas: Array<AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>> = [];
    protected orchestrator: SagaOrchestrator<Tx>;

    constructor(orchestrator: SagaOrchestrator<Tx>) {
        this.orchestrator = orchestrator;
    }

    public registerSaga(saga: AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>) {
        this.sagas.push(saga);
    }

    public async consumeEvent<M extends endpoint.AbstractSagaMessageWithOrigin<AbstractSagaMessage>>(message: M) {
        const sagaId = message.getSagaMessage().getSagaId();
        try {
            for (const saga of this.sagas) {
                // If multiple saga is found for the same message, 
                if (saga.hasPublishedSagaWithId(sagaId)) {
                    await this.orchestrator.orchestrate(saga, message);
                }
            }
        } catch (error) {
            throw ErrEventConsumptionError;
        }
    }

    public async startSaga<
        Tx extends TxContext,
        A extends saga.SagaSessionArguments,
        I extends saga.SagaSession,
    >(
        sagaName: string,
        sessionArg: A,
        sessionClass: Constructor<AbstractSaga<Tx, A, I>>,
    ) {
        const saga = this.sagas.find(saga => saga.getName() === sagaName);

        if (!saga || !(saga instanceof sessionClass)) {
            throw ErrSagaNotFound
        }

        await this.orchestrator.startSaga<A, I>(
            sessionArg,
            (saga as AbstractSaga<TxContext, A, I>),
        );
    }
}