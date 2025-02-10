import { SagaSession } from './SagaSession';
import { TransactionContext } from '@tranjs/core';

export interface SagaSessionRepository<Tx extends TransactionContext, I extends SagaSession> {
    saveTx(sagaSession: I): Promise<void>;
    load(sagaSessionId: string): Promise<I>;
}
