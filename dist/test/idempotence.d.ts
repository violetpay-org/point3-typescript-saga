import * as point3Saga from '../Saga/index';
export declare class InMemoryMessageIdempotenceProvider extends point3Saga.api.MessageIdempotenceProvider {
    private lockedKeys;
    private mutex;
    constructor();
    protected lockKey(messageKey: string): Promise<void>;
    protected releaseKey(messageKey: string): Promise<void>;
}
