"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUnitOfWorkPool = createUnitOfWorkPool;
const promise_1 = require("mysql2/promise");
const main_1 = require("../main");
const decorators_1 = require("../decorators");
function createUnitOfWorkPool(configOrConnectionUri) {
    let pool;
    if (typeof configOrConnectionUri === 'string') {
        pool = (0, promise_1.createPool)(configOrConnectionUri);
    }
    else {
        pool = (0, promise_1.createPool)(configOrConnectionUri);
    }
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
    async function connect() {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalConnect.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }
        return await unitOfWork.Connection.connect();
    }
    ;
    async function ping() {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalPing.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }
        return await unitOfWork.Connection.ping();
    }
    async function beginTransaction() {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalBeginTransaction.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }
    }
    async function commit() {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalCommit.call(pool);
        }
        return;
    }
    async function rollback() {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalRollback.call(pool);
        }
        return;
    }
    async function changeUser(options) {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalChangeUser.call(pool, options);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }
        return await unitOfWork.Connection.changeUser(options);
    }
    async function prepare(options) {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalPrepare.call(pool, options);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }
        return await unitOfWork.Connection.prepare(options);
    }
    function unprepare(sql) {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalUnprepare.call(pool, sql);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }
        return unitOfWork.Connection.unprepare(sql);
    }
    async function end(options) {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalEnd.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            unitOfWork.setConnection(conn);
            await unitOfWork.setTransaction();
        }
        return await unitOfWork.Connection.end(options);
    }
    function destroy() {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalDestroy.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }
        return unitOfWork.Connection.destroy();
    }
    function pause() {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalPause.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }
        return unitOfWork.Connection.pause();
    }
    function resume() {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalResume.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }
        return unitOfWork.Connection.resume();
    }
    function escape(value) {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalEscape.call(pool, value);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }
        return unitOfWork.Connection.escape(value);
    }
    function escapeId(value) {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalEscapeId.call(pool, value);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }
        if (Array.isArray(value)) {
            return unitOfWork.Connection.escapeId(value);
        }
        else {
            return unitOfWork.Connection.escapeId(value);
        }
    }
    function format(sql, values) {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalFormat.call(pool, sql, values);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            throw new Error('No connection available');
        }
        return unitOfWork.Connection.format(sql, values);
    }
    async function getConnection() {
        if (!isUnitOfWorkInThreadLocal()) {
            return await originalGetConnection.call(pool);
        }
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork.Connection) {
            const conn = await originalGetConnection.call(pool);
            await conn.beginTransaction();
            unitOfWork.setConnection(CustomConnection(conn));
        }
        return unitOfWork.Connection;
    }
    ;
    function releaseConnection(connection) {
        if (!isUnitOfWorkInThreadLocal()) {
            return originalReleaseConnection.call(pool, connection);
        }
        return;
    }
    return pool;
}
function CustomConnection(conn) {
    const originalBeginTransaction = conn.beginTransaction;
    const originalRelease = conn.release;
    const originalCommit = conn.commit;
    const originalRollback = conn.rollback;
    conn.beginTransaction = beginTransaction.bind(conn);
    conn.release = release.bind(conn);
    conn.commit = commit.bind(conn);
    conn.rollback = rollback.bind(conn);
    return conn;
    async function beginTransaction() { return; }
    async function commit() {
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork) {
            console.trace('Current stack trace for DeepestWork access');
            return;
        }
        if (!unitOfWork || !unitOfWork.CommitTime) {
            return;
        }
        ;
        return await originalCommit.call(conn);
    }
    async function rollback() {
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork || !unitOfWork.CommitTime)
            return;
        return await originalRollback.call(conn);
    }
    function release() {
        const unitOfWork = getUnitOfWorkFromThreadLocal();
        if (!unitOfWork || !unitOfWork.CommitTime)
            return;
        return originalRelease.call(conn);
    }
}
function isUnitOfWorkInThreadLocal() {
    return (decorators_1.THREAD_LOCAL.getStore() instanceof decorators_1.GroupOfWorks || decorators_1.THREAD_LOCAL.getStore() instanceof main_1.UnitOfWork);
}
function getUnitOfWorkFromThreadLocal() {
    const [_, work] = decorators_1.THREAD_LOCAL.getStore().DeepestWork;
    return work;
}
//# sourceMappingURL=pool.js.map