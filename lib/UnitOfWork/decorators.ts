import { UnitOfWork } from "./main";
import { AsyncLocalStorage } from "async_hooks";

export const THREAD_LOCAL = new AsyncLocalStorage();

export function Transactional<U extends new (...args: any[]) => UnitOfWork<any>>(
    unitOfWorkType: U,
    ...args: ConstructorParameters<U>
) {
    return function (target: any, methodName: string, descriptor: PropertyDescriptor): PropertyDescriptor {
        let originalMethod = descriptor.value;
        descriptor.value = async function (...methodArgs: any[]) {
            let unitOfWork = (THREAD_LOCAL as AsyncLocalStorage<UnitOfWork<any>>).getStore();
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