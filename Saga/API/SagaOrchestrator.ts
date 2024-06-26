import { TxContext, UnitOfWork, UnitOfWorkFactory } from "../../UnitOfWork/main";
import { AbstractSaga } from "./SagaRegistry";
import { ErrChannelNotFound, ErrDeadSagaSession, ErrStepNotFound } from "../Errors/index";

import * as endpoint from "../Endpoint/index";
import * as planning from "../SagaPlanning/index";
import * as saga from "../SagaSession/index";
import { AbstractSagaMessage } from "../Endpoint/CommandEndpoint";
import { ChannelName } from "../Endpoint/Channel";

export abstract class SagaOrchestrator<Tx extends TxContext> {
    private unitOfWorkFactory: UnitOfWorkFactory<Tx>;

    constructor(unitOfWorkFactory: UnitOfWorkFactory<Tx>) {
        this.unitOfWorkFactory = unitOfWorkFactory;
    }

    public async startSaga<A extends saga.SagaSessionArguments, I extends saga.SagaSession>(
        sagaSessionArg: A,
        saga: AbstractSaga<Tx, A, I>, 
    ) {
        const unitOfWork = this.unitOfWorkFactory();
        const sagaSession = await saga.createSession(sagaSessionArg);
        const sagaDefinition = saga.getDefinition();
        const firstStep = sagaDefinition.getFirstStep();

        if (!firstStep) {
            throw ErrStepNotFound;
        }

        sagaSession.updateCurrentStep(firstStep.getStepName());
        sagaSession.setForwardState();

        const sagaSaver = saga.getSagaRepository().saveTx(sagaSession);
        unitOfWork.addToWork(sagaSaver);

        if (firstStep.isInvocable()) {
            await this.invokeStep(sagaSession, firstStep, unitOfWork);
        } else {
            await this.stepForwardAndInvoke(
                sagaSession,
                firstStep,
                sagaDefinition,
                unitOfWork
            );
        }
        
        await unitOfWork.Commit();
        return;
    }

    public async orchestrate(
        saga: AbstractSaga<Tx, saga.SagaSessionArguments, saga.SagaSession>, 
        messageWithOrigin: endpoint.AbstractSagaMessageWithOrigin<AbstractSagaMessage>
    ) {
        const message = messageWithOrigin.getSagaMessage();
        const originChan = messageWithOrigin.getOrigin();
        const sagaDefinition = saga.getDefinition();
        const sagaSession = await saga
            .getSagaRepository()
            .load(message.getSagaId());
        const currentStepName = sagaSession.getCurrentStepName();
        const currentStep = sagaDefinition.getStep(currentStepName);

        if (sagaSession.isCompleted() ||
            sagaSession.isFailed()
        ) {
            throw ErrDeadSagaSession;
        }

        if (!currentStep) {
            throw ErrStepNotFound;
        }

        const unitOfWork = this.unitOfWorkFactory();

        if (sagaSession.isInForwardDirection()) {
            await this.invocationResponseHandler(
                sagaSession,
                originChan,
                message,
                currentStep,
                sagaDefinition,
                unitOfWork
            );
        } else if (sagaSession.isCompensating()) {
            await this.compensationResponseHandler(
                sagaSession,
                originChan,
                message,
                currentStep,
                sagaDefinition,
                unitOfWork
            );
        }

        const sagaSaver = saga.getSagaRepository().saveTx(sagaSession);
        unitOfWork.addToWork(sagaSaver);
        await unitOfWork.Commit();
    }

    private async invocationResponseHandler<I extends saga.SagaSession>(
        sagaSession: I,
        originChan: ChannelName,
        message: endpoint.AbstractSagaMessage,
        sagaStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const invocationAction = sagaStep.invocationAction;
        sagaSession.unsetPendingState();

        if (this.isFailureInvocationResponse(originChan, invocationAction)) {
            if (sagaStep.mustComplete()) {
                await this.retryInvocation(
                    sagaSession,
                    sagaStep,
                    unitOfWork
                );
                return;
            }
            await this.stepBackwardAndStartCompensation(
                sagaSession,
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
            sagaSession,
            sagaStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private isFailureInvocationResponse(
        originChan: ChannelName,
        invocationAction: 
            planning.InvocationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>> | 
            planning.LocalInvocationSagaAction<Tx>
    ): boolean {
        const originChannelName = originChan;
        const invocatedAt = invocationAction.invocationDestination;

        if (originChannelName === invocatedAt.getFailureResChannelName()) {
            return true;
        }

        if (originChannelName === invocatedAt.getSuccessResChannelName()) {
            return false;
        }

        throw ErrChannelNotFound;
    }

    private async retryInvocation<I extends saga.SagaSession>(
        sagaSession: I,
        currentStep: planning.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) { 
        if (!currentStep.mustComplete()) {
            return;
        }
        sagaSession.setMustCompleteState();
        await this.invokeStep(sagaSession, currentStep, unitOfWork);
        return;
    }

    private async invokeStep(
        sagaSession: saga.SagaSession,
        currentStep: planning.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const command = await currentStep.invocationAction.executeInvocation(sagaSession);
        unitOfWork.addToWork(command);
        sagaSession.setPendingState();
    }

    private async stepForwardAndInvoke<I extends saga.SagaSession>(
        sagaSession: I,
        currentStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
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

        // Navigate until we find an invocable step while updating the current step.
        await this.stepForwardAndInvoke(
            sagaSession,
            nextStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private async compensationResponseHandler<I extends saga.SagaSession>(
        sagaSession: I,
        originChan: ChannelName,
        message: endpoint.AbstractSagaMessage,
        sagaStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const compensationAction = sagaStep.compensationAction;
        sagaSession.unsetPendingState();

        if (this.isFailureCompensationResponse(originChan, compensationAction)) {
            await this.retryCompensation(
                sagaSession,
                sagaStep,
                unitOfWork
            );
            return;
        }
        await this.stepBackwardAndStartCompensation(
            sagaSession,
            sagaStep,
            sagaDefinition,
            unitOfWork
        );
        return;
    }

    private isFailureCompensationResponse(
        originChan: ChannelName,
        compensationAction: 
            planning.CompensationSagaAction<Tx, endpoint.Command<saga.SagaSession, endpoint.CommandArguments>> |
            planning.LocalCompensationSagaAction<Tx>
    ): boolean {
        const originChannelName = originChan;
        const compensatedAt = compensationAction.compensationDestination;

        if (originChannelName == compensatedAt.getFailureResChannelName()) {
            return true;
        }

        if (originChannelName == compensatedAt.getSuccessResChannelName()) {
            return false;
        }

        throw ErrChannelNotFound;
    }

    private async retryCompensation<I extends saga.SagaSession>(
        sagaSession: I,
        currentStep: planning.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        sagaSession.setCompensationState();
        await this.compensateStep(sagaSession, currentStep, unitOfWork);
        return;
    }

    private async stepBackwardAndStartCompensation<I extends saga.SagaSession>(
        sagaSession: I,
        currentStep: planning.Step<Tx>,
        sagaDefinition: planning.SagaDefinition<Tx>,
        unitOfWork: UnitOfWork<Tx>
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

            await this.compensateStep(sagaSession, previousStep, unitOfWork);
            return;
        }

        // Navigate until we find a compensatable step while updating the current step.
        await this.stepBackwardAndStartCompensation(
            sagaSession,
            previousStep,
            sagaDefinition,
            unitOfWork
        );
    }

    private async compensateStep(
        sagaSession: saga.SagaSession,
        currentStep: planning.Step<Tx>,
        unitOfWork: UnitOfWork<Tx>
    ) {
        const command = await currentStep.compensationAction.executeCompensation(sagaSession);
        unitOfWork.addToWork(command);
        sagaSession.setPendingState();
    }
}

export class BaseSagaOrchestrator<Tx extends TxContext> extends SagaOrchestrator<Tx> {
    constructor(unitOfWorkFactory: UnitOfWorkFactory<Tx>) {
        super(unitOfWorkFactory);
    }
}