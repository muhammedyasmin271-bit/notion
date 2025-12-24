# Testing the Fixes

## Test 1: Login Button Redirect

### Steps:
1. Open browser and go to `process.env.Backendurl`
2. Click "Create Company" or navigate to create company page
3. Fill in company details:
   - Company Name: `Test Company`
   - Company Email: `test@company.com`
   - Company Phone: `+251911234567`
   - Admin First Name: `John`
   - Admin Last Name: `Doe`
   - Admin Email: `john@test.com`
   - Admin Phone: `+251911234567`
   - Password: `Test123!`
4. Select any plan (Free Trial or Paid)
5. Click "Create Company"
6. On success page, click "Login to Your Workspace" button
7. **Expected Result**: Should redirect to `/login?company=[companyId]` and display company login page

### Verification:
- Check URL bar shows: `process.env.Backendurl/login?company=comp_XXXXX`
- Company logo/name displays on login page
- Login form is visible

---

## Test 2: SMS Notification (Paid Plan)

### Prerequisites:
Ensure `.env` file has SMS configuration:
```
SMS_API=https://your-sms-api-endpoint
SMS_TOKEN=your-sms-token
IDENTIFIER_ID=your-identifier
SENDER_NAME=your-sender-name
```

### Steps:
1. Open browser console (F12) and go to Network tab
2. Navigate to create company page
3. Fill in company details with a **PAID PLAN** (not free trial):
   - Company Name: `SMS Test Company`
   - Company Email: `sms@test.com`
   - Company Phone: `+251911234567`
   - Admin First Name: `Jane`
   - Admin Last Name: `Smith`
   - Admin Email: `jane@test.com`
   - Admin Phone: `+251911234567` (use real phone for actual SMS)
   - Password: `Test123!`
4. Select "One Month Plan" or other paid plan
5. Click "Create Company"
6. Check backend console logs

### Backend Logs to Look For:
```
✅ Company created successfully: SMS Test Company (comp_XXXXX)
📱 SMS Notification Process Started
   Admin Phone: +251911234567
   SMS_API configured: true
   SMS_TOKEN configured: true
📤 Sending SMS to: +251911234567
📝 Message length: XXX characters
✅ SMS sent successfully
```

### Expected Result:
- Company created successfully
- SMS notification sent to admin phone
- Admin receives SMS with company name, login link, and payment deadline

---

## Test 3: SMS Notification (Free Trial)

### Steps:
1. Navigate to create company page
2. Fill in company details with **FREE TRIAL PLAN**:
   - Company Name: `Free Trial Test`
   - Company Email: `freetrial@test.com`
   - Company Phone: `+251911234567`
   - Admin First Name: `Bob`
   - Admin Last Name: `Johnson`
   - Admin Email: `bob@test.com`
   - Admin Phone: `+251911234567`
   - Password: `Test123!`
3. Select "Free Trial" plan
4. Click "Create Company"
5. Check backend console logs

### Backend Logs to Look For:
```
✅ Company created successfully: Free Trial Test (comp_XXXXX)
📱 SMS Notification Process Started
   Admin Phone: +251911234567
   SMS_API configured: true
   SMS_TOKEN configured: true
📤 Sending SMS to: +251911234567
📝 Message length: XXX characters
✅ SMS sent successfully
```

### Expected Result:
- Company created successfully
- SMS notification sent with 7-day trial information
- Admin receives SMS with company name, login link, and trial period

---

## Test 4: SMS Failure Handling (No SMS Config)

### Steps:
1. Temporarily remove SMS environment variables from `.env`
2. Restart backend server
3. Create a new company with any plan
4. Check backend console logs

### Backend Logs to Look For:
```
✅ Company created successfully: Test Company (comp_XXXXX)
📱 SMS Notification Process Started
   Admin Phone: +251911234567
   SMS_API configured: false
   SMS_TOKEN configured: false
⚠️ SMS skipped - missing phone or SMS configuration
```

### Expected Result:
- Company created successfully (SMS failure doesn't block company creation)
- SMS skipped due to missing configuration
- No errors in response

---

## Quick Checklist

- [ ] Login button redirects to company login page with companyId
- [ ] Company logo/name displays on login page
- [ ] SMS sent for paid plans
- [ ] SMS sent for free trial plans
- [ ] SMS message contains company name and login link
- [ ] Company creation succeeds even if SMS fails
- [ ] Backend logs show SMS status clearly
- [ ] Phone number formatting works correctly

---

## Troubleshooting

### Login button not working:
- Check browser console for errors
- Verify companyId is in URL
- Check if LoginPage component is rendering

### SMS not sending:
- Check `.env` file has SMS_API and SMS_TOKEN
- Check backend logs for SMS configuration status
- Verify phone number format (should be +251XXXXXXXXX)
- Check SMS service API is accessible
- Look for error messages in backend logs

### Company creation fails:
- Check all required fields are filled
- Check backend logs for validation errors
- Verify database connection
- Check for duplicate email/username
