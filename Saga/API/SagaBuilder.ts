import { Executable, TxContext } from "../../UnitOfWork/main";

import * as planning from "../SagaPlanning/index";
import * as endpoint from "../Endpoint/index";
import * as session from "../SagaSession/index";

import * as stepBuilder from "./StepBuilder";

export class SagaBuilder<Tx extends TxContext> {
    private _saga: planning.SagaDefinition<Tx>;

    public constructor() {
        this._saga = new planning.SagaDefinition();
    }

    getSteps(): planning.Step<Tx>[] {
        return this._saga.steps;
    }

    protected addStep(step: planning.Step<Tx>) {
        this._saga.steps.push(step);
    }
    
    public build(): planning.SagaDefinition<Tx> {
        if (!this._saga.checkNoDuplicateStepNames()) {
            throw new Error("Duplicate step names found in saga");
        }

        return this._saga;
    }
}

export class StepBuilder<Tx extends TxContext> extends SagaBuilder<Tx> implements stepBuilder.IStepBuilder<Tx> {
    protected _currentStep: planning.Step<Tx>;

    public constructor() {
        super();
        this._currentStep = new planning.CentinelStep;
    }

    public step(name: string): stepBuilder.IInvokableStepBuilder<Tx> & stepBuilder.ILocalInvocableStepBuilder<Tx> {
        super.addStep(this._currentStep);
        this._currentStep = new planning.Step(name);

        return new InvokableStepBuilder(
            this,
            this._currentStep
        );
    }

    public build(): planning.SagaDefinition<Tx> {
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
        currentStep: planning.Step<Tx>
    ) {
        super();
        return this.loadSteps(sagaBuilder, currentStep);
    }

    private loadSteps(
        sagaBuilder: SagaBuilder<Tx>, 
        currentStep: planning.Step<Tx>
    ): InvokableStepBuilder<Tx> {
        sagaBuilder.getSteps().forEach(step => {
            this.addStep(step);
        });
        this._currentStep = currentStep;
        return this;
    }
    
    public withCompensation(endpoint: endpoint.CommandEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession, endpoint.CommandArguments>, 
        endpoint.Response, 
        endpoint.Response,
        Tx
    >): stepBuilder.IncompensatableStepBuilder<Tx> {
        this._currentStep.compensationAction = new planning.CompensationSagaAction(
            endpoint.getCommandRepository(),
            endpoint,
        )
        return this;
    }

    public invoke(endpoint: endpoint.CommandEndpoint<
        session.SagaSession, 
        endpoint.Command<session.SagaSession, endpoint.CommandArguments>, 
        endpoint.Response, 
        endpoint.Response,
        Tx
    >): stepBuilder.AfterInvokationStepBuilder<Tx> {
        this._currentStep.invocationAction = new planning.InvocationSagaAction(
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
        endpoint.Response, 
        endpoint.Response,
        Tx
    >): stepBuilder.AfterLocalInvocationStepBuilder<Tx> {
        this._currentStep.invocationAction = new planning.LocalInvocationSagaAction(
            endpoint,
        )
        return this;
    }

    public withLocalCompensation(endpoint: endpoint.LocalEndpoint<
        session.SagaSession, 
        endpoint.Response, 
        endpoint.Response,
        Tx
    >): stepBuilder.IStepBuilder<Tx> {
        this._currentStep.compensationAction = new planning.LocalCompensationSagaAction(
            endpoint,
        )
        return this;
    }

    public localRetry(): stepBuilder.IStepBuilder<Tx> {
        this._currentStep.retry = true;
        return this;
    }
}

