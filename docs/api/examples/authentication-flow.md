# Authentication Flow Examples

This guide provides step-by-step examples of the complete authentication flow in the Task Crusher API, including registration, login, session management, and logout processes.

## Complete Authentication Workflow

### Step 1: User Registration

Create a new user account:

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "password": "securepass123",
    "age": 28
  }' \
  -c cookies.txt \
  http://localhost:3000/users
```

**Response:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "age": 28,
    "emailEnabled": true,
    "notificationTime": "09:00",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Note:** Authentication cookie is automatically set after successful registration.

### Step 2: Verify Authentication Status

Check if the user is authenticated:

```bash
curl -X GET \
  -b cookies.txt \
  http://localhost:3000/users/me
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  "age": 28,
  "emailEnabled": true,
  "notificationTime": "09:00",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Step 3: Access Protected Resources

Use authenticated session to access tasks:

```bash
curl -X GET \
  -b cookies.txt \
  http://localhost:3000/tasks
```

**Response:**
```json
[
  {
    "_id": "507f1f77bcf86cd799439013",
    "userId": "507f1f77bcf86cd799439012",
    "title": "Welcome task",
    "description": "Get started with Task Crusher",
    "dueDate": "2024-01-20T09:00:00.000Z",
    "priority": "medium",
    "category": "personal",
    "isCompleted": false,
    "repeatType": "none",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
]
```

### Step 4: Logout

End the current session:

```bash
curl -X POST \
  -b cookies.txt \
  -c cookies.txt \
  http://localhost:3000/users/logout
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439012",
  "name": "Alice Johnson",
  "email": "alice@example.com",
  // ... user data
}
```

### Step 5: Verify Logout

Attempt to access protected resource (should fail):

```bash
curl -X GET \
  -b cookies.txt \
  http://localhost:3000/users/me
```

**Response (401):**
```json
{
  "error": "Please authenticate"
}
```

## Login Flow for Existing Users

### Step 1: Login

```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "securepass123"
  }' \
  -c cookies.txt \
  http://localhost:3000/users/login
```

**Response:**
```json
{
  "user": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Alice Johnson",
    "email": "alice@example.com",
    "age": 28,
    "emailEnabled": true,
    "notificationTime": "09:00",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### Step 2: Use Authenticated Session

Now you can access protected endpoints using the cookie:

```bash
# Create a new task
curl -X POST \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "dueDate": "2024-01-25T17:00:00.000Z",
    "priority": "high",
    "category": "work"
  }' \
  http://localhost:3000/tasks
```

## JavaScript/Browser Examples

### Registration with Fetch API

```javascript
async function registerUser(userData) {
  try {
    const response = await fetch('/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include', // Important: includes cookies
      body: JSON.stringify(userData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Registration successful:', result.user);
      return { success: true, user: result.user };
    } else {
      const error = await response.json();
      console.error('Registration failed:', error);
      return { success: false, error: error.error };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Usage
const result = await registerUser({
  name: 'Bob Smith',
  email: 'bob@example.com',
  password: 'mypassword123',
  age: 30
});
```

### Login with Fetch API

```javascript
async function loginUser(email, password) {
  try {
    const response = await fetch('/users/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (response.ok) {
      const result = await response.json();
      console.log('Login successful:', result.user);
      return { success: true, user: result.user };
    } else {
      const error = await response.json();
      console.error('Login failed:', error);
      return { success: false, error: error.error || 'Login failed' };
    }
  } catch (error) {
    console.error('Network error:', error);
    return { success: false, error: 'Network error' };
  }
}

// Usage
const result = await loginUser('bob@example.com', 'mypassword123');
```

### Check Authentication Status

```javascript
async function getCurrentUser() {
  try {
    const response = await fetch('/users/me', {
      credentials: 'include'
    });

    if (response.ok) {
      const user = await response.json();
      return { authenticated: true, user };
    } else {
      return { authenticated: false, user: null };
    }
  } catch (error) {
    console.error('Auth check failed:', error);
    return { authenticated: false, user: null };
  }
}

// Usage
const authStatus = await getCurrentUser();
if (authStatus.authenticated) {
  console.log('User is logged in:', authStatus.user);
} else {
  console.log('User is not authenticated');
}
```

### Logout

```javascript
async function logoutUser() {
  try {
    const response = await fetch('/users/logout', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      console.log('Logout successful');
      return { success: true };
    } else {
      console.error('Logout failed');
      return { success: false };
    }
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false };
  }
}

// Usage
await logoutUser();
```

## React Authentication Component

```javascript
import React, { useState } from 'react';

function AuthForm() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    age: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const url = isLogin ? '/users/login' : '/users';
      const body = isLogin 
        ? { email: formData.email, password: formData.password }
        : formData;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Success:', result.user);
        // Redirect or update app state
        window.location.href = '/dashboard';
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Authentication failed');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>{isLogin ? 'Login' : 'Register'}</h2>
      
      {error && <div className="error">{error}</div>}
      
      {!isLogin && (
        <input
          type="text"
          name="name"
          placeholder="Full Name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      )}
      
      <input
        type="email"
        name="email"
        placeholder="Email"
        value={formData.email}
        onChange={handleChange}
        required
      />
      
      <input
        type="password"
        name="password"
        placeholder="Password"
        value={formData.password}
        onChange={handleChange}
        required
      />
      
      {!isLogin && (
        <input
          type="number"
          name="age"
          placeholder="Age (optional)"
          value={formData.age}
          onChange={handleChange}
        />
      )}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
      </button>
      
      <button type="button" onClick={() => setIsLogin(!isLogin)}>
        {isLogin ? 'Need to register?' : 'Already have an account?'}
      </button>
    </form>
  );
}

export default AuthForm;
```

## Session Management Examples

### Multiple Device Logout

```javascript
async function logoutAllDevices() {
  try {
    const response = await fetch('/users/logoutall', {
      method: 'POST',
      credentials: 'include'
    });

    if (response.ok) {
      console.log('Logged out from all devices');
      // Redirect to login page
      window.location.href = '/login';
    }
  } catch (error) {
    console.error('Logout all failed:', error);
  }
}
```

### Session Persistence Check

```javascript
// Check if user session is still valid on app startup
async function initializeApp() {
  const authStatus = await getCurrentUser();
  
  if (authStatus.authenticated) {
    // User is logged in, show main app
    showMainApp(authStatus.user);
  } else {
    // User is not logged in, show login form
    showLoginForm();
  }
}

// Call on app startup
document.addEventListener('DOMContentLoaded', initializeApp);
```

## Error Handling Examples

### Comprehensive Error Handling

```javascript
async function handleApiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });

    if (response.status === 401) {
      // Authentication required or token expired
      console.log('Authentication required');
      redirectToLogin();
      return null;
    }

    if (response.status === 403) {
      // Access forbidden
      console.error('Access denied');
      showErrorMessage('You do not have permission to access this resource');
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('API request failed:', error);
    showErrorMessage(error.message);
    return null;
  }
}

// Usage
const tasks = await handleApiRequest('/tasks');
if (tasks) {
  displayTasks(tasks);
}
```

### Automatic Token Refresh (if implemented)

```javascript
// Interceptor for automatic authentication handling
async function authenticatedFetch(url, options = {}) {
  let response = await fetch(url, {
    ...options,
    credentials: 'include'
  });

  // If unauthorized, try to refresh session
  if (response.status === 401) {
    const refreshResult = await refreshSession();
    
    if (refreshResult.success) {
      // Retry original request
      response = await fetch(url, {
        ...options,
        credentials: 'include'
      });
    } else {
      // Refresh failed, redirect to login
      redirectToLogin();
      return null;
    }
  }

  return response;
}

async function refreshSession() {
  try {
    const response = await fetch('/users/refresh', {
      method: 'POST',
      credentials: 'include'
    });

    return { success: response.ok };
  } catch (error) {
    return { success: false };
  }
}
```

## Testing Authentication Flow

### End-to-End Test Example

```javascript
// Using Playwright or similar testing framework
test('complete authentication flow', async ({ page }) => {
  // Navigate to registration page
  await page.goto('/register');

  // Fill registration form
  await page.fill('[name="name"]', 'Test User');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'testpassword123');
  await page.fill('[name="age"]', '25');

  // Submit registration
  await page.click('button[type="submit"]');

  // Should redirect to dashboard
  await page.waitForURL('/dashboard');

  // Verify user is authenticated
  const userInfo = await page.textContent('.user-info');
  expect(userInfo).toContain('Test User');

  // Logout
  await page.click('.logout-button');

  // Should redirect to login page
  await page.waitForURL('/login');

  // Try to access protected page (should redirect to login)
  await page.goto('/dashboard');
  await page.waitForURL('/login');
});
```

This comprehensive authentication flow documentation covers all aspects of user authentication in the Task Crusher API, from basic registration and login to advanced session management and error handling scenarios.