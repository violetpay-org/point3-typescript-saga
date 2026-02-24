export interface TxContext {
}
export type Executable<T extends TxContext> = (txContext: T) => Promise<void>;
export type CombineExecutable<T extends TxContext> = (...args: Executable<T>[]) => Executable<T>;
export declare function BaseCombineExecutable<T extends TxContext>(...args: Executable<T>[]): Executable<T>;
export type UnitOfWorkFactory<T extends TxContext> = () => UnitOfWork<T>;
export declare abstract class UnitOfWork<T extends TxContext> {
    private _executables;
    addToWork(executable: Executable<T>): void;
    protected abstract _beginTxCommand(): Promise<T>;
    protected abstract _rollbackCommand(): Promise<void>;
    protected abstract _commitCommand(): Promise<void>;
    Commit(): Promise<boolean>;
    Rollback(): Promise<void>;
}
