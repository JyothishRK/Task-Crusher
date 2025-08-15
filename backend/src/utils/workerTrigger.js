const axios = require('axios');
const { ErrorHandler } = require('./errorHandler');

/**
 * Worker Trigger utility for making internal API calls
 * Handles communication with the internal worker API
 */
class WorkerTrigger {
    /**
     * Get the internal API base URL
     * @returns {string} Base URL for internal API
     */
    static getInternalApiUrl() {
        const port = process.env.PORT || 3000;
        return `http://localhost:${port}/internal`;
    }

    /**
     * Get headers for internal API requests
     * @returns {Object} Headers object
     */
    static getInternalHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };

        // Add internal API key if configured
        if (process.env.INTERNAL_API_KEY) {
            headers['x-internal-api-key'] = process.env.INTERNAL_API_KEY;
        }

        return headers;
    }

    /**
     * Trigger worker processing for task recurrence
     * 
     * @param {string} taskId - Task ID to process
     * @param {string} operation - Operation type ('create', 'complete', 'delete')
     * @param {string} userId - User ID (required for delete operation)
     * @returns {Promise<Object|null>} Worker response or null if failed
     */
    static async triggerTaskRecurrence(taskId, operation, userId = null) {
        try {
            if (!taskId || !operation) {
                console.error('WorkerTrigger: taskId and operation are required');
                return null;
            }

            const url = `${this.getInternalApiUrl()}/worker/tasks/recurrence`;
            const payload = {
                taskId,
                operation,
                ...(userId && { userId })
            };

            console.log(`WorkerTrigger: Triggering ${operation} for task ${taskId}`);

            // Use retry mechanism for worker API calls
            const response = await ErrorHandler.retry(
                () => axios.post(url, payload, {
                    headers: this.getInternalHeaders(),
                    timeout: 10000 // 10 second timeout
                }),
                2, // Max 2 retries
                500 // 500ms delay
            );

            if (response.data.success) {
                console.log(`WorkerTrigger: Successfully triggered ${operation} for task ${taskId}`);
                return response.data;
            } else {
                console.error(`WorkerTrigger: Worker API returned error:`, response.data);
                return null;
            }

        } catch (error) {
            // Don't throw errors - worker failures shouldn't break main API
            console.error(`WorkerTrigger: Failed to trigger ${operation} for task ${taskId}:`, error.message);
            return null;
        }
    }

    /**
     * Trigger task creation processing
     * 
     * @param {string} taskId - Created task ID
     * @returns {Promise<Object|null>} Worker response or null if failed
     */
    static async triggerTaskCreation(taskId) {
        return this.triggerTaskRecurrence(taskId, 'create');
    }

    /**
     * Trigger task completion processing
     * 
     * @param {string} taskId - Completed task ID
     * @returns {Promise<Object|null>} Worker response or null if failed
     */
    static async triggerTaskCompletion(taskId) {
        return this.triggerTaskRecurrence(taskId, 'complete');
    }

    /**
     * Trigger task deletion processing
     * 
     * @param {string} taskId - Deleted task ID
     * @param {string} userId - User ID who owns the task
     * @returns {Promise<Object|null>} Worker response or null if failed
     */
    static async triggerTaskDeletion(taskId, userId) {
        return this.triggerTaskRecurrence(taskId, 'delete', userId);
    }

    /**
     * Trigger cleanup operations
     * 
     * @returns {Promise<Object|null>} Worker response or null if failed
     */
    static async triggerCleanup() {
        try {
            const url = `${this.getInternalApiUrl()}/worker/tasks/cleanup`;

            console.log('WorkerTrigger: Triggering cleanup operations');

            const response = await axios.post(url, {}, {
                headers: this.getInternalHeaders(),
                timeout: 30000 // 30 second timeout for cleanup
            });

            if (response.data.success) {
                console.log('WorkerTrigger: Successfully triggered cleanup operations');
                return response.data;
            } else {
                console.error('WorkerTrigger: Cleanup API returned error:', response.data);
                return null;
            }

        } catch (error) {
            console.error('WorkerTrigger: Failed to trigger cleanup:', error.message);
            return null;
        }
    }

    /**
     * Get worker health status
     * 
     * @returns {Promise<Object|null>} Health status or null if failed
     */
    static async getWorkerHealth() {
        try {
            const url = `${this.getInternalApiUrl()}/worker/health`;

            const response = await axios.get(url, {
                headers: this.getInternalHeaders(),
                timeout: 5000 // 5 second timeout
            });

            return response.data;

        } catch (error) {
            console.error('WorkerTrigger: Failed to get worker health:', error.message);
            return null;
        }
    }

    /**
     * Validate recurrence configuration
     * 
     * @param {Object} task - Task object to validate
     * @returns {Promise<boolean>} True if valid, false if invalid or error
     */
    static async validateRecurrence(task) {
        try {
            if (!task || typeof task !== 'object') {
                return false;
            }

            const url = `${this.getInternalApiUrl()}/worker/validate`;

            const response = await axios.post(url, { task }, {
                headers: this.getInternalHeaders(),
                timeout: 5000 // 5 second timeout
            });

            return response.data.success && response.data.data.valid;

        } catch (error) {
            console.error('WorkerTrigger: Failed to validate recurrence:', error.message);
            return false;
        }
    }

    /**
     * Check if worker services are available
     * 
     * @returns {Promise<boolean>} True if available, false otherwise
     */
    static async isWorkerAvailable() {
        const health = await this.getWorkerHealth();
        return health && health.success && health.data.status === 'healthy';
    }

    /**
     * Safe worker trigger that doesn't throw errors
     * Used in middleware where worker failures shouldn't break the main flow
     * 
     * @param {Function} triggerFunction - Function to execute
     * @param {...any} args - Arguments to pass to the function
     * @returns {Promise<Object|null>} Result or null if failed
     */
    static async safeTrigger(triggerFunction, ...args) {
        try {
            return await triggerFunction.apply(this, args);
        } catch (error) {
            console.error('WorkerTrigger: Safe trigger failed:', error.message);
            return null;
        }
    }
}

module.exports = WorkerTrigger;