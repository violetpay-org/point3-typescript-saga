"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SagaDefinition = void 0;
class SagaDefinition {
    constructor() {
        this.steps = [];
        this.steps = [];
    }
    getSteps() {
        return this.steps;
    }
    getStep(name) {
        return this.steps.find(step => step.getStepName() === name);
    }
    getFirstStep() {
        return this.steps[0];
    }
    getLastStep() {
        return this.steps[this.steps.length - 1];
    }
    getStepAfter(stepName) {
        const stepIndex = this.steps.findIndex(step => step.getStepName() === stepName);
        if (stepIndex === -1) {
            return null;
        }
        if (stepIndex === this.steps.length - 1) {
            return null;
        }
        return this.steps[stepIndex + 1];
    }
    getStepBefore(stepName) {
        const stepIndex = this.steps.findIndex(step => step.getStepName() === stepName);
        if (stepIndex === -1) {
            return null;
        }
        if (stepIndex === 0) {
            return null;
        }
        return this.steps[stepIndex - 1];
    }
    checkNoDuplicateStepNames() {
        const stepNames = this.steps.map(step => step.getStepName());
        return stepNames.length === new Set(stepNames).size;
    }
}
exports.SagaDefinition = SagaDefinition;
//# sourceMappingURL=SagaDefinition.js.map