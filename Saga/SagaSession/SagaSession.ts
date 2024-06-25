abstract class SagaState {
    private _isFailed: boolean = false;
    private _isCompensating: boolean = false;
    private _isCompleted: boolean = false;
    private _isPending: boolean = false;

    // Compensation and retry phase can both have isRetrying == true
    private _isRetrying: boolean = false;

    protected _flagSetupForForwarding() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = false;
        this._isCompensating = false;
    }

    protected _flagSetupForCompletion() {
        this._isFailed = false;
        this._isCompleted = true;
        this._isRetrying = false;    
        this._isCompensating = false;
        this._isPending = false;    
    }

    protected _flagSetupForFailure() {
        this._isFailed = true;
        this._isCompleted = false;
        this._isRetrying = false;
        this._isCompensating = false;
        this._isPending = false;
    }

    protected _flagSetupForMustComplete() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = true;
        this._isCompensating = false;
    }

    protected _flagSetupForCompensation() {
        this._isFailed = false;
        this._isCompleted = false;
        this._isRetrying = true;
        this._isCompensating = true;
    }

    protected _flagSetupForPending() {
        this._isPending = true;
        this._isFailed = false;
        this._isCompleted = false;
    }

    protected _flagSetupForFinishPending() {
        this._isPending = false;
    }

    public isInForwardDirection(): boolean {
        return !this._isCompensating &&
               !this._isCompleted &&
               !this._isFailed;
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

export abstract class SagaSession extends SagaState {
    private _sagaId: string;
    private _currentStep: string;

    constructor(sagaId: string) {
        super();
        this._sagaId = sagaId;
    }

    public getCurrentStepName(): string {
        return this._currentStep;
    }

    public getSagaId(): string {
        return this._sagaId;
    }

    public updateCurrentStep(stepName: string) {
        this._currentStep = stepName;
    }

    public setCompensationState() {
        this._flagSetupForCompensation();
    }

    public setMustCompleteState() {
        this._flagSetupForMustComplete();
    }

    public setCompletionState() {
        this._flagSetupForCompletion();
    }

    public setFailureState() {
        this._flagSetupForFailure();
    }

    public setForwardState() {
        this._flagSetupForForwarding();
    }

    public setPendingState() {
        this._flagSetupForPending();
    }

    public unsetPendingState() {
        this._flagSetupForPending
    }
}

export class OrderPartialCancelsSagaSession extends SagaSession {
    private _walletId: string;

    setWalletId(walletId: string) {
        this._walletId = walletId;
    }

    getWalletId(): string {
        return this._walletId;
    }
}
