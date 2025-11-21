# Step-by-Step Testing Instructions

## Setup

### 1. Verify Environment Configuration

```bash
# Check .env file in server directory
cat server/.env

# Should contain:
SMS_API=https://your-sms-api-endpoint
SMS_TOKEN=your-sms-token
IDENTIFIER_ID=your-identifier
SENDER_NAME=your-sender-name
```

### 2. Start the Application

```bash
# Terminal 1 - Start backend
cd server
npm run dev

# Terminal 2 - Start frontend
npm start
```

### 3. Verify Backend is Running

```bash
# Should see logs like:
✅ Server running on port 9000
✅ MongoDB connected
```

---

## Test 1: Login Button Redirect (5 minutes)

### Step 1: Navigate to Create Company Page
1. Open browser: `http://localhost:3000`
2. Click "Create Company" button
3. Verify you're on the create company page

### Step 2: Fill Company Information
1. **Company Name**: `Test Company 001`
2. **Company Email**: `test001@company.com`
3. **Company Phone**: `+251911234567`
4. **Company Address**: `Addis Ababa, Ethiopia`
5. Click "Next: Admin Account"

### Step 3: Fill Admin Information
1. **First Name**: `John`
2. **Last Name**: `Doe`
3. **Email**: `john.doe@test.com`
4. **Phone**: `+251911234567`
5. **Password**: `Test@123456`
6. **Confirm Password**: `Test@123456`
7. Click "Create Company"

### Step 4: Verify Success Page
- ✅ See "Company Created Successfully!" message
- ✅ Company name displays: "Test Company 001"
- ✅ Admin email displays: "john.doe@test.com"

### Step 5: Test Login Button
1. Click "Login to Your Workspace" button
2. **Check URL bar**: Should show `http://localhost:3000/login?company=comp_XXXXX`
3. **Check page content**:
   - ✅ Company name displays
   - ✅ Login form visible
   - ✅ Username and password fields present

### Step 6: Verify Login Works
1. Enter username: `john.doe_admin` (auto-generated from email)
2. Enter password: `Test@123456`
3. Click "Login"
4. **Expected**: Should redirect to `/home` page

### Result
- ✅ **PASS** if login button redirects to company login page
- ❌ **FAIL** if button doesn't navigate or URL is wrong

---

## Test 2: SMS Notification - Paid Plan (5 minutes)

### Prerequisites
- SMS service configured in `.env`
- Backend running with logs visible

### Step 1: Navigate to Create Company
1. Go to `http://localhost:3000`
2. Click "Create Company"

### Step 2: Select Paid Plan
1. On landing page, click "One Month Plan" (or any paid plan)
2. Click "Create Company"
3. Verify you're on create company page

### Step 3: Fill Company Information
1. **Company Name**: `SMS Test Paid`
2. **Company Email**: `smspaid@test.com`
3. **Company Phone**: `+251911234567`
4. Click "Next: Admin Account"

### Step 4: Fill Admin Information
1. **First Name**: `Jane`
2. **Last Name**: `Smith`
3. **Email**: `jane.smith@test.com`
4. **Phone**: `+251911234567` (use real number for actual SMS)
5. **Password**: `Test@123456`
6. **Confirm Password**: `Test@123456`
7. Click "Create Company"

### Step 5: Check Backend Logs
Look for these logs in backend terminal:

```
✅ Company created successfully: SMS Test Paid (comp_XXXXX)
📱 SMS Notification Process Started
   Admin Phone: +251911234567
   SMS_API configured: true
   SMS_TOKEN configured: true
📤 Sending SMS to: +251911234567
📝 Message length: XXX characters
✅ SMS sent successfully
```

### Step 6: Verify SMS Received (if using real number)
- Check phone for SMS message
- Message should contain:
  - Company name: "SMS Test Paid"
  - Login link with company ID
  - Payment deadline information

### Result
- ✅ **PASS** if backend logs show SMS sent successfully
- ⚠️ **PARTIAL** if SMS skipped due to missing config (expected if SMS not configured)
- ❌ **FAIL** if SMS error occurs

---

## Test 3: SMS Notification - Free Trial (5 minutes)

### Step 1: Navigate to Create Company
1. Go to `http://localhost:3000`
2. Click "Create Company"

### Step 2: Select Free Trial Plan
1. On landing page, click "Free Trial" plan
2. Click "Create Company"

### Step 3: Fill Company Information
1. **Company Name**: `SMS Test Free Trial`
2. **Company Email**: `smsfreetrial@test.com`
3. **Company Phone**: `+251911234567`
4. Click "Next: Admin Account"

### Step 4: Fill Admin Information
1. **First Name**: `Bob`
2. **Last Name**: `Johnson`
3. **Email**: `bob.johnson@test.com`
4. **Phone**: `+251911234567`
5. **Password**: `Test@123456`
6. **Confirm Password**: `Test@123456`
7. Click "Create Company"

### Step 5: Check Backend Logs
Look for these logs:

```
✅ Company created successfully: SMS Test Free Trial (comp_XXXXX)
📱 SMS Notification Process Started
   Admin Phone: +251911234567
   SMS_API configured: true
   SMS_TOKEN configured: true
📤 Sending SMS to: +251911234567
📝 Message length: XXX characters
✅ SMS sent successfully
```

### Step 6: Verify SMS Content
- Message should mention "7 days free trial"
- Should include login link
- Should include company name

### Result
- ✅ **PASS** if SMS sent with trial information
- ⚠️ **PARTIAL** if SMS skipped (expected if not configured)
- ❌ **FAIL** if SMS error occurs

---

## Test 4: SMS Configuration Check (2 minutes)

### Run SMS Test Script
```bash
cd server
node test-sms-fix.js
```

### Expected Output
```
🧪 Testing SMS Service...

📋 Environment Configuration:
   SMS_API: ✅ Configured
   SMS_TOKEN: ✅ Configured
   IDENTIFIER_ID: ✅ Configured
   SENDER_NAME: ✅ Configured

📱 Testing with different phone formats:

Testing: +251911234567
   ✅ Success

Testing: 0911234567
   ✅ Success

Testing: 911234567
   ✅ Success

Testing: 251911234567
   ✅ Success

✅ SMS test completed
```

### Result
- ✅ **PASS** if all tests show success
- ⚠️ **PARTIAL** if SMS not configured (expected)
- ❌ **FAIL** if SMS service is down

---

## Test 5: Error Handling - No SMS Config (3 minutes)

### Step 1: Disable SMS Configuration
```bash
# Edit server/.env
# Comment out or remove:
# SMS_API=...
# SMS_TOKEN=...
```

### Step 2: Restart Backend
```bash
# Stop backend (Ctrl+C)
# Start backend again
npm run dev
```

### Step 3: Create Company
1. Go to `http://localhost:3000`
2. Create a new company with any plan
3. Fill all required fields
4. Click "Create Company"

### Step 4: Check Backend Logs
Should see:
```
✅ Company created successfully: [Company Name] (comp_XXXXX)
📱 SMS Notification Process Started
   Admin Phone: +251911234567
   SMS_API configured: false
   SMS_TOKEN configured: false
⚠️ SMS skipped - missing phone or SMS configuration
```

### Step 5: Verify Company Created
- ✅ Success page displays
- ✅ Company details shown
- ✅ Login button works
- ✅ No errors in response

### Result
- ✅ **PASS** if company created successfully despite SMS being skipped
- ❌ **FAIL** if company creation fails

---

## Test 6: Full End-to-End Flow (10 minutes)

### Complete Flow
1. ✅ Create company with paid plan
2. ✅ Verify SMS sent (or skipped if not configured)
3. ✅ Click login button
4. ✅ Verify redirect to company login page
5. ✅ Login with admin credentials
6. ✅ Access company dashboard

### Expected Results
- Company created successfully
- SMS notification sent (or skipped)
- Login button redirects correctly
- Company branding displays on login page
- Can login and access dashboard

---

## Troubleshooting

### Login Button Not Working
```
Check:
1. Browser console (F12) for errors
2. URL in address bar
3. Backend logs for any errors
4. Verify companyId is in URL

Solution:
- Clear browser cache
- Hard refresh (Ctrl+Shift+R)
- Check if LoginPage component exists
```

### SMS Not Sending
```
Check:
1. Backend logs for SMS status
2. .env file has SMS_API and SMS_TOKEN
3. Phone number format is correct
4. SMS service is accessible

Solution:
- Run: node server/test-sms-fix.js
- Check SMS service API status
- Verify credentials in .env
- Check network connectivity
```

### Company Creation Fails
```
Check:
1. Backend logs for error message
2. All required fields filled
3. Email not already in use
4. Database connection

Solution:
- Check backend logs
- Verify database is running
- Try different email
- Restart backend
```

---

## Success Checklist

- [ ] Login button redirects to `/login?company=...`
- [ ] Company branding displays on login page
- [ ] Can login with admin credentials
- [ ] SMS sent for paid plans (if configured)
- [ ] SMS sent for free trial (if configured)
- [ ] SMS skipped gracefully if not configured
- [ ] Company creation succeeds regardless of SMS status
- [ ] Backend logs are clear and helpful
- [ ] No errors in browser console
- [ ] No errors in backend logs

---

## Quick Reference

| Test | Expected | Status |
|------|----------|--------|
| Login redirect | `/login?company=...` | ✅ |
| Company page loads | Branding displays | ✅ |
| Login works | Access dashboard | ✅ |
| SMS paid plan | Message sent | ✅ |
| SMS free trial | Message sent | ✅ |
| SMS not configured | Skipped gracefully | ✅ |
| Company creation | Always succeeds | ✅ |
| Backend logs | Clear and helpful | ✅ |
