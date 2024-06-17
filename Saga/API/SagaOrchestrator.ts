import { TxContext, UnitOfWork, UnitOfWorkFactory } from "src/point3-typescript-saga/UnitOfWork/main";
import { AbstractSaga } from "./SagaRegistry";
import { ErrChannelNotFound, ErrStepNotFound } from "../Errors";

import { endpoint } from "../Endpoint";
import { saga, step, sagaDefinition } from "../Saga";  

export abstract class SagaOrchestrator<Tx extends TxContext> {
    private unitOfWorkFactory: UnitOfWorkFactory<Tx>;

    public async startSaga<A extends saga.SagaCreationArguments, I extends saga.SagaSession>(saga: AbstractSaga<Tx, A, I>, sagaArg: A) {
        const unitOfWork = this.unitOfWorkFactory();
        const sagaSessionSagaSession = await saga.createSaga(sagaArg);
        const sagaDefinition = saga.getDefinition();
        const firstStep = sagaDefinition.getFirstStep();

        if (!firstStep) {
            throw ErrStepNotFound;
        }

        sagaSessionSagaSession.updateCurrentStep(firstStep.getStepName());
        sagaSessionSagaSession.setForwardState();

        const sagaSaver = saga.getSagaRepository().saveTx(sagaSessionSagaSession);
        unitOfWork.addToWork(sagaSaver);

        if (firstStep.isInvocable()) {
            await this.invokeStep(sagaSessionSagaSession, firstStep, unitOfWork);
        } else {
            await this.stepForwardAndInvoke(
                sagaSessionSagaSession,
                firstStep,
                sagaDefinition,
                unitOfWork
            );
        }
        
        await unitOfWork.Commit();
        return;
    }

    public async orchestrate<I extends saga.SagaSession>(
        saga: AbstractSaga<Tx, saga.SagaCreationArguments, I>, 
        message: endpoint.AbstractSagaMessageWithOrigin
    ) {
        const sagaDefinition = saga.getDefinition();
        const sagaSessionSagaSession = await saga
            .getSagaRepository()
            .load(message.getSagaId());
        const currentStepName = sagaSessionSagaSession.getCurrentStepName();
        const currentStep = sagaDefinition.getStep(currentStepName);

        if (!currentStep) {
            throw ErrStepNotFound;
        }

        const unitOfWork = this.unitOfWorkFactory();

        if (sagaSessionSagaSession.isInForwardDirection()) {
            await this.invocationResponseHandler(
                sagaSessionSagaSession,
                message,
                currentStep,
                sagaDefinition,
                unitOfWork
            );
        } else if (sagaSessionSagaSession.isCompensating()) {
            await this.compensationResponseHandler(
                sagaSessionSagaSession,
                message,
                currentStep,
                sagaDefinition,
                unitOfWork
            );
        }

        const sagaSaver = saga.getSagaRepository().saveTx(sagaSessionSagaSession);
        unitOfWork.addToWork(sagaSaver);
        await unitOfWork.Commit();
    }

    private async invokeStep(
        sagaSessionSagaSession: saga.SagaSession,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const command = await currentStep.invocationAction.executeInvocation();
        unitOfWork.addToWork(command);
        sagaSessionSagaSession.setPendingState();
    }

    private async compensateStep(
        sagaSessionSagaSession: saga.SagaSession,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const command = await currentStep.compensationAction.executeCompensation();
        unitOfWork.addToWork(command);
        sagaSessionSagaSession.setPendingState();
    }

    private async compensationResponseHandler<I extends saga.SagaSession>(
        sagaSessionSagaSession: I,
        message: endpoint.AbstractSagaMessageWithOrigin,
        sagaStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const compensationAction = sagaStep.compensationAction;
        sagaSessionSagaSession.unsetPendingState();

        if (this.isFailureCompensationResponse(message, compensationAction)) {
            await this.retryCompensation(
                sagaSessionSagaSession,
                sagaStep,
                unitOfWork
            );
            return;
        }
        await this.stepBackwardAndStartCompensation(
            sagaSessionSagaSession,
            sagaStep,
            sagaDefinition,
            unitOfWork
        );
        return;
    }

    private async invocationResponseHandler<I extends saga.SagaSession>(
        sagaSessionSagaSession: I,
        message: endpoint.AbstractSagaMessageWithOrigin,
        sagaStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const invocationAction = sagaStep.invocationAction;
        sagaSessionSagaSession.unsetPendingState();

        if (this.isFailureInvocationResponse(message, invocationAction)) {
            if (sagaStep.mustComplete()) {
                await this.retryInvocation(
                    sagaSessionSagaSession,
                    sagaStep,
                    unitOfWork
                );
                return;
            }
            await this.stepBackwardAndStartCompensation(
                sagaSessionSagaSession,
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
            sagaSessionSagaSession,
            sagaStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private async retryInvocation<I extends saga.SagaSession>(
        sagaSessionSagaSession: I,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) { 
        if (!currentStep.mustComplete()) {
            return;
        }
        sagaSessionSagaSession.setMustCompleteState();
        await this.invokeStep(sagaSessionSagaSession, currentStep, unitOfWork);
        return;
    }

    private async retryCompensation<I extends saga.SagaSession>(
        sagaSessionSagaSession: I,
        currentStep: step.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        sagaSessionSagaSession.setCompensationState();
        await this.compensateStep(sagaSessionSagaSession, currentStep, unitOfWork);
        return;
    }

    private async stepForwardAndInvoke<I extends saga.SagaSession>(
        sagaSessionSagaSession: I,
        currentStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const currentStepName = currentStep.getStepName();
        const nextStep = sagaDefinition.getStepAfter(currentStepName);

        if (!nextStep) {
            sagaSessionSagaSession.setCompletionState();
            return;
        }

        sagaSessionSagaSession.updateCurrentStep(nextStep.getStepName());

        if (nextStep.isInvocable()) {
            await this.invokeStep(sagaSessionSagaSession, nextStep, unitOfWork);
            return;
        }

        // Navigate untill we find an invocable step while updating the current step.
        await this.stepForwardAndInvoke(
            sagaSessionSagaSession,
            nextStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private async stepBackwardAndStartCompensation<I extends saga.SagaSession>(
        sagaSessionSagaSession: I,
        currentStep: step.Step<Tx>,
        sagaDefinition: sagaDefinition.SagaDefinition<I, Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const currentStepName = currentStep.getStepName();
        const previousStep = sagaDefinition.getStepBefore(currentStepName);

        if (!previousStep) {
            sagaSessionSagaSession.setFailureState();
            return;
        }

        sagaSessionSagaSession.updateCurrentStep(previousStep.getStepName());

        if (previousStep.isCompensatable()) {
            sagaSessionSagaSession.setCompensationState();

            this.compensateStep(sagaSessionSagaSession, previousStep, unitOfWork);
            return;
        }

        // Navigate untill we find a compensatable step while updating the current step.
        await this.stepBackwardAndStartCompensation(
            sagaSessionSagaSession,
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