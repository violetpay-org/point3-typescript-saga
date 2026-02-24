"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BaseSagaOrchestrator = exports.SagaOrchestrator = void 0;
const index_1 = require("../Errors/index");
class SagaOrchestrator {
    constructor(unitOfWorkFactory) {
        this.unitOfWorkFactory = unitOfWorkFactory;
    }
    async startSaga(sagaSessionArg, saga) {
        const unitOfWork = this.unitOfWorkFactory();
        const sagaSession = await saga.createSession(sagaSessionArg);
        const sagaDefinition = saga.getDefinition();
        const firstStep = sagaDefinition.getFirstStep();
        if (!firstStep) {
            throw new index_1.ErrStepNotFound();
        }
        sagaSession.updateCurrentStep(firstStep.getStepName());
        sagaSession.setForwardState();
        const sagaSaver = saga.getSagaRepository().saveTx(sagaSession);
        unitOfWork.addToWork(sagaSaver);
        if (firstStep.isInvocable()) {
            await this.invokeStep(sagaSession, firstStep, unitOfWork);
        }
        else {
            await this.stepForwardAndInvoke(sagaSession, firstStep, sagaDefinition, unitOfWork);
        }
        await unitOfWork.Commit();
        return;
    }
    async orchestrate(saga, messageWithOrigin) {
        const message = messageWithOrigin.getSagaMessage();
        const originChan = messageWithOrigin.getOrigin();
        const sagaDefinition = saga.getDefinition();
        const sagaSession = await saga.getSagaRepository().load(message.getSagaId());
        if (!sagaSession) {
            throw new index_1.ErrSagaSessionNotFound();
        }
        const currentStepName = sagaSession.getCurrentStepName();
        const currentStep = sagaDefinition.getStep(currentStepName);
        if (sagaSession.isCompleted() || sagaSession.isFailed()) {
            throw new index_1.ErrDeadSagaSession();
        }
        if (!currentStep) {
            throw new index_1.ErrStepNotFound();
        }
        const unitOfWork = this.unitOfWorkFactory();
        if (sagaSession.isInForwardDirection()) {
            await this.invocationResponseHandler(sagaSession, originChan, message, currentStep, sagaDefinition, unitOfWork);
        }
        else if (sagaSession.isCompensating()) {
            await this.compensationResponseHandler(sagaSession, originChan, message, currentStep, sagaDefinition, unitOfWork);
        }
        const sagaSaver = saga.getSagaRepository().saveTx(sagaSession);
        unitOfWork.addToWork(sagaSaver);
        await unitOfWork.Commit();
    }
    async invocationResponseHandler(sagaSession, originChan, message, sagaStep, sagaDefinition, unitOfWork) {
        const invocationAction = sagaStep.invocationAction;
        sagaSession.unsetPendingState();
        if (this.isFailureInvocationResponse(originChan, invocationAction)) {
            if (sagaStep.mustComplete()) {
                await this.retryInvocation(sagaSession, sagaStep, unitOfWork);
                return;
            }
            await this.stepBackwardAndStartCompensation(sagaSession, sagaStep, sagaDefinition, unitOfWork);
            return;
        }
        if (sagaStep.hasReplyHandlers()) {
            for (const handler of sagaStep.onReplies) {
                const result = await handler(message, sagaSession);
                unitOfWork.addToWork(result);
            }
        }
        await this.stepForwardAndInvoke(sagaSession, sagaStep, sagaDefinition, unitOfWork);
    }
    isFailureInvocationResponse(originChan, invocationAction) {
        const originChannelName = originChan;
        const invocatedAt = invocationAction.invocationDestination;
        if (originChannelName === invocatedAt.getFailureResChannelName()) {
            return true;
        }
        if (originChannelName === invocatedAt.getSuccessResChannelName()) {
            return false;
        }
        throw new index_1.ErrChannelNotFound();
    }
    async retryInvocation(sagaSession, currentStep, unitOfWork) {
        if (!currentStep.mustComplete()) {
            return;
        }
        sagaSession.setMustCompleteState();
        await this.invokeStep(sagaSession, currentStep, unitOfWork);
        return;
    }
    async invokeStep(sagaSession, currentStep, unitOfWork) {
        const command = await currentStep.invocationAction.executeInvocation(sagaSession);
        unitOfWork.addToWork(command);
        sagaSession.setPendingState();
    }
    async stepForwardAndInvoke(sagaSession, currentStep, sagaDefinition, unitOfWork) {
        const currentStepName = currentStep.getStepName();
        const nextStep = sagaDefinition.getStepAfter(currentStepName);
        if (!nextStep) {
            sagaSession.setCompletionState();
            return;
        }
        sagaSession.updateCurrentStep(nextStep.getStepName());
        if (nextStep.isInvocable()) {
            await this.invokeStep(sagaSession, nextStep, unitOfWork);
            return;
        }
        await this.stepForwardAndInvoke(sagaSession, nextStep, sagaDefinition, unitOfWork);
    }
    async compensationResponseHandler(sagaSession, originChan, message, sagaStep, sagaDefinition, unitOfWork) {
        const compensationAction = sagaStep.compensationAction;
        sagaSession.unsetPendingState();
        if (this.isFailureCompensationResponse(originChan, compensationAction)) {
            await this.retryCompensation(sagaSession, sagaStep, unitOfWork);
            return;
        }
        await this.stepBackwardAndStartCompensation(sagaSession, sagaStep, sagaDefinition, unitOfWork);
        return;
    }
    isFailureCompensationResponse(originChan, compensationAction) {
        const originChannelName = originChan;
        const compensatedAt = compensationAction.compensationDestination;
        if (originChannelName == compensatedAt.getFailureResChannelName()) {
            return true;
        }
        if (originChannelName == compensatedAt.getSuccessResChannelName()) {
            return false;
        }
        throw new index_1.ErrChannelNotFound();
    }
    async retryCompensation(sagaSession, currentStep, unitOfWork) {
        sagaSession.setCompensationState();
        await this.compensateStep(sagaSession, currentStep, unitOfWork);
        return;
    }
    async stepBackwardAndStartCompensation(sagaSession, currentStep, sagaDefinition, unitOfWork) {
        const currentStepName = currentStep.getStepName();
        const previousStep = sagaDefinition.getStepBefore(currentStepName);
        if (!previousStep) {
            sagaSession.setFailureState();
            return;
        }
        sagaSession.updateCurrentStep(previousStep.getStepName());
        if (previousStep.isCompensatable()) {
            sagaSession.setCompensationState();
            await this.compensateStep(sagaSession, previousStep, unitOfWork);
            return;
        }
        await this.stepBackwardAndStartCompensation(sagaSession, previousStep, sagaDefinition, unitOfWork);
    }
    async compensateStep(sagaSession, currentStep, unitOfWork) {
        const command = await currentStep.compensationAction.executeCompensation(sagaSession);
        unitOfWork.addToWork(command);
        sagaSession.setPendingState();
    }
}
exports.SagaOrchestrator = SagaOrchestrator;
class BaseSagaOrchestrator extends SagaOrchestrator {
    constructor(unitOfWorkFactory) {
        super(unitOfWorkFactory);
    }
}
exports.BaseSagaOrchestrator = BaseSagaOrchestrator;
//# sourceMappingURL=SagaOrchestrator.js.map