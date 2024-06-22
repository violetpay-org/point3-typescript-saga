import * as point3Saga from "../Saga";
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
    ExampleFailureResponseChannel,
    ExampleLocalFailureResponseChannel,
    ExampleLocalSuccessResponseChannel,
    ExampleRequestChannel,
    ExampleSuccessResponseChannel,
} from "./channel";

import {
    ExampleSaga,
} from "./saga";
import { InMemoryExampleSagaRegistry } from "./registry";
import { InMemoryTxContext } from "../UnitOfWork/inMemory";
import { InMemoryExampleRequestCommandRepository } from "./repository";
import { assert } from "console";
import { SagaRegistry } from "../Saga/API/SagaRegistry";
import { ErrDuplicateSaga } from "../Saga/Errors";
import { AlwaysFailingLocalEndpoint, AlwaysSuccessLocalEndpoint } from "./endpoint";

var commandRepo: InMemoryExampleRequestCommandRepository;
var sagaRepo: InMemoryExampleSagaSaver;
var registry: InMemoryExampleSagaRegistry;
var builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>;

function BuildSagaAndRegister<Tx extends TxContext>(
    registry: SagaRegistry<Tx>,
    builder: point3Saga.api.sagaBuilder.StepBuilder<Tx>,
    sagaSchema: (builder: point3Saga.api.sagaBuilder.StepBuilder<Tx>) => point3Saga.planning.definition.SagaDefinition<Tx>,
    sagaRepo: point3Saga.saga.repository.SagaSessionRepository<Tx, ExampleSagaSession>,
): point3Saga.api.registry.AbstractSaga<Tx, ExampleSagaSessionArguments, ExampleSagaSession> {
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
        commandRepo = new InMemoryExampleRequestCommandRepository();
        sagaRepo = new InMemoryExampleSagaSaver();
        registry = new InMemoryExampleSagaRegistry();

        // builder also holds information about the saga created in each test
        // so it should be reset as well
        builder = new point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>();
    });

    it("should be available to a registered saga", async () => {
        const emptySagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
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
        const emptySagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
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
        const emptySagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
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
        const emptySagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
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
        const localActionSagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(commandRepo, commandRepo))
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
        const localActionSagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(commandRepo, commandRepo))
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
        const sagaId = sagaSessions[0].getSagaId();

        await registry.consumeEvent(
            new ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new ExampleSuccessResponse(sagaId))
        );

        expect(sagaSessions[0].isCompleted()).toBeTruthy();
    });

    it("should produce either a success or failure response when a handler inside a local endpoint is invoked", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysSuccessLocalEndpoint(commandRepo, commandRepo))
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

        const commands = commandRepo.getCommands();
        const commandList = Array.from(commands);

        expect(commandList.length).toBe(1);
    });

    it("should produce a failed response when a local endpoint is invoked and the handler inside the endpoint throws an error", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysFailingLocalEndpoint(commandRepo, commandRepo))
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

        const commands = commandRepo.getCommands();
        const failureCommand = commands.next().value;
        expect(failureCommand instanceof ExampleFailureResponse).toBeTruthy();
    });

    it("should set saga session state to failed when it has consumed a failure response from a local action", async () => {
        const localActionSagaSchema = (builder: point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>) => {
            return builder
                .step("localStep1")
                .localInvoke(new AlwaysFailingLocalEndpoint(commandRepo, commandRepo))
                .withLocalCompensation(new AlwaysSuccessLocalEndpoint(commandRepo, commandRepo))
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
        const sagaId = sagaSessions[0].getSagaId();

        await registry.consumeEvent(
            new ExampleLocalFailureResponseChannel().parseMessageWithOrigin(new ExampleFailureResponse(sagaId))
        );

        expect(sagaSessions[0].isFailed()).toBeTruthy();
    });
});


// async function build() {
//     const commandRepo = new InMemoryExampleRequestCommandRepository();
//     const sagaRepo = new InMemoryExampleSagaSaver();

//     const registry: InMemoryExampleSagaRegistry = new InMemoryExampleSagaRegistry();
//     const builder = new point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>();

//     registry.registerSaga(new ExampleSaga(
//         builder,
//         sagaRepo,
//         commandRepo,
//         commandRepo,
//     ));

//     await registry.startSaga(
//         ExampleSaga.getName(), 
//         new ExampleSagaSessionArguments(),
//         ExampleSaga
//     );

//     // spy for saga id from command repository to maunally consume the event
//     const sagaCommands = await commandRepo.getCommands();   
//     console.log(await commandRepo.getCommandsAsMap())
//     const sagaId = sagaCommands.next().value.getSagaId();

//     await registry.consumeEvent(
//         new ExampleLocalSuccessResponseChannel().parseMessageWithOrigin(new ExampleSuccessResponse(sagaId))
//     );

//     console.log(await sagaRepo.getSagaSessionsAsMap());
// }

// build();