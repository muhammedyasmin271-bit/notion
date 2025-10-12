# Role-Based Visibility System

## Overview

This system implements privacy controls where:
- **Private items** (not shared/assigned) are only visible to the owner
- **Shared/Assigned items** are visible to owner, recipients, and admin
- **Public items** are visible to everyone
- **Admin** can see all public items and items that have been shared with someone

## Implementation

### 1. Visibility Middleware (`server/middleware/visibility.js`)

The `getVisibilityFilter()` function creates MongoDB query filters based on user role:

**For Admin:**
- Own items
- Public items  
- Items shared with anyone
- Items assigned to anyone
- Items with team members

**For Regular Users:**
- Own items
- Public items
- Items shared with them
- Items assigned to them
- Items where they're team members

### 2. Updated Models

All models now have consistent sharing fields:

```javascript
// Common fields added to all models
sharedWith: [{
  user: { type: ObjectId, ref: 'User' },
  permission: { type: String, enum: ['read', 'write', 'admin'], default: 'read' },
  sharedAt: { type: Date, default: Date.now }
}],
isPublic: { type: Boolean, default: false }
```

**Updated Models:**
- ✅ Project.js - Added `sharedWith` field
- ✅ Document.js - Already had `sharedWith`, standardized structure  
- ✅ Goal.js - Added `sharedWith` field
- ✅ Note.js - Already had `sharedWith`
- ✅ Report.js - Standardized `sharedWith` structure, added `isPublic`
- ✅ MeetingNote.js - Already had `sharedWith`, added `isPublic`

### 3. Route Updates

**Projects Route (`server/routes/projects.js`):**
- ✅ Added visibility middleware import
- ✅ Updated GET route to use `getVisibilityFilter()`

**Documents Route (`server/routes/documents.js`):**
- ✅ Added visibility middleware import  
- ✅ Updated GET route to use `getVisibilityFilter()`

## Usage Examples

### Creating Private Items
```javascript
// Item is private by default - only owner can see
const project = new Project({
  title: "My Private Project",
  owner: userId
  // isPublic: false (default)
  // sharedWith: [] (empty)
});
```

### Sharing Items
```javascript
// Share with specific users
project.sharedWith.push({
  user: recipientUserId,
  permission: 'read'
});
// Now visible to: owner, recipient, admin
```

### Making Items Public
```javascript
// Make public - visible to everyone
project.isPublic = true;
```

## Visibility Rules Summary

| Item State | Owner | Recipient | Admin | Other Users |
|------------|-------|-----------|-------|-------------|
| Private (default) | ✅ | ❌ | ❌ | ❌ |
| Shared | ✅ | ✅ | ✅ | ❌ |
| Public | ✅ | ✅ | ✅ | ✅ |

## Next Steps

To complete the implementation:

1. **Update remaining routes** to use visibility middleware:
   - `server/routes/goals.js`
   - `server/routes/reports.js` 
   - `server/routes/meetings.js`
   - `server/routes/notepad.js`

2. **Frontend updates** to show sharing controls in UI

3. **Test the system** with different user roles

## Example Route Implementation

```javascript
const { getVisibilityFilter } = require('../middleware/visibility');

router.get('/', auth, async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;
  
  const visibilityFilter = getVisibilityFilter(userId, userRole);
  
  const items = await Model.find({
    deleted: false,
    ...visibilityFilter
  });
  
  res.json(items);
});
```

This system ensures complete privacy control while allowing admins to see shared content for management purposes.