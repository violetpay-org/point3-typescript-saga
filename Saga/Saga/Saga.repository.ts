import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { SagaSession } from "./Saga";

export interface SagaSessionRepository<Tx extends TxContext, I extends SagaSession> {
    saveTx(sagaSession: I): Executable<Tx>;
    load(sagaSessionId: string): Promise<I>;
}