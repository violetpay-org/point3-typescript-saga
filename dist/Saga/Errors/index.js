"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrLocalCompensationError = exports.ErrEventConsumptionError = exports.ErrLocalInvocationError = exports.ErrSagaSessionNotFound = exports.ErrSagaNotFound = exports.ErrStepNotFound = exports.ErrChannelNotFound = exports.ErrDeadSagaSession = exports.ErrDuplicateSaga = void 0;
class SagaError extends Error {
    constructor(message) {
        super(message);
        this.name = 'SagaError';
    }
}
class ErrDuplicateSaga extends SagaError {
    constructor() {
        super('Duplicate saga in registry');
    }
}
exports.ErrDuplicateSaga = ErrDuplicateSaga;
class ErrDeadSagaSession extends SagaError {
    constructor() {
        super('Session has already been completed or failed');
    }
}
exports.ErrDeadSagaSession = ErrDeadSagaSession;
class ErrChannelNotFound extends SagaError {
    constructor() {
        super('Channel not found');
    }
}
exports.ErrChannelNotFound = ErrChannelNotFound;
class ErrStepNotFound extends SagaError {
    constructor() {
        super('Step not found');
    }
}
exports.ErrStepNotFound = ErrStepNotFound;
class ErrSagaNotFound extends SagaError {
    constructor() {
        super('Saga not found');
    }
}
exports.ErrSagaNotFound = ErrSagaNotFound;
class ErrSagaSessionNotFound extends SagaError {
    constructor() {
        super('Saga session not found');
    }
}
exports.ErrSagaSessionNotFound = ErrSagaSessionNotFound;
class ErrLocalInvocationError extends SagaError {
    constructor() {
        super('Error during local invocation');
    }
}
exports.ErrLocalInvocationError = ErrLocalInvocationError;
class ErrEventConsumptionError extends SagaError {
    constructor() {
        super('Error consuming event');
    }
}
exports.ErrEventConsumptionError = ErrEventConsumptionError;
class ErrLocalCompensationError extends SagaError {
    constructor() {
        super('Error during local compensation');
    }
}
exports.ErrLocalCompensationError = ErrLocalCompensationError;
//# sourceMappingURL=index.js.map