import { AbstractSagaMessage } from "Saga/Endpoint";
import { p3saga, uow } from "index";

export interface ChannelFromMessageRelay<C extends AbstractSagaMessage, Tx extends uow.TxContext> 
    extends p3saga.endpoint.Channel<C> 
{
    getRepository(): p3saga.endpoint.AbstractMessageRepository<C, Tx>;
}

export class ChannelRegistryForMessageRelay<Tx extends uow.TxContext> {
    private _channelRegistry: p3saga.api.ChannelRegistry<Tx>;

    constructor(channelRegistry: p3saga.api.ChannelRegistry<Tx>) {
        this._channelRegistry = channelRegistry;
    }

    // This is a type guard
    // This function checks if the channel is a ChannelFromMessageRelay
    private isChannelFromMessageRelay<M extends p3saga.endpoint.AbstractSagaMessage>(channel: p3saga.endpoint.Channel<M>): channel is ChannelFromMessageRelay<M, Tx> {
        return "getRepository" in channel;
    }

    public getChannelByName(channelName: string): ChannelFromMessageRelay<AbstractSagaMessage, Tx> {
        const channel = this._channelRegistry.getChannelByName(channelName);

        if (!this.isChannelFromMessageRelay(channel)) {
            return null;
        }

        return channel as ChannelFromMessageRelay<AbstractSagaMessage, Tx>;
    }

    public getChannels(): ChannelFromMessageRelay<AbstractSagaMessage, Tx>[] {
        return this._channelRegistry.getChannels()
            .filter(this.isChannelFromMessageRelay);
    }
} 

export abstract class BaseLocalResponseChannel<
    R extends p3saga.endpoint.Response,
    Tx extends uow.TxContext
> extends p3saga.endpoint.AbstractChannel<R> implements ChannelFromMessageRelay<R, Tx> {
    private _repository: p3saga.endpoint.AbstractMessageRepository<R, Tx>;

    constructor(repository: p3saga.endpoint.AbstractMessageRepository<R, Tx>) {
        super();
        this._repository = repository;
    }

    getRepository(): p3saga.endpoint.ResponseRepository<R, Tx> {
        return this._repository;
    }
}

export abstract class BaseRemoteCommandChannel<
    S extends p3saga.saga.SagaSession,
    A extends p3saga.endpoint.CommandArguments,
    Tx extends uow.TxContext
> extends p3saga.endpoint.AbstractChannel<p3saga.endpoint.Command<S, A>> {
    private _repository: p3saga.endpoint.CommandRepository<p3saga.endpoint.Command<S, A>, Tx>;

    constructor(repository: p3saga.endpoint.CommandRepository<p3saga.endpoint.Command<S, A>, Tx>) {
        super();
        this._repository = repository;
    }

    getRepository(): p3saga.endpoint.CommandRepository<p3saga.endpoint.Command<S, A>, Tx> {
        return this._repository;
    }
}