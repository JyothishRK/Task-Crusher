const Counter = require('../models/counter');
const { ErrorHandler, AppError } = require('../utils/errorHandler');

/**
 * Counter Service for managing auto-incremented IDs across collections
 * Provides atomic counter operations to ensure unique sequential IDs
 */
class CounterService {
    /**
     * Get the next sequence value for a collection
     * Uses atomic findOneAndUpdate with $inc to prevent race conditions
     * 
     * @param {string} collectionName - Name of the collection (e.g., "tasks", "users")
     * @returns {Promise<number>} The next sequence value
     * @throws {Error} If counter operation fails
     */
    static async getNextSequence(collectionName) {
        if (!collectionName || typeof collectionName !== 'string') {
            throw new Error('Collection name is required and must be a string');
        }

        try {

            // Use findOneAndUpdate with upsert to atomically increment counter
            const counter = await Counter.findOneAndUpdate(
                { _id: collectionName },
                { $inc: { sequence_value: 1 } },
                { 
                    new: true, // Return updated document
                    upsert: true, // Create if doesn't exist
                    runValidators: true
                }
            );

            return counter.sequence_value;
        } catch (error) {
            console.error(`CounterService: Failed to get next sequence for ${collectionName}:`, error);
            throw ErrorHandler.counterGenerationFailed(collectionName, error);
        }
    }

    /**
     * Initialize a counter for a collection with a specific starting value
     * Only creates if counter doesn't already exist
     * 
     * @param {string} collectionName - Name of the collection
     * @param {number} startValue - Starting value for the counter (default: 1)
     * @returns {Promise<boolean>} True if counter was created, false if already exists
     * @throws {Error} If initialization fails
     */
    static async initializeCounter(collectionName, startValue = 1) {
        if (!collectionName || typeof collectionName !== 'string') {
            throw new Error('Collection name is required and must be a string');
        }

        if (!Number.isInteger(startValue) || startValue < 1) {
            throw new Error('Start value must be a positive integer');
        }

        try {

            // Check if counter already exists
            const existingCounter = await Counter.findById(collectionName);
            if (existingCounter) {
                console.log(`CounterService: Counter for ${collectionName} already exists with value ${existingCounter.sequence_value}`);
                return false;
            }

            // Create new counter
            const counter = new Counter({
                _id: collectionName,
                sequence_value: startValue
            });

            await counter.save();
            console.log(`CounterService: Initialized counter for ${collectionName} with start value ${startValue}`);
            return true;
        } catch (error) {
            console.error(`CounterService: Failed to initialize counter for ${collectionName}:`, error);
            throw new Error(`Failed to initialize counter for ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Reset a counter to a specific value
     * WARNING: This should be used carefully as it can cause ID conflicts
     * 
     * @param {string} collectionName - Name of the collection
     * @param {number} newValue - New value for the counter
     * @returns {Promise<number>} The new counter value
     * @throws {Error} If reset fails
     */
    static async resetCounter(collectionName, newValue = 1) {
        if (!collectionName || typeof collectionName !== 'string') {
            throw new Error('Collection name is required and must be a string');
        }

        if (!Number.isInteger(newValue) || newValue < 1) {
            throw new Error('New value must be a positive integer');
        }

        try {

            const counter = await Counter.findOneAndUpdate(
                { _id: collectionName },
                { sequence_value: newValue },
                { 
                    new: true,
                    upsert: true,
                    runValidators: true
                }
            );

            console.log(`CounterService: Reset counter for ${collectionName} to ${newValue}`);
            return counter.sequence_value;
        } catch (error) {
            console.error(`CounterService: Failed to reset counter for ${collectionName}:`, error);
            throw new Error(`Failed to reset counter for ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Get current counter value without incrementing
     * 
     * @param {string} collectionName - Name of the collection
     * @returns {Promise<number|null>} Current counter value or null if doesn't exist
     * @throws {Error} If query fails
     */
    static async getCurrentValue(collectionName) {
        if (!collectionName || typeof collectionName !== 'string') {
            throw new Error('Collection name is required and must be a string');
        }

        try {

            const counter = await Counter.findById(collectionName);
            return counter ? counter.sequence_value : null;
        } catch (error) {
            console.error(`CounterService: Failed to get current value for ${collectionName}:`, error);
            throw new Error(`Failed to get current counter value for ${collectionName}: ${error.message}`);
        }
    }

    /**
     * Get all counters (useful for monitoring/debugging)
     * 
     * @returns {Promise<Array>} Array of all counter documents
     * @throws {Error} If query fails
     */
    static async getAllCounters() {
        try {
            const counters = await Counter.find({}).sort({ _id: 1 });
            return counters;
        } catch (error) {
            console.error('CounterService: Failed to get all counters:', error);
            throw new Error(`Failed to get all counters: ${error.message}`);
        }
    }
}

module.exports = CounterService;