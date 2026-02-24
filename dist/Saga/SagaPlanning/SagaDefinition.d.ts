import { TxContext } from "../../UnitOfWork/main";
import { Step } from "./Step";
export declare class SagaDefinition<Tx extends TxContext> {
    steps: Step<Tx>[];
    constructor();
    getSteps(): Step<Tx>[];
    getStep(name: string): Step<Tx>;
    getFirstStep(): Step<Tx>;
    getLastStep(): Step<Tx>;
    getStepAfter(stepName: string): Step<Tx>;
    getStepBefore(stepName: string): Step<Tx>;
    checkNoDuplicateStepNames(): boolean;
}
