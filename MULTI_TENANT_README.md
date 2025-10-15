# Multi-Tenant System - Complete Guide

## 📚 Documentation Index

This multi-tenant implementation includes several documentation files:

1. **MULTI_TENANT_README.md** (this file) - Overview and getting started
2. **MULTI_TENANT_QUICK_START.md** - Step-by-step setup guide
3. **MULTI_TENANT_IMPLEMENTATION.md** - Detailed technical implementation
4. **IMPLEMENTATION_SUMMARY.md** - What's done and what's pending
5. **ARCHITECTURE_DIAGRAM.md** - Visual system architecture

## 🎯 What is Multi-Tenancy?

Multi-tenancy allows multiple companies (tenants) to use the same application while keeping their data completely isolated. Each company has:

- **Unique Company ID**: e.g., `comp_1234567890_abc123`
- **Custom Branding**: Logo and company name
- **Isolated Data**: Cannot see other companies' data
- **Own Users**: Company admin manages their users
- **Company-Specific URL**: `http://localhost:3000/login?company=COMPANY_ID`

## 🚀 Quick Start (5 Minutes)

### Step 1: Run Migration
```bash
cd server
node migrateCompanyData.js
```

### Step 2: Create a Company
1. Login as super admin
2. Go to `/super-admin`
3. Click "Add Company"
4. Fill in details and create
5. Copy the generated company link

### Step 3: Test Company Login
1. Visit the company link
2. See company logo and name
3. Login with company admin credentials
4. You're in the company workspace!

## 📖 Detailed Setup

See **MULTI_TENANT_QUICK_START.md** for detailed step-by-step instructions.

## 🏗️ Architecture

### System Components

```
Super Admin → Creates → Companies → Have → Users → Create → Data
                                                            (Projects, Docs, Notes)
```

### Data Isolation

```
Company A Data ─┐
                ├─ Database ─ Filtered by companyId
Company B Data ─┘
```

See **ARCHITECTURE_DIAGRAM.md** for visual diagrams.

## ✅ What's Implemented

### Frontend
- ✅ Company-specific login page
- ✅ Company branding display (logo, name)
- ✅ URL parameter detection (`?company=ID`)

### Backend
- ✅ Company creation API
- ✅ Company branding API
- ✅ Login with company validation
- ✅ JWT tokens include companyId
- ✅ Auth middleware includes companyId
- ✅ Tenant filtering middleware

### Database
- ✅ Company model
- ✅ All models have companyId field
- ✅ Migration script ready

## ⚠️ What's Pending

### Critical (Must Do)
- [ ] Update all route files to filter by companyId
- [ ] Test data isolation between companies
- [ ] Update user registration to inherit companyId

### Important (Should Do)
- [ ] Add company validation in all routes
- [ ] Add audit logging for cross-company attempts
- [ ] Add rate limiting per company

### Nice to Have
- [ ] Company settings page
- [ ] Company usage statistics
- [ ] Company-specific themes

See **IMPLEMENTATION_SUMMARY.md** for complete checklist.

## 🔧 How to Update Routes

For each route file in `server/routes/`:

```javascript
// 1. Import tenant filter
const { tenantFilter } = require('../middleware/tenantFilter');

// 2. Apply middleware
router.use(tenantFilter);

// 3. Filter queries by companyId
router.get('/', auth, async (req, res) => {
  const query = req.user.role === 'superadmin' 
    ? {} 
    : { companyId: req.companyId };
  
  const items = await Model.find(query);
  res.json(items);
});

// 4. Auto-assign companyId on create
router.post('/', auth, async (req, res) => {
  const item = new Model({
    ...req.body,
    companyId: req.companyId
  });
  await item.save();
  res.json(item);
});
```

See **MULTI_TENANT_IMPLEMENTATION.md** for detailed patterns.

## 🧪 Testing

### Test Data Isolation

1. **Create Company A:**
   - Login as super admin
   - Create "Company A"
   - Note the company link

2. **Add Data to Company A:**
   - Login to Company A
   - Create projects, documents, notes

3. **Create Company B:**
   - Login as super admin
   - Create "Company B"
   - Note the company link

4. **Verify Isolation:**
   - Login to Company B
   - Verify you CANNOT see Company A's data
   - Create some data in Company B

5. **Test Super Admin:**
   - Login as super admin
   - Verify you CAN see both companies' data

### Test Checklist

- [ ] Company creation works
- [ ] Company link is generated
- [ ] Company logo displays
- [ ] Company name displays
- [ ] Login with company URL works
- [ ] Data is isolated between companies
- [ ] Super admin sees all data
- [ ] Company admin sees only their data
- [ ] Users see only their company data

## 🔒 Security

### Key Security Features

1. **Company Validation**: Every login validates company exists and is active
2. **Tenant Filtering**: All queries automatically filtered by companyId
3. **JWT Tokens**: Include companyId for validation
4. **Role-Based Access**: Super admin, company admin, manager, user
5. **Audit Logging**: Track all data access (to be implemented)

### Security Checklist

- [ ] All routes filter by companyId
- [ ] No cross-company data leakage
- [ ] Company status checked on login
- [ ] Invalid companyId rejected
- [ ] API endpoints validate companyId
- [ ] File uploads scoped to company

## 📊 Database Schema

### Companies Collection
```javascript
{
  companyId: "comp_123_abc",
  name: "Melanote",
  branding: {
    logo: "base64_or_url",
    companyName: "Melanote",
    primaryColor: "#3B82F6"
  },
  status: "active",
  adminEmail: "admin@melanote.com",
  adminUserId: ObjectId("..."),
  companyLink: "http://localhost:3000/login?company=comp_123_abc",
  limits: {
    maxUsers: 50,
    maxStorage: 5368709120
  }
}
```

### Users Collection
```javascript
{
  _id: ObjectId("..."),
  username: "melanote_admin",
  password: "hashed_password",
  role: "admin",
  companyId: "comp_123_abc", // Links to company
  email: "admin@melanote.com"
}
```

### Projects Collection
```javascript
{
  _id: ObjectId("..."),
  title: "Project Alpha",
  description: "...",
  owner: ObjectId("..."),
  companyId: "comp_123_abc", // Links to company
  status: "In Progress"
}
```

All other collections follow the same pattern with `companyId` field.

## 🎨 User Experience

### Super Admin Flow
1. Login at `/login`
2. Go to `/super-admin`
3. Create companies
4. Manage all companies
5. View all data across companies

### Company Admin Flow
1. Receive company link from super admin
2. Visit company-specific URL
3. See company branding
4. Login with admin credentials
5. Manage company users
6. See all company data

### Regular User Flow
1. Receive company link from admin
2. Visit company-specific URL
3. See company branding
4. Login with user credentials
5. See only their assigned data

## 🐛 Troubleshooting

### Issue: Can't see company logo
**Solution**: Verify logo was uploaded and file exists in `server/uploads/`

### Issue: Can see other company's data
**Solution**: This is a critical bug! Check:
- Routes are filtering by companyId
- Middleware is applied correctly
- User's companyId matches data's companyId

### Issue: Login fails with company URL
**Solution**: Verify:
- Company exists in database
- Company status is 'active'
- CompanyId in URL is correct
- User belongs to that company

### Issue: "Company not found" error
**Solution**: 
- Check companyId is correct
- Verify company exists in database
- Check company status is 'active'

## 📞 Support & Resources

### Documentation Files
- **Quick Start**: MULTI_TENANT_QUICK_START.md
- **Implementation**: MULTI_TENANT_IMPLEMENTATION.md
- **Summary**: IMPLEMENTATION_SUMMARY.md
- **Architecture**: ARCHITECTURE_DIAGRAM.md

### Key Files Modified
- Frontend: `src/components/auth/LoginPage.js`
- Backend: `server/routes/auth.js`, `server/routes/admin.js`
- Middleware: `server/middleware/auth.js`, `server/middleware/tenantFilter.js`
- Models: All models in `server/models/`

### Migration Script
- `server/migrateCompanyData.js` - Run this first!

## 🎯 Success Criteria

Your multi-tenant system is working when:

✅ Multiple companies can coexist
✅ Each company has unique branding
✅ Data is completely isolated
✅ Super admin can manage all companies
✅ Company admins can only manage their company
✅ Users can only see their company's data
✅ No data leakage between companies

## 🚀 Next Steps

1. **Run Migration**: `node server/migrateCompanyData.js`
2. **Update Routes**: Apply tenant filtering to all routes
3. **Test Thoroughly**: Create multiple companies and verify isolation
4. **Deploy**: Once tested, deploy to production
5. **Monitor**: Watch logs for any cross-company access attempts

## 📝 Notes

- Default companyId is `'default'` for existing data
- Super admin role bypasses company filtering
- Company status can be: active, paused, suspended
- Each company gets auto-generated unique ID
- Company links are permanent (don't change companyId)

---

**Need Help?** Check the other documentation files or review the implementation summary for detailed technical information.
