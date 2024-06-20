import { randomUUID } from 'crypto';
import * as point3Saga from '../Saga'
import { Executable, TxContext } from '../UnitOfWork/main';
import { ExampleRequestCommand } from './command';

export class InMemoryExampleRequestCommandRepository implements point3Saga.endpoint.commandRepository.CommandRepository<ExampleRequestCommand, TxContext> {
    private readonly _commands: Map<string, ExampleRequestCommand> = new Map();

    saveCommand(command: ExampleRequestCommand): Executable<TxContext> {
        return async (tx: TxContext) => {
            this._commands.set(randomUUID(), command)
        }
    }

    // For testing purposes only
    getCommands(): IterableIterator<ExampleRequestCommand> {
        return this._commands.values();
    }
}