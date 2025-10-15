# Multi-Tenant Architecture Setup

Your Notion app now supports multi-tenant architecture, allowing you to sell the platform to multiple companies with complete data isolation.

## 🏗️ Architecture Overview

### Core Components

1. **Company Model** - Manages company accounts
2. **Tenant Middleware** - Enforces data isolation
3. **Super Admin Dashboard** - Control panel for managing companies
4. **Admin API** - Backend routes for company management

## 📦 What Was Added

### Backend Files

- `server/models/Company.js` - Company schema with subscription management
- `server/middleware/tenantMiddleware.js` - Validates company access
- `server/routes/admin.js` - CRUD operations for companies
- Updated `server/models/User.js` - Added `companyId` field

### Frontend Files

- `src/components/SuperAdminPage/SuperAdminPage.jsx` - Admin dashboard UI
- `src/components/SuperAdminPage/index.js` - Component export

## 🚀 Quick Start

### 1. Create Master Admin User

```javascript
// In MongoDB or via script
db.users.insertOne({
  name: "Super Admin",
  username: "superadmin",
  password: "$2a$12$hashedpassword", // Hash with bcrypt
  role: "admin",
  companyId: "master",
  isActive: true,
  status: "approved"
});
```

### 2. Create Your First Company

```bash
POST http://localhost:9000/api/admin/companies
Headers: x-auth-token: <super-admin-token>
Body: {
  "name": "TechCorp",
  "adminEmail": "admin@techcorp.com",
  "adminPhone": "+251912345678",
  "subdomain": "techcorp",
  "maxUsers": 100,
  "maxStorage": 10737418240
}
```

### 3. Access Super Admin Dashboard

Navigate to `/super-admin` in your app (add route in App.js)

## 🔐 How It Works

### Data Isolation

Every database query automatically filters by `companyId`:

```javascript
// Before
const users = await User.find();

// After (with tenant middleware)
const users = await User.find({ companyId: req.companyId });
```

### Company Status Control

- **active** - Company can access all features
- **paused** - Users see "Service Paused" message
- **suspended** - Complete access blocked

### Subscription Management

- **trial** - Limited time access
- **paid** - Full access
- **expired** - Access blocked until renewal

## 🛠️ Implementation Steps

### Step 1: Update Existing Models

Add `companyId` to all models that need isolation:

```javascript
// Example: Project model
const projectSchema = new mongoose.Schema({
  companyId: { type: String, required: true, index: true },
  // ... other fields
});
```

### Step 2: Apply Tenant Middleware

```javascript
// In routes that need isolation
const tenantMiddleware = require('../middleware/tenantMiddleware');

router.get('/projects', auth, tenantMiddleware, async (req, res) => {
  const projects = await Project.find({ companyId: req.companyId });
  res.json(projects);
});
```

### Step 3: Update Auth Routes

Modify login to include `companyId` in JWT token:

```javascript
const token = jwt.sign(
  { userId: user._id, companyId: user.companyId },
  process.env.JWT_SECRET
);
```

### Step 4: Add Route to App.js

```javascript
import SuperAdminPage from './components/SuperAdminPage';

// In your routes
<Route path="/super-admin" element={<SuperAdminPage />} />
```

## 📊 Company Management

### Create Company

```javascript
POST /api/admin/companies
{
  "name": "Company Name",
  "adminEmail": "admin@company.com",
  "adminPhone": "+251912345678",
  "subdomain": "company",
  "maxUsers": 50,
  "maxStorage": 5368709120
}
```

### Pause/Resume Company

```javascript
PATCH /api/admin/companies/:companyId/status
{
  "status": "paused" // or "active"
}
```

### Delete Company

```javascript
DELETE /api/admin/companies/:companyId
// Deletes company and all associated users
```

### Get Company Stats

```javascript
GET /api/admin/companies/:companyId/stats
// Returns user counts and activity
```

## 🎨 Subdomain Setup (Optional)

### Using Subdomains

1. Configure DNS wildcard: `*.yourapp.com → your-server-ip`
2. Update middleware to extract subdomain:

```javascript
const subdomain = req.hostname.split('.')[0];
const company = await Company.findOne({ subdomain });
```

### Using Path-Based URLs

```javascript
// yourapp.com/company1/dashboard
app.use('/:companyId', (req, res, next) => {
  req.companyId = req.params.companyId;
  next();
});
```

## 💰 Monetization Features

### Subscription Tracking

```javascript
company.subscriptionStatus = 'paid';
company.expiresAt = new Date('2025-12-31');
await company.save();
```

### Usage Limits

```javascript
const userCount = await User.countDocuments({ companyId });
if (userCount >= company.limits.maxUsers) {
  return res.status(403).json({ message: 'User limit reached' });
}
```

### Storage Limits

```javascript
const totalStorage = await calculateStorage(companyId);
if (totalStorage >= company.limits.maxStorage) {
  return res.status(403).json({ message: 'Storage limit reached' });
}
```

## 🔒 Security Considerations

1. **Always validate companyId** - Never trust client-provided company IDs
2. **Use middleware consistently** - Apply tenant middleware to all protected routes
3. **Separate super admin** - Keep master admin isolated from company data
4. **Audit logs** - Track company creation, deletion, and status changes
5. **Data encryption** - Consider encrypting sensitive company data

## 📈 Scaling Tips

1. **Database indexes** - Ensure `companyId` is indexed on all collections
2. **Caching** - Cache company status to reduce database queries
3. **Separate databases** - For large clients, consider separate DB instances
4. **Load balancing** - Distribute companies across multiple servers
5. **Monitoring** - Track per-company resource usage

## 🧪 Testing

### Test Company Isolation

```javascript
// Create two companies
const company1 = await createCompany('Company1');
const company2 = await createCompany('Company2');

// Create users in each
const user1 = await createUser({ companyId: company1.companyId });
const user2 = await createUser({ companyId: company2.companyId });

// Verify isolation
const company1Users = await User.find({ companyId: company1.companyId });
expect(company1Users).toHaveLength(1);
```

## 📝 Next Steps

1. Update all existing models with `companyId`
2. Apply tenant middleware to all routes
3. Migrate existing data to default company
4. Test data isolation thoroughly
5. Set up subdomain routing (optional)
6. Implement billing integration
7. Add company analytics dashboard

## 🆘 Troubleshooting

### Users can't access after adding companyId

Update existing users:
```javascript
await User.updateMany({}, { companyId: 'default' });
```

### Super admin can't access dashboard

Ensure super admin has:
- `role: 'admin'`
- `companyId: 'master'`

### Company status not enforcing

Check tenant middleware is applied to routes

## 📚 Additional Resources

- [Multi-Tenancy Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/multi-tenancy)
- [SaaS Architecture Best Practices](https://aws.amazon.com/saas/)
- [MongoDB Multi-Tenant Design](https://www.mongodb.com/blog/post/building-multi-tenant-applications-with-mongodb)
