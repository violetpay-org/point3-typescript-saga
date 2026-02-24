"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleLocalSuccessResponseChannel = exports.ExampleLocalFailureResponseChannel = exports.ExampleFailureResponseChannel = exports.ExampleSuccessResponseChannel = exports.ExampleRequestChannel = void 0;
const point3Saga = __importStar(require("../Saga/index"));
const exampleChannels = {
    REQUEST: "ExampleSagaReqChan",
    SUCCESS_RES: "ExampleSagaSuccessChan",
    FAILURE_RES: "ExampleSagaFailureChan",
    LOCAL_SUCCESS_RES: "ExampleSagaSuccessLocalChan",
    LOCAL_FAILURE_RES: "ExampleSagaFailureLocalChan",
};
class ExampleRequestChannel extends point3Saga.endpoint.AbstractChannel {
    send(command) {
        throw new Error("Method not implemented.");
    }
    getChannelName() {
        return exampleChannels.REQUEST;
    }
}
exports.ExampleRequestChannel = ExampleRequestChannel;
ExampleRequestChannel.CHANNEL_NAME = exampleChannels.REQUEST;
class ExampleSuccessResponseChannel extends point3Saga.endpoint.AbstractChannel {
    send(command) {
        throw new Error("Method not implemented.");
    }
    getChannelName() {
        return exampleChannels.SUCCESS_RES;
    }
}
exports.ExampleSuccessResponseChannel = ExampleSuccessResponseChannel;
ExampleSuccessResponseChannel.CHANNEL_NAME = exampleChannels.SUCCESS_RES;
class ExampleFailureResponseChannel extends point3Saga.endpoint.AbstractChannel {
    send(command) {
        throw new Error("Method not implemented.");
    }
    getChannelName() {
        return exampleChannels.FAILURE_RES;
    }
}
exports.ExampleFailureResponseChannel = ExampleFailureResponseChannel;
ExampleFailureResponseChannel.CHANNEL_NAME = exampleChannels.FAILURE_RES;
class ExampleLocalFailureResponseChannel extends point3Saga.endpoint.AbstractChannel {
    send(command) {
        throw new Error("Method not implemented.");
    }
    getChannelName() {
        return exampleChannels.LOCAL_FAILURE_RES;
    }
}
exports.ExampleLocalFailureResponseChannel = ExampleLocalFailureResponseChannel;
ExampleLocalFailureResponseChannel.CHANNEL_NAME = exampleChannels.LOCAL_FAILURE_RES;
class ExampleLocalSuccessResponseChannel extends point3Saga.endpoint.AbstractChannel {
    send(command) {
        throw new Error("Method not implemented.");
    }
    getChannelName() {
        return exampleChannels.LOCAL_SUCCESS_RES;
    }
}
exports.ExampleLocalSuccessResponseChannel = ExampleLocalSuccessResponseChannel;
ExampleLocalSuccessResponseChannel.CHANNEL_NAME = exampleChannels.LOCAL_SUCCESS_RES;
//# sourceMappingURL=channel.js.map