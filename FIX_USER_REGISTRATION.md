# Fix User Registration CompanyId Issue

## Problem
When users register, they were getting `companyId: 'default'` instead of the correct company ID from the URL parameter. This caused them to not appear in the User Management page for their company.

## Root Cause
- Frontend was sending `companyId` from URL parameter
- Backend was defaulting to `'default'` if no companyId provided
- Users who registered without the `?company=COMPANY_ID` parameter got `'default'`

## Solution Applied

### 1. Frontend Changes (RegisterPage.js)
```javascript
// Changed from:
companyId: companyId || 'default'

// To:
const userCompanyId = companyId || 'melanote'; // Default to melanote
companyId: userCompanyId
```

### 2. Backend Changes (auth.js)
```javascript
// Changed from:
const userCompanyId = req.body.companyId || 'default';

// To:
const userCompanyId = req.body.companyId || 'melanote';
```

### 3. Login Page Enhancement
- Now fetches and displays company branding when `?company=COMPANY_ID` is in URL
- Shows company logo and name
- Passes companyId to login function
- Register link includes companyId parameter

## How to Fix Existing Users

### Option 1: Run Migration Script (Recommended)
```bash
cd server
node fixUserCompanyIds.js
```

This will:
- Find all users with `companyId: 'default'`
- Update them to `companyId: 'melanote'`
- Show you the list of updated users

### Option 2: Manual Database Update
```javascript
// In MongoDB shell or Compass
db.users.updateMany(
  { companyId: 'default' },
  { $set: { companyId: 'melanote' } }
)
```

### Option 3: Update Individual User
```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { username: 'USERNAME_HERE' },
  { $set: { companyId: 'melanote' } }
)
```

## Testing the Fix

### 1. Test New Registration
```bash
# Visit registration with company parameter
http://localhost:3000/register?company=melanote

# Register a new user
# Check database - user should have companyId: 'melanote'
```

### 2. Verify User Appears in Management
```bash
# Login as manager/admin
# Go to User Management page
# New user should appear in pending list
```

### 3. Test Company-Specific Login
```bash
# Visit login with company parameter
http://localhost:3000/login?company=melanote

# Should show Mela Note branding
# Login should work correctly
```

## Company URL Structure

### Registration URLs
```
Default (Mela Note):
http://localhost:3000/register
http://localhost:3000/register?company=melanote

Other Companies:
http://localhost:3000/register?company=COMPANY_ID
```

### Login URLs
```
Default (Mela Note):
http://localhost:3000/login
http://localhost:3000/login?company=melanote

Other Companies:
http://localhost:3000/login?company=COMPANY_ID
```

## Verification Checklist

After applying the fix:

- [ ] Run migration script to fix existing users
- [ ] Test new user registration with company parameter
- [ ] Verify user appears in User Management page
- [ ] Test login with company parameter
- [ ] Verify company branding displays correctly
- [ ] Test approval workflow for new users
- [ ] Confirm data isolation between companies

## Database Query to Check Users

```javascript
// Check all users and their companies
db.users.find({}, { name: 1, username: 1, companyId: 1, role: 1, status: 1 })

// Check users by company
db.users.find({ companyId: 'melanote' })

// Check users with default companyId (should be 0 after fix)
db.users.find({ companyId: 'default' })

// Check pending users
db.users.find({ status: 'pending', companyId: 'melanote' })
```

## Important Notes

1. **Default Company**: All users without a specific company parameter will default to `'melanote'`
2. **Super Admin**: Super admin has `companyId: 'master'` and can see all companies
3. **Company Isolation**: Users can only see data from their own company
4. **Registration Flow**: Users register → Status: pending → Manager approves → Status: approved

## Future Improvements

Consider implementing:
- Company selection dropdown on registration page
- Email verification before approval
- Automatic company detection from subdomain
- Company-specific registration codes

## Support

If users still don't appear after running the migration:
1. Check user's `companyId` in database
2. Verify manager is logged in with same `companyId`
3. Check user's `status` field (should be 'pending' or 'approved')
4. Verify `isActive` field is true for approved users
5. Check browser console for API errors
