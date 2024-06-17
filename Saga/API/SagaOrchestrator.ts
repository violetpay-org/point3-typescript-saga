import { TxContext, UnitOfWork, UnitOfWorkFactory } from "src/point3-typescript-saga/UnitOfWork/main";
import { AbstractSaga } from "./SagaRegistry";
import { ErrChannelNotFound, ErrStepNotFound } from "../Errors";

import { endpoint } from "../Endpoint";
import { saga, step, sagaDefinition } from "../Saga";  

export abstract class SagaOrchestrator<Tx extends TxContext> {
    private unitOfWorkFactory: UnitOfWorkFactory<Tx>;

    public async startSaga<A extends saga.SagaCreationArguments, I extends saga.SagaInstance>(saga: AbstractSaga<Tx, A, I>, sagaArg: A) {
        const unitOfWork = this.unitOfWorkFactory();
        const sagaInstance = await saga.createSaga(sagaArg);
        const sagaDefinition = saga.getDefinition();
        const firstStep = sagaDefinition.getFirstStep();

        if (!firstStep) {
            throw ErrStepNotFound;
        }

        sagaInstance.updateCurrentStep(firstStep.getStepName());
        sagaInstance.setForwardState();

        const sagaSaver = saga.getSagaRepository().saveTx(sagaInstance);
        unitOfWork.addToWork(sagaSaver);

        if (firstStep.isInvocable()) {
            await this.invokeStep(sagaInstance, firstStep, unitOfWork);
        } else {
            await this.stepForwardAndInvoke(
                sagaInstance,
                firstStep,
                sagaDefinition,
                unitOfWork
            );
        }
        
        await unitOfWork.Commit();
        return;
    }

    public async orchestrate<I extends saga.SagaInstance>(
        saga: AbstractSaga<Tx, saga.SagaCreationArguments, I>, 
        message: endpoint.AbstractSagaMessageWithOrigin
    ) {
        const sagaDefinition = saga.getDefinition();
        const sagaInstance = await saga
            .getSagaRepository()
            .load(message.getSagaId());
        const currentStepName = sagaInstance.getCurrentStepName();
        const currentStep = sagaDefinition.getStep(currentStepName);

        if (!currentStep) {
            throw ErrStepNotFound;
        }

        const unitOfWork = this.unitOfWorkFactory();

        if (sagaInstance.isInForwardDirection()) {
            await this.invocationResponseHandler(
                sagaInstance,
                message,
                currentStep,
                sagaDefinition,
                unitOfWork
            );
        } else if (sagaInstance.isCompensating()) {
            await this.compensationResponseHandler(
                sagaInstance,
                message,
                currentStep,
                sagaDefinition,
                unitOfWork
            );
        }

        const sagaSaver = saga.getSagaRepository().saveTx(sagaInstance);
        unitOfWork.addToWork(sagaSaver);
        await unitOfWork.Commit();
    }

    private async invokeStep(
        sagaInstance: saga.SagaInstance,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const command = await currentStep.invocationAction.executeInvocation();
        unitOfWork.addToWork(command);
        sagaInstance.setPendingState();
    }

    private async compensateStep(
        sagaInstance: saga.SagaInstance,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const command = await currentStep.compensationAction.executeCompensation();
        unitOfWork.addToWork(command);
        sagaInstance.setPendingState();
    }

    private async compensationResponseHandler<I extends saga.SagaInstance>(
        sagaInstance: I,
        message: endpoint.AbstractSagaMessageWithOrigin,
        sagaStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const compensationAction = sagaStep.compensationAction;
        sagaInstance.unsetPendingState();

        if (this.isFailureCompensationResponse(message, compensationAction)) {
            await this.retryCompensation(
                sagaInstance,
                sagaStep,
                unitOfWork
            );
            return;
        }
        await this.stepBackwardAndStartCompensation(
            sagaInstance,
            sagaStep,
            sagaDefinition,
            unitOfWork
        );
        return;
    }

    private async invocationResponseHandler<I extends saga.SagaInstance>(
        sagaInstance: I,
        message: endpoint.AbstractSagaMessageWithOrigin,
        sagaStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const invocationAction = sagaStep.invocationAction;
        sagaInstance.unsetPendingState();

        if (this.isFailureInvocationResponse(message, invocationAction)) {
            if (sagaStep.mustComplete()) {
                await this.retryInvocation(
                    sagaInstance,
                    sagaStep,
                    unitOfWork
                );
                return;
            }
            await this.stepBackwardAndStartCompensation(
                sagaInstance,
                sagaStep,
                sagaDefinition,
                unitOfWork
            );
            return;
        }

        if (sagaStep.hasReplyHandlers()) {
            for (const handler of sagaStep.onReplies) {
                // handler error handling needed
                const result = await handler(message);
                unitOfWork.addToWork(result);
            }
        }

        await this.stepForwardAndInvoke(
            sagaInstance,
            sagaStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private async retryInvocation<I extends saga.SagaInstance>(
        sagaInstance: I,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) { 
        if (!currentStep.mustComplete()) {
            return;
        }
        sagaInstance.setMustCompleteState();
        await this.invokeStep(sagaInstance, currentStep, unitOfWork);
        return;
    }

    private async retryCompensation<I extends saga.SagaInstance>(
        sagaInstance: I,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        sagaInstance.setCompensationState();
        await this.compensateStep(sagaInstance, currentStep, unitOfWork);
        return;
    }

    private async stepForwardAndInvoke<I extends saga.SagaInstance>(
        sagaInstance: I,
        currentStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const currentStepName = currentStep.getStepName();
        const nextStep = sagaDefinition.getStepAfter(currentStepName);

        if (!nextStep) {
            sagaInstance.setCompletionState();
            return;
        }

        sagaInstance.updateCurrentStep(nextStep.getStepName());

        if (nextStep.isInvocable()) {
            await this.invokeStep(sagaInstance, nextStep, unitOfWork);
            return;
        }

        // Navigate untill we find an invocable step while updating the current step.
        await this.stepForwardAndInvoke(
            sagaInstance,
            nextStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private async stepBackwardAndStartCompensation<I extends saga.SagaInstance>(
        sagaInstance: I,
        currentStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const currentStepName = currentStep.getStepName();
        const previousStep = sagaDefinition.getStepBefore(currentStepName);

        if (!previousStep) {
            sagaInstance.setFailureState();
            return;
        }

        sagaInstance.updateCurrentStep(previousStep.getStepName());

        if (previousStep.isCompensatable()) {
            sagaInstance.setCompensationState();

            this.compensateStep(sagaInstance, previousStep, unitOfWork);
            return;
        }

        // Navigate untill we find a compensatable step while updating the current step.
        await this.stepBackwardAndStartCompensation(
            sagaInstance,
            previousStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private isFailureInvocationResponse(
        message: endpoint.AbstractSagaMessageWithOrigin,
        invocationAction: saga.AbstractInvocationSagaAction<Tx>
    ): boolean {
        const originChannelName = message.getOrigin();
        const invocatedAt = invocationAction.invocationDestination;

        if (originChannelName == invocatedAt.getFailureResChannelName()) {
            return true;
        }

        if (originChannelName == invocatedAt.getSuccessResChannelName()) {
            return false;
        }

        throw ErrChannelNotFound;
    }

    private isFailureCompensationResponse(
        message: endpoint.AbstractSagaMessageWithOrigin,
        compensationAction: saga.AbstractCompensationSagaAction<Tx>
    ): boolean {
        const originChannelName = message.getOrigin();
        const compensatedAt = compensationAction.compensationDestination;

        if (originChannelName == compensatedAt.getFailureResChannelName()) {
            return true;
        }

        if (originChannelName == compensatedAt.getSuccessResChannelName()) {
            return false;
        }

        throw ErrChannelNotFound;
    }
}