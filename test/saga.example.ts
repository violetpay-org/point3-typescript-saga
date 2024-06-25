import * as point3Saga from "../Saga";
import { TxContext } from "../UnitOfWork/main";
import { ExampleRequestCommand, ExampleSuccessResponse } from "./command";
import { ExampleEndpoint, AlwaysSuccessLocalEndpoint } from "./endpoint";

import {
    ExampleSagaSessionArguments,
    ExampleSagaSession,
} from "./sagaSession";

// export class ExampleSaga<T extends TxContext> extends point3Saga.api.sagaRegistry.AbstractSaga<
//     T,
//     ExampleSagaSessionArguments,
//     ExampleSagaSession
// > {
//     protected static sagaName: string = "ExampleSaga";

//     private sagaDefinition: point3Saga.planning.definition.SagaDefinition<T>;
//     private sagaSessionRepository: point3Saga.saga.repository.SagaSessionRepository<T, ExampleSagaSession>;

//     // The following command repositories differs by the implementation of AbstractSaga subclass.
//     // This implementation only has two command repositories because saga schema of the concrete class
//     // only has one step.
//     private static stepOneInvocationCommandRepository: point3Saga.endpoint.commandRepository.CommandRepository<ExampleRequestCommand, TxContext>;
//     private static stepOneCompensationCommandRepository: point3Saga.endpoint.commandRepository.CommandRepository<ExampleRequestCommand, TxContext>;

//     private static applySagaSchemaTo<T extends TxContext>(
//         sagaBuilder: point3Saga.api.sagaBuilder.StepBuilder<T>,        
//     ): point3Saga.planning.definition.SagaDefinition<T> {
//         return sagaBuilder
//             .step("LocalStep1")
//             .localInvoke(new AlwaysSuccessLocalEndpoint(
//                 this.stepOneInvocationCommandRepository,
//                 this.stepOneCompensationCommandRepository
//             ))
//             .withLocalCompensation(new AlwaysSuccessLocalEndpoint(this.stepOneCompensationCommandRepository, this.stepOneInvocationCommandRepository))
//             .build();
//     }
    
//     constructor(
//         builder: point3Saga.api.sagaBuilder.StepBuilder<T>,
//         sagaSessionRepository: point3Saga.saga.repository.SagaSessionRepository<T, ExampleSagaSession>,
//         // Only for this specific implementation
//         stepOneInvocationCommandRepository: point3Saga.endpoint.commandRepository.CommandRepository<ExampleRequestCommand, T>,
//         stepOneCompensationCommandRepository: point3Saga.endpoint.commandRepository.CommandRepository<ExampleRequestCommand, T>,
//     ) {
//         super();
//         // Must called before applySagaSchemaTo
//         ExampleSaga.stepOneInvocationCommandRepository = stepOneInvocationCommandRepository;
//         ExampleSaga.stepOneCompensationCommandRepository = stepOneCompensationCommandRepository;

//         this.sagaDefinition = ExampleSaga.applySagaSchemaTo(builder);
//         this.sagaSessionRepository = sagaSessionRepository;
//     }

//     static getName(): string {
//         return ExampleSaga.sagaName;
//     }

//     getDefinition(): point3Saga.planning.definition.SagaDefinition<T> {
//         return this.sagaDefinition;
//     }

//     getSagaRepository(): point3Saga.saga.repository.SagaSessionRepository<T, ExampleSagaSession> {
//         return this.sagaSessionRepository;
//     }

//     getName(): string {
//         return ExampleSaga.sagaName;
//     }

//     createSession(arg: ExampleSagaSessionArguments): Promise<ExampleSagaSession> {
//         const newSessionId = this.makeSagaId();
//         const sagaSession = new ExampleSagaSession(newSessionId, arg);
//         return Promise.resolve(sagaSession);
//     }
// }