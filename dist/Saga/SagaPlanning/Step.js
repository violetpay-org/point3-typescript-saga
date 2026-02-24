"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CentinelStep = exports.CENTINEL_STEP_NAME = exports.Step = void 0;
class Step {
    constructor(name) {
        this.onReplies = [];
        this.name = name;
    }
    getStepName() {
        return this.name;
    }
    isInvocable() {
        if (this.invocationAction) {
            return true;
        }
        return false;
    }
    isCompensatable() {
        if (this.compensationAction) {
            return true;
        }
        return false;
    }
    hasReplyHandlers() {
        return this.onReplies.length > 0;
    }
    mustComplete() {
        return this.retry;
    }
}
exports.Step = Step;
exports.CENTINEL_STEP_NAME = "sentinel";
class CentinelStep extends Step {
    constructor() {
        super(exports.CENTINEL_STEP_NAME);
    }
}
exports.CentinelStep = CentinelStep;
//# sourceMappingURL=Step.js.map