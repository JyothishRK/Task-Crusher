#!/usr/bin/env node

/**
 * Migration CLI Script
 * 
 * Command-line interface for running database migrations
 * 
 * Usage:
 *   node scripts/runMigrations.js migrate [--dry-run] [--target=migration_id]
 *   node scripts/runMigrations.js rollback [--steps=1] [--target=migration_id]
 *   node scripts/runMigrations.js status
 */

const mongoose = require('mongoose');
const MigrationRunner = require('../src/utils/migrationRunner');
const { logRecurringTaskInfo, logRecurringTaskError } = require('../src/utils/logger');

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];
const options = {};

// Parse options
args.slice(1).forEach(arg => {
    if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        if (value) {
            options[key] = value;
        } else {
            options[key] = true;
        }
    }
});

/**
 * Connect to MongoDB
 */
async function connectToDatabase() {
    try {
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskcrushers';
        
        logRecurringTaskInfo('migration_cli', 'Connecting to MongoDB', {
            uri: mongoUri.replace(/\/\/.*@/, '//***:***@') // Hide credentials in logs
        });
        
        await mongoose.connect(mongoUri);
        
        logRecurringTaskInfo('migration_cli', 'Connected to MongoDB successfully');
        
    } catch (error) {
        logRecurringTaskError('migration_cli', 'Failed to connect to MongoDB', {
            error: error.message
        });
        throw error;
    }
}

/**
 * Disconnect from MongoDB
 */
async function disconnectFromDatabase() {
    try {
        await mongoose.disconnect();
        logRecurringTaskInfo('migration_cli', 'Disconnected from MongoDB');
    } catch (error) {
        logRecurringTaskError('migration_cli', 'Error disconnecting from MongoDB', {
            error: error.message
        });
    }
}

/**
 * Run migrations command
 */
async function runMigrateCommand() {
    try {
        const migrationRunner = new MigrationRunner();
        
        const migrationOptions = {
            dryRun: options['dry-run'] || false,
            targetMigration: options.target || null,
            continueOnError: options['continue-on-error'] || false
        };
        
        logRecurringTaskInfo('migration_cli', 'Starting migration command', migrationOptions);
        
        const result = await migrationRunner.runMigrations(migrationOptions);
        
        console.log('\\n' + '='.repeat(80));
        console.log('📊 MIGRATION RESULTS');
        console.log('='.repeat(80));
        
        console.log(`\\n📈 Summary:`);
        console.log(`   Total Migrations: ${result.summary.totalMigrations}`);
        console.log(`   Migrations Run: ${result.summary.migrationsRun}`);
        console.log(`   Migrations Skipped: ${result.summary.migrationsSkipped}`);
        console.log(`   Migrations Failed: ${result.summary.migrationsFailed}`);
        console.log(`   Duration: ${result.summary.duration}`);
        console.log(`   Dry Run: ${result.summary.dryRun ? 'Yes' : 'No'}`);
        
        console.log(`\\n📋 Detailed Results:`);
        result.results.forEach(migration => {
            const status = migration.status === 'completed' ? '✅' : 
                          migration.status === 'skipped' ? '⏭️' : 
                          migration.status === 'dry_run' ? '🔍' : '❌';
            console.log(`   ${status} ${migration.migrationId}: ${migration.name}`);
            if (migration.reason) {
                console.log(`      Reason: ${migration.reason}`);
            }
            if (migration.error) {
                console.log(`      Error: ${migration.error}`);
            }
        });
        
        if (result.summary.success) {
            console.log(`\\n🎉 All migrations completed successfully!`);
        } else {
            console.log(`\\n⚠️  Some migrations failed. Please review the errors above.`);
            process.exit(1);
        }
        
    } catch (error) {
        logRecurringTaskError('migration_cli', 'Migration command failed', {
            error: error.message,
            stack: error.stack
        });
        console.error(`\\n❌ Migration failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Run rollback command
 */
async function runRollbackCommand() {
    try {
        const migrationRunner = new MigrationRunner();
        
        const rollbackOptions = {
            steps: parseInt(options.steps) || 1,
            targetMigration: options.target || null
        };
        
        logRecurringTaskInfo('migration_cli', 'Starting rollback command', rollbackOptions);
        
        const result = await migrationRunner.rollbackMigrations(rollbackOptions);
        
        console.log('\\n' + '='.repeat(80));
        console.log('📊 ROLLBACK RESULTS');
        console.log('='.repeat(80));
        
        console.log(`\\n📈 Summary:`);
        console.log(`   Migrations Rolled Back: ${result.summary.migrationsRolledBack}`);
        console.log(`   Rollbacks Failed: ${result.summary.migrationsFailed}`);
        console.log(`   Duration: ${result.summary.duration}`);
        
        console.log(`\\n📋 Detailed Results:`);
        result.results.forEach(migration => {
            const status = migration.status === 'rolled_back' ? '↩️' : 
                          migration.status === 'skipped' ? '⏭️' : '❌';
            console.log(`   ${status} ${migration.migrationId}: ${migration.name || 'Unknown'}`);
            if (migration.reason) {
                console.log(`      Reason: ${migration.reason}`);
            }
            if (migration.error) {
                console.log(`      Error: ${migration.error}`);
            }
        });
        
        if (result.summary.success) {
            console.log(`\\n🎉 All rollbacks completed successfully!`);
        } else {
            console.log(`\\n⚠️  Some rollbacks failed. Please review the errors above.`);
            process.exit(1);
        }
        
    } catch (error) {
        logRecurringTaskError('migration_cli', 'Rollback command failed', {
            error: error.message,
            stack: error.stack
        });
        console.error(`\\n❌ Rollback failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Run status command
 */
async function runStatusCommand() {
    try {
        const migrationRunner = new MigrationRunner();
        
        logRecurringTaskInfo('migration_cli', 'Getting migration status');
        
        const status = await migrationRunner.getStatus();
        
        console.log('\\n' + '='.repeat(80));
        console.log('📊 MIGRATION STATUS');
        console.log('='.repeat(80));
        
        console.log(`\\n📈 Summary:`);
        console.log(`   Total Migrations: ${status.totalMigrations}`);
        console.log(`   Applied Migrations: ${status.appliedMigrations}`);
        console.log(`   Pending Migrations: ${status.pendingMigrations}`);
        
        console.log(`\\n📋 Migration Details:`);
        status.migrations.forEach(migration => {
            const status = migration.applied ? '✅ Applied' : '⏳ Pending';
            console.log(`   ${status} - ${migration.id}: ${migration.name}`);
            console.log(`      Description: ${migration.description}`);
            console.log(`      Version: ${migration.version}`);
        });
        
        if (status.pendingMigrations > 0) {
            console.log(`\\n⚠️  You have ${status.pendingMigrations} pending migration(s).`);
            console.log(`   Run 'node scripts/runMigrations.js migrate' to apply them.`);
        } else {
            console.log(`\\n🎉 All migrations are up to date!`);
        }
        
    } catch (error) {
        logRecurringTaskError('migration_cli', 'Status command failed', {
            error: error.message,
            stack: error.stack
        });
        console.error(`\\n❌ Status check failed: ${error.message}`);
        process.exit(1);
    }
}

/**
 * Show help message
 */
function showHelp() {
    console.log(`
📚 Migration CLI Help

Usage:
  node scripts/runMigrations.js <command> [options]

Commands:
  migrate    Run pending migrations
  rollback   Rollback applied migrations
  status     Show migration status
  help       Show this help message

Options for 'migrate':
  --dry-run              Show what would be migrated without applying changes
  --target=<migration>   Run migrations up to the specified migration ID
  --continue-on-error    Continue running migrations even if one fails

Options for 'rollback':
  --steps=<number>       Number of migrations to rollback (default: 1)
  --target=<migration>   Rollback to the specified migration ID

Examples:
  node scripts/runMigrations.js migrate
  node scripts/runMigrations.js migrate --dry-run
  node scripts/runMigrations.js migrate --target=001
  node scripts/runMigrations.js rollback --steps=2
  node scripts/runMigrations.js status

Environment Variables:
  MONGODB_URI           MongoDB connection string (default: mongodb://localhost:27017/taskcrushers)
`);
}

/**
 * Main function
 */
async function main() {
    try {
        if (!command || command === 'help') {
            showHelp();
            return;
        }
        
        // Connect to database for all commands except help
        await connectToDatabase();
        
        switch (command) {
            case 'migrate':
                await runMigrateCommand();
                break;
                
            case 'rollback':
                await runRollbackCommand();
                break;
                
            case 'status':
                await runStatusCommand();
                break;
                
            default:
                console.error(`\\n❌ Unknown command: ${command}`);
                showHelp();
                process.exit(1);
        }
        
    } catch (error) {
        console.error(`\\n💥 CLI failed: ${error.message}`);
        process.exit(1);
    } finally {
        await disconnectFromDatabase();
    }
}

// Handle process termination
process.on('SIGINT', async () => {
    console.log('\\n\\n⏹️  Migration interrupted by user');
    await disconnectFromDatabase();
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.log('\\n\\n⏹️  Migration terminated');
    await disconnectFromDatabase();
    process.exit(0);
});

// Run the CLI
main().catch(error => {
    console.error('\\n💥 Unhandled error:', error.message);
    process.exit(1);
});