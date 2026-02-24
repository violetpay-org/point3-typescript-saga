import { TxContext, UnitOfWork, UnitOfWorkFactory } from "../main";
export declare class InMemoryTxContext implements TxContext {
    constructor();
}
export declare class InMemoryUnitOfWork extends UnitOfWork<InMemoryTxContext> {
    protected _beginTxCommand(): Promise<InMemoryTxContext>;
    protected _rollbackCommand(): Promise<void>;
    protected _commitCommand(): Promise<void>;
    constructor();
    static get unitOfWorkFactory(): UnitOfWorkFactory<InMemoryTxContext>;
}
export declare const InMemoryUnitOfWorkFactory: UnitOfWorkFactory<InMemoryTxContext>;
