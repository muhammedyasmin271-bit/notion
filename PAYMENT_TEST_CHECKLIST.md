# Payment System Test Checklist

## ✅ Pre-Test Setup

1. **Environment Variables** - Ensure these are set in `server/.env`:
   ```
   CHAPA_TOKEN=your_chapa_token_here
   CHAPA_API=https://api.chapa.co/v1
   BASE_URL=process.env.Backendurl
   ```

2. **Server Running**:
   - Backend: `process.env.Backendurl`
   - Frontend: `process.env.Backendurl`

3. **Login** as a company admin

## 🧪 Test Scenarios

### Test 1: Successful Payment Flow

1. **Navigate to Payment Page**
   - Go to `/admin/payments` or click "Payment" in admin dashboard
   - ✅ Calendar should be visible
   - ✅ Payment history should load (if any)

2. **Select a Plan**
   - Click "Subscribe" button
   - Select a plan (e.g., "One Month Plan")
   - ✅ Plan should be highlighted
   - ✅ Price should be displayed correctly

3. **Initiate Payment**
   - Click "Pay with Chapa"
   - ✅ Should redirect to Chapa checkout page
   - ✅ Amount on Chapa page should match selected plan price

4. **Complete Payment on Chapa**
   - Complete the payment on Chapa
   - ✅ Should redirect back to your site with `?status=success&tx_ref=...`

5. **Verify Payment Processing**
   - ✅ Success message should appear: "Payment completed and verified successfully!"
   - ✅ Page should reload after 1.5 seconds
   - ✅ Payment should appear in "Payment History" section
   - ✅ Payment status should be "Approved" (green badge)
   - ✅ Calendar should update and show countdown from `paymentPeriodEnd`

6. **Check Server Logs**
   - Look for: `✅ Payment verified as successful by Chapa`
   - Look for: `✅ Company payment status updated`
   - Look for: `paymentPeriodEnd` with correct date

### Test 2: Incomplete Payment (User Cancels)

1. **Start Payment**
   - Select a plan and click "Pay with Chapa"
   - Redirect to Chapa checkout

2. **Cancel/Close Payment**
   - Close the Chapa page or go back without completing payment
   - ✅ Payment should NOT appear in payment history
   - ✅ Payment should remain as "pending" (not shown in history)
   - ✅ Calendar should NOT update
   - ✅ Company status should NOT change

3. **Check Server Logs**
   - Payment should remain in database with status "pending"
   - No approval logs should appear

### Test 3: Payment Verification Endpoint

1. **After Returning from Chapa**
   - Check browser console for:
     - `🔍 Verifying payment with tx_ref:`
     - `🔍 Verification response:`
   - ✅ Should show payment status

2. **If Payment Successful**
   - Response should have: `status: 'approved'` and `verified: true`
   - ✅ Success message appears
   - ✅ Data refreshes

3. **If Payment Pending**
   - Response should have: `status: 'pending'`
   - ✅ Error message: "Payment is still pending..."
   - ✅ Payment does NOT appear in history

### Test 4: Calendar Updates

1. **Before Payment**
   - Note the current calendar countdown
   - Note the deadline date shown

2. **After Successful Payment**
   - ✅ Calendar should update immediately
   - ✅ Should show countdown from `paymentPeriodEnd`
   - ✅ Date should be: current date + plan months + any remaining time
   - ✅ Label should say "Payment Period Ends"

3. **Check Company Data**
   - `hasPaid` should be `true`
   - `paymentPeriodEnd` should be set correctly
   - `paymentDeadline` should match `paymentPeriodEnd`
   - `gracePeriodDeadline` should be `null`

## 🔍 Debugging

### Check Server Console Logs

Look for these log messages:
- `📞 Chapa callback received:` - When Chapa sends callback
- `🔍 Chapa verification response:` - When verifying payment
- `✅ Payment verified as successful by Chapa` - When payment is approved
- `✅ Company payment status updated` - When company is updated
- `📅 Chapa payment period calculation:` - Payment period calculation details

### Check Browser Console

- `🔍 Verifying payment with tx_ref:` - Frontend verification
- `🔍 Verification response:` - Backend response
- Any error messages

### Common Issues

1. **Payment not appearing in history**
   - Check if payment status is "approved" (not "pending")
   - Check browser console for errors
   - Check server logs for verification errors

2. **Calendar not updating**
   - Check if `fetchPaymentSettings()` is called after verification
   - Check if `companyData` includes `paymentPeriodEnd` and `hasPaid`
   - Check server logs to see if company was updated

3. **Payment stuck as pending**
   - Check Chapa dashboard to see actual payment status
   - Verify Chapa callback URL is accessible (may need ngrok for process.env.Backendurl)
   - Check server logs for callback/verification errors

## ✅ Expected Results

After successful payment:
- ✅ Payment appears in history with "Approved" status
- ✅ Calendar shows countdown from `paymentPeriodEnd`
- ✅ Company `hasPaid` = true
- ✅ Company `paymentPeriodEnd` = correct future date
- ✅ Payment note is NOT shown (Chapa payments don't have notes)
- ✅ No pending payments in history

After incomplete payment:
- ✅ Payment does NOT appear in history
- ✅ Calendar does NOT update
- ✅ Company status does NOT change
- ✅ Payment remains "pending" in database


