import * as point3Saga from "../Saga";
import { ChannelName } from "../Saga/Endpoint/Channel";
import { TxContext } from "../UnitOfWork/main";

class AnotherSagaSessionArguments implements point3Saga.core.saga.SagaSessionArguments {
    private readonly _arg1: string = "arg1";
}


class ExampleSagaSessionArguments implements point3Saga.core.saga.SagaSessionArguments {
    private readonly _arg1: string = "arg2";
}
class ExampleSagaSession extends point3Saga.core.saga.SagaSession {
    constructor(arg: ExampleSagaSessionArguments) {
        super();
    }

    public static create(arg: ExampleSagaSessionArguments): ExampleSagaSession {
        return new ExampleSagaSession(arg);
    }
}

class ExampleSaga extends point3Saga.api.registry.AbstractSaga<
    TxContext,
    ExampleSagaSessionArguments,
    ExampleSagaSession
> {
    getDefinition(): point3Saga.core.sagaDefinition.SagaDefinition<TxContext> {
        throw new Error("Method not implemented.");
    }
    getSagaRepository(): point3Saga.core.sagaRepository.SagaSessionRepository<TxContext, ExampleSagaSession> {
        throw new Error("Method not implemented.");
    }
    getName(): string {
        return "ExampleSaga";
    }
    createSession(arg: ExampleSagaSessionArguments): Promise<ExampleSagaSession> {
        const sagaSession = new ExampleSagaSession(arg);
        return Promise.resolve(sagaSession);
    }
    
    static create(): ExampleSaga {
        return new ExampleSaga();
    }
}

enum ExampleSagaResponseStatus {
    Success = "Success",
    Failure = "Failure"
}

const exampleChannels = {
    REQUEST: "ExampleSagaReqChan" as ChannelName,
    SUCCESS_RES: "ExampleSagaSuccessChan" as ChannelName,
    FAILURE_RES: "ExampleSagaFailureChan" as ChannelName
};

class ExampleRequestCommand implements point3Saga.endpoint.endpoint.Command {
    private sagaId: string;
    
    constructor() {
        this.sagaId = "ExampleSaga";
    }
    
    public getSagaId(): string {
        return this.sagaId;
    }
}

class ExampleSuccessResponse implements point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Success;
    private sagaId: string;
    
    constructor() {
        this.sagaId = "ExampleSaga";
    }
    
    public getSagaId(): string {
        return this.sagaId;
    }
}

class ExampleFailureResponse implements point3Saga.endpoint.endpoint.Command {
    private readonly _responseStatus: ExampleSagaResponseStatus = ExampleSagaResponseStatus.Failure;
    private sagaId: string;
    
    constructor() {
        this.sagaId = "ExampleSaga";
    }
    
    public getSagaId(): string {
        return this.sagaId;
    }
}

class ExampleRequestChannel extends point3Saga.endpoint.channel.Channel<ExampleRequestCommand> {
    send(command: ExampleRequestCommand): void {
        throw new Error("Method not implemented.");
    }
    getChannelName(): string {
        return exampleChannels.REQUEST;
    }
}

class ExampleSuccessResponseChannel extends point3Saga.endpoint.channel.Channel<ExampleSuccessResponse> {
    send(command: ExampleSuccessResponse): void {
        throw new Error("Method not implemented.");
    }
    getChannelName(): string {
        return exampleChannels.SUCCESS_RES;
    }
}

class ExampleFailureResponseChannel extends point3Saga.endpoint.channel.Channel<ExampleFailureResponse> {
    send(command: ExampleFailureResponse): void {
        throw new Error("Method not implemented.");
    }
    getChannelName(): string {
        return exampleChannels.FAILURE_RES;
    }
}

class ExampleEndpoint extends point3Saga.endpoint.endpoint.CommandEndpoint<
    ExampleRequestCommand,
    ExampleSuccessResponse,
    ExampleFailureResponse
> {
    constructor() {
        super(
            "ExampleSagaReqChan",
            "ExampleSagaSuccessChan",
            "ExampleSagaFailureChan",
            ExampleRequestCommand,
            ExampleSuccessResponse,
            ExampleFailureResponse,
        );
    }
}

async function build() {
    var registry: point3Saga.api.registry.SagaRegistry<TxContext>;
    const builder = new point3Saga.api.sagaBuilder.StepBuilder<TxContext>("ExampleSaga");

    const sagaDefinition = builder
        .step("Step1")
        .invoke(new ExampleEndpoint())
        .withCompensation(new ExampleEndpoint())
        .build();

    registry.registerSaga(new ExampleSaga());

    await registry.consumeEvent(
        new ExampleRequestChannel().parseMessageWithOrigin(new ExampleRequestCommand)
    );

    await registry.startSaga(
        "ExampleSaga", 
        new ExampleSagaSessionArguments(),
        ExampleSaga
    );
}