"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnitOfWork = void 0;
exports.BaseCombineExecutable = BaseCombineExecutable;
function BaseCombineExecutable(...args) {
    return async (txContext) => {
        args.forEach(async (arg) => await arg(txContext));
    };
}
class UnitOfWork {
    constructor() {
        this._executables = [];
    }
    addToWork(executable) {
        this._executables.push(executable);
    }
    async Commit() {
        try {
            const tx = await this._beginTxCommand();
            this._executables.forEach(async (executable) => await executable(tx));
            await this._commitCommand();
            return true;
        }
        catch (error) {
            return false;
        }
        finally {
            await this._rollbackCommand();
        }
    }
    Rollback() {
        return;
    }
}
exports.UnitOfWork = UnitOfWork;
//# sourceMappingURL=main.js.map