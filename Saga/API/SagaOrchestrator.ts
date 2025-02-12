import { AbstractSaga } from './SagaRegistry';
import { ErrChannelNotFound, ErrDeadSagaSession, ErrSagaSessionNotFound, ErrStepNotFound } from '../Errors/index';

import * as endpoint from '../Endpoint/index';
import * as planning from '../SagaPlanning/index';
import * as saga from '../SagaSession/index';
import { AbstractSagaMessage } from '../Endpoint/CommandEndpoint';
import { ChannelName } from '../Endpoint/Channel';
import { Propagation, Transactional, TransactionContext } from '@tranjs/core';

export abstract class SagaOrchestrator<Tx extends TransactionContext> {
    constructor() {}

    @Transactional(Propagation.REQUIRES_NEW)
    public async startSaga<A extends saga.SagaSessionArguments, I extends saga.SagaSession>(
        sagaSessionArg: A,
        saga: AbstractSaga<Tx, A, I>,
    ) {
        const sagaSession = await saga.createSession(sagaSessionArg);
        const sagaDefinition = saga.getDefinition();
        const firstStep = sagaDefinition.getFirstStep();

        if (!firstStep) {
            throw new ErrStepNotFound();
        }

        sagaSession.updateCurrentStep(firstStep.getStepName());
        sagaSession.setForwardState();

        if (firstStep.isInvocable()) {
            await this.invokeStep(sagaSession, firstStep);
        } else {
            await this.stepForwardAndInvoke(sagaSession, firstStep, sagaDefinition);
        }

        await saga.getSagaRepository().saveTx(sagaSession);

        return;
    }

    @Transactional(Propagation.REQUIRES_NEW)
    public async orchestrate(
        saga: AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>,
        messageWithOrigin: endpoint.AbstractSagaMessageWithOrigin<AbstractSagaMessage>,
    ) {
        const message = messageWithOrigin.getSagaMessage();
        const originChan = messageWithOrigin.getOrigin();
        const sagaDefinition = saga.getDefinition();
        const sagaSession = await saga.getSagaRepository().load(message.getSagaId());
        if (!sagaSession) {
            throw new ErrSagaSessionNotFound();
        }

        const currentStepName = sagaSession.getCurrentStepName();
        const currentStep = sagaDefinition.getStep(currentStepName);

        if (sagaSession.isCompleted() || sagaSession.isFailed()) {
            throw new ErrDeadSagaSession();
        }

        if (!currentStep) {
            throw new ErrStepNotFound();
        }

        if (sagaSession.isInForwardDirection()) {
            await this.invocationResponseHandler(sagaSession, originChan, message, currentStep, sagaDefinition);
        } else if (sagaSession.isCompensating()) {
            await this.compensationResponseHandler(sagaSession, originChan, message, currentStep, sagaDefinition);
        }

        await saga.getSagaRepository().saveTx(sagaSession);
    }

    @Transactional(Propagation.MANDATORY)
    private async invocationResponseHandler<I extends saga.SagaSession>(
        sagaSession: I,
        originChan: ChannelName,
        message: endpoint.AbstractSagaMessage,
        sagaStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
    ) {
        const invocationAction = sagaStep.invocationAction;
        sagaSession.unsetPendingState();

        if (this.isFailureInvocationResponse(originChan, invocationAction)) {
            if (sagaStep.mustComplete()) {
                await this.retryInvocation(sagaSession, sagaStep);
                return;
            }
            await this.stepBackwardAndStartCompensation(sagaSession, sagaStep, sagaDefinition);
            return;
        }

        await this.stepForwardAndInvoke(sagaSession, sagaStep, sagaDefinition);
    }

    private isFailureInvocationResponse(
        originChan: ChannelName,
        invocationAction:
            | planning.InvocationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>>
            | planning.LocalInvocationSagaAction<Tx>,
    ): boolean {
        const originChannelName = originChan;
        const invocatedAt = invocationAction.invocationDestination;

        if (originChannelName === invocatedAt.getFailureResChannelName()) {
            return true;
        }

        if (originChannelName === invocatedAt.getSuccessResChannelName()) {
            return false;
        }

        throw new ErrChannelNotFound();
    }

    @Transactional(Propagation.MANDATORY)
    private async retryInvocation<I extends saga.SagaSession>(sagaSession: I, currentStep: planning.Step<Tx>) {
        if (!currentStep.mustComplete()) {
            return;
        }
        sagaSession.setMustCompleteState();
        await this.invokeStep(sagaSession, currentStep);
        return;
    }

    @Transactional(Propagation.MANDATORY)
    private async invokeStep(sagaSession: saga.SagaSession, currentStep: planning.Step<Tx>) {
        await currentStep.invocationAction.executeInvocation(sagaSession);
        sagaSession.setPendingState();
    }

    @Transactional(Propagation.MANDATORY)
    private async stepForwardAndInvoke<I extends saga.SagaSession>(
        sagaSession: I,
        currentStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
    ) {
        const currentStepName = currentStep.getStepName();
        const nextStep = sagaDefinition.getStepAfter(currentStepName);

        if (!nextStep) {
            sagaSession.setCompletionState();
            return;
        }

        sagaSession.updateCurrentStep(nextStep.getStepName());

        if (nextStep.isInvocable()) {
            await this.invokeStep(sagaSession, nextStep);
            return;
        }

        // Navigate until we find an invocable step while updating the current step.
        await this.stepForwardAndInvoke(sagaSession, nextStep, sagaDefinition);
    }

    @Transactional(Propagation.MANDATORY)
    private async compensationResponseHandler<I extends saga.SagaSession>(
        sagaSession: I,
        originChan: ChannelName,
        message: endpoint.AbstractSagaMessage,
        sagaStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
    ) {
        const compensationAction = sagaStep.compensationAction;
        sagaSession.unsetPendingState();

        console.log(this.isFailureCompensationResponse(originChan, compensationAction));
        if (this.isFailureCompensationResponse(originChan, compensationAction)) {
            await this.retryCompensation(sagaSession, sagaStep);
            return;
        }
        await this.stepBackwardAndStartCompensation(sagaSession, sagaStep, sagaDefinition);
        return;
    }

    private isFailureCompensationResponse(
        originChan: ChannelName,
        compensationAction:
            | planning.CompensationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>>
            | planning.LocalCompensationSagaAction<Tx>,
    ): boolean {
        const originChannelName = originChan;
        const compensatedAt = compensationAction.compensationDestination;

        if (originChannelName == compensatedAt.getFailureResChannelName()) {
            return true;
        }

        if (originChannelName == compensatedAt.getSuccessResChannelName()) {
            return false;
        }

        throw new ErrChannelNotFound();
    }

    @Transactional(Propagation.MANDATORY)
    private async retryCompensation<I extends saga.SagaSession>(sagaSession: I, currentStep: planning.Step<Tx>) {
        sagaSession.setCompensationState();
        await this.compensateStep(sagaSession, currentStep);
        return;
    }

    @Transactional(Propagation.MANDATORY)
    private async stepBackwardAndStartCompensation<I extends saga.SagaSession>(
        sagaSession: I,
        currentStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
    ) {
        const currentStepName = currentStep.getStepName();
        const previousStep = sagaDefinition.getStepBefore(currentStepName);

        if (!previousStep) {
            sagaSession.setFailureState();
            return;
        }

        sagaSession.updateCurrentStep(previousStep.getStepName());

        if (previousStep.isCompensatable()) {
            sagaSession.setCompensationState();

            await this.compensateStep(sagaSession, previousStep);
            return;
        }

        // Navigate until we find a compensatable step while updating the current step.
        await this.stepBackwardAndStartCompensation(sagaSession, previousStep, sagaDefinition);
    }

    @Transactional(Propagation.MANDATORY)
    private async compensateStep(sagaSession: saga.SagaSession, currentStep: planning.Step<Tx>) {
        await currentStep.compensationAction.executeCompensation(sagaSession);
        sagaSession.setPendingState();
    }
}

export class BaseSagaOrchestrator<Tx extends TransactionContext> extends SagaOrchestrator<Tx> {
    constructor() {
        super();
    }
}
