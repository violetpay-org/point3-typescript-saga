import { endpoint, channel, commandRepository } from "../Endpoint";
import { Executable, TxContext, UnitOfWork } from "src/point3-typescript-saga/UnitOfWork/main";

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
    }

    protected _flagSetupForFailure() {
        this._isFailed = true;
        this._isCompleted = false;
        this._isRetrying = false;
        this._isCompensating = false;
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

export abstract class AbstractInvocationSagaAction<Tx extends TxContext> {
    protected commandRepository: commandRepository.CommandRepository<endpoint.Command, Tx>;
    invocationDestination: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>;

    public async executeInvocation(): Promise<Executable<Tx>> {
        const invocationCommand = new (this.invocationDestination.getCommandReqCtor());
        return this.commandRepository.saveCommand(invocationCommand);
    }
}

export abstract class AbstractCompensationSagaAction<Tx extends TxContext> {
    protected commandRepository: commandRepository.CommandRepository<endpoint.Command, Tx>;
    compensationDestination: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>;

    public async executeCompensation(): Promise<Executable<Tx>> {
        const compensationCommand = new (this.compensationDestination.getCommandReqCtor());
        return this.commandRepository.saveCommand(compensationCommand);
    }
}

export interface InvocationSagaActionFactory<Tx extends TxContext> {
    (endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): AbstractInvocationSagaAction<Tx>;
}

export interface CompensationSagaActionFactory<Tx extends TxContext> {
    (endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): AbstractCompensationSagaAction<Tx>;
}