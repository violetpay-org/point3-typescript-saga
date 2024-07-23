import { assert } from 'console';
import corn from 'node-cron';

export abstract class BatchJob {
    abstract execute(): Promise<void>;
}

export class BatchJobScheduler {
    private _jobs: BatchJob[] = [];
    
    public addJob(job: BatchJob): void {
        this._jobs.push(job);
    }

    public async activateJobs(sleep: number): Promise<void> {
        // sleep should be in seconds, integer larger than 0
        if (sleep < 1) {
            throw new Error('Invalid sleep time');
        }

        corn.schedule(`*/${sleep} * * * * *`, async () => {
            for (const job of this._jobs) {
                await job.execute();
            }
        });
    }
}