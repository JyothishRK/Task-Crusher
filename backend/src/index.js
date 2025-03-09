const express = require('express');
const cors = require('cors');
require('./db/mongoose');
const userRouter = require('./routers/user');
const taskRouter = require('./routers/task');

const app = express();
const port = process.env.PORT;

// Enable CORS with all methods allowed
app.use(cors({
    origin: '*', // For development - make more restrictive in production
    methods: '*',  // Allow all methods
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(userRouter);
app.use(taskRouter);

app.listen(port, () => {
    console.log(`Server running at Port ${port}`);
});
