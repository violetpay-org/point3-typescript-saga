"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryUnitOfWorkFactory = exports.InMemoryUnitOfWork = exports.InMemoryTxContext = void 0;
const main_1 = require("../main");
class InMemoryTxContext {
    constructor() { }
}
exports.InMemoryTxContext = InMemoryTxContext;
class InMemoryUnitOfWork extends main_1.UnitOfWork {
    _beginTxCommand() {
        return Promise.resolve(new InMemoryTxContext());
    }
    _rollbackCommand() {
        return Promise.resolve();
    }
    _commitCommand() {
        return Promise.resolve();
    }
    constructor() {
        super();
    }
    static get unitOfWorkFactory() {
        return exports.InMemoryUnitOfWorkFactory;
    }
}
exports.InMemoryUnitOfWork = InMemoryUnitOfWork;
const InMemoryUnitOfWorkFactory = () => {
    return new InMemoryUnitOfWork();
};
exports.InMemoryUnitOfWorkFactory = InMemoryUnitOfWorkFactory;
//# sourceMappingURL=unitOfWork.js.map