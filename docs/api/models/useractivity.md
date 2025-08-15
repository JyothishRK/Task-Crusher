# UserActivity Model

UserActivity model for the Task Crusher application.

## Table of Contents

- [Fields](#fields)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Example](#example)

## Fields

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| **userId** | ObjectId (→ User) | ✅ Yes | - | - | userId field |
| **action** | String | ✅ Yes | - | - | action field |
| **taskId** | ObjectId (→ Task) | ❌ No | - | - | taskId field |
| **message** | String | ✅ Yes | - | - | message field |
| **error** | String | ❌ No | - | - | error field |
| **timestamp** | Date | ❌ No | `Date.now` | - | timestamp field |

## Relationships

### userId

**Type:** reference
**Related Model:** User
**Description:** Reference to User model

### taskId

**Type:** reference
**Related Model:** Task
**Description:** Reference to Task model

## Indexes

The following indexes are defined for performance optimization:

1. `userId: 1, timestamp: -1` - Index on userId: 1, timestamp: -1
2. `userId: 1, action: 1` - Index on userId: 1, action: 1
3. `userId: 1, action: 1, timestamp: -1` - Index on userId: 1, action: 1, timestamp: -1

## Example

Example UserActivity document:

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "action": "Example action",
  "taskId": "507f1f77bcf86cd799439011",
  "message": "Example message",
  "error": "Example error",
  "timestamp": "Date.now",
  "_id": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

