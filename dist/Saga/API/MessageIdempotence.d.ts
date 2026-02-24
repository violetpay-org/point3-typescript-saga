import { AbstractSagaMessage } from '../Endpoint';
export declare abstract class MessageIdempotenceProvider {
    private keyLocker;
    constructor();
    private memoryLock;
    private memoryRelease;
    protected abstract lockKey(messageKey: string): Promise<void>;
    protected abstract releaseKey(messageKey: string): Promise<void>;
    lock(message: AbstractSagaMessage): Promise<boolean>;
    release(message: AbstractSagaMessage): Promise<void>;
}
