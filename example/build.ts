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
} from "./command";

import {
    ExampleFailureResponseChannel,
    ExampleRequestChannel,
} from "./channel";

import {
    ExampleSaga,
} from "./saga";
import { ExampleInMemorySagaRegistry } from "./registry";
import { InMemoryTxContext } from "../UnitOfWork/inMemory";
import { InMemoryExampleRequestCommandRepository } from "./repository";

async function build() {
    const commandRepo = new InMemoryExampleRequestCommandRepository();

    const registry: ExampleInMemorySagaRegistry = new ExampleInMemorySagaRegistry();
    const builder = new point3Saga.api.sagaBuilder.StepBuilder<InMemoryTxContext>();

    registry.registerSaga(new ExampleSaga(
        builder,
        new InMemoryExampleSagaSaver,
        commandRepo,
        commandRepo,
    ));

    await registry.startSaga(
        ExampleSaga.getName(), 
        new ExampleSagaSessionArguments(),
        ExampleSaga
    );

    // spy for saga id from command repository to maunally consume the event
    const sagaCommands = await commandRepo.getCommands();
    const sagaId = sagaCommands.next().value.getSagaId();

    await registry.consumeEvent(
        new ExampleFailureResponseChannel().parseMessageWithOrigin(new ExampleFailureResponse(sagaId))
    );
}

build();