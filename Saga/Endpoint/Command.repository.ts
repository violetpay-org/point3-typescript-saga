import { Executable, TxContext } from "src/point3-typescript-saga/UnitOfWork/main";
import { Command } from "./CommandEndpoint";

export interface CommandRepository<C extends Command, Tx extends TxContext> {
    saveCommand(command: C): Executable<Tx>;
}