abstract class SagaError extends Error {
    protected constructor(message: string) {
        super(message);
        this.name = 'SagaError';
    }
}

export class ErrDuplicateSaga extends SagaError {
    constructor() {
        super('Duplicate saga in registry');
    }
}

export class ErrDeadSagaSession extends SagaError {
    constructor() {
        super('Session has already been completed or failed');
    }
}

export class ErrChannelNotFound extends SagaError {
    constructor() {
        super('Channel not found');
    }
}

export class ErrStepNotFound extends SagaError {
    constructor() {
        super('Step not found');
    }
}

export class ErrSagaNotFound extends SagaError {
    constructor() {
        super('Saga not found');
    }
}

export class ErrSagaSessionNotFound extends SagaError {
    constructor() {
        super('Saga session not found');
    }
}

export class ErrLocalInvocationError extends SagaError {
    constructor() {
        super('Error during local invocation');
    }
}

export class ErrEventConsumptionError extends SagaError {
    constructor() {
        super('Error consuming event');
    }
}

export class ErrLocalCompensationError extends SagaError {
    constructor() {
        super('Error during local compensation');
    }
}
