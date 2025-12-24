# Logo Display Fix - Summary

## Problem
When creating a company from the landing page with a logo upload, the logo was not displaying correctly. However, logos uploaded through the SuperAdmin page worked fine.

## Root Cause
There were two different approaches for storing logos:

1. **SuperAdmin Page**: Stored logos as base64 data URLs directly in the database
   - Format: `data:image/png;base64,iVBORw0KGgoAAAANS...`
   - Works immediately in `<img>` tags

2. **Landing Page**: Uploaded files to server and stored relative paths
   - Format: `/uploads/company-logos/filename.png`
   - Required full URL to work: `process.env.Backendurl/uploads/company-logos/filename.png`

## Solution
Updated the company creation and branding routes to store full URLs instead of relative paths:

### Changes Made

**File**: `server/routes/company.js`

1. **Company Creation Endpoint** (`POST /api/company/create`):
   ```javascript
   // Before
   logoUrl = `/uploads/company-logos/${req.file.filename}`;
   
   // After
   const baseUrl = process.env.BACKEND_URL || process.env.API_URL || 'process.env.Backendurl';
   logoUrl = `${baseUrl}/uploads/company-logos/${req.file.filename}`;
   ```

2. **Branding Update Endpoint** (`PUT /api/company/branding`):
   ```javascript
   // Before
   const logoUrl = `/uploads/company-logos/${req.file.filename}`;
   
   // After
   const baseUrl = process.env.BACKEND_URL || process.env.API_URL || 'process.env.Backendurl';
   const logoUrl = `${baseUrl}/uploads/company-logos/${req.file.filename}`;
   ```

## How It Works Now

1. **Landing Page Company Creation**:
   - User uploads logo file
   - File is saved to `server/uploads/company-logos/`
   - Full URL is stored in database: `process.env.Backendurl/uploads/company-logos/1234567890-logo.png`
   - Logo displays correctly everywhere

2. **SuperAdmin Company Creation**:
   - User uploads logo (converted to base64)
   - Base64 data URL is stored in database: `data:image/png;base64,...`
   - Logo displays correctly everywhere

Both approaches now work consistently!

## Environment Variables
The fix uses the `BACKEND_URL` environment variable from `.env`:
```
BACKEND_URL=process.env.Backendurl
```

For production, update this to your production backend URL.

## Testing
To verify the fix:

1. Create a company from the landing page with a logo
2. Check the SuperAdmin page - logo should display correctly
3. Check the company details modal - logo should display correctly
4. Verify the logo URL in the database includes the full backend URL

## Files Modified
- `server/routes/company.js` - Updated logo URL generation in 2 places
