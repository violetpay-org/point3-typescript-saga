"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../../index");
const messages_1 = require("./messages");
const channel_1 = require("./channel");
const CommandRepository_1 = require("../../Saga/Endpoint/CommandRepository");
const MessageRelayer_1 = require("../MessageRelayer");
const Channel_1 = require("../Channel");
var channelRegistry;
var channelRegistryForMessageRelay;
var commandChan;
var commandChanDispatcher;
var commandRepo;
describe("MessageRelayer", () => {
    beforeEach(async () => {
        channelRegistry = new index_1.p3saga.api.ChannelRegistry();
        commandRepo = new CommandRepository_1.MemoryCommandRepository;
        commandChan = new channel_1.ExampleSavableCommandChannel(commandRepo);
        commandChanDispatcher = new channel_1.MessageDispatcher;
        commandChan.addDispatcher(commandChanDispatcher);
        channelRegistry.registerChannel(commandChan);
        channelRegistryForMessageRelay = new Channel_1.ChannelRegistryForMessageRelay(channelRegistry);
        const uow = new index_1.uowMemory.InMemoryUnitOfWork;
        for (let i = 0; i < 250; i++) {
            const commandArgs = new index_1.p3saga.endpoint.CommandArguments("sagaId", `commandId-${i}`);
            const livingMessageSaver = commandRepo.saveMessage(new messages_1.InMemoryCommand(commandArgs));
            uow.addToWork(livingMessageSaver);
        }
        for (let i = 250; i < 500; i++) {
            const commandArgs = new index_1.p3saga.endpoint.CommandArguments("sagaId", `commandId-${i}`);
            const deadLetterSaver = commandRepo.saveDeadLetters([
                new messages_1.InMemoryCommand(commandArgs)
            ]);
            uow.addToWork(deadLetterSaver);
        }
        await uow.Commit();
    });
    test("should successfully relay messages even if channel send fails sometime", async () => {
        const messageRelayer = new MessageRelayer_1.MessageRelayer(500, channelRegistryForMessageRelay, index_1.uowMemory.InMemoryUnitOfWorkFactory);
        for (let i = 0; i < 15; i++) {
            await messageRelayer.execute();
        }
        expect(commandChanDispatcher.getNumberOfCommands()).toBe(500);
    });
});
//# sourceMappingURL=MessageRelayer.spec.js.map