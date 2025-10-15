# SMS Notifications Setup Guide

This guide will help you set up SMS notifications for your Notion App using Twilio.

## Prerequisites

1. A Twilio account (sign up at https://www.twilio.com)
2. A verified phone number in Twilio
3. Twilio Account SID, Auth Token, and Phone Number

## Setup Steps

### 1. Create Twilio Account

1. Go to https://www.twilio.com and sign up for a free account
2. Verify your email and phone number
3. Complete the account setup process

### 2. Get Twilio Credentials

1. Log in to your Twilio Console
2. Find your **Account SID** and **Auth Token** on the dashboard
3. Go to Phone Numbers → Manage → Active numbers
4. Note your Twilio phone number (format: +1234567890)

### 3. Configure Environment Variables

Add these variables to your `server/.env` file:

```env
# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your_account_sid_here
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

### 4. User Setup

Users need to:

1. Add their phone number in Settings → Profile (with real-time validation)
2. Enable SMS notifications in Settings → Preferences → Notifications
3. Configure quiet hours (optional)
4. Test SMS functionality using the "Test SMS" button

## Phone Number Format

- Phone numbers **must** include country code
- Format: `+1234567890` (for US numbers)
- International format: `+44123456789` (for UK numbers)
- ✅ Real-time validation shows if format is correct
- ❌ Invalid formats will be rejected before saving

## Advanced Features

### 🛡️ Rate Limiting (Cost Protection)

- **10 SMS per hour per user** to prevent unexpected costs
- Real-time usage tracking in Preferences tab
- Visual progress bar shows SMS usage
- Automatic reset every hour

### 🌙 Quiet Hours

- Configure "do not disturb" times (default: 10 PM - 8 AM)
- SMS notifications won't be sent during quiet hours
- Customize start/end times in Settings → Preferences
- Handles overnight periods (e.g., 22:00 - 08:00)

### 🎯 Smart Notification Filtering

SMS is only sent for urgent notifications:

- ⚠️ High priority tasks
- ⏰ Meeting reminders
- 📅 Deadline alerts
- 🚨 Urgent assignments

Regular notifications use email/in-app only to save costs.

### 📊 Usage Tracking

- See real-time SMS usage in Preferences tab
- Track sent/remaining messages
- See when rate limit resets
- Color-coded alerts (green → yellow → red)

### ✅ Phone Number Validation

- Real-time validation as you type
- Visual feedback (✓ or ✗)
- Validates international format
- Prevents invalid numbers from being saved

### 📝 SMS Templates

Different message formats for different notification types:

- 🚨 **Urgent Task**: "🚨 URGENT TASK: [title]"
- 📅 **Meeting Reminder**: "📅 MEETING REMINDER: [title]"
- ⏰ **Deadline**: "⏰ DEADLINE APPROACHING: [title]"
- 📋 **Task**: "📋 New Task: [title]"

### 📈 Delivery Tracking

- Track SMS delivery status
- Error logging for failed messages
- Twilio SID tracking for each SMS

## Testing

1. Go to Settings → Profile
2. Add your phone number (with + and country code)
3. Wait for green checkmark ✓
4. Save profile
5. Go to Settings → Preferences → Notifications
6. Enable SMS notifications
7. Configure quiet hours (optional)
8. Click "Test SMS" to send a test message
9. Check SMS usage meter

## Troubleshooting

### Common Issues

1. **SMS not received**

   - Check phone number format (must include country code with +)
   - Verify Twilio credentials are correct
   - Check if you're in quiet hours
   - Verify rate limit not exceeded
   - Check Twilio console for error messages

2. **"SMS service not configured" error**

   - Ensure all Twilio environment variables are set
   - Restart the server after adding environment variables
   - Check server startup logs for configuration status

3. **Invalid phone number**

   - Phone number must start with +
   - Must be in international format (+1234567890)
   - Remove spaces, dashes, or parentheses
   - Profile page will show validation errors

4. **Rate limit exceeded**

   - Wait for hourly reset (shown in Preferences)
   - Current limit: 10 SMS per hour
   - Check usage meter in Preferences tab

5. **SMS sent during quiet hours**
   - Only urgent notifications bypass quiet hours
   - Check quiet hours settings in Preferences
   - Verify enabled/disabled status

### Twilio Free Account Limitations

- Free accounts can only send SMS to verified phone numbers
- To send to unverified numbers, upgrade to a paid account
- Free trial credits: ~$15 (≈2000 SMS)

## Cost Considerations

- Twilio charges per SMS sent (typically $0.0075 per SMS in the US)
- **Built-in rate limiting** prevents unexpected costs
- Monitor usage in:
  - App Preferences tab (real-time)
  - Twilio console (detailed billing)
- 10 SMS/hour/user = max 240 SMS/day/user
- Example: 100 users = max $18/day if all users hit limit

## Security & Best Practices

✅ **Implemented Security Features:**

- ✅ Rate limiting (10 SMS/hour/user)
- ✅ Phone number validation
- ✅ Quiet hours respect
- ✅ Environment variable protection
- ✅ Error handling and logging
- ✅ Urgent-only filtering
- ✅ Delivery tracking

❗ **Best Practices:**

- Keep Twilio credentials secure
- Never commit .env files
- Monitor Twilio usage regularly
- Set up billing alerts in Twilio
- Test with your own number first
- Review rate limits for production

## Features

### Core Features

- ✅ Send SMS notifications for urgent items
- ✅ User preference management
- ✅ Test SMS functionality
- ✅ International phone number support
- ✅ Error handling and logging

### Advanced Features

- ✅ **Rate limiting** (10 SMS/hour/user)
- ✅ **Real-time phone validation**
- ✅ **Quiet hours** configuration
- ✅ **SMS usage tracking** with visual meter
- ✅ **Smart filtering** (urgent-only)
- ✅ **Custom SMS templates** per type
- ✅ **Delivery tracking** (SID, status, errors)
- ✅ **Configuration validation** on server start

## SMS Notification Types

SMS notifications are sent for:

- ⚠️ **Urgent tasks** (priority: high/urgent)
- 📅 **Meeting reminders** (upcoming meetings)
- ⏰ **Deadline alerts** (approaching deadlines)
- 🚨 **Critical system notifications**

Regular notifications use email/in-app to save costs.

## User Settings Locations

### Profile Settings (Phone Number)

- Settings → Profile → Phone Number
- Real-time validation
- Visual feedback (✓ green / ✗ red)
- International format required

### Notification Preferences

- Settings → Preferences → Notifications
- Enable/disable SMS notifications
- Test SMS button
- SMS usage meter (when enabled)

### Quiet Hours Settings

- Settings → Preferences → Quiet Hours
- Enable/disable quiet hours
- Set start time (default: 22:00)
- Set end time (default: 08:00)
- Handles overnight periods

## Configuration Validation

Server startup shows:

```
🚀 Server running on port 9000
📍 Environment: development
🌐 API available at: http://localhost:9000/api

📋 Configuration Status:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Email service configured
   Provider: smtp.gmail.com
   From: Notion App <your@email.com>
✅ SMS service configured
   Phone: +1234567890
   Rate limit: 10 SMS per hour per user
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If SMS is not configured:

```
⚠️  SMS notifications disabled - Missing: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
   Set Twilio credentials in .env to enable SMS notifications
   See SMS_SETUP_GUIDE.md for setup instructions
```
