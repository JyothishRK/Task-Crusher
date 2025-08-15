# Specialized Endpoints Guide

This guide covers the specialized endpoints in the Task Crusher API that provide advanced functionality beyond basic CRUD operations.

## Overview

The Task Crusher API includes several specialized endpoints designed for common use cases and advanced features:

- **Date-based queries** - Get tasks for specific time periods
- **Category and priority filtering** - Direct access to filtered task lists
- **File upload handling** - Avatar management with image processing
- **Health monitoring** - Service status and uptime tracking

## Date-Based Task Endpoints

### Get Today's Tasks: `GET /tasks/today`

Returns all tasks due today, automatically sorted by priority (high to low) and then by due date.

**Authentication:** Required

**Features:**
- Automatic date filtering for current day
- Smart sorting (priority desc, then due date asc)
- Timezone-aware date calculations

**Response Example:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439011",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Morning standup meeting",
    "description": "Daily team sync",
    "dueDate": "2024-01-15T09:00:00.000Z",
    "priority": "high",
    "category": "work",
    "isCompleted": false,
    "repeatType": "daily",
    "createdAt": "2024-01-10T10:30:00.000Z",
    "updatedAt": "2024-01-10T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Grocery shopping",
    "description": "Buy ingredients for dinner",
    "dueDate": "2024-01-15T18:00:00.000Z",
    "priority": "medium",
    "category": "personal",
    "isCompleted": false,
    "repeatType": "none",
    "createdAt": "2024-01-14T15:20:00.000Z",
    "updatedAt": "2024-01-14T15:20:00.000Z"
  }
]
```

**Usage Examples:**

```bash
# cURL
curl -X GET \
  --cookie "auth-token=your-token" \
  http://localhost:3000/tasks/today
```

```javascript
// JavaScript
const todaysTasks = await fetch('/tasks/today', {
  credentials: 'include'
}).then(res => res.json());

console.log(`You have ${todaysTasks.length} tasks due today`);
```

**Use Cases:**
- Dashboard "Today's Tasks" widget
- Daily planning applications
- Task prioritization interfaces
- Mobile app home screen

### Get Overdue Tasks: `GET /tasks/overdue`

Returns all incomplete tasks with due dates in the past, sorted by due date (oldest first).

**Authentication:** Required

**Features:**
- Automatic filtering for overdue tasks only
- Excludes completed tasks
- Sorted by due date (oldest overdue tasks first)
- Server-side date comparison

**Response Example:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439014",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Submit quarterly report",
    "description": "Q4 financial summary",
    "dueDate": "2024-01-10T17:00:00.000Z",
    "priority": "high",
    "category": "work",
    "isCompleted": false,
    "repeatType": "none",
    "createdAt": "2024-01-05T10:30:00.000Z",
    "updatedAt": "2024-01-05T10:30:00.000Z"
  },
  {
    "_id": "507f1f77bcf86cd799439015",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Call dentist",
    "description": "Schedule cleaning appointment",
    "dueDate": "2024-01-12T12:00:00.000Z",
    "priority": "medium",
    "category": "personal",
    "isCompleted": false,
    "repeatType": "none",
    "createdAt": "2024-01-08T14:15:00.000Z",
    "updatedAt": "2024-01-08T14:15:00.000Z"
  }
]
```

**Usage Examples:**

```bash
# cURL
curl -X GET \
  --cookie "auth-token=your-token" \
  http://localhost:3000/tasks/overdue
```

```javascript
// JavaScript with error handling
async function getOverdueTasks() {
  try {
    const response = await fetch('/tasks/overdue', {
      credentials: 'include'
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch overdue tasks');
    }
    
    const overdueTasks = await response.json();
    
    if (overdueTasks.length > 0) {
      console.warn(`⚠️ You have ${overdueTasks.length} overdue tasks!`);
      return overdueTasks;
    } else {
      console.log('✅ No overdue tasks - great job!');
      return [];
    }
  } catch (error) {
    console.error('Error fetching overdue tasks:', error);
    return [];
  }
}
```

**Use Cases:**
- Overdue task alerts and notifications
- Task management dashboards
- Productivity tracking
- Deadline management systems

## Category-Based Filtering Endpoints

### Get Tasks by Category: `GET /tasks/category/:category`

Returns all tasks in a specific category, sorted by due date.

**Authentication:** Required

**Path Parameters:**
- `category` (string) - The category name (case-sensitive)

**Features:**
- Direct category filtering
- Automatic sorting by due date
- Includes both completed and incomplete tasks

**Response Example:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439016",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Team meeting preparation",
    "description": "Prepare slides for weekly team sync",
    "dueDate": "2024-01-16T10:00:00.000Z",
    "priority": "medium",
    "category": "work",
    "isCompleted": false,
    "repeatType": "weekly",
    "createdAt": "2024-01-14T09:00:00.000Z",
    "updatedAt": "2024-01-14T09:00:00.000Z"
  }
]
```

**Usage Examples:**

```bash
# Get work tasks
curl -X GET \
  --cookie "auth-token=your-token" \
  http://localhost:3000/tasks/category/work

# Get personal tasks
curl -X GET \
  --cookie "auth-token=your-token" \
  http://localhost:3000/tasks/category/personal
```

```javascript
// JavaScript function for category filtering
async function getTasksByCategory(category) {
  const response = await fetch(`/tasks/category/${encodeURIComponent(category)}`, {
    credentials: 'include'
  });
  
  if (response.ok) {
    return await response.json();
  } else {
    console.error(`Failed to fetch ${category} tasks`);
    return [];
  }
}

// Usage
const workTasks = await getTasksByCategory('work');
const personalTasks = await getTasksByCategory('personal');
```

**Common Categories:**
- `work` - Professional tasks
- `personal` - Personal tasks
- `health` - Health and fitness related
- `finance` - Financial tasks
- `education` - Learning and development
- `home` - Household tasks

## Priority-Based Filtering Endpoints

### Get Tasks by Priority: `GET /tasks/priority/:priority`

Returns all tasks with a specific priority level, sorted by due date.

**Authentication:** Required

**Path Parameters:**
- `priority` (string) - Priority level: `low`, `medium`, or `high`

**Features:**
- Direct priority filtering
- Automatic sorting by due date
- Includes both completed and incomplete tasks

**Response Example:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439017",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Critical bug fix",
    "description": "Fix production issue affecting users",
    "dueDate": "2024-01-15T14:00:00.000Z",
    "priority": "high",
    "category": "work",
    "isCompleted": false,
    "repeatType": "none",
    "createdAt": "2024-01-15T08:30:00.000Z",
    "updatedAt": "2024-01-15T08:30:00.000Z"
  }
]
```

**Usage Examples:**

```bash
# Get high priority tasks
curl -X GET \
  --cookie "auth-token=your-token" \
  http://localhost:3000/tasks/priority/high

# Get low priority tasks
curl -X GET \
  --cookie "auth-token=your-token" \
  http://localhost:3000/tasks/priority/low
```

```javascript
// Priority-based task management
async function getTasksByPriority(priority) {
  const validPriorities = ['low', 'medium', 'high'];
  
  if (!validPriorities.includes(priority)) {
    throw new Error(`Invalid priority. Must be one of: ${validPriorities.join(', ')}`);
  }
  
  const response = await fetch(`/tasks/priority/${priority}`, {
    credentials: 'include'
  });
  
  return response.ok ? await response.json() : [];
}

// Get urgent tasks for immediate attention
const urgentTasks = await getTasksByPriority('high');
console.log(`${urgentTasks.length} high priority tasks need attention`);
```

## Avatar Management Endpoints

### Upload Avatar: `POST /users/me/avatar`

Upload and process a user profile picture with automatic image optimization.

**Authentication:** Required

**Content-Type:** `multipart/form-data`

**File Requirements:**
- **Field name:** `avatar`
- **Supported formats:** PNG, JPEG, JPG
- **Maximum size:** 1MB (1,000,000 bytes)
- **Processing:** Automatically resized to 250x250 pixels and converted to PNG

**Features:**
- Automatic image resizing and optimization
- Format standardization (converts to PNG)
- File size validation
- Overwrites existing avatar

**Success Response:** `200 OK` (empty body)

**Error Responses:**

**Invalid file type (400):**
```json
{
  "error": "Please Upload an Image"
}
```

**File too large (400):**
```json
{
  "error": "File too large"
}
```

**Usage Examples:**

```bash
# cURL upload
curl -X POST \
  --cookie "auth-token=your-token" \
  -F "avatar=@profile-picture.jpg" \
  http://localhost:3000/users/me/avatar
```

```javascript
// JavaScript file upload
async function uploadAvatar(fileInput) {
  const file = fileInput.files[0];
  
  if (!file) {
    alert('Please select a file');
    return;
  }
  
  // Validate file size (1MB limit)
  if (file.size > 1000000) {
    alert('File too large. Maximum size is 1MB.');
    return;
  }
  
  // Validate file type
  const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
  if (!allowedTypes.includes(file.type)) {
    alert('Invalid file type. Please upload PNG, JPEG, or JPG.');
    return;
  }
  
  const formData = new FormData();
  formData.append('avatar', file);
  
  try {
    const response = await fetch('/users/me/avatar', {
      method: 'POST',
      credentials: 'include',
      body: formData
    });
    
    if (response.ok) {
      console.log('Avatar uploaded successfully');
      // Refresh avatar display
      updateAvatarDisplay();
    } else {
      const error = await response.json();
      alert(`Upload failed: ${error.error}`);
    }
  } catch (error) {
    console.error('Upload error:', error);
    alert('Upload failed. Please try again.');
  }
}

// HTML file input handler
document.getElementById('avatar-input').addEventListener('change', uploadAvatar);
```

```html
<!-- HTML form for avatar upload -->
<form id="avatar-form">
  <input type="file" id="avatar-input" accept="image/png,image/jpeg,image/jpg" />
  <button type="button" onclick="uploadAvatar(document.getElementById('avatar-input'))">
    Upload Avatar
  </button>
</form>
```

### Get Avatar: `GET /users/:id/avatar`

Retrieve a user's profile picture.

**Authentication:** Not required (public endpoint)

**Path Parameters:**
- `id` (string) - User ID

**Response:** Image data (Content-Type: `image/jpg`)

**Error Response (404):** Empty response if user or avatar not found

**Usage Examples:**

```bash
# Download avatar
curl -X GET \
  http://localhost:3000/users/507f1f77bcf86cd799439012/avatar \
  -o user-avatar.jpg
```

```javascript
// Display avatar in web page
function displayAvatar(userId, imgElement) {
  imgElement.src = `/users/${userId}/avatar`;
  imgElement.onerror = function() {
    // Fallback to default avatar if user has no avatar
    this.src = '/default-avatar.png';
  };
}

// Usage
const avatarImg = document.getElementById('user-avatar');
displayAvatar('507f1f77bcf86cd799439012', avatarImg);
```

```html
<!-- HTML avatar display -->
<img id="user-avatar" 
     alt="User Avatar" 
     style="width: 50px; height: 50px; border-radius: 50%;" />
```

### Delete Avatar: `DELETE /users/me/avatar`

Remove the current user's profile picture.

**Authentication:** Required

**Success Response:** `200 OK` (empty body)

**Usage Examples:**

```bash
# cURL delete
curl -X DELETE \
  --cookie "auth-token=your-token" \
  http://localhost:3000/users/me/avatar
```

```javascript
// JavaScript delete avatar
async function deleteAvatar() {
  try {
    const response = await fetch('/users/me/avatar', {
      method: 'DELETE',
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('Avatar deleted successfully');
      // Update UI to show default avatar
      document.getElementById('user-avatar').src = '/default-avatar.png';
    } else {
      console.error('Failed to delete avatar');
    }
  } catch (error) {
    console.error('Delete error:', error);
  }
}
```

## Health Check Endpoint

### Service Health Check: `GET /health`

Monitor service status, uptime, and availability for load balancers and monitoring systems.

**Authentication:** Not required

**Features:**
- Lightweight health check (no database operations)
- Service uptime tracking
- Timestamp information
- Keepalive functionality for cloud deployments

**Success Response (200):**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "service": "task-app"
}
```

**Error Response (500):**
```json
{
  "status": "error",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "message": "Service temporarily unavailable"
}
```

**Response Fields:**
- `status` - Service status (`ok` or `error`)
- `timestamp` - Current server timestamp (ISO 8601)
- `uptime` - Process uptime in seconds
- `service` - Service identifier
- `message` - Error message (only present on errors)

**Usage Examples:**

```bash
# Basic health check
curl -X GET http://localhost:3000/health

# Health check with response time measurement
curl -w "Response time: %{time_total}s\n" \
  -X GET http://localhost:3000/health
```

```javascript
// JavaScript health monitoring
async function checkServiceHealth() {
  try {
    const startTime = Date.now();
    const response = await fetch('/health');
    const responseTime = Date.now() - startTime;
    
    if (response.ok) {
      const health = await response.json();
      console.log(`✅ Service healthy (${responseTime}ms)`, health);
      return { healthy: true, responseTime, data: health };
    } else {
      console.error('❌ Service unhealthy');
      return { healthy: false, responseTime };
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return { healthy: false, error: error.message };
  }
}

// Periodic health monitoring
setInterval(async () => {
  const health = await checkServiceHealth();
  if (!health.healthy) {
    // Alert or retry logic
    console.warn('Service health check failed');
  }
}, 30000); // Check every 30 seconds
```

**Load Balancer Configuration:**

```nginx
# Nginx health check configuration
upstream task_app {
    server localhost:3000;
    # Add more servers as needed
}

server {
    location /health {
        proxy_pass http://task_app/health;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        
        # Health check specific settings
        proxy_connect_timeout 5s;
        proxy_read_timeout 5s;
    }
}
```

**Docker Health Check:**

```dockerfile
# Dockerfile health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1
```

**Kubernetes Liveness Probe:**

```yaml
# Kubernetes deployment health check
apiVersion: apps/v1
kind: Deployment
metadata:
  name: task-app
spec:
  template:
    spec:
      containers:
      - name: task-app
        image: task-app:latest
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 5
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10
```

## Integration Patterns

### Dashboard Widget Integration

```javascript
// Dashboard component using specialized endpoints
class TaskDashboard {
  constructor() {
    this.widgets = {
      today: document.getElementById('today-tasks'),
      overdue: document.getElementById('overdue-tasks'),
      highPriority: document.getElementById('high-priority-tasks')
    };
  }

  async loadDashboard() {
    try {
      // Load all dashboard data in parallel
      const [todayTasks, overdueTasks, highPriorityTasks] = await Promise.all([
        fetch('/tasks/today', { credentials: 'include' }).then(r => r.json()),
        fetch('/tasks/overdue', { credentials: 'include' }).then(r => r.json()),
        fetch('/tasks/priority/high', { credentials: 'include' }).then(r => r.json())
      ]);

      this.renderWidget(this.widgets.today, todayTasks, 'Today\'s Tasks');
      this.renderWidget(this.widgets.overdue, overdueTasks, 'Overdue Tasks', 'warning');
      this.renderWidget(this.widgets.highPriority, highPriorityTasks, 'High Priority');
    } catch (error) {
      console.error('Dashboard load failed:', error);
    }
  }

  renderWidget(element, tasks, title, type = 'info') {
    element.innerHTML = `
      <h3>${title} (${tasks.length})</h3>
      <ul class="task-list ${type}">
        ${tasks.slice(0, 5).map(task => `
          <li>
            <span class="task-title">${task.title}</span>
            <span class="task-due">${new Date(task.dueDate).toLocaleDateString()}</span>
          </li>
        `).join('')}
      </ul>
    `;
  }
}

// Initialize dashboard
const dashboard = new TaskDashboard();
dashboard.loadDashboard();
```

### Mobile App Integration

```javascript
// React Native specialized endpoint usage
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';

const TaskHomeScreen = () => {
  const [todayTasks, setTodayTasks] = useState([]);
  const [overdueTasks, setOverdueTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeScreenData();
  }, []);

  const loadHomeScreenData = async () => {
    try {
      const [today, overdue] = await Promise.all([
        fetch('/tasks/today', { credentials: 'include' }).then(r => r.json()),
        fetch('/tasks/overdue', { credentials: 'include' }).then(r => r.json())
      ]);

      setTodayTasks(today);
      setOverdueTasks(overdue);

      // Show alert for overdue tasks
      if (overdue.length > 0) {
        Alert.alert(
          'Overdue Tasks',
          `You have ${overdue.length} overdue tasks that need attention.`,
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to load home screen data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        Today's Tasks ({todayTasks.length})
      </Text>
      <FlatList
        data={todayTasks}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.title}</Text>
            <Text>{item.priority} priority</Text>
          </View>
        )}
      />
      
      {overdueTasks.length > 0 && (
        <>
          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'red' }}>
            Overdue Tasks ({overdueTasks.length})
          </Text>
          <FlatList
            data={overdueTasks}
            keyExtractor={item => item._id}
            renderItem={({ item }) => (
              <View style={{ backgroundColor: '#ffebee' }}>
                <Text>{item.title}</Text>
                <Text>Due: {new Date(item.dueDate).toLocaleDateString()}</Text>
              </View>
            )}
          />
        </>
      )}
    </View>
  );
};

export default TaskHomeScreen;
```

This specialized endpoints guide provides comprehensive documentation for all the advanced features and specialized functionality in the Task Crusher API, making it easy for developers to implement sophisticated task management features.