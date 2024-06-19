import * as point3Saga from "../Saga";
import { Executable, TxContext } from "../UnitOfWork/main";

export class ExampleSagaSessionArguments2 implements point3Saga.core.saga.SagaSessionArguments {
    private readonly _arg2: string = "arg2";

    public getArg2(): string {
        return this._arg2;
    }
}

export class ExampleSagaSessionArguments implements point3Saga.core.saga.SagaSessionArguments {
    private readonly _arg1: string = "arg1";

    public getArg1(): string {
        return this._arg1;
    }
}

export class ExampleSagaSession extends point3Saga.core.saga.SagaSession {
    constructor(arg: ExampleSagaSessionArguments) {
        super();
    }

    private _arg1: string;

    public static create(arg: ExampleSagaSessionArguments): ExampleSagaSession {
        return new ExampleSagaSession(arg);
    }
}

export class ExampleSagaSession2 extends point3Saga.core.saga.SagaSession {
    constructor(arg: ExampleSagaSessionArguments2) {
        super();
    }

    public static create(arg: ExampleSagaSessionArguments2): ExampleSagaSession2 {
        return new ExampleSagaSession2(arg);
    }
}


export class InMemoryExampleSagaSaver implements point3Saga.core.sagaRepository.SagaSessionRepository<
    TxContext,
    ExampleSagaSession
> {
    private readonly _sessions: Map<string, ExampleSagaSession> = new Map();

    constructor() {}

    saveTx(sagaSession: ExampleSagaSession): Executable<TxContext> {
        return async (tx: TxContext) => {
            this._sessions.set(sagaSession.getSagaId(), sagaSession);
        };
    }

    load(sagaSessionId: string): Promise<ExampleSagaSession> {
        if (!this._sessions.has(sagaSessionId)) {
            return Promise.resolve(null);
        }
        return Promise.resolve(this._sessions.get(sagaSessionId));
    }
}
