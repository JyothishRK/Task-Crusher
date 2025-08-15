/**
 * Comprehensive Error Handler for Enhanced Task Management System
 * Provides standardized error handling, logging, and response formatting
 */

/**
 * Standard error codes for the application
 */
const ERROR_CODES = {
    // Validation Errors
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    INVALID_INPUT: 'INVALID_INPUT',
    MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
    
    // Task-specific Errors
    TASK_NOT_FOUND: 'TASK_NOT_FOUND',
    PARENT_TASK_NOT_FOUND: 'PARENT_TASK_NOT_FOUND',
    INVALID_SUB_TASK: 'INVALID_SUB_TASK',
    REPEAT_TYPE_CHANGE_NOT_ALLOWED: 'REPEAT_TYPE_CHANGE_NOT_ALLOWED',
    SUB_TASK_DUE_DATE_INVALID: 'SUB_TASK_DUE_DATE_INVALID',
    
    // Counter Service Errors
    COUNTER_GENERATION_FAILED: 'COUNTER_GENERATION_FAILED',
    INVALID_COLLECTION_NAME: 'INVALID_COLLECTION_NAME',
    
    // Worker Errors
    WORKER_PROCESSING_FAILED: 'WORKER_PROCESSING_FAILED',
    RECURRENCE_GENERATION_FAILED: 'RECURRENCE_GENERATION_FAILED',
    WORKER_SERVICE_UNAVAILABLE: 'WORKER_SERVICE_UNAVAILABLE',
    
    // Authentication/Authorization Errors
    UNAUTHORIZED: 'UNAUTHORIZED',
    ACCESS_DENIED: 'ACCESS_DENIED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    
    // Database Errors
    DATABASE_ERROR: 'DATABASE_ERROR',
    CONNECTION_ERROR: 'CONNECTION_ERROR',
    DUPLICATE_KEY_ERROR: 'DUPLICATE_KEY_ERROR',
    
    // Internal Errors
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE'
};

/**
 * Custom error class for application-specific errors
 */
class AppError extends Error {
    constructor(message, code = ERROR_CODES.INTERNAL_SERVER_ERROR, statusCode = 500, details = null) {
        super(message);
        this.name = 'AppError';
        this.code = code;
        this.statusCode = statusCode;
        this.details = details;
        this.timestamp = new Date();
        
        // Capture stack trace
        Error.captureStackTrace(this, AppError);
    }
}

/**
 * Error Handler utility class
 */
class ErrorHandler {
    /**
     * Create a validation error
     */
    static validationError(message, details = null) {
        return new AppError(message, ERROR_CODES.VALIDATION_ERROR, 400, details);
    }
    
    /**
     * Create a task not found error
     */
    static taskNotFound(taskId = null) {
        const message = taskId ? `Task with ID ${taskId} not found` : 'Task not found';
        return new AppError(message, ERROR_CODES.TASK_NOT_FOUND, 404);
    }
    
    /**
     * Create a parent task not found error
     */
    static parentTaskNotFound(parentId) {
        return new AppError(
            `Parent task with ID ${parentId} not found`,
            ERROR_CODES.PARENT_TASK_NOT_FOUND,
            400
        );
    }
    
    /**
     * Create an invalid sub-task error
     */
    static invalidSubTask(reason) {
        return new AppError(
            `Invalid sub-task: ${reason}`,
            ERROR_CODES.INVALID_SUB_TASK,
            400
        );
    }
    
    /**
     * Create a repeat type change error
     */
    static repeatTypeChangeNotAllowed() {
        return new AppError(
            'Cannot change repeatType on existing tasks',
            ERROR_CODES.REPEAT_TYPE_CHANGE_NOT_ALLOWED,
            400
        );
    }
    
    /**
     * Create a counter generation error
     */
    static counterGenerationFailed(collectionName, originalError) {
        return new AppError(
            `Failed to generate ID for ${collectionName}`,
            ERROR_CODES.COUNTER_GENERATION_FAILED,
            500,
            { originalError: originalError.message }
        );
    }
    
    /**
     * Create a worker processing error
     */
    static workerProcessingFailed(operation, originalError) {
        return new AppError(
            `Worker processing failed for operation: ${operation}`,
            ERROR_CODES.WORKER_PROCESSING_FAILED,
            500,
            { operation, originalError: originalError.message }
        );
    }
    
    /**
     * Create an unauthorized error
     */
    static unauthorized(message = 'Unauthorized access') {
        return new AppError(message, ERROR_CODES.UNAUTHORIZED, 401);
    }
    
    /**
     * Create an access denied error
     */
    static accessDenied(resource = 'resource') {
        return new AppError(
            `Access denied to ${resource}`,
            ERROR_CODES.ACCESS_DENIED,
            403
        );
    }
    
    /**
     * Create a database error
     */
    static databaseError(originalError) {
        let code = ERROR_CODES.DATABASE_ERROR;
        let message = 'Database operation failed';
        
        // Handle specific MongoDB errors
        if (originalError.code === 11000) {
            code = ERROR_CODES.DUPLICATE_KEY_ERROR;
            message = 'Duplicate key error';
        }
        
        return new AppError(message, code, 500, {
            originalError: originalError.message,
            mongoCode: originalError.code
        });
    }
    
    /**
     * Handle and format errors for API responses
     */
    static handleError(error, req = null, includeStack = false) {
        const errorResponse = {
            success: false,
            error: {
                message: error.message || 'An unexpected error occurred',
                code: error.code || ERROR_CODES.INTERNAL_SERVER_ERROR,
                timestamp: error.timestamp || new Date()
            }
        };
        
        // Add details if available
        if (error.details) {
            errorResponse.error.details = error.details;
        }
        
        // Add stack trace in development
        if (includeStack && process.env.NODE_ENV === 'development') {
            errorResponse.error.stack = error.stack;
        }
        
        // Add request context if available
        if (req) {
            errorResponse.error.path = req.path;
            errorResponse.error.method = req.method;
        }
        
        return errorResponse;
    }
    
    /**
     * Log error with appropriate level
     */
    static logError(error, context = {}) {
        const logData = {
            message: error.message,
            code: error.code,
            statusCode: error.statusCode,
            timestamp: error.timestamp || new Date(),
            stack: error.stack,
            ...context
        };
        
        // Use different log levels based on error type
        if (error.statusCode >= 500) {
            console.error('CRITICAL ERROR:', logData);
        } else if (error.statusCode >= 400) {
            console.warn('CLIENT ERROR:', logData);
        } else {
            console.log('ERROR:', logData);
        }
    }
    
    /**
     * Express error handling middleware
     */
    static middleware() {
        return (error, req, res, next) => {
            // Log the error
            ErrorHandler.logError(error, {
                path: req.path,
                method: req.method,
                userId: req.user?._id,
                ip: req.ip
            });
            
            // Handle different error types
            let appError;
            
            if (error instanceof AppError) {
                appError = error;
            } else if (error.name === 'ValidationError') {
                appError = ErrorHandler.validationError(error.message, error.errors);
            } else if (error.name === 'CastError') {
                appError = ErrorHandler.validationError('Invalid ID format');
            } else if (error.code === 11000) {
                appError = ErrorHandler.databaseError(error);
            } else {
                appError = new AppError(
                    error.message || 'Internal server error',
                    ERROR_CODES.INTERNAL_SERVER_ERROR,
                    500
                );
            }
            
            // Send error response
            const errorResponse = ErrorHandler.handleError(
                appError,
                req,
                process.env.NODE_ENV === 'development'
            );
            
            res.status(appError.statusCode).json(errorResponse);
        };
    }
    
    /**
     * Async wrapper to catch errors in async route handlers
     */
    static asyncWrapper(fn) {
        return (req, res, next) => {
            Promise.resolve(fn(req, res, next)).catch(next);
        };
    }
    
    /**
     * Retry mechanism for operations that might fail temporarily
     */
    static async retry(operation, maxRetries = 3, delay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                
                if (attempt === maxRetries) {
                    break;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay * attempt));
            }
        }
        
        throw new AppError(
            `Operation failed after ${maxRetries} attempts`,
            ERROR_CODES.SERVICE_UNAVAILABLE,
            503,
            { originalError: lastError.message, attempts: maxRetries }
        );
    }
    
    /**
     * Graceful degradation wrapper
     */
    static async gracefulDegradation(operation, fallback = null, logError = true) {
        try {
            return await operation();
        } catch (error) {
            if (logError) {
                ErrorHandler.logError(error, { context: 'graceful_degradation' });
            }
            
            if (typeof fallback === 'function') {
                return await fallback();
            }
            
            return fallback;
        }
    }
}

module.exports = {
    ErrorHandler,
    AppError,
    ERROR_CODES
};