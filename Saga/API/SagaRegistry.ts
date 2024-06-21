import { TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { SagaOrchestrator } from "./SagaOrchestrator";
import { ErrEventConsumptionError, ErrSagaNotFound, ErrStepNotFound } from "../Errors";

import { endpoint } from "../Endpoint";
import { definition } from "../SagaPlanning";
import * as saga from "../SagaSession";
import { randomUUID } from "crypto";
import { AbstractSagaMessage } from "../Endpoint/CommandEndpoint";

import { Constructor } from "../../common/syntex";


export interface SagaNameAndIdConvention {
    makeSagaIdFromName(sagaName: string): string;
    getSagaNameFromId(sagaId: string): string;
}

export abstract class AbstractSaga<
    Tx extends TxContext,
    A extends saga.session.SagaSessionArguments,
    I extends saga.session.SagaSession
> {
    abstract getDefinition(): definition.SagaDefinition<Tx>;
    abstract getSagaRepository(): saga.repository.SagaSessionRepository<Tx, I>;
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
    protected sagas: Array<AbstractSaga<Tx, saga.session.SagaSessionArguments, saga.session.SagaSession>> = [];
    protected orchestrator: SagaOrchestrator<Tx>;

    constructor(orchestrator: SagaOrchestrator<Tx>) {
        this.orchestrator = orchestrator;
    }

    public registerSaga(saga: AbstractSaga<Tx, saga.session.SagaSessionArguments, saga.session.SagaSession>) {
        this.sagas.push(saga);
    }

    public async consumeEvent<M extends endpoint.AbstractSagaMessageWithOrigin<AbstractSagaMessage>>(message: M) {
        const sagaId = message.getSagaMessage().getSagaId();
        try {
            for (const saga of this.sagas) {
                // If multiple saga is found for the same message, ... (To be described)
                if (saga.hasPublishedSagaWithId(sagaId)) {
                    await this.orchestrator.orchestrate(saga, message);
                }
            }
        } catch (error) {
            console.error(`Error consuming event ${message.getSagaMessage().getSagaId()}`);
            throw ErrEventConsumptionError;
        }
    }

    public async startSaga<
        Tx extends TxContext,
        A extends saga.session.SagaSessionArguments,
        I extends saga.session.SagaSession,
    >(
        sagaName: string,
        sessionArg: A,
        sagaClass: Constructor<AbstractSaga<Tx, A, I>>,
    ) {
        const saga = this.sagas.find(saga => saga.getName() === sagaName);

        if (!saga || !(saga instanceof sagaClass)) {
            throw ErrSagaNotFound
        }

        await this.orchestrator.startSaga<A, I>(
            sessionArg,
            (saga as AbstractSaga<TxContext, A, I>),
        );
    }
}