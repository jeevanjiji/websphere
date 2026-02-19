# Push Notifications Feature

## Overview
WebSphere now includes a comprehensive push notification system to keep clients and freelancers informed about important deadlines and payment due dates.

## Features

### For Clients
- **Payment Due Date Reminders**
  - 3-day advance notice
  - 1-day urgent reminder
  - Overdue payment alerts
- **Deliverable Status Updates**
  - Notifications when deliverables are overdue
  - Real-time updates on project progress

### For Freelancers
- **Deliverable Deadline Reminders**
  - 3-day advance notice
  - 1-day urgent reminder
  - Overdue deliverable alerts
- **Payment Status Updates**
  - Notifications when payments are overdue
  - Payment confirmation alerts

## Setup Instructions

### Backend Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install node-cron
   ```

2. **Generate VAPID Keys**
   ```bash
   npx web-push generate-vapid-keys
   ```

3. **Configure Environment Variables**
   Add the following to your `.env` file:
   ```
   VAPID_PUBLIC_KEY=your_public_key_here
   VAPID_PRIVATE_KEY=your_private_key_here
   FRONTEND_URL=http://localhost:5173
   ```

4. **Database Migration**
   The following fields have been added to the User and Milestone models:
   - `User.pushSubscription` - Stores browser push subscription
   - `User.notificationPreferences` - User notification settings
   - `Milestone.paymentReminderSent` - Tracks if payment reminder was sent
   - `Milestone.paymentOverdueNotificationSent` - Tracks if overdue notification was sent
   - `Milestone.deliverableReminderSent` - Tracks if deliverable reminder was sent

### Frontend Setup

1. **Service Worker**
   The service worker (`public/sw.js`) is already configured to handle push notifications.

2. **Notification Permission**
   Users will be prompted to enable push notifications upon login. They can also manage settings from the notification settings panel in the navbar.

## Notification Schedule

The system runs automated checks:
- **Production**: Daily at 9:00 AM and 6:00 PM IST
- **Development**: Hourly checks for testing

### Notification Timeline

#### Payment Reminders (for Clients)
- **3 days before**: Friendly reminder
- **1 day before**: Urgent reminder
- **On due date**: Overdue alert

#### Deliverable Reminders (for Freelancers)
- **3 days before**: Preparation reminder
- **1 day before**: Final reminder
- **On due date**: Overdue alert with client notification

## API Endpoints

### Notification Routes (`/api/notifications`)

- `GET /vapid-public-key` - Get VAPID public key
- `POST /subscribe` - Subscribe to push notifications
- `POST /send` - Send push notification (admin/system)
- `GET /preferences` - Get user notification preferences
- `PUT /preferences` - Update notification preferences
- `POST /trigger-due-date-check` - Manual trigger for due date check (admin only)

## User Settings

Users can customize their notification preferences:

1. **Notification Channels**
   - Email notifications
   - Push notifications

2. **Notification Types**
   - Payment reminders
   - Deliverable reminders
   - Due date alerts
   - Overdue alerts

Access settings via the settings icon (⚙️) in the navbar.

## Testing

### Manual Trigger (Admin Only)
```bash
curl -X POST http://localhost:5000/api/notifications/trigger-due-date-check \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

### Test Push Notification
From the notification settings panel, click "Send test notification" to verify your browser can receive push notifications.

## Troubleshooting

### Push Notifications Not Working

1. **Check Browser Support**
   - Push notifications require a modern browser (Chrome 50+, Firefox 44+, Safari 16+)
   - Must be served over HTTPS (or localhost for development)

2. **Check Permissions**
   - Ensure notification permission is granted in browser settings
   - Check if service worker is registered: DevTools > Application > Service Workers

3. **Check VAPID Keys**
   - Ensure VAPID keys are properly configured in backend `.env`
   - Keys must match between backend and stored subscriptions

4. **Check Subscription**
   - Use browser DevTools to check if PushSubscription exists
   - Verify subscription is stored in database

### Email Notifications Not Sending

1. **Check Brevo Configuration**
   - Verify `BREVO_API_KEY` is set in `.env`
   - Check Brevo account email quota

2. **Check Email Templates**
   - Verify SMTP settings if using custom email service

## Architecture

### Backend Components

1. **Job Scheduler** (`backend/jobs/scheduler.js`)
   - Manages cron jobs for automated notifications
   - Configurable schedule for different environments

2. **Notification Job** (`backend/jobs/dueDateNotifications.js`)
   - Checks milestones for upcoming deadlines
   - Sends email and push notifications based on user preferences

3. **Notification Routes** (`backend/routes/notifications.js`)
   - Handles push subscription management
   - User preference updates
   - Manual triggers

### Frontend Components

1. **Push Notification Service** (`frontend/src/services/pushNotificationService.js`)
   - Service worker registration
   - Subscription management
   - Preference management

2. **Notification Settings** (`frontend/src/components/NotificationSettings.jsx`)
   - User interface for managing notification preferences
   - Enable/disable push notifications
   - Customize notification types

3. **Service Worker** (`frontend/public/sw.js`)
   - Handles incoming push events
   - Displays notifications
   - Handles notification clicks

## Security Considerations

1. **VAPID Keys**: Keep private keys secure, never commit to version control
2. **Subscription Data**: Encrypted and stored securely in database
3. **Authentication**: All notification endpoints require authentication
4. **Rate Limiting**: Consider implementing rate limits for notification endpoints

## Future Enhancements

- [ ] Rich notifications with action buttons
- [ ] Notification history/log
- [ ] Customizable notification timing
- [ ] SMS notifications integration
- [ ] Slack/Discord integration
- [ ] Notification templates customization
- [ ] A/B testing for notification effectiveness
- [ ] Analytics dashboard for notification delivery rates

## Support

For issues or questions, contact:
- Email: support@websphere.com
- Documentation: [Link to full docs]

