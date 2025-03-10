import * as point3Saga from '../Saga/index';
import { Executable, TxContext } from '../UnitOfWork/main';
import { cloneDeep } from 'lodash';

export class ExampleSagaSessionArguments2 implements point3Saga.saga.SagaSessionArguments {
    private readonly _arg2: string = 'arg2';

    public getArg2(): string {
        return this._arg2;
    }
}

export class ExampleSagaSessionArguments implements point3Saga.saga.SagaSessionArguments {
    private readonly _arg1: string = 'arg1';

    public getArg1(): string {
        return this._arg1;
    }
}

export class ExampleSagaSession extends point3Saga.saga.SagaSession {
    constructor(sagaId: string, arg: ExampleSagaSessionArguments) {
        super(sagaId);
    }
}

export class InMemoryExampleSagaSaver implements point3Saga.saga.SagaSessionRepository<TxContext, ExampleSagaSession> {
    private readonly _sessions: Map<string, ExampleSagaSession> = new Map();

    constructor() {}

    saveTx(sagaSession: ExampleSagaSession): Executable<TxContext> {
        return async (tx: TxContext) => {
            this._sessions.set(sagaSession.getSagaId(), sagaSession);
            console.log(`Saved session ${sagaSession.getSagaId()}`);
        };
    }

    load(sagaSessionId: string): Promise<ExampleSagaSession> {
        const deepCopiedSession = cloneDeep(this._sessions);

        if (!deepCopiedSession.has(sagaSessionId)) {
            console.log(`Session ${sagaSessionId} not found`);
            return Promise.resolve(null);
        }
        return Promise.resolve(deepCopiedSession.get(sagaSessionId));
    }

    // For testing purposes only
    getSessions(): IterableIterator<ExampleSagaSession> {
        const deepCopiedSessions: ExampleSagaSession[] = [];
        for (const session of this._sessions.values()) {
            deepCopiedSessions.push(cloneDeep(session));
        }

        return deepCopiedSessions.values();
    }

    getSagaSessionsAsMap(): Map<string, ExampleSagaSession> {
        return this._sessions;
    }
}
