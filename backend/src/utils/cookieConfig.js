/**
 * Cookie Configuration Service
 * Centralized cookie configuration based on environment settings
 */

const getCookieOptions = () => {
    // Get environment variables with secure defaults
    const nodeEnv = process.env.NODE_ENV || 'development'
    const isProduction = nodeEnv === 'production'
    
    // Auto-detect secure flag based on environment if not explicitly set
    let cookieSecure;
    if (process.env.COOKIE_SECURE === 'auto' || process.env.COOKIE_SECURE === undefined) {
        cookieSecure = isProduction;
    } else {
        cookieSecure = process.env.COOKIE_SECURE === 'true';
    }
    
    // Default to Lax for good balance of security and functionality
    const cookieSameSite = process.env.COOKIE_SAME_SITE || 'Lax'
    
    // Default to 24 hours (86400000 milliseconds)
    const cookieMaxAge = parseInt(process.env.COOKIE_MAX_AGE) || 86400000
    
    // Configure domain based on environment
    const cookieOptions = {
        httpOnly: true, // Always true for security
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: cookieMaxAge,
        path: '/' // Available for all routes
    }
    
    // Only set domain in production to avoid localhost issues
    if (isProduction && process.env.COOKIE_DOMAIN) {
        cookieOptions.domain = process.env.COOKIE_DOMAIN;
    }
    
    return cookieOptions;
}

const getTokenCookieName = () => {
    return process.env.COOKIE_NAME || 'auth_token'
}

/**
 * Validates cookie configuration and logs warnings for invalid settings
 */
const validateCookieConfig = () => {
    const { logCookieConfig, logAuthWarning, logSecurityEvent } = require('./logger');
    
    const validSameSiteValues = ['Strict', 'Lax', 'None']
    const sameSite = process.env.COOKIE_SAME_SITE
    
    if (sameSite && !validSameSiteValues.includes(sameSite)) {
        const message = `Invalid COOKIE_SAME_SITE value: ${sameSite}. Using default 'Lax'`;
        logAuthWarning(message);
        console.warn(message);
    }
    
    const maxAge = process.env.COOKIE_MAX_AGE
    if (maxAge && (isNaN(parseInt(maxAge)) || parseInt(maxAge) <= 0)) {
        const message = `Invalid COOKIE_MAX_AGE value: ${maxAge}. Using default 86400000 (24 hours)`;
        logAuthWarning(message);
        console.warn(message);
    }
    
    const nodeEnv = process.env.NODE_ENV
    if (nodeEnv === 'production' && process.env.COOKIE_SECURE === 'false') {
        const message = 'COOKIE_SECURE is set to false in production environment. This is not recommended for security.';
        logSecurityEvent(message);
        console.warn(message);
    }
    
    // Log successful configuration
    const config = getCookieOptions();
    logCookieConfig('Cookie configuration validated', {
        cookieName: getTokenCookieName(),
        httpOnly: config.httpOnly,
        secure: config.secure,
        sameSite: config.sameSite,
        maxAge: config.maxAge,
        environment: nodeEnv
    });
}

module.exports = {
    getCookieOptions,
    getTokenCookieName,
    validateCookieConfig
}