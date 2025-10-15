# Company Settings - Database Update Verification Guide

## Overview

This guide explains how the company settings updates are saved to the MongoDB database and how to verify they're working correctly.

## What I Fixed

### 1. ✅ Fixed API Endpoints

**Problem:** The frontend was using relative URLs that pointed to the React dev server instead of the backend.

**Solution:** Updated all API calls in `CompanySettings.js` to use the full backend URL:

- `/api/company/branding` → `http://localhost:9000/api/company/branding`
- `/api/company/contact` → `http://localhost:9000/api/company/contact`
- `/api/company/my-company` → `http://localhost:9000/api/company/my-company`
- `/api/company/stats` → `http://localhost:9000/api/company/stats`

### 2. ✅ Enhanced Backend Logging

Added comprehensive logging to track database updates in `server/routes/company.js`:

- Logs when update requests are received
- Shows before/after values
- Confirms when data is saved to database
- Verifies the save by fetching the data again

### 3. ✅ Enhanced Frontend Logging

Added detailed console logging in the frontend to track:

- What data is being sent
- Response from backend
- Verification that data was saved

## How Database Updates Work

### Branding Update Flow

1. User fills in company name, color, and/or uploads logo
2. Frontend creates FormData and sends PUT request to `/api/company/branding`
3. Backend (routes/company.js):
   - Finds company by companyId
   - Updates the `branding` object fields
   - Calls `await company.save()` - **This saves to MongoDB**
   - Fetches the company again to verify save
   - Returns success response
4. Frontend refreshes data and reloads page to show changes

### Contact Info Update Flow

1. User updates admin email and/or phone
2. Frontend sends PUT request to `/api/company/contact`
3. Backend:
   - Finds company by companyId
   - Updates `adminEmail` and `adminPhone` fields
   - Calls `await company.save()` - **This saves to MongoDB**
   - Verifies save by fetching again
   - Returns success response
4. Frontend refreshes data

## Database Schema

The Company model (server/models/Company.js) has these fields for updates:

```javascript
{
  branding: {
    logo: String,              // Path to uploaded logo file
    primaryColor: String,      // Hex color code (e.g., #3B82F6)
    companyName: String        // Display name for the company
  },
  adminEmail: String,          // Admin contact email
  adminPhone: String          // Admin contact phone
}
```

## How to Test Database Updates

### Method 1: Use the Test Script

I created a test script to verify database updates are working:

```bash
node test-company-update.js
```

This will:

- Connect to your MongoDB database
- Find a company
- Update branding fields
- Verify the changes were saved
- Restore original values

### Method 2: Check Server Console Logs

When you update company settings, watch the **backend server console**. You should see:

```
🎨 Branding update request received
User companyId: COMP-XXX
Request body: { companyName: 'Test', primaryColor: '#FF5733' }
✅ Company found: Your Company Name
Current branding: { ... }
Updating company name from ... to Test
Updating primary color from ... to #FF5733
Saving to database...
✅ Company branding saved successfully to database
Verification - branding after save: { companyName: 'Test', primaryColor: '#FF5733', ... }
```

### Method 3: Check Browser Console

Open browser DevTools (F12) and check the Console tab. You should see:

```
🎨 Starting branding save...
Form data: { companyName: 'Test', primaryColor: '#FF5733', hasLogo: false }
Sending request to backend...
Response status: 200
✅ Backend response: { message: '...', branding: {...} }
Refreshing company data to verify save...
✅ Branding update complete!
```

### Method 4: Verify in MongoDB Directly

#### Using MongoDB Compass:

1. Open MongoDB Compass
2. Connect to `mongodb://localhost:27017`
3. Navigate to `notion-app` database → `companies` collection
4. Find your company document
5. Check the `branding`, `adminEmail`, and `adminPhone` fields

#### Using MongoDB Shell:

```bash
mongosh
use notion-app
db.companies.find({ companyId: "YOUR-COMPANY-ID" }).pretty()
```

Look for:

```json
{
  "branding": {
    "companyName": "Your Updated Name",
    "primaryColor": "#FF5733",
    "logo": "/uploads/company-logos/xxx.png"
  },
  "adminEmail": "updated@email.com",
  "adminPhone": "+251912345678"
}
```

## Success Messages

When updates are successful, you'll see:

✅ **Branding:** "Company branding saved to database successfully!"
✅ **Contact Info:** "Contact information saved to database successfully!"

These messages confirm the data has been:

1. Sent to backend
2. Saved to MongoDB via `await company.save()`
3. Verified by re-fetching from database

## Troubleshooting

### Issue: Still getting "Unexpected token" error

**Solution:** Make sure backend server is running on port 9000

```bash
cd server
npm start
```

### Issue: Updates not showing after page reload

**Causes:**

1. Database not saving (check server logs)
2. Cache issue (hard refresh with Ctrl+Shift+R)
3. Wrong company being updated (check companyId in logs)

**Debug Steps:**

1. Check server console for save confirmations
2. Check browser console for successful responses
3. Verify in MongoDB that the data changed
4. Clear browser cache and reload

### Issue: Logo not displaying

**Causes:**

1. File upload middleware not working
2. Uploads directory doesn't exist
3. File path incorrect

**Check:**

1. Server logs show "File uploaded: xxx.png"
2. File exists in `server/uploads/company-logos/`
3. Backend is serving static files from /uploads

## Files Modified

1. ✅ `src/components/AdminDashboard/CompanySettings.js` - Fixed API URLs, added logging
2. ✅ `server/routes/company.js` - Enhanced logging and verification
3. ✅ `test-company-update.js` - Created test script

## Database Verification Checklist

- [ ] Backend server running on port 9000
- [ ] MongoDB running on port 27017
- [ ] Company exists in database
- [ ] User is admin of the company
- [ ] Update request reaches backend (check server logs)
- [ ] `company.save()` executes successfully
- [ ] Verification fetch shows updated values
- [ ] Frontend receives success response
- [ ] Data persists after page reload
- [ ] MongoDB shows updated values

## Next Steps

1. Start your backend server: `npm start` in server directory
2. Open Company Settings in the admin dashboard
3. Make changes to branding or contact info
4. Click Save
5. Watch both server console and browser console for logs
6. Verify the success message appears
7. Check MongoDB to confirm changes persisted

---

**Note:** All database updates use `await company.save()` which is Mongoose's method to persist changes to MongoDB. The backend also verifies each save by fetching the data again before sending the response.
