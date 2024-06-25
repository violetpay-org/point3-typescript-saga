import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { Command } from "./CommandEndpoint";
import { saga } from "..";

export interface CommandRepository<C extends Command<saga.session.SagaSession>, Tx extends TxContext> {
    saveCommand(command: C): Executable<Tx>;
    saveDeadLetters(command: C[]): Executable<Tx>;
    deleteCommands(commands: C[]): Executable<Tx>;
    deleteDeadLetters(commands: C[]): Executable<Tx>;
    getCommandsFromOutbox(batchSize: number): Promise<C[]>;
    getCommandsFromDeadLetter(batchSize: number): Promise<C[]>;
}