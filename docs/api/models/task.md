# Task Model

Represents a task item with scheduling, priority, and completion tracking capabilities.

## Table of Contents

- [Fields](#fields)
- [Methods](#methods)
- [Relationships](#relationships)
- [Indexes](#indexes)
- [Virtual Properties](#virtual-properties)
- [Middleware](#middleware)
- [Example](#example)

## Fields

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| **userId** | ObjectId (→ User) | ✅ Yes | - | - | userId field |
| **title** | String | ✅ Yes | - | min: 1 | title field |
| **description** | String | ❌ No | - | - | description field |
| **dueDate** | Date | ✅ Yes | - | - | dueDate field |
| **priority** | String | ❌ No | `medium` | enum: [low, medium, high] | priority field |
| **category** | String | ❌ No | - | - | category field |
| **isCompleted** | Boolean | ❌ No | `false` | - | isCompleted field |
| **repeatType** | String | ❌ No | `none` | enum: [none, daily, weekly, monthly] | repeatType field |

## Methods

### isOverdue()

**Type:** instance method

Instance method: isOverdue

**Returns:** `Mixed`

### daysUntilDue()

**Type:** instance method

Instance method: daysUntilDue

**Returns:** `Mixed`

## Relationships

### userId

**Type:** reference
**Related Model:** User
**Description:** Reference to User model

## Indexes

The following indexes are defined for performance optimization:

1. `userId: 1, dueDate: 1` - Index on userId: 1, dueDate: 1
2. `userId: 1, isCompleted: 1` - Index on userId: 1, isCompleted: 1
3. `userId: 1, priority: 1` - Index on userId: 1, priority: 1
4. `userId: 1, category: 1` - Index on userId: 1, category: 1

## Virtual Properties

### dueDateFormatted

**Type:** getter
**Description:** Virtual property: dueDateFormatted

## Middleware

The following middleware hooks are defined:

- **pre-save**: Pre-save middleware

## Example

Example Task document:

```json
{
  "userId": "507f1f77bcf86cd799439011",
  "title": "Complete project documentation",
  "description": "",
  "dueDate": "2024-01-20T09:00:00.000Z",
  "priority": "medium",
  "category": "",
  "isCompleted": "false",
  "repeatType": "none",
  "_id": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

