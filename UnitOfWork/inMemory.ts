import { TxContext, UnitOfWork, UnitOfWorkFactory } from "./main";

export class InMemoryTxContext implements TxContext {
    constructor() {}
}

export class InMemoryUnitOfWork extends UnitOfWork<InMemoryTxContext> {
    protected _beginTxCommand(): Promise<InMemoryTxContext> {
        console.log("Beginning transaction");
        return Promise.resolve(new InMemoryTxContext());
    }

    protected _rollbackCommand(): Promise<void> {
        console.log("Rolling back transaction");
        return Promise.resolve();
    }

    protected _commitCommand(): Promise<void> {
        console.log("Committing transaction");
        return Promise.resolve();
    }

    constructor() {
        super();
    }

    static get unitOfWorkFactory() {
        return InMemoryUnitOfWorkFactory;
    }
}

export const InMemoryUnitOfWorkFactory = () => {
    return new InMemoryUnitOfWork();
}