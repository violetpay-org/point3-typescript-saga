import * as point3Saga from "../Saga";
import { InMemoryTxContext, InMemoryUnitOfWork } from "../UnitOfWork/inMemory";

export class ExampleInMemorySagaRegistry extends point3Saga.api.registry.SagaRegistry<InMemoryTxContext> {
    constructor() {
        const unitOfWorkFactory = InMemoryUnitOfWork.unitOfWorkFactory;
        const sagaOrchestrator = new point3Saga.api.orchestrator.BaseSagaOrchestrator(unitOfWorkFactory);
        super(sagaOrchestrator);
    }
}