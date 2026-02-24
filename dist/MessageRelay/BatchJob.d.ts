export declare abstract class BatchJob {
    abstract execute(): Promise<void>;
}
export declare class BatchJobScheduler {
    private _jobs;
    private _task;
    addJob(job: BatchJob): void;
    activateJobs(sleep: number): Promise<void>;
    deactivateJobs(): Promise<void>;
}
