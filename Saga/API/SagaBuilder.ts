import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";

import { saga, sagaDefinition, step, stepBuilder } from "../Saga";
import { endpoint } from "../Endpoint";

export class SagaBuilder<S extends saga.SagaInstance, Tx extends TxContext> {
    private _saga: sagaDefinition.SagaDefinition<S, Tx>;
    protected _sagaName: string;

    // TODO: Implement invocation and compensation saga action factories
    protected _invocationSagaActionFactory: saga.InvocationSagaActionFactory<Tx>;
    protected _compensationSagaActionFactory: saga.CompensationSagaActionFactory<Tx>;

    public constructor(sagaName: string) {
        this._saga = new sagaDefinition.SagaDefinition(sagaName);
        this._sagaName = sagaName;
    }

    getSteps(): step.Step<Tx>[] {
        return this._saga.steps;
    }

    protected addStep(step: step.Step<Tx>) {
        this._saga.steps.push(step);
    }
    
    public build(): sagaDefinition.SagaDefinition<S, Tx> {
        if (!this._saga.checkNoDuplicateStepNames()) {
            throw new Error("Duplicate step names found in saga");
        }

        return this._saga;
    }
}

export class StepBuilder<S extends saga.SagaInstance, Tx extends TxContext> extends SagaBuilder<S, Tx> implements stepBuilder.IStepBuilder<S, Tx> {
    protected _currentStep: step.Step<Tx>;

    public constructor(sagaName: string) {
        super(sagaName);
        this._currentStep = new step.Step("sentinel");
    }

    public step(name: string): stepBuilder.IInvokableStepBuilder<S, Tx> {
        super.addStep(this._currentStep);
        this._currentStep = new step.Step(name);

        return new InvokableStepBuilder(
            this._sagaName,
            this,
            this._currentStep,
            this._invocationSagaActionFactory,
            this._compensationSagaActionFactory
        );
    }

    public build(): sagaDefinition.SagaDefinition<S, Tx> {
        super.addStep(this._currentStep);
        return super.build();
    }
}

class InvokableStepBuilder<S extends saga.SagaInstance, Tx extends TxContext> extends 
    StepBuilder<S, Tx> implements 
    stepBuilder.IInvokableStepBuilder<S, Tx>,
    stepBuilder.MustCompleteStepBuilder<S, Tx>, 
    stepBuilder.AfterInvokationStepBuilder<S, Tx>, 
    stepBuilder.IncompensatableStepBuilder<S, Tx> 
{
    constructor(
        sagaName: string, 
        sagaBuilder: SagaBuilder<S, Tx>, 
        currentStep: step.Step<Tx>,
        private invocationSagaActionFactory: saga.InvocationSagaActionFactory<Tx>,
        private compensationSagaActionFactory: saga.CompensationSagaActionFactory<Tx>
    ) {
        super(sagaName);
        return this.loadSteps(sagaBuilder, currentStep);
    }

    private loadSteps(
        sagaBuilder: SagaBuilder<S, Tx>, 
        currentStep: step.Step<Tx>
    ): InvokableStepBuilder<S, Tx> {
        sagaBuilder.getSteps().forEach(step => {
            this.addStep(step);
        });
        this._currentStep = currentStep;
        return this;
    }
    
    public withCompensation(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): stepBuilder.IncompensatableStepBuilder<S, Tx> {
        this._currentStep.compensationAction = this.compensationSagaActionFactory(endpoint);
        return this;
    }

    public invoke(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): stepBuilder.AfterInvokationStepBuilder<S, Tx> {
        this._currentStep.invocationAction = this.invocationSagaActionFactory(endpoint);
        return this;
    }

    public onReply(handler: endpoint.MessageHandlerFunc<endpoint.AbstractSagaMessage, Executable<Tx>>): stepBuilder.AfterInvokationStepBuilder<S, Tx> {
        this._currentStep.onReplies.push(handler);
        return this;
    }

    public retry(): stepBuilder.IncompensatableStepBuilder<S, Tx> {
        this._currentStep.retry = true;
        return this;
    }
}