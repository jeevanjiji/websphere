# Profile Management API Documentation

This document describes the comprehensive profile management API endpoints for the WebSphere application.

## Base URL
All endpoints are prefixed with `/api/profile`

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints Overview

### Account Settings
- `GET /settings` - Get all account settings
- `PATCH /basic-info` - Update basic profile information
- `PATCH /email` - Update email address
- `PATCH /password` - Change password

### Preferences & Privacy
- `PATCH /notifications` - Update notification preferences
- `PATCH /privacy` - Update privacy settings
- `PATCH /preferences` - Update account preferences

### Security & History
- `GET /login-history` - Get login history
- `PATCH /two-factor` - Enable/disable two-factor authentication

### Image Management
- `PATCH /picture` - Update profile picture

---

## Detailed Endpoint Documentation

### GET /settings
Get all account settings for the authenticated user.

**Response:**
```json
{
  "success": true,
  "settings": {
    "phoneNumber": "+1234567890",
    "notificationSettings": {
      "email": {
        "projectUpdates": true,
        "messages": true,
        "proposals": true,
        "marketing": false,
        "weeklyDigest": true
      },
      "push": {
        "projectUpdates": true,
        "messages": true,
        "proposals": true
      },
      "sms": {
        "enabled": false,
        "urgentOnly": true
      }
    },
    "privacySettings": {
      "profileVisibility": "public",
      "showEmail": false,
      "showPhone": false,
      "showLocation": true,
      "showOnlineStatus": true,
      "allowDirectMessages": true,
      "showInSearchResults": true
    },
    "preferences": {
      "language": "en",
      "timezone": "UTC",
      "currency": "USD",
      "dateFormat": "MM/DD/YYYY",
      "theme": "light"
    },
    "twoFactorEnabled": false,
    "lastPasswordChange": "2025-01-10T12:00:00.000Z",
    "lastLoginAt": "2025-01-10T12:00:00.000Z"
  },
  "profile": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phoneNumber": "+1234567890",
    "location": "New York, NY",
    "profilePicture": "https://cloudinary.com/..."
  }
}
```

### PATCH /basic-info
Update basic profile information.

**Request Body:**
```json
{
  "fullName": "John Doe",
  "phoneNumber": "+1234567890",
  "location": "New York, NY"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Basic information updated successfully",
  "profile": {
    "fullName": "John Doe",
    "phoneNumber": "+1234567890",
    "location": "New York, NY"
  }
}
```

### PATCH /email
Update email address (requires password verification).

**Request Body:**
```json
{
  "newEmail": "newemail@example.com",
  "password": "currentpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email address updated successfully. Please verify your new email address.",
  "email": "newemail@example.com",
  "isVerified": false
}
```

### PATCH /password
Change password (requires current password).

**Request Body:**
```json
{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123",
  "confirmPassword": "newpassword123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password updated successfully",
  "lastPasswordChange": "2025-01-10T12:00:00.000Z"
}
```

### PATCH /notifications
Update notification preferences.

**Request Body:**
```json
{
  "email": {
    "projectUpdates": true,
    "messages": true,
    "proposals": true,
    "marketing": false,
    "weeklyDigest": true
  },
  "push": {
    "projectUpdates": true,
    "messages": false,
    "proposals": true
  },
  "sms": {
    "enabled": true,
    "urgentOnly": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Notification settings updated successfully",
  "notificationSettings": { /* updated settings */ }
}
```

### PATCH /privacy
Update privacy settings.

**Request Body:**
```json
{
  "profileVisibility": "private",
  "showEmail": true,
  "showPhone": false,
  "showLocation": true,
  "showOnlineStatus": false,
  "allowDirectMessages": true,
  "showInSearchResults": false
}
```

**Valid values:**
- `profileVisibility`: "public", "private", "freelancers-only", "clients-only"
- All other fields: boolean

**Response:**
```json
{
  "success": true,
  "message": "Privacy settings updated successfully",
  "privacySettings": { /* updated settings */ }
}
```

### PATCH /preferences
Update account preferences.

**Request Body:**
```json
{
  "language": "es",
  "timezone": "America/New_York",
  "currency": "EUR",
  "dateFormat": "DD/MM/YYYY",
  "theme": "dark"
}
```

**Valid values:**
- `dateFormat`: "MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"
- `theme`: "light", "dark", "auto"

**Response:**
```json
{
  "success": true,
  "message": "Account preferences updated successfully",
  "preferences": { /* updated preferences */ }
}
```

### GET /login-history
Get login history for the authenticated user.

**Response:**
```json
{
  "success": true,
  "loginHistory": [
    {
      "ip": "192.168.1.1",
      "userAgent": "Mozilla/5.0...",
      "location": "New York, US",
      "timestamp": "2025-01-10T12:00:00.000Z"
    }
  ],
  "lastLoginAt": "2025-01-10T12:00:00.000Z",
  "lastLoginIP": "192.168.1.1"
}
```

### PATCH /two-factor
Enable or disable two-factor authentication.

**Request Body:**
```json
{
  "enabled": true,
  "password": "currentpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Two-factor authentication enabled successfully",
  "twoFactorEnabled": true
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Error description"
}
```

Common HTTP status codes:
- `400` - Bad Request (validation errors, missing fields)
- `401` - Unauthorized (invalid or missing token)
- `404` - Not Found (user not found)
- `500` - Internal Server Error

## Security Features

1. **Password Verification**: Email changes and 2FA settings require password verification
2. **Account Locking**: Failed login attempts are tracked and accounts are locked after 5 failures
3. **Login History**: Last 10 login sessions are tracked with IP and location
4. **Privacy Controls**: Users can control what information is visible publicly
5. **Validation**: All inputs are validated for security and data integrity

## Usage Examples

### Frontend Integration
```javascript
// Update notification settings
const updateNotifications = async (settings) => {
  const response = await fetch('/api/profile/notifications', {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
  return response.json();
};

// Get account settings
const getSettings = async () => {
  const response = await fetch('/api/profile/settings', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
};
```

This API provides comprehensive profile management functionality while maintaining security and data integrity.
