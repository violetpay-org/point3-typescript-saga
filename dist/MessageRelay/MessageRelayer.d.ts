import * as uow from '../UnitOfWork/main';
import { TxContext } from '../UnitOfWork/main';
import { BatchJob } from './BatchJob';
import { ChannelRegistryForMessageRelay } from './Channel';
export declare class MessageRelayer<Tx extends TxContext> extends BatchJob {
    private BATCH_SIZE;
    private _channelRegistry;
    private _unitOfWorkFactory;
    private _messageRelayerMutex;
    constructor(batchSize: number, channelRegistry: ChannelRegistryForMessageRelay<Tx>, unitOfWorkFactory: uow.UnitOfWorkFactory<Tx>);
    execute(): Promise<void>;
    private relayAndSave;
    private saveDeadLetters;
    private deleteMessagesFromOutbox;
    private deleteDeadLetters;
    private publishMessages;
    private sendMessageToChannel;
    private pushToResultMap;
    private getRelayingMessages;
}
