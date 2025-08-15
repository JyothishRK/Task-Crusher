# Task Management Examples

This guide provides comprehensive examples for common task management workflows using the Task Crusher API. These examples demonstrate real-world usage patterns and best practices.

## Overview

This guide covers:
- Complete CRUD operations for tasks
- Bulk task operations
- Advanced filtering and searching
- Task lifecycle management
- Error handling patterns
- Performance optimization techniques

## Basic Task Operations

### Creating Tasks

#### Simple Task Creation

```javascript
async function createTask(taskData) {
  try {
    const response = await fetch('/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(taskData)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create task');
    }

    const newTask = await response.json();
    console.log('Task created successfully:', newTask);
    return newTask;
  } catch (error) {
    console.error('Error creating task:', error);
    throw error;
  }
}

// Usage examples
const workTask = await createTask({
  title: 'Complete quarterly report',
  description: 'Compile Q4 financial data and analysis',
  dueDate: '2024-01-25T17:00:00.000Z',
  priority: 'high',
  category: 'work'
});

const personalTask = await createTask({
  title: 'Grocery shopping',
  description: 'Buy ingredients for weekend dinner party',
  dueDate: '2024-01-20T18:00:00.000Z',
  priority: 'medium',
  category: 'personal'
});
```

#### Batch Task Creation

```javascript
async function createMultipleTasks(tasksArray) {
  const results = [];
  const errors = [];

  for (const taskData of tasksArray) {
    try {
      const task = await createTask(taskData);
      results.push(task);
    } catch (error) {
      errors.push({ taskData, error: error.message });
    }
  }

  return { 
    successful: results, 
    failed: errors,
    summary: `${results.length} created, ${errors.length} failed`
  };
}

// Usage
const weeklyTasks = [
  {
    title: 'Monday team standup',
    dueDate: '2024-01-22T09:00:00.000Z',
    priority: 'medium',
    category: 'work',
    repeatType: 'weekly'
  },
  {
    title: 'Gym workout',
    dueDate: '2024-01-22T18:00:00.000Z',
    priority: 'low',
    category: 'health',
    repeatType: 'daily'
  },
  {
    title: 'Review project proposals',
    dueDate: '2024-01-23T14:00:00.000Z',
    priority: 'high',
    category: 'work'
  }
];

const batchResult = await createMultipleTasks(weeklyTasks);
console.log(batchResult.summary);
```

### Reading Tasks

#### Get All Tasks with Pagination

```javascript
async function getAllTasks(options = {}) {
  const {
    limit = 20,
    skip = 0,
    completed,
    priority,
    category,
    sortBy = 'dueDate:asc'
  } = options;

  const params = new URLSearchParams({
    limit: limit.toString(),
    skip: skip.toString(),
    sortBy
  });

  if (completed !== undefined) params.append('completed', completed.toString());
  if (priority) params.append('priority', priority);
  if (category) params.append('category', category);

  try {
    const response = await fetch(`/tasks?${params}`, {
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch tasks');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
}

// Usage examples
const allTasks = await getAllTasks();
const incompleteTasks = await getAllTasks({ completed: false });
const highPriorityWork = await getAllTasks({ 
  priority: 'high', 
  category: 'work',
  completed: false 
});
```

#### Paginated Task Loading

```javascript
class TaskPaginator {
  constructor(pageSize = 20) {
    this.pageSize = pageSize;
    this.currentPage = 0;
    this.allTasks = [];
    this.hasMore = true;
  }

  async loadNextPage(filters = {}) {
    if (!this.hasMore) return [];

    const tasks = await getAllTasks({
      ...filters,
      limit: this.pageSize,
      skip: this.currentPage * this.pageSize
    });

    if (tasks.length < this.pageSize) {
      this.hasMore = false;
    }

    this.allTasks.push(...tasks);
    this.currentPage++;

    return tasks;
  }

  async loadAllTasks(filters = {}) {
    this.reset();
    
    while (this.hasMore) {
      await this.loadNextPage(filters);
    }

    return this.allTasks;
  }

  reset() {
    this.currentPage = 0;
    this.allTasks = [];
    this.hasMore = true;
  }
}

// Usage
const paginator = new TaskPaginator(50);
const firstPage = await paginator.loadNextPage({ completed: false });
const secondPage = await paginator.loadNextPage({ completed: false });

// Or load all at once
const allIncompleteTasks = await paginator.loadAllTasks({ completed: false });
```

### Updating Tasks

#### Single Task Update

```javascript
async function updateTask(taskId, updates) {
  try {
    const response = await fetch(`/tasks/${taskId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(updates)
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update task');
    }

    const updatedTask = await response.json();
    console.log('Task updated successfully:', updatedTask);
    return updatedTask;
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
}

// Usage examples
const completedTask = await updateTask('507f1f77bcf86cd799439011', {
  isCompleted: true
});

const rescheduledTask = await updateTask('507f1f77bcf86cd799439012', {
  dueDate: '2024-01-26T10:00:00.000Z',
  priority: 'high'
});
```

#### Bulk Task Updates

```javascript
async function bulkUpdateTasks(updates) {
  const results = [];
  const errors = [];

  for (const { taskId, data } of updates) {
    try {
      const updatedTask = await updateTask(taskId, data);
      results.push(updatedTask);
    } catch (error) {
      errors.push({ taskId, error: error.message });
    }
  }

  return { successful: results, failed: errors };
}

// Mark multiple tasks as completed
const completionUpdates = [
  { taskId: '507f1f77bcf86cd799439011', data: { isCompleted: true } },
  { taskId: '507f1f77bcf86cd799439012', data: { isCompleted: true } },
  { taskId: '507f1f77bcf86cd799439013', data: { isCompleted: true } }
];

const bulkResult = await bulkUpdateTasks(completionUpdates);
console.log(`${bulkResult.successful.length} tasks completed successfully`);
```

### Deleting Tasks

#### Single Task Deletion

```javascript
async function deleteTask(taskId) {
  try {
    const response = await fetch(`/tasks/${taskId}`, {
      method: 'DELETE',
      credentials: 'include'
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete task');
    }

    const deletedTask = await response.json();
    console.log('Task deleted successfully:', deletedTask);
    return deletedTask;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
}

// Usage
const deletedTask = await deleteTask('507f1f77bcf86cd799439011');
```

#### Bulk Task Deletion

```javascript
async function bulkDeleteTasks(taskIds) {
  const results = [];
  const errors = [];

  for (const taskId of taskIds) {
    try {
      const deletedTask = await deleteTask(taskId);
      results.push(deletedTask);
    } catch (error) {
      errors.push({ taskId, error: error.message });
    }
  }

  return { successful: results, failed: errors };
}

// Delete completed tasks older than 30 days
async function cleanupOldCompletedTasks() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const allTasks = await getAllTasks({ completed: true });
  const oldTasks = allTasks.filter(task => 
    new Date(task.updatedAt) < thirtyDaysAgo
  );

  if (oldTasks.length === 0) {
    console.log('No old completed tasks to clean up');
    return;
  }

  const taskIds = oldTasks.map(task => task._id);
  const result = await bulkDeleteTasks(taskIds);
  
  console.log(`Cleaned up ${result.successful.length} old completed tasks`);
  return result;
}
```

## Advanced Task Management Workflows

### Task Lifecycle Management

```javascript
class TaskLifecycleManager {
  constructor() {
    this.statusTransitions = {
      'created': ['in_progress', 'cancelled'],
      'in_progress': ['completed', 'blocked', 'cancelled'],
      'blocked': ['in_progress', 'cancelled'],
      'completed': ['archived'],
      'cancelled': ['created'],
      'archived': []
    };
  }

  async createTaskWithWorkflow(taskData) {
    const task = await createTask({
      ...taskData,
      status: 'created',
      createdAt: new Date().toISOString()
    });

    await this.logStatusChange(task._id, null, 'created');
    return task;
  }

  async transitionTaskStatus(taskId, newStatus) {
    const task = await this.getTask(taskId);
    const currentStatus = task.status || 'created';

    if (!this.canTransition(currentStatus, newStatus)) {
      throw new Error(`Cannot transition from ${currentStatus} to ${newStatus}`);
    }

    const updatedTask = await updateTask(taskId, {
      status: newStatus,
      statusUpdatedAt: new Date().toISOString()
    });

    await this.logStatusChange(taskId, currentStatus, newStatus);
    return updatedTask;
  }

  canTransition(fromStatus, toStatus) {
    return this.statusTransitions[fromStatus]?.includes(toStatus) || false;
  }

  async getTask(taskId) {
    const response = await fetch(`/tasks/${taskId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Task not found');
    }
    
    return await response.json();
  }

  async logStatusChange(taskId, fromStatus, toStatus) {
    console.log(`Task ${taskId}: ${fromStatus || 'none'} → ${toStatus}`);
    // In a real app, you might log this to an audit trail
  }
}

// Usage
const lifecycle = new TaskLifecycleManager();

const newTask = await lifecycle.createTaskWithWorkflow({
  title: 'Implement new feature',
  description: 'Add user authentication to the app',
  dueDate: '2024-01-30T17:00:00.000Z',
  priority: 'high',
  category: 'development'
});

// Progress the task through its lifecycle
await lifecycle.transitionTaskStatus(newTask._id, 'in_progress');
await lifecycle.transitionTaskStatus(newTask._id, 'completed');
```

### Smart Task Scheduling

```javascript
class TaskScheduler {
  constructor() {
    this.workingHours = { start: 9, end: 17 }; // 9 AM to 5 PM
    this.workingDays = [1, 2, 3, 4, 5]; // Monday to Friday
  }

  scheduleTask(taskData, preferredDate) {
    const scheduledDate = this.findNextAvailableSlot(preferredDate);
    
    return createTask({
      ...taskData,
      dueDate: scheduledDate.toISOString(),
      scheduledAt: new Date().toISOString()
    });
  }

  findNextAvailableSlot(preferredDate) {
    let date = new Date(preferredDate);
    
    // If outside working hours, move to next working hour
    if (date.getHours() < this.workingHours.start) {
      date.setHours(this.workingHours.start, 0, 0, 0);
    } else if (date.getHours() >= this.workingHours.end) {
      date.setDate(date.getDate() + 1);
      date.setHours(this.workingHours.start, 0, 0, 0);
    }

    // If weekend, move to next Monday
    while (!this.workingDays.includes(date.getDay())) {
      date.setDate(date.getDate() + 1);
      date.setHours(this.workingHours.start, 0, 0, 0);
    }

    return date;
  }

  async scheduleRecurringTask(taskData, recurrencePattern) {
    const tasks = [];
    const { frequency, count, interval = 1 } = recurrencePattern;
    
    let currentDate = new Date(taskData.dueDate);
    
    for (let i = 0; i < count; i++) {
      const scheduledDate = this.findNextAvailableSlot(currentDate);
      
      const task = await createTask({
        ...taskData,
        title: `${taskData.title} (${i + 1}/${count})`,
        dueDate: scheduledDate.toISOString(),
        repeatType: frequency
      });
      
      tasks.push(task);
      
      // Calculate next occurrence
      switch (frequency) {
        case 'daily':
          currentDate.setDate(currentDate.getDate() + interval);
          break;
        case 'weekly':
          currentDate.setDate(currentDate.getDate() + (7 * interval));
          break;
        case 'monthly':
          currentDate.setMonth(currentDate.getMonth() + interval);
          break;
      }
    }
    
    return tasks;
  }
}

// Usage
const scheduler = new TaskScheduler();

// Schedule a single task
const scheduledTask = await scheduler.scheduleTask({
  title: 'Weekly team review',
  description: 'Review team progress and plan next week',
  priority: 'medium',
  category: 'work'
}, new Date('2024-01-22T15:30:00.000Z'));

// Schedule recurring tasks
const recurringTasks = await scheduler.scheduleRecurringTask({
  title: 'Daily standup',
  description: 'Team daily sync meeting',
  priority: 'medium',
  category: 'work'
}, {
  frequency: 'daily',
  count: 10,
  interval: 1
});
```

### Task Analytics and Reporting

```javascript
class TaskAnalytics {
  async getTaskStatistics(dateRange = {}) {
    const { startDate, endDate } = dateRange;
    let allTasks = await getAllTasks();

    // Filter by date range if provided
    if (startDate || endDate) {
      allTasks = allTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        if (startDate && taskDate < new Date(startDate)) return false;
        if (endDate && taskDate > new Date(endDate)) return false;
        return true;
      });
    }

    return {
      total: allTasks.length,
      completed: allTasks.filter(t => t.isCompleted).length,
      pending: allTasks.filter(t => !t.isCompleted).length,
      overdue: allTasks.filter(t => !t.isCompleted && new Date(t.dueDate) < new Date()).length,
      byPriority: this.groupBy(allTasks, 'priority'),
      byCategory: this.groupBy(allTasks, 'category'),
      completionRate: this.calculateCompletionRate(allTasks),
      averageCompletionTime: this.calculateAverageCompletionTime(allTasks)
    };
  }

  groupBy(tasks, field) {
    return tasks.reduce((groups, task) => {
      const key = task[field] || 'uncategorized';
      groups[key] = (groups[key] || 0) + 1;
      return groups;
    }, {});
  }

  calculateCompletionRate(tasks) {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.isCompleted).length;
    return Math.round((completed / tasks.length) * 100);
  }

  calculateAverageCompletionTime(tasks) {
    const completedTasks = tasks.filter(t => t.isCompleted && t.updatedAt && t.createdAt);
    
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      const created = new Date(task.createdAt);
      const completed = new Date(task.updatedAt);
      return sum + (completed - created);
    }, 0);

    const averageMs = totalTime / completedTasks.length;
    return Math.round(averageMs / (1000 * 60 * 60 * 24)); // Convert to days
  }

  async generateProductivityReport(userId) {
    const stats = await this.getTaskStatistics();
    const todayTasks = await fetch('/tasks/today', { credentials: 'include' }).then(r => r.json());
    const overdueTasks = await fetch('/tasks/overdue', { credentials: 'include' }).then(r => r.json());

    return {
      summary: {
        totalTasks: stats.total,
        completionRate: `${stats.completionRate}%`,
        averageCompletionTime: `${stats.averageCompletionTime} days`,
        tasksToday: todayTasks.length,
        overdueTasks: overdueTasks.length
      },
      breakdown: {
        byPriority: stats.byPriority,
        byCategory: stats.byCategory
      },
      recommendations: this.generateRecommendations(stats, todayTasks, overdueTasks)
    };
  }

  generateRecommendations(stats, todayTasks, overdueTasks) {
    const recommendations = [];

    if (stats.completionRate < 70) {
      recommendations.push('Consider breaking down large tasks into smaller, manageable pieces');
    }

    if (overdueTasks.length > 5) {
      recommendations.push('Focus on completing overdue tasks before taking on new ones');
    }

    if (stats.byPriority.high > stats.byPriority.low + stats.byPriority.medium) {
      recommendations.push('Try to balance high-priority tasks with easier wins');
    }

    if (todayTasks.length > 10) {
      recommendations.push('Consider rescheduling some tasks to avoid overcommitment');
    }

    return recommendations;
  }
}

// Usage
const analytics = new TaskAnalytics();

const stats = await analytics.getTaskStatistics({
  startDate: '2024-01-01',
  endDate: '2024-01-31'
});

console.log('Task Statistics:', stats);

const report = await analytics.generateProductivityReport();
console.log('Productivity Report:', report);
```

## Error Handling Patterns

### Comprehensive Error Handler

```javascript
class TaskAPIClient {
  constructor(baseURL = '') {
    this.baseURL = baseURL;
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      credentials: 'include',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
      try {
        const response = await fetch(url, config);
        
        if (response.status === 401) {
          throw new AuthenticationError('Authentication required');
        }
        
        if (response.status === 403) {
          throw new AuthorizationError('Access denied');
        }
        
        if (response.status === 404) {
          throw new NotFoundError('Resource not found');
        }
        
        if (response.status === 429) {
          // Rate limited - wait and retry
          if (attempt < this.retryAttempts) {
            await this.delay(this.retryDelay * attempt);
            continue;
          }
          throw new RateLimitError('Too many requests');
        }
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          
          if (errorData.errors) {
            throw new ValidationError('Validation failed', errorData.errors);
          }
          
          throw new APIError(errorData.error || `HTTP ${response.status}`, response.status);
        }
        
        return await response.json();
      } catch (error) {
        if (error instanceof TypeError && error.message.includes('fetch')) {
          // Network error
          if (attempt < this.retryAttempts) {
            await this.delay(this.retryDelay * attempt);
            continue;
          }
          throw new NetworkError('Network connection failed');
        }
        
        // Don't retry for client errors (4xx) except rate limiting
        if (error.status >= 400 && error.status < 500 && error.status !== 429) {
          throw error;
        }
        
        // Retry for server errors (5xx)
        if (attempt < this.retryAttempts && error.status >= 500) {
          await this.delay(this.retryDelay * attempt);
          continue;
        }
        
        throw error;
      }
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Task-specific methods
  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData)
    });
  }

  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks?${params}`);
  }

  async updateTask(taskId, updates) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    });
  }

  async deleteTask(taskId) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE'
    });
  }
}

// Custom error classes
class APIError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'APIError';
    this.status = status;
  }
}

class AuthenticationError extends APIError {
  constructor(message) {
    super(message, 401);
    this.name = 'AuthenticationError';
  }
}

class AuthorizationError extends APIError {
  constructor(message) {
    super(message, 403);
    this.name = 'AuthorizationError';
  }
}

class NotFoundError extends APIError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

class ValidationError extends APIError {
  constructor(message, errors) {
    super(message, 400);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

class RateLimitError extends APIError {
  constructor(message) {
    super(message, 429);
    this.name = 'RateLimitError';
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}

// Usage with error handling
const client = new TaskAPIClient();

try {
  const task = await client.createTask({
    title: 'Test task',
    dueDate: '2024-01-25T10:00:00.000Z',
    priority: 'medium'
  });
  console.log('Task created:', task);
} catch (error) {
  switch (error.name) {
    case 'ValidationError':
      console.error('Validation failed:', error.errors);
      break;
    case 'AuthenticationError':
      console.error('Please log in');
      // Redirect to login
      break;
    case 'NetworkError':
      console.error('Connection failed. Please check your internet connection.');
      break;
    default:
      console.error('Unexpected error:', error.message);
  }
}
```

## Performance Optimization

### Caching Strategy

```javascript
class TaskCache {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  clear() {
    this.cache.clear();
  }

  invalidate(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

class CachedTaskClient extends TaskAPIClient {
  constructor() {
    super();
    this.cache = new TaskCache();
  }

  async getTasks(filters = {}) {
    const cacheKey = `tasks:${JSON.stringify(filters)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached) {
      console.log('Returning cached tasks');
      return cached;
    }
    
    const tasks = await super.getTasks(filters);
    this.cache.set(cacheKey, tasks);
    return tasks;
  }

  async createTask(taskData) {
    const task = await super.createTask(taskData);
    // Invalidate task list caches
    this.cache.invalidate('tasks:');
    return task;
  }

  async updateTask(taskId, updates) {
    const task = await super.updateTask(taskId, updates);
    // Invalidate related caches
    this.cache.invalidate('tasks:');
    this.cache.invalidate(`task:${taskId}`);
    return task;
  }

  async deleteTask(taskId) {
    const result = await super.deleteTask(taskId);
    // Invalidate related caches
    this.cache.invalidate('tasks:');
    this.cache.invalidate(`task:${taskId}`);
    return result;
  }
}

// Usage
const cachedClient = new CachedTaskClient();

// First call hits the API
const tasks1 = await cachedClient.getTasks({ priority: 'high' });

// Second call returns cached result
const tasks2 = await cachedClient.getTasks({ priority: 'high' });
```

This comprehensive task management guide provides real-world examples and patterns that developers can use to build robust task management applications with the Task Crusher API.