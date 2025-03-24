import { PoolConnection, Pool, ConnectionOptions, PreparedStatementInfo, QueryOptions, createPool, PoolOptions } from "mysql2/promise";
import { UnitOfWork } from "../main";
import { MySQLUnitOfWork } from "./unitOfWork";
import { GroupOfWorks, THREAD_LOCAL } from "../decorators";

/**
 * Creates and returns a customized MySQL Pool for transaction management.
 * 
 * This function differs from a regular MySQL Pool in the following ways:
 * 
 * 1. Transaction Context Management
 *    - Reuses a single connection within transaction scope using Unit of Work pattern
 *    - Propagates transaction context through THREAD_LOCAL
 * 
 * 2. Connection Lifecycle Management
 *    - Inside transaction: Connection is maintained until transaction completes
 *    - Outside transaction: Behaves like regular pool
 * 
 * 3. Transaction Operation Control
 *    - beginTransaction: Ignored within transaction (uses existing transaction)
 *    - commit/rollback: Execution determined by CommitTime flag
 *    - release: Execution determined by CommitTime flag
 * 
 * Key Decision Points:
 * - isUnitOfWorkInThreadLocal() checks for current transaction context
 * - No transaction: Regular pool behavior
 * - With transaction: Uses single connection from UnitOfWork
 * 
 * @param configOrConnectionUri - MySQL connection config or URI. Can be provided in two forms:
 *   1. Connection string (string): 'mysql://user:password@localhost/db' format
 *   2. Configuration object (PoolOptions):
 *      - host: Host address
 *      - user: Username
 *      - password: Password
 *      - database: Database name
 *      - port: Port number (optional)
 *      - connectionLimit: Max connections (optional)
 *      - All other settings supported by mysql2 PoolOptions
 * @returns Customized MySQL Pool instance
 * 
 * @example
 * ```typescript
 * // 1. Create pool with config object
 * const pool = createUnitOfWorkPool({
 *   host: 'localhost',
 *   user: 'user',
 *   password: 'password',
 *   database: 'db',
 *   connectionLimit: 10
 * });
 * 
 * // 2. Create pool with connection string
 * const pool = createUnitOfWorkPool('mysql://user:password@localhost/db');
 * ```
 */
export function createUnitOfWorkPool(connectionUri: string): Pool;
export function createUnitOfWorkPool(config: PoolOptions): Pool;
export function createUnitOfWorkPool(configOrConnectionUri: string | PoolOptions): Pool {
    let pool: Pool;
    if (typeof configOrConnectionUri === 'string') {
        pool = createPool(configOrConnectionUri);
    } else {
        pool = createPool(configOrConnectionUri);
    }
    
    // Store original methods before overriding
    const originalConnect = pool.connect;
    const originalPing = pool.ping;
    const originalBeginTransaction = pool.beginTransaction;
    const originalCommit = pool.commit;
    const originalRollback = pool.rollback;
    const originalChangeUser = pool.changeUser;
    const originalPrepare = pool.prepare;
    const originalUnprepare = pool.unprepare;
    const originalEnd = pool.end;
    const originalDestroy = pool.destroy;
    const originalPause = pool.pause;
    const originalResume = pool.resume;
    const originalEscape = pool.escape;
    const originalEscapeId = pool.escapeId;
    const originalFormat = pool.format;
    const originalGetConnection = pool.getConnection;
    const originalReleaseConnection = pool.releaseConnection;

    // Override with wrapped methods
    pool.connect = connect.bind(pool);
    pool.ping = ping.bind(pool);
    pool.beginTransaction = beginTransaction.bind(pool);
    pool.commit = commit.bind(pool);
    pool.rollback = rollback.bind(pool);
    pool.changeUser = changeUser.bind(pool);
    pool.prepare = prepare.bind(pool);
    pool.unprepare = unprepare.bind(pool);
    pool.end = end.bind(pool);
    pool.destroy = destroy.bind(pool);
    pool.pause = pause.bind(pool);
    pool.resume = resume.bind(pool);
    pool.escape = escape.bind(pool);
    pool.escapeId = escapeId.bind(pool);
    pool.format = format.bind(pool);
    pool.getConnection = getConnection.bind(pool);
    pool.releaseConnection = releaseConnection.bind(pool);

    async function connect(): Promise<void> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalConnect.call(pool);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }

        return await unitOfWork.Connection!.connect();
    };

    async function ping(): Promise<void> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalPing.call(pool);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }

        return await unitOfWork.Connection!.ping();
    }

    async function beginTransaction(): Promise<void> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalBeginTransaction.call(pool);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }
    }

    async function commit(): Promise<void> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalCommit.call(pool);
        }
        
        return;
    }

    async function rollback(): Promise<void> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalRollback.call(pool);
        }

        return;
    }

    async function changeUser(options: ConnectionOptions): Promise<void> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalChangeUser.call(pool, options);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }

        return await unitOfWork.Connection!.changeUser(options);
    }

    async function prepare(options: string | QueryOptions): Promise<PreparedStatementInfo> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalPrepare.call(pool, options);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }

        return await unitOfWork.Connection!.prepare(options);
    }

    function unprepare(sql: string | QueryOptions): void {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalUnprepare.call(pool, sql);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }

        return unitOfWork.Connection!.unprepare(sql);
    }

    async function end(options?: any): Promise<void> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalEnd.call(pool);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }

        return await unitOfWork.Connection!.end(options);
    }

    function destroy(): void {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalDestroy.call(pool);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }

        return unitOfWork.Connection!.destroy();
    }

    function pause(): void {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalPause.call(pool);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }

        return unitOfWork.Connection!.pause();
    }

    function resume(): void {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalResume.call(pool);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }

        return unitOfWork.Connection!.resume();
    }

    function escape(value: any): string {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalEscape.call(pool, value);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }

        return unitOfWork.Connection!.escape(value);
    }

    function escapeId(value: string | string[]): string {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalEscapeId.call(pool, value);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }

        if (Array.isArray(value)) {
            return unitOfWork.Connection!.escapeId(value);
        } else {
            return unitOfWork.Connection!.escapeId(value);
        }
    }

    function format(sql: string, values?: any | any[] | { [param: string]: any }): string {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalFormat.call(pool, sql, values);
        }

        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }

        return unitOfWork.Connection!.format(sql, values);
    }

    async function getConnection(): Promise<PoolConnection> {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalGetConnection.call(pool);
        }
    
        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();

        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            await conn.beginTransaction();
            unitOfWork.setConnection(CustomConnection(conn));
        }

        return unitOfWork.Connection!;
    };

    function releaseConnection(connection: PoolConnection): void {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalReleaseConnection.call(pool, connection);
        }

        // 만약 UOW를 사용하고 있었으면, @Transactional 에서 release 해야함
        return;
    }

    return pool;
}

function CustomConnection(conn: PoolConnection): PoolConnection {
    
    // Store original methods before overriding
    const originalBeginTransaction = conn.beginTransaction;
    const originalRelease = conn.release;
    const originalCommit = conn.commit; 
    const originalRollback = conn.rollback;

    // Override with wrapped methods
    conn.beginTransaction = beginTransaction.bind(conn);
    conn.release = release.bind(conn);
    conn.commit = commit.bind(conn);
    conn.rollback = rollback.bind(conn);
    
    return conn;

    async function beginTransaction(): Promise<void> { return; }
    
    async function commit(): Promise<void> {
        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();
        if (!unitOfWork) {
            console.trace('Current stack trace for DeepestWork access');    
            return
        }
        if (!unitOfWork || !unitOfWork.CommitTime) {
            // console.trace('Current stack trace for DeepestWork access');
            return;
        };

        return await originalCommit.call(conn);
    }
    
    async function rollback(): Promise<void> { 
        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();
        if (!unitOfWork || !unitOfWork.CommitTime) return;

        return await originalRollback.call(conn);
    }

    function release(): void {
        const unitOfWork = getUnitOfWorkFromThreadLocal<MySQLUnitOfWork>();
        if (!unitOfWork || !unitOfWork.CommitTime) return;

        return originalRelease.call(conn);
    }
}

function isUnitOfWorkInThreadLocal(): boolean {
    return (THREAD_LOCAL.getStore() instanceof GroupOfWorks || THREAD_LOCAL.getStore() instanceof UnitOfWork)
}

function getUnitOfWorkFromThreadLocal<U extends UnitOfWork<any>>(): U | undefined {
    const [_, work]= (THREAD_LOCAL.getStore() as GroupOfWorks).DeepestWork;
    return work as U | undefined
}
