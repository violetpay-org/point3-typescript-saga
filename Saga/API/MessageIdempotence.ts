import { Mutex } from 'async-mutex';
import { AbstractSagaMessage } from '../Endpoint';

class InMemoryKeyLocker {
    private lockedKeys: Set<string>;
    private mutex: Mutex;

    constructor() {
        this.lockedKeys = new Set();
        this.mutex = new Mutex();
    }

    async lock(key: string): Promise<boolean> {
        try {
            await this.mutex.acquire();
            if (this.lockedKeys.has(key)) {
                return false;
            }

            this.lockedKeys.add(key);
            return true;
        } finally {
            this.mutex.release();
        }
    }

    async release(key: string): Promise<boolean> {
        try {
            await this.mutex.acquire();
            if (!this.lockedKeys.has(key)) {
                return false;
            }

            this.lockedKeys.delete(key);
            return true;
        } finally {
            this.mutex.release();
        }
    }
}

export abstract class MessageIdempotenceProvider {
    private keyLocker: InMemoryKeyLocker;

    constructor() {
        this.keyLocker = new InMemoryKeyLocker();
    }

    private async memoryLock(message: AbstractSagaMessage): Promise<boolean> {
        return this.keyLocker.lock(message.getId());
    }

    private async memoryRelease(message: AbstractSagaMessage): Promise<boolean> {
        return this.keyLocker.release(message.getId());
    }

    protected abstract lockKey(messageKey: string): Promise<void>;
    protected abstract releaseKey(messageKey: string): Promise<void>;

    public async lock(message: AbstractSagaMessage): Promise<boolean> {
        try {
            const locked = await this.memoryLock(message);
            if (!locked) {
                return false;
            }

            await this.lockKey(message.getId());
        } catch (e) {
            await this.memoryRelease(message);
            return false;
        }
    }

    public async release(message: AbstractSagaMessage): Promise<void> {
        await this.releaseKey(message.getId());

        await this.memoryRelease(message);
    }
}
