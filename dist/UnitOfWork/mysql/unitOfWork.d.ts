import { PoolConnection } from "mysql2/promise";
import { TxContext, UnitOfWork } from "../main";
export declare class MySQLTxContext implements TxContext {
    private connection?;
    constructor(connection?: PoolConnection | undefined);
    setConnection(connection: PoolConnection): void;
    get Connection(): PoolConnection | undefined;
}
export declare class MySQLUnitOfWork extends UnitOfWork<MySQLTxContext> {
    private readonly onRollback;
    private txContext;
    private commitTime;
    constructor(onRollback: (error?: Error | undefined) => Promise<any>);
    get CommitTime(): boolean;
    private setCommitTime;
    get Connection(): PoolConnection | undefined;
    setConnection(connection: PoolConnection): void;
    setTransaction(): Promise<void>;
    protected _beginTxCommand(): Promise<MySQLTxContext>;
    protected _rollbackCommand(): Promise<void>;
    protected _commitCommand(): Promise<void>;
    Commit(): Promise<boolean>;
    Rollback(): Promise<void>;
}
