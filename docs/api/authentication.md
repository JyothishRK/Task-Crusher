# Authentication Guide

The Task Crusher API uses cookie-based authentication to secure endpoints and manage user sessions. This guide covers the complete authentication flow, session management, and security considerations.

## Overview

### Authentication Method
- **Type**: Cookie-based authentication
- **Session Storage**: HTTP-only cookies
- **Token Format**: JWT (JSON Web Tokens)
- **Security**: Secure, HttpOnly cookies prevent XSS attacks

### Authentication Flow
1. User registers or logs in with credentials
2. Server validates credentials and generates JWT token
3. Token is stored in HTTP-only cookie and sent to client
4. Client automatically includes cookie in subsequent requests
5. Server validates token on each protected endpoint request

## User Registration

### Endpoint: `POST /users`

Create a new user account and automatically log them in.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "password": "securepassword123",
  "age": 25
}
```

**Validation Rules:**
- **name**: Required, trimmed string
- **email**: Required, valid email format, unique, lowercase
- **password**: Required, minimum 7 characters, cannot contain "password"
- **age**: Optional, non-negative number, defaults to 0

**Success Response (201):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "age": 25,
    "emailEnabled": true,
    "notificationTime": "09:00",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "User validation failed: email: Email already exists"
}
```

**Example:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "age": 25
  }' \
  -c cookies.txt \
  http://localhost:3000/users
```

## User Login

### Endpoint: `POST /users/login`

Authenticate existing user and establish session.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "securepassword123"
}
```

**Success Response (200):**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "age": 25,
    "emailEnabled": true,
    "notificationTime": "09:00",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Response (400):**
```json
{
  "error": "Unable to Login"
}
```

**Example:**
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "password": "securepassword123"
  }' \
  -c cookies.txt \
  http://localhost:3000/users/login
```

## Session Management

### Authentication Cookies

After successful login or registration, the server sets authentication cookies:

```
Set-Cookie: auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; HttpOnly; Secure; SameSite=Strict; Path=/
```

**Cookie Properties:**
- **HttpOnly**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite=Strict**: CSRF protection
- **Path=/**: Available for all API endpoints

### Token Structure

The JWT token contains:
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "iat": 1642248600,
  "exp": 1642335000
}
```

- **_id**: User identifier
- **iat**: Issued at timestamp
- **exp**: Expiration timestamp (24 hours)

## Protected Endpoints

All endpoints requiring authentication will return `401 Unauthorized` if no valid token is provided.

### Making Authenticated Requests

**Browser (automatic):**
```javascript
// Cookies are automatically included
const response = await fetch('/tasks', {
  credentials: 'include'
});
```

**cURL:**
```bash
# Use cookie jar from login
curl -X GET \
  -b cookies.txt \
  http://localhost:3000/tasks
```

**Node.js:**
```javascript
const response = await fetch('http://localhost:3000/tasks', {
  headers: {
    'Cookie': 'auth-token=your-token-here'
  }
});
```

## User Logout

### Single Device Logout: `POST /users/logout`

Logout from current device/session only.

**Request:** No body required
**Authentication:** Required

**Success Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "John Doe",
  "email": "john.doe@example.com",
  // ... other user fields
}
```

**Example:**
```bash
curl -X POST \
  -b cookies.txt \
  -c cookies.txt \
  http://localhost:3000/users/logout
```

### All Devices Logout: `POST /users/logoutall`

Logout from all devices/sessions.

**Request:** No body required
**Authentication:** Required

**Success Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "John Doe",
  "email": "john.doe@example.com",
  // ... other user fields
}
```

**Example:**
```bash
curl -X POST \
  -b cookies.txt \
  -c cookies.txt \
  http://localhost:3000/users/logoutall
```

## User Profile Management

### Get Current User: `GET /users/me`

Retrieve current authenticated user's profile.

**Authentication:** Required

**Success Response (200):**
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

### Update Profile: `PATCH /users/me`

Update current user's profile information.

**Authentication:** Required

**Request Body (partial update):**
```json
{
  "name": "John Smith",
  "age": 26,
  "emailEnabled": false,
  "notificationTime": "08:00"
}
```

**Allowed Fields:**
- `name` - User's display name
- `email` - Email address (must be unique)
- `password` - New password (will be hashed)
- `age` - User's age
- `emailEnabled` - Email notification preference
- `notificationTime` - Preferred notification time (HH:MM format)

**Success Response (201):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "John Smith",
  "email": "john.doe@example.com",
  "age": 26,
  "emailEnabled": false,
  "notificationTime": "08:00",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T11:45:00.000Z"
}
```

### Delete Account: `DELETE /users/me`

Permanently delete user account and all associated data.

**Authentication:** Required

**Success Response (200):**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "John Doe",
  "email": "john.doe@example.com",
  // ... user data before deletion
}
```

**Note:** This action also deletes all user's tasks and sends account deletion email.

## Avatar Management

### Upload Avatar: `POST /users/me/avatar`

Upload user profile picture.

**Authentication:** Required
**Content-Type:** `multipart/form-data`

**Request:**
- **Field name:** `avatar`
- **File types:** PNG, JPEG, JPG
- **Max size:** 1MB
- **Processing:** Automatically resized to 250x250px PNG

**Success Response (200):** Empty response

**Error Response (400):**
```json
{
  "error": "Please Upload an Image"
}
```

**Example:**
```bash
curl -X POST \
  -b cookies.txt \
  -F "avatar=@profile-picture.jpg" \
  http://localhost:3000/users/me/avatar
```

### Delete Avatar: `DELETE /users/me/avatar`

Remove user's profile picture.

**Authentication:** Required

**Success Response (200):** Empty response

### Get Avatar: `GET /users/:id/avatar`

Retrieve user's profile picture.

**Authentication:** Not required
**Response:** Image data (image/jpg)

**Example:**
```bash
curl -X GET \
  http://localhost:3000/users/507f1f77bcf86cd799439012/avatar \
  -o avatar.jpg
```

## Error Handling

### Authentication Errors

**401 Unauthorized:**
```json
{
  "error": "Please authenticate"
}
```

**403 Forbidden:**
```json
{
  "error": "Access denied"
}
```

### Validation Errors

**400 Bad Request (Registration):**
```json
{
  "errors": {
    "email": {
      "message": "Email already exists",
      "kind": "unique"
    },
    "password": {
      "message": "Password cannot contain 'password'",
      "kind": "user defined"
    }
  }
}
```

**400 Bad Request (Login):**
```json
{
  "error": "Unable to Login"
}
```

## Security Considerations

### Password Security
- Passwords are hashed using bcrypt with salt rounds
- Minimum 7 characters required
- Cannot contain the word "password"
- Stored passwords are never returned in API responses

### Token Security
- JWT tokens expire after 24 hours
- Tokens are stored in HTTP-only cookies
- Secure flag ensures HTTPS-only transmission in production
- SameSite attribute prevents CSRF attacks

### Session Management
- Multiple concurrent sessions supported
- Individual session logout available
- Global logout from all devices available
- Expired tokens are automatically rejected

### Rate Limiting
- Login attempts should be rate-limited (implementation dependent)
- Failed login attempts are logged for security monitoring

## Integration Examples

### React Authentication Hook

```javascript
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/users/me', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await fetch('/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const { user } = await response.json();
      setUser(user);
      return { success: true };
    } else {
      const error = await response.json();
      return { success: false, error: error.error };
    }
  };

  const logout = async () => {
    await fetch('/users/logout', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Express.js Middleware Integration

```javascript
// Custom auth middleware for other Express apps
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.cookies['auth-token'];
    
    if (!token) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);
    
    if (!user) {
      return res.status(401).json({ error: 'Please authenticate' });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Please authenticate' });
  }
};

// Usage
app.get('/protected-route', authenticateToken, (req, res) => {
  res.json({ message: 'Access granted', user: req.user });
});
```

## Testing Authentication

### Unit Tests

```javascript
describe('Authentication', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: 'validpassword'
      });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('test@example.com');
    expect(response.headers['set-cookie']).toBeDefined();
  });

  test('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: 'wrongpassword'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toBe('Unable to Login');
  });
});
```

### Integration Tests

```javascript
describe('Protected Routes', () => {
  let authCookie;

  beforeEach(async () => {
    // Login and get auth cookie
    const loginResponse = await request(app)
      .post('/users/login')
      .send({
        email: 'test@example.com',
        password: 'validpassword'
      });

    authCookie = loginResponse.headers['set-cookie'];
  });

  test('should access protected route with valid token', async () => {
    const response = await request(app)
      .get('/users/me')
      .set('Cookie', authCookie);

    expect(response.status).toBe(200);
    expect(response.body.email).toBe('test@example.com');
  });

  test('should reject access without token', async () => {
    const response = await request(app)
      .get('/users/me');

    expect(response.status).toBe(401);
  });
});
```