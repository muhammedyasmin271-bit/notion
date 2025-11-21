# Payment System Test Checklist

## ✅ Implementation Complete - Ready for Testing

### 1. Phone Number Requirement Test
- [ ] Navigate to `/create-company`
- [ ] Try to submit form without phone number - should show validation error
- [ ] Fill in phone number and submit - should work
- [ ] Verify phone number is saved in database

### 2. Payment Page Redirect Test (Paid Plans)
- [ ] Create a company with a paid plan (not free_trial)
- [ ] Log in as admin of that company
- [ ] Should be redirected to `/payment-reminder` page
- [ ] Should NOT be able to access other pages until payment is made
- [ ] Verify calendar shows hours remaining (24 hours)

### 3. Free Trial Calendar Test
- [ ] Create a company with `free_trial` plan
- [ ] Log in as admin
- [ ] Check calendar component
- [ ] Should show "Days Remaining Until Free Trial Ends" (7 days)
- [ ] Should display days countdown

### 4. Payment Period Extension Test
- [ ] Create a company and make first payment (1 month)
- [ ] Verify `paymentPeriodEnd` is set correctly (1 month from payment)
- [ ] Make another payment (1 month) before period ends
- [ ] Verify `paymentPeriodEnd` extends by another month (total 2 months)
- [ ] Calendar should show "Days Remaining Until Payment Period Ends"

### 5. Grace Period Test (7 Days)
- [ ] Create a company with paid plan
- [ ] Wait for payment deadline to pass (or manually set deadline in past)
- [ ] Company should enter grace period
- [ ] Only admin should be able to log in
- [ ] Non-admin users should see "Grace Period Active" message
- [ ] Calendar should show "Days Remaining Until Company Paused"
- [ ] Grace period should last 7 days after payment deadline

### 6. Auto-Pause After Grace Period Test
- [ ] Wait for grace period to expire (or manually set `gracePeriodDeadline` in past)
- [ ] Company should be automatically paused
- [ ] All users (including admin) should see "Company Paused" message
- [ ] No one should be able to log in

### 7. Super Admin Unpause Test
- [ ] Log in as super admin
- [ ] Navigate to Super Admin dashboard
- [ ] Find a paused company
- [ ] Click on company to view details
- [ ] Should see "Unpause Company (24h to pay)" button
- [ ] Click unpause button
- [ ] Company should be unpaused
- [ ] Company should get new 24-hour payment deadline
- [ ] Company should get new 7-day grace period deadline
- [ ] Admin should be able to log in again

### 8. Calendar Display Test (All Scenarios)
- [ ] **Unpaid Paid Plan**: Should show hours remaining (within 24h)
- [ ] **Free Trial**: Should show days remaining (7 days)
- [ ] **After Payment**: Should show days until payment period ends
- [ ] **Grace Period**: Should show days until company paused
- [ ] **Paused**: Should show appropriate message

### 9. Payment Verification Test
- [ ] Submit a payment as admin
- [ ] Super admin approves payment
- [ ] Verify `hasPaid` is set to `true`
- [ ] Verify `paymentPeriodEnd` is calculated correctly
- [ ] Verify `lastPaymentDate` is set
- [ ] Verify `paymentDeadline` is updated to match `paymentPeriodEnd`
- [ ] Verify `gracePeriodDeadline` is cleared

### 10. Multiple Payments Extension Test
- [ ] Make first payment for 1 month (e.g., Sept 21)
- [ ] Verify period ends Oct 21
- [ ] Make second payment for 1 month before Oct 21 (e.g., Sept 8)
- [ ] Verify period extends to Nov 8 (60 days total from first payment)
- [ ] Calendar should reflect correct end date

## Test Data Setup

### Quick Test Scenarios:

1. **Test Paid Plan Flow:**
   - Create company with `one_month` plan
   - Payment deadline: 24 hours from creation
   - Grace period: 7 days after payment deadline
   - Total: 8 days before auto-pause

2. **Test Free Trial Flow:**
   - Create company with `free_trial` plan
   - Payment deadline: 7 days from creation
   - No grace period needed

3. **Test Payment Extension:**
   - Create company, make payment
   - Verify period extends correctly
   - Make additional payment
   - Verify cumulative extension

## Expected Console Logs

When testing, you should see:
- `✅ Company created successfully: [name] ([companyId])`
- `✅ SMS sent to admin [phone]`
- `⏸️ Company auto-paused: [companyId] - Grace period expired`
- `✅ Company unpaused: [companyId] - New payment deadline: [date]`
- `✅ Company payment updated: [companyId] - Payment period end: [date]`

## API Endpoints to Test

1. `POST /api/company/create` - Create company (phone required)
2. `GET /api/company/my-company` - Get company details (includes gracePeriodDeadline, paymentPeriodEnd)
3. `PUT /api/payments/:id/verify` - Approve payment (extends period)
4. `PATCH /api/admin/companies/:companyId/unpause` - Unpause company
5. `GET /api/admin/companies` - List all companies (super admin)

## Notes

- All middleware runs on authenticated routes
- Background job checks for paused companies every hour
- Grace period is automatically calculated (7 days after payment deadline)
- Payment periods extend cumulatively when multiple payments are made


