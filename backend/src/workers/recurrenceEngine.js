/**
 * Recurrence Engine for calculating recurring task dates
 * Handles daily, weekly, and monthly recurrence patterns with edge case handling
 */
class RecurrenceEngine {
    /**
     * Calculate the next occurrence date based on a base date and repeat type
     * 
     * @param {Date} baseDate - The base date to calculate from
     * @param {string} repeatType - Type of recurrence ('daily', 'weekly', 'monthly')
     * @returns {Date} Next occurrence date
     * @throws {Error} If invalid parameters
     */
    static calculateNextOccurrence(baseDate, repeatType) {
        if (!baseDate || !(baseDate instanceof Date)) {
            throw new Error('Valid base date is required');
        }

        if (!repeatType || typeof repeatType !== 'string') {
            throw new Error('Valid repeat type is required');
        }

        const validTypes = ['daily', 'weekly', 'monthly'];
        if (!validTypes.includes(repeatType)) {
            throw new Error(`Invalid repeat type. Must be one of: ${validTypes.join(', ')}`);
        }

        const nextDate = new Date(baseDate);

        switch (repeatType) {
            case 'daily':
                nextDate.setDate(nextDate.getDate() + 1);
                break;

            case 'weekly':
                nextDate.setDate(nextDate.getDate() + 7);
                break;

            case 'monthly':
                // Handle month-end edge cases
                const originalDay = nextDate.getDate();
                nextDate.setMonth(nextDate.getMonth() + 1);
                
                // If the day doesn't exist in the new month (e.g., Jan 31 -> Feb 31)
                // Set to the last day of the month
                if (nextDate.getDate() !== originalDay) {
                    nextDate.setDate(0); // Sets to last day of previous month
                }
                break;

            default:
                throw new Error(`Unsupported repeat type: ${repeatType}`);
        }

        return nextDate;
    }

    /**
     * Generate multiple occurrences from a start date
     * 
     * @param {Date} startDate - Starting date for generation
     * @param {string} repeatType - Type of recurrence
     * @param {number} count - Number of occurrences to generate
     * @returns {Array<Date>} Array of occurrence dates
     * @throws {Error} If invalid parameters
     */
    static generateOccurrences(startDate, repeatType, count = 3) {
        if (!startDate || !(startDate instanceof Date)) {
            throw new Error('Valid start date is required');
        }

        if (!Number.isInteger(count) || count < 1) {
            throw new Error('Count must be a positive integer');
        }

        if (count > 100) {
            throw new Error('Count cannot exceed 100 occurrences');
        }

        const occurrences = [];
        let currentDate = new Date(startDate);

        for (let i = 0; i < count; i++) {
            currentDate = this.calculateNextOccurrence(currentDate, repeatType);
            occurrences.push(new Date(currentDate));
        }

        return occurrences;
    }

    /**
     * Validate recurrence rules for a task
     * 
     * @param {Object} task - Task object to validate
     * @returns {boolean} True if valid
     * @throws {Error} If validation fails
     */
    static validateRecurrenceRules(task) {
        if (!task || typeof task !== 'object') {
            throw new Error('Valid task object is required');
        }

        // If no repeat type or 'none', no validation needed
        if (!task.repeatType || task.repeatType === 'none') {
            return true;
        }

        // Validate repeat type
        const validTypes = ['daily', 'weekly', 'monthly'];
        if (!validTypes.includes(task.repeatType)) {
            throw new Error(`Invalid repeat type: ${task.repeatType}`);
        }

        // Validate due date exists
        if (!task.dueDate) {
            throw new Error('Due date is required for recurring tasks');
        }

        // Validate due date is a valid date
        const dueDate = new Date(task.dueDate);
        if (isNaN(dueDate.getTime())) {
            throw new Error('Due date must be a valid date');
        }

        // Validate due date is not in the past (with some tolerance)
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        if (dueDate < oneDayAgo) {
            throw new Error('Due date for recurring tasks should not be more than 1 day in the past');
        }

        // Sub-tasks cannot be recurring
        if (task.parentTaskId && task.repeatType !== 'none') {
            throw new Error('Sub-tasks cannot have recurring patterns');
        }

        return true;
    }

    /**
     * Calculate time until next occurrence
     * 
     * @param {Date} baseDate - Base date
     * @param {string} repeatType - Repeat type
     * @returns {Object} Time difference object
     * @throws {Error} If invalid parameters
     */
    static getTimeUntilNext(baseDate, repeatType) {
        const nextDate = this.calculateNextOccurrence(baseDate, repeatType);
        const now = new Date();
        const diffMs = nextDate.getTime() - now.getTime();

        const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

        return {
            nextDate,
            totalMs: diffMs,
            days,
            hours,
            minutes,
            isPast: diffMs < 0
        };
    }

    /**
     * Get recurrence pattern description
     * 
     * @param {string} repeatType - Repeat type
     * @returns {string} Human-readable description
     */
    static getRecurrenceDescription(repeatType) {
        const descriptions = {
            'none': 'No recurrence',
            'daily': 'Repeats daily',
            'weekly': 'Repeats weekly',
            'monthly': 'Repeats monthly'
        };

        return descriptions[repeatType] || 'Unknown recurrence pattern';
    }

    /**
     * Handle edge cases for monthly recurrence
     * 
     * @param {Date} date - Date to adjust
     * @param {number} targetDay - Target day of month
     * @returns {Date} Adjusted date
     */
    static handleMonthlyEdgeCases(date, targetDay) {
        const adjustedDate = new Date(date);
        
        // Get the last day of the current month
        const lastDayOfMonth = new Date(adjustedDate.getFullYear(), adjustedDate.getMonth() + 1, 0).getDate();
        
        // If target day doesn't exist in this month, use the last day
        if (targetDay > lastDayOfMonth) {
            adjustedDate.setDate(lastDayOfMonth);
        } else {
            adjustedDate.setDate(targetDay);
        }
        
        return adjustedDate;
    }

    /**
     * Check if a date falls on a weekend
     * 
     * @param {Date} date - Date to check
     * @returns {boolean} True if weekend
     */
    static isWeekend(date) {
        const day = date.getDay();
        return day === 0 || day === 6; // Sunday = 0, Saturday = 6
    }

    /**
     * Adjust date to next business day if it falls on weekend
     * 
     * @param {Date} date - Date to adjust
     * @returns {Date} Adjusted date
     */
    static adjustToBusinessDay(date) {
        const adjustedDate = new Date(date);
        
        while (this.isWeekend(adjustedDate)) {
            adjustedDate.setDate(adjustedDate.getDate() + 1);
        }
        
        return adjustedDate;
    }

    /**
     * Calculate occurrences for a specific time period
     * 
     * @param {Date} startDate - Start date
     * @param {Date} endDate - End date
     * @param {string} repeatType - Repeat type
     * @returns {Array<Date>} Occurrences within the period
     * @throws {Error} If invalid parameters
     */
    static getOccurrencesInPeriod(startDate, endDate, repeatType) {
        if (!startDate || !(startDate instanceof Date)) {
            throw new Error('Valid start date is required');
        }

        if (!endDate || !(endDate instanceof Date)) {
            throw new Error('Valid end date is required');
        }

        if (endDate <= startDate) {
            throw new Error('End date must be after start date');
        }

        const occurrences = [];
        let currentDate = new Date(startDate);

        // Prevent infinite loops by limiting iterations
        let iterations = 0;
        const maxIterations = 1000;

        while (currentDate <= endDate && iterations < maxIterations) {
            occurrences.push(new Date(currentDate));
            currentDate = this.calculateNextOccurrence(currentDate, repeatType);
            iterations++;
        }

        return occurrences;
    }
}

module.exports = RecurrenceEngine;