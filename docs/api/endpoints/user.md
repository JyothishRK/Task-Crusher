# User Endpoints

User management and authentication endpoints for account creation, login, logout, and profile management.

## Table of Contents

- [POST /users](#post-users)
- [POST /users/login](#post-userslogin)
- [POST /users/logout](#post-userslogout)
- [POST /users/logoutall](#post-userslogoutall)
- [POST /users/me/avatar](#post-usersmeavatar)
- [DELETE /users/me/avatar](#delete-usersmeavatar)
- [GET /users/:id/avatar](#get-usersidavatar)
- [GET /users/me](#get-usersme)
- [PATCH /users/me](#patch-usersme)
- [DELETE /users/me](#delete-usersme)

## POST /users {#post-users}

Create a new user

🔓 **No Authentication Required**

### Responses

#### 201 - Created

**Example Response:**

```json
{
  "message": "Success",
  "status": "ok"
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
  -H "Content-Type: application/json" \
  "http://localhost:3000/users"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```


---

## POST /users/login {#post-userslogin}

Login user

🔓 **No Authentication Required**

### Request Body

```json
{
  "email": {
    "type": "string",
    "description": "email value"
  },
  "password": {
    "type": "string",
    "description": "password value"
  }
}
```


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


### Usage Examples

#### cURL

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}' \
  "http://localhost:3000/users/login"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    "email": "john.doe@example.com",
    "password": "securepassword123"
})
});

const data = await response.json();
console.log(data);
```


---

## POST /users/logout {#post-userslogout}

Logout user

🔒 **Authentication Required**

### Responses

#### 201 - Created

**Example Response:**

```json
{
  "message": "Success",
  "status": "ok"
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
curl -X POST \
  --cookie "auth-token=your-auth-token" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/users/logout"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/logout', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```


---

## POST /users/logoutall {#post-userslogoutall}

Logoutall user

🔒 **Authentication Required**

### Responses

#### 201 - Created

**Example Response:**

```json
{
  "message": "Success",
  "status": "ok"
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
curl -X POST \
  --cookie "auth-token=your-auth-token" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/users/logoutall"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/logoutall', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```


---

## POST /users/me/avatar {#post-usersmeavatar}

Avatar user

🔒 **Authentication Required**

### Responses

#### 200 - Success

**Example Response:**

```json
{
  "message": "Success",
  "status": "ok"
}
```


### Usage Examples

#### cURL

```bash
curl -X POST \
  --cookie "auth-token=your-auth-token" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/users/me/avatar"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/me/avatar', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
```


---

## DELETE /users/me/avatar {#delete-usersmeavatar}

Delete a user

🔒 **Authentication Required**

### Responses

#### 200 - Success

**Example Response:**

```json
{
  "message": "Success",
  "status": "ok"
}
```


### Usage Examples

#### cURL

```bash
curl -X DELETE \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/users/me/avatar"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/me/avatar', {
  method: 'DELETE',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## GET /users/:id/avatar {#get-usersidavatar}

Get a specific user by ID

🔓 **No Authentication Required**

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


### Usage Examples

#### cURL

```bash
curl -X GET \
  "http://localhost:3000/users/507f1f77bcf86cd799439011/avatar"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/507f1f77bcf86cd799439011/avatar', {
  method: 'GET'
});

const data = await response.json();
console.log(data);
```


---

## GET /users/me {#get-usersme}

Get me users

🔒 **Authentication Required**

### Responses

#### 200 - Success

**Example Response:**

```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "age": 25,
  "emailEnabled": true,
  "notificationTime": "09:00",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```


### Usage Examples

#### cURL

```bash
curl -X GET \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/users/me"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/me', {
  method: 'GET',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

## PATCH /users/me {#patch-usersme}

Update a user

🔒 **Authentication Required**

### Responses

#### 201 - Created

**Example Response:**

```json
{
  "message": "Success",
  "status": "ok"
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
curl -X PATCH \
  --cookie "auth-token=your-auth-token" \
  -H "Content-Type: application/json" \
  "http://localhost:3000/users/me"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/me', {
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

## DELETE /users/me {#delete-usersme}

Delete a user

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
curl -X DELETE \
  --cookie "auth-token=your-auth-token" \
  "http://localhost:3000/users/me"
```

#### JavaScript (fetch)

```javascript
const response = await fetch('http://localhost:3000/users/me', {
  method: 'DELETE',
  credentials: 'include'
});

const data = await response.json();
console.log(data);
```


---

