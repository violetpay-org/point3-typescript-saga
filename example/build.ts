import * as point3Saga from "../Saga";
import { TxContext } from "../UnitOfWork/main";

import {
    ExampleSagaSessionArguments,
    ExampleSagaSession,
    InMemoryExampleSagaSaver,
} from "./sagaSession";

import {
    ExampleRequestCommand,
} from "./command";

import {
    ExampleRequestChannel,
} from "./channel";

import {
    ExampleSaga,
} from "./saga";

async function build() {
    var registry: point3Saga.api.registry.SagaRegistry<TxContext>;
    const builder = new point3Saga.api.sagaBuilder.StepBuilder<TxContext>("ExampleSaga");

    registry.registerSaga(new ExampleSaga(
        builder,
        new InMemoryExampleSagaSaver
    ));

    await registry.consumeEvent(
        new ExampleRequestChannel().parseMessageWithOrigin(new ExampleRequestCommand)
    );

    await registry.startSaga(
        "ExampleSaga", 
        new ExampleSagaSessionArguments(),
        ExampleSaga
    );
}

build();