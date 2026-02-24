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
exports.ChannelToSagaRegistry = exports.SagaRegistry = exports.AbstractSaga = void 0;
const Errors_1 = require("../Errors");
const endpoint = __importStar(require("../Endpoint/index"));
const crypto_1 = require("crypto");
const async_mutex_1 = require("async-mutex");
class AbstractSaga {
    makeSagaId() {
        return this.getName() + '-' + (0, crypto_1.randomUUID)();
    }
    getSagaNameFromId(sagaId) {
        return sagaId.split('-')[0];
    }
    hasPublishedSagaWithId(sagaId) {
        const sagaName = this.getSagaNameFromId(sagaId);
        return this.getName() === sagaName;
    }
}
exports.AbstractSaga = AbstractSaga;
class SagaRegistry {
    constructor(orchestrator, idempotenceProvider) {
        this.sagas = [];
        this.orchestrator = orchestrator;
        this.messageIdempotence = idempotenceProvider;
        this.registryMutex = new async_mutex_1.Mutex();
    }
    hasSagaWithName(sageName) {
        return this.sagas.some((saga) => saga.getName() === sageName);
    }
    registerSaga(saga) {
        if (this.hasSagaWithName(saga.getName())) {
            throw new Errors_1.ErrDuplicateSaga();
        }
        this.sagas.push(saga);
    }
    async consumeEvent(message) {
        try {
            if (this.messageIdempotence) {
                const succeed = await this.messageIdempotence.lock(message.getSagaMessage());
                if (!succeed) {
                    return;
                }
            }
            const sagaId = message.getSagaMessage().getSagaId();
            const orchestrations = [];
            await this.registryMutex.acquire();
            for (const saga of this.sagas) {
                if (saga.hasPublishedSagaWithId(sagaId)) {
                    orchestrations.push(async () => {
                        await this.orchestrator.orchestrate(saga, message);
                    });
                }
            }
            this.registryMutex.release();
            for (const orchestration of orchestrations) {
                await orchestration();
            }
        }
        catch (e) {
            if (this.messageIdempotence) {
                await this.messageIdempotence.release(message.getSagaMessage());
            }
            throw e;
        }
    }
    async startSaga(sagaName, sessionArg, sagaClass) {
        await this.registryMutex.acquire();
        const saga = this.sagas.find((saga) => saga.getName() === sagaName);
        this.registryMutex.release();
        if (!saga || !(saga instanceof sagaClass)) {
            throw new Errors_1.ErrSagaNotFound();
        }
        await this.orchestrator.startSaga(sessionArg, saga);
    }
}
exports.SagaRegistry = SagaRegistry;
class ChannelToSagaRegistry extends endpoint.AbstractChannel {
    constructor(sagaRegistry) {
        super();
        this._sagaRegistry = sagaRegistry;
    }
    async send(command) {
        try {
            const commandWithOrigin = this.parseMessageWithOrigin(command);
            await this._sagaRegistry.consumeEvent(commandWithOrigin);
            return;
        }
        catch (e) {
            if (e instanceof Errors_1.ErrSagaSessionNotFound ||
                e instanceof Errors_1.ErrChannelNotFound ||
                e instanceof Errors_1.ErrStepNotFound ||
                e instanceof Errors_1.ErrSagaNotFound ||
                e instanceof Errors_1.ErrDeadSagaSession) {
                console.info(e);
            }
            else {
                console.error(e);
                throw new Errors_1.ErrEventConsumptionError();
            }
        }
    }
}
exports.ChannelToSagaRegistry = ChannelToSagaRegistry;
//# sourceMappingURL=SagaRegistry.js.map