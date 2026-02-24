"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExampleFailureResponse = exports.ExampleSuccessResponse = exports.ExampleRequestCommand = exports.ExampleRequestCommandArguments = void 0;
const index_1 = require("../Saga/index");
var ExampleSagaResponseStatus;
(function (ExampleSagaResponseStatus) {
    ExampleSagaResponseStatus["Success"] = "Success";
    ExampleSagaResponseStatus["Failure"] = "Failure";
})(ExampleSagaResponseStatus || (ExampleSagaResponseStatus = {}));
class ExampleRequestCommandArguments extends index_1.endpoint.CommandArguments {
    constructor(sagaId, id) {
        super(sagaId, id);
    }
}
exports.ExampleRequestCommandArguments = ExampleRequestCommandArguments;
class ExampleRequestCommand extends index_1.endpoint.Command {
    constructor(args) {
        super(args);
    }
    getTriggeredReason() {
        return "Triggered because example command was requested";
    }
}
exports.ExampleRequestCommand = ExampleRequestCommand;
class ExampleSuccessResponse extends index_1.endpoint.Response {
    constructor(record) {
        super(record);
        this._responseStatus = ExampleSagaResponseStatus.Success;
    }
    getTriggeredReason() {
        return "Triggered because example command is processed successfully";
    }
}
exports.ExampleSuccessResponse = ExampleSuccessResponse;
class ExampleFailureResponse extends index_1.endpoint.Response {
    constructor(record) {
        super(record);
        this._responseStatus = ExampleSagaResponseStatus.Failure;
    }
    getTriggeredReason() {
        return "Triggered because example command is failed to process";
    }
}
exports.ExampleFailureResponse = ExampleFailureResponse;
//# sourceMappingURL=command.js.map