import { p3saga } from "index";

export class ExampleSagaSession extends p3saga.saga.SagaSession {
    constructor(sagaId: string) {
        super(sagaId);
    }
}