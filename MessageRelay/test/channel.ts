import { p3saga, uow } from '../../index';
import { InMemoryCommand } from './messages';
import { ExampleSagaSession } from './session';

export class ExampleSavableCommandChannel extends p3saga.endpoint.SavableCommandChannel<
    InMemoryCommand,
    ExampleSagaSession
> {
    static readonly CHANNAL_NAME = 'ExampleSavableCommandChannel' as p3saga.endpoint.ChannelName;
    private _dispatchers: MessageDispatcher<InMemoryCommand>[] = [];

    addDispatcher(dispatcher: MessageDispatcher<InMemoryCommand>) {
        this._dispatchers.push(dispatcher);
    }

    send(command: p3saga.endpoint.AbstractSagaMessage): Promise<void> {
        // randomly throws an error
        if (Math.random() > 0.5) {
            return Promise.reject(new Error('failed to send'));
        }

        for (let dispatcher of this._dispatchers) {
            dispatcher.notice(command as InMemoryCommand);
        }
        return Promise.resolve();
    }

    getChannelName(): string {
        return ExampleSavableCommandChannel.CHANNAL_NAME;
    }   
}

export class MessageDispatcher<C extends p3saga.endpoint.AbstractSagaMessage> {
    private _commands: C[] = [];

    notice(command: C) {
        this._commands.push(command);
    }

    getNumberOfCommands(): number {
        return this._commands.length;
    }

    reset() {
        this._commands = [];
    }
}