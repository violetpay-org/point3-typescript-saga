import { assert } from "console";
import { UnitOfWork } from "./main";
import { AsyncLocalStorage } from "async_hooks";
import { MySQLUnitOfWork } from "./mysql";

export const THREAD_LOCAL = new AsyncLocalStorage();

export function ShallowTransactional<U extends new (...args: any[]) => UnitOfWork<any>>(
    unitOfWorkType: U,
    ...args: ConstructorParameters<U>
) {
    return function (target: any, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        let originalMethod = descriptor.value;
        descriptor.value = async function (...methodArgs: any[]) {
            let unitOfWork = (THREAD_LOCAL as AsyncLocalStorage<UnitOfWork<any>>).getStore();
            // if Transactional decorator has been used above, automatically joins the transaction above.
            if (unitOfWork) return originalMethod.apply(this, methodArgs);

            unitOfWork = new unitOfWorkType(...args);
            return THREAD_LOCAL.run(unitOfWork, async () => {
                let result: any;
                try {
                    result = await originalMethod.apply(this, methodArgs);
                    await unitOfWork.Commit();
                    return result;
                } catch (e) {
                    await unitOfWork.Rollback();
                    throw e;
                }
            });
        };
        return descriptor;
    }
}

/**
 * NestableTransactional 데코레이터는 중첩된 트랜잭션 관리를 가능하게 합니다.
 * 
 * 중요: 트랜잭션은 깊이 우선 방식(DFS)으로 처리됩니다. 롤백이 발생할 경우,
 * 아직 커밋되지 않은 트랜잭션만 롤백됩니다.
 * 
 * 예를 들어, 다음과 같은 중첩 구조에서:
 * NestableTransactional_1
 * ├── NestableTransactional_2
 * │   ├── NestableTransactional_4
 * │   └── NestableTransactional_5
 * └── NestableTransactional_3
 *     ├── NestableTransactional_6
 *     └── NestableTransactional_7 
 * 
 * 트랜잭션은 다음 순서로 처리됩니다: 4, 5, 2, 6, 7, 3, 1
 * 
 * 만약 트랜잭션 4와 5가 이미 커밋된 후 트랜잭션 2에서 실패가 발생하면,
 * 트랜잭션 6, 7, 3, 1만 롤백됩니다. 트랜잭션 4와 5는 이미 처리되었으므로
 * 커밋된 상태로 유지됩니다.
 * 
 * @param unitOfWorkType 인스턴스화할 작업 단위 유형
 * @param args 작업 단위의 생성자 매개변수
 * @returns 트랜잭션을 관리하는 메서드 데코레이터
 */
export function Transactional<U extends new (...args: any[]) => UnitOfWork<any>>(
    unitOfWorkType: U,
    ...args: ConstructorParameters<U>
) {
    return function (target: any, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        let originalMethod = descriptor.value;
        descriptor.value = async function (...methodArgs: any[]) {
            let groupOfWorks = (THREAD_LOCAL as AsyncLocalStorage<GroupOfWorks>).getStore();
            // if Transactional decorator has been used above, automatically joins the transaction above.
            if (groupOfWorks) {
                const unitOfWork = new unitOfWorkType(...args);
                groupOfWorks.join(IdFactory(methodName), unitOfWork);
            } else {
                groupOfWorks = GroupOfWorks.create(
                    IdFactory(methodName),
                    unitOfWorkType,
                    ...args
                );
            }

            return THREAD_LOCAL.run(groupOfWorks, async () => {
                let result: any;
                try {
                    result = await originalMethod.apply(this, methodArgs);
                    await groupOfWorks.Commit();
                    console.log(result)
                    return result;
                } catch (e) {
                    await groupOfWorks.Rollback();
                    throw e;
                } finally {
                    // Only cleanup thread local storage when all nested transactions are complete
                    if (!groupOfWorks.DeepestWork[0]) {
                        THREAD_LOCAL.disable(); // cleanup for jobs all done
                    }
                }
            });
        };
        return descriptor;
    }
}

function IdFactory(methodName: string): WorkId {
    return `${methodName}_${Math.floor(Math.random() * 100)}`
}

type WorkId = string; // ideal case would be scope name, which is represented by method name...?
export class GroupOfWorks {
    private _FILOWorkIdQueue: WorkId[] = [];
    private _unitOfWorks = new Map<WorkId, UnitOfWork<any>>();

    private constructor(rootWorkId: WorkId, rootUnitOfWork: UnitOfWork<any>) {
        this._FILOWorkIdQueue.push(rootWorkId);
        this._unitOfWorks.set(rootWorkId, rootUnitOfWork);
    };

    public static create
        <U extends new (...args: any[]) => UnitOfWork<any>>(
            rootWorkId: WorkId,
            unitOfWorkType: U,
            ...args: ConstructorParameters<U>
        ): GroupOfWorks {
        return new GroupOfWorks(
            rootWorkId,
            new unitOfWorkType(...args)
        );
    }

    public join(workId: WorkId, uow: UnitOfWork<any>): void {
        this._FILOWorkIdQueue.push(workId);
        this._unitOfWorks.set(workId, uow);
    }

    /**
     * The deepest work (most urgent work to be done in current scope or function call)
     */
    public get DeepestWork(): [workId: WorkId | undefined, unitOfWork: UnitOfWork<any> | undefined] {
        if (this.isWorkEmpty) return [undefined, undefined];

        return [
            this._FILOWorkIdQueue[this._FILOWorkIdQueue.length - 1],
            this._unitOfWorks.get(this._FILOWorkIdQueue[this._FILOWorkIdQueue.length - 1])
        ];
    }

    private get isWorkEmpty(): boolean {
        return this._FILOWorkIdQueue.length == this._unitOfWorks.size &&
            this._unitOfWorks.size == 0 &&
            this._FILOWorkIdQueue.length == 0;
    }

    private popWork(): [workId: WorkId, unitOfWork: UnitOfWork<any>] {
        assert(!this.isWorkEmpty);
        const workId = this._FILOWorkIdQueue.pop();
        const work = this._unitOfWorks.get(workId);
        this._unitOfWorks.delete(workId);

        return [workId, work];
    }

    public async Commit(): Promise<void> {
        if (this.isWorkEmpty) return;

        const [workId, work] = this.DeepestWork;
        try {
            await work.Commit();
            this.popWork();
        } catch (e) {
            await work.Rollback();
            throw new Point3TransactionalError(e, workId);
        };
    };

    public async Rollback(): Promise<void> {
        if (this.isWorkEmpty) return;

        while (!this.isWorkEmpty) {
            const [_, work] = this.DeepestWork;
            try {
                await work.Rollback();
            } catch (e) {
            } finally {
                this.popWork();
            }
        }
    };
}

class Point3TransactionalError extends Error {
    workId: WorkId;

    constructor(
        e: Error | string,
        workId: WorkId
    ) {
        super(typeof e === 'string' ? e : e.message);
        Error.captureStackTrace(this, this.constructor);
        this.name = "Point3TransactionalError";
        this.message = typeof e == "string" ? e : e.message || "";
        this.workId = workId;
    }
}



