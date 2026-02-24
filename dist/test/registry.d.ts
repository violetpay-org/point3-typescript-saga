import * as point3Saga from '../Saga/index';
import { InMemoryTxContext } from '../UnitOfWork/memory';
export declare class InMemoryExampleSagaRegistry extends point3Saga.api.SagaRegistry<InMemoryTxContext> {
    constructor();
}
