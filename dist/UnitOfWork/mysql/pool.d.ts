import { Pool, PoolOptions } from "mysql2/promise";
export declare function createUnitOfWorkPool(connectionUri: string): Pool;
export declare function createUnitOfWorkPool(config: PoolOptions): Pool;
