# Design Document

## Overview

This design implements secure JWT token handling by replacing the current approach of sending tokens in API response bodies with HTTP-only cookies. The solution maintains backward compatibility while significantly improving security by protecting tokens from XSS attacks and reducing exposure in network logs and browser developer tools.

## Architecture

### Current Architecture Issues
- JWT tokens are sent in JSON response bodies during signup/login
- Frontend must manually handle token storage (typically localStorage/sessionStorage)
- Tokens are accessible to JavaScript, making them vulnerable to XSS attacks
- Tokens are visible in network requests and browser dev tools

### New Architecture
- JWT tokens are set as HTTP-only cookies during authentication
- Cookies are automatically sent with subsequent requests
- Authentication middleware reads tokens from cookies only (no fallback to maintain security)
- Enhanced security through cookie flags (Secure, SameSite, HttpOnly)
- Complete removal of tokens from API response bodies

## Components and Interfaces

### 1. Cookie Configuration Service
**Purpose**: Centralized cookie configuration based on environment settings

**Interface**:
```javascript
const cookieConfig = {
  getCookieOptions: () => ({
    httpOnly: boolean,
    secure: boolean,
    sameSite: string,
    maxAge: number,
    path: string
  }),
  getTokenCookieName: () => string
}
```

**Implementation Details**:
- Reads environment variables for cookie security settings
- Provides different configurations for development vs production
- Handles secure defaults when environment variables are missing

### 2. Enhanced Authentication Middleware
**Purpose**: Modified auth middleware to support cookie-based token extraction only

**Current Implementation**: Reads token from `Authorization` header only
**New Implementation**: 
- Read token from HTTP-only cookie exclusively
- Remove Authorization header support to enforce secure cookie usage
- Same token validation and user lookup logic

**Interface Changes**:
```javascript
// No interface changes - middleware signature remains the same
const auth = async (req, res, next) => { ... }
```

### 3. Modified Authentication Routes
**Purpose**: Updated signup/login routes to set HTTP-only cookies instead of returning tokens

**Changes**:
- `/users` (POST) - Set cookie, return user object only
- `/users/login` (POST) - Set cookie, return user object only  
- `/users/logout` (POST) - Clear authentication cookie
- `/users/logoutall` (POST) - Clear authentication cookie

### 4. Token Management Utilities
**Purpose**: Helper functions for cookie-based token operations

**Interface**:
```javascript
const tokenUtils = {
  setAuthCookie: (res, token) => void,
  clearAuthCookie: (res) => void,
  extractTokenFromRequest: (req) => string | null
}
```

## Data Models

### Cookie Structure
```
Name: auth_token (configurable via environment)
Value: JWT token string
Attributes:
  - HttpOnly: true
  - Secure: true (production) / false (development)
  - SameSite: 'Lax' (configurable)
  - Path: '/'
  - MaxAge: matches JWT expiration
```

### Environment Variables
```
# Existing
JWT_SECRET=string
PORT=number

# New additions
COOKIE_NAME=auth_token (default)
COOKIE_SECURE=true|false (auto-detect based on NODE_ENV if not set)
COOKIE_SAME_SITE=Strict|Lax|None (default: Lax)
COOKIE_MAX_AGE=86400000 (default: 24 hours in milliseconds)
NODE_ENV=development|production
```

### Response Format Changes
**Before**:
```json
{
  "user": { ... },
  "token": "jwt.token.here"
}
```

**After**:
```json
{
  "user": { ... }
}
```
*Token is set as HTTP-only cookie in response headers*

## Error Handling

### Authentication Failures
- **Invalid/Missing Token**: Same 401 response, ensure no cookie is set
- **Token Generation Error**: Log error server-side, return generic error without token details
- **Cookie Setting Failure**: Graceful degradation, log error but don't expose to client

### Environment Configuration Errors
- **Missing JWT_SECRET**: Application startup failure (existing behavior)
- **Invalid Cookie Configuration**: Use secure defaults with warning logs
- **Development vs Production Mismatch**: Auto-detect based on NODE_ENV

### Security Enforcement
- **No Authorization Header Support**: Forces immediate adoption of secure cookie-based authentication
- **Cookie-Only Authentication**: Eliminates token exposure in API responses and headers
- **Immediate Security Fix**: Addresses XSS vulnerability without gradual migration period

## Testing Strategy

### Unit Tests
1. **Cookie Configuration Service**
   - Test environment variable parsing
   - Test secure defaults
   - Test development vs production configurations

2. **Authentication Middleware**
   - Test cookie-based token extraction
   - Test Authorization header fallback
   - Test token validation with both methods
   - Test error handling for invalid tokens

3. **Authentication Routes**
   - Test cookie setting on successful signup/login
   - Test cookie clearing on logout
   - Test response format (no token in body)
   - Test error scenarios (no cookie set on failure)

4. **Token Management Utilities**
   - Test cookie setting with various configurations
   - Test cookie clearing
   - Test token extraction from different sources

### Integration Tests
1. **End-to-End Authentication Flow**
   - Signup → Cookie set → Authenticated request → Success
   - Login → Cookie set → Authenticated request → Success
   - Logout → Cookie cleared → Authenticated request → Failure

2. **Cookie-Only Authentication**
   - Test cookie-based authentication exclusively
   - Test proper rejection of requests without cookies
   - Test API security compliance

3. **Security Tests**
   - Verify HttpOnly flag prevents JavaScript access
   - Verify Secure flag in production
   - Verify SameSite protection
   - Test XSS protection improvements

### Manual Testing
1. **Browser Developer Tools**
   - Verify tokens not visible in response bodies
   - Verify cookies set with correct attributes
   - Verify automatic cookie transmission

2. **Cross-Origin Requests**
   - Test CORS configuration with cookies
   - Verify SameSite behavior
   - Test credential inclusion

## Security Considerations

### Improvements Over Current Implementation
- **XSS Protection**: HTTP-only cookies cannot be accessed by JavaScript
- **Reduced Exposure**: Tokens not visible in network logs or dev tools
- **Automatic Handling**: Browser manages cookie transmission securely

### Additional Security Measures
- **CSRF Protection**: SameSite attribute provides CSRF protection
- **Secure Transmission**: Secure flag ensures HTTPS-only transmission in production
- **Controlled Access**: Path and domain restrictions limit cookie scope

### Potential Considerations
- **CSRF Attacks**: Mitigated by SameSite=Lax and existing CORS configuration
- **Cookie Size Limits**: JWT tokens are typically small enough for cookie storage
- **Subdomain Access**: Current design restricts to same domain (can be configured if needed)

## Migration Strategy

### Immediate Security Fix Approach
This is a breaking change that addresses a critical security vulnerability and requires immediate frontend updates.

### Phase 1: Backend Implementation
- Add cookie configuration service
- Update authentication middleware to use cookies exclusively
- Modify authentication routes to set cookies and remove tokens from responses
- Add comprehensive tests
- Update CORS configuration to support credentials

### Phase 2: Frontend Updates (Required)
- Remove manual token storage and handling from frontend
- Update HTTP client to include credentials in requests
- Remove Authorization header logic
- Test authentication flows with cookie-based approach

### Phase 3: Deployment
- Deploy backend changes
- Deploy frontend changes simultaneously
- Monitor authentication flows
- Verify security improvements

### No Rollback Plan
Since this fixes a security vulnerability, rolling back would reintroduce the security risk. Frontend must be updated to work with the new secure approach.