# Data Models

This section documents all data models used in the Task Crusher API.

## Available Models

- [Task](./task.md) - Represents a task item with scheduling, priority, and completion tracking capabilities.
- [User](./user.md) - Represents a user account in the Task Crusher application with authentication and profile information.
- [UserActivity](./useractivity.md) - UserActivity model for the Task Crusher application.

## Model Relationships

The following diagram shows the relationships between models:

```
User (1) -----> (N) Task
  |                 |
  |-- _id           |-- userId (ref: User)
  |-- name          |-- title
  |-- email         |-- description
  |-- password      |-- dueDate
  |-- age           |-- priority
  |-- tokens        |-- category
  |-- avatar        |-- isCompleted
                    |-- repeatType
```

