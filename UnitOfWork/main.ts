export interface TxContext {}

export type Executable<T extends TxContext> = (txContext: T) => Promise<void>;
export type CombineExecutable<T extends TxContext> = (...args: Executable<T>[]) => Executable<T>;

// Basic implementation of a CombineExecutable
// Order matters, so the executables are executed in the order they are passed in.
export function BaseCombineExecutable<T extends TxContext>(...args: Executable<T>[]): Executable<T> {
    return async (txContext: T) => {
        args.forEach(async (arg) => await arg(txContext));
    }
}


export type UnitOfWorkFactory<T extends TxContext> = () => UnitOfWork<T>;

export abstract class UnitOfWork<T extends TxContext> {
    private _executables: Array<Executable<T>> = [];

    /**
     * Adds an executable to the unit of work.
     * It is not executed until the unit of work is committed.
     * @param executable 
     */
    public addToWork(executable: Executable<T>) {
        this._executables.push(executable);
    }

    /** 
     * Begins a transaction.
     * This method should be implemented by the concrete class.
     */
    protected abstract _beginTxCommand(): Promise<T>;

    /**
     * Rolls back the transaction.
     * This method should be implemented by the concrete class.
     */
    protected abstract _rollbackCommand(): Promise<void>;

    /**
     * Commits the transaction.
     * This method should be implemented by the concrete class.
     */
    protected abstract _commitCommand(): Promise<void>;

    /**
     * Commits the unit of work.
     * This never throws an error, but returns a boolean indicating success.
     * @returns true if the commit was successful, false otherwise
     */
    public async Commit(): Promise<boolean> {
        try {
            const tx = await this._beginTxCommand();
            this._executables.forEach(async (executable) => await executable(tx))
            await this._commitCommand();
            return true;
        } catch (error) {
            return false;
        } finally {
            await this._rollbackCommand();
        }
    }
}