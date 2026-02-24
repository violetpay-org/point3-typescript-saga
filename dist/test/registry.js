"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryExampleSagaRegistry = void 0;
const point3Saga = __importStar(require("../Saga/index"));
const memory_1 = require("../UnitOfWork/memory");
const idempotence_1 = require("./idempotence");
class InMemoryExampleSagaRegistry extends point3Saga.api.SagaRegistry {
    constructor() {
        const unitOfWorkFactory = memory_1.InMemoryUnitOfWork.unitOfWorkFactory;
        const sagaOrchestrator = new point3Saga.api.BaseSagaOrchestrator(unitOfWorkFactory);
        const idempotenceProvider = new idempotence_1.InMemoryMessageIdempotenceProvider();
        super(sagaOrchestrator, idempotenceProvider);
    }
}
exports.InMemoryExampleSagaRegistry = InMemoryExampleSagaRegistry;
//# sourceMappingURL=registry.js.map