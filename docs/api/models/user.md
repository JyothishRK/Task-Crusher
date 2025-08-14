# User Model

Represents a user account in the Task Crusher application with authentication and profile information.

## Table of Contents

- [Fields](#fields)
- [Methods](#methods)
- [Relationships](#relationships)
- [Middleware](#middleware)
- [Example](#example)

## Fields

| Field | Type | Required | Default | Constraints | Description |
|-------|------|----------|---------|-------------|-------------|
| **name** | String | ✅ Yes | - | - | name field |
| **password** | String | ✅ Yes | - | min: 7, custom validation | password field |
| **email** | String | ✅ Yes | - | custom validation | email field |
| **age** | Number | ❌ No | `0` | custom validation | age field |
| **emailEnabled** | Boolean | ❌ No | `true` | - | emailEnabled field |
| **notificationTime** | String | ❌ No | `09:00` | custom validation | notificationTime field |
| **tokens** | Array | ✅ Yes | - | - | tokens field |
| **avatar** | Buffer | ❌ No | - | - | avatar field |

## Methods

### toJSON()

**Type:** instance method

Instance method: toJSON

**Returns:** `Mixed`

### findByCredentials()

**Type:** static method

Static method: findByCredentials

**Returns:** `Mixed`

## Relationships

### tasks

**Type:** virtual
**Related Model:** Task
**Local Field:** _id
**Foreign Field:** userId
**Description:** Virtual relationship to Task

## Middleware

The following middleware hooks are defined:

- **pre-save**: Pre-save middleware
- **pre-deleteOne**: Pre-deleteOne middleware

## Example

Example User document:

```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "age": "0",
  "emailEnabled": "true",
  "notificationTime": "09:00",
  "avatar": null,
  "_id": "507f1f77bcf86cd799439011",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

