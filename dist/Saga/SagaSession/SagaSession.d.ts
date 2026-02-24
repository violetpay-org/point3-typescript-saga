export declare class SagaState {
    _isFailed: boolean;
    _isCompensating: boolean;
    _isCompleted: boolean;
    _isPending: boolean;
    _isRetrying: boolean;
    constructor(isFailed?: boolean, isCompensating?: boolean, isCompleted?: boolean, isPending?: boolean, isRetrying?: boolean);
    flagSetupForForwarding(): void;
    flagSetupForCompletion(): void;
    flagSetupForFailure(): void;
    flagSetupForMustComplete(): void;
    flagSetupForCompensation(): void;
    flagSetupForPending(): void;
    flagSetupForFinishPending(): void;
    isInForwardDirection(): boolean;
    isCompensating(): boolean;
    isFailed(): boolean;
    isCompleted(): boolean;
    isRetryingInvocation(): boolean;
    isPending(): boolean;
}
export interface SagaSessionArguments {
}
export declare abstract class SagaSession {
    private _sagaId;
    private _currentStep;
    private _state;
    constructor(sagaId: string, currentStep?: string, state?: SagaState);
    getCurrentStepName(): string;
    getSagaId(): string;
    getSagaState(): SagaState;
    updateCurrentStep(stepName: string): void;
    setState(state: SagaState): void;
    setCompensationState(): void;
    setMustCompleteState(): void;
    setCompletionState(): void;
    setFailureState(): void;
    setForwardState(): void;
    setPendingState(): void;
    unsetPendingState(): void;
    isInForwardDirection(): boolean;
    isCompensating(): boolean;
    isFailed(): boolean;
    isCompleted(): boolean;
    isRetryingInvocation(): boolean;
    isPending(): boolean;
}
