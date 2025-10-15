# Email Notifications - Quick Reference Card

## 🔧 Setup (One-time)

### 1. Install (Already done)

```bash
cd server
npm install nodemailer
```

### 2. Configure `.env` in server folder

```env
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
EMAIL_FROM_NAME=Notion App
FRONTEND_URL=http://localhost:3000
```

### 3. Get Gmail App Password

1. Enable 2FA: https://myaccount.google.com/security
2. Create app password: https://myaccount.google.com/apppasswords
3. Copy 16-char password to EMAIL_PASS

## 📧 Send Emails (Backend)

### Import

```javascript
const {
  sendEmail,
  sendNotificationEmail,
  sendWelcomeEmail,
  sendTaskAssignmentEmail,
  sendMeetingInvitationEmail,
} = require("../services/emailService");
```

### Custom Email

```javascript
await sendEmail({
  to: "user@example.com",
  subject: "Subject Line",
  text: "Plain text",
  html: "<h1>HTML content</h1>",
});
```

### Notification Email (Auto-styled)

```javascript
await sendNotificationEmail(user, {
  type: "task", // meeting, project, chat, goal
  title: "Notification Title",
  message: "Notification message",
});
```

### Welcome Email

```javascript
await sendWelcomeEmail(user);
```

### Task Assignment

```javascript
await sendTaskAssignmentEmail(assignee, task, assigner);
```

### Meeting Invitation

```javascript
await sendMeetingInvitationEmail(participant, meeting, organizer);
```

## 🔌 API Endpoints

### Test Email

```bash
POST /api/notifications/test-email
Headers: x-auth-token: <token>
```

### Update Email Settings

```bash
PATCH /api/notifications/email-settings
Headers:
  x-auth-token: <token>
  Content-Type: application/json
Body:
{
  "emailNotifications": true
}
```

### Create Notification (Auto-sends email)

```bash
POST /api/notifications
Headers:
  x-auth-token: <token>
  Content-Type: application/json
Body:
{
  "recipientId": "user123",
  "type": "task",
  "title": "New Task",
  "message": "You have a new task"
}
```

## 🎨 Email Templates

| Type      | Subject Pattern               | Use Case           |
| --------- | ----------------------------- | ------------------ |
| `meeting` | "Meeting Invitation: [title]" | Meeting invites    |
| `task`    | "New Task Assigned: [title]"  | Task assignments   |
| `project` | "Project Update: [title]"     | Project updates    |
| `chat`    | "New Message: [title]"        | Chat messages      |
| `goal`    | "Goal Update: [title]"        | Goal notifications |
| `default` | "[title]"                     | Fallback           |

## 👤 User Email Settings

### Check if user has email

```javascript
if (user.email && user.emailNotifications) {
  await sendNotificationEmail(user, notification);
}
```

### Access preferences

```javascript
// Via virtual property
user.emailNotifications; // Boolean

// Direct access
user.preferences.notifications.email; // Boolean
```

## 🧪 Testing

### Frontend Test

1. Login → Settings → Preferences
2. Enable email notifications
3. Click "Test Email"
4. Check inbox

### Backend Test (Node)

```javascript
const user = await User.findById(userId);
await sendNotificationEmail(user, {
  type: "system",
  title: "Test",
  message: "This is a test",
});
```

## 🔍 Debugging

### Check if configured

```javascript
// Logs warning if not configured
const transporter = createTransporter();
```

### Server logs

```bash
# Success
Email sent: <message-id>

# Not configured
Email service not configured, skipping email send

# Error
Error sending email: <error-message>
```

### Common fixes

```bash
# Verify .env exists
ls server/.env

# Check environment variables
node -e "require('dotenv').config({path:'server/.env'}); console.log(process.env.EMAIL_USER)"

# Test SMTP connection
npm test # (if test script exists)
```

## ⚡ Quick Integration

### In any route:

```javascript
// 1. Import
const { sendNotificationEmail } = require("../services/emailService");

// 2. Get user
const user = await User.findById(recipientId);

// 3. Send (auto-checks preferences)
if (user.email && user.emailNotifications) {
  await sendNotificationEmail(user, {
    type: "task",
    title: "New Task",
    message: `${req.user.name} assigned you a task`,
  });
}
```

## 📋 Checklist for New Feature

- [ ] Import email service
- [ ] Get recipient user
- [ ] Check user has email
- [ ] Check user has email notifications enabled
- [ ] Call appropriate email function
- [ ] Wrap in try-catch (non-critical)
- [ ] Log errors, don't fail request

## 🚨 Error Handling

```javascript
try {
  await sendNotificationEmail(user, notification);
} catch (error) {
  console.error("Email failed:", error);
  // Don't fail the request
}
```

## 🔐 Security

✅ Use app passwords (Gmail)
✅ Store credentials in .env
✅ Never commit .env
✅ Validate email addresses
✅ Rate limit email endpoints
❌ Don't log passwords/credentials

## 📁 File Locations

```
server/
  services/
    emailService.js        # Main email service
  routes/
    notifications.js       # Email endpoints
  models/
    User.js               # Email preferences
  .env                    # Email config (create this)

src/
  components/
    SettingsPage/
      PreferencesTab.js   # Email toggle & test
      ProfileTab.js       # Email address field
```

## 🔗 Documentation

- Full docs: `EMAIL_NOTIFICATIONS_README.md`
- Setup guide: `EMAIL_SETUP_GUIDE.md`
- Summary: `NODEMAILER_IMPLEMENTATION_SUMMARY.md`
- This file: `EMAIL_QUICK_REFERENCE.md`

---

**Need help?** Check the detailed documentation files above.
