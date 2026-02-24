"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaSession = exports.SagaState = void 0;
class SagaState {
    constructor(isFailed, isCompensating, isCompleted, isPending, isRetrying) {
        this._isFailed = false;
        this._isCompensating = false;
        this._isCompleted = false;
        this._isPending = false;
        this._isRetrying = false;
        if (isFailed) {
            this._isFailed = isFailed;
        }
        if (isCompensating) {
            this._isCompensating = isCompensating;
        }
        if (isCompleted) {
            this._isCompleted = isCompleted;
        }
        if (isPending) {
            this._isPending = isPending;
        }
        if (isRetrying) {
            this._isRetrying = isRetrying;
        }
    }
    flagSetupForForwarding() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = false;
        this._isCompensating = false;
    }
    flagSetupForCompletion() {
        this._isFailed = false;
        this._isCompleted = true;
        this._isRetrying = false;
        this._isCompensating = false;
        this._isPending = false;
    }
    flagSetupForFailure() {
        this._isFailed = true;
        this._isCompleted = false;
        this._isRetrying = false;
        this._isCompensating = false;
        this._isPending = false;
    }
    flagSetupForMustComplete() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = true;
        this._isCompensating = false;
    }
    flagSetupForCompensation() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = true;
        this._isCompensating = true;
    }
    flagSetupForPending() {
        this._isPending = true;
        this._isFailed = false;
        this._isCompleted = false;
    }
    flagSetupForFinishPending() {
        this._isPending = false;
    }
    isInForwardDirection() {
        return !this._isCompensating && !this._isCompleted && !this._isFailed;
    }
    isCompensating() {
        return this._isCompensating && this._isRetrying;
    }
    isFailed() {
        return this._isFailed;
    }
    isCompleted() {
        return this._isCompleted;
    }
    isRetryingInvocation() {
        return !this._isCompensating && this._isRetrying;
    }
    isPending() {
        return this._isPending;
    }
}
exports.SagaState = SagaState;
class SagaSession {
    constructor(sagaId, currentStep, state) {
        this._sagaId = sagaId;
        if (currentStep) {
            this._currentStep = currentStep;
        }
        if (state) {
            this._state = state;
        }
        else {
            this._state = new SagaState();
            this.setForwardState();
        }
    }
    getCurrentStepName() {
        return this._currentStep;
    }
    getSagaId() {
        return this._sagaId;
    }
    getSagaState() {
        return this._state;
    }
    updateCurrentStep(stepName) {
        this._currentStep = stepName;
    }
    setState(state) {
        this._state = state;
    }
    setCompensationState() {
        this._state.flagSetupForCompensation();
    }
    setMustCompleteState() {
        this._state.flagSetupForMustComplete();
    }
    setCompletionState() {
        this._state.flagSetupForCompletion();
    }
    setFailureState() {
        this._state.flagSetupForFailure();
    }
    setForwardState() {
        this._state.flagSetupForForwarding();
    }
    setPendingState() {
        this._state.flagSetupForPending();
    }
    unsetPendingState() {
        this._state.flagSetupForFinishPending();
    }
    isInForwardDirection() {
        return this._state.isInForwardDirection();
    }
    isCompensating() {
        return this._state.isCompensating();
    }
    isFailed() {
        return this._state.isFailed();
    }
    isCompleted() {
        return this._state.isCompleted();
    }
    isRetryingInvocation() {
        return !this._state.isRetryingInvocation();
    }
    isPending() {
        return this._state.isPending();
    }
}
exports.SagaSession = SagaSession;
//# sourceMappingURL=SagaSession.js.map