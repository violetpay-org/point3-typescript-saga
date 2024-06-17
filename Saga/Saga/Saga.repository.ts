import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { SagaInstance } from "./Saga";

export interface SagaRepository<Tx extends TxContext> {
    saveTx(saga: SagaInstance): Executable<Tx>;
    load(sagaId: string): Promise<SagaInstance>;
}