# Chapa Payment Integration Debug Guide

## ✅ What's Working
- Chapa API key is valid and working
- Backend payment route exists
- Payment model has all required fields
- Frontend payment form is properly structured

## 🔍 Debugging Steps

### Step 1: Check Browser Console
1. Open your app in the browser
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Try to make a payment
5. Look for any error messages

### Step 2: Check Network Tab
1. In Developer Tools, go to Network tab
2. Try to make a payment
3. Look for the request to `/api/payments/chapa/initialize`
4. Check if the request is being sent
5. Check the response status and data

### Step 3: Check Server Logs
1. Look at your server terminal/console
2. You should see logs like:
   ```
   📥 Chapa payment request received: { amount: 1000, months: [12], ... }
   🔧 Chapa Configuration: { hasToken: true, ... }
   📳 Preparing Chapa payment: { amount: 1000, ... }
   🌐 Calling Chapa API: https://api.chapa.co/v1/transaction/initialize
   ```

### Step 4: Common Issues & Solutions

#### Issue 1: "Authentication token not found"
**Solution:** Make sure you're logged in as an admin user.

#### Issue 2: "Only company admins can initialize payments"
**Solution:** Your user role must be 'admin', not 'user' or 'manager'.

#### Issue 3: Network request fails
**Solution:** Check if backend server is running on port 9000.

#### Issue 4: Chapa API errors
**Solution:** Check the specific error message in server logs.

## 🧪 Test Commands

### Test 1: Verify Chapa API
```bash
cd server
node test-chapa.js
```

### Test 2: Check if server is running
```bash
curl process.env.Backendurl/api/auth/test
```

### Test 3: Test payment endpoint (need valid token)
```bash
cd server
# Edit test-payment-endpoint.js with your token first
node test-payment-endpoint.js
```

## 🔧 Quick Fixes

### Fix 1: Restart Backend Server
```bash
cd server
npm run dev
```

### Fix 2: Clear Browser Cache
1. Press Ctrl+Shift+R to hard refresh
2. Or clear browser cache completely

### Fix 3: Check Environment Variables
Make sure your `.env` file has:
```
CHAPA_TOKEN=CHASECK-9InSJMt5QQ7ksdq8cZA6I7szlgePMoQr
CHAPA_API=https://api.chapa.co/v1
BASE_URL=process.env.Backendurl
```

## 📞 Next Steps
1. Follow the debugging steps above
2. Share any error messages you find
3. Check both browser console and server logs
4. Verify your user has admin role

## 🎯 Expected Flow
1. Select plan → ✅
2. Click "Pay with Chapa" → ✅
3. Frontend sends request to backend → ?
4. Backend calls Chapa API → ?
5. Chapa returns checkout URL → ?
6. Browser redirects to Chapa → ?

Let's identify where this flow breaks!