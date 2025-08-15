# Enhanced Task Management API Documentation

## Overview

The Enhanced Task Management API provides comprehensive task management capabilities including hierarchical sub-tasks, recurring task automation, and advanced querying features. This API is built with Node.js, Express, and MongoDB.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All API endpoints require authentication using JWT tokens passed as HTTP-only cookies. Users must log in to receive authentication tokens.

### Authentication Headers

```
Cookie: auth_token=<jwt_token>
```

## Data Models

### Task Model

```javascript
{
  "_id": "ObjectId",
  "taskId": "Number", // Auto-incremented internal ID
  "userId": "ObjectId", // Reference to user
  "title": "String", // Required, min length 1
  "description": "String", // Optional
  "dueDate": "Date", // Required
  "originalDueDate": "Date", // Required, set automatically, immutable
  "priority": "String", // "low" | "medium" | "high", default: "medium"
  "category": "String", // Optional
  "isCompleted": "Boolean", // Default: false
  "repeatType": "String", // "none" | "daily" | "weekly" | "monthly", default: "none"
  "parentTaskId": "ObjectId", // Optional, reference to parent task
  "parentRecurringId": "ObjectId", // Optional, reference to original recurring task
  "links": ["String"], // Optional array of URLs
  "additionalNotes": "String", // Optional, max length 2000
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### User Model

```javascript
{
  "_id": "ObjectId",
  "userId": "Number", // Auto-incremented internal ID
  "name": "String", // Required
  "email": "String", // Required, unique
  "password": "String", // Required, hashed
  "age": "Number", // Optional, default: 0
  "emailEnabled": "Boolean", // Default: true
  "notificationTime": "String", // Default: "09:00", format: "HH:MM"
  "createdAt": "Date",
  "updatedAt": "Date"
}
```

### UserActivity Model

```javascript
{
  "_id": "ObjectId",
  "activityId": "Number", // Auto-incremented internal ID
  "userId": "ObjectId", // Required, reference to user
  "action": "String", // Required, activity type
  "taskId": "ObjectId", // Optional, reference to task
  "message": "String", // Required, human-readable message
  "error": "String", // Optional, error message if applicable
  "timestamp": "Date" // Default: current date
}
```

## API Endpoints

### Task Management

#### Create Task

**POST** `/tasks`

Creates a new task with automatic ID assignment and optional recurring task generation.

**Request Body:**
```javascript
{
  "title": "String", // Required
  "description": "String", // Optional
  "dueDate": "Date", // Required
  "priority": "String", // Optional: "low" | "medium" | "high"
  "category": "String", // Optional
  "repeatType": "String", // Optional: "none" | "daily" | "weekly" | "monthly"
  "parentTaskId": "ObjectId", // Optional, for sub-tasks
  "links": ["String"], // Optional array of URLs
  "additionalNotes": "String" // Optional
}
```

**Response:**
```javascript
{
  "_id": "ObjectId",
  "taskId": 1,
  "userId": "ObjectId",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "dueDate": "2024-02-15T10:00:00.000Z",
  "originalDueDate": "2024-02-15T10:00:00.000Z",
  "priority": "high",
  "category": "documentation",
  "isCompleted": false,
  "repeatType": "none",
  "parentTaskId": null,
  "parentRecurringId": null,
  "links": ["https://docs.example.com"],
  "additionalNotes": "Include code examples",
  "createdAt": "2024-02-01T10:00:00.000Z",
  "updatedAt": "2024-02-01T10:00:00.000Z"
}
```

**Status Codes:**
- `201 Created` - Task created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required

**Notes:**
- If `repeatType` is not "none", background worker will generate 3 future recurring instances
- `originalDueDate` is automatically set to `dueDate` and cannot be changed
- Sub-tasks must have `repeatType` as "none" and `dueDate` before or equal to parent task

#### Get All Tasks

**GET** `/tasks`

Retrieves tasks for the authenticated user with filtering, pagination, and sorting options.

**Query Parameters:**
- `completed` (Boolean): Filter by completion status
- `priority` (String): Filter by priority ("low", "medium", "high")
- `category` (String): Filter by category
- `limit` (Number): Number of tasks to return (default: 10)
- `skip` (Number): Number of tasks to skip (default: 0)
- `sortBy` (String): Sort field and order (e.g., "dueDate:asc", "priority:desc")

**Example Request:**
```
GET /tasks?completed=false&priority=high&limit=5&sortBy=dueDate:asc
```

**Response:**
```javascript
[
  {
    "_id": "ObjectId",
    "taskId": 1,
    "title": "High priority task",
    "dueDate": "2024-02-15T10:00:00.000Z",
    "originalDueDate": "2024-02-15T10:00:00.000Z",
    "priority": "high",
    "isCompleted": false,
    // ... other fields
  }
]
```

#### Get Specific Task

**GET** `/tasks/:id`

Retrieves a specific task by its MongoDB ObjectId.

**Parameters:**
- `id` (String): MongoDB ObjectId of the task

**Response:**
```javascript
{
  "_id": "ObjectId",
  "taskId": 1,
  "title": "Specific task",
  // ... all task fields
}
```

**Status Codes:**
- `200 OK` - Task retrieved successfully
- `404 Not Found` - Task not found or access denied

#### Update Task

**PATCH** `/tasks/:id`

Updates an existing task. Note that `repeatType` and `originalDueDate` cannot be modified.

**Allowed Update Fields:**
- `title`
- `description`
- `dueDate`
- `priority`
- `category`
- `isCompleted`
- `parentTaskId`
- `links`
- `additionalNotes`

**Request Body:**
```javascript
{
  "title": "Updated task title",
  "priority": "high",
  "isCompleted": true
}
```

**Response:**
```javascript
{
  "_id": "ObjectId",
  "taskId": 1,
  "title": "Updated task title",
  "priority": "high",
  "isCompleted": true,
  "originalDueDate": "2024-02-15T10:00:00.000Z", // Unchanged
  // ... other fields
}
```

**Status Codes:**
- `200 OK` - Task updated successfully
- `400 Bad Request` - Invalid update operation or data
- `404 Not Found` - Task not found

**Notes:**
- If task is marked as completed and has recurring pattern, background worker will process completion
- Sub-task due date must remain before or equal to parent task due date

#### Delete Task

**DELETE** `/tasks/:id`

Deletes a task and triggers cleanup of related recurring tasks if applicable.

**Response:**
```javascript
{
  "_id": "ObjectId",
  "taskId": 1,
  "title": "Deleted task",
  // ... all fields of deleted task
}
```

**Status Codes:**
- `200 OK` - Task deleted successfully
- `404 Not Found` - Task not found

**Notes:**
- If task has recurring pattern, background worker will delete all related recurring instances

### Task Queries

#### Get Tasks by Priority

**GET** `/tasks/priority/:priority`

Retrieves all tasks with specified priority, sorted by due date.

**Parameters:**
- `priority` (String): "low", "medium", or "high"

#### Get Tasks by Category

**GET** `/tasks/category/:category`

Retrieves all tasks in specified category, sorted by due date.

**Parameters:**
- `category` (String): Category name

#### Get Overdue Tasks

**GET** `/tasks/overdue`

Retrieves all incomplete tasks with due dates in the past.

**Response:**
```javascript
[
  {
    "_id": "ObjectId",
    "title": "Overdue task",
    "dueDate": "2024-01-30T10:00:00.000Z", // Past date
    "isCompleted": false,
    // ... other fields
  }
]
```

#### Get Today's Tasks

**GET** `/tasks/today`

Retrieves all tasks due today, sorted by priority (high to low) then due date.

### Task Hierarchies

#### Get Task with Sub-tasks

**GET** `/tasks/:id/hierarchy`

Retrieves a task along with all its sub-tasks.

**Response:**
```javascript
{
  "_id": "ObjectId",
  "taskId": 1,
  "title": "Parent task",
  "subTasks": [
    {
      "_id": "ObjectId",
      "taskId": 2,
      "title": "Sub-task 1",
      "parentTaskId": "ObjectId", // References parent
      // ... other fields
    },
    {
      "_id": "ObjectId",
      "taskId": 3,
      "title": "Sub-task 2",
      "parentTaskId": "ObjectId",
      // ... other fields
    }
  ],
  // ... other parent task fields
}
```

#### Get Sub-tasks

**GET** `/tasks/:id/subtasks`

Retrieves all sub-tasks for a parent task, sorted by due date.

**Response:**
```javascript
[
  {
    "_id": "ObjectId",
    "taskId": 2,
    "title": "Sub-task 1",
    "parentTaskId": "ObjectId",
    // ... other fields
  }
]
```

### Recurring Tasks

#### Get Recurring Task Instances

**GET** `/tasks/:id/recurring`

Retrieves all recurring instances of a task, sorted by due date.

**Response:**
```javascript
[
  {
    "_id": "ObjectId",
    "taskId": 4,
    "title": "Daily standup",
    "dueDate": "2024-02-02T09:00:00.000Z",
    "originalDueDate": "2024-02-02T09:00:00.000Z",
    "parentRecurringId": "ObjectId", // References original task
    "repeatType": "daily",
    // ... other fields
  },
  {
    "_id": "ObjectId",
    "taskId": 5,
    "title": "Daily standup",
    "dueDate": "2024-02-03T09:00:00.000Z",
    "originalDueDate": "2024-02-03T09:00:00.000Z",
    "parentRecurringId": "ObjectId",
    "repeatType": "daily",
    // ... other fields
  }
]
```

## Internal Worker API

The internal worker API is used for background processing and is restricted to internal access only.

### Base URL

```
http://localhost:3000/internal
```

### Authentication

Internal APIs require either:
- Request from localhost/internal network, OR
- Valid internal API key in `x-internal-api-key` header

### Worker Endpoints

#### Process Task Recurrence

**POST** `/worker/tasks/recurrence`

Processes recurring task operations (create, complete, delete).

**Request Body:**
```javascript
{
  "taskId": "String", // Required
  "operation": "String", // Required: "create" | "complete" | "delete"
  "userId": "String" // Required for delete operation
}
```

#### Cleanup Tasks

**POST** `/worker/tasks/cleanup`

Performs maintenance operations including orphaned task cleanup.

#### Worker Health Check

**GET** `/worker/health`

Returns worker service health status.

**Response:**
```javascript
{
  "success": true,
  "data": {
    "status": "healthy",
    "timestamp": "2024-02-01T10:00:00.000Z",
    "services": {
      "tasksWorker": "operational",
      "recurrenceEngine": "operational"
    },
    "stats": {
      "totalTasks": 150,
      "recurringTasks": 25,
      "recurringInstances": 75
    }
  }
}
```

#### Worker Statistics

**GET** `/worker/stats?userId=<userId>`

Returns detailed worker statistics, optionally filtered by user.

#### Validate Recurrence

**POST** `/worker/validate`

Validates recurrence configuration for a task.

**Request Body:**
```javascript
{
  "task": {
    "title": "Test task",
    "dueDate": "2024-02-15T10:00:00.000Z",
    "repeatType": "daily"
  }
}
```

## Error Handling

### Error Response Format

All API errors follow a consistent format:

```javascript
{
  "success": false,
  "error": {
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "timestamp": "2024-02-01T10:00:00.000Z",
    "details": {
      // Additional error details when available
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR` - Invalid input data
- `TASK_NOT_FOUND` - Task not found or access denied
- `PARENT_TASK_NOT_FOUND` - Parent task not found for sub-task
- `INVALID_SUB_TASK` - Sub-task validation failed
- `REPEAT_TYPE_CHANGE_NOT_ALLOWED` - Cannot change repeatType on existing task
- `UNAUTHORIZED` - Authentication required
- `ACCESS_DENIED` - Insufficient permissions
- `DATABASE_ERROR` - Database operation failed
- `WORKER_PROCESSING_FAILED` - Background worker operation failed

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Access denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error
- `503 Service Unavailable` - Service temporarily unavailable

## Rate Limiting

API endpoints are subject to rate limiting to ensure fair usage:

- **Standard endpoints**: 100 requests per minute per user
- **Internal worker endpoints**: 1000 requests per minute
- **Authentication endpoints**: 10 requests per minute per IP

## Data Validation

### Task Validation Rules

1. **Title**: Required, minimum 1 character
2. **Due Date**: Required, must be a valid date
3. **Priority**: Must be "low", "medium", or "high"
4. **Repeat Type**: Must be "none", "daily", "weekly", or "monthly"
5. **Links**: Must be valid URLs starting with http:// or https://
6. **Additional Notes**: Maximum 2000 characters
7. **Sub-task Constraints**:
   - Must have `repeatType` as "none"
   - Due date must be before or equal to parent task due date
   - Parent task must exist and belong to same user

### Recurring Task Rules

1. **Creation**: Automatically generates 3 future occurrences
2. **Completion**: Updates next occurrence and generates new future occurrence
3. **Deletion**: Removes all related recurring instances
4. **Sub-tasks**: Cannot have recurring patterns
5. **Editing**: Cannot change `repeatType` after creation

## Examples

### Creating a Recurring Task

```javascript
// Request
POST /api/tasks
{
  "title": "Daily Team Standup",
  "description": "Daily team synchronization meeting",
  "dueDate": "2024-02-01T09:00:00.000Z",
  "priority": "high",
  "category": "meetings",
  "repeatType": "daily",
  "links": ["https://zoom.us/meeting/123"],
  "additionalNotes": "Discuss blockers and progress"
}

// Response
{
  "_id": "65b1234567890abcdef12345",
  "taskId": 1,
  "userId": "65b1234567890abcdef12340",
  "title": "Daily Team Standup",
  "description": "Daily team synchronization meeting",
  "dueDate": "2024-02-01T09:00:00.000Z",
  "originalDueDate": "2024-02-01T09:00:00.000Z",
  "priority": "high",
  "category": "meetings",
  "isCompleted": false,
  "repeatType": "daily",
  "parentTaskId": null,
  "parentRecurringId": null,
  "links": ["https://zoom.us/meeting/123"],
  "additionalNotes": "Discuss blockers and progress",
  "createdAt": "2024-02-01T08:00:00.000Z",
  "updatedAt": "2024-02-01T08:00:00.000Z"
}

// Background worker automatically creates 3 recurring instances:
// - 2024-02-02T09:00:00.000Z
// - 2024-02-03T09:00:00.000Z  
// - 2024-02-04T09:00:00.000Z
```

### Creating a Sub-task

```javascript
// First, create parent task
POST /api/tasks
{
  "title": "Website Redesign Project",
  "dueDate": "2024-02-28T17:00:00.000Z",
  "priority": "high",
  "category": "development"
}

// Then create sub-task
POST /api/tasks
{
  "title": "Design Homepage Mockup",
  "dueDate": "2024-02-15T17:00:00.000Z", // Before parent due date
  "priority": "medium",
  "category": "design",
  "parentTaskId": "65b1234567890abcdef12345", // Parent task ID
  "additionalNotes": "Focus on mobile-first design"
}
```

### Querying Tasks with Filters

```javascript
// Get high priority incomplete tasks, sorted by due date
GET /api/tasks?completed=false&priority=high&sortBy=dueDate:asc&limit=10

// Get today's tasks
GET /api/tasks/today

// Get overdue tasks
GET /api/tasks/overdue

// Get task with all sub-tasks
GET /api/tasks/65b1234567890abcdef12345/hierarchy
```

## SDK and Client Libraries

Client libraries are available for popular programming languages:

- **JavaScript/Node.js**: `npm install task-management-client`
- **Python**: `pip install task-management-client`
- **Java**: Maven/Gradle dependency available

## Changelog

### Version 2.0.0 (Current)
- Added hierarchical sub-tasks
- Implemented recurring task automation
- Added auto-incremented internal IDs
- Enhanced activity logging
- Added originalDueDate field
- Improved error handling
- Added internal worker API

### Version 1.0.0
- Basic task CRUD operations
- User authentication
- Task filtering and sorting
- Activity logging

## Support

For API support and questions:
- Documentation: [API Docs](https://docs.taskmanagement.com)
- Issues: [GitHub Issues](https://github.com/taskmanagement/api/issues)
- Email: api-support@taskmanagement.com