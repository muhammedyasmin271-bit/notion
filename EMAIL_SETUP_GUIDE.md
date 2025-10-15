# Quick Email Setup Guide

This is a quick guide to set up email notifications in your Notion App.

## 🚀 Quick Start (5 Minutes)

### Step 1: Get Gmail App Password

1. **Enable 2-Factor Authentication** on your Gmail account

   - Go to: https://myaccount.google.com/security
   - Turn on 2-Step Verification

2. **Create App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and your device
   - Copy the 16-character password (it will look like: `abcd efgh ijkl mnop`)

### Step 2: Configure Server

1. **Create `.env` file** in the `server` folder (if it doesn't exist)

2. **Add email configuration:**

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=abcdefghijklmnop
EMAIL_FROM_NAME=Notion App
FRONTEND_URL=http://localhost:3000
```

3. **Replace values:**
   - `EMAIL_USER`: Your Gmail address
   - `EMAIL_PASS`: The app password from Step 1 (remove spaces)

### Step 3: Restart Server

```bash
cd server
npm start
```

### Step 4: Configure User Email

1. **Open the app** and login
2. **Go to Settings** (click your avatar → Settings)
3. **Profile tab**: Add your email address and click "Save Changes"
4. **Preferences tab**:
   - Enable "Email notifications"
   - Click "Test Email" button
   - Click "Save Preferences"

### Step 5: Test It!

- Check your email inbox for the test email
- Create a task/meeting to trigger automatic notifications
- You should receive emails for all activities!

## ✅ What Works Now

- ✅ Email notifications for new tasks
- ✅ Email notifications for meetings
- ✅ Email notifications for projects
- ✅ Test email functionality
- ✅ User email preferences
- ✅ Beautiful HTML email templates

## 📧 Using Other Email Services

### Outlook/Hotmail

```env
EMAIL_SERVICE=hotmail
EMAIL_HOST=smtp.office365.com
EMAIL_USER=your_email@outlook.com
EMAIL_PASS=your_password
```

### Yahoo

```env
EMAIL_SERVICE=yahoo
EMAIL_HOST=smtp.mail.yahoo.com
EMAIL_USER=your_email@yahoo.com
EMAIL_PASS=your_app_password
```

### Custom SMTP

```env
EMAIL_SERVICE=
EMAIL_HOST=smtp.yourcompany.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=notifications@yourcompany.com
EMAIL_PASS=your_password
```

## 🔧 Troubleshooting

### Emails not sending?

1. **Check server logs** for errors
2. **Verify .env file** is in `server/` folder
3. **Check email/password** are correct
4. **For Gmail**: Must use app password, not regular password
5. **Test endpoint**: Use Postman to test `/api/notifications/test-email`

### User not receiving emails?

1. Check user has email in profile
2. Verify email notifications enabled in preferences
3. Check spam/junk folder
4. Verify email address is correct

### Server errors?

```bash
# Check if nodemailer is installed
cd server
npm list nodemailer

# Reinstall if needed
npm install nodemailer
```

## 🎯 Next Steps

- Add more email templates
- Customize email design
- Add email digest (daily/weekly summaries)
- Add unsubscribe functionality

## 📚 Full Documentation

See `EMAIL_NOTIFICATIONS_README.md` for complete documentation.
