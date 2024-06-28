import corn from 'node-cron';

export abstract class BatchJob {
    abstract execute(): Promise<void>;
}

export class BatchJobScheduler {
    private _jobs: BatchJob[] = [];
    

    public addJob(job: BatchJob): void {
        this._jobs.push(job);
    }

    public async activateJobs(): Promise<void> {
        corn.schedule('*/2 * * * *', async () => {
            for (const job of this._jobs) {
                await job.execute();
            }
        });
    }
}