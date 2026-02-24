import { AbstractSagaMessage } from '../Saga/Endpoint';
import { endpoint, api, saga } from '../Saga/index';
import { TxContext } from '../UnitOfWork/main';
export interface ChannelFromMessageRelay<C extends AbstractSagaMessage, Tx extends TxContext> extends endpoint.Channel<C> {
    getRepository(): endpoint.AbstractMessageRepository<C, Tx>;
}
export declare class ChannelRegistryForMessageRelay<Tx extends TxContext> {
    private readonly _channelRegistry;
    private _channelMutex;
    constructor(channelRegistry: api.ChannelRegistry);
    private isChannelFromMessageRelay;
    getChannelByName(channelName: string): Promise<ChannelFromMessageRelay<AbstractSagaMessage, Tx>>;
    getChannels(): Promise<ChannelFromMessageRelay<AbstractSagaMessage, Tx>[]>;
}
export declare abstract class BaseLocalResponseChannel<R extends endpoint.Response, Tx extends TxContext> extends api.ChannelToSagaRegistry<R, Tx> implements ChannelFromMessageRelay<R, Tx> {
    private _repository;
    constructor(sagaRegistry: api.SagaRegistry<Tx>, repository: endpoint.AbstractMessageRepository<R, Tx>);
    getRepository(): endpoint.ResponseRepository<R, Tx>;
}
export declare abstract class BaseRemoteCommandChannel<C extends endpoint.Command<S, A>, S extends saga.SagaSession, A extends endpoint.CommandArguments, Tx extends TxContext> extends endpoint.AbstractChannel<C> implements ChannelFromMessageRelay<C, Tx> {
    private _repository;
    constructor(repository: endpoint.CommandRepository<C, Tx>);
    getRepository(): endpoint.CommandRepository<C, Tx>;
}
