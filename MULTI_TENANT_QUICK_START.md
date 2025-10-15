# Multi-Tenant Quick Start Guide

## Setup Steps

### 1. Run Data Migration
First, migrate existing data to add companyId field:

```bash
cd server
node migrateCompanyData.js
```

This will add `companyId: 'default'` to all existing records.

### 2. Create a Company (Super Admin)

1. **Login as Super Admin:**
   - Visit: `http://localhost:3000/login`
   - Use super admin credentials

2. **Navigate to Super Admin Dashboard:**
   - Go to: `http://localhost:3000/super-admin`

3. **Create New Company:**
   - Click "Add Company" button
   - Fill in the form:
     - **Company Name**: e.g., "Melanote"
     - **Admin Email**: admin@melanote.com
     - **Admin Phone**: +251912345678
     - **Admin Username**: melanote_admin
     - **Admin Password**: SecurePass123
     - **Logo**: Upload company logo (optional)
   - Click "Create Company"

4. **Copy Company Link:**
   - After creation, you'll see a link like:
     ```
     http://localhost:3000/login?company=comp_1234567890_abc123
     ```
   - Copy this link and share it with the company admin

### 3. Login as Company Admin

1. **Visit Company-Specific URL:**
   ```
   http://localhost:3000/login?company=comp_1234567890_abc123
   ```

2. **You'll See:**
   - Company logo (if uploaded)
   - Company name
   - Login form

3. **Login with Admin Credentials:**
   - Username: melanote_admin
   - Password: SecurePass123

4. **You're Now in Company Workspace:**
   - All data you create is isolated to your company
   - You can only see users, projects, documents from your company

### 4. Create Company Users

As company admin:

1. Go to **User Management** page
2. Click "Add User"
3. Fill in user details
4. User automatically gets assigned to your company

### 5. Test Data Isolation

1. **Create Test Data:**
   - Create a project as Melanote admin
   - Create a document
   - Create a note

2. **Create Another Company:**
   - Login as super admin
   - Create another company (e.g., "TestCorp")
   - Get the company link

3. **Login to Second Company:**
   - Visit TestCorp's company URL
   - Login with TestCorp admin credentials
   - Verify you CANNOT see Melanote's data

4. **Verify Isolation:**
   - Melanote users only see Melanote data
   - TestCorp users only see TestCorp data
   - Super admin can see all companies

## Company URL Format

```
http://localhost:3000/login?company=COMPANY_ID
```

Where `COMPANY_ID` is the unique identifier generated when creating the company.

## Important Notes

### For Super Admin:
- Can create and manage all companies
- Can see all data across companies
- Access super admin dashboard at `/super-admin`

### For Company Admin:
- Can manage users within their company
- Can see all data within their company
- Cannot see other companies' data
- Role: `admin` with specific `companyId`

### For Company Users:
- Can only see data they have access to within their company
- Cannot see other companies' data
- Role: `user` or `manager` with specific `companyId`

## Troubleshooting

### Issue: Can't see company logo
- **Solution**: Make sure logo was uploaded during company creation
- Check that the logo file exists in `server/uploads/`

### Issue: Can see other company's data
- **Solution**: This is a bug! Check that:
  - All routes are filtering by `companyId`
  - User's `companyId` matches the data's `companyId`
  - Middleware is properly applied

### Issue: Login fails with company URL
- **Solution**: Verify:
  - Company exists in database
  - Company status is 'active'
  - CompanyId in URL is correct

## Security Checklist

- [ ] All database queries filter by companyId
- [ ] Users cannot access other companies' data
- [ ] Company admin cannot see super admin features
- [ ] API endpoints validate companyId
- [ ] File uploads are scoped to company
- [ ] Notifications are scoped to company

## Next Steps

After basic setup:
1. Customize company branding (logo, colors)
2. Set up company-specific email templates
3. Configure company limits (max users, storage)
4. Enable/disable features per company
5. Set up billing per company
