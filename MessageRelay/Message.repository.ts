import { saga, endpoint, api } from "../Saga/index";
import { AbstractSagaMessageWithOrigin } from "../Saga/Endpoint/CommandEndpoint";
import { TxContext } from "../UnitOfWork/main";

// export class MessageRelayer<Tx extends TxContext> {
//     private BATCH_SIZE = 10;
//     private _channelRegistry: api.ChannelRegistry<Tx>;

//     constructor(channelRegistry: api.ChannelRegistry<Tx>) {
//         this._channelRegistry = channelRegistry;
//     }

//     private async getRelayingMessages(batchSize: number): Promise<
//         Map<
//             endpoint.ChannelName, 
//             AbstractSagaMessageWithOrigin<endpoint.Command<saga.SagaSession>>[]
//         >
//     > {
//         if (batchSize <= 0) {
//             throw new Error("Batch size must be greater than 0");
//         }

//         const messagesByChannel: Map<
//             endpoint.ChannelName, 
//             AbstractSagaMessageWithOrigin<endpoint.Command<saga.SagaSession>>[]
//         > = new Map();

//         for (const channel of this._channelRegistry.getChannels()) {
//             const commandRepo = channel.getCommandRepository();
//             const messages = await commandRepo.getCommandsFromOutbox(batchSize);
//             const messagesWithOrigin: AbstractSagaMessageWithOrigin<endpoint.Command<saga.SagaSession>>[] = [];

//             for (const message of messages) {
//                 const messageWithOrigin = channel.parseMessageWithOrigin(message);                
//                 messagesWithOrigin.push(messageWithOrigin);
//             }

//             messagesByChannel.set(channel.getChannelName(), messagesWithOrigin);
//         }

//         return messagesByChannel;
//     }

//     // 이후 릴레이 메시지를 처리하면 실패, 성공 나누어서 실패하는 메시지는 dead letter로 보내고 
//     // 성공하는 메시지는 outbox에서 삭제하는 로직이 필요.
//     public async relay() {
//         const toDeadLettersByChannel: Map<
//             endpoint.ChannelName, 
//             endpoint.Command<saga.SagaSession>[]
//         > = new Map();
//         const toDeleteByChannel: Map<
//             endpoint.ChannelName, 
//             endpoint.Command<saga.SagaSession>[]
//         > = new Map();

//         const messagesByChannel = await this.getRelayingMessages(this.BATCH_SIZE);
//         for (let channelName of messagesByChannel.keys()) {
//             toDeadLettersByChannel.set(channelName, []);
//             toDeleteByChannel.set(channelName, []);
//             const messages = messagesByChannel.get(channelName);
//             for (let message of messages) {
//                 try {
//                     await this._channelRegistry
//                         .getChannelByName(channelName)
//                         .send(message.getSagaMessage());
//                     toDeleteByChannel
//                         .get(channelName)
//                         .push(message.getSagaMessage());        
//                 } catch (e) {
//                     console.error(e);
//                     toDeadLettersByChannel
//                         .get(channelName)
//                         .push(message.getSagaMessage());
//                 }
//             }
//         }

//         for (const channelName of toDeadLettersByChannel.keys()) {
//             const channel = this._channelRegistry.getChannelByName(channelName);
//             const deadLetters = toDeadLettersByChannel.get(channelName);
//             channel.getCommandRepository().saveDeadLetters(deadLetters);
//         }

//         for (const channelName of toDeleteByChannel.keys()) {
//             const channel = this._channelRegistry.getChannelByName(channelName);
//             const toDelete = toDeleteByChannel.get(channelName);
//             channel.getCommandRepository().deleteCommands(toDelete);
//         }
//     }


// }

