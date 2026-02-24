"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompensationSagaAction = exports.InvocationSagaAction = exports.LocalCompensationSagaAction = exports.LocalInvocationSagaAction = void 0;
const main_1 = require("../../UnitOfWork/main");
class LocalInvocationSagaAction {
    constructor(endpoint) {
        this.invocationDestination = endpoint;
    }
    async executeInvocation(sagaSession) {
        try {
            const handledDataSaver = await this.invocationDestination.handle(sagaSession);
            const successRes = new (this.invocationDestination.getCommandSuccessResCtor())({ sagaId: sagaSession.getSagaId() });
            const successResSaver = this.invocationDestination.getSuccessResponseRepository().saveMessage(successRes);
            return (0, main_1.BaseCombineExecutable)(handledDataSaver, successResSaver);
        }
        catch (e) {
            const failureRes = new (this.invocationDestination.getCommandFailureResCtor())({ sagaId: sagaSession.getSagaId() });
            const failureResSaver = this.invocationDestination.getFailureResponseRepository().saveMessage(failureRes);
            return failureResSaver;
        }
    }
}
exports.LocalInvocationSagaAction = LocalInvocationSagaAction;
class LocalCompensationSagaAction {
    constructor(endpoint) {
        this.compensationDestination = endpoint;
    }
    async executeCompensation(sagaSession) {
        try {
            const handledDataSaver = await this.compensationDestination.handle(sagaSession);
            const successRes = new (this.compensationDestination.getCommandSuccessResCtor())({});
            const successResSaver = this.compensationDestination.getSuccessResponseRepository().saveMessage(successRes);
            return (0, main_1.BaseCombineExecutable)(handledDataSaver, successResSaver);
        }
        catch (e) {
            const failureRes = new (this.compensationDestination.getCommandFailureResCtor())({});
            const failureResSaver = this.compensationDestination.getFailureResponseRepository().saveMessage(failureRes);
            return failureResSaver;
        }
    }
}
exports.LocalCompensationSagaAction = LocalCompensationSagaAction;
class InvocationSagaAction {
    constructor(commandRepository, endpoint) {
        this.commandRepository = commandRepository;
        this.invocationDestination = endpoint;
    }
    async executeInvocation(sagaSession) {
        const invocationCommand = new (this.invocationDestination.getCommandReqCtor())(sagaSession);
        return this.commandRepository.saveMessage(invocationCommand);
    }
}
exports.InvocationSagaAction = InvocationSagaAction;
class CompensationSagaAction {
    constructor(commandRepository, endpoint) {
        this.commandRepository = commandRepository;
        this.compensationDestination = endpoint;
    }
    async executeCompensation(sagaSession) {
        const compensationCommand = new (this.compensationDestination.getCommandReqCtor())(sagaSession);
        return this.commandRepository.saveMessage(compensationCommand);
    }
}
exports.CompensationSagaAction = CompensationSagaAction;
//# sourceMappingURL=SagaAction.js.map