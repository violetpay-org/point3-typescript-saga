import { TxContext, UnitOfWorkFactory } from '../../UnitOfWork/main';
import { AbstractSaga } from './SagaRegistry';
import * as endpoint from '../Endpoint/index';
import * as saga from '../SagaSession/index';
import { AbstractSagaMessage } from '../Endpoint/CommandEndpoint';
export declare abstract class SagaOrchestrator<Tx extends TxContext> {
    private unitOfWorkFactory;
    constructor(unitOfWorkFactory: UnitOfWorkFactory<Tx>);
    startSaga<A extends saga.SagaSessionArguments, I extends saga.SagaSession>(sagaSessionArg: A, saga: AbstractSaga<Tx, A, I>): Promise<void>;
    orchestrate(saga: AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>, messageWithOrigin: endpoint.AbstractSagaMessageWithOrigin<AbstractSagaMessage>): Promise<void>;
    private invocationResponseHandler;
    private isFailureInvocationResponse;
    private retryInvocation;
    private invokeStep;
    private stepForwardAndInvoke;
    private compensationResponseHandler;
    private isFailureCompensationResponse;
    private retryCompensation;
    private stepBackwardAndStartCompensation;
    private compensateStep;
}
export declare class BaseSagaOrchestrator<Tx extends TxContext> extends SagaOrchestrator<Tx> {
    constructor(unitOfWorkFactory: UnitOfWorkFactory<Tx>);
}
