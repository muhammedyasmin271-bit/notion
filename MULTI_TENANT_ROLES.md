# Multi-Tenant Role System

## 4-Tier Role Hierarchy

### 1. Super Admin (Platform Owner)
- **Username**: `adminadmin`
- **Password**: `06827`
- **Role**: `superadmin`
- **CompanyId**: `master`
- **Access**: Super Admin Dashboard at `/super-admin`

**Capabilities:**
- Create, pause, resume, and delete companies
- View all companies and their statistics
- Manage platform-wide settings
- Cannot access individual company data
- Sells the platform to companies

### 2. Admin (Company Owner/CEO)
- **Role**: `admin`
- **CompanyId**: Assigned company ID
- **Access**: Admin Dashboard at `/admin`

**Capabilities:**
- Full control over their company
- Manage all users in their company
- Approve/decline managers and users
- Access all company data and reports
- Configure company settings

### 3. Manager (Company Managers)
- **Role**: `manager`
- **CompanyId**: Assigned company ID
- **Access**: Manager features

**Capabilities:**
- Approve/decline regular users
- Create and manage projects
- Assign tasks to users
- View team reports
- Create meetings and documents

### 4. User (Company Workers)
- **Role**: `user`
- **CompanyId**: Assigned company ID
- **Access**: Basic features

**Capabilities:**
- View assigned projects
- Complete tasks
- Submit reports
- Create personal notes
- Participate in meetings

## Setup Instructions

### 1. Create Super Admin

Run the script:
```bash
cd server
node createSuperAdmin.js
```

This creates:
- Username: `adminadmin`
- Password: `06827`
- Role: `superadmin`

### 2. Login as Super Admin

1. Go to login page
2. Enter credentials: `adminadmin` / `06827`
3. Automatically redirects to `/super-admin`

### 3. Create Companies

From Super Admin Dashboard:
1. Click "Add Company"
2. Enter company details
3. Company gets unique `companyId`

### 4. Create Company Admin

Each company needs an admin:
```javascript
// Create first admin for a company
{
  "name": "Company CEO",
  "username": "ceo",
  "password": "password",
  "role": "admin",
  "companyId": "comp_xxx", // From company creation
  "status": "approved",
  "isActive": true
}
```

### 5. Company Admin Creates Users

Company admin can:
- Register managers (need approval)
- Register users (need approval)
- Approve/decline registrations

## Data Isolation

### By CompanyId

All data is filtered by `companyId`:
- Users can only see their company's data
- Projects, documents, meetings are company-specific
- Super admin cannot see company data (only metadata)

### Database Queries

Always include `companyId`:
```javascript
// Example
const projects = await Project.find({ companyId: req.user.companyId });
```

## Role Checks

### Frontend (React)

```javascript
// In components
const { user } = useAppContext();

if (user.role === 'superadmin') {
  // Show super admin features
}

if (user.role === 'admin') {
  // Show company admin features
}

if (user.role === 'manager') {
  // Show manager features
}
```

### Backend (Express)

```javascript
// Middleware
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Super admin access required' });
  }
  next();
};

// Usage
router.get('/companies', auth, isSuperAdmin, async (req, res) => {
  // Only super admin can access
});
```

## Migration Steps

### Update Existing Users

If you have existing users without `companyId`:

```javascript
// Create default company
const defaultCompany = await Company.create({
  companyId: 'default',
  name: 'Default Company',
  adminEmail: 'admin@default.com',
  status: 'active'
});

// Update all users
await User.updateMany(
  { companyId: { $exists: false } },
  { companyId: 'default' }
);
```

### Update Existing Models

Add `companyId` to all models:
- Project
- Goal
- Document
- Meeting
- Note
- Task
- Report

## Security Notes

1. **Super Admin Isolation**: Super admin cannot access company data
2. **Company Isolation**: Companies cannot see each other's data
3. **Role Validation**: Always validate role on backend
4. **Token Security**: JWT includes `companyId` and `role`
5. **Middleware**: Apply tenant middleware to all company routes

## Testing

### Test Super Admin
```bash
# Login
POST /api/auth/login
{
  "username": "adminadmin",
  "password": "06827"
}

# Should redirect to /super-admin
```

### Test Company Isolation
```bash
# Create two companies
# Create users in each
# Verify users can only see their company data
```

## Troubleshooting

### Super Admin Can't Login
- Check role is `superadmin` (not `admin`)
- Check `companyId` is `master`
- Check user is active and approved

### Users See Wrong Data
- Verify `companyId` in JWT token
- Check tenant middleware is applied
- Verify database queries include `companyId`

### Company Admin Can't Manage Users
- Check role is `admin`
- Verify `companyId` matches
- Check permissions in middleware
