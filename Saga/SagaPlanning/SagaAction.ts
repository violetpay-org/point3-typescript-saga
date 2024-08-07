import * as endpoint from '../Endpoint/index';
import * as saga from '../SagaSession/index';

import { Executable, TxContext, BaseCombineExecutable } from "../../UnitOfWork/main";

export class LocalInvocationSagaAction<Tx extends TxContext> {
    invocationDestination: endpoint.LocalEndpoint<
        saga.SagaSession, 
        endpoint.Response, 
        endpoint.Response,
        Tx
    >;

    constructor(
        endpoint: endpoint.LocalEndpoint<
            saga.SagaSession, 
            endpoint.Response, 
            endpoint.Response,
            Tx
        >
    ) {
        this.invocationDestination = endpoint;
    }

    public async executeInvocation<S extends saga.SagaSession>(sagaSession: S): Promise<Executable<Tx>> {
        try {
            const handledDataSaver = await this.invocationDestination.handle(sagaSession);
            const successRes = new (this.invocationDestination.getCommandSuccessResCtor())({sagaId: sagaSession.getSagaId()});
            const successResSaver = this.invocationDestination.getSuccessResponseRepository().saveMessage(successRes);
            
            return BaseCombineExecutable(
                handledDataSaver,
                successResSaver
            );            
        } catch (e) {
            const failureRes = new (this.invocationDestination.getCommandFailureResCtor())({sagaId: sagaSession.getSagaId()});
            const failureResSaver = this.invocationDestination.getFailureResponseRepository().saveMessage(failureRes);
            return failureResSaver;
        }
    }
}

export class LocalCompensationSagaAction<Tx extends TxContext> {
    compensationDestination: endpoint.LocalEndpoint<
        saga.SagaSession, 
        endpoint.Response,
        endpoint.Response,
        Tx
    >;

    constructor(
        endpoint: endpoint.LocalEndpoint<
            saga.SagaSession, 
            endpoint.Response, 
            endpoint.Response,
            Tx
        >
    ) {
        this.compensationDestination = endpoint;
    }

    public async executeCompensation<S extends saga.SagaSession>(sagaSession: S): Promise<Executable<Tx>> {
        try {
            const handledDataSaver = await this.compensationDestination.handle(sagaSession);
            const successRes = new (this.compensationDestination.getCommandSuccessResCtor())({});
            const successResSaver = this.compensationDestination.getSuccessResponseRepository().saveMessage(successRes);
            
            return BaseCombineExecutable(
                handledDataSaver,
                successResSaver
            );            
        } catch (e) {
            const failureRes = new (this.compensationDestination.getCommandFailureResCtor())({});
            const failureResSaver = this.compensationDestination.getFailureResponseRepository().saveMessage(failureRes);
            return failureResSaver;
        }
    }
}
export class InvocationSagaAction<
    Tx extends TxContext,
    InvocationCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>
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
        >
    ) {
        this.commandRepository = commandRepository;
        this.invocationDestination = endpoint;
    }

    public async executeInvocation(sagaSession: saga.SagaSession): Promise<Executable<Tx>> {
        const invocationCommand = new (this.invocationDestination.getCommandReqCtor())(sagaSession);
        return this.commandRepository.saveMessage(invocationCommand);
    }
}

export class CompensationSagaAction<
    Tx extends TxContext,
    CompensationCommand extends endpoint.Command<saga.SagaSession, endpoint.CommandArguments>
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
        >
    ) {
        this.commandRepository = commandRepository;
        this.compensationDestination = endpoint;
    }

    public async executeCompensation(sagaSession: saga.SagaSession): Promise<Executable<Tx>> {
        const compensationCommand = new (this.compensationDestination.getCommandReqCtor())(sagaSession);
        return this.commandRepository.saveMessage(compensationCommand);
    }
}

// export interface InvocationSagaActionFactory<Tx extends TxContext, InvocationCommand extends endpoint.Command> {
//     (endpoint: endpoint.CommandEndpoint<InvocationCommand, endpoint.Command, endpoint.Command>): AbstractInvocationSagaAction<Tx, InvocationCommand>;
// }

// export interface CompensationSagaActionFactory<Tx extends TxContext, CompensationCommand extends endpoint.Command> {
//     (endpoint: endpoint.CommandEndpoint<CompensationCommand, endpoint.Command, endpoint.Command>): AbstractCompensationSagaAction<Tx, CompensationCommand>;
// }