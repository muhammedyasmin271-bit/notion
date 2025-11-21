# Quick Test Guide

## Run SMS Test Script

```bash
cd server
node test-sms-fix.js
```

This will:
- Check if SMS environment variables are configured
- Test SMS sending with different phone number formats
- Show success/failure for each test

---

## Manual Test - Login Redirect

### Test in Browser:

1. **Start the app**:
   ```bash
   npm run dev
   ```

2. **Create a company**:
   - Go to `http://localhost:3000`
   - Click "Create Company"
   - Fill form with test data
   - Click "Create Company"

3. **Test login button**:
   - On success page, click "Login to Your Workspace"
   - **Check**: URL should be `http://localhost:3000/login?company=comp_XXXXX`
   - **Check**: Company name/logo should display on login page

---

## Manual Test - SMS Notification

### Prerequisites:

1. **Check `.env` file** has SMS configuration:
   ```
   SMS_API=https://your-sms-api-endpoint
   SMS_TOKEN=your-sms-token
   IDENTIFIER_ID=your-identifier
   SENDER_NAME=your-sender-name
   ```

2. **Open backend logs**:
   - Terminal where backend is running
   - Look for logs starting with `📱 SMS Notification Process Started`

### Test Steps:

1. **Create company with PAID plan**:
   - Go to create company page
   - Fill all fields
   - Select "One Month Plan" (paid plan)
   - Click "Create Company"

2. **Check backend logs**:
   ```
   ✅ Company created successfully: [Company Name] (comp_XXXXX)
   📱 SMS Notification Process Started
      Admin Phone: +251911234567
      SMS_API configured: true
      SMS_TOKEN configured: true
   📤 Sending SMS to: +251911234567
   📝 Message length: XXX characters
   ✅ SMS sent successfully
   ```

3. **Check phone** (if using real number):
   - Should receive SMS with company name and login link

---

## Expected Behavior

### Login Button Fix ✅
- Button click → Redirects to `/login?company=[companyId]`
- Company login page loads with company branding
- Can login with admin credentials

### SMS Notification Fix ✅
- **Paid Plans**: SMS sent with payment deadline info
- **Free Trial**: SMS sent with 7-day trial info
- **No SMS Config**: Company created, SMS skipped (no error)
- **SMS Failure**: Company created, SMS error logged (no blocking)

---

## Debugging

### If login button doesn't work:
```javascript
// Check browser console (F12)
// Should see navigation happening
// Check URL in address bar
```

### If SMS not sending:
```bash
# Check backend logs for:
# 1. SMS_API configured: true/false
# 2. SMS_TOKEN configured: true/false
# 3. Actual error message

# Run test script:
cd server
node test-sms-fix.js
```

### If company creation fails:
```bash
# Check backend logs for:
# - Validation errors
# - Database errors
# - Duplicate email/username errors
```

---

## Success Indicators

✅ **Login Button Working**:
- URL changes to `/login?company=...`
- Company page loads
- Can see company branding

✅ **SMS Working**:
- Backend logs show `✅ SMS sent successfully`
- Admin receives SMS (if real number used)
- Message contains company name and login link

✅ **Both Fixes Working**:
- Company created successfully
- SMS sent (or skipped if not configured)
- Login button redirects correctly
- Can login with admin credentials
