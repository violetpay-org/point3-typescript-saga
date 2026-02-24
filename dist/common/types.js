"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreadSafeMap = void 0;
const async_mutex_1 = require("async-mutex");
class ThreadSafeMap {
    constructor() {
        this._mutex = new async_mutex_1.Mutex();
        this._map = new Map();
    }
    async clear() {
        await this._mutex.acquire();
        try {
            this._map.clear();
        }
        finally {
            this._mutex.release();
        }
    }
    async delete(key) {
        await this._mutex.acquire();
        try {
            return this._map.delete(key);
        }
        finally {
            this._mutex.release();
        }
    }
    async get(key) {
        await this._mutex.acquire();
        try {
            return this._map.get(key);
        }
        finally {
            this._mutex.release();
        }
    }
    async has(key) {
        await this._mutex.acquire();
        try {
            return this._map.has(key);
        }
        finally {
            this._mutex.release();
        }
    }
    async set(key, value) {
        await this._mutex.acquire();
        try {
            this._map.set(key, value);
            return this;
        }
        finally {
            this._mutex.release();
        }
    }
    async keys() {
        await this._mutex.acquire();
        try {
            return this._map.keys();
        }
        finally {
            this._mutex.release();
        }
    }
    async values() {
        await this._mutex.acquire();
        try {
            return this._map.values();
        }
        finally {
            this._mutex.release();
        }
    }
}
exports.ThreadSafeMap = ThreadSafeMap;
//# sourceMappingURL=types.js.map