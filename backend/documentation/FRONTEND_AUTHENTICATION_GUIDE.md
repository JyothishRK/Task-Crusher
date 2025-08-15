# Frontend Authentication Guide

This guide explains how to implement cookie-based authentication with the Task Crusher API for frontend developers.

## Overview

The API now uses **HTTP-only cookies** for authentication instead of JWT tokens in response bodies. This provides better security by protecting tokens from XSS attacks while maintaining the same API endpoints and response formats.

## Key Changes

### ✅ What Stays the Same
- All API endpoint URLs remain unchanged
- Request and response formats are identical (except no tokens in responses)
- Error handling and status codes remain the same
- User data format is unchanged

### 🔄 What Changed
- **No more tokens in API responses** - tokens are now set as HTTP-only cookies
- **Credentials must be included** in all requests to send cookies
- **No manual token storage** required in frontend
- **No Authorization headers** needed

## Implementation Guide

### 1. HTTP Client Configuration

Configure your HTTP client to include credentials with all requests:

#### Fetch API
```javascript
// Configure fetch to include credentials
const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include', // Essential for cookie-based auth
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  return response;
};
```

#### Axios
```javascript
// Configure axios to include credentials
import axios from 'axios';

const apiClient = axios.create({
  baseURL: 'http://localhost:3000/api',
  withCredentials: true, // Essential for cookie-based auth
  headers: {
    'Content-Type': 'application/json'
  }
});
```

#### XMLHttpRequest
```javascript
const xhr = new XMLHttpRequest();
xhr.withCredentials = true; // Essential for cookie-based auth
```

### 2. Authentication Flow

#### Signup
```javascript
const signup = async (userData) => {
  try {
    const response = await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const data = await response.json();
      // Authentication cookie is automatically set by the browser
      // No need to manually store tokens
      return data.user;
    } else {
      throw new Error('Signup failed');
    }
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

// Usage
const newUser = await signup({
  name: 'John Doe',
  email: 'john@example.com',
  password: 'securepassword123'
});
```

#### Login
```javascript
const login = async (email, password) => {
  try {
    const response = await apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      // Authentication cookie is automatically set by the browser
      return data.user;
    } else {
      throw new Error('Login failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

// Usage
const user = await login('john@example.com', 'securepassword123');
```

#### Logout
```javascript
const logout = async () => {
  try {
    const response = await apiRequest('/api/users/logout', {
      method: 'POST'
    });
    
    if (response.ok) {
      // Authentication cookie is automatically cleared by the server
      // No need to manually remove tokens
      return true;
    } else {
      throw new Error('Logout failed');
    }
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};
```

#### Logout from All Devices
```javascript
const logoutAll = async () => {
  try {
    const response = await apiRequest('/api/users/logoutall', {
      method: 'POST'
    });
    
    if (response.ok) {
      // Authentication cookie is automatically cleared by the server
      return true;
    } else {
      throw new Error('Logout all failed');
    }
  } catch (error) {
    console.error('Logout all error:', error);
    throw error;
  }
};
```

### 3. Making Authenticated Requests

All protected endpoints work the same way - just include credentials:

```javascript
// Get current user
const getCurrentUser = async () => {
  const response = await apiRequest('/api/users/me');
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to get user');
};

// Get tasks
const getTasks = async () => {
  const response = await apiRequest('/api/tasks');
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to get tasks');
};

// Create task
const createTask = async (taskData) => {
  const response = await apiRequest('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData)
  });
  if (response.ok) {
    return await response.json();
  }
  throw new Error('Failed to create task');
};
```

### 4. Error Handling

Error handling remains the same:

```javascript
const handleApiError = (response) => {
  switch (response.status) {
    case 401:
      // User is not authenticated - redirect to login
      window.location.href = '/login';
      break;
    case 400:
      // Bad request - show validation errors
      return response.json().then(data => {
        throw new Error(data.error || 'Bad request');
      });
    case 500:
      // Server error
      throw new Error('Server error');
    default:
      throw new Error('Unknown error');
  }
};

const apiRequest = async (url, options = {}) => {
  const response = await fetch(url, {
    ...options,
    credentials: 'include'
  });
  
  if (!response.ok) {
    handleApiError(response);
  }
  
  return response;
};
```

### 5. Authentication State Management

Since cookies are handled automatically, you can simplify state management:

#### React Example
```javascript
import { useState, useEffect, createContext, useContext } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is authenticated on app load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await apiRequest('/api/users/me');
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      // User is not authenticated
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    const response = await apiRequest('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      return data.user;
    }
    throw new Error('Login failed');
  };

  const logout = async () => {
    await apiRequest('/api/users/logout', { method: 'POST' });
    setUser(null);
  };

  const signup = async (userData) => {
    const response = await apiRequest('/api/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    
    if (response.ok) {
      const data = await response.json();
      setUser(data.user);
      return data.user;
    }
    throw new Error('Signup failed');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      signup,
      checkAuthStatus
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Vue.js Example
```javascript
// store/auth.js
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false
  }),

  getters: {
    isAuthenticated: (state) => !!state.user
  },

  actions: {
    async checkAuthStatus() {
      this.loading = true;
      try {
        const response = await apiRequest('/api/users/me');
        if (response.ok) {
          this.user = await response.json();
        }
      } catch (error) {
        this.user = null;
      } finally {
        this.loading = false;
      }
    },

    async login(email, password) {
      const response = await apiRequest('/api/users/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return data.user;
      }
      throw new Error('Login failed');
    },

    async logout() {
      await apiRequest('/api/users/logout', { method: 'POST' });
      this.user = null;
    },

    async signup(userData) {
      const response = await apiRequest('/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      });
      
      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        return data.user;
      }
      throw new Error('Signup failed');
    }
  }
});
```

## Migration Checklist

### ✅ Required Changes
- [ ] Add `credentials: 'include'` to all API requests
- [ ] Remove manual token storage (localStorage, sessionStorage)
- [ ] Remove Authorization headers from requests
- [ ] Update authentication state management
- [ ] Test all authentication flows

### ✅ Optional Improvements
- [ ] Simplify authentication logic (no manual token handling)
- [ ] Remove token expiration checking (handled server-side)
- [ ] Remove token refresh logic (not needed with cookies)

## Security Benefits

### 🔒 XSS Protection
- Tokens cannot be accessed by JavaScript
- Malicious scripts cannot steal authentication tokens
- Automatic protection against token theft

### 🔒 CSRF Protection
- SameSite cookie attribute prevents cross-site requests
- Automatic protection against CSRF attacks
- No additional CSRF tokens needed

### 🔒 Secure Transmission
- Cookies automatically use HTTPS in production
- Secure flag prevents transmission over HTTP
- Automatic security based on environment

## Troubleshooting

### Common Issues

#### 1. Authentication Not Working
**Problem**: Requests return 401 Unauthorized
**Solution**: Ensure `credentials: 'include'` is set on all requests

```javascript
// ❌ Wrong
fetch('/api/users/me')

// ✅ Correct
fetch('/api/users/me', { credentials: 'include' })
```

#### 2. CORS Errors
**Problem**: CORS errors when making requests
**Solution**: Ensure your frontend URL is in the server's ALLOWED_ORIGINS

```env
# Backend .env file
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### 3. Cookies Not Being Set
**Problem**: Login succeeds but subsequent requests fail
**Solution**: Check that your frontend and backend are on compatible domains

- ✅ Same domain: `localhost:3000` → `localhost:3000`
- ✅ Different ports: `localhost:3001` → `localhost:3000`
- ❌ Different domains: `mydomain.com` → `localhost:3000`

#### 4. Development vs Production
**Problem**: Works in development but not production
**Solution**: Ensure HTTPS is used in production

```env
# Production environment
NODE_ENV=production
COOKIE_SECURE=true
```

### Testing Authentication

```javascript
// Test authentication status
const testAuth = async () => {
  try {
    const response = await fetch('/api/users/me', {
      credentials: 'include'
    });
    
    if (response.ok) {
      console.log('✅ Authenticated');
      const user = await response.json();
      console.log('User:', user);
    } else {
      console.log('❌ Not authenticated');
    }
  } catch (error) {
    console.error('Auth test failed:', error);
  }
};
```

## API Reference

All endpoints remain the same. Here's a quick reference:

### Authentication Endpoints
- `POST /api/users` - Signup (sets auth cookie)
- `POST /api/users/login` - Login (sets auth cookie)
- `POST /api/users/logout` - Logout (clears auth cookie)
- `POST /api/users/logoutall` - Logout all devices (clears auth cookie)

### Protected Endpoints
All require authentication cookie to be present:
- `GET /api/users/me` - Get current user
- `PATCH /api/users/me` - Update current user
- `DELETE /api/users/me` - Delete current user
- `GET /api/tasks` - Get user's tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:id` - Get specific task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Response Format
```javascript
// Signup/Login response (no token)
{
  "user": {
    "_id": "user123",
    "name": "John Doe",
    "email": "john@example.com"
  }
  // No token property - it's in the HTTP-only cookie
}

// Error response (unchanged)
{
  "error": "Error message here"
}
```

## Support

If you encounter issues with the new authentication system:

1. Check this guide for common solutions
2. Verify your HTTP client configuration
3. Test with the provided examples
4. Check browser developer tools for cookie presence
5. Verify CORS configuration

The new cookie-based authentication provides better security while maintaining API compatibility. The main change is adding `credentials: 'include'` to your requests and removing manual token handling.