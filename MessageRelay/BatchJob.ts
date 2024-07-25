import { assert } from 'console';
import corn from 'node-cron';

export abstract class BatchJob {
    abstract execute(): Promise<void>;
}

export class BatchJobScheduler {
    private _jobs: BatchJob[] = [];
    private _task: corn.ScheduledTask;
    
    public addJob(job: BatchJob): void {
        this._jobs.push(job);
    }

    public async activateJobs(sleep: number): Promise<void> {
        // sleep should be in seconds, integer larger than 0
        if (sleep < 1) {
            throw new Error('Invalid sleep time');
        }

        const task = corn.schedule(`*/${sleep} * * * * *`, async () => {
            for (const job of this._jobs) {
                await job.execute();
            }
        });

        if (this._task) {
            this._task.stop();
        }

        this._task = task;
    }

    public async deactivateJobs(): Promise<void> {
        if (!this._task) {
            throw new Error('No task to stop');
        }

        this._task.stop();
    }
}