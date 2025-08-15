# API Usage Examples

This section provides comprehensive examples and guides for using the Task Crusher API effectively.

## Available Guides

### [Filtering and Sorting](./filtering-sorting.md)
Complete guide to filtering, sorting, and pagination options for the `/tasks` endpoint. Includes:
- Query parameter reference
- Filtering by completion status, priority, and category
- Sorting options and syntax
- Pagination implementation
- Specialized endpoints for common queries
- Best practices and performance considerations

### [Authentication Flow](./authentication-flow.md)
Complete authentication workflow guide including:
- User registration and validation
- Login and session management with cookies
- Session persistence and security
- Multi-device logout capabilities
- React and JavaScript integration examples

### [Task Management](./task-management.md)
Comprehensive task management workflows including:
- Complete CRUD operations with error handling
- Bulk task operations and batch processing
- Advanced task lifecycle management
- Smart task scheduling and recurring tasks
- Task analytics and productivity reporting
- Performance optimization with caching

## Quick Reference

### Common Query Patterns

```bash
# Get high priority incomplete tasks
GET /tasks?priority=high&completed=false

# Get work tasks due today (using specialized endpoint)
GET /tasks/today?category=work

# Get paginated results
GET /tasks?limit=20&skip=40

# Get overdue tasks
GET /tasks/overdue
```

### Authentication Examples

```bash
# Login
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  http://localhost:3000/users/login

# Use authenticated endpoint (cookies automatically included)
curl -X GET \
  --cookie-jar cookies.txt \
  --cookie cookies.txt \
  http://localhost:3000/tasks
```

### Error Handling

```javascript
try {
  const response = await fetch('/tasks', {
    credentials: 'include'
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error.error);
    return;
  }
  
  const tasks = await response.json();
  console.log('Tasks:', tasks);
} catch (error) {
  console.error('Network Error:', error);
}
```

## Integration Examples

### React Hook for Tasks

```javascript
import { useState, useEffect } from 'react';

function useTasks(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        const queryParams = new URLSearchParams(filters);
        const response = await fetch(`/tasks?${queryParams}`, {
          credentials: 'include'
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch tasks');
        }
        
        const data = await response.json();
        setTasks(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, [JSON.stringify(filters)]);

  return { tasks, loading, error };
}

// Usage
function TaskList() {
  const { tasks, loading, error } = useTasks({
    completed: false,
    priority: 'high'
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <ul>
      {tasks.map(task => (
        <li key={task._id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

### Node.js Client

```javascript
class TaskCrusherClient {
  constructor(baseURL = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.cookies = '';
  }

  async login(email, password) {
    const response = await fetch(`${this.baseURL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      this.cookies = response.headers.get('set-cookie');
    }

    return response.json();
  }

  async getTasks(filters = {}) {
    const queryParams = new URLSearchParams(filters);
    const response = await fetch(`${this.baseURL}/tasks?${queryParams}`, {
      headers: {
        'Cookie': this.cookies
      }
    });

    return response.json();
  }

  async createTask(taskData) {
    const response = await fetch(`${this.baseURL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': this.cookies
      },
      body: JSON.stringify(taskData)
    });

    return response.json();
  }
}

// Usage
const client = new TaskCrusherClient();
await client.login('user@example.com', 'password');
const tasks = await client.getTasks({ priority: 'high' });
```

## Testing Examples

### Unit Test Example (Jest)

```javascript
// Mock fetch for testing
global.fetch = jest.fn();

describe('Task API', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should fetch high priority tasks', async () => {
    const mockTasks = [
      { _id: '1', title: 'Test Task', priority: 'high' }
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockTasks
    });

    const response = await fetch('/tasks?priority=high');
    const tasks = await response.json();

    expect(fetch).toHaveBeenCalledWith('/tasks?priority=high');
    expect(tasks).toEqual(mockTasks);
  });
});
```

For more detailed information, see the individual guide files in this directory.