# Task Crusher API Documentation

Welcome to the comprehensive documentation for the Task Crusher API - a powerful, RESTful task management service with robust authentication and advanced filtering capabilities.

## Overview

The Task Crusher API provides a complete task management solution with:
- **User Authentication** - Secure cookie-based authentication with JWT tokens
- **Task Management** - Full CRUD operations with advanced filtering and sorting
- **File Handling** - Avatar upload with automatic image processing
- **Real-time Features** - Specialized endpoints for today's tasks, overdue items, and more
- **Developer-Friendly** - Comprehensive error handling and detailed documentation

**Base URL**: `http://localhost:3000` (development)  
**API Version**: 1.0  
**Authentication**: Cookie-based (HTTP-only, secure)

## Quick Start Guide

### 1. Authentication Setup

```bash
# Register a new user
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepass123"
  }' \
  -c cookies.txt

# Login (if already registered)
curl -X POST http://localhost:3000/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepass123"
  }' \
  -c cookies.txt
```

### 2. Create Your First Task

```bash
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Complete API documentation",
    "description": "Write comprehensive docs for the Task Crusher API",
    "dueDate": "2024-01-25T17:00:00.000Z",
    "priority": "high",
    "category": "work"
  }'
```

### 3. Retrieve Your Tasks

```bash
# Get all tasks
curl -X GET http://localhost:3000/tasks -b cookies.txt

# Get high priority tasks
curl -X GET "http://localhost:3000/tasks?priority=high" -b cookies.txt

# Get today's tasks
curl -X GET http://localhost:3000/tasks/today -b cookies.txt
```

## Documentation Structure

### Core Documentation
- **[Authentication Guide](./authentication.md)** - Complete authentication flow, session management, and security
- **[Data Models](./models/)** - Detailed schemas for User and Task entities with validation rules
- **[API Endpoints](./endpoints/)** - Comprehensive endpoint reference with examples
- **[Error Handling](./errors.md)** - Error codes, troubleshooting, and best practices
- **[Specialized Endpoints](./specialized-endpoints.md)** - Advanced features and specialized functionality

### Practical Guides
- **[Filtering & Sorting](./examples/filtering-sorting.md)** - Master query parameters and data filtering
- **[Authentication Flow](./examples/authentication-flow.md)** - Step-by-step authentication examples
- **[Task Management](./examples/task-management.md)** - Real-world task management workflows
- **[Usage Examples](./examples/)** - Integration patterns and code samples

## Key Features

### 🔐 Secure Authentication
- Cookie-based authentication with HTTP-only, secure cookies
- JWT token management with automatic expiration
- Multi-device session support with individual and global logout
- Password hashing with bcrypt and comprehensive validation

### 📋 Advanced Task Management
- Complete CRUD operations with validation
- Rich filtering by priority, category, completion status
- Flexible sorting with multiple field support
- Pagination for large datasets
- Specialized endpoints for common queries (today, overdue, by category)

### 🎯 Smart Filtering & Querying
```bash
# Complex filtering example
GET /tasks?priority=high&completed=false&category=work&sortBy=dueDate:asc&limit=20
```

### 📁 File Management
- Avatar upload with automatic resizing (250x250px)
- Support for PNG, JPEG, JPG formats
- 1MB file size limit with validation
- Secure file serving with proper headers

### 📊 Specialized Endpoints
- `/tasks/today` - Today's tasks with smart sorting
- `/tasks/overdue` - Overdue tasks for quick attention
- `/tasks/priority/:level` - Direct priority-based access
- `/tasks/category/:name` - Category-specific task lists
- `/health` - Service monitoring and uptime tracking

## API Design Principles

### RESTful Architecture
- Standard HTTP methods (GET, POST, PATCH, DELETE)
- Logical resource URLs (`/users`, `/tasks`)
- Consistent response formats
- Proper HTTP status codes

### Developer Experience
- Comprehensive error messages with field-specific validation
- Consistent JSON response format
- Detailed documentation with examples
- Predictable behavior and naming conventions

### Security First
- HTTP-only cookies prevent XSS attacks
- Secure cookie attributes for HTTPS
- Input validation and sanitization
- Rate limiting considerations
- No sensitive data in responses

## Response Format Standards

### Success Response
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Complete project documentation",
  "priority": "high",
  "isCompleted": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Error Response
```json
{
  "error": "Validation failed",
  "errors": {
    "title": {
      "message": "Title is required",
      "kind": "required"
    }
  }
}
```

### List Response
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "title": "Task 1",
    "priority": "high"
  },
  {
    "_id": "507f1f77bcf86cd799439012", 
    "title": "Task 2",
    "priority": "medium"
  }
]
```

## Common Use Cases

### Dashboard Application
```javascript
// Load dashboard data efficiently
const [todayTasks, overdueTasks, highPriorityTasks] = await Promise.all([
  fetch('/tasks/today', { credentials: 'include' }).then(r => r.json()),
  fetch('/tasks/overdue', { credentials: 'include' }).then(r => r.json()),
  fetch('/tasks/priority/high', { credentials: 'include' }).then(r => r.json())
]);
```

### Mobile App Integration
```javascript
// Optimized for mobile with pagination
const tasks = await fetch('/tasks?limit=20&skip=0&sortBy=dueDate:asc', {
  credentials: 'include'
}).then(r => r.json());
```

### Productivity Analytics
```javascript
// Get completion statistics
const allTasks = await fetch('/tasks', { credentials: 'include' }).then(r => r.json());
const completionRate = allTasks.filter(t => t.isCompleted).length / allTasks.length;
```

## Rate Limits & Performance

### Recommended Practices
- Use pagination for large datasets (`limit` and `skip` parameters)
- Leverage specialized endpoints for common queries
- Implement client-side caching for frequently accessed data
- Use appropriate query parameters to reduce payload size

### Performance Considerations
- Database indexes on commonly filtered fields
- Optimized queries for specialized endpoints
- Efficient date-based filtering
- Minimal response payloads

## Integration Examples

### React Application
```javascript
import { useState, useEffect } from 'react';

function TaskDashboard() {
  const [tasks, setTasks] = useState([]);
  
  useEffect(() => {
    fetch('/tasks/today', { credentials: 'include' })
      .then(r => r.json())
      .then(setTasks);
  }, []);
  
  return (
    <div>
      <h2>Today's Tasks ({tasks.length})</h2>
      {tasks.map(task => (
        <div key={task._id}>{task.title}</div>
      ))}
    </div>
  );
}
```

### Node.js Backend Integration
```javascript
const TaskCrusherAPI = {
  async createTask(taskData) {
    const response = await fetch('http://localhost:3000/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(taskData)
    });
    return response.json();
  }
};
```

## Support & Resources

### Getting Help
- **Documentation**: Comprehensive guides and examples in this documentation
- **Error Messages**: Detailed error responses with specific field information
- **Examples**: Real-world code samples for common scenarios

### Development Tools
- **Health Check**: `/health` endpoint for monitoring
- **Validation**: Comprehensive input validation with helpful error messages
- **Testing**: Examples include test patterns and mock data

## Next Steps

1. **[Set up Authentication](./authentication.md)** - Learn about user registration and login
2. **[Explore Data Models](./models/)** - Understand the User and Task schemas
3. **[Try the Examples](./examples/)** - Follow practical integration guides
4. **[Handle Errors](./errors.md)** - Implement robust error handling
5. **[Advanced Features](./specialized-endpoints.md)** - Leverage specialized endpoints

---

**Ready to build something amazing?** Start with our [Quick Start Guide](#quick-start-guide) or dive into the [Authentication documentation](./authentication.md) to begin integrating the Task Crusher API into your application.