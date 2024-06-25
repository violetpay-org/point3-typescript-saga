import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";

import * as sagaPlanning from "../SagaPlanning";
import { endpoint } from "../Endpoint";
import { session } from "../SagaSession";

import * as stepBuilder from "./StepBuilder";

export class SagaBuilder<Tx extends TxContext> {
    private _saga: sagaPlanning.definition.SagaDefinition<Tx>;

    public constructor() {
        this._saga = new sagaPlanning.definition.SagaDefinition();
    }

    getSteps(): sagaPlanning.step.Step<Tx>[] {
        return this._saga.steps;
    }

    protected addStep(step: sagaPlanning.step.Step<Tx>) {
        this._saga.steps.push(step);
    }
    
    public build(): sagaPlanning.definition.SagaDefinition<Tx> {
        if (!this._saga.checkNoDuplicateStepNames()) {
            throw new Error("Duplicate step names found in saga");
        }

        return this._saga;
    }
}

export class StepBuilder<Tx extends TxContext> extends SagaBuilder<Tx> implements stepBuilder.IStepBuilder<Tx> {
    protected _currentStep: sagaPlanning.step.Step<Tx>;

    public constructor() {
        super();
        this._currentStep = new sagaPlanning.step.CentinelStep;
    }

    public step(name: string): stepBuilder.IInvokableStepBuilder<Tx> & stepBuilder.ILocalInvocableStepBuilder<Tx> {
        super.addStep(this._currentStep);
        this._currentStep = new sagaPlanning.step.Step(name);

        return new InvokableStepBuilder(
            this,
            this._currentStep
        );
    }

    public build(): sagaPlanning.definition.SagaDefinition<Tx> {
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
        currentStep: sagaPlanning.step.Step<Tx>
    ) {
        super();
        return this.loadSteps(sagaBuilder, currentStep);
    }

    private loadSteps(
        sagaBuilder: SagaBuilder<Tx>, 
        currentStep: sagaPlanning.step.Step<Tx>
    ): InvokableStepBuilder<Tx> {
        sagaBuilder.getSteps().forEach(step => {
            this.addStep(step);
        });
        this._currentStep = currentStep;
        return this;
    }
    
    public withCompensation(endpoint: endpoint.CommandEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>
    >): stepBuilder.IncompensatableStepBuilder<Tx> {
        this._currentStep.compensationAction = new sagaPlanning.action.CompensationSagaAction(
            endpoint.getCommandRepository(),
            endpoint,
        )
        return this;
    }

    public invoke(endpoint: endpoint.CommandEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>
    >): stepBuilder.AfterInvokationStepBuilder<Tx> {
        this._currentStep.invocationAction = new sagaPlanning.action.InvocationSagaAction(
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

    // For Local invocation
    public localInvoke(endpoint: endpoint.LocalEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>
    >): stepBuilder.AfterLocalInvocationStepBuilder<Tx> {
        this._currentStep.invocationAction = new sagaPlanning.action.LocalInvocationSagaAction(
            endpoint,
        )
        return this;
    }

    public withLocalCompensation(endpoint: endpoint.LocalEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession>, 
        endpoint.Command<session.SagaSession>
    >): stepBuilder.IStepBuilder<Tx> {
        this._currentStep.compensationAction = new sagaPlanning.action.LocalCompensationSagaAction(
            endpoint,
        )
        return this;
    }

    public localRetry(): stepBuilder.IStepBuilder<Tx> {
        this._currentStep.retry = true;
        return this;
    }
}

