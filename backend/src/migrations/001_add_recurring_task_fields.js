/**
 * Database migration: Add recurring task fields and indexes
 * 
 * This migration adds the parentRecurringId field to existing tasks
 * and creates necessary indexes for recurring task performance.
 * 
 * Migration ID: 001
 * Description: Add recurring task support to existing task schema
 * Date: 2024-01-18
 */

const mongoose = require('mongoose');
const { logRecurringTaskInfo, logRecurringTaskError, logRecurringTaskWarning } = require('../utils/logger');

/**
 * Migration configuration
 */
const MIGRATION_CONFIG = {
    id: '001',
    name: 'add_recurring_task_fields',
    description: 'Add parentRecurringId field and indexes for recurring task support',
    version: '1.0.0'
};

/**
 * Run the migration (forward)
 * @param {Object} db - MongoDB database connection
 * @returns {Promise<Object>} Migration result
 */
async function up(db) {
    const startTime = Date.now();
    
    try {
        logRecurringTaskInfo('migration', `Starting migration ${MIGRATION_CONFIG.id}: ${MIGRATION_CONFIG.name}`);
        
        const tasksCollection = db.collection('tasks');
        
        // Step 1: Add parentRecurringId field to existing tasks (set to null)
        logRecurringTaskInfo('migration', 'Step 1: Adding parentRecurringId field to existing tasks');
        
        const updateResult = await tasksCollection.updateMany(
            { parentRecurringId: { $exists: false } }, // Only update tasks that don't have this field
            { $set: { parentRecurringId: null } }
        );
        
        logRecurringTaskInfo('migration', `Updated ${updateResult.modifiedCount} tasks with parentRecurringId field`);
        
        // Step 2: Create indexes for recurring task performance
        logRecurringTaskInfo('migration', 'Step 2: Creating indexes for recurring task performance');
        
        const indexes = [
            {
                name: 'parentRecurringId_1',
                spec: { parentRecurringId: 1 },
                options: { 
                    background: true,
                    sparse: true // Only index documents where parentRecurringId is not null
                }
            },
            {
                name: 'userId_parentRecurringId_1',
                spec: { userId: 1, parentRecurringId: 1 },
                options: { 
                    background: true,
                    sparse: true
                }
            },
            {
                name: 'repeatType_1',
                spec: { repeatType: 1 },
                options: { 
                    background: true,
                    sparse: true
                }
            },
            {
                name: 'userId_repeatType_1',
                spec: { userId: 1, repeatType: 1 },
                options: { 
                    background: true,
                    sparse: true
                }
            },
            {
                name: 'parentRecurringId_dueDate_1',
                spec: { parentRecurringId: 1, dueDate: 1 },
                options: { 
                    background: true,
                    sparse: true
                }
            }
        ];
        
        const indexResults = [];
        
        for (const index of indexes) {
            try {
                // Check if index already exists
                const existingIndexes = await tasksCollection.indexes();
                const indexExists = existingIndexes.some(existing => existing.name === index.name);
                
                if (indexExists) {
                    logRecurringTaskWarning('migration', `Index ${index.name} already exists, skipping`);
                    indexResults.push({ name: index.name, status: 'skipped', reason: 'already exists' });
                } else {
                    await tasksCollection.createIndex(index.spec, { 
                        ...index.options, 
                        name: index.name 
                    });
                    logRecurringTaskInfo('migration', `Created index: ${index.name}`);
                    indexResults.push({ name: index.name, status: 'created' });
                }
            } catch (indexError) {
                logRecurringTaskError('migration', `Failed to create index ${index.name}`, {
                    error: indexError.message,
                    indexSpec: index.spec
                });
                indexResults.push({ 
                    name: index.name, 
                    status: 'failed', 
                    error: indexError.message 
                });
            }
        }
        
        // Step 3: Validate migration
        logRecurringTaskInfo('migration', 'Step 3: Validating migration');
        
        const totalTasks = await tasksCollection.countDocuments();
        const tasksWithParentRecurringId = await tasksCollection.countDocuments({
            parentRecurringId: { $exists: true }
        });
        
        const validationResult = {
            totalTasks,
            tasksWithParentRecurringId,
            migrationComplete: totalTasks === tasksWithParentRecurringId
        };
        
        if (!validationResult.migrationComplete) {
            throw new Error(`Migration validation failed: ${tasksWithParentRecurringId}/${totalTasks} tasks have parentRecurringId field`);
        }
        
        // Step 4: Record migration in migrations collection
        logRecurringTaskInfo('migration', 'Step 4: Recording migration in database');
        
        const migrationsCollection = db.collection('migrations');
        await migrationsCollection.insertOne({
            ...MIGRATION_CONFIG,
            status: 'completed',
            appliedAt: new Date(),
            duration: Date.now() - startTime,
            results: {
                tasksUpdated: updateResult.modifiedCount,
                indexesCreated: indexResults.filter(r => r.status === 'created').length,
                indexesSkipped: indexResults.filter(r => r.status === 'skipped').length,
                indexesFailed: indexResults.filter(r => r.status === 'failed').length,
                validation: validationResult
            }
        });
        
        const duration = Date.now() - startTime;
        
        const result = {
            success: true,
            migrationId: MIGRATION_CONFIG.id,
            duration: `${duration}ms`,
            summary: {
                tasksUpdated: updateResult.modifiedCount,
                indexesProcessed: indexResults.length,
                indexesCreated: indexResults.filter(r => r.status === 'created').length,
                indexesSkipped: indexResults.filter(r => r.status === 'skipped').length,
                indexesFailed: indexResults.filter(r => r.status === 'failed').length
            },
            validation: validationResult,
            indexResults
        };
        
        logRecurringTaskInfo('migration', `Migration ${MIGRATION_CONFIG.id} completed successfully`, result.summary);
        
        return result;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        logRecurringTaskError('migration', `Migration ${MIGRATION_CONFIG.id} failed`, {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        
        // Record failed migration
        try {
            const migrationsCollection = db.collection('migrations');
            await migrationsCollection.insertOne({
                ...MIGRATION_CONFIG,
                status: 'failed',
                appliedAt: new Date(),
                duration,
                error: error.message
            });
        } catch (recordError) {
            logRecurringTaskError('migration', 'Failed to record migration failure', {
                error: recordError.message
            });
        }
        
        throw error;
    }
}

/**
 * Rollback the migration (backward)
 * @param {Object} db - MongoDB database connection
 * @returns {Promise<Object>} Rollback result
 */
async function down(db) {
    const startTime = Date.now();
    
    try {
        logRecurringTaskWarning('migration', `Starting rollback of migration ${MIGRATION_CONFIG.id}: ${MIGRATION_CONFIG.name}`);
        
        const tasksCollection = db.collection('tasks');
        
        // Step 1: Remove parentRecurringId field from all tasks
        logRecurringTaskInfo('migration', 'Step 1: Removing parentRecurringId field from tasks');
        
        const updateResult = await tasksCollection.updateMany(
            { parentRecurringId: { $exists: true } },
            { $unset: { parentRecurringId: '' } }
        );
        
        logRecurringTaskInfo('migration', `Removed parentRecurringId field from ${updateResult.modifiedCount} tasks`);
        
        // Step 2: Drop created indexes
        logRecurringTaskInfo('migration', 'Step 2: Dropping created indexes');
        
        const indexesToDrop = [
            'parentRecurringId_1',
            'userId_parentRecurringId_1',
            'repeatType_1',
            'userId_repeatType_1',
            'parentRecurringId_dueDate_1'
        ];
        
        const dropResults = [];
        
        for (const indexName of indexesToDrop) {
            try {
                await tasksCollection.dropIndex(indexName);
                logRecurringTaskInfo('migration', `Dropped index: ${indexName}`);
                dropResults.push({ name: indexName, status: 'dropped' });
            } catch (dropError) {
                if (dropError.message.includes('index not found')) {
                    logRecurringTaskWarning('migration', `Index ${indexName} not found, skipping`);
                    dropResults.push({ name: indexName, status: 'not_found' });
                } else {
                    logRecurringTaskError('migration', `Failed to drop index ${indexName}`, {
                        error: dropError.message
                    });
                    dropResults.push({ 
                        name: indexName, 
                        status: 'failed', 
                        error: dropError.message 
                    });
                }
            }
        }
        
        // Step 3: Update migration record
        const migrationsCollection = db.collection('migrations');
        await migrationsCollection.updateOne(
            { id: MIGRATION_CONFIG.id },
            { 
                $set: { 
                    status: 'rolled_back',
                    rolledBackAt: new Date(),
                    rollbackDuration: Date.now() - startTime
                }
            }
        );
        
        const duration = Date.now() - startTime;
        
        const result = {
            success: true,
            migrationId: MIGRATION_CONFIG.id,
            operation: 'rollback',
            duration: `${duration}ms`,
            summary: {
                tasksUpdated: updateResult.modifiedCount,
                indexesDropped: dropResults.filter(r => r.status === 'dropped').length,
                indexesNotFound: dropResults.filter(r => r.status === 'not_found').length,
                indexesFailedToDrop: dropResults.filter(r => r.status === 'failed').length
            },
            dropResults
        };
        
        logRecurringTaskWarning('migration', `Migration ${MIGRATION_CONFIG.id} rolled back successfully`, result.summary);
        
        return result;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        logRecurringTaskError('migration', `Migration ${MIGRATION_CONFIG.id} rollback failed`, {
            error: error.message,
            stack: error.stack,
            duration: `${duration}ms`
        });
        
        throw error;
    }
}

/**
 * Check if migration has been applied
 * @param {Object} db - MongoDB database connection
 * @returns {Promise<boolean>} True if migration has been applied
 */
async function isApplied(db) {
    try {
        const migrationsCollection = db.collection('migrations');
        const migration = await migrationsCollection.findOne({ 
            id: MIGRATION_CONFIG.id,
            status: 'completed'
        });
        
        return !!migration;
    } catch (error) {
        logRecurringTaskError('migration', 'Failed to check migration status', {
            migrationId: MIGRATION_CONFIG.id,
            error: error.message
        });
        return false;
    }
}

module.exports = {
    MIGRATION_CONFIG,
    up,
    down,
    isApplied
};