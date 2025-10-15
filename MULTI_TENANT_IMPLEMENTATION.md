# Multi-Tenant Implementation Guide

## Overview
This document explains the multi-tenant system implementation where each company has isolated workspaces.

## What Has Been Implemented

### 1. **Company-Specific Login**
- Login page now accepts `?company=COMPANY_ID` parameter
- Displays company logo and name from database
- Users can only login to their assigned company

**Files Modified:**
- `src/components/auth/LoginPage.js` - Added company detection and branding display
- `server/routes/auth.js` - Added `/auth/company/:companyId` endpoint and company filtering in login
- `src/context/AppContext.js` - Updated login function to accept companyId
- `src/services/api.js` - Updated login method to send companyId

### 2. **Database Schema Updates**
Added `companyId` field to all major models:
- `server/models/User.js` - Already had companyId
- `server/models/Project.js` - Added companyId field
- `server/models/Document.js` - Added companyId field
- `server/models/Note.js` - Added companyId field
- `server/models/Goal.js` - Added companyId field
- `server/models/MeetingNote.js` - Added companyId field
- `server/models/Task.js` - Added companyId field

### 3. **Middleware Updates**
- `server/middleware/auth.js` - Now includes companyId in req.user
- `server/middleware/tenantFilter.js` - New middleware for automatic tenant filtering

## What Needs To Be Done

### 1. **Update All Route Files**
Each route file needs to filter queries by companyId. Example pattern:

```javascript
const { tenantFilter } = require('../middleware/tenantFilter');

// Add middleware to routes
router.use(tenantFilter);

// In GET routes, add companyId filter
router.get('/', auth, tenantFilter, async (req, res) => {
  const query = { companyId: req.companyId };
  const items = await Model.find(query);
  res.json(items);
});

// In POST routes, add companyId to new documents
router.post('/', auth, tenantFilter, async (req, res) => {
  const item = new Model({
    ...req.body,
    companyId: req.companyId
  });
  await item.save();
  res.json(item);
});
```

**Routes to Update:**
- `server/routes/projects.js` ✅ (Partially - needs companyId in queries)
- `server/routes/documents.js`
- `server/routes/notepad.js`
- `server/routes/goals.js`
- `server/routes/meetings.js`
- `server/routes/tasks.js`
- `server/routes/users.js` (filter by companyId)
- `server/routes/reports.js`
- `server/routes/notifications.js`

### 2. **Update User Registration**
When company admin creates users, automatically assign companyId:

```javascript
// In auth.js register-user route
router.post('/register-user', requireManager, async (req, res) => {
  const user = new User({
    ...req.body,
    companyId: req.user.companyId // Inherit from creator
  });
  await user.save();
});
```

### 3. **Data Migration Script**
Create a script to update existing data with companyId:

```javascript
// server/migrateCompanyData.js
const User = require('./models/User');
const Project = require('./models/Project');
// ... other models

async function migrateData() {
  // Update all existing records to have companyId: 'default'
  await Project.updateMany({ companyId: { $exists: false } }, { companyId: 'default' });
  await Document.updateMany({ companyId: { $exists: false } }, { companyId: 'default' });
  // ... repeat for all models
}
```

### 4. **Frontend Updates**
- Update all API calls to respect company context
- Add company switcher for super admin
- Display company name in navbar

### 5. **Testing Checklist**
- [ ] Create company via super admin
- [ ] Login with company URL parameter
- [ ] Verify company logo and name display
- [ ] Create project as company admin
- [ ] Verify project only visible to company users
- [ ] Create user in company
- [ ] Verify user can only see company data
- [ ] Test with multiple companies
- [ ] Verify data isolation between companies

## Usage Example

### Super Admin Creates Company
1. Login as super admin
2. Go to `/super-admin`
3. Click "Add Company"
4. Fill in company details (name, logo, admin credentials)
5. Copy the generated company link: `http://localhost:3000/login?company=comp_123456`

### Company Admin Login
1. Visit company-specific URL: `http://localhost:3000/login?company=comp_123456`
2. See company logo and name
3. Login with admin credentials
4. All data created is automatically tagged with companyId

### Data Isolation
- Users with `companyId: 'comp_123456'` can only see data with same companyId
- Super admin (role: 'superadmin') can see all companies
- Company admin (role: 'admin' + companyId) can manage their company

## Security Considerations

1. **Always filter by companyId** in database queries (except for superadmin)
2. **Validate companyId** exists and is active before allowing login
3. **Never expose** other companies' data in API responses
4. **Audit log** all cross-company access attempts
5. **Rate limit** login attempts per company

## Next Steps

1. Run data migration script to add companyId to existing data
2. Update all route files with tenant filtering
3. Test thoroughly with multiple companies
4. Deploy and monitor for data leakage
