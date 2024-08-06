import * as point3Saga from '../Saga/index';
import { InMemoryTxContext, InMemoryUnitOfWork } from '../UnitOfWork/inMemory';
import { InMemoryMessageIdempotenceProvider } from './idempotence';

export class InMemoryExampleSagaRegistry extends point3Saga.api.SagaRegistry<InMemoryTxContext> {
    constructor() {
        const unitOfWorkFactory = InMemoryUnitOfWork.unitOfWorkFactory;
        const sagaOrchestrator = new point3Saga.api.BaseSagaOrchestrator(unitOfWorkFactory);
        const idempotenceProvider = new InMemoryMessageIdempotenceProvider();
        super(sagaOrchestrator, idempotenceProvider);
    }
}
