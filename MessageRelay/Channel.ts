import { AbstractSagaMessage } from "Saga/Endpoint";
import { endpoint, api, saga } from "../Saga/index";
import { TxContext } from "UnitOfWork/main";
import { Mutex } from "async-mutex";

export interface ChannelFromMessageRelay<C extends AbstractSagaMessage, Tx extends TxContext>
    extends endpoint.Channel<C> {
    getRepository(): endpoint.AbstractMessageRepository<C, Tx>;
}

export class ChannelRegistryForMessageRelay<Tx extends TxContext> {
    private readonly _channelRegistry: api.ChannelRegistry;

    constructor(channelRegistry: api.ChannelRegistry) {
        this._channelRegistry = channelRegistry;
    }

    // This is a type guard
    // This function checks if the channel is a ChannelFromMessageRelay
    private isChannelFromMessageRelay<M extends endpoint.AbstractSagaMessage>(channel: endpoint.Channel<M>): channel is ChannelFromMessageRelay<M, Tx> {
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
    R extends endpoint.Response,
    Tx extends TxContext
> extends api.ChannelToSagaRegistry<R, Tx> implements ChannelFromMessageRelay<R, Tx> {
    private _repository: endpoint.AbstractMessageRepository<R, Tx>;

    constructor(
        sagaRegistry: api.SagaRegistry<Tx>,
        repository: endpoint.AbstractMessageRepository<R, Tx>
    ) {
        super(sagaRegistry);
        this._repository = repository;
    }

    getRepository(): endpoint.ResponseRepository<R, Tx> {
        return this._repository;
    }
}

export abstract class BaseRemoteCommandChannel<
    S extends saga.SagaSession,
    A extends endpoint.CommandArguments,
    Tx extends TxContext
> extends endpoint.AbstractChannel<endpoint.Command<S, A>> {
    private _repository: endpoint.CommandRepository<endpoint.Command<S, A>, Tx>;

    constructor(repository: endpoint.CommandRepository<endpoint.Command<S, A>, Tx>) {
        super();
        this._repository = repository;
    }

    getRepository(): endpoint.CommandRepository<endpoint.Command<S, A>, Tx> {
        return this._repository;
    }
}