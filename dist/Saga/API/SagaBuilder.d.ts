import { TxContext } from "../../UnitOfWork/main";
import * as planning from "../SagaPlanning/index";
import * as stepBuilder from "./StepBuilder";
export declare class SagaBuilder<Tx extends TxContext> {
    private _saga;
    constructor();
    getSteps(): planning.Step<Tx>[];
    protected addStep(step: planning.Step<Tx>): void;
    build(): planning.SagaDefinition<Tx>;
}
export declare class StepBuilder<Tx extends TxContext> extends SagaBuilder<Tx> implements stepBuilder.IStepBuilder<Tx> {
    protected _currentStep: planning.Step<Tx>;
    constructor();
    step(name: string): stepBuilder.IInvokableStepBuilder<Tx> & stepBuilder.ILocalInvocableStepBuilder<Tx>;
    build(): planning.SagaDefinition<Tx>;
}
