import { endpoint, commandRepository } from "../Endpoint";
import { Executable, TxContext, BaseCombineExecutable } from "../../UnitOfWork/main";

import * as saga from '../SagaSession'

export class LocalInvocationSagaAction<Tx extends TxContext> {
    invocationDestination: endpoint.LocalEndpoint<saga.session.SagaSession, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>;

    constructor(
        endpoint: endpoint.LocalEndpoint<saga.session.SagaSession, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>
    ) {
        this.invocationDestination = endpoint;
    }

    public async executeInvocation<S extends saga.session.SagaSession>(sagaSession: S): Promise<Executable<Tx>> {
        try {
            const handledDataSaver = this.invocationDestination.handle<Tx>(sagaSession);
            const successResCommand = new (this.invocationDestination.getCommandSuccessResCtor())(sagaSession);
            const successResCommandSaver = this.invocationDestination.getSuccessCommandRepository().saveCommand(successResCommand);
            
            return BaseCombineExecutable(
                handledDataSaver,
                successResCommandSaver
            );            
        } catch (e) {
            const failureResCommand = new (this.invocationDestination.getCommandFailureResCtor())(sagaSession);
            const failureResCommandSaver = this.invocationDestination.getFailureCommandRepository().saveCommand(failureResCommand);
            return failureResCommandSaver;
        }
    }
}

export class LocalCompensationSagaAction<Tx extends TxContext> {
    compensationDestination: endpoint.LocalEndpoint<saga.session.SagaSession, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>;

    constructor(
        endpoint: endpoint.LocalEndpoint<saga.session.SagaSession, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>
    ) {
        this.compensationDestination = endpoint;
    }

    public async executeCompensation<S extends saga.session.SagaSession>(sagaSession: S): Promise<Executable<Tx>> {
        try {
            const handledDataSaver = this.compensationDestination.handle<Tx>(sagaSession);
            const successResCommand = new (this.compensationDestination.getCommandSuccessResCtor())(sagaSession);
            const successResCommandSaver = this.compensationDestination.getSuccessCommandRepository().saveCommand(successResCommand);
            
            return BaseCombineExecutable(
                handledDataSaver,
                successResCommandSaver
            );            
        } catch (e) {
            const failureResCommand = new (this.compensationDestination.getCommandFailureResCtor())(sagaSession);
            const failureResCommandSaver = this.compensationDestination.getFailureCommandRepository().saveCommand(failureResCommand);
            return failureResCommandSaver;
        }
    }
}
export class InvocationSagaAction<
    Tx extends TxContext,
    InvocationCommand extends endpoint.Command<saga.session.SagaSession>
> {
    protected commandRepository: commandRepository.CommandRepository<InvocationCommand, Tx>;
    invocationDestination: endpoint.CommandEndpoint<saga.session.SagaSession, InvocationCommand, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>;

    constructor(
        commandRepository: commandRepository.CommandRepository<InvocationCommand, Tx>,
        endpoint: endpoint.CommandEndpoint<saga.session.SagaSession, InvocationCommand, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>
    ) {
        this.commandRepository = commandRepository;
        this.invocationDestination = endpoint;
    }

    public async executeInvocation(sagaSession: saga.session.SagaSession): Promise<Executable<Tx>> {
        const invocationCommand = new (this.invocationDestination.getCommandReqCtor())(sagaSession);
        return this.commandRepository.saveCommand(invocationCommand);
    }
}

export class CompensationSagaAction<
    Tx extends TxContext,
    CompensationCommand extends endpoint.Command<saga.session.SagaSession>
> {
    protected commandRepository: commandRepository.CommandRepository<CompensationCommand, Tx>;
    compensationDestination: endpoint.CommandEndpoint<saga.session.SagaSession, CompensationCommand, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>;

    constructor(
        commandRepository: commandRepository.CommandRepository<CompensationCommand, Tx>,
        endpoint: endpoint.CommandEndpoint<saga.session.SagaSession, CompensationCommand, endpoint.Command<saga.session.SagaSession>, endpoint.Command<saga.session.SagaSession>>
    ) {
        this.commandRepository = commandRepository;
        this.compensationDestination = endpoint;
    }

    public async executeCompensation(sagaSession: saga.session.SagaSession): Promise<Executable<Tx>> {
        const compensationCommand = new (this.compensationDestination.getCommandReqCtor())(sagaSession);
        return this.commandRepository.saveCommand(compensationCommand);
    }
}

// export interface InvocationSagaActionFactory<Tx extends TxContext, InvocationCommand extends endpoint.Command> {
//     (endpoint: endpoint.CommandEndpoint<InvocationCommand, endpoint.Command, endpoint.Command>): AbstractInvocationSagaAction<Tx, InvocationCommand>;
// }

// export interface CompensationSagaActionFactory<Tx extends TxContext, CompensationCommand extends endpoint.Command> {
//     (endpoint: endpoint.CommandEndpoint<CompensationCommand, endpoint.Command, endpoint.Command>): AbstractCompensationSagaAction<Tx, CompensationCommand>;
// }