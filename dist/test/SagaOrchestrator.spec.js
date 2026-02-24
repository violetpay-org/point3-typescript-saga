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
const point3Saga = __importStar(require("../Saga/index"));
const sagaSession_1 = require("./sagaSession");
const command_1 = require("./command");
const channel_1 = require("./channel");
const saga_1 = require("./saga");
const registry_1 = require("./registry");
const repository_1 = require("./repository");
const console_1 = require("console");
const index_1 = require("../Saga/Errors/index");
const endpoint_1 = require("./endpoint");
const crypto_1 = require("crypto");
var successResRepo;
var failureResRepo;
var commandRepo;
var sagaRepo;
var registry;
var builder;
function BuildSagaAndRegister(registry, builder, sagaSchema, sagaRepo) {
    const saga = new saga_1.ExampleSaga(builder, sagaSchema, sagaRepo);
    registry.registerSaga(saga);
    return saga;
}
describe('SagaOrchestrator', () => {
    beforeEach(() => {
        successResRepo = new repository_1.InMemoryResponseRepository();
        failureResRepo = new repository_1.InMemoryResponseRepository();
        commandRepo = new repository_1.InMemoryCommandRepository();
        sagaRepo = new sagaSession_1.InMemoryExampleSagaSaver();
        registry = new registry_1.InMemoryExampleSagaRegistry();
        builder = new point3Saga.api.StepBuilder();
    });
    it('should be available to a registered saga', async () => {
        const emptySagaSchema = (builder) => {
            return builder.build();
        };
        BuildSagaAndRegister(registry, builder, emptySagaSchema, sagaRepo);
        (0, console_1.assert)(registry.hasSagaWithName(saga_1.ExampleSaga.getName()));
    });
    it('should save a saga session when a saga is started', async () => {
        const emptySagaSchema = (builder) => {
            return builder.build();
        };
        BuildSagaAndRegister(registry, builder, emptySagaSchema, sagaRepo);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions.length).toBe(0);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions.length).toBe(1);
    });
    it('should reject multiple sagas with the same name', async () => {
        const emptySagaSchema = (builder) => {
            return builder.build();
        };
        const saga = BuildSagaAndRegister(registry, builder, emptySagaSchema, sagaRepo);
        expect(() => {
            registry.registerSaga(saga);
        }).toThrow(index_1.ErrDuplicateSaga);
    });
    it('should set saga session state to complete when it has started a saga with an empty saga schema', async () => {
        const emptySagaSchema = (builder) => {
            return builder.build();
        };
        const saga = BuildSagaAndRegister(registry, builder, emptySagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });
    it('should set saga session state to pending when it has started a saga with a non-empty local action saga schema', async () => {
        const localActionSagaSchema = (builder) => {
            return builder
                .step('localStep1')
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        const saga = BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isPending()).toBeTruthy();
    });
    it('should set saga session state to complete when it has consumed a success response from a local action', async () => {
        const localActionSagaSchema = (builder) => {
            return builder
                .step('localStep1')
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        const saga = BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        let sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });
    it('should produce either a success or failure response when a handler inside a local endpoint is invoked', async () => {
        const localActionSagaSchema = (builder) => {
            return builder
                .step('localStep1')
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        const successResponses = successResRepo.getCommands();
        const failureResponses = failureResRepo.getCommands();
        const combinedResponses = [...successResponses, ...failureResponses];
        expect(combinedResponses.length).toBe(1);
    });
    it('should produce a failed response when a local endpoint is invoked and the handler inside the endpoint throws an error', async () => {
        const localActionSagaSchema = (builder) => {
            return builder
                .step('localStep1')
                .localInvoke(new endpoint_1.AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        const failedCommands = [...failureResRepo.getCommands()];
        expect(failedCommands.length).toBe(1);
    });
    it('should set saga session state to failed when it has consumed a failure response from a local action', async () => {
        const localActionSagaSchema = (builder) => {
            return builder
                .step('localStep1')
                .localInvoke(new endpoint_1.AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .withLocalCompensation(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        const saga = BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        let sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];
        await registry.consumeEvent(new channel_1.ExampleLocalFailureResponseChannel().parseMessageWithOrigin(new command_1.ExampleFailureResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isFailed()).toBeTruthy();
    });
    it('should turn saga session state to completed after consuming a success response in pending state', async () => {
        const localActionSagaSchema = (builder) => {
            return builder
                .step('localStep1')
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];
        expect(sagaSession.isPending()).toBeTruthy();
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });
    it('should reject an event that already has been consumed by the saga', async () => {
        const STEP_1 = 'localStep1';
        const STEP_2 = 'localStep2';
        const localActionSagaSchema = (builder) => {
            return builder
                .step(STEP_1)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(STEP_2)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        expect(sagaSession.isPending()).toBeTruthy();
        const testId = (0, crypto_1.randomUUID)();
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
            id: testId,
        })));
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].getCurrentStepName()).toBe(STEP_2);
        for (let i = 0; i < 10; i++) {
            await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
                sagaId: sagaSession.getSagaId(),
                id: testId,
            })));
        }
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        expect(sagaSessions[0].getCurrentStepName()).toBe(STEP_2);
        expect(sagaSessions[0].isPending()).toBeTruthy();
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });
    it('should invoke next step local endpoint when the step successfully completes invoking the current endpoint', async () => {
        const STEP_1 = 'localStep1';
        const STEP_2 = 'localStep2';
        const localActionSagaSchema = (builder) => {
            return builder
                .step(STEP_1)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(STEP_2)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        expect(sagaSession.isPending()).toBeTruthy();
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        expect(sagaSession.isPending()).toBeTruthy();
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isCompleted()).toBeTruthy();
    });
    it('should compensate the endpoint before currently invoking step if the invocation was unsuccessful', async () => {
        const STEP_1 = 'localStep1';
        const STEP_2 = 'localStep2';
        const localActionSagaSchema = (builder) => {
            return builder
                .step(STEP_1)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .withLocalCompensation(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(STEP_2)
                .localInvoke(new endpoint_1.AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        const sagaId = sagaSession.getSagaId();
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        expect(sagaSession.isPending()).toBeTruthy();
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        expect(sagaSession.isPending()).toBeTruthy();
        await registry.consumeEvent(new channel_1.ExampleLocalFailureResponseChannel().parseMessageWithOrigin(new command_1.ExampleFailureResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isCompensating()).toBeTruthy();
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isFailed()).toBeTruthy();
    });
    it('should retry endlessly if the endpoint is set to retry', async () => {
        const STEP_1 = 'localStep1';
        const STEP_2 = 'localStep2';
        const localActionSagaSchema = (builder) => {
            return builder
                .step(STEP_1)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .withLocalCompensation(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(STEP_2)
                .localInvoke(new endpoint_1.AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .localRetry()
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        const sagaId = sagaSession.getSagaId();
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        expect(sagaSession.isPending()).toBeTruthy();
        await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
            sagaId: sagaSession.getSagaId(),
        })));
        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        expect(sagaSession.isPending()).toBeTruthy();
        for (let i = 0; i < 10; i++) {
            await registry.consumeEvent(new channel_1.ExampleLocalFailureResponseChannel().parseMessageWithOrigin(new command_1.ExampleFailureResponse({
                sagaId: sagaSession.getSagaId(),
            })));
            sagaSessions = Array.from(sagaRepo.getSessions());
            sagaSession = sagaSessions[0];
            expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        }
        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isInForwardDirection()).toBeTruthy();
    });
    it('should not accept an unrelated message never has produced by the saga', async () => {
        const emptySagaSchema = (builder) => {
            return builder
                .step('step1')
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, emptySagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        let sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];
        try {
            await registry.consumeEvent(new channel_1.ExampleRequestChannel().parseMessageWithOrigin(new command_1.ExampleRequestCommand(sagaSession)));
        }
        catch (error) {
            expect(error).toBeInstanceOf(index_1.ErrChannelNotFound);
        }
        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isPending()).toBeTruthy();
    });
    it('should raise dead saga session error when trying to relay a message to a saga that has already completed or failed', async () => {
        const emptySagaSchema = (builder) => {
            return builder.build();
        };
        BuildSagaAndRegister(registry, builder, emptySagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        var sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];
        try {
            await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
                sagaId: sagaSession.getSagaId(),
            })));
        }
        catch (err) {
            expect(err).toBeInstanceOf(index_1.ErrDeadSagaSession);
        }
        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });
    it('should be able to accept any number of invocation steps', async () => {
        let Steps;
        (function (Steps) {
            Steps["STEP_1"] = "localStep1";
            Steps["STEP_2"] = "localStep2";
            Steps["STEP_3"] = "localStep3";
            Steps["STEP_4"] = "localStep4";
            Steps["STEP_5"] = "localStep5";
        })(Steps || (Steps = {}));
        const localActionSagaSchema = (builder) => {
            return builder
                .step(Steps.STEP_1)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_2)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_3)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_4)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_5)
                .localInvoke(new endpoint_1.AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        };
        BuildSagaAndRegister(registry, builder, localActionSagaSchema, sagaRepo);
        await registry.startSaga(saga_1.ExampleSaga.getName(), new sagaSession_1.ExampleSagaSessionArguments(), saga_1.ExampleSaga);
        const steps = Object.values(Steps);
        for (let i = 0; i < steps.length; i++) {
            var sagaSessions = Array.from(sagaRepo.getSessions());
            var sagaSession = sagaSessions[0];
            const sagaId = sagaSession.getSagaId();
            expect(sagaSession.getCurrentStepName()).toBe(steps[i]);
            expect(sagaSession.isPending()).toBeTruthy();
            await registry.consumeEvent(new channel_1.ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new command_1.ExampleSuccessResponse({
                sagaId: sagaSession.getSagaId(),
            })));
        }
        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        expect(sagaSession.isCompleted()).toBeTruthy();
    });
});
//# sourceMappingURL=SagaOrchestrator.spec.js.map