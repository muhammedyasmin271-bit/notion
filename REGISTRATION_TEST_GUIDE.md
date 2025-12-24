# Registration Testing Guide

## ✅ I've Fixed the Registration Issue!

### What Was Wrong:

- Users were being registered with `companyId: 'default'` instead of the actual company ID
- The companyId from the URL wasn't being captured properly

### What I Fixed:

1. ✅ **Frontend (RegisterPage.js)**: Now extracts `companyId` from URL and passes it to backend
2. ✅ **Backend (auth.js)**: Added detailed logging to track companyId
3. ✅ **Database**: Cleaned up 2 users that had wrong companyId

---

## 🧪 How to Test Registration

### Step 1: Get the Company Registration Link

1. **Login as Super Admin**
2. **Go to Super Admin Dashboard**
3. **Find your company** (e.g., "darel kubra")
4. **Copy the Company Link** - it will look like:
   ```
   process.env.Backendurl/login?company=comp_1760450564995_wt9889rv0
   ```

### Step 2: Create Registration Link

**Change `/login` to `/register` in the URL:**

❌ **Login Link:** `process.env.Backendurl/login?company=comp_1760450564995_wt9889rv0`

✅ **Register Link:** `process.env.Backendurl/register?company=comp_1760450564995_wt9889rv0`

### Step 3: Register a Test User

1. **Paste the register link** in your browser
2. **You should see**:
   - Company logo and name (e.g., "darel kubra")
   - "Company Registration" text
3. **Fill out the form**:
   - Name: Test User
   - Username: testuser
   - Email: test@example.com (optional)
   - Phone: 0912345678 (optional)
   - Password: test123
4. **Click "Create Account"**

### Step 4: Check Browser Console

**Open Developer Tools (F12) and look for:**

```
📝 Registering user with companyId: comp_1760450564995_wt9889rv0
✅ Registration successful: {...}
```

### Step 5: Check Server Console

**In your server terminal, you should see:**

```
🔵 Registration Request Body: {
  "name": "Test User",
  "username": "testuser",
  "companyId": "comp_1760450564995_wt9889rv0",
  ...
}
🔵 CompanyId from request: comp_1760450564995_wt9889rv0
🔵 User will be assigned companyId: comp_1760450564995_wt9889rv0
✅ User saved successfully: {
  name: "Test User",
  username: "testuser",
  companyId: "comp_1760450564995_wt9889rv0",
  status: "pending",
  ...
}
```

### Step 6: Verify in User Management

1. **Login as company admin** (e.g., "arega" for darel kubra)
2. **Go to User Management page**
3. **You should see** the test user in the pending users list!

---

## 🔍 Troubleshooting

### If companyId is still 'default':

**Check the URL:**

- ❌ Bad: `process.env.Backendurl/register` (no company parameter)
- ✅ Good: `process.env.Backendurl/register?company=comp_xxx`

**Check Browser Console:**

- Should see: `📝 Registering user with companyId: comp_xxx`
- Not: `📝 Registering user with companyId: default`

**Check Server Console:**

- Should see: `🔵 CompanyId from request: comp_xxx`
- Not: `🔵 CompanyId from request: undefined`

### If user doesn't appear in User Management:

**Check if admin is logged into correct company:**

- Each company admin can only see users from their own company
- CompanyId must match between admin and user

**Check user status:**

- New users have `status: 'pending'`
- They need to be approved by admin
- Check the "Pending Approvals" section

---

## 🎯 Quick Test Commands

### View all users by company:

```bash
cd server
node -e "
const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://process.env.Backendurl:27017/notion-app').then(async () => {
  const users = await User.find().select('name username companyId role status');
  users.forEach(u => {
    console.log(\`\${u.name} (@\${u.username}) - Company: \${u.companyId} - Role: \${u.role} - Status: \${u.status}\`);
  });
  process.exit();
});
"
```

---

## 📝 Summary

✅ **Cleaned up** 2 users with wrong companyId
✅ **Added logging** to track companyId in registration
✅ **Fixed** RegisterPage to extract companyId from URL
✅ **Enhanced** RegisterPage to show company branding

**Now users will register with the correct companyId and appear in their company's user management page!** 🎉
