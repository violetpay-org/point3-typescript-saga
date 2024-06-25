import * as point3Saga from "../Saga/index";
import { ChannelName } from "../Saga/Endpoint/Channel";
import {
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse
} from "./command";

const exampleChannels = {
    REQUEST: "ExampleSagaReqChan" as ChannelName,
    SUCCESS_RES: "ExampleSagaSuccessChan" as ChannelName,
    FAILURE_RES: "ExampleSagaFailureChan" as ChannelName,
    LOCAL_SUCCESS_RES: "ExampleSagaSuccessLocalChan" as ChannelName,
    LOCAL_FAILURE_RES: "ExampleSagaFailureLocalChan" as ChannelName,
};

export class ExampleRequestChannel extends point3Saga.endpoint.Channel<ExampleRequestCommand> {
    static readonly CHANNEL_NAME = exampleChannels.REQUEST;

    send(command: ExampleRequestCommand): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getChannelName(): string {
        return exampleChannels.REQUEST;
    }
}

export class ExampleSuccessResponseChannel extends point3Saga.endpoint.Channel<ExampleSuccessResponse> {
    static readonly CHANNEL_NAME = exampleChannels.SUCCESS_RES;

    send(command: ExampleSuccessResponse): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getChannelName(): string {
        return exampleChannels.SUCCESS_RES;
    }
}

export class ExampleFailureResponseChannel extends point3Saga.endpoint.Channel<ExampleFailureResponse> {
    static readonly CHANNEL_NAME = exampleChannels.FAILURE_RES;

    send(command: ExampleFailureResponse): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getChannelName(): string {
        return exampleChannels.FAILURE_RES;
    }
}

export class ExampleLocalFailureResponseChannel extends point3Saga.endpoint.Channel<ExampleFailureResponse> {
    static readonly CHANNEL_NAME = exampleChannels.LOCAL_FAILURE_RES;

    send(command: ExampleFailureResponse): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getChannelName(): string {
        return exampleChannels.LOCAL_FAILURE_RES;
    }
}

export class ExampleLocalSuccessResponseChannel extends point3Saga.endpoint.Channel<ExampleSuccessResponse> {
    static readonly CHANNEL_NAME = exampleChannels.LOCAL_SUCCESS_RES;

    send(command: ExampleSuccessResponse): Promise<void> {
        throw new Error("Method not implemented.");
    }

    getChannelName(): string {
        return exampleChannels.LOCAL_SUCCESS_RES;
    }
}
