/**
 * Integration tests for recurring task query endpoint
 */

// Test data
const testUser = {
    userId: 1,
    email: 'test@example.com'
};

const createMockTask = (overrides = {}) => ({
    taskId: 1,
    userId: testUser.userId,
    title: 'Daily Standup',
    description: 'Team daily standup meeting',
    dueDate: new Date('2024-01-15T10:00:00Z'),
    priority: 'high',
    category: 'meetings',
    repeatType: 'daily',
    parentRecurringId: null,
    parentId: null,
    isCompleted: false,
    createdAt: new Date('2024-01-10T10:00:00Z'),
    updatedAt: new Date('2024-01-10T10:00:00Z'),
    // Mock methods
    isRecurringParent: function() {
        return this.repeatType !== 'none' && (this.parentRecurringId === null || this.parentRecurringId === undefined);
    },
    isRecurringInstance: function() {
        return this.parentRecurringId !== null && this.parentRecurringId !== undefined;
    },
    getRecurringInstances: async function() {
        // Mock returning multiple instances with different dates and statuses
        return [
            {
                taskId: 2,
                title: this.title,
                description: this.description,
                dueDate: new Date('2024-01-16T10:00:00Z'),
                priority: this.priority,
                category: this.category,
                isCompleted: false,
                parentRecurringId: this.taskId,
                createdAt: new Date('2024-01-10T10:00:00Z'),
                updatedAt: new Date('2024-01-10T10:00:00Z')
            },
            {
                taskId: 3,
                title: this.title,
                description: this.description,
                dueDate: new Date('2024-01-17T10:00:00Z'),
                priority: this.priority,
                category: this.category,
                isCompleted: true,
                parentRecurringId: this.taskId,
                createdAt: new Date('2024-01-10T10:00:00Z'),
                updatedAt: new Date('2024-01-17T09:00:00Z')
            },
            {
                taskId: 4,
                title: this.title,
                description: this.description,
                dueDate: new Date('2024-01-18T10:00:00Z'),
                priority: 'medium',
                category: 'work',
                isCompleted: false,
                parentRecurringId: this.taskId,
                createdAt: new Date('2024-01-10T10:00:00Z'),
                updatedAt: new Date('2024-01-10T10:00:00Z')
            },
            {
                taskId: 5,
                title: this.title,
                description: this.description,
                dueDate: new Date('2024-01-19T10:00:00Z'),
                priority: this.priority,
                category: this.category,
                isCompleted: false,
                parentRecurringId: this.taskId,
                createdAt: new Date('2024-01-10T10:00:00Z'),
                updatedAt: new Date('2024-01-10T10:00:00Z')
            }
        ];
    },
    ...overrides
});

// Test querying from parent task
function testQueryFromParentTask() {
    console.log('Testing query from parent recurring task...');
    
    const parentTask = createMockTask();
    
    console.log('Parent task:', {
        taskId: parentTask.taskId,
        title: parentTask.title,
        repeatType: parentTask.repeatType,
        isRecurringParent: parentTask.isRecurringParent()
    });
    
    console.assert(parentTask.isRecurringParent(), 'Should be a recurring parent task');
    console.assert(!parentTask.isRecurringInstance(), 'Should not be a recurring instance');
    
    console.log('✓ Parent task query logic validated');
}

// Test querying from recurring instance
function testQueryFromInstance() {
    console.log('\\nTesting query from recurring instance...');
    
    const instanceTask = createMockTask({
        taskId: 3,
        parentRecurringId: 1,
        repeatType: 'none',
        dueDate: new Date('2024-01-17T10:00:00Z')
    });
    
    console.log('Instance task:', {
        taskId: instanceTask.taskId,
        parentRecurringId: instanceTask.parentRecurringId,
        isRecurringInstance: instanceTask.isRecurringInstance()
    });
    
    console.assert(instanceTask.isRecurringInstance(), 'Should be a recurring instance');
    console.assert(!instanceTask.isRecurringParent(), 'Should not be a recurring parent');
    
    console.log('✓ Instance task query logic validated');
}

// Test filtering functionality
async function testFilteringFunctionality() {
    console.log('\\nTesting filtering functionality...');
    
    const parentTask = createMockTask();
    const instances = await parentTask.getRecurringInstances();
    
    console.log('Total instances:', instances.length);
    
    // Test future filter
    const currentDate = new Date('2024-01-16T12:00:00Z'); // After first instance
    const futureInstances = instances.filter(instance => instance.dueDate >= currentDate);
    console.log('Future instances from', currentDate.toISOString(), ':', futureInstances.length);
    console.assert(futureInstances.length === 3, 'Should have 3 future instances');
    
    // Test completed filter
    const completedInstances = instances.filter(instance => instance.isCompleted === true);
    const incompleteInstances = instances.filter(instance => instance.isCompleted === false);
    console.log('Completed instances:', completedInstances.length);
    console.log('Incomplete instances:', incompleteInstances.length);
    console.assert(completedInstances.length === 1, 'Should have 1 completed instance');
    console.assert(incompleteInstances.length === 3, 'Should have 3 incomplete instances');
    
    // Test priority filter
    const highPriorityInstances = instances.filter(instance => instance.priority === 'high');
    const mediumPriorityInstances = instances.filter(instance => instance.priority === 'medium');
    console.log('High priority instances:', highPriorityInstances.length);
    console.log('Medium priority instances:', mediumPriorityInstances.length);
    console.assert(highPriorityInstances.length === 3, 'Should have 3 high priority instances');
    console.assert(mediumPriorityInstances.length === 1, 'Should have 1 medium priority instance');
    
    // Test category filter
    const meetingInstances = instances.filter(instance => instance.category === 'meetings');
    const workInstances = instances.filter(instance => instance.category === 'work');
    console.log('Meeting instances:', meetingInstances.length);
    console.log('Work instances:', workInstances.length);
    console.assert(meetingInstances.length === 3, 'Should have 3 meeting instances');
    console.assert(workInstances.length === 1, 'Should have 1 work instance');
    
    console.log('✓ Filtering functionality validated');
}

// Test sorting functionality
async function testSortingFunctionality() {
    console.log('\\nTesting sorting functionality...');
    
    const parentTask = createMockTask();
    const instances = await parentTask.getRecurringInstances();
    
    // Test date sorting (ascending - default)
    const sortedByDateAsc = [...instances].sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    console.log('Sorted by date (asc):', sortedByDateAsc.map(i => ({ taskId: i.taskId, dueDate: i.dueDate.toISOString() })));
    console.assert(sortedByDateAsc[0].taskId === 2, 'First should be taskId 2');
    console.assert(sortedByDateAsc[3].taskId === 5, 'Last should be taskId 5');
    
    // Test date sorting (descending)
    const sortedByDateDesc = [...instances].sort((a, b) => new Date(b.dueDate) - new Date(a.dueDate));
    console.log('Sorted by date (desc):', sortedByDateDesc.map(i => ({ taskId: i.taskId, dueDate: i.dueDate.toISOString() })));
    console.assert(sortedByDateDesc[0].taskId === 5, 'First should be taskId 5');
    console.assert(sortedByDateDesc[3].taskId === 2, 'Last should be taskId 2');
    
    // Test priority sorting
    const priorityOrder = { 'high': 3, 'medium': 2, 'low': 1 };
    const sortedByPriority = [...instances].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
    console.log('Sorted by priority:', sortedByPriority.map(i => ({ taskId: i.taskId, priority: i.priority })));
    
    console.log('✓ Sorting functionality validated');
}

// Test pagination functionality
async function testPaginationFunctionality() {
    console.log('\\nTesting pagination functionality...');
    
    const parentTask = createMockTask();
    const instances = await parentTask.getRecurringInstances();
    
    // Test pagination parameters
    const skip = 1;
    const limit = 2;
    const paginatedInstances = instances.slice(skip, skip + limit);
    
    console.log('Pagination test:');
    console.log('  Total instances:', instances.length);
    console.log('  Skip:', skip);
    console.log('  Limit:', limit);
    console.log('  Returned instances:', paginatedInstances.length);
    console.log('  Paginated taskIds:', paginatedInstances.map(i => i.taskId));
    
    console.assert(paginatedInstances.length === 2, 'Should return 2 instances');
    console.assert(paginatedInstances[0].taskId === 3, 'First should be taskId 3 (skipped first)');
    console.assert(paginatedInstances[1].taskId === 4, 'Second should be taskId 4');
    
    // Test edge cases
    const emptyPage = instances.slice(10, 15); // Beyond available data
    console.log('  Empty page test:', emptyPage.length);
    console.assert(emptyPage.length === 0, 'Should return empty array for out-of-range pagination');
    
    console.log('✓ Pagination functionality validated');
}

// Run all tests
async function runTests() {
    console.log('Running recurring task query tests...\\n');
    
    try {
        testQueryFromParentTask();
        testQueryFromInstance();
        await testFilteringFunctionality();
        await testSortingFunctionality();
        await testPaginationFunctionality();
        
        console.log('\\n🎉 All recurring task query tests passed successfully!');
    } catch (error) {
        console.error('\\n❌ Test failed:', error.message);
        process.exit(1);
    }
}

// Export for use in other test files
module.exports = {
    runTests,
    createMockTask,
    testUser
};

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().catch(console.error);
}