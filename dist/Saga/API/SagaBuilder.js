"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StepBuilder = exports.SagaBuilder = void 0;
const planning = __importStar(require("../SagaPlanning/index"));
class SagaBuilder {
    constructor() {
        this._saga = new planning.SagaDefinition();
    }
    getSteps() {
        return this._saga.steps;
    }
    addStep(step) {
        this._saga.steps.push(step);
    }
    build() {
        if (!this._saga.checkNoDuplicateStepNames()) {
            throw new Error("Duplicate step names found in saga");
        }
        return this._saga;
    }
}
exports.SagaBuilder = SagaBuilder;
class StepBuilder extends SagaBuilder {
    constructor() {
        super();
        this._currentStep = new planning.CentinelStep;
    }
    step(name) {
        super.addStep(this._currentStep);
        this._currentStep = new planning.Step(name);
        return new InvokableStepBuilder(this, this._currentStep);
    }
    build() {
        super.addStep(this._currentStep);
        return super.build();
    }
}
exports.StepBuilder = StepBuilder;
class InvokableStepBuilder extends StepBuilder {
    constructor(sagaBuilder, currentStep) {
        super();
        return this.loadSteps(sagaBuilder, currentStep);
    }
    loadSteps(sagaBuilder, currentStep) {
        sagaBuilder.getSteps().forEach(step => {
            this.addStep(step);
        });
        this._currentStep = currentStep;
        return this;
    }
    withCompensation(endpoint) {
        this._currentStep.compensationAction = new planning.CompensationSagaAction(endpoint.getCommandRepository(), endpoint);
        return this;
    }
    invoke(endpoint) {
        this._currentStep.invocationAction = new planning.InvocationSagaAction(endpoint.getCommandRepository(), endpoint);
        return this;
    }
    onReply(handler) {
        this._currentStep.onReplies.push(handler);
        return this;
    }
    retry() {
        this._currentStep.retry = true;
        return this;
    }
    localInvoke(endpoint) {
        this._currentStep.invocationAction = new planning.LocalInvocationSagaAction(endpoint);
        return this;
    }
    withLocalCompensation(endpoint) {
        this._currentStep.compensationAction = new planning.LocalCompensationSagaAction(endpoint);
        return this;
    }
    localRetry() {
        this._currentStep.retry = true;
        return this;
    }
}
//# sourceMappingURL=SagaBuilder.js.map