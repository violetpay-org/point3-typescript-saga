import { TxContext } from "../../UnitOfWork/main";
import { SagaOrchestrator } from "./SagaOrchestrator";
import { ErrDuplicateSaga, ErrEventConsumptionError, ErrSagaNotFound, ErrStepNotFound } from "../Errors/index";

import * as endpoint from "../Endpoint/index";
import * as planning from "../SagaPlanning/index";
import * as saga from "../SagaSession/index";
import { randomUUID } from "crypto";
import { AbstractSagaMessage } from "../Endpoint/CommandEndpoint";

import { Constructor } from "../../common/syntex";

export abstract class AbstractSaga<
    Tx extends TxContext,
    A extends saga.SagaSessionArguments,
    I extends saga.SagaSession
> {
    abstract getDefinition(): planning.SagaDefinition<Tx>;
    abstract getSagaRepository(): saga.SagaSessionRepository<Tx, I>;
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
    protected sagas: Array<
        AbstractSaga<
            Tx, 
            saga.SagaSessionArguments, 
            saga.SagaSession
        >> = [];
    protected orchestrator: SagaOrchestrator<Tx>;

    constructor(orchestrator: SagaOrchestrator<Tx>) {
        this.orchestrator = orchestrator;
    }

    public hasSagaWithName(sageName: string): boolean {
        return this.sagas.some(saga => saga.getName() === sageName);
    }

    public registerSaga(saga: AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>) {
        if (this.hasSagaWithName(saga.getName())) {
            throw ErrDuplicateSaga;
        }

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
            console.error(error);
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