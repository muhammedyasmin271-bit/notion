# Multi-Tenant Quick Reference Card

## 🚀 Getting Started (3 Steps)

### 1. Run Migration
```bash
cd server
node migrateCompanyData.js
```

### 2. Create Companies
- Login as super admin → `/super-admin`
- Click "Add Company" → Fill form → Copy link

### 3. Test
- Visit company link → See logo/name → Login → Verify isolation

## 📋 Key URLs

| Purpose | URL |
|---------|-----|
| Super Admin | `process.env.Backendurl/super-admin` |
| Company A Login | `process.env.Backendurl/login?company=COMPANY_ID` |
| Default Login | `process.env.Backendurl/login` |

## 🔑 Key Concepts

### Company ID
- Unique identifier: `comp_1234567890_abc123`
- Auto-generated on company creation
- Used in login URL
- Filters all data queries

### Data Isolation
```
Company A Users → See ONLY Company A data
Company B Users → See ONLY Company B data
Super Admin → See ALL data
```

### Tenant Filtering
```javascript
// Automatic in all routes
if (req.user.role !== 'superadmin') {
  query.companyId = req.companyId;
}
```

## 📁 Updated Files

### Critical Routes (✅ Complete)
- `server/routes/users.js`
- `server/routes/projects.js`
- `server/routes/documents.js`
- `server/routes/notepad.js`

### Models (✅ All have companyId)
- User, Project, Document, Note
- Goal, MeetingNote, Task

### Middleware (✅ Complete)
- `server/middleware/auth.js` - Includes companyId
- `server/middleware/tenantFilter.js` - Filters by company

## 🧪 Quick Test

### Create & Test (15 min)
```bash
# 1. Create Company A
Super Admin → Add Company → Copy link

# 2. Login to Company A
Visit link → Login → Create project

# 3. Create Company B
Super Admin → Add Company → Copy link

# 4. Login to Company B
Visit link → Login → Verify can't see Company A project
```

## 🔒 Security Pattern

### Every Route Follows:
```javascript
// 1. Import
const { tenantFilter } = require('../middleware/tenantFilter');

// 2. Apply
router.use(tenantFilter);

// 3. Filter queries
if (req.user.role !== 'superadmin') {
  query.companyId = req.companyId;
}

// 4. Auto-assign on create
const doc = new Model({
  ...data,
  companyId: req.companyId
});
```

## 📊 Data Flow

```
User Login → JWT with companyId → Middleware adds companyId → Routes filter by companyId → Return company data only
```

## ⚠️ Common Issues

### Issue: Can see other company data
**Fix**: Check route has `tenantFilter` middleware

### Issue: Login fails
**Fix**: Verify company exists and status is 'active'

### Issue: Missing companyId
**Fix**: Run migration script

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| IMPLEMENTATION_COMPLETE.md | Overall status |
| TESTING_GUIDE.md | Detailed test plan |
| MULTI_TENANT_QUICK_START.md | Setup guide |
| ROUTES_UPDATE_COMPLETE.md | Route changes |

## ✅ Checklist

### Before Testing
- [ ] Migration run
- [ ] Server running
- [ ] Super admin access

### Testing
- [ ] Create 2 companies
- [ ] Add data to each
- [ ] Verify isolation
- [ ] Test sharing
- [ ] Test super admin

### Deployment
- [ ] All tests pass
- [ ] Backup database
- [ ] Run migration on prod
- [ ] Deploy code
- [ ] Monitor logs

## 🎯 Success Criteria

- ✅ Company A can't see Company B data
- ✅ Company B can't see Company A data
- ✅ Super admin sees all data
- ✅ Sharing works within company
- ✅ Login shows company branding

## 💡 Tips

1. **Use incognito windows** for testing multiple companies
2. **Copy company links** immediately after creation
3. **Test with real data** to verify isolation
4. **Monitor logs** during testing
5. **Document any issues** found

## 🆘 Need Help?

1. Check **TESTING_GUIDE.md** for detailed tests
2. Review **MULTI_TENANT_IMPLEMENTATION.md** for technical details
3. See **ARCHITECTURE_DIAGRAM.md** for visual overview
4. Check **IMPLEMENTATION_CHECKLIST.md** for progress

## 📞 Quick Commands

```bash
# Run migration
cd server && node migrateCompanyData.js

# Start dev server
npm run dev

# Check logs
# (Monitor console for errors)

# Test API
curl process.env.Backendurl/api/auth/company/COMPANY_ID
```

---

**Status**: ✅ READY FOR TESTING
**Time to Test**: 2-3 hours
**Risk**: Low
