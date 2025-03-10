import * as point3Saga from '../Saga/index';
import { Mutex } from 'async-mutex';

export class InMemoryMessageIdempotenceProvider extends point3Saga.api.MessageIdempotenceProvider {
    private lockedKeys: Set<string>;
    private mutex: Mutex;

    constructor() {
        super();

        this.lockedKeys = new Set();
        this.mutex = new Mutex();
    }

    protected async lockKey(messageKey: string): Promise<void> {
        try {
            await this.mutex.acquire();
            if (this.lockedKeys.has(messageKey)) {
                throw new Error(`Message key ${messageKey} is already locked`);
            }

            this.lockedKeys.add(messageKey);
        } finally {
            this.mutex.release();
        }
    }

    protected async releaseKey(messageKey: string): Promise<void> {
        try {
            await this.mutex.acquire();
            this.lockedKeys.delete(messageKey); // 해제되든 말든 알 바 아님
        } finally {
            this.mutex.release();
        }
    }
}
