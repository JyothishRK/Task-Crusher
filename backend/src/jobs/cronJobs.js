const cron = require('node-cron');
const RecurringTaskService = require('../services/recurringTaskService');
const { logCronJob, logRecurringTaskError, logRecurringTaskInfo } = require('../utils/logger');

/**
 * Initialize and start all cron jobs
 */
function initializeCronJobs() {
    try {
        // Daily recurring task maintenance job - runs at 2:00 AM
        cron.schedule('0 2 * * *', async () => {
            const jobStartTime = Date.now();
            
            try {
                logCronJob('recurring_task_maintenance', 'START', {
                    scheduledTime: new Date().toISOString(),
                    timezone: 'UTC'
                });
                
                const result = await RecurringTaskService.ensureRecurringInstances();
                
                const jobDuration = Date.now() - jobStartTime;
                
                if (result.success) {
                    logCronJob('recurring_task_maintenance', 'SUCCESS', {
                        ...result.summary,
                        jobDuration: `${jobDuration}ms`
                    });
                } else {
                    logCronJob('recurring_task_maintenance', 'ERROR', {
                        error: result.error,
                        jobDuration: `${jobDuration}ms`
                    });
                }
                
            } catch (error) {
                const jobDuration = Date.now() - jobStartTime;
                
                logRecurringTaskError('cron_job', 'Daily recurring task maintenance job failed with unhandled error', {
                    error: error.message,
                    stack: error.stack,
                    jobDuration: `${jobDuration}ms`
                });
                
                logCronJob('recurring_task_maintenance', 'ERROR', {
                    error: error.message,
                    jobDuration: `${jobDuration}ms`
                });
            }
        }, {
            scheduled: true,
            timezone: "UTC"
        });

        logRecurringTaskInfo('cron_job', 'Cron jobs initialized successfully', {
            jobs: ['recurring_task_maintenance'],
            schedule: '0 2 * * *',
            timezone: 'UTC'
        });
        
    } catch (error) {
        logRecurringTaskError('cron_job', 'Failed to initialize cron jobs', {
            error: error.message,
            stack: error.stack
        });
        throw error; // Re-throw to prevent silent failures
    }
}

module.exports = {
    initializeCronJobs
};