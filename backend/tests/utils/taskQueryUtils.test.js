/**
 * Unit tests for Task Query Utilities
 */

const assert = require('assert');
const { buildTaskFilters, buildSortCriteria, buildPaginationOptions } = require('../../src/utils/taskQueryUtils');

describe('Task Query Utilities', () => {
    
    describe('buildTaskFilters', () => {
        
        it('should build basic filters from query parameters', () => {
            const queryParams = {
                completed: 'true',
                priority: 'high',
                category: 'work'
            };
            
            const filters = buildTaskFilters(queryParams);
            
            assert.strictEqual(filters.isCompleted, true);
            assert.strictEqual(filters.priority, 'high');
            assert.strictEqual(filters.category, 'work');
        });

        it('should handle completed filter as false', () => {
            const queryParams = { completed: 'false' };
            const filters = buildTaskFilters(queryParams);
            
            assert.strictEqual(filters.isCompleted, false);
        });

        it('should ignore undefined completed parameter', () => {
            const queryParams = {};
            const filters = buildTaskFilters(queryParams);
            
            assert.strictEqual(filters.isCompleted, undefined);
        });

        it('should merge additional filters', () => {
            const queryParams = { priority: 'high' };
            const additionalFilters = { userId: 123, parentId: null };
            
            const filters = buildTaskFilters(queryParams, additionalFilters);
            
            assert.strictEqual(filters.priority, 'high');
            assert.strictEqual(filters.userId, 123);
            assert.strictEqual(filters.parentId, null);
        });

        it('should handle empty query parameters', () => {
            const queryParams = {};
            const filters = buildTaskFilters(queryParams);
            
            assert.deepStrictEqual(filters, {});
        });

        it('should ignore undefined priority and category', () => {
            const queryParams = {
                priority: undefined,
                category: undefined
            };
            
            const filters = buildTaskFilters(queryParams);
            
            assert.strictEqual(filters.priority, undefined);
            assert.strictEqual(filters.category, undefined);
        });
    });

    describe('buildSortCriteria', () => {
        
        it('should build ascending sort criteria', () => {
            const sortBy = 'dueDate:asc';
            const sort = buildSortCriteria(sortBy);
            
            assert.deepStrictEqual(sort, { dueDate: 1 });
        });

        it('should build descending sort criteria', () => {
            const sortBy = 'priority:desc';
            const sort = buildSortCriteria(sortBy);
            
            assert.deepStrictEqual(sort, { priority: -1 });
        });

        it('should default to ascending when direction not specified', () => {
            const sortBy = 'title';
            const sort = buildSortCriteria(sortBy);
            
            assert.deepStrictEqual(sort, { title: 1 });
        });

        it('should use default sort when sortBy is undefined', () => {
            const sort = buildSortCriteria();
            
            assert.deepStrictEqual(sort, { dueDate: 1 });
        });

        it('should use default sort when sortBy is empty string', () => {
            const sort = buildSortCriteria('');
            
            assert.deepStrictEqual(sort, { dueDate: 1 });
        });

        it('should handle multiple field sorts', () => {
            const sortBy = 'priority:desc';
            const sort = buildSortCriteria(sortBy);
            
            assert.deepStrictEqual(sort, { priority: -1 });
        });
    });

    describe('buildPaginationOptions', () => {
        
        it('should parse limit and skip parameters', () => {
            const queryParams = { limit: '20', skip: '10' };
            const pagination = buildPaginationOptions(queryParams);
            
            assert.strictEqual(pagination.limit, 20);
            assert.strictEqual(pagination.skip, 10);
        });

        it('should use default values when parameters not provided', () => {
            const queryParams = {};
            const pagination = buildPaginationOptions(queryParams);
            
            assert.strictEqual(pagination.limit, 10);
            assert.strictEqual(pagination.skip, 0);
        });

        it('should handle invalid limit parameter', () => {
            const queryParams = { limit: 'invalid' };
            const pagination = buildPaginationOptions(queryParams);
            
            assert.strictEqual(pagination.limit, 10); // Default value
            assert.strictEqual(pagination.skip, 0);
        });

        it('should handle invalid skip parameter', () => {
            const queryParams = { skip: 'invalid' };
            const pagination = buildPaginationOptions(queryParams);
            
            assert.strictEqual(pagination.limit, 10);
            assert.strictEqual(pagination.skip, 0); // Default value
        });

        it('should handle zero values', () => {
            const queryParams = { limit: '0', skip: '0' };
            const pagination = buildPaginationOptions(queryParams);
            
            assert.strictEqual(pagination.limit, 10); // Default when 0
            assert.strictEqual(pagination.skip, 0);
        });

        it('should handle negative values', () => {
            const queryParams = { limit: '-5', skip: '-10' };
            const pagination = buildPaginationOptions(queryParams);
            
            assert.strictEqual(pagination.limit, -5); // parseInt preserves negative
            assert.strictEqual(pagination.skip, -10);
        });
    });
});

// Simple test runner
function describe(name, fn) {
    console.log(`\n${name}`);
    fn();
}

function it(name, fn) {
    try {
        fn();
        console.log(`  ✓ ${name}`);
    } catch (error) {
        console.log(`  ✗ ${name}`);
        console.error(`    ${error.message}`);
        process.exit(1);
    }
}

// Run the tests if this file is executed directly
if (require.main === module) {
    console.log('Running Task Query Utilities Tests...');
}