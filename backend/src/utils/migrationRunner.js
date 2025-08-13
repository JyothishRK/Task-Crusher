/**
 * Database Migration Runner
 * 
 * Utility for running database migrations in the correct order
 * and managing migration state.
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const { logRecurringTaskInfo, logRecurringTaskError, logRecurringTaskWarning } = require('./logger');

/**
 * Migration Runner Class
 */
class MigrationRunner {
    constructor(migrationsDir = path.join(__dirname, '../migrations')) {
        this.migrationsDir = migrationsDir;
        this.migrations = [];
    }
    
    /**
     * Load all migration files from the migrations directory
     */
    async loadMigrations() {
        try {
            logRecurringTaskInfo('migration_runner', 'Loading migration files', {
                directory: this.migrationsDir
            });
            
            if (!fs.existsSync(this.migrationsDir)) {
                logRecurringTaskWarning('migration_runner', 'Migrations directory does not exist', {
                    directory: this.migrationsDir
                });
                return;
            }
            
            const files = fs.readdirSync(this.migrationsDir)
                .filter(file => file.endsWith('.js'))
                .sort(); // Ensure migrations run in order
            
            this.migrations = [];
            
            for (const file of files) {
                const migrationPath = path.join(this.migrationsDir, file);
                const migration = require(migrationPath);
                
                if (!migration.MIGRATION_CONFIG || !migration.up || !migration.down) {
                    logRecurringTaskWarning('migration_runner', `Invalid migration file: ${file}`, {
                        requiredExports: ['MIGRATION_CONFIG', 'up', 'down']
                    });
                    continue;
                }
                
                this.migrations.push({
                    file,
                    ...migration
                });
            }
            
            logRecurringTaskInfo('migration_runner', `Loaded ${this.migrations.length} migration(s)`, {
                migrations: this.migrations.map(m => ({
                    id: m.MIGRATION_CONFIG.id,
                    name: m.MIGRATION_CONFIG.name
                }))
            });
            
        } catch (error) {
            logRecurringTaskError('migration_runner', 'Failed to load migrations', {
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    
    /**
     * Run all pending migrations
     * @param {Object} options - Migration options
     * @returns {Promise<Object>} Migration results
     */
    async runMigrations(options = {}) {
        const { dryRun = false, targetMigration = null } = options;
        const startTime = Date.now();
        
        try {
            logRecurringTaskInfo('migration_runner', 'Starting migration run', {
                dryRun,
                targetMigration,
                totalMigrations: this.migrations.length
            });
            
            if (this.migrations.length === 0) {
                await this.loadMigrations();
            }
            
            const db = mongoose.connection.db;
            if (!db) {
                throw new Error('Database connection not available');
            }
            
            const results = [];
            let migrationsRun = 0;
            
            for (const migration of this.migrations) {
                const migrationId = migration.MIGRATION_CONFIG.id;
                
                // Check if we should stop at target migration
                if (targetMigration && migrationId === targetMigration) {
                    logRecurringTaskInfo('migration_runner', `Reached target migration: ${migrationId}`);
                    break;
                }
                
                // Check if migration has already been applied
                const isApplied = await migration.isApplied(db);
                
                if (isApplied) {
                    logRecurringTaskInfo('migration_runner', `Migration ${migrationId} already applied, skipping`);
                    results.push({
                        migrationId,
                        name: migration.MIGRATION_CONFIG.name,
                        status: 'skipped',
                        reason: 'already applied'
                    });
                    continue;
                }
                
                if (dryRun) {
                    logRecurringTaskInfo('migration_runner', `DRY RUN: Would run migration ${migrationId}`);
                    results.push({
                        migrationId,
                        name: migration.MIGRATION_CONFIG.name,
                        status: 'dry_run',
                        reason: 'dry run mode'
                    });
                    continue;
                }
                
                // Run the migration
                logRecurringTaskInfo('migration_runner', `Running migration ${migrationId}: ${migration.MIGRATION_CONFIG.name}`);
                
                try {
                    const migrationResult = await migration.up(db);
                    migrationsRun++;
                    
                    results.push({
                        migrationId,
                        name: migration.MIGRATION_CONFIG.name,
                        status: 'completed',
                        result: migrationResult
                    });
                    
                    logRecurringTaskInfo('migration_runner', `Migration ${migrationId} completed successfully`);
                    
                } catch (migrationError) {
                    logRecurringTaskError('migration_runner', `Migration ${migrationId} failed`, {
                        error: migrationError.message,
                        stack: migrationError.stack
                    });
                    
                    results.push({
                        migrationId,
                        name: migration.MIGRATION_CONFIG.name,
                        status: 'failed',
                        error: migrationError.message
                    });
                    
                    // Stop on first failure unless configured otherwise
                    if (!options.continueOnError) {
                        break;
                    }
                }
            }
            
            const duration = Date.now() - startTime;
            
            const summary = {
                success: results.every(r => r.status !== 'failed'),
                totalMigrations: this.migrations.length,
                migrationsRun,
                migrationsSkipped: results.filter(r => r.status === 'skipped').length,
                migrationsFailed: results.filter(r => r.status === 'failed').length,
                duration: `${duration}ms`,
                dryRun
            };
            
            logRecurringTaskInfo('migration_runner', 'Migration run completed', summary);
            
            return {
                summary,
                results
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            logRecurringTaskError('migration_runner', 'Migration run failed', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`
            });
            
            throw error;
        }
    }
    
    /**
     * Rollback migrations
     * @param {Object} options - Rollback options
     * @returns {Promise<Object>} Rollback results
     */
    async rollbackMigrations(options = {}) {
        const { targetMigration = null, steps = 1 } = options;
        const startTime = Date.now();
        
        try {
            logRecurringTaskWarning('migration_runner', 'Starting migration rollback', {
                targetMigration,
                steps
            });
            
            if (this.migrations.length === 0) {
                await this.loadMigrations();
            }
            
            const db = mongoose.connection.db;
            if (!db) {
                throw new Error('Database connection not available');
            }
            
            // Get applied migrations in reverse order
            const migrationsCollection = db.collection('migrations');
            const appliedMigrations = await migrationsCollection
                .find({ status: 'completed' })
                .sort({ appliedAt: -1 })
                .toArray();
            
            const results = [];
            let migrationsRolledBack = 0;
            
            for (const appliedMigration of appliedMigrations) {
                if (migrationsRolledBack >= steps && !targetMigration) {
                    break;
                }
                
                if (targetMigration && appliedMigration.id === targetMigration) {
                    break;
                }
                
                // Find the migration definition
                const migration = this.migrations.find(m => m.MIGRATION_CONFIG.id === appliedMigration.id);
                
                if (!migration) {
                    logRecurringTaskWarning('migration_runner', `Migration definition not found for ${appliedMigration.id}`);
                    results.push({
                        migrationId: appliedMigration.id,
                        status: 'skipped',
                        reason: 'definition not found'
                    });
                    continue;
                }
                
                // Run the rollback
                logRecurringTaskWarning('migration_runner', `Rolling back migration ${appliedMigration.id}`);
                
                try {
                    const rollbackResult = await migration.down(db);
                    migrationsRolledBack++;
                    
                    results.push({
                        migrationId: appliedMigration.id,
                        name: migration.MIGRATION_CONFIG.name,
                        status: 'rolled_back',
                        result: rollbackResult
                    });
                    
                    logRecurringTaskWarning('migration_runner', `Migration ${appliedMigration.id} rolled back successfully`);
                    
                } catch (rollbackError) {
                    logRecurringTaskError('migration_runner', `Migration ${appliedMigration.id} rollback failed`, {
                        error: rollbackError.message,
                        stack: rollbackError.stack
                    });
                    
                    results.push({
                        migrationId: appliedMigration.id,
                        name: migration.MIGRATION_CONFIG.name,
                        status: 'rollback_failed',
                        error: rollbackError.message
                    });
                    
                    break; // Stop on first rollback failure
                }
            }
            
            const duration = Date.now() - startTime;
            
            const summary = {
                success: results.every(r => r.status !== 'rollback_failed'),
                migrationsRolledBack,
                migrationsFailed: results.filter(r => r.status === 'rollback_failed').length,
                duration: `${duration}ms`
            };
            
            logRecurringTaskWarning('migration_runner', 'Migration rollback completed', summary);
            
            return {
                summary,
                results
            };
            
        } catch (error) {
            const duration = Date.now() - startTime;
            
            logRecurringTaskError('migration_runner', 'Migration rollback failed', {
                error: error.message,
                stack: error.stack,
                duration: `${duration}ms`
            });
            
            throw error;
        }
    }
    
    /**
     * Get migration status
     * @returns {Promise<Object>} Migration status
     */
    async getStatus() {
        try {
            if (this.migrations.length === 0) {
                await this.loadMigrations();
            }
            
            const db = mongoose.connection.db;
            if (!db) {
                throw new Error('Database connection not available');
            }
            
            const status = [];
            
            for (const migration of this.migrations) {
                const isApplied = await migration.isApplied(db);
                
                status.push({
                    id: migration.MIGRATION_CONFIG.id,
                    name: migration.MIGRATION_CONFIG.name,
                    description: migration.MIGRATION_CONFIG.description,
                    version: migration.MIGRATION_CONFIG.version,
                    applied: isApplied
                });
            }
            
            const appliedCount = status.filter(s => s.applied).length;
            const pendingCount = status.filter(s => !s.applied).length;
            
            return {
                totalMigrations: status.length,
                appliedMigrations: appliedCount,
                pendingMigrations: pendingCount,
                migrations: status
            };
            
        } catch (error) {
            logRecurringTaskError('migration_runner', 'Failed to get migration status', {
                error: error.message,
                stack: error.stack
            });
            
            throw error;
        }
    }
}

module.exports = MigrationRunner;