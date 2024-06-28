import { Executable, TxContext } from "../../UnitOfWork/main";
import { Command, CommandArguments, Response } from "./CommandEndpoint";
import * as saga from "../SagaSession/index";

export interface CommandRepository<C extends Command<saga.SagaSession, CommandArguments>, Tx extends TxContext> {
    saveMessage(command: C): Executable<Tx>;
    saveDeadLetters(commands: C[]): Executable<Tx>;
    deleteMessage(messageId: string): Executable<Tx>;
    deleteDeadLetters(messageIds: string[]): Executable<Tx>;
    getMessagesFromOutbox(batchSize: number): Promise<C[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<C[]>;
}

export interface ResponseRepository<R extends Response, Tx extends TxContext> {
    saveMessage(response: R): Executable<Tx>;
    saveDeadLetters(responseRecords: R[]): Executable<Tx>;
    deleteMessage(messageId: string): Executable<Tx>;
    deleteDeadLetters(messageIds: string[]): Executable<Tx>;
    getMessagesFromOutbox(batchSize: number): Promise<R[]>;
    getMessagesFromDeadLetter(batchSize: number): Promise<R[]>;
}