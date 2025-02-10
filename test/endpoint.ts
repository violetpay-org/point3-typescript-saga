import * as point3Saga from '../Saga/index';
import {
    ExampleFailureResponseChannel,
    ExampleLocalFailureResponseChannel,
    ExampleLocalSuccessResponseChannel,
    ExampleRequestChannel,
    ExampleSuccessResponseChannel,
} from './channel';
import { ExampleRequestCommand, ExampleSuccessResponse, ExampleFailureResponse } from './command';
import { TransactionContext } from '@tranjs/core';

export class ExampleEndpoint<Tx extends TransactionContext> extends point3Saga.endpoint.CommandEndpoint<
    point3Saga.saga.SagaSession,
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse,
    Tx
> {
    constructor(commandRepository: point3Saga.endpoint.CommandRepository<ExampleRequestCommand, Tx>) {
        super(
            ExampleRequestChannel.CHANNEL_NAME,
            ExampleSuccessResponseChannel.CHANNEL_NAME,
            ExampleFailureResponseChannel.CHANNEL_NAME,
            ExampleRequestCommand,
            ExampleSuccessResponse,
            ExampleFailureResponse,
            commandRepository,
        );
    }
}

export class AlwaysSuccessLocalEndpoint<Tx extends TransactionContext> extends point3Saga.endpoint.LocalEndpoint<
    point3Saga.saga.SagaSession,
    ExampleSuccessResponse,
    ExampleFailureResponse,
    Tx
> {
    async handle(sagaSession: point3Saga.saga.SagaSession): Promise<void> {
        console.log('Handling saga session', sagaSession.getSagaId());
        return console.log('Handled saga session', sagaSession.getSagaId());
    }

    constructor(
        successCommandRepository: point3Saga.endpoint.ResponseRepository<ExampleSuccessResponse, Tx>,
        failureCommandRepository: point3Saga.endpoint.ResponseRepository<ExampleFailureResponse, Tx>,
    ) {
        super(
            ExampleLocalSuccessResponseChannel.CHANNEL_NAME,
            ExampleLocalFailureResponseChannel.CHANNEL_NAME,
            ExampleSuccessResponse,
            ExampleFailureResponse,
            successCommandRepository,
            failureCommandRepository,
        );
    }
}

export class AlwaysFailingLocalEndpoint<Tx extends TransactionContext> extends AlwaysSuccessLocalEndpoint<Tx> {
    async handle(sagaSession: point3Saga.saga.SagaSession): Promise<void> {
        throw new Error('Always fails');
    }
}
