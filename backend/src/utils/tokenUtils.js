/**
 * Token Management Utilities
 * Helper functions for cookie-based token operations
 */

const { getCookieOptions, getTokenCookieName } = require('./cookieConfig');
const { logAuthError, logAuthWarning, logSecurityEvent } = require('./logger');

/**
 * Sets authentication token as HTTP-only cookie
 * @param {Response} res - Express response object
 * @param {string} token - JWT token to set in cookie
 */
const setAuthCookie = (res, token) => {
    try {
        if (!res || typeof res.cookie !== 'function') {
            logAuthError('Invalid response object provided to setAuthCookie');
            throw new Error('Invalid response object provided to setAuthCookie');
        }
        
        if (!token || typeof token !== 'string') {
            logAuthError('Invalid token provided to setAuthCookie');
            throw new Error('Invalid token provided to setAuthCookie');
        }
        
        const cookieName = getTokenCookieName();
        const cookieOptions = getCookieOptions();
        
        res.cookie(cookieName, token, cookieOptions);
        
        // Log successful cookie setting (without token value)
        logAuthWarning('Authentication cookie set successfully');
        
    } catch (error) {
        logAuthError('Failed to set authentication cookie', { error: error.message });
        throw error;
    }
};

/**
 * Clears authentication cookie by setting it to expire immediately
 * @param {Response} res - Express response object
 */
const clearAuthCookie = (res) => {
    try {
        if (!res || typeof res.clearCookie !== 'function') {
            logAuthError('Invalid response object provided to clearAuthCookie');
            throw new Error('Invalid response object provided to clearAuthCookie');
        }
        
        const cookieName = getTokenCookieName();
        const cookieOptions = getCookieOptions();
        
        // Clear the cookie by setting it to expire immediately
        res.clearCookie(cookieName, {
            httpOnly: cookieOptions.httpOnly,
            secure: cookieOptions.secure,
            sameSite: cookieOptions.sameSite,
            path: cookieOptions.path
        });
        
        // Log successful cookie clearing
        logAuthWarning('Authentication cookie cleared successfully');
        
    } catch (error) {
        logAuthError('Failed to clear authentication cookie', { error: error.message });
        throw error;
    }
};

/**
 * Extracts JWT token from request cookies
 * @param {Request} req - Express request object
 * @returns {string|null} - JWT token if found, null otherwise
 */
const extractTokenFromRequest = (req) => {
    try {
        if (!req || !req.cookies) {
            logSecurityEvent('Request without cookies object', { 
                path: req?.path, 
                hasReq: !!req,
                hasCookies: !!(req && req.cookies)
            });
            return null;
        }
        
        const cookieName = getTokenCookieName();
        const token = req.cookies[cookieName];
        
        if (!token) {
            logSecurityEvent('Authentication cookie not found', { 
                path: req.path,
                cookieName: cookieName,
                availableCookies: Object.keys(req.cookies)
            });
        }
        
        return token || null;
        
    } catch (error) {
        logAuthError('Error extracting token from request', { error: error.message });
        return null;
    }
};

/**
 * Validates that a token exists and is a non-empty string
 * @param {string} token - Token to validate
 * @returns {boolean} - True if token is valid, false otherwise
 */
const isValidToken = (token) => {
    return !!(token && typeof token === 'string' && token.trim().length > 0);
};

module.exports = {
    setAuthCookie,
    clearAuthCookie,
    extractTokenFromRequest,
    isValidToken
};