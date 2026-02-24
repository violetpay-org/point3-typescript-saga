export declare class ThreadSafeMap<K, V> {
    private _mutex;
    private _map;
    constructor();
    clear(): Promise<void>;
    delete(key: K): Promise<boolean>;
    get(key: K): Promise<V>;
    has(key: K): Promise<boolean>;
    set(key: K, value: V): Promise<this>;
    keys(): Promise<IterableIterator<K>>;
    values(): Promise<IterableIterator<V>>;
}
