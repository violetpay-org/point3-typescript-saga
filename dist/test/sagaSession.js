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
exports.InMemoryExampleSagaSaver = exports.ExampleSagaSession = exports.ExampleSagaSessionArguments = exports.ExampleSagaSessionArguments2 = void 0;
const point3Saga = __importStar(require("../Saga/index"));
const lodash_1 = require("lodash");
class ExampleSagaSessionArguments2 {
    constructor() {
        this._arg2 = 'arg2';
    }
    getArg2() {
        return this._arg2;
    }
}
exports.ExampleSagaSessionArguments2 = ExampleSagaSessionArguments2;
class ExampleSagaSessionArguments {
    constructor() {
        this._arg1 = 'arg1';
    }
    getArg1() {
        return this._arg1;
    }
}
exports.ExampleSagaSessionArguments = ExampleSagaSessionArguments;
class ExampleSagaSession extends point3Saga.saga.SagaSession {
    constructor(sagaId, arg) {
        super(sagaId);
    }
}
exports.ExampleSagaSession = ExampleSagaSession;
class InMemoryExampleSagaSaver {
    constructor() {
        this._sessions = new Map();
    }
    saveTx(sagaSession) {
        return async (tx) => {
            this._sessions.set(sagaSession.getSagaId(), sagaSession);
            console.log(`Saved session ${sagaSession.getSagaId()}`);
        };
    }
    load(sagaSessionId) {
        const deepCopiedSession = (0, lodash_1.cloneDeep)(this._sessions);
        if (!deepCopiedSession.has(sagaSessionId)) {
            console.log(`Session ${sagaSessionId} not found`);
            return Promise.resolve(null);
        }
        return Promise.resolve(deepCopiedSession.get(sagaSessionId));
    }
    getSessions() {
        const deepCopiedSessions = [];
        for (const session of this._sessions.values()) {
            deepCopiedSessions.push((0, lodash_1.cloneDeep)(session));
        }
        return deepCopiedSessions.values();
    }
    getSagaSessionsAsMap() {
        return this._sessions;
    }
}
exports.InMemoryExampleSagaSaver = InMemoryExampleSagaSaver;
//# sourceMappingURL=sagaSession.js.map