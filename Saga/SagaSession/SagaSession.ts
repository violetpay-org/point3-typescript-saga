export class SagaState {
    _isFailed: boolean;
    _isCompensating: boolean;
    _isCompleted: boolean;
    _isPending: boolean;

    // Compensation and retry phase can both have isRetrying == true
    _isRetrying: boolean;

    constructor(
        isFailed?: boolean,
        isCompensating?: boolean,
        isCompleted?: boolean,
        isPending?: boolean,
        isRetrying?: boolean,
    ) {
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

    public flagSetupForForwarding() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = false;
        this._isCompensating = false;
    }

    public flagSetupForCompletion() {
        this._isFailed = false;
        this._isCompleted = true;
        this._isRetrying = false;
        this._isCompensating = false;
        this._isPending = false;
    }

    public flagSetupForFailure() {
        this._isFailed = true;
        this._isCompleted = false;
        this._isRetrying = false;
        this._isCompensating = false;
        this._isPending = false;
    }

    public flagSetupForMustComplete() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = true;
        this._isCompensating = false;
    }

    public flagSetupForCompensation() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = true;
        this._isCompensating = true;
    }

    public flagSetupForPending() {
        this._isPending = true;
        this._isFailed = false;
        this._isCompleted = false;
    }

    public flagSetupForFinishPending() {
        this._isPending = false;
    }

    public isInForwardDirection(): boolean {
        return !this._isCompensating && !this._isCompleted && !this._isFailed;
    }

    public isCompensating(): boolean {
        return this._isCompensating && this._isRetrying;
    }

    public isFailed(): boolean {
        return this._isFailed;
    }

    public isCompleted(): boolean {
        return this._isCompleted;
    }

    public isRetryingInvocation(): boolean {
        return !this._isCompensating && this._isRetrying;
    }

    public isPending(): boolean {
        return this._isPending;
    }
}

export interface SagaSessionArguments {}

export abstract class SagaSession {
    private _sagaId: string;
    private _currentStep: string;
    private _state: SagaState;

    constructor(sagaId: string, currentStep?: string, state?: SagaState) {
        this._sagaId = sagaId;

        if (currentStep) {
            this._currentStep = currentStep;
        }

        if (state) {
            this._state = state;
        } else {
            this._state = new SagaState();
            this.setForwardState();
        }
    }

    public getCurrentStepName(): string {
        return this._currentStep;
    }

    public getSagaId(): string {
        return this._sagaId;
    }

    public getSagaState(): SagaState {
        return this._state;
    }

    public updateCurrentStep(stepName: string) {
        this._currentStep = stepName;
    }

    public setState(state: SagaState) {
        this._state = state;
    }

    public setCompensationState() {
        this._state.flagSetupForCompensation();
    }

    public setMustCompleteState() {
        this._state.flagSetupForMustComplete();
    }

    public setCompletionState() {
        this._state.flagSetupForCompletion();
    }

    public setFailureState() {
        this._state.flagSetupForFailure();
    }

    public setForwardState() {
        this._state.flagSetupForForwarding();
    }

    public setPendingState() {
        this._state.flagSetupForPending();
    }

    public unsetPendingState() {
        this._state.flagSetupForFinishPending();
    }

    public isInForwardDirection(): boolean {
        return this._state.isInForwardDirection();
    }

    public isCompensating(): boolean {
        return this._state.isCompensating();
    }

    public isFailed(): boolean {
        return this._state.isFailed();
    }

    public isCompleted(): boolean {
        return this._state.isCompleted();
    }

    public isRetryingInvocation(): boolean {
        return !this._state.isRetryingInvocation();
    }

    public isPending(): boolean {
        return this._state.isPending();
    }
}
