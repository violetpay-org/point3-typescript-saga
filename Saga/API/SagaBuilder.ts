import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";

import { saga, sagaDefinition, step } from "../Saga";
import { endpoint } from "../Endpoint";

import * as stepBuilder from "./StepBuilder";

export class SagaBuilder<Tx extends TxContext> {
    private _saga: sagaDefinition.SagaDefinition<Tx>;
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
    
    public build(): sagaDefinition.SagaDefinition<Tx> {
        if (!this._saga.checkNoDuplicateStepNames()) {
            throw new Error("Duplicate step names found in saga");
        }

        return this._saga;
    }
}

export class StepBuilder<Tx extends TxContext> extends SagaBuilder<Tx> implements stepBuilder.IStepBuilder<Tx> {
    protected _currentStep: step.Step<Tx>;

    public constructor(sagaName: string) {
        super(sagaName);
        this._currentStep = new step.Step("sentinel");
    }

    public step(name: string): stepBuilder.IInvokableStepBuilder<Tx> {
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

    public build(): sagaDefinition.SagaDefinition<Tx> {
        super.addStep(this._currentStep);
        return super.build();
    }
}

class InvokableStepBuilder<Tx extends TxContext> extends 
    StepBuilder<Tx> implements 
    stepBuilder.IInvokableStepBuilder<Tx>,
    stepBuilder.MustCompleteStepBuilder<Tx>, 
    stepBuilder.AfterInvokationStepBuilder<Tx>, 
    stepBuilder.IncompensatableStepBuilder<Tx> 
{
    constructor(
        sagaName: string, 
        sagaBuilder: SagaBuilder<Tx>, 
        currentStep: step.Step<Tx>,
        private invocationSagaActionFactory: saga.InvocationSagaActionFactory<Tx>,
        private compensationSagaActionFactory: saga.CompensationSagaActionFactory<Tx>
    ) {
        super(sagaName);
        return this.loadSteps(sagaBuilder, currentStep);
    }

    private loadSteps(
        sagaBuilder: SagaBuilder<Tx>, 
        currentStep: step.Step<Tx>
    ): InvokableStepBuilder<Tx> {
        sagaBuilder.getSteps().forEach(step => {
            this.addStep(step);
        });
        this._currentStep = currentStep;
        return this;
    }
    
    public withCompensation(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): stepBuilder.IncompensatableStepBuilder<Tx> {
        this._currentStep.compensationAction = this.compensationSagaActionFactory(endpoint);
        return this;
    }

    public invoke(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): stepBuilder.AfterInvokationStepBuilder<Tx> {
        this._currentStep.invocationAction = this.invocationSagaActionFactory(endpoint);
        return this;
    }

    public onReply(handler: endpoint.MessageHandlerFunc<endpoint.AbstractSagaMessage, Executable<Tx>>): stepBuilder.AfterInvokationStepBuilder<Tx> {
        this._currentStep.onReplies.push(handler);
        return this;
    }

    public retry(): stepBuilder.IncompensatableStepBuilder<Tx> {
        this._currentStep.retry = true;
        return this;
    }
}

