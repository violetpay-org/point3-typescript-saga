import * as point3Saga from "../Saga/index";
import { TxContext } from "../UnitOfWork/main";

import {
    ExampleSagaSessionArguments,
    ExampleSagaSession,
    InMemoryExampleSagaSaver,
} from "./sagaSession";

import {
    ExampleFailureResponse,
    ExampleRequestCommand,
    ExampleSuccessResponse,
} from "./command";

import {
    ExampleLocalFailureResponseChannel,
    ExampleLocalSuccessResponseChannel,
    ExampleRequestChannel,
} from "./channel";

import {
    ExampleSaga,
} from "./saga";
import { InMemoryExampleSagaRegistry } from "./registry";
import { InMemoryTxContext } from "../UnitOfWork/inMemory";
import { 
    InMemoryCommandRepository, 
    InMemoryResponseRepository 
} from "./repository";
import { assert } from "console";
import { SagaRegistry } from "../Saga/API/SagaRegistry";
import { ErrDuplicateSaga, ErrEventConsumptionError } from "../Saga/Errors/index";
import { AlwaysFailingLocalEndpoint, AlwaysSuccessLocalEndpoint } from "./endpoint";

var successResRepo: InMemoryResponseRepository<ExampleSuccessResponse>;
var failureResRepo: InMemoryResponseRepository<ExampleFailureResponse>;
var commandRepo: InMemoryCommandRepository<ExampleRequestCommand>;

var sagaRepo: InMemoryExampleSagaSaver;
var registry: InMemoryExampleSagaRegistry;
var builder: point3Saga.api.StepBuilder<InMemoryTxContext>;

function BuildSagaAndRegister<Tx extends TxContext>(
    registry: SagaRegistry<Tx>,
    builder: point3Saga.api.StepBuilder<Tx>,
    sagaSchema: (builder: point3Saga.api.StepBuilder<Tx>) => point3Saga.planning.SagaDefinition<Tx>,
    sagaRepo: point3Saga.saga.SagaSessionRepository<Tx, ExampleSagaSession>,
): point3Saga.api.AbstractSaga<Tx, ExampleSagaSessionArguments, ExampleSagaSession> {
    const saga = new ExampleSaga(
        builder,
        sagaSchema,
        sagaRepo,
    );

    registry.registerSaga(saga);

    return saga;
}

describe("SagaOrchestrator", () => {
    beforeEach(() => {
        // Reset all repositories before each test
        successResRepo = new InMemoryResponseRepository<ExampleSuccessResponse>();
        failureResRepo = new InMemoryResponseRepository<ExampleFailureResponse>();
        commandRepo = new InMemoryCommandRepository<ExampleRequestCommand>();
        sagaRepo = new InMemoryExampleSagaSaver();
        registry = new InMemoryExampleSagaRegistry();

        // builder also holds information about the saga created in each test
        // so it should be reset as well
        builder = new point3Saga.api.StepBuilder<InMemoryTxContext>();
    });

    it("should be available to a registered saga", async () => {
        const emptySagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder.build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            emptySagaSchema,
            sagaRepo,
        );

        assert(registry.hasSagaWithName(ExampleSaga.getName()));
    });

    it("should save a saga session when a saga is started", async () => {
        const emptySagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder.build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            emptySagaSchema,
            sagaRepo,
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions.length).toBe(0);

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions.length).toBe(1);
    });

    it("should reject multiple sagas with the same name", async () => {
        const emptySagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder.build();
        }

        const saga = BuildSagaAndRegister(
            registry,
            builder,
            emptySagaSchema,
            sagaRepo,
        );

        expect(() => {
            registry.registerSaga(saga);
        }).toThrow(ErrDuplicateSaga);
    });

    it("should set saga session state to complete when it has started a saga with an empty saga schema", async () => {
        const emptySagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder.build();
        }

        const saga = BuildSagaAndRegister(
            registry,
            builder,
            emptySagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });

    it("should set saga session state to pending when it has started a saga with a non-empty local action saga schema", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        const saga = BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isPending()).toBeTruthy();
    });

    it("should set saga session state to complete when it has consumed a success response from a local action", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        const saga = BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        const sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel()
                .parseMessageWithOrigin(new ExampleSuccessResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });

    it("should produce either a success or failure response when a handler inside a local endpoint is invoked", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        const successResponses = successResRepo.getCommands();
        const failureResponses = failureResRepo.getCommands();
        const combinedResponses = [...successResponses, ...failureResponses];
        expect(combinedResponses.length).toBe(1);
    });

    it("should produce a failed response when a local endpoint is invoked and the handler inside the endpoint throws an error", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        const failedCommands = [...failureResRepo.getCommands()];
        expect(failedCommands.length).toBe(1);
    });

    it("should set saga session state to failed when it has consumed a failure response from a local action", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .withLocalCompensation(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        const saga = BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        const sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];

        await registry.consumeEvent(
            new ExampleLocalFailureResponseChannel()
                .parseMessageWithOrigin(new ExampleFailureResponse({
                        "sagaId": sagaSession.getSagaId()
                }))
        );

        expect(sagaSessions[0].isFailed()).toBeTruthy();
    });

    it("should turn saga session state to completed after consuming a success response in pending state", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];
        expect(sagaSession.isPending()).toBeTruthy();

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel()
                .parseMessageWithOrigin(new ExampleSuccessResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });

    it("should invoke next step local endpoint when the step successfully completes invoking the current endpoint", async () => {
        const STEP_1 = "localStep1";
        const STEP_2 = "localStep2";
        
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step(STEP_1)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(STEP_2)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        expect(sagaSession.isPending()).toBeTruthy();

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel()
                .parseMessageWithOrigin(new ExampleSuccessResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        expect(sagaSession.isPending()).toBeTruthy();

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel()
                .parseMessageWithOrigin(new ExampleSuccessResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isCompleted()).toBeTruthy();
    });

    it("should compensate the endpoint before currently invoking step if the invocation was unsuccessful", async () => {
        const STEP_1 = "localStep1";
        const STEP_2 = "localStep2";
        
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step(STEP_1)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .withLocalCompensation(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(STEP_2)
                .localInvoke(new AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        const sagaId = sagaSession.getSagaId();
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        expect(sagaSession.isPending()).toBeTruthy();

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel()
                .parseMessageWithOrigin(new ExampleSuccessResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        expect(sagaSession.isPending()).toBeTruthy();

        await registry.consumeEvent(
            new ExampleLocalFailureResponseChannel()
                .parseMessageWithOrigin(new ExampleFailureResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isCompensating()).toBeTruthy();
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel()
                .parseMessageWithOrigin(new ExampleSuccessResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isFailed()).toBeTruthy();
    });

    it("should retry endlessly if the endpoint is set to retry", async () => {
        const STEP_1 = "localStep1";
        const STEP_2 = "localStep2";
        
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step(STEP_1)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .withLocalCompensation(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(STEP_2)
                .localInvoke(new AlwaysFailingLocalEndpoint(successResRepo, failureResRepo))
                .localRetry()
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        const sagaId = sagaSession.getSagaId();
        expect(sagaSession.getCurrentStepName()).toBe(STEP_1);
        expect(sagaSession.isPending()).toBeTruthy();

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel()
                .parseMessageWithOrigin(new ExampleSuccessResponse({
                    "sagaId": sagaSession.getSagaId(),
                }))
        );

        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        expect(sagaSession.isPending()).toBeTruthy();

        for (let i = 0; i < 10; i++) {
            await registry.consumeEvent(
                new ExampleLocalFailureResponseChannel()
                    .parseMessageWithOrigin(new ExampleFailureResponse({
                        "sagaId": sagaSession.getSagaId(),
                    }))
            );

            sagaSessions = Array.from(sagaRepo.getSessions());
            sagaSession = sagaSessions[0];
            expect(sagaSession.getCurrentStepName()).toBe(STEP_2);
        }

        sagaSessions = Array.from(sagaRepo.getSessions());
        sagaSession = sagaSessions[0];
        expect(sagaSession.isInForwardDirection()).toBeTruthy();
    });

    it("should not accept an unrelated message never has produced by the saga", async () => {
        const emptySagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("step1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            emptySagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];

        var err: Error;

        try {
            await registry.consumeEvent(
                new ExampleRequestChannel()
                    .parseMessageWithOrigin(new ExampleRequestCommand(sagaSession))
            );
        } catch (error) {
            err = error;
        }

        expect(err).toBe(ErrEventConsumptionError);

        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isPending()).toBeTruthy();
    });

    it("should raise dead saga session error when trying to relay a message to a saga that has already completed or failed", async () => {
        const emptySagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder.build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            emptySagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        var sagaSessions = Array.from(sagaRepo.getSessions());
        const sagaSession = sagaSessions[0];
        var err: Error;

        try {
            await registry.consumeEvent(
                new ExampleLocalSuccessResponseChannel()
                    .parseMessageWithOrigin(new ExampleSuccessResponse({
                        "sagaId": sagaSession.getSagaId(),
                    }))
            );
        } catch (error) {
            err = error;
        }

        expect(err).toBe(ErrEventConsumptionError);

        sagaSessions = Array.from(sagaRepo.getSessions());
        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });

    it("should be able to accept any number of invocation steps", async () => {
        enum Steps {
            STEP_1 = "localStep1",
            STEP_2 = "localStep2",
            STEP_3 = "localStep3",
            STEP_4 = "localStep4",
            STEP_5 = "localStep5",
        }
        
        const localActionSagaSchema = (builder: point3Saga.api.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step(Steps.STEP_1)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_2)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_3)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_4)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .step(Steps.STEP_5)
                .localInvoke(new AlwaysSuccessLocalEndpoint(successResRepo, failureResRepo))
                .build();
        }

        BuildSagaAndRegister(
            registry,
            builder,
            localActionSagaSchema,
            sagaRepo,
        );

        await registry.startSaga(
            ExampleSaga.getName(),
            new ExampleSagaSessionArguments(),
            ExampleSaga
        );

        const steps = Object.values(Steps);
        for (let i = 0; i < steps.length; i++) {
            var sagaSessions = Array.from(sagaRepo.getSessions());
            var sagaSession = sagaSessions[0];
            const sagaId = sagaSession.getSagaId();
            expect(sagaSession.getCurrentStepName()).toBe(steps[i]);
            expect(sagaSession.isPending()).toBeTruthy();

            await registry.consumeEvent(
                new ExampleLocalSuccessResponseChannel()
                    .parseMessageWithOrigin(new ExampleSuccessResponse({
                        "sagaId": sagaSession.getSagaId(),
                    }))
            );
        }        

        var sagaSessions = Array.from(sagaRepo.getSessions());
        var sagaSession = sagaSessions[0];
        expect(sagaSession.isCompleted()).toBeTruthy();
    });
});