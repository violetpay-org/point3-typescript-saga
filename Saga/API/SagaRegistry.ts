import { TxContext } from "../../UnitOfWork/main";
import { SagaOrchestrator } from "./SagaOrchestrator";
import { ErrDuplicateSaga, ErrEventConsumptionError, ErrSagaNotFound, ErrSagaSessionNotFound, ErrStepNotFound } from "../Errors/index";

import * as endpoint from "../Endpoint/index";
import * as planning from "../SagaPlanning/index";
import * as saga from "../SagaSession/index";
import { randomUUID } from "crypto";
import { Mutex } from "async-mutex";
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
    private registryMutex: Mutex;

    constructor(orchestrator: SagaOrchestrator<Tx>) {
        this.orchestrator = orchestrator;
        this.registryMutex = new Mutex;
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
        const orchestrations = [];

        await this.registryMutex.acquire();
        for (const saga of this.sagas) {
            // If multiple saga is found for the same message, ... (To be described)
            if (saga.hasPublishedSagaWithId(sagaId)) {
                orchestrations.push(async () => {
                    await this.orchestrator.orchestrate(saga, message)
                });
            }
        }
        this.registryMutex.release();

        for (const orchestration of orchestrations) {
            await orchestration();
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
        await this.registryMutex.acquire();
        const saga = this.sagas.find(saga => saga.getName() === sagaName);
        this.registryMutex.release();

        if (!saga || !(saga instanceof sagaClass)) {
            throw ErrSagaNotFound
        }

        await this.orchestrator.startSaga<A, I>(
            sessionArg,
            (saga as AbstractSaga<TxContext, A, I>),
        );
    }
}

export abstract class ChannelToSagaRegistry<M extends endpoint.AbstractSagaMessage, Tx extends TxContext>
    extends endpoint.AbstractChannel<M> {
    private _sagaRegistry: SagaRegistry<Tx>;

    constructor(sagaRegistry: SagaRegistry<Tx>) {
        super();
        this._sagaRegistry = sagaRegistry;
    }

    public async send(command: AbstractSagaMessage): Promise<void> {
        try {
            const commandWithOrigin = this.parseMessageWithOrigin(command as M);
            return this._sagaRegistry.consumeEvent(commandWithOrigin);
        } catch (e) {
            if (e === ErrSagaSessionNotFound || 
                e === ErrStepNotFound ||
                e === ErrSagaNotFound) {
                console.error(e); // this should be sent to a logger
            } else {
                throw ErrEventConsumptionError;
            }
        }
    }
}