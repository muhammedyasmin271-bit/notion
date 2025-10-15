# Multi-Tenant Setup Guide

## Your Business Model

You are the **platform owner** who sells the Mela Note workspace system to different companies. Each company gets their own isolated workspace.

### Roles Hierarchy

1. **You (Super Admin)** - Platform owner
   - Username: `adminadmin`
   - Password: `06827`
   - Access: Manage all companies

2. **Company Admin** - Company CEO/Owner (one per company)
   - Manages their company
   - Creates managers and users

3. **Managers** - Company managers
   - Approve users
   - Manage projects

4. **Users** - Company workers
   - Use the system

## Initial Setup

### Step 1: Create Super Admin
```bash
cd server
node createSuperAdmin.js
```

### Step 2: Set Up Mela Note (Your First Client)
```bash
node setupMelaNote.js
```

This creates:
- Company: **Mela Note**
- Company ID: `melanote`
- Admin: `aymen` / `7749`
- Migrates existing users to Mela Note

### Step 3: Start the Application
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
npm start
```

## How to Sell to New Companies

### 1. Login as Super Admin
- Go to: `http://localhost:3000/login`
- Username: `adminadmin`
- Password: `06827`

### 2. Create New Company
- Click **"Add Company"**
- Upload company logo
- Enter company details
- Create admin credentials
- Click **"Create Company"**

### 3. Get Company Information
After creation, you'll see:
- **Company ID** - Unique identifier
- **Admin Username** - For company CEO
- **Company Link** - Login URL for the company

### 4. Share with Client
Send them:
- Company login link
- Admin username
- Admin password

### 5. Client Uses Their System
- They login with their credentials
- They see only their company data
- They manage their own users
- Complete isolation from other companies

## Example Companies

### Mela Note (Your First Client)
- Company ID: `melanote`
- Admin: `aymen` / `7749`
- Link: `http://localhost:3000/login?company=melanote`

### Future Clients
Each gets:
- Unique company ID
- Their own admin account
- Isolated workspace
- Custom branding (logo)

## Key Features

✅ **Complete Isolation** - Companies can't see each other's data
✅ **One Admin Per Company** - Company owner manages everything
✅ **Unlimited Companies** - Sell to as many clients as you want
✅ **Custom Branding** - Each company can have their logo
✅ **Centralized Control** - You manage all companies from one dashboard

## Database Structure

```
Super Admin (You)
├── Company: Mela Note
│   ├── Admin: aymen
│   ├── Managers: [...]
│   └── Users: [...]
├── Company: TechCorp
│   ├── Admin: techceo
│   ├── Managers: [...]
│   └── Users: [...]
└── Company: StartupXYZ
    ├── Admin: founder
    ├── Managers: [...]
    └── Users: [...]
```

## Important Notes

1. **Mela Note is a client** - Not special, just your first company
2. **One admin per company** - Each company has exactly one admin (CEO/owner)
3. **Super admin is separate** - You don't belong to any company
4. **Data isolation** - Companies are completely separated
5. **Scalable** - Add unlimited companies

## Troubleshooting

### Existing Users Not Showing
Run migration:
```bash
cd server
node migrateUsers.js
node setupMelaNote.js
```

### Can't Login as Super Admin
Check user in database:
```javascript
db.users.findOne({ username: 'adminadmin' })
// Should have: role: 'superadmin', companyId: 'master'
```

### Company Admin Can't See Users
Verify companyId matches:
```javascript
db.users.find({ companyId: 'melanote' })
```
