# Task Endpoints

Task management endpoints for creating, reading, updating, and deleting tasks with filtering and sorting capabilities.

## Table of Contents

- [POST /tasks](#post-tasks)
- [GET /tasks](#get-tasks)
- [GET /tasks/:id](#get-tasksid)
- [PATCH /tasks/:id](#patch-tasksid)
- [DELETE /tasks/:id](#delete-tasksid)
- [GET /tasks/priority/:priority](#get-tasksprioritypriority)
- [GET /tasks/category/:category](#get-taskscategorycategory)
- [GET /tasks/overdue](#get-tasksoverdue)
- [GET /tasks/today](#get-taskstoday)

## POST /tasks {#post-tasks}

Create a new task

🔒 **Authentication Required**

### Request Body

Varies based on model schema


### Responses

#### 201 - Created

**Example Response:**

```json
{
  "_id": "507f1f77bcf86cd799439011",
  "userId": "507f1f77bcf86cd799439012",
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation for the Task Crusher application",
  "dueDate": "2024-01-20T09:00:00.000Z",
  "priority": "high",
  "category": "work",
  "isCompleted": false,
  "repeatType": "none",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```


#### 400 - Bad Request

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Bad Request - Invalid input data",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X POST \
  --cookie "auth-token=your-auth-token" \
  -H "Content-Type: application/json" \
  -d '{
  "title": "Complete project documentation",
  "description": "Write comprehensive API documentation",
  "dueDate": "2024-01-20T09:00:00.000Z",
  "priority": "high",
  "category": "work"
}' \
  "http://localhost:3000/tasks"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "title": "Complete project documentation",
    "description": "Write comprehensive API documentation",
    "dueDate": "2024-01-20T09:00:00.000Z",
    "priority": "high",
    "category": "work"
})
});

const data = await response.json();
console.log(data);
```


---

## GET /tasks {#get-tasks}

Get all tasks

🔒 **Authentication Required**

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **completed** | boolean | ❌ No | Filter by completion status (true/false) |
| **priority** | string | ❌ No | Filter by priority level (low, medium, high) |
| **category** | string | ❌ No | Filter by category name |
| **sortBy** | string | ❌ No | Field to sort by with optional direction (field:asc or field:desc) |
| **limit** | number | ❌ No | Maximum number of items to return |
| **skip** | number | ❌ No | Number of items to skip for pagination |

### Responses

#### 500 - Internal Server Error

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks?completed=false&priority=high&category=work&sortBy=dueDate:asc&limit=10&skip=0"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks?completed=false&priority=high&category=work&sortBy=dueDate:asc&limit=10&skip=0', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## GET /tasks/:id {#get-tasksid}

Get a specific task by ID

🔒 **Authentication Required**

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **id** | string | ✅ Yes | id identifier |

### Responses

#### 404 - Not Found

**Example Response:**

```json
{
  "error": "Not Found - Resource not found",
  "status": "error"
}
```


#### 500 - Internal Server Error

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/507f1f77bcf86cd799439011"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks/507f1f77bcf86cd799439011', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## PATCH /tasks/:id {#patch-tasksid}

Update a task

🔒 **Authentication Required**

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **id** | string | ✅ Yes | id identifier |

### Responses

#### 400 - Bad Request

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Bad Request - Invalid input data",
  "status": "error"
}
```


#### 404 - Not Found

**Example Response:**

```json
{
  "error": "Not Found - Resource not found",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X PATCH \
  --cookie "auth-token=your-auth-token" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/tasks/507f1f77bcf86cd799439011"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks/507f1f77bcf86cd799439011', {
  method: 'PATCH',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```


---

## DELETE /tasks/:id {#delete-tasksid}

Delete a task

🔒 **Authentication Required**

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **id** | string | ✅ Yes | id identifier |

### Responses

#### 404 - Not Found

**Example Response:**

```json
{
  "error": "Not Found - Resource not found",
  "status": "error"
}
```


#### 500 - Internal Server Error

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X DELETE \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/507f1f77bcf86cd799439011"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks/507f1f77bcf86cd799439011', {
  method: 'DELETE',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## GET /tasks/priority/:priority {#get-tasksprioritypriority}

Get :priority tasks

🔒 **Authentication Required**

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **priority** | string | ✅ Yes | priority identifier |

### Responses

#### 500 - Internal Server Error

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/priority/high"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks/priority/high', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## GET /tasks/category/:category {#get-taskscategorycategory}

Get :category tasks

🔒 **Authentication Required**

### Path Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| **category** | string | ✅ Yes | category identifier |

### Responses

#### 500 - Internal Server Error

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/category/work"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks/category/work', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## GET /tasks/overdue {#get-tasksoverdue}

Get overdue tasks

🔒 **Authentication Required**

### Responses

#### 500 - Internal Server Error

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/overdue"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks/overdue', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## GET /tasks/today {#get-taskstoday}

Get today tasks

🔒 **Authentication Required**

### Responses

#### 500 - Internal Server Error

**Response Schema:**

```json
{
  "error": {
    "type": "string"
  }
}
```

**Example Response:**

```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/tasks/today"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/tasks/today', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

