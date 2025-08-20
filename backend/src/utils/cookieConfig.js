/**
 * Cookie Configuration Service
 * Centralized cookie configuration based on environment settings
 */

const getCookieOptions = () => {
    // Get environment variables with secure defaults
    const nodeEnv = process.env.NODE_ENV || 'development'
    const isProduction = nodeEnv === 'production'
    
    // Check if we're in cross-origin development mode
    // (frontend on localhost, backend on remote server)
    const isCrossOriginDev = process.env.CROSS_ORIGIN_DEV === 'true' || 
                            (!isProduction && process.env.SERVICE_URL && process.env.SERVICE_URL.includes('onrender.com'))
    
    if (isCrossOriginDev) {
        console.log('Using cross-origin cookie settings for localhost frontend -> remote backend');
        return {
            httpOnly: true,
            secure: true, // Required for SameSite=None
            sameSite: 'None', // Required for cross-origin cookies
            maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000,
            path: '/'
            // No domain specified - allows cross-origin
        };
    }
    
    // For local development (both FE and BE on localhost)
    if (!isProduction) {
        console.log('Using local development cookie settings');
        return {
            httpOnly: true,
            secure: false, // Allow HTTP in local development
            sameSite: 'Lax',
            maxAge: parseInt(process.env.COOKIE_MAX_AGE) || 86400000,
            path: '/'
        };
    }
    
    // Production settings
    let cookieSecure;
    if (process.env.COOKIE_SECURE === 'auto' || process.env.COOKIE_SECURE === undefined) {
        cookieSecure = true; // Always secure in production
    } else {
        cookieSecure = process.env.COOKIE_SECURE === 'true';
    }
    
    const cookieSameSite = process.env.COOKIE_SAME_SITE || 'Lax'
    const cookieMaxAge = parseInt(process.env.COOKIE_MAX_AGE) || 86400000
    
    const cookieOptions = {
        httpOnly: true,
        secure: cookieSecure,
        sameSite: cookieSameSite,
        maxAge: cookieMaxAge,
        path: '/'
    }
    
    // Set domain in production if specified
    if (process.env.COOKIE_DOMAIN) {
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