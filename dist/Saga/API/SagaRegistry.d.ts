import { TxContext } from '../../UnitOfWork/main';
import { SagaOrchestrator } from './SagaOrchestrator';
import * as endpoint from '../Endpoint/index';
import * as planning from '../SagaPlanning/index';
import * as saga from '../SagaSession/index';
import { AbstractSagaMessage } from '../Endpoint';
import { Constructor } from '../../common/syntex';
import { MessageIdempotenceProvider } from './MessageIdempotence';
export declare abstract class AbstractSaga<Tx extends TxContext, A extends saga.SagaSessionArguments, I extends saga.SagaSession> {
    abstract getDefinition(): planning.SagaDefinition<Tx>;
    abstract getSagaRepository(): saga.SagaSessionRepository<Tx, I>;
    abstract getName(): string;
    abstract createSession(arg: A): Promise<I>;
    makeSagaId(): string;
    getSagaNameFromId(sagaId: string): string;
    hasPublishedSagaWithId(sagaId: string): boolean;
}
export declare class SagaRegistry<Tx extends TxContext> {
    protected sagas: Array<AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>>;
    protected orchestrator: SagaOrchestrator<Tx>;
    private messageIdempotence;
    private registryMutex;
    constructor(orchestrator: SagaOrchestrator<Tx>, idempotenceProvider?: MessageIdempotenceProvider);
    hasSagaWithName(sageName: string): boolean;
    registerSaga(saga: AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>): void;
    consumeEvent<M extends endpoint.AbstractSagaMessageWithOrigin<AbstractSagaMessage>>(message: M): Promise<void>;
    startSaga<Tx extends TxContext, A extends saga.SagaSessionArguments, I extends saga.SagaSession>(sagaName: string, sessionArg: A, sagaClass: Constructor<AbstractSaga<Tx, A, I>>): Promise<void>;
}
export declare abstract class ChannelToSagaRegistry<M extends endpoint.AbstractSagaMessage, Tx extends TxContext> extends endpoint.AbstractChannel<M> {
    private _sagaRegistry;
    constructor(sagaRegistry: SagaRegistry<Tx>);
    send(command: AbstractSagaMessage): Promise<void>;
}
