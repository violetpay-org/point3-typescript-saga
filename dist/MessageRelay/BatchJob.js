"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BatchJobScheduler = exports.BatchJob = void 0;
const node_cron_1 = __importDefault(require("node-cron"));
class BatchJob {
}
exports.BatchJob = BatchJob;
class BatchJobScheduler {
    constructor() {
        this._jobs = [];
    }
    addJob(job) {
        this._jobs.push(job);
    }
    async activateJobs(sleep) {
        if (sleep < 1) {
            throw new Error('Invalid sleep time');
        }
        const task = node_cron_1.default.schedule(`*/${sleep} * * * * *`, async () => {
            for (const job of this._jobs) {
                await job.execute();
            }
        });
        if (this._task) {
            this._task.stop();
        }
        this._task = task;
    }
    async deactivateJobs() {
        if (!this._task) {
            throw new Error('No task to stop');
        }
        this._task.stop();
    }
}
exports.BatchJobScheduler = BatchJobScheduler;
//# sourceMappingURL=BatchJob.js.map