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
exports.AlwaysFailingLocalEndpoint = exports.AlwaysSuccessLocalEndpoint = exports.ExampleEndpoint = void 0;
const point3Saga = __importStar(require("../Saga/index"));
const channel_1 = require("./channel");
const command_1 = require("./command");
class ExampleEndpoint extends point3Saga.endpoint.CommandEndpoint {
    constructor(commandRepository) {
        super(channel_1.ExampleRequestChannel.CHANNEL_NAME, channel_1.ExampleSuccessResponseChannel.CHANNEL_NAME, channel_1.ExampleFailureResponseChannel.CHANNEL_NAME, command_1.ExampleRequestCommand, command_1.ExampleSuccessResponse, command_1.ExampleFailureResponse, commandRepository);
    }
}
exports.ExampleEndpoint = ExampleEndpoint;
class AlwaysSuccessLocalEndpoint extends point3Saga.endpoint.LocalEndpoint {
    async handle(sagaSession) {
        console.log("Handling saga session", sagaSession.getSagaId());
        return async (tx) => {
            console.log("Handled saga session", sagaSession.getSagaId());
        };
    }
    constructor(successCommandRepository, failureCommandRepository) {
        super(channel_1.ExampleLocalSuccessResponseChannel.CHANNEL_NAME, channel_1.ExampleLocalFailureResponseChannel.CHANNEL_NAME, command_1.ExampleSuccessResponse, command_1.ExampleFailureResponse, successCommandRepository, failureCommandRepository);
    }
}
exports.AlwaysSuccessLocalEndpoint = AlwaysSuccessLocalEndpoint;
class AlwaysFailingLocalEndpoint extends AlwaysSuccessLocalEndpoint {
    async handle(sagaSession) {
        throw new Error("Always fails");
    }
}
exports.AlwaysFailingLocalEndpoint = AlwaysFailingLocalEndpoint;
//# sourceMappingURL=endpoint.js.map