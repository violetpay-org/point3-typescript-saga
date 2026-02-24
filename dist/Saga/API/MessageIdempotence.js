"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MessageIdempotenceProvider = void 0;
const async_mutex_1 = require("async-mutex");
class InMemoryKeyLocker {
    constructor() {
        this.lockedKeys = new Set();
        this.mutex = new async_mutex_1.Mutex();
    }
    async lock(key) {
        try {
            await this.mutex.acquire();
            if (this.lockedKeys.has(key)) {
                return false;
            }
            this.lockedKeys.add(key);
            return true;
        }
        finally {
            this.mutex.release();
        }
    }
    async release(key) {
        try {
            await this.mutex.acquire();
            if (!this.lockedKeys.has(key)) {
                return false;
            }
            this.lockedKeys.delete(key);
            return true;
        }
        finally {
            this.mutex.release();
        }
    }
}
class MessageIdempotenceProvider {
    constructor() {
        this.keyLocker = new InMemoryKeyLocker();
    }
    async memoryLock(message) {
        return this.keyLocker.lock(message.getId());
    }
    async memoryRelease(message) {
        return this.keyLocker.release(message.getId());
    }
    async lock(message) {
        try {
            const lockSucceed = await this.memoryLock(message);
            if (!lockSucceed) {
                return false;
            }
            await this.lockKey(message.getId());
            return true;
        }
        catch (e) {
            await this.memoryRelease(message);
            return false;
        }
    }
    async release(message) {
        await this.releaseKey(message.getId());
        await this.memoryRelease(message);
    }
}
exports.MessageIdempotenceProvider = MessageIdempotenceProvider;
//# sourceMappingURL=MessageIdempotence.js.map