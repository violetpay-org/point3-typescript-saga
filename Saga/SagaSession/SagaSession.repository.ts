import { Executable, TxContext } from "../../UnitOfWork/main";
import { SagaSession } from "./SagaSession";

export interface SagaSessionRepository<Tx extends TxContext, I extends SagaSession> {
    saveTx(sagaSession: I): Executable<Tx>;
    load(sagaSessionId: string): Promise<I>;
}