const Counter = require('../models/counter');

/**
 * Get the next sequence number for a given counter
 * @param {string} counterName - The name of the counter (e.g., 'userId', 'taskId')
 * @returns {Promise<number>} - The next sequence number
 */
async function getNextSequence(counterName) {
    try {
        const counter = await Counter.findOneAndUpdate(
            { _id: counterName },
            { $inc: { sequence: 1 } },
            { 
                new: true, 
                upsert: true,
                setDefaultsOnInsert: true
            }
        );
        
        return counter.sequence;
    } catch (error) {
        throw new Error(`Failed to generate sequence for ${counterName}: ${error.message}`);
    }
}

/**
 * Initialize a counter with a specific starting value
 * @param {string} counterName - The name of the counter
 * @param {number} startValue - The starting value (default: 1)
 * @returns {Promise<void>}
 */
async function initializeCounter(counterName, startValue = 1) {
    try {
        await Counter.findOneAndUpdate(
            { _id: counterName },
            { sequence: startValue },
            { 
                upsert: true,
                setDefaultsOnInsert: true
            }
        );
    } catch (error) {
        throw new Error(`Failed to initialize counter ${counterName}: ${error.message}`);
    }
}

/**
 * Get current sequence value without incrementing
 * @param {string} counterName - The name of the counter
 * @returns {Promise<number>} - Current sequence value
 */
async function getCurrentSequence(counterName) {
    try {
        const counter = await Counter.findById(counterName);
        return counter ? counter.sequence : 0;
    } catch (error) {
        throw new Error(`Failed to get current sequence for ${counterName}: ${error.message}`);
    }
}

/**
 * Reset a counter to a specific value
 * @param {string} counterName - The name of the counter
 * @param {number} value - The value to reset to
 * @returns {Promise<void>}
 */
async function resetCounter(counterName, value = 1) {
    try {
        await Counter.findOneAndUpdate(
            { _id: counterName },
            { sequence: value },
            { upsert: true }
        );
    } catch (error) {
        throw new Error(`Failed to reset counter ${counterName}: ${error.message}`);
    }
}

module.exports = {
    getNextSequence,
    initializeCounter,
    getCurrentSequence,
    resetCounter
};