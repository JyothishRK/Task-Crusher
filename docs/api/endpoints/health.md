# Health Endpoints

Health check and monitoring endpoints for service status and uptime tracking.

## Table of Contents

- [GET /health](#get-health)
- [ALL /health](#all-health)

## GET /health {#get-health}

Get all health

🔓 **No Authentication Required**

### Responses

#### 200 - Success

**Example Response:**

```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "service": "task-app"
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
  "http://localhost:3000/health"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/health', {
  method: 'GET'
});

const data = await response.json();
console.log(data);
```


---

## ALL /health {#all-health}

ALL /health

🔓 **No Authentication Required**

### Responses

#### 405 - Method Not Allowed

**Example Response:**

```json
{
  "error": "Method Not Allowed",
  "status": "error"
}
```


### Usage Examples

#### cURL

```bash
curl -X ALL \
  "http://localhost:3000/health"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/health', {
  method: 'ALL'
});

const data = await response.json();
console.log(data);
```


---

