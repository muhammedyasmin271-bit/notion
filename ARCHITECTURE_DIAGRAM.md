# Multi-Tenant Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         SUPER ADMIN                              │
│                    (role: superadmin)                            │
│                                                                   │
│  • Can create companies                                          │
│  • Can see all companies' data                                   │
│  • Manages system-wide settings                                  │
│  • Access: /super-admin                                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Creates
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         COMPANIES                                │
│                                                                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │   Company A      │  │   Company B      │  │   Company C    ││
│  │   (Melanote)     │  │   (TestCorp)     │  │   (AcmeCo)     ││
│  │                  │  │                  │  │                ││
│  │ companyId:       │  │ companyId:       │  │ companyId:     ││
│  │ comp_123_abc     │  │ comp_456_def     │  │ comp_789_ghi   ││
│  │                  │  │                  │  │                ││
│  │ Logo: [🏢]       │  │ Logo: [🏭]       │  │ Logo: [🏪]     ││
│  │ Status: active   │  │ Status: active   │  │ Status: paused ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
└─────────────────────────────────────────────────────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌──────────────────┐  ┌──────────────────┐  ┌────────────────────┐
│  Company A       │  │  Company B       │  │  Company C         │
│  WORKSPACE       │  │  WORKSPACE       │  │  WORKSPACE         │
│                  │  │                  │  │  (Paused)          │
│  Login URL:      │  │  Login URL:      │  │                    │
│  /login?company= │  │  /login?company= │  │  Cannot login      │
│  comp_123_abc    │  │  comp_456_def    │  │                    │
│                  │  │                  │  │                    │
│  ┌────────────┐  │  │  ┌────────────┐  │  │                    │
│  │ Admin      │  │  │  │ Admin      │  │  │                    │
│  │ Users      │  │  │  │ Users      │  │  │                    │
│  │ Projects   │  │  │  │ Projects   │  │  │                    │
│  │ Documents  │  │  │  │ Documents  │  │  │                    │
│  │ Notes      │  │  │  │ Notes      │  │  │                    │
│  └────────────┘  │  │  └────────────┘  │  │                    │
└──────────────────┘  └──────────────────┘  └────────────────────┘
```

## Data Flow

### 1. Company Creation Flow

```
Super Admin
    │
    │ 1. Creates company
    ▼
┌─────────────────────────────────────┐
│  POST /api/admin/companies          │
│                                     │
│  {                                  │
│    name: "Melanote",                │
│    adminEmail: "admin@melanote.com",│
│    adminUsername: "melanote_admin", │
│    adminPassword: "SecurePass123",  │
│    logo: "base64_image_data"        │
│  }                                  │
└─────────────────────────────────────┘
    │
    │ 2. System generates
    ▼
┌─────────────────────────────────────┐
│  Company Record:                    │
│  {                                  │
│    companyId: "comp_123_abc",       │
│    name: "Melanote",                │
│    branding: {                      │
│      logo: "...",                   │
│      companyName: "Melanote"        │
│    },                               │
│    status: "active",                │
│    companyLink: "http://...?company=│
│                 comp_123_abc"       │
│  }                                  │
└─────────────────────────────────────┘
    │
    │ 3. System creates admin user
    ▼
┌─────────────────────────────────────┐
│  Admin User:                        │
│  {                                  │
│    username: "melanote_admin",      │
│    password: "hashed_password",     │
│    role: "admin",                   │
│    companyId: "comp_123_abc"        │
│  }                                  │
└─────────────────────────────────────┘
```

### 2. Login Flow

```
User visits: http://localhost:3000/login?company=comp_123_abc
    │
    │ 1. Frontend extracts companyId
    ▼
┌─────────────────────────────────────┐
│  GET /api/auth/company/comp_123_abc │
└─────────────────────────────────────┘
    │
    │ 2. Returns company branding
    ▼
┌─────────────────────────────────────┐
│  {                                  │
│    companyId: "comp_123_abc",       │
│    name: "Melanote",                │
│    branding: {                      │
│      logo: "...",                   │
│      companyName: "Melanote"        │
│    }                                │
│  }                                  │
└─────────────────────────────────────┘
    │
    │ 3. Display company logo & name
    │ 4. User enters credentials
    ▼
┌─────────────────────────────────────┐
│  POST /api/auth/login               │
│  {                                  │
│    username: "melanote_admin",      │
│    password: "SecurePass123",       │
│    companyId: "comp_123_abc"        │
│  }                                  │
└─────────────────────────────────────┘
    │
    │ 5. Validate user belongs to company
    ▼
┌─────────────────────────────────────┐
│  User.findOne({                     │
│    username: "melanote_admin",      │
│    companyId: "comp_123_abc"        │
│  })                                 │
└─────────────────────────────────────┘
    │
    │ 6. Return JWT token with companyId
    ▼
┌─────────────────────────────────────┐
│  {                                  │
│    token: "jwt_token",              │
│    user: {                          │
│      id: "...",                     │
│      username: "melanote_admin",    │
│      role: "admin",                 │
│      companyId: "comp_123_abc"      │
│    }                                │
│  }                                  │
└─────────────────────────────────────┘
```

### 3. Data Access Flow

```
User makes request: GET /api/projects
    │
    │ 1. Auth middleware validates token
    ▼
┌─────────────────────────────────────┐
│  req.user = {                       │
│    id: "user_id",                   │
│    role: "admin",                   │
│    companyId: "comp_123_abc"        │
│  }                                  │
└─────────────────────────────────────┘
    │
    │ 2. Tenant filter middleware
    ▼
┌─────────────────────────────────────┐
│  if (role !== 'superadmin') {       │
│    req.companyId = user.companyId   │
│  }                                  │
└─────────────────────────────────────┘
    │
    │ 3. Route handler filters by company
    ▼
┌─────────────────────────────────────┐
│  Project.find({                     │
│    companyId: "comp_123_abc"        │
│  })                                 │
└─────────────────────────────────────┘
    │
    │ 4. Returns only company's projects
    ▼
┌─────────────────────────────────────┐
│  [                                  │
│    { id: 1, title: "Project A",     │
│      companyId: "comp_123_abc" },   │
│    { id: 2, title: "Project B",     │
│      companyId: "comp_123_abc" }    │
│  ]                                  │
└─────────────────────────────────────┘
```

## Database Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPANIES                                │
├─────────────────────────────────────────────────────────────────┤
│  companyId (String, unique)                                      │
│  name (String)                                                   │
│  branding { logo, companyName, primaryColor }                    │
│  status (active/paused/suspended)                                │
│  adminEmail (String)                                             │
│  adminUserId (ObjectId -> User)                                  │
│  companyLink (String)                                            │
│  limits { maxUsers, maxStorage }                                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ has many
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                           USERS                                  │
├─────────────────────────────────────────────────────────────────┤
│  _id (ObjectId)                                                  │
│  username (String)                                               │
│  password (String, hashed)                                       │
│  role (user/manager/admin/superadmin)                            │
│  companyId (String) ← Links to company                           │
│  email, phone, etc.                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ creates
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         PROJECTS                                 │
├─────────────────────────────────────────────────────────────────┤
│  _id (ObjectId)                                                  │
│  title (String)                                                  │
│  description (String)                                            │
│  owner (ObjectId -> User)                                        │
│  companyId (String) ← Links to company                           │
│  status, priority, etc.                                          │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        DOCUMENTS                                 │
├─────────────────────────────────────────────────────────────────┤
│  _id (ObjectId)                                                  │
│  title (String)                                                  │
│  content (String)                                                │
│  author (ObjectId -> User)                                       │
│  companyId (String) ← Links to company                           │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                          NOTES                                   │
├─────────────────────────────────────────────────────────────────┤
│  _id (ObjectId)                                                  │
│  title (String)                                                  │
│  content (String)                                                │
│  author (ObjectId -> User)                                       │
│  companyId (String) ← Links to company                           │
└─────────────────────────────────────────────────────────────────┘

... (All other models follow same pattern with companyId field)
```

## Access Control Matrix

```
┌──────────────┬─────────────┬──────────────┬──────────────┬──────────────┐
│ Role         │ Super Admin │ Company Admin│ Manager      │ User         │
├──────────────┼─────────────┼──────────────┼──────────────┼──────────────┤
│ Create       │ All         │ All          │ All          │ Own          │
│ Company      │ Companies   │ Companies    │ Companies    │ Companies    │
├──────────────┼─────────────┼──────────────┼──────────────┼──────────────┤
│ View         │ All         │ Own Company  │ Own Company  │ Own Company  │
│ Companies    │ Companies   │ Only         │ Only         │ Only         │
├──────────────┼─────────────┼──────────────┼──────────────┼──────────────┤
│ Manage       │ All         │ Own Company  │ Assigned     │ Own          │
│ Users        │ Users       │ Users        │ Users        │ Profile      │
├──────────────┼─────────────┼──────────────┼──────────────┼──────────────┤
│ View         │ All         │ All Company  │ Assigned     │ Own          │
│ Projects     │ Projects    │ Projects     │ Projects     │ Projects     │
├──────────────┼─────────────┼──────────────┼──────────────┼──────────────┤
│ Create       │ Yes         │ Yes          │ Yes          │ Yes          │
│ Projects     │             │              │              │              │
├──────────────┼─────────────┼──────────────┼──────────────┼──────────────┤
│ Delete       │ All         │ All Company  │ Own          │ Own          │
│ Projects     │ Projects    │ Projects     │ Projects     │ Projects     │
└──────────────┴─────────────┴──────────────┴──────────────┴──────────────┘
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 1: Authentication                     │
│  • JWT token validation                                          │
│  • User must be logged in                                        │
│  • Token contains: userId, role, companyId                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 2: Company Validation                 │
│  • Verify company exists                                         │
│  • Verify company is active                                      │
│  • Verify user belongs to company                                │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 3: Tenant Filtering                   │
│  • Automatically add companyId to all queries                    │
│  • Skip for superadmin role                                      │
│  • Prevent cross-company data access                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 4: Role-Based Access                  │
│  • Check user role (admin/manager/user)                          │
│  • Apply role-specific filters                                   │
│  • Enforce permission rules                                      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Layer 5: Data Access                        │
│  • Return only authorized data                                   │
│  • All data includes companyId                                   │
│  • Audit log access                                              │
└─────────────────────────────────────────────────────────────────┘
```

## Key Concepts

### 1. Company Isolation
- Each company has unique `companyId`
- All data is tagged with `companyId`
- Users can only access data with matching `companyId`
- Super admin can access all companies

### 2. Company-Specific Login
- URL format: `/login?company=COMPANY_ID`
- Displays company branding
- Validates user belongs to company
- JWT token includes `companyId`

### 3. Automatic Tenant Filtering
- Middleware adds `companyId` to all queries
- Prevents accidental cross-company access
- Transparent to route handlers
- Skipped for super admin

### 4. Hierarchical Roles
```
Super Admin (system-wide)
    │
    ├─ Company A Admin (company-wide)
    │   ├─ Manager (team-level)
    │   └─ User (individual)
    │
    └─ Company B Admin (company-wide)
        ├─ Manager (team-level)
        └─ User (individual)
```
