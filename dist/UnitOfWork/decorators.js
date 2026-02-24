"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupOfWorks = exports.THREAD_LOCAL = void 0;
exports.ShallowTransactional = ShallowTransactional;
exports.Transactional = Transactional;
const console_1 = require("console");
const async_hooks_1 = require("async_hooks");
exports.THREAD_LOCAL = new async_hooks_1.AsyncLocalStorage();
function ShallowTransactional(unitOfWorkType, ...args) {
    return function (target, methodName, descriptor) {
        let originalMethod = descriptor.value;
        descriptor.value = async function (...methodArgs) {
            let unitOfWork = exports.THREAD_LOCAL.getStore();
            if (unitOfWork)
                return originalMethod.apply(this, methodArgs);
            unitOfWork = new unitOfWorkType(...args);
            return exports.THREAD_LOCAL.run(unitOfWork, async () => {
                let result;
                try {
                    result = await originalMethod.apply(this, methodArgs);
                    await unitOfWork.Commit();
                    return result;
                }
                catch (e) {
                    await unitOfWork.Rollback();
                    throw e;
                }
            });
        };
        return descriptor;
    };
}
function Transactional(unitOfWorkType, ...args) {
    return function (target, methodName, descriptor) {
        let originalMethod = descriptor.value;
        descriptor.value = async function (...methodArgs) {
            let groupOfWorks = exports.THREAD_LOCAL.getStore();
            if (groupOfWorks) {
                const unitOfWork = new unitOfWorkType(...args);
                groupOfWorks.join(IdFactory(methodName), unitOfWork);
            }
            else {
                groupOfWorks = GroupOfWorks.create(IdFactory(methodName), unitOfWorkType, ...args);
            }
            return exports.THREAD_LOCAL.run(groupOfWorks, async () => {
                let result;
                try {
                    result = await originalMethod.apply(this, methodArgs);
                    await groupOfWorks.Commit();
                    console.log(result);
                    return result;
                }
                catch (e) {
                    await groupOfWorks.Rollback();
                    throw e;
                }
            });
        };
        return descriptor;
    };
}
function IdFactory(methodName) {
    return `${methodName}_${Math.floor(Math.random() * 100)}`;
}
class GroupOfWorks {
    constructor(rootWorkId, rootUnitOfWork) {
        this._FILOWorkIdQueue = [];
        this._unitOfWorks = new Map();
        this._FILOWorkIdQueue.push(rootWorkId);
        this._unitOfWorks.set(rootWorkId, rootUnitOfWork);
    }
    ;
    static create(rootWorkId, unitOfWorkType, ...args) {
        return new GroupOfWorks(rootWorkId, new unitOfWorkType(...args));
    }
    join(workId, uow) {
        this._FILOWorkIdQueue.push(workId);
        this._unitOfWorks.set(workId, uow);
    }
    get DeepestWork() {
        if (this.isWorkEmpty)
            return [undefined, undefined];
        return [
            this._FILOWorkIdQueue[this._FILOWorkIdQueue.length - 1],
            this._unitOfWorks.get(this._FILOWorkIdQueue[this._FILOWorkIdQueue.length - 1])
        ];
    }
    get isWorkEmpty() {
        return this._FILOWorkIdQueue.length == this._unitOfWorks.size &&
            this._unitOfWorks.size == 0 &&
            this._FILOWorkIdQueue.length == 0;
    }
    popWork() {
        (0, console_1.assert)(!this.isWorkEmpty);
        const workId = this._FILOWorkIdQueue.pop();
        const work = this._unitOfWorks.get(workId);
        this._unitOfWorks.delete(workId);
        return [workId, work];
    }
    async Commit() {
        if (this.isWorkEmpty)
            return;
        const [workId, work] = this.DeepestWork;
        try {
            await work.Commit();
            this.popWork();
        }
        catch (e) {
            await work.Rollback();
            throw new Point3TransactionalError(e, workId);
        }
        ;
    }
    ;
    async Rollback() {
        if (this.isWorkEmpty)
            return;
        while (!this.isWorkEmpty) {
            const [_, work] = this.DeepestWork;
            try {
                await work.Rollback();
            }
            catch (e) {
            }
            finally {
                this.popWork();
            }
        }
    }
    ;
}
exports.GroupOfWorks = GroupOfWorks;
class Point3TransactionalError extends Error {
    constructor(e, workId) {
        super(typeof e === 'string' ? e : e.message);
        Error.captureStackTrace(this, this.constructor);
        this.name = "Point3TransactionalError";
        this.message = typeof e == "string" ? e : e.message || "";
        this.workId = workId;
    }
}
//# sourceMappingURL=decorators.js.map