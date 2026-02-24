declare abstract class SagaError extends Error {
    protected constructor(message: string);
}
export declare class ErrDuplicateSaga extends SagaError {
    constructor();
}
export declare class ErrDeadSagaSession extends SagaError {
    constructor();
}
export declare class ErrChannelNotFound extends SagaError {
    constructor();
}
export declare class ErrStepNotFound extends SagaError {
    constructor();
}
export declare class ErrSagaNotFound extends SagaError {
    constructor();
}
export declare class ErrSagaSessionNotFound extends SagaError {
    constructor();
}
export declare class ErrLocalInvocationError extends SagaError {
    constructor();
}
export declare class ErrEventConsumptionError extends SagaError {
    constructor();
}
export declare class ErrLocalCompensationError extends SagaError {
    constructor();
}
export {};
