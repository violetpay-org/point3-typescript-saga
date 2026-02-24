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
exports.InMemoryMessageIdempotenceProvider = void 0;
const point3Saga = __importStar(require("../Saga/index"));
const async_mutex_1 = require("async-mutex");
class InMemoryMessageIdempotenceProvider extends point3Saga.api.MessageIdempotenceProvider {
    constructor() {
        super();
        this.lockedKeys = new Set();
        this.mutex = new async_mutex_1.Mutex();
    }
    async lockKey(messageKey) {
        try {
            await this.mutex.acquire();
            if (this.lockedKeys.has(messageKey)) {
                throw new Error(`Message key ${messageKey} is already locked`);
            }
            this.lockedKeys.add(messageKey);
        }
        finally {
            this.mutex.release();
        }
    }
    async releaseKey(messageKey) {
        try {
            await this.mutex.acquire();
            this.lockedKeys.delete(messageKey);
        }
        finally {
            this.mutex.release();
        }
    }
}
exports.InMemoryMessageIdempotenceProvider = InMemoryMessageIdempotenceProvider;
//# sourceMappingURL=idempotence.js.map