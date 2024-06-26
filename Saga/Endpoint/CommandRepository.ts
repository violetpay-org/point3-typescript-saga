import { Executable, TxContext } from "../../UnitOfWork/main";
import { Command, CommandArguments, Response } from "./CommandEndpoint";
import * as saga from "../SagaSession/index";

export interface CommandRepository<C extends Command<saga.SagaSession, CommandArguments>, Tx extends TxContext> {
    saveCommand(command: C): Executable<Tx>;
    saveDeadLetters(commands: C[]): Executable<Tx>;
    deleteCommands(messageId: string): Executable<Tx>;
    deleteDeadLetters(messageIds: string[]): Executable<Tx>;
    getCommandsFromOutbox(batchSize: number): Promise<C[]>;
    getCommandsFromDeadLetter(batchSize: number): Promise<C[]>;
}

export interface ResponseRepository<R extends Response, Tx extends TxContext> {
    saveResponse(response: R): Executable<Tx>;
    saveDeadLetters(responseRecords: R[]): Executable<Tx>;
    deleteResponses(messageId: string): Executable<Tx>;
    getResponsesFromOutbox(batchSize: number): Promise<R[]>;
    getResponsesFromOutbox(batchSize: number): Promise<R[]>;
}