export const ErrDuplicateSaga = new Error("Duplicate saga in registry");
export const ErrDeadSagaSession = new Error("Session has already been completed or failed");
export const ErrChannelNotFound = new Error("Channel not found");
export const ErrStepNotFound = new Error("Step not found");
export const ErrSagaNotFound = new Error("Saga not found");
export const ErrEventConsumptionError = new Error("Error consuming event");
export const ErrLocalInvocationError = new Error("Error during local invocation");
export const ErrLocalCompensationError = new Error("Error during local compensation");