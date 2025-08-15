# Error Handling Guide

This guide provides comprehensive information about error responses, status codes, and troubleshooting common issues in the Task Crusher API.

## Overview

The Task Crusher API uses standard HTTP status codes to indicate the success or failure of requests. All error responses follow a consistent JSON format to help developers handle errors effectively.

## Error Response Format

### Standard Error Response

```json
{
  "error": "Error message describing what went wrong",
  "status": "error"
}
```

### Validation Error Response

```json
{
  "errors": {
    "fieldName": {
      "message": "Specific validation error message",
      "kind": "validation_type",
      "path": "fieldName",
      "value": "invalid_value"
    }
  },
  "status": "error"
}
```

## HTTP Status Codes

### 2xx Success Codes

#### 200 OK
Request succeeded and response contains data.

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "Complete documentation",
  "priority": "high",
  "isCompleted": false
}
```

#### 201 Created
Resource was successfully created.

**Example:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "New task created",
  "userId": "507f1f77bcf86cd799439012",
  "createdAt": "2024-01-15T10:30:00.000Z"
}
```

### 4xx Client Error Codes

#### 400 Bad Request
The request was invalid or cannot be processed.

**Common Causes:**
- Invalid JSON in request body
- Missing required fields
- Invalid field values
- Validation errors

**Examples:**

**Invalid JSON:**
```json
{
  "error": "Unexpected token } in JSON at position 45",
  "status": "error"
}
```

**Validation Error:**
```json
{
  "errors": {
    "email": {
      "message": "Invalid Email",
      "kind": "user defined",
      "path": "email",
      "value": "invalid-email"
    },
    "password": {
      "message": "Password cannot Contain 'password'",
      "kind": "user defined",
      "path": "password",
      "value": "password123"
    }
  },
  "status": "error"
}
```

**Invalid Update Operation:**
```json
{
  "error": "Invalid Update Operation",
  "status": "error"
}
```

#### 401 Unauthorized
Authentication is required or the provided credentials are invalid.

**Common Causes:**
- No authentication token provided
- Invalid or expired token
- Token signature verification failed

**Examples:**

**Missing Authentication:**
```json
{
  "error": "Please authenticate",
  "status": "error"
}
```

**Invalid Credentials:**
```json
{
  "error": "Unable to Login",
  "status": "error"
}
```

#### 403 Forbidden
The request is understood but access is denied.

**Common Causes:**
- Valid authentication but insufficient permissions
- Attempting to access another user's resources

**Example:**
```json
{
  "error": "Access denied",
  "status": "error"
}
```

#### 404 Not Found
The requested resource could not be found.

**Common Causes:**
- Invalid resource ID
- Resource was deleted
- Incorrect endpoint URL

**Examples:**

**Task Not Found:**
```json
{
  "error": "Task not found",
  "status": "error"
}
```

**User Not Found:**
```json
{
  "error": "User not found",
  "status": "error"
}
```

**Endpoint Not Found:**
```json
{
  "error": "Cannot GET /invalid-endpoint",
  "status": "error"
}
```

#### 405 Method Not Allowed
The HTTP method is not supported for the requested resource.

**Example:**
```json
{
  "error": "Method not allowed",
  "status": "error"
}
```

**Common Cause:**
```bash
# Trying to POST to a GET-only endpoint
POST /health
```

### 5xx Server Error Codes

#### 500 Internal Server Error
An unexpected error occurred on the server.

**Common Causes:**
- Database connection issues
- Unhandled exceptions
- Server configuration problems

**Example:**
```json
{
  "error": "Internal Server Error",
  "status": "error"
}
```

## Field-Specific Validation Errors

### User Model Validation

#### Name Field
```json
{
  "errors": {
    "name": {
      "message": "Path `name` is required.",
      "kind": "required",
      "path": "name"
    }
  }
}
```

#### Email Field
```json
{
  "errors": {
    "email": {
      "message": "Invalid Email",
      "kind": "user defined",
      "path": "email",
      "value": "not-an-email"
    }
  }
}
```

**Duplicate Email:**
```json
{
  "errors": {
    "email": {
      "message": "Email already exists",
      "kind": "unique",
      "path": "email",
      "value": "existing@example.com"
    }
  }
}
```

#### Password Field
```json
{
  "errors": {
    "password": {
      "message": "Password cannot Contain 'password'",
      "kind": "user defined",
      "path": "password"
    }
  }
}
```

**Minimum Length:**
```json
{
  "errors": {
    "password": {
      "message": "Path `password` (`abc`) is shorter than the minimum allowed length (7).",
      "kind": "minlength",
      "path": "password",
      "value": "abc"
    }
  }
}
```

#### Age Field
```json
{
  "errors": {
    "age": {
      "message": "Age must be non negative number",
      "kind": "user defined",
      "path": "age",
      "value": -5
    }
  }
}
```

#### Notification Time Field
```json
{
  "errors": {
    "notificationTime": {
      "message": "Time must be in HH:MM format (24-hour)",
      "kind": "user defined",
      "path": "notificationTime",
      "value": "25:00"
    }
  }
}
```

### Task Model Validation

#### Title Field
```json
{
  "errors": {
    "title": {
      "message": "Path `title` is required.",
      "kind": "required",
      "path": "title"
    }
  }
}
```

**Minimum Length:**
```json
{
  "errors": {
    "title": {
      "message": "Path `title` (``) is shorter than the minimum allowed length (1).",
      "kind": "minlength",
      "path": "title",
      "value": ""
    }
  }
}
```

#### Due Date Field
```json
{
  "errors": {
    "dueDate": {
      "message": "Path `dueDate` is required.",
      "kind": "required",
      "path": "dueDate"
    }
  }
}
```

**Invalid Date:**
```json
{
  "errors": {
    "dueDate": {
      "message": "Cast to Date failed for value \"invalid-date\" at path \"dueDate\"",
      "kind": "ObjectId",
      "path": "dueDate",
      "value": "invalid-date"
    }
  }
}
```

#### Priority Field
```json
{
  "errors": {
    "priority": {
      "message": "`invalid` is not a valid enum value for path `priority`.",
      "kind": "enum",
      "path": "priority",
      "value": "invalid"
    }
  }
}
```

#### Repeat Type Field
```json
{
  "errors": {
    "repeatType": {
      "message": "`yearly` is not a valid enum value for path `repeatType`.",
      "kind": "enum",
      "path": "repeatType",
      "value": "yearly"
    }
  }
}
```

## File Upload Errors

### Avatar Upload Errors

#### Invalid File Type
```json
{
  "error": "Please Upload an Image",
  "status": "error"
}
```

#### File Too Large
```json
{
  "error": "File too large",
  "status": "error"
}
```

#### Missing File
```json
{
  "error": "No file uploaded",
  "status": "error"
}
```

## Authentication Errors

### Registration Errors

#### Duplicate Email
```json
{
  "error": "User validation failed: email: Email already exists",
  "status": "error"
}
```

#### Weak Password
```json
{
  "error": "User validation failed: password: Password cannot Contain 'password'",
  "status": "error"
}
```

### Login Errors

#### Invalid Credentials
```json
{
  "error": "Unable to Login",
  "status": "error"
}
```

#### Account Not Found
```json
{
  "error": "Unable to Login",
  "status": "error"
}
```

### Session Errors

#### Expired Token
```json
{
  "error": "Please authenticate",
  "status": "error"
}
```

#### Invalid Token
```json
{
  "error": "Please authenticate",
  "status": "error"
}
```

## Query Parameter Errors

### Invalid Filter Values

#### Invalid Priority
```json
{
  "error": "Invalid priority value. Must be one of: low, medium, high",
  "status": "error"
}
```

#### Invalid Completed Value
```json
{
  "error": "Invalid completed value. Must be true or false",
  "status": "error"
}
```

### Invalid Sorting

#### Invalid Sort Field
```json
{
  "error": "Invalid sort field. Available fields: dueDate, priority, title, createdAt, updatedAt",
  "status": "error"
}
```

#### Invalid Sort Direction
```json
{
  "error": "Invalid sort direction. Must be 'asc' or 'desc'",
  "status": "error"
}
```

### Pagination Errors

#### Invalid Limit
```json
{
  "error": "Limit must be between 1 and 100",
  "status": "error"
}
```

#### Invalid Skip
```json
{
  "error": "Skip must be a non-negative number",
  "status": "error"
}
```

## Error Handling Best Practices

### Client-Side Error Handling

#### JavaScript/Fetch Example

```javascript
async function handleApiRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      credentials: 'include'
    });

    // Handle different status codes
    if (response.status === 401) {
      // Redirect to login
      window.location.href = '/login';
      return null;
    }

    if (response.status === 403) {
      // Show access denied message
      showError('You do not have permission to perform this action');
      return null;
    }

    if (response.status === 404) {
      // Handle not found
      showError('The requested resource was not found');
      return null;
    }

    if (!response.ok) {
      // Handle other errors
      const errorData = await response.json();
      
      if (errorData.errors) {
        // Handle validation errors
        handleValidationErrors(errorData.errors);
      } else {
        // Handle general errors
        showError(errorData.error || 'An error occurred');
      }
      return null;
    }

    return await response.json();
  } catch (error) {
    // Handle network errors
    console.error('Network error:', error);
    showError('Network error. Please check your connection and try again.');
    return null;
  }
}

function handleValidationErrors(errors) {
  Object.keys(errors).forEach(field => {
    const error = errors[field];
    showFieldError(field, error.message);
  });
}

function showError(message) {
  // Display error to user
  const errorDiv = document.getElementById('error-message');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
}

function showFieldError(field, message) {
  // Display field-specific error
  const fieldError = document.getElementById(`${field}-error`);
  if (fieldError) {
    fieldError.textContent = message;
    fieldError.style.display = 'block';
  }
}
```

#### React Error Handling Hook

```javascript
import { useState } from 'react';

function useApiError() {
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});

  const handleError = (errorResponse) => {
    if (errorResponse.errors) {
      // Validation errors
      setFieldErrors(errorResponse.errors);
      setError(null);
    } else {
      // General error
      setError(errorResponse.error || 'An error occurred');
      setFieldErrors({});
    }
  };

  const clearErrors = () => {
    setError(null);
    setFieldErrors({});
  };

  const getFieldError = (fieldName) => {
    return fieldErrors[fieldName]?.message || null;
  };

  return {
    error,
    fieldErrors,
    handleError,
    clearErrors,
    getFieldError
  };
}

// Usage in component
function TaskForm() {
  const { error, handleError, clearErrors, getFieldError } = useApiError();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearErrors();

    try {
      const response = await fetch('/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        handleError(errorData);
        return;
      }

      // Success handling
      const task = await response.json();
      console.log('Task created:', task);
    } catch (err) {
      handleError({ error: 'Network error' });
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      
      <input
        name="title"
        value={formData.title || ''}
        onChange={(e) => setFormData({...formData, title: e.target.value})}
      />
      {getFieldError('title') && (
        <div className="field-error">{getFieldError('title')}</div>
      )}
      
      <button type="submit">Create Task</button>
    </form>
  );
}
```

### Server-Side Error Logging

#### Express Error Middleware

```javascript
// Error logging middleware
const errorLogger = (err, req, res, next) => {
  console.error('API Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    error: err.message,
    stack: err.stack,
    userId: req.user?._id,
    ip: req.ip
  });
  next(err);
};

// Error response middleware
const errorHandler = (err, req, res, next) => {
  // Mongoose validation errors
  if (err.name === 'ValidationError') {
    const errors = {};
    Object.keys(err.errors).forEach(key => {
      errors[key] = {
        message: err.errors[key].message,
        kind: err.errors[key].kind,
        path: err.errors[key].path,
        value: err.errors[key].value
      };
    });
    
    return res.status(400).json({ errors, status: 'error' });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      error: `${field} already exists`,
      status: 'error'
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Please authenticate',
      status: 'error'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal Server Error',
    status: 'error'
  });
};

// Usage
app.use(errorLogger);
app.use(errorHandler);
```

## Troubleshooting Common Issues

### Authentication Issues

#### Problem: "Please authenticate" error on valid requests
**Possible Causes:**
- Cookies not being sent with requests
- Token expired
- Invalid JWT secret

**Solutions:**
```javascript
// Ensure credentials are included
fetch('/api/endpoint', {
  credentials: 'include'
});

// Check cookie settings
// Ensure SameSite and Secure settings are appropriate for your environment
```

#### Problem: Login successful but subsequent requests fail
**Possible Causes:**
- Cookie domain mismatch
- CORS configuration issues
- HttpOnly cookie not accessible

**Solutions:**
- Verify cookie domain settings
- Check CORS configuration allows credentials
- Ensure frontend and backend are on same domain or properly configured

### Validation Issues

#### Problem: Validation errors not showing specific field information
**Possible Causes:**
- Client not parsing validation error format correctly
- Server not sending detailed validation errors

**Solutions:**
```javascript
// Proper validation error parsing
if (errorResponse.errors) {
  Object.keys(errorResponse.errors).forEach(field => {
    const fieldError = errorResponse.errors[field];
    console.log(`${field}: ${fieldError.message}`);
  });
}
```

### File Upload Issues

#### Problem: File upload fails with no clear error
**Possible Causes:**
- File too large
- Invalid file type
- Missing multipart/form-data header

**Solutions:**
```javascript
// Proper file upload
const formData = new FormData();
formData.append('avatar', fileInput.files[0]);

fetch('/users/me/avatar', {
  method: 'POST',
  credentials: 'include',
  body: formData // Don't set Content-Type header manually
});
```

### Network Issues

#### Problem: Requests failing with network errors
**Possible Causes:**
- CORS issues
- Server not running
- Incorrect API URL

**Solutions:**
- Check browser network tab for detailed error information
- Verify server is running and accessible
- Check CORS configuration on server

## Error Monitoring and Alerting

### Production Error Handling

```javascript
// Error tracking service integration
const trackError = (error, context = {}) => {
  // Send to error tracking service (e.g., Sentry, Bugsnag)
  console.error('Tracked Error:', {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date().toISOString()
  });
};

// Usage in API handlers
app.post('/tasks', auth, async (req, res) => {
  try {
    const task = new Task({ ...req.body, userId: req.user._id });
    await task.save();
    res.status(201).send(task);
  } catch (error) {
    trackError(error, {
      endpoint: 'POST /tasks',
      userId: req.user._id,
      requestBody: req.body
    });
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ errors: error.errors });
    }
    
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
```

This comprehensive error handling guide covers all aspects of error management in the Task Crusher API, from understanding error formats to implementing robust error handling in client applications.