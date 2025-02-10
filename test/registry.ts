import * as point3Saga from '../Saga/index';
import { InMemoryMessageIdempotenceProvider } from './idempotence';
import { InMemoryTransactionContext } from '../Saga/Endpoint';

export class InMemoryExampleSagaRegistry extends point3Saga.api.SagaRegistry<InMemoryTransactionContext> {
    constructor() {
        const sagaOrchestrator = new point3Saga.api.BaseSagaOrchestrator();
        const idempotenceProvider = new InMemoryMessageIdempotenceProvider();
        super(sagaOrchestrator, idempotenceProvider);
    }
}
