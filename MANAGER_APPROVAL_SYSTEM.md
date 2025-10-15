# Manager Self-Registration with Approval System

## Overview

This system allows managers to register themselves, but requires approval from existing managers or admins.

## How It Works

### 1. Manager Registration Process

- **All Managers**: Must register and wait for approval from existing managers/admins
- **Regular Users**: Continue to work as before (pending approval)

### 2. Backend Changes Made

#### Modified `server/routes/auth.js`:

- Updated registration logic to allow manager self-registration
- All managers get `status: 'pending'` and `isActive: false`
- Registration response includes `requiresApproval: true` for pending users
- No JWT token is created for pending users

#### Key Logic:

```javascript
if (role === "manager") {
  // All managers need approval - no auto-approval even for first manager
  finalRole = "manager";
  finalStatus = "pending";
  finalIsActive = false;
}
```

### 3. Frontend Changes Made

#### Updated `src/components/auth/RegisterPage.js`:

- Changed role selection note to clarify approval requirement
- Registration flow redirects to pending approval page for all registrations

#### Updated `src/components/auth/PendingApprovalPage.js`:

- Updated messaging to clarify that existing managers handle approvals
- Improved user experience with clearer expectations

### 4. Existing Approval System

The system already had manager approval functionality in place:

- **UserManagementPage**: Shows pending users with approve/decline buttons
- **API Endpoints**: `/api/auth/users/:id/approve` and `/api/auth/users/:id/decline`
- **User Model**: Already had `status` field with 'pending', 'approved', 'declined' values

## User Flow

### For Managers:

1. **Registration**: Manager fills out registration form with role "Manager"
2. **Pending State**: Account created with `status: 'pending'`, cannot login
3. **Approval**: Existing manager reviews and approves via UserManagementPage
4. **Access Granted**: Once approved, manager can login and access all features

### For Existing Managers:

1. **Review**: See pending manager registrations in UserManagementPage
2. **Decision**: Click "Approve" or "Decline" buttons
3. **Notification**: System updates user status accordingly

## Security Features

- Pending managers cannot login until approved
- Only existing approved managers/admins can approve new managers
- All registrations go through validation and security checks
- Initial setup requires an admin to approve the first manager

## API Endpoints Used

- `POST /api/auth/register` - Manager self-registration
- `PUT /api/auth/users/:id/approve` - Approve pending manager
- `PUT /api/auth/users/:id/decline` - Decline pending manager
- `GET /api/auth/users` - List all users (including pending)

## Database Schema

The User model already supported this with:

```javascript
{
  role: { type: String, enum: ['user', 'manager'] },
  status: { type: String, enum: ['pending', 'approved', 'declined'] },
  isActive: { type: Boolean, default: true }
}
```

## Testing

Run the test script to verify functionality:

```bash
node test-manager-registration.js
```

This implementation provides a secure, user-friendly way for managers to self-register while maintaining proper approval controls.
