import { PoolConnection } from "mysql2/promise";
import { TxContext, UnitOfWork } from "../main";

export class MySQLTxContext implements TxContext {
    constructor(private connection?: PoolConnection | undefined) { }

    public setConnection(connection: PoolConnection) {
        this.connection = connection
    }

    public get Connection(): PoolConnection | undefined {
        return this.connection
    }
}

/**
 * Unit of Work implementation for MySQL database.
 * 
 * This class integrates with the MySQL2 library to manage transactions.
 * It operates differently from typical Unit of Work pattern in several key ways:
 * 
 * 1. Real-time Execution
 *    - Typical UoW: Collects commands and executes them in batch at transaction end
 *    - Current Implementation: Executes database queries in real-time with each MySQL2 execute call
 * 
 * 2. Connection Management
 *    - Acquires actual MySQL connection immediately when transaction starts
 *    - Maintains connection until transaction completes (commit/rollback)
 * 
 * 3. Transaction Control
 *    - Uses commitTime flag to control actual commit/rollback timing
 *    - Allows transaction completion only after all database operations are finished
 * 
 */
export class MySQLUnitOfWork extends UnitOfWork<MySQLTxContext> {
    private txContext: MySQLTxContext;
    private commitTime: boolean = false;
    constructor(private readonly onRollback: (error?: Error | undefined) => Promise<any>) {
        super(); 
        this.txContext = new MySQLTxContext();
    }

    /**
     * CommitTime indicates whether a commit is currently possible.
     * This variable controls commit/rollback within the database implementation,
     * allowing batch commit/rollback execution once all database write operations
     * are complete.
     */
    public get CommitTime(): boolean {
        return this.commitTime;
    }

    /**
     * Sets the CommitTime status.
     */
    private setCommitTime(value: boolean): void {
        this.commitTime = value;
    }

    /**
     * Returns the database connection currently in use for this transaction.
     */
    public get Connection(): PoolConnection | undefined {
        return this.txContext.Connection;
    }

    /**
     * Sets the database connection to be used for this transaction.
     */
    public setConnection(connection: PoolConnection): void {
        this.txContext.setConnection(connection);
    }

    /**
     * Starts a transaction on the current connection.
     * @throws {Error} if no connection is available.
     */
    public async setTransaction(): Promise<void> {
        if (!this.txContext.Connection) throw new Error("Connection required for transaction.");
        return await this.txContext.Connection?.beginTransaction();
    }

    /**
     * Initializes and returns the transaction context.
     */
    protected async _beginTxCommand(): Promise<MySQLTxContext> {
        this.txContext = new MySQLTxContext();
        return this.txContext;
    }

    /**
     * Rolls back the transaction.
     * Logs and continues if an error occurs.
     */
    protected async _rollbackCommand(): Promise<void> {
        if (!this.Connection) return;

        try {
            await this.Connection.rollback();
        } catch (e) {
            if (!(e instanceof Error)) throw e;
            await this.onRollback(e);
        }
    }

    /**
     * Commits the transaction.
     * Logs and continues if an error occurs.
     */
    protected async _commitCommand(): Promise<void> {
        if (!this.Connection) return;

        await this.Connection.commit();
    }

    /**
     * Commits the transaction and releases the connection.
     * Resets CommitTime to false after completion.
     * @returns {Promise<boolean>} whether commit was successful
     */
    public async Commit(): Promise<boolean> {
        try {
            this.setCommitTime(true);
            await this._commitCommand();

            // Release handled in normal flow, not finally, as rollback may be needed
            this.txContext.Connection?.release();
            return true;
        } catch (e) {
            throw e;
        } finally {
            this.setCommitTime(false);
        }
    }

    public async Rollback(): Promise<void> {
        try {
            this.setCommitTime(true);
            return await this._rollbackCommand();
        } catch (e) {
            throw e
        } finally {
            this.txContext.Connection?.release();
            this.setCommitTime(false);
        }
    }
}