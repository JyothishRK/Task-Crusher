# Design Document

## Overview

The User Activity Logging system provides comprehensive tracking of user actions within the to-do application. The system follows the existing application architecture patterns, using Mongoose for MongoDB integration and maintaining consistency with current schema design conventions. The logging system is designed to be lightweight, performant, and easily integrated into existing application workflows.

## Architecture

The system consists of two main components:

1. **UserActivity Model**: A Mongoose schema that defines the structure for storing activity logs
2. **Activity Logger Service**: A reusable utility function that provides a consistent interface for logging activities

The architecture follows the existing application patterns:
- Models are stored in `backend/src/models/`
- Utility functions are stored in `backend/src/utils/`
- Integration follows the same patterns as existing User and Task models

## Components and Interfaces

### UserActivity Schema

The schema will be implemented following the existing model patterns in the application:

```javascript
const userActivitySchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true
    },
    action: {
        type: String,
        required: true,
        trim: true,
        index: true
    },
    taskId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Task',
        required: false
    },
    message: {
        type: String,
        required: true,
        trim: true
    },
    error: {
        type: String,
        required: false,
        trim: true
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
}, {
    versionKey: false
});
```

### Indexing Strategy

Based on the existing Task model indexing patterns, the following compound indexes will be created:

- `{ userId: 1, timestamp: -1 }` - Primary query pattern for user activity history
- `{ userId: 1, action: 1 }` - Query activities by user and action type
- `{ userId: 1, action: 1, timestamp: -1 }` - Compound index for filtered activity queries

### Activity Logger Service

The logger service will be implemented as a utility function:

```javascript
const logActivity = async (userId, action, taskId = null, error = null) => {
    // Message generation logic
    // Database insertion logic
    // Error handling
}
```

**Function Interface:**
- `userId` (ObjectId, required): The user performing the action
- `action` (String, required): The action type (e.g., "TASK_COMPLETED", "TASK_CREATED")
- `taskId` (ObjectId, optional): The task involved in the action
- `error` (String, optional): Error message if the action failed

**Message Generation Logic:**
The function will automatically generate human-readable messages using the pattern:
- Success: `"User performed {action} :: {taskId}"`
- Error: `"User attempted {action} :: {taskId} :: ERROR: {error}"`
- No taskId: `"User performed {action}"`

## Data Models

### UserActivity Document Structure

```javascript
{
    _id: ObjectId,
    userId: ObjectId,           // Reference to User
    action: String,             // Action type identifier
    taskId: ObjectId,           // Optional reference to Task
    message: String,            // Human-readable summary
    error: String,              // Optional error message
    timestamp: Date             // When the action occurred
}
```

### Action Types

Common action types will include:
- `TASK_CREATED`
- `TASK_UPDATED` 
- `TASK_COMPLETED`
- `TASK_DELETED`
- `USER_LOGIN`
- `USER_LOGOUT`
- `PROFILE_UPDATED`

### Relationships

- `userId` references the User model (`ref: 'User'`)
- `taskId` optionally references the Task model (`ref: 'Task'`)
- No cascading deletes - activity logs are preserved for audit purposes

## Error Handling

### Logger Function Error Handling

The `logActivity` function will implement robust error handling:

1. **Parameter Validation**: Validate required parameters before processing
2. **Database Connection**: Handle MongoDB connection issues gracefully
3. **Schema Validation**: Handle Mongoose validation errors
4. **Fallback Logging**: If database logging fails, fall back to console logging
5. **Non-blocking**: Logging failures should not interrupt the main application flow

### Error Scenarios

- **Invalid ObjectId**: Validate ObjectId format for userId and taskId
- **Missing Required Fields**: Validate that userId and action are provided
- **Database Unavailable**: Graceful degradation when MongoDB is unavailable
- **Schema Validation Errors**: Handle Mongoose validation failures

## Testing Strategy

### Unit Tests

1. **Schema Validation Tests**:
   - Test required field validation
   - Test optional field handling
   - Test data type validation
   - Test index creation

2. **Logger Function Tests**:
   - Test successful activity logging
   - Test error activity logging
   - Test parameter validation
   - Test message generation logic
   - Test database error handling

3. **Integration Tests**:
   - Test with existing User and Task models
   - Test query performance with indexes
   - Test concurrent logging scenarios

### Test Data Patterns

Following the existing application patterns, tests will use:
- Valid ObjectIds for userId and taskId references
- Standard action type strings
- Error message formats consistent with application patterns
- Timestamp validation and timezone handling

### Performance Testing

- Query performance with various index combinations
- Bulk logging performance under load
- Memory usage with large activity datasets
- Index effectiveness measurement

## Integration Points

### Existing Application Integration

The logging system will integrate with existing application components:

1. **Task Operations**: Log task creation, updates, completion, and deletion
2. **User Authentication**: Log login/logout activities
3. **Profile Management**: Log profile updates and changes
4. **Error Handling**: Log application errors and exceptions

### Router Integration

Activity logging will be integrated into existing routers:
- Task router: Log task-related activities
- User router: Log user-related activities
- Auth middleware: Log authentication activities

### Middleware Integration

A middleware function can be created for automatic activity logging:
```javascript
const activityLogger = (action) => {
    return async (req, res, next) => {
        // Log activity after successful operations
    }
}
```