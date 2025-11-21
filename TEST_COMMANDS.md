# Test Commands - Quick Reference

## Start the Application

### Terminal 1: Start Backend
```bash
cd server
npm run dev
```

Expected output:
```
✅ Server running on port 9000
✅ MongoDB connected
```

### Terminal 2: Start Frontend
```bash
npm start
```

Expected output:
```
✅ Compiled successfully
✅ App running on http://localhost:3000
```

---

## Test SMS Configuration

### Run SMS Test Script
```bash
cd server
node test-sms-fix.js
```

Expected output:
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

---

## Manual Testing in Browser

### Test 1: Login Button Redirect

1. Open browser: `http://localhost:3000`
2. Click "Create Company"
3. Fill form:
   ```
   Company Name: Test Company
   Company Email: test@company.com
   Company Phone: +251911234567
   Admin First Name: John
   Admin Last Name: Doe
   Admin Email: john@test.com
   Admin Phone: +251911234567
   Password: Test@123456
   ```
4. Click "Create Company"
5. On success page, click "Login to Your Workspace"
6. **Check**: URL should be `http://localhost:3000/login?company=comp_XXXXX`

### Test 2: SMS Notification (Paid Plan)

1. Go to `http://localhost:3000`
2. Click "One Month Plan"
3. Click "Create Company"
4. Fill form with:
   ```
   Company Name: SMS Test Paid
   Company Email: smspaid@test.com
   Company Phone: +251911234567
   Admin First Name: Jane
   Admin Last Name: Smith
   Admin Email: jane@test.com
   Admin Phone: +251911234567
   Password: Test@123456
   ```
5. Click "Create Company"
6. **Check backend logs** for:
   ```
   ✅ Company created successfully: SMS Test Paid
   📱 SMS Notification Process Started
   ✅ SMS sent successfully
   ```

### Test 3: SMS Notification (Free Trial)

1. Go to `http://localhost:3000`
2. Click "Free Trial"
3. Click "Create Company"
4. Fill form with:
   ```
   Company Name: SMS Test Free Trial
   Company Email: smsfreetrial@test.com
   Company Phone: +251911234567
   Admin First Name: Bob
   Admin Last Name: Johnson
   Admin Email: bob@test.com
   Admin Phone: +251911234567
   Password: Test@123456
   ```
5. Click "Create Company"
6. **Check backend logs** for:
   ```
   ✅ Company created successfully: SMS Test Free Trial
   📱 SMS Notification Process Started
   ✅ SMS sent successfully
   ```

---

## Check Backend Logs

### Look for SMS Status
```
📱 SMS Notification Process Started
   Admin Phone: +251911234567
   SMS_API configured: true
   SMS_TOKEN configured: true
📤 Sending SMS to: +251911234567
📝 Message length: XXX characters
✅ SMS sent successfully
```

### Look for Login Redirect
```
✅ Company created successfully: [Company Name] (comp_XXXXX)
```

---

## Verify in Browser Console

### Open Developer Tools
```
F12 or Right-click → Inspect
```

### Check Console Tab
- Should see no errors
- Should see navigation logs

### Check Network Tab
- Should see POST to `/api/company/create`
- Should see GET to `/login?company=...`

---

## Test Error Scenarios

### Test 1: Missing SMS Config

1. Edit `server/.env`
2. Comment out SMS variables:
   ```
   # SMS_API=...
   # SMS_TOKEN=...
   ```
3. Restart backend
4. Create company
5. **Check logs** for:
   ```
   ⚠️ SMS skipped - missing phone or SMS configuration
   ```
6. **Verify**: Company still created successfully

### Test 2: Invalid Phone Number

1. Create company with invalid phone: `invalid`
2. **Check logs** for error handling
3. **Verify**: Company creation fails with clear error

### Test 3: Duplicate Email

1. Create company with email: `test@test.com`
2. Try to create another company with same email
3. **Check logs** for duplicate error
4. **Verify**: Second company creation fails

---

## Quick Test Checklist

### Before Testing
- [ ] Backend running on port 9000
- [ ] Frontend running on port 3000
- [ ] MongoDB connected
- [ ] `.env` file configured (if testing SMS)

### Login Button Test
- [ ] Create company
- [ ] Click login button
- [ ] URL has companyId
- [ ] Company page loads
- [ ] Can login

### SMS Test (Paid)
- [ ] Create company with paid plan
- [ ] Check backend logs
- [ ] SMS sent (or skipped if not configured)

### SMS Test (Free Trial)
- [ ] Create company with free trial
- [ ] Check backend logs
- [ ] SMS sent (or skipped if not configured)

### Error Handling Test
- [ ] Disable SMS config
- [ ] Create company
- [ ] Company created despite SMS skip

### End-to-End Test
- [ ] Create company
- [ ] SMS sent
- [ ] Click login button
- [ ] Login works
- [ ] Access dashboard

---

## Debugging Commands

### Check Backend Logs
```bash
# Terminal where backend is running
# Look for logs starting with:
# 📱 SMS Notification Process Started
# ✅ Company created successfully
```

### Check Frontend Logs
```bash
# Browser console (F12)
# Look for navigation logs
# Check for any errors
```

### Test SMS Service
```bash
cd server
node test-sms-fix.js
```

### Check Environment Variables
```bash
# In server directory
cat .env | grep SMS
```

---

## Expected Results

### ✅ Login Button Working
- URL: `http://localhost:3000/login?company=comp_XXXXX`
- Company branding displays
- Login form visible
- Can login with admin credentials

### ✅ SMS Working (Configured)
- Backend logs show SMS sent
- Admin receives SMS (if real number)
- Message contains company name and link

### ✅ SMS Skipped (Not Configured)
- Backend logs show SMS skipped
- Company created successfully
- No errors in response

### ✅ Error Handling
- Company creation fails gracefully
- Clear error messages
- No crashes or hangs

---

## Troubleshooting

### If Login Button Doesn't Work
```bash
# Check browser console
# Check URL in address bar
# Check backend logs
# Verify companyId is in URL
```

### If SMS Not Sending
```bash
# Run: node server/test-sms-fix.js
# Check .env has SMS_API and SMS_TOKEN
# Check phone number format
# Check backend logs for errors
```

### If Company Creation Fails
```bash
# Check backend logs for error
# Verify all required fields filled
# Check email not already in use
# Verify database connection
```

---

## Success Indicators

✅ **Login Button**: Redirects to `/login?company=...`
✅ **SMS Paid**: Message sent with payment info
✅ **SMS Free Trial**: Message sent with trial info
✅ **Error Handling**: Graceful failures
✅ **Logging**: Clear and helpful logs
✅ **No Errors**: Browser and backend logs clean

---

## Next Steps

1. Run backend: `npm run dev` (in server)
2. Run frontend: `npm start` (in root)
3. Test SMS: `node server/test-sms-fix.js`
4. Create company in browser
5. Verify all tests pass
6. Check documentation for details

---

## Documentation Reference

- **Overview**: README_FIXES.md
- **Detailed Testing**: STEP_BY_STEP_TEST.md
- **Code Changes**: CHANGES_SUMMARY.md
- **Visual Guide**: FLOW_DIAGRAM.md
- **Quick Help**: QUICK_TEST.md
