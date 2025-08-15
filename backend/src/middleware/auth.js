const jwt = require('jsonwebtoken')
const User = require('../models/user')
const { extractTokenFromRequest, isValidToken } = require('../utils/tokenUtils')
const { logAuthError, logAuthFailure, logAuthSuccess, logSecurityEvent } = require('../utils/logger')

const auth = async (req, res, next) => {
    try {
        // Extract token from HTTP-only cookie
        const token = extractTokenFromRequest(req)
        
        // Validate token exists and is valid format
        if (!isValidToken(token)) {
            const context = {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method
            };
            
            logAuthFailure('No valid authentication token found', context);
            logSecurityEvent('Authentication attempt without valid token', { path: req.path });
            throw new Error('No valid authentication token found')
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        
        // Find user with matching token
        const user = await User.findOne({_id : decoded._id, 'tokens.token' : token})

        if(!user) {
            const context = {
                ip: req.ip || req.connection?.remoteAddress,
                userAgent: req.get('User-Agent'),
                path: req.path,
                method: req.method,
                userId: decoded._id
            };
            
            logAuthFailure('User not found or token invalid', context);
            logSecurityEvent('Authentication with invalid user or token', { userId: decoded._id });
            throw new Error('User not found or token invalid')
        }

        // Log successful authentication
        const context = {
            ip: req.ip || req.connection?.remoteAddress,
            userAgent: req.get('User-Agent'),
            path: req.path,
            method: req.method
        };
        
        logAuthSuccess(user._id.toString(), context);

        // Attach token and user to request object
        req.token = token
        req.user = user
        next()
    } catch(e) {
        // Log error for debugging (without exposing sensitive info)
        if (e.name === 'JsonWebTokenError') {
            logAuthError('JWT verification failed', { error: e.message });
            logSecurityEvent('Invalid JWT token used', { path: req.path });
        } else if (e.name === 'TokenExpiredError') {
            logAuthError('JWT token expired', { error: e.message });
        } else {
            logAuthError('Authentication failed', { error: e.message });
        }
        
        res.status(401).send({error : "Error! Please Authenticate"})
    }
}

module.exports = auth