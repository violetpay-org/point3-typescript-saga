import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";

import { saga, sagaDefinition, step } from "../Saga";
import { endpoint } from "../Endpoint";

import * as stepBuilder from "./StepBuilder";
import { CompensationSagaAction, InvocationSagaAction } from "../Saga/Saga";

export class SagaBuilder<Tx extends TxContext> {
    private _saga: sagaDefinition.SagaDefinition<Tx>;

    public constructor() {
        this._saga = new sagaDefinition.SagaDefinition();
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

    public constructor() {
        super();
        this._currentStep = new step.Step("sentinel");
    }

    public step(name: string): stepBuilder.IInvokableStepBuilder<Tx> {
        super.addStep(this._currentStep);
        this._currentStep = new step.Step(name);

        return new InvokableStepBuilder(
            this,
            this._currentStep
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
        sagaBuilder: SagaBuilder<Tx>, 
        currentStep: step.Step<Tx>
    ) {
        super();
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
        this._currentStep.compensationAction = new CompensationSagaAction(
            endpoint.getCommandRepository(),
            endpoint,
        )
        return this;
    }

    public invoke(endpoint: endpoint.CommandEndpoint<endpoint.Command, endpoint.Command, endpoint.Command>): stepBuilder.AfterInvokationStepBuilder<Tx> {
        this._currentStep.invocationAction = new InvocationSagaAction(
            endpoint.getCommandRepository(),
            endpoint,
        )
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

