import { UnitOfWork } from "./main";
import { AsyncLocalStorage } from "async_hooks";
export declare const THREAD_LOCAL: AsyncLocalStorage<unknown>;
export declare function ShallowTransactional<U extends new (...args: any[]) => UnitOfWork<any>>(unitOfWorkType: U, ...args: ConstructorParameters<U>): (target: any, methodName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
export declare function Transactional<U extends new (...args: any[]) => UnitOfWork<any>>(unitOfWorkType: U, ...args: ConstructorParameters<U>): (target: any, methodName: string, descriptor: PropertyDescriptor) => PropertyDescriptor;
type WorkId = string;
export declare class GroupOfWorks {
    private _FILOWorkIdQueue;
    private _unitOfWorks;
    private constructor();
    static create<U extends new (...args: any[]) => UnitOfWork<any>>(rootWorkId: WorkId, unitOfWorkType: U, ...args: ConstructorParameters<U>): GroupOfWorks;
    join(workId: WorkId, uow: UnitOfWork<any>): void;
    get DeepestWork(): [workId: WorkId | undefined, unitOfWork: UnitOfWork<any> | undefined];
    private get isWorkEmpty();
    private popWork;
    Commit(): Promise<void>;
    Rollback(): Promise<void>;
}
export {};
