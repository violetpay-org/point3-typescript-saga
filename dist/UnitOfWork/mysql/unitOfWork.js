"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MySQLUnitOfWork = exports.MySQLTxContext = void 0;
const main_1 = require("../main");
class MySQLTxContext {
    constructor(connection) {
        this.connection = connection;
    }
    setConnection(connection) {
        this.connection = connection;
    }
    get Connection() {
        return this.connection;
    }
}
exports.MySQLTxContext = MySQLTxContext;
class MySQLUnitOfWork extends main_1.UnitOfWork {
    constructor(onRollback) {
        super();
        this.onRollback = onRollback;
        this.commitTime = false;
        this.txContext = new MySQLTxContext();
    }
    get CommitTime() {
        return this.commitTime;
    }
    setCommitTime(value) {
        this.commitTime = value;
    }
    get Connection() {
        return this.txContext.Connection;
    }
    setConnection(connection) {
        this.txContext.setConnection(connection);
    }
    async setTransaction() {
        if (!this.txContext.Connection)
            throw new Error("Connection required for transaction.");
        return await this.txContext.Connection?.beginTransaction();
    }
    async _beginTxCommand() {
        this.txContext = new MySQLTxContext();
        return this.txContext;
    }
    async _rollbackCommand() {
        if (!this.Connection)
            return;
        try {
            await this.Connection.rollback();
        }
        catch (e) {
            if (!(e instanceof Error))
                throw e;
            await this.onRollback(e);
        }
    }
    async _commitCommand() {
        if (!this.Connection)
            return;
        await this.Connection.commit();
    }
    async Commit() {
        try {
            this.setCommitTime(true);
            await this._commitCommand();
            this.txContext.Connection?.release();
            return true;
        }
        catch (e) {
            throw e;
        }
        finally {
            this.setCommitTime(false);
        }
    }
    async Rollback() {
        try {
            this.setCommitTime(true);
            return await this._rollbackCommand();
        }
        catch (e) {
            throw e;
        }
        finally {
            this.txContext.Connection?.release();
            this.setCommitTime(false);
        }
    }
}
exports.MySQLUnitOfWork = MySQLUnitOfWork;
//# sourceMappingURL=unitOfWork.js.map