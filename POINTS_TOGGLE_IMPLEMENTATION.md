# Points Rating System Toggle Implementation

## Overview
This implementation adds a toggle feature for the points rating system that allows companies to enable or disable performance tracking when creating their company and after creation through settings.

## Features Implemented

### 1. Company Creation Toggle
- **Location**: `CreateCompanyPage.js`
- **Feature**: Toggle switch in the company creation form
- **Default**: Points system enabled by default
- **UI**: Purple-themed toggle with clear on/off indicators

### 2. Company Settings Toggle
- **Location**: `SettingsPage.js` → `CompanyTab.js` (Admin only)
- **Feature**: Admin users can toggle points system on/off after company creation
- **Access**: Only visible to admin users
- **Real-time**: Updates immediately with API call

### 3. Backend API Support
- **Endpoints**:
  - `POST /api/company/create` - Handles `pointsEnabled` field during creation
  - `PUT /api/company/points-system` - Toggle points system after creation
  - `GET /api/company/my-company` - Returns current points system status

### 4. Database Integration
- **Model**: `Company.js`
- **Fields**:
  - `pointsEnabled`: Boolean (default: true)
  - `pointsEnabledAt`: Date when points were first enabled
  - `rating`: Company rating based on team performance

## How It Works

### During Company Creation
1. User sees toggle switch in the form (enabled by default)
2. User can click to disable points system
3. Form submission includes `pointsEnabled` field
4. Backend creates company with specified points setting
5. If enabled, sets `pointsEnabledAt` to current date

### After Company Creation
1. Admin users see "Company" tab in Settings
2. Toggle switch shows current points system status
3. Clicking toggle makes API call to update setting
4. System updates `pointsEnabled` and `pointsEnabledAt` fields
5. UI updates immediately with success message

### Points System Logic
- **When Enabled**: Team members earn/lose points for project completion
- **When Disabled**: No points are awarded, existing points remain
- **Company Rating**: Calculated from average team member points (only when enabled)

## Files Modified/Created

### Frontend
- `src/components/CreateCompanyPage/CreateCompanyPage.js` - Added toggle to creation form
- `src/components/SettingsPage/SettingsPage.js` - Added Company tab for admins
- `src/components/SettingsPage/CompanyTab.js` - New component for company settings

### Backend
- `server/routes/company.js` - Added points system endpoints
- `server/models/Company.js` - Already had required fields
- `server/utils/pointsCalculator.js` - Already checks `pointsEnabled` field

## API Endpoints

### Create Company
```http
POST /api/company/create
Content-Type: application/json

{
  "companyName": "Test Company",
  "adminEmail": "admin@test.com",
  "adminPhone": "+251912345678",
  "adminUsername": "testadmin",
  "adminPassword": "password123",
  "maxUsers": 10,
  "pointsEnabled": true
}
```

### Toggle Points System
```http
PUT /api/company/points-system
Content-Type: application/json
x-auth-token: <admin-jwt-token>

{
  "pointsEnabled": false
}
```

### Get Company Settings
```http
GET /api/company/my-company
x-auth-token: <admin-jwt-token>
```

## Testing

### Manual Testing
1. Go to company creation page
2. Toggle the points system switch
3. Create company
4. Login as admin
5. Go to Settings → Company tab
6. Toggle points system on/off
7. Verify changes are saved

### Automated Testing
Run the test script:
```bash
cd /d "d:\project\notion"
node test-points-toggle.js
```

## User Experience

### Company Creation
- Clear toggle with descriptive text
- Visual feedback (✅/❌ indicators)
- Purple theme to distinguish from other settings
- Explains what the points system does

### Settings Page
- Only visible to admin users
- Shows current company rating when enabled
- Real-time toggle with loading states
- Success/error messages
- Explains how the points system works

## Security
- Only admin users can modify points system settings
- JWT token required for all company settings endpoints
- Company isolation - users can only modify their own company
- Input validation on all endpoints

## Benefits
1. **Flexibility**: Companies can choose whether to use performance tracking
2. **Privacy**: Some companies may not want employee performance scoring
3. **Customization**: Different companies have different management styles
4. **Control**: Admins have full control over company features

## Future Enhancements
- Bulk enable/disable for multiple companies (super admin)
- Points system analytics and reporting
- Custom point scoring rules per company
- Integration with HR systems
- Performance review automation