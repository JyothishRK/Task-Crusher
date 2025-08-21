# Environment Variables Configuration

This document describes all environment variables used by the Task Crusher API for secure cookie-based authentication.

## Required Variables

### JWT_SECRET
- **Description**: Secret key used for signing and verifying JWT tokens
- **Type**: String
- **Required**: Yes
- **Example**: `JWT_SECRET=your-super-secret-key-here`

### MONGODB_URL
- **Description**: MongoDB connection string
- **Type**: String
- **Required**: Yes
- **Example**: `MONGODB_URL=mongodb://localhost:27017/task-manager`

### PORT
- **Description**: Port number for the Express server
- **Type**: Number
- **Required**: Yes
- **Default**: 3000
- **Example**: `PORT=3000`

## Cookie Configuration Variables

### COOKIE_NAME
- **Description**: Name of the HTTP-only authentication cookie
- **Type**: String
- **Required**: No
- **Default**: `auth_token`
- **Example**: `COOKIE_NAME=auth_token`

### COOKIE_SECURE
- **Description**: Whether cookies should only be sent over HTTPS
- **Type**: String (`true`, `false`, or `auto`)
- **Required**: No
- **Default**: `auto` (automatically detects based on NODE_ENV)
- **Values**:
  - `true`: Always require HTTPS
  - `false`: Allow HTTP (development only)
  - `auto`: Use HTTPS in production, HTTP in development
- **Example**: `COOKIE_SECURE=auto`

### COOKIE_SAME_SITE
- **Description**: SameSite attribute for CSRF protection
- **Type**: String
- **Required**: No
- **Default**: `Lax`
- **Values**: `Strict`, `Lax`, `None`
- **Example**: `COOKIE_SAME_SITE=Lax`

### COOKIE_MAX_AGE
- **Description**: Cookie expiration time in milliseconds
- **Type**: Number
- **Required**: No
- **Default**: `86400000` (24 hours)
- **Example**: `COOKIE_MAX_AGE=86400000`

### NODE_ENV
- **Description**: Application environment
- **Type**: String
- **Required**: No
- **Default**: `development`
- **Values**: `development`, `production`, `test`
- **Example**: `NODE_ENV=production`

## CORS Configuration Variables

### ALLOWED_ORIGINS
- **Description**: Comma-separated list of allowed origins for CORS
- **Type**: String (comma-separated URLs)
- **Required**: No
- **Default**: `http://localhost:3000,http://localhost:3001`
- **Example**: `ALLOWED_ORIGINS=http://localhost:3000,https://myapp.com`

## Email Configuration Variables

### SENDGRID_API_KEY
- **Description**: SendGrid API key for sending emails
- **Type**: String
- **Required**: Yes (for email functionality)
- **Example**: `SENDGRID_API_KEY=SG.your-sendgrid-api-key`

### SERVICE_URL
- **Description**: Base URL of the service (used in emails)
- **Type**: String
- **Required**: No
- **Example**: `SERVICE_URL=https://your-app.com`

## Security Recommendations

### Production Environment
```env
NODE_ENV=production
COOKIE_SECURE=true
COOKIE_SAME_SITE=Lax
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Development Environment
```env
NODE_ENV=development
COOKIE_SECURE=false
COOKIE_SAME_SITE=Lax
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000
```

## Configuration Validation

The application automatically validates cookie configuration on startup and will:
- Use secure defaults for missing values
- Log warnings for invalid configuration values
- Auto-detect secure settings based on environment

## Example .env File

```env
# Core Configuration
JWT_SECRET=your-super-secret-jwt-key-here
MONGODB_URL=mongodb://localhost:27017/task-manager
PORT=3000
NODE_ENV=development

# Cookie Configuration for Secure Authentication
COOKIE_NAME=auth_token
COOKIE_SECURE=auto
COOKIE_SAME_SITE=Lax
COOKIE_MAX_AGE=86400000

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001,http://127.0.0.1:3000

# Email Configuration
SENDGRID_API_KEY=SG.your-sendgrid-api-key
SERVICE_URL=http://localhost:3000
```

## Troubleshooting

### Cookie Not Being Set
- Ensure `COOKIE_SECURE=false` in development if not using HTTPS
- Check that `ALLOWED_ORIGINS` includes your frontend URL
- Verify that your frontend is sending requests with `credentials: 'include'`

### CORS Errors
- Add your frontend URL to `ALLOWED_ORIGINS`
- Ensure your frontend includes credentials in requests
- Check that the origin header matches exactly (including protocol and port)

### Authentication Failures
- Verify `JWT_SECRET` is set and consistent across deployments
- Check that cookies are being sent with requests
- Ensure `NODE_ENV` is set correctly for your environment