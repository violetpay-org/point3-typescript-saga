import { p3saga, uow, uowMemory } from "../../index";
import { InMemoryCommand } from "./messages";
import { ExampleSavableCommandChannel, MessageDispatcher } from "./channel";
import { InMemoryCommandRepository } from "./repository";
import { MessageRelayer } from "../MessageRelayer";
import { ChannelRegistryForMessageRelay } from "../Channel";


var channelRegistry: p3saga.api.ChannelRegistry<uow.TxContext>;
var channelRegistryForMessageRelay: ChannelRegistryForMessageRelay<uow.TxContext>;
var commandChan: ExampleSavableCommandChannel;
var commandChanDispatcher: MessageDispatcher<InMemoryCommand>;
var commandRepo: InMemoryCommandRepository<uow.TxContext>;

describe("MessageRelayer", () => {
    beforeEach(async () => {
        channelRegistry = new p3saga.api.ChannelRegistry<uow.TxContext>();
        commandRepo = new InMemoryCommandRepository<uow.TxContext>;
        commandChan = new ExampleSavableCommandChannel(commandRepo);
        commandChanDispatcher = new MessageDispatcher<InMemoryCommand>;
        commandChan.addDispatcher(commandChanDispatcher);

        channelRegistry.registerChannel(commandChan);
        channelRegistryForMessageRelay = new ChannelRegistryForMessageRelay<uow.TxContext>(channelRegistry);

        const uow = new uowMemory.InMemoryUnitOfWork;

        // save 500 commands to the command repository
        for (let i = 0; i < 250; i++) {
            const commandArgs = new p3saga.endpoint.CommandArguments(
                "sagaId",
                `commandId-${i}`
            );

            const livingMessageSaver = commandRepo.saveMessage(
                new InMemoryCommand(commandArgs));
            
            uow.addToWork(livingMessageSaver);
        }

        for (let i = 250; i < 500; i++) {
            const commandArgs = new p3saga.endpoint.CommandArguments(
                "sagaId",
                `commandId-${i}`
            );

            const deadLetterSaver = commandRepo.saveDeadLetters([
                new InMemoryCommand(commandArgs)
            ]);

            uow.addToWork(deadLetterSaver);
        }

        await uow.Commit();
    });

    test("should successfully relay messages even if channel send fails sometime", async () => {
        const messageRelayer = new MessageRelayer(
            channelRegistryForMessageRelay, 
            uowMemory.InMemoryUnitOfWorkFactory
        );

        for (let i = 0; i < 15; i++) {
            // Channel for the test randomly throws an error
            // So, consecutive calls to execute() will eventually succeed
            await messageRelayer.execute();
        }

        expect(commandChanDispatcher.getNumberOfCommands()).toBe(500);
    });
})