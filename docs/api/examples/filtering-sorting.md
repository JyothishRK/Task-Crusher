# Filtering and Sorting Guide

This guide provides comprehensive information about filtering, sorting, and pagination options available in the Task Crusher API.

## Overview

The Task Crusher API provides powerful filtering and sorting capabilities, primarily for the `/tasks` endpoint. These features allow you to efficiently retrieve exactly the data you need.

## Query Parameters

### Filtering Parameters

#### `completed` (boolean)
Filter tasks by their completion status.

**Valid values:**
- `true` - Only completed tasks
- `false` - Only incomplete tasks
- Omit parameter - All tasks (default)

**Examples:**
```bash
# Get only completed tasks
GET /tasks?completed=true

# Get only incomplete tasks  
GET /tasks?completed=false
```

#### `priority` (string)
Filter tasks by priority level.

**Valid values:**
- `low` - Low priority tasks
- `medium` - Medium priority tasks  
- `high` - High priority tasks

**Examples:**
```bash
# Get high priority tasks
GET /tasks?priority=high

# Get low priority tasks
GET /tasks?priority=low
```

#### `category` (string)
Filter tasks by category name.

**Valid values:** Any string (case-sensitive)

**Examples:**
```bash
# Get work-related tasks
GET /tasks?category=work

# Get personal tasks
GET /tasks?category=personal
```

### Sorting Parameters

#### `sortBy` (string)
Sort tasks by a specific field with optional direction.

**Format:** `field:direction`
- `field` - The field name to sort by
- `direction` - `asc` (ascending) or `desc` (descending)

**Available sort fields:**
- `dueDate` - Sort by due date
- `priority` - Sort by priority level
- `title` - Sort by task title
- `createdAt` - Sort by creation date
- `updatedAt` - Sort by last update date

**Default sorting:** `dueDate:asc` (due date ascending)

**Examples:**
```bash
# Sort by due date (ascending)
GET /tasks?sortBy=dueDate:asc

# Sort by priority (descending - high to low)
GET /tasks?sortBy=priority:desc

# Sort by title (alphabetical)
GET /tasks?sortBy=title:asc

# Sort by creation date (newest first)
GET /tasks?sortBy=createdAt:desc
```

### Pagination Parameters

#### `limit` (number)
Maximum number of tasks to return in a single request.

**Default:** 10
**Range:** 1-100

**Examples:**
```bash
# Get 5 tasks
GET /tasks?limit=5

# Get 25 tasks
GET /tasks?limit=25
```

#### `skip` (number)
Number of tasks to skip (for pagination).

**Default:** 0
**Use case:** Implementing pagination by skipping already retrieved items

**Examples:**
```bash
# Get first page (tasks 1-10)
GET /tasks?limit=10&skip=0

# Get second page (tasks 11-20)
GET /tasks?limit=10&skip=10

# Get third page (tasks 21-30)
GET /tasks?limit=10&skip=20
```

## Combining Parameters

You can combine multiple query parameters to create powerful filters:

### Example 1: High Priority Work Tasks
```bash
GET /tasks?priority=high&category=work&completed=false
```
Returns incomplete, high-priority tasks in the "work" category.

### Example 2: Recent Completed Tasks
```bash
GET /tasks?completed=true&sortBy=updatedAt:desc&limit=5
```
Returns the 5 most recently completed tasks.

### Example 3: Paginated Personal Tasks
```bash
GET /tasks?category=personal&sortBy=dueDate:asc&limit=10&skip=20
```
Returns personal tasks sorted by due date, showing page 3 (tasks 21-30).

## Complete Examples

### JavaScript (fetch)

```javascript
// Get high priority work tasks, sorted by due date
const response = await fetch('/tasks?priority=high&category=work&sortBy=dueDate:asc&limit=20', {
  method: 'GET',
  credentials: 'include'
});

const tasks = await response.json();
console.log(`Found ${tasks.length} high priority work tasks`);
```

### cURL

```bash
# Get overdue tasks (using specialized endpoint)
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/overdue"

# Get today's tasks (using specialized endpoint)
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/today"

# Get filtered and sorted tasks
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks?completed=false&priority=high&sortBy=dueDate:asc&limit=10"
```

## Specialized Endpoints

In addition to query parameters, the API provides specialized endpoints for common filtering scenarios:

### `/tasks/overdue`
Returns all overdue tasks (incomplete tasks with due date in the past).

**Equivalent to:** `/tasks?completed=false` + server-side date filtering

### `/tasks/today`
Returns tasks due today, sorted by priority (high to low) then due date.

**Equivalent to:** `/tasks` + server-side date filtering + `sortBy=priority:desc,dueDate:asc`

### `/tasks/priority/:priority`
Returns tasks with a specific priority level.

**Equivalent to:** `/tasks?priority=:priority`

**Examples:**
- `/tasks/priority/high`
- `/tasks/priority/medium`
- `/tasks/priority/low`

### `/tasks/category/:category`
Returns tasks in a specific category.

**Equivalent to:** `/tasks?category=:category`

**Examples:**
- `/tasks/category/work`
- `/tasks/category/personal`

## Best Practices

### 1. Use Appropriate Limits
```bash
# Good: Reasonable limit for UI display
GET /tasks?limit=20

# Avoid: Very large limits that may cause performance issues
GET /tasks?limit=1000
```

### 2. Implement Proper Pagination
```javascript
// Good: Implement pagination for large datasets
async function getAllTasks() {
  const allTasks = [];
  let skip = 0;
  const limit = 50;
  
  while (true) {
    const response = await fetch(`/tasks?limit=${limit}&skip=${skip}`, {
      credentials: 'include'
    });
    const tasks = await response.json();
    
    if (tasks.length === 0) break;
    
    allTasks.push(...tasks);
    skip += limit;
  }
  
  return allTasks;
}
```

### 3. Use Specialized Endpoints When Available
```bash
# Good: Use specialized endpoint for common queries
GET /tasks/overdue

# Less efficient: Manual filtering for the same result
GET /tasks?completed=false&sortBy=dueDate:asc
# (then filter client-side for overdue)
```

### 4. Combine Filters Effectively
```bash
# Good: Specific, targeted query
GET /tasks?priority=high&completed=false&limit=10

# Less efficient: Broad query requiring client-side filtering
GET /tasks?limit=100
# (then filter client-side)
```

## Error Handling

### Invalid Parameter Values
```json
{
  "error": "Invalid priority value. Must be one of: low, medium, high",
  "status": "error"
}
```

### Invalid Sort Fields
```json
{
  "error": "Invalid sort field. Available fields: dueDate, priority, title, createdAt, updatedAt",
  "status": "error"
}
```

### Limit Out of Range
```json
{
  "error": "Limit must be between 1 and 100",
  "status": "error"
}
```

## Performance Considerations

1. **Indexing**: The API uses database indexes on commonly filtered fields (`userId`, `priority`, `category`, `isCompleted`, `dueDate`) for optimal performance.

2. **Limit Usage**: Use reasonable limits to avoid memory issues and improve response times.

3. **Specialized Endpoints**: Use specialized endpoints (like `/tasks/overdue`) when available, as they're optimized for specific use cases.

4. **Sorting**: Default sorting by `dueDate` is optimized. Other sort fields may have slightly higher response times for large datasets.