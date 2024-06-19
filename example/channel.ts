import * as point3Saga from "../Saga";
import { ChannelName } from "../Saga/Endpoint/Channel";
import {
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse
} from "./command";

const exampleChannels = {
    REQUEST: "ExampleSagaReqChan" as ChannelName,
    SUCCESS_RES: "ExampleSagaSuccessChan" as ChannelName,
    FAILURE_RES: "ExampleSagaFailureChan" as ChannelName
};

export class ExampleRequestChannel extends point3Saga.endpoint.channel.Channel<ExampleRequestCommand> {
    send(command: ExampleRequestCommand): void {
        throw new Error("Method not implemented.");
    }
    getChannelName(): string {
        return exampleChannels.REQUEST;
    }
}

export class ExampleSuccessResponseChannel extends point3Saga.endpoint.channel.Channel<ExampleSuccessResponse> {
    send(command: ExampleSuccessResponse): void {
        throw new Error("Method not implemented.");
    }
    getChannelName(): string {
        return exampleChannels.SUCCESS_RES;
    }
}

export class ExampleFailureResponseChannel extends point3Saga.endpoint.channel.Channel<ExampleFailureResponse> {
    send(command: ExampleFailureResponse): void {
        throw new Error("Method not implemented.");
    }
    getChannelName(): string {
        return exampleChannels.FAILURE_RES;
    }
}
