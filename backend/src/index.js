const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');
const healthRouter = require('./routers/health');
const internalRouter = require('./routers/internal');
const { validateCookieConfig } = require('./utils/cookieConfig');
const { ErrorHandler } = require('./utils/errorHandler');

const app = express();
const port = process.env.PORT;

// Validate cookie configuration on startup
validateCookieConfig();

// Configure CORS for cookie-based authentication
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        // In development, allow all origins
        if (process.env.NODE_ENV === 'development') {
            return callback(null, true);
        }
        
        // In production, you should specify allowed origins
        const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',') : 
            ['http://localhost:3000', 'http://localhost:3001']; // Default dev origins
        
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true, // Essential for cookie-based authentication
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-Requested-With', 'Accept', 'Origin'],
    maxAge: 86400 // 24 hours cache for preflight requests
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Test endpoint to verify API is working
app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!', timestamp: new Date().toISOString() });
});

app.use(express.json());
app.use(cookieParser());
app.use('/api', userRouter);
app.use('/api', taskRouter);
app.use('/internal', internalRouter);
app.use('/', healthRouter);

// Enhanced error handling middleware
app.use(ErrorHandler.middleware());

// 404 handler for unmatched routes
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
    console.log(`Server running at Port ${port}`);
});