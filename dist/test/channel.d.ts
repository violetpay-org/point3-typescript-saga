import * as point3Saga from "../Saga/index";
import { ExampleRequestCommand, ExampleSuccessResponse, ExampleFailureResponse } from "./command";
export declare class ExampleRequestChannel extends point3Saga.endpoint.AbstractChannel<ExampleRequestCommand> {
    static readonly CHANNEL_NAME: string;
    send(command: ExampleRequestCommand): Promise<void>;
    getChannelName(): string;
}
export declare class ExampleSuccessResponseChannel extends point3Saga.endpoint.AbstractChannel<ExampleSuccessResponse> {
    static readonly CHANNEL_NAME: string;
    send(command: ExampleSuccessResponse): Promise<void>;
    getChannelName(): string;
}
export declare class ExampleFailureResponseChannel extends point3Saga.endpoint.AbstractChannel<ExampleFailureResponse> {
    static readonly CHANNEL_NAME: string;
    send(command: ExampleFailureResponse): Promise<void>;
    getChannelName(): string;
}
export declare class ExampleLocalFailureResponseChannel extends point3Saga.endpoint.AbstractChannel<ExampleFailureResponse> {
    static readonly CHANNEL_NAME: string;
    send(command: ExampleFailureResponse): Promise<void>;
    getChannelName(): string;
}
export declare class ExampleLocalSuccessResponseChannel extends point3Saga.endpoint.AbstractChannel<ExampleSuccessResponse> {
    static readonly CHANNEL_NAME: string;
    send(command: ExampleSuccessResponse): Promise<void>;
    getChannelName(): string;
}
