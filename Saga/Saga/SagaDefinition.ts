import { TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { SagaInstance } from "./Saga";
import { Step } from "./Step";

export class SagaDefinition<S extends SagaInstance, Tx extends TxContext> {
    name: string;
    steps: Step<Tx>[] = [];

    public constructor(sagaName: string) {
        this.name = sagaName;
        this.steps = [];
    }

    public getSteps(): Step<Tx>[] {
        return this.steps;
    }

    public getStep(name: string): Step<Tx> {
        return this.steps.find(step => step.getStepName() === name);
    }

    public getFirstStep(): Step<Tx> {
        return this.steps[0];
    }

    public getLastStep(): Step<Tx> {
        return this.steps[this.steps.length - 1];
    }

    public getStepAfter(stepName: string): Step<Tx> {
        const stepIndex = this.steps.findIndex(step => step.getStepName() === stepName);

        if (stepIndex === -1) {
            return null;
        }

        if (stepIndex === this.steps.length - 1) {
            return null;
        }

        return this.steps[stepIndex + 1];
    }

    public getStepBefore(stepName: string): Step<Tx> {
        const stepIndex = this.steps.findIndex(step => step.getStepName() === stepName);

        if (stepIndex === -1) {
            return null;
        }

        if (stepIndex === 0) {
            return null;
        }

        return this.steps[stepIndex - 1];
    }

    public checkNoDuplicateStepNames(): boolean {
        const stepNames = this.steps.map(step => step.getStepName());
        return stepNames.length === new Set(stepNames).size;
    }
}