import { Mutex } from "async-mutex";

export class ThreadSafeMap<K, V> {
    private _mutex = new Mutex();
    private _map = new Map<K, V>();

    constructor() {}
    
    async clear(): Promise<void> {
        await this._mutex.acquire();
        try {
            this._map.clear();
        } finally {
            this._mutex.release();
        }
    }

    async delete(key: K): Promise<boolean> {
        await this._mutex.acquire();
        try {
            return this._map.delete(key);
        } finally {
            this._mutex.release();
        }
    }

    async get(key: K): Promise<V> {
        await this._mutex.acquire();
        try {
            return this._map.get(key);
        } finally {
            this._mutex.release();
        }
    }

    async has(key: K): Promise<boolean> {
        await this._mutex.acquire();
        try {
            return this._map.has(key);
        } finally {
            this._mutex.release();
        }
    }

    async set(key: K, value: V): Promise<this> {
        await this._mutex.acquire();
        try {
            this._map.set(key, value);
            return this;
        } finally {
            this._mutex.release();
        }
    }

    async keys(): Promise<IterableIterator<K>> {
        await this._mutex.acquire();
        try {
            return this._map.keys();
        } finally {
            this._mutex.release();
        }
    }

    async values(): Promise<IterableIterator<V>> {
        await this._mutex.acquire();
        try {
            return this._map.values();
        } finally {
            this._mutex.release();
        }
    }
}