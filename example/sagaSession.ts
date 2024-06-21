import * as point3Saga from "../Saga";
import { Executable, TxContext } from "../UnitOfWork/main";

export class ExampleSagaSessionArguments2 implements point3Saga.saga.session.SagaSessionArguments {
    private readonly _arg2: string = "arg2";

    public getArg2(): string {
        return this._arg2;
    }
}

export class ExampleSagaSessionArguments implements point3Saga.saga.session.SagaSessionArguments {
    private readonly _arg1: string = "arg1";

    public getArg1(): string {
        return this._arg1;
    }
}

export class ExampleSagaSession extends point3Saga.saga.session.SagaSession {
    constructor(sagaId: string, arg: ExampleSagaSessionArguments) {
        super(sagaId);
    }
    
    public static create(sagaId: string, arg: ExampleSagaSessionArguments): ExampleSagaSession {
        return new ExampleSagaSession(sagaId, arg);
    }
}


export class InMemoryExampleSagaSaver implements point3Saga.saga.repository.SagaSessionRepository<
    TxContext,
    ExampleSagaSession
> {
    private readonly _sessions: Map<string, ExampleSagaSession> = new Map();

    constructor() {}

    saveTx(sagaSession: ExampleSagaSession): Executable<TxContext> {
        return async (tx: TxContext) => {
            this._sessions.set(sagaSession.getSagaId(), sagaSession);
            console.log(`Saved session ${sagaSession.getSagaId()}`);
        };
    }

    load(sagaSessionId: string): Promise<ExampleSagaSession> {
        if (!this._sessions.has(sagaSessionId)) {
            console.log(`Session ${sagaSessionId} not found`);
            return Promise.resolve(null);
        }
        return Promise.resolve(this._sessions.get(sagaSessionId));
    }
}
