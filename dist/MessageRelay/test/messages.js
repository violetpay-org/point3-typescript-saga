"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryResponse = exports.InMemoryCommand = void 0;
const index_1 = require("../../index");
class InMemoryCommand extends index_1.p3saga.endpoint.Command {
    constructor(args) {
        super(args);
    }
    getTriggeredReason() {
        return "Triggered because example command is processed successfully";
    }
}
exports.InMemoryCommand = InMemoryCommand;
class InMemoryResponse extends index_1.p3saga.endpoint.Response {
    constructor(records) {
        super(records);
    }
    getTriggeredReason() {
        return "Triggered because example command is processed successfully";
    }
}
exports.InMemoryResponse = InMemoryResponse;
//# sourceMappingURL=messages.js.map