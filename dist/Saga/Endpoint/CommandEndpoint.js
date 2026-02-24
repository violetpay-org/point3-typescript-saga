"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalEndpoint = exports.CommandEndpoint = exports.EndpointWithSuccessFailureRes = exports.Response = exports.Command = exports.ResponseArguments = exports.CommandArguments = void 0;
const crypto_1 = require("crypto");
const SagaSession_1 = require("../SagaSession/SagaSession");
class CommandArguments {
    constructor(sagaId, id) {
        this.sagaId = sagaId;
        this.id = id;
    }
}
exports.CommandArguments = CommandArguments;
class ResponseArguments {
    constructor(sagaId, id) {
        this.sagaId = sagaId;
        this.id = id;
    }
}
exports.ResponseArguments = ResponseArguments;
class Command {
    constructor(args) {
        if (args == undefined) {
            this._id = (0, crypto_1.randomUUID)();
            return this;
        }
        if (args instanceof SagaSession_1.SagaSession) {
            this._sagaId = args.getSagaId();
            this._id = (0, crypto_1.randomUUID)();
            return this;
        }
        if (args instanceof CommandArguments) {
            this._sagaId = args.sagaId;
            this._id = args.id;
            return this;
        }
    }
    getId() {
        return this._id;
    }
    getSagaId() {
        return this._sagaId;
    }
}
exports.Command = Command;
class Response {
    constructor(record) {
        if (record == undefined) {
            return;
        }
        if (record.sagaId != undefined) {
            this._sagaId = record.sagaId;
        }
        if (record.id != undefined) {
            this._id = record.id;
            return this;
        }
        this._id = (0, crypto_1.randomUUID)();
    }
    getId() {
        return this._id;
    }
    getSagaId() {
        return this._sagaId;
    }
}
exports.Response = Response;
class EndpointWithSuccessFailureRes {
    constructor(_successResChannelName, _failureResChannelName, _commandSuccessResCtor, _commandFailureResCtor) {
        this._successResChannelName = _successResChannelName;
        this._failureResChannelName = _failureResChannelName;
        this._commandSuccessResCtor = _commandSuccessResCtor;
        this._commandFailureResCtor = _commandFailureResCtor;
    }
    getSuccessResChannelName() {
        return this._successResChannelName;
    }
    getFailureResChannelName() {
        return this._failureResChannelName;
    }
    getCommandSuccessResCtor() {
        return this._commandSuccessResCtor;
    }
    getCommandFailureResCtor() {
        return this._commandFailureResCtor;
    }
}
exports.EndpointWithSuccessFailureRes = EndpointWithSuccessFailureRes;
class CommandEndpoint extends EndpointWithSuccessFailureRes {
    constructor(reqChannelName, successResChannelName, failureResChannelName, commandReqCtor, commandSuccessResCtor, commandFailureResCtor, commandRepository) {
        super(successResChannelName, failureResChannelName, commandSuccessResCtor, commandFailureResCtor);
        this._reqChannelName = reqChannelName;
        this._commandReqCtor = commandReqCtor;
        this._commandRepository = commandRepository;
    }
    getReqChannelName() {
        return this._reqChannelName;
    }
    getCommandReqCtor() {
        return this._commandReqCtor;
    }
    getCommandRepository() {
        return this._commandRepository;
    }
}
exports.CommandEndpoint = CommandEndpoint;
class LocalEndpoint extends EndpointWithSuccessFailureRes {
    constructor(successResChannelName, failureResChannelName, commandSuccessResCtor, commandFailureResCtor, successCommandRepository, failureCommandRepository) {
        super(successResChannelName, failureResChannelName, commandSuccessResCtor, commandFailureResCtor);
        this._successCommandRepository = successCommandRepository;
        this._failureCommandRepository = failureCommandRepository;
    }
    getSuccessResponseRepository() {
        return this._successCommandRepository;
    }
    getFailureResponseRepository() {
        return this._failureCommandRepository;
    }
}
exports.LocalEndpoint = LocalEndpoint;
//# sourceMappingURL=CommandEndpoint.js.map