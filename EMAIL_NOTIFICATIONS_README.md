# Email Notifications with Nodemailer

This document explains how to set up and use email notifications in the Notion App using Nodemailer.

## Features

- ✅ Email notifications for tasks, meetings, projects, and other events
- ✅ User-configurable email preferences
- ✅ Multiple email service support (Gmail, Outlook, Yahoo, etc.)
- ✅ Beautiful HTML email templates
- ✅ Test email functionality
- ✅ Automatic email sending on notification creation

## Setup Instructions

### 1. Install Dependencies

Nodemailer has already been installed in the server:

```bash
cd server
npm install nodemailer
```

### 2. Configure Environment Variables

Create or update your `server/.env` file with email configuration:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_specific_password
EMAIL_FROM_NAME=Notion App
FRONTEND_URL=http://localhost:3000
```

### 3. Gmail Setup (Recommended)

If using Gmail:

1. Enable 2-factor authentication on your Google account
2. Generate an app-specific password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the generated 16-character password
   - Use this as `EMAIL_PASS` in your .env file

**Note:** Regular Gmail passwords won't work. You MUST use an app-specific password.

### 4. Other Email Services

For other email providers, update these variables:

**Outlook/Hotmail:**

```env
EMAIL_SERVICE=hotmail
EMAIL_HOST=smtp.office365.com
EMAIL_PORT=587
```

**Yahoo:**

```env
EMAIL_SERVICE=yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_PORT=587
```

**Custom SMTP:**

```env
EMAIL_SERVICE=
EMAIL_HOST=smtp.yourdomain.com
EMAIL_PORT=587
EMAIL_SECURE=false
```

## Usage

### Email Service Functions

The email service (`server/services/emailService.js`) provides several functions:

#### 1. Send Custom Email

```javascript
const { sendEmail } = require("./services/emailService");

await sendEmail({
  to: "user@example.com",
  subject: "Hello",
  text: "Plain text message",
  html: "<h1>HTML message</h1>",
});
```

#### 2. Send Notification Email

```javascript
const { sendNotificationEmail } = require("./services/emailService");

await sendNotificationEmail(user, {
  type: "task",
  title: "New Task Assigned",
  message: "You have been assigned a new task",
});
```

#### 3. Send Welcome Email

```javascript
const { sendWelcomeEmail } = require("./services/emailService");

await sendWelcomeEmail(user);
```

#### 4. Send Task Assignment Email

```javascript
const { sendTaskAssignmentEmail } = require("./services/emailService");

await sendTaskAssignmentEmail(user, task, assigner);
```

#### 5. Send Meeting Invitation Email

```javascript
const { sendMeetingInvitationEmail } = require("./services/emailService");

await sendMeetingInvitationEmail(user, meeting, organizer);
```

### API Endpoints

#### Test Email

```bash
POST /api/notifications/test-email
Authorization: Bearer <token>
```

Sends a test email to the authenticated user.

#### Update Email Preferences

```bash
PATCH /api/notifications/email-settings
Authorization: Bearer <token>
Content-Type: application/json

{
  "emailNotifications": true
}
```

### Automatic Email Notifications

Emails are automatically sent when:

1. **New Notification Created** - When a notification is created via `/api/notifications` POST endpoint
2. **User has email configured** - User must have an email in their profile
3. **Email notifications enabled** - User's `preferences.notifications.email` must be `true` (default)

## Email Templates

The system includes pre-built templates for:

- 📧 Meeting invitations
- 📧 Task assignments
- 📧 Project updates
- 📧 Chat messages
- 📧 Goal notifications
- 📧 Welcome emails
- 📧 Password reset (if implemented)

All templates include:

- Professional HTML formatting
- Responsive design
- Clear call-to-action
- Branded header with app name

## User Email Preferences

Users can control email notifications through their preferences:

```javascript
// User model preferences
{
  preferences: {
    notifications: {
      email: true,  // Enable/disable email notifications
      push: true    // Enable/disable push notifications
    }
  }
}
```

## Integration Examples

### In Task Creation

```javascript
// In routes/tasks.js
const task = await Task.create({ ... });

// Create notification
const notification = await Notification.create({
  recipient: assignee._id,
  type: 'task',
  title: 'New Task Assigned',
  message: `${req.user.name} assigned you a task: ${task.title}`
});

// Email is sent automatically via notification route
```

### In Meeting Creation

```javascript
// In routes/meetings.js
const meeting = await Meeting.create({ ... });

// Send to all participants
for (const participantId of meeting.participants) {
  const participant = await User.findById(participantId);

  await Notification.create({
    recipient: participantId,
    type: 'meeting',
    title: 'Meeting Invitation',
    message: `You're invited to: ${meeting.title}`
  });
  // Email sent automatically
}
```

## Troubleshooting

### Emails Not Sending

1. **Check Environment Variables**

   ```bash
   echo $EMAIL_USER
   echo $EMAIL_PASS
   ```

2. **Check Server Logs**

   - Look for "Email service not configured" warning
   - Check for authentication errors

3. **Verify Email Service Settings**

   - Ensure correct SMTP host and port
   - Verify app-specific password (for Gmail)

4. **Test Email Function**
   - Use the `/api/notifications/test-email` endpoint
   - Check response for specific errors

### Gmail Issues

- **"Invalid credentials"** - Use app-specific password, not regular password
- **"Less secure app access"** - Not needed with app-specific passwords
- **"Username and Password not accepted"** - Regenerate app-specific password

### User Not Receiving Emails

1. Check user has email in profile
2. Verify email notifications enabled: `user.preferences.notifications.email === true`
3. Check spam/junk folder
4. Verify email address is correct

## Security Best Practices

1. ✅ Never commit `.env` file to version control
2. ✅ Use app-specific passwords (not regular passwords)
3. ✅ Enable 2FA on email accounts
4. ✅ Use environment variables for all sensitive data
5. ✅ Implement rate limiting on email endpoints
6. ✅ Validate recipient email addresses
7. ✅ Log email failures but not sensitive data

## Testing

### Local Testing

1. Configure `.env` with valid email credentials
2. Start the server: `npm start`
3. Use test endpoint:
   ```bash
   curl -X POST http://localhost:9000/api/notifications/test-email \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

### Production Testing

1. Use a dedicated email account for sending
2. Test with multiple recipient addresses
3. Monitor email delivery rates
4. Check spam score of emails

## Performance Considerations

- Email sending is non-blocking (uses try-catch)
- Failed emails don't prevent notification creation
- Consider implementing email queue for high volume
- Monitor email service rate limits

## Future Enhancements

- [ ] Email queue system (Bull, Bee-Queue)
- [ ] Email templates with variables
- [ ] Batch email sending
- [ ] Email tracking and analytics
- [ ] Scheduled email notifications
- [ ] Rich email attachments
- [ ] Unsubscribe functionality
- [ ] Email digest (daily/weekly summaries)

## Support

For issues or questions:

1. Check server logs
2. Verify email service configuration
3. Test with simple email first
4. Check email service documentation

## Files Modified/Created

- ✅ `server/services/emailService.js` - Email service
- ✅ `server/routes/notifications.js` - Email integration
- ✅ `server/models/User.js` - Email preferences
- ✅ `env.example` - Email configuration
- ✅ `EMAIL_NOTIFICATIONS_README.md` - This documentation
