/**
 * Logging Utility for Authentication System
 * Provides secure logging that doesn't expose sensitive information
 */

/**
 * Log levels for different types of events
 */
const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

/**
 * Determines if logging should be enabled based on environment
 */
const isLoggingEnabled = () => {
    return process.env.NODE_ENV !== 'test';
};

/**
 * Sanitizes log data to remove sensitive information
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data
 */
const sanitizeLogData = (data) => {
    if (!data) return data;
    
    if (typeof data === 'string') {
        // Remove potential JWT tokens from strings
        return data.replace(/eyJ[A-Za-z0-9-_=]+\.[A-Za-z0-9-_=]+\.?[A-Za-z0-9-_.+/=]*/g, '[JWT_TOKEN_REDACTED]');
    }
    
    if (typeof data === 'object' && data !== null) {
        // Handle arrays
        if (Array.isArray(data)) {
            return data.map(item => sanitizeLogData(item));
        }
        
        // Handle objects
        const sanitized = { ...data };
        
        // Remove sensitive fields
        const sensitiveFields = ['password', 'token', 'tokens', 'jwt', 'secret', 'authorization'];
        sensitiveFields.forEach(field => {
            if (sanitized[field]) {
                sanitized[field] = '[REDACTED]';
            }
        });
        
        // Sanitize nested objects
        Object.keys(sanitized).forEach(key => {
            if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
                sanitized[key] = sanitizeLogData(sanitized[key]);
            }
        });
        
        return sanitized;
    }
    
    return data;
};

/**
 * Formats log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {any} data - Additional data to log
 * @returns {string} - Formatted log message
 */
const formatLogMessage = (level, message, data = null) => {
    const timestamp = new Date().toISOString();
    const sanitizedData = data ? sanitizeLogData(data) : null;
    
    let logMessage = `[${timestamp}] ${level}: ${message}`;
    
    if (sanitizedData) {
        logMessage += ` | Data: ${JSON.stringify(sanitizedData)}`;
    }
    
    return logMessage;
};

/**
 * Logs authentication-related errors
 * @param {string} message - Error message
 * @param {any} data - Additional error data
 */
const logAuthError = (message, data = null) => {
    if (!isLoggingEnabled()) return;
    
    const logMessage = formatLogMessage(LOG_LEVELS.ERROR, `AUTH_ERROR: ${message}`, data);
    console.error(logMessage);
};

/**
 * Logs authentication-related warnings
 * @param {string} message - Warning message
 * @param {any} data - Additional warning data
 */
const logAuthWarning = (message, data = null) => {
    if (!isLoggingEnabled()) return;
    
    const logMessage = formatLogMessage(LOG_LEVELS.WARN, `AUTH_WARNING: ${message}`, data);
    console.warn(logMessage);
};

/**
 * Logs authentication-related information
 * @param {string} message - Info message
 * @param {any} data - Additional info data
 */
const logAuthInfo = (message, data = null) => {
    if (!isLoggingEnabled()) return;
    
    const logMessage = formatLogMessage(LOG_LEVELS.INFO, `AUTH_INFO: ${message}`, data);
    console.log(logMessage);
};

/**
 * Logs cookie configuration issues
 * @param {string} message - Configuration message
 * @param {any} data - Configuration data
 */
const logCookieConfig = (message, data = null) => {
    if (!isLoggingEnabled()) return;
    
    const logMessage = formatLogMessage(LOG_LEVELS.INFO, `COOKIE_CONFIG: ${message}`, data);
    console.log(logMessage);
};

/**
 * Logs security-related events
 * @param {string} message - Security message
 * @param {any} data - Security event data
 */
const logSecurityEvent = (message, data = null) => {
    if (!isLoggingEnabled()) return;
    
    const logMessage = formatLogMessage(LOG_LEVELS.WARN, `SECURITY: ${message}`, data);
    console.warn(logMessage);
};

/**
 * Logs authentication failures for monitoring
 * @param {string} reason - Failure reason
 * @param {any} context - Request context (sanitized)
 */
const logAuthFailure = (reason, context = null) => {
    if (!isLoggingEnabled()) return;
    
    const sanitizedContext = context ? {
        ip: context.ip,
        userAgent: context.userAgent,
        path: context.path,
        method: context.method
    } : null;
    
    const logMessage = formatLogMessage(LOG_LEVELS.WARN, `AUTH_FAILURE: ${reason}`, sanitizedContext);
    console.warn(logMessage);
};

/**
 * Logs successful authentication events
 * @param {string} userId - User ID (for audit trail)
 * @param {any} context - Request context (sanitized)
 */
const logAuthSuccess = (userId, context = null) => {
    if (!isLoggingEnabled()) return;
    
    const sanitizedContext = context ? {
        ip: context.ip,
        userAgent: context.userAgent,
        path: context.path,
        method: context.method
    } : null;
    
    const logMessage = formatLogMessage(LOG_LEVELS.INFO, `AUTH_SUCCESS: User ${userId} authenticated`, sanitizedContext);
    console.log(logMessage);
};

module.exports = {
    LOG_LEVELS,
    logAuthError,
    logAuthWarning,
    logAuthInfo,
    logCookieConfig,
    logSecurityEvent,
    logAuthFailure,
    logAuthSuccess,
    sanitizeLogData,
    formatLogMessage
};