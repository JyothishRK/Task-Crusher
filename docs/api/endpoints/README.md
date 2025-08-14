# API Endpoints

This section documents all available API endpoints in the Task Crusher API.

## Available Endpoints

### [Health](health.md)

- 🔓 `GET /health` - Get all health
- 🔓 `ALL /health` - ALL /health

### [Task](task.md)

- 🔒 `POST /tasks` - Create a new task
- 🔒 `GET /tasks` - Get all tasks
- 🔒 `GET /tasks/:id` - Get a specific task by ID
- 🔒 `PATCH /tasks/:id` - Update a task
- 🔒 `DELETE /tasks/:id` - Delete a task
- 🔒 `GET /tasks/priority/:priority` - Get :priority tasks
- 🔒 `GET /tasks/category/:category` - Get :category tasks
- 🔒 `GET /tasks/overdue` - Get overdue tasks
- 🔒 `GET /tasks/today` - Get today tasks

### [User](user.md)

- 🔓 `POST /users` - Create a new user
- 🔓 `POST /users/login` - Login user
- 🔒 `POST /users/logout` - Logout user
- 🔒 `POST /users/logoutall` - Logoutall user
- 🔒 `POST /users/me/avatar` - Avatar user
- 🔒 `DELETE /users/me/avatar` - Delete a user
- 🔓 `GET /users/:id/avatar` - Get a specific user by ID
- 🔒 `GET /users/me` - Get me users
- 🔒 `PATCH /users/me` - Update a user
- 🔒 `DELETE /users/me` - Delete a user

## Authentication

🔒 = Authentication required
🔓 = No authentication required

For detailed authentication information, see [Authentication Guide](../authentication.md).

