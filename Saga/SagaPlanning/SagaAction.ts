import * as endpoint from '../Endpoint/index';
import * as saga from '../SagaSession/index';
import { Propagation, Transactional, TransactionContext } from '@tranjs/core';

export class LocalInvocationSagaAction<Tx extends TransactionContext> {
    invocationDestination: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>;

    constructor(endpoint: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>) {
        this.invocationDestination = endpoint;
    }

    @Transactional(Propagation.MANDATORY)
    public async executeInvocation<S extends saga.SagaSession>(sagaSession: S): Promise<void> {
        try {
            await this.invocationDestination.handle(sagaSession);
            const successRes = new (this.invocationDestination.getCommandSuccessResCtor())({
                sagaId: sagaSession.getSagaId(),
            });
            await this.invocationDestination.getSuccessResponseRepository().saveMessage(successRes);
        } catch (e) {
            const failureRes = new (this.invocationDestination.getCommandFailureResCtor())({
                sagaId: sagaSession.getSagaId(),
            });
            await this.invocationDestination.getFailureResponseRepository().saveMessage(failureRes);
        }
    }
}

export class LocalCompensationSagaAction<Tx extends TransactionContext> {
    compensationDestination: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>;

    constructor(endpoint: endpoint.LocalEndpoint<saga.SagaSession, endpoint.Response, endpoint.Response, Tx>) {
        this.compensationDestination = endpoint;
    }

    @Transactional(Propagation.MANDATORY)
    public async executeCompensation<S extends saga.SagaSession>(sagaSession: S): Promise<void> {
        try {
            await this.compensationDestination.handle(sagaSession);
            const successRes = new (this.compensationDestination.getCommandSuccessResCtor())({});
            await this.compensationDestination.getSuccessResponseRepository().saveMessage(successRes);
        } catch (e) {
            const failureRes = new (this.compensationDestination.getCommandFailureResCtor())({});
            await this.compensationDestination.getFailureResponseRepository().saveMessage(failureRes);
        }
    }
}
export class InvocationSagaAction<
    Tx extends TransactionContext,
    InvocationCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>,
> {
    protected commandRepository: endpoint.CommandRepository<InvocationCommand, Tx>;
    invocationDestination: endpoint.CommandEndpoint<
        saga.SagaSession,
        InvocationCommand,
        endpoint.Response,
        endpoint.Response,
        Tx
    >;

    constructor(
        commandRepository: endpoint.CommandRepository<InvocationCommand, Tx>,
        endpoint: endpoint.CommandEndpoint<
            saga.SagaSession,
            InvocationCommand,
            endpoint.Response,
            endpoint.Response,
            Tx
        >,
    ) {
        this.commandRepository = commandRepository;
        this.invocationDestination = endpoint;
    }

    @Transactional(Propagation.MANDATORY)
    public async executeInvocation(sagaSession: saga.SagaSession): Promise<void> {
        const invocationCommand = new (this.invocationDestination.getCommandReqCtor())(sagaSession);
        await this.commandRepository.saveMessage(invocationCommand);
    }
}

export class CompensationSagaAction<
    Tx extends TransactionContext,
    CompensationCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>,
> {
    protected commandRepository: endpoint.CommandRepository<CompensationCommand, Tx>;
    compensationDestination: endpoint.CommandEndpoint<
        saga.SagaSession,
        CompensationCommand,
        endpoint.Response,
        endpoint.Response,
        Tx
    >;

    constructor(
        commandRepository: endpoint.CommandRepository<CompensationCommand, Tx>,
        endpoint: endpoint.CommandEndpoint<
            saga.SagaSession,
            CompensationCommand,
            endpoint.Response,
            endpoint.Response,
            Tx
        >,
    ) {
        this.commandRepository = commandRepository;
        this.compensationDestination = endpoint;
    }

    @Transactional(Propagation.MANDATORY)
    public async executeCompensation(sagaSession: saga.SagaSession): Promise<void> {
        const compensationCommand = new (this.compensationDestination.getCommandReqCtor())(sagaSession);
        await this.commandRepository.saveMessage(compensationCommand);
    }
}

// export interface InvocationSagaActionFactory<Tx extends TxContext, InvocationCommand extends endpoint.Command> {
//     (endpoint: endpoint.CommandEndpoint<InvocationCommand, endpoint.Command, endpoint.Command>): AbstractInvocationSagaAction<Tx, InvocationCommand>;
// }

// export interface CompensationSagaActionFactory<Tx extends TxContext, CompensationCommand extends endpoint.Command> {
//     (endpoint: endpoint.CommandEndpoint<CompensationCommand, endpoint.Command, endpoint.Command>): AbstractCompensationSagaAction<Tx, CompensationCommand>;
// }
