# Payment Mode System Implementation

## Overview
The payment mode system allows super admins to control whether companies need to pay or can operate for free. When switching from free to paid mode, companies get a 24-hour window to make payment.

## Key Features

### 1. Payment Modes
- **FREE Mode**: Company operates without payment requirements
- **PAID Mode**: Company must pay within 24 hours when switched from free

### 2. 24-Hour Countdown System
- When super admin switches company from FREE to PAID:
  - 24-hour countdown starts immediately
  - Company has exactly 24 hours to complete payment
  - Countdown is displayed in real-time with hours and minutes

### 3. Visual Indicators
- **Calendar Display**: Shows "FREE" when in free mode, countdown when in paid mode
- **Payment Status Component**: Real-time countdown with progress bar
- **Color-coded UI**: Green for free, orange/red for countdown/expired

## Implementation Details

### Backend Changes

#### Company Model Updates
```javascript
// New fields added to Company schema
paymentModeChangedAt: Date, // When payment mode was last changed
paymentCountdownStart: Date // When 24-hour countdown started for paid mode
```

#### API Endpoints
- `PATCH /api/admin/companies/:companyId/payment-mode` - Toggle payment mode
- `GET /api/admin/companies/:companyId/payment-status` - Get countdown status

#### Payment Mode Logic
```javascript
if (paymentMode === 'paid' && currentMode === 'free') {
  // Start 24-hour countdown
  updateData.paymentCountdownStart = now;
  updateData.paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000);
} else if (paymentMode === 'free' && currentMode === 'paid') {
  // Remove all payment deadlines
  updateData.paymentCountdownStart = null;
  updateData.paymentDeadline = null;
}
```

### Frontend Changes

#### New Components
1. **CompanyPaymentStatus**: Real-time countdown display
2. **Updated SuperAdminPage**: Enhanced payment mode controls
3. **Updated CompanyCalendar**: Shows "FREE" or countdown

#### Payment Mode Toggle
- **Make FREE Button**: Switches paid companies to free (green button)
- **Make PAID Button**: Switches free companies to paid with 24h countdown (orange button)

#### Real-time Updates
- Countdown updates every minute
- Progress bar shows time remaining visually
- Color changes based on urgency (green → orange → red)

## User Experience

### Super Admin Workflow
1. **View Company**: Click on any company to see details
2. **Check Status**: See current payment mode and countdown (if any)
3. **Toggle Mode**: 
   - Click "Make FREE" to remove payment requirements
   - Click "Make PAID (24h countdown)" to start payment window
4. **Monitor**: Watch real-time countdown and company status

### Company Experience
- **Free Mode**: Full access, no payment prompts
- **Paid Mode**: 24-hour window to complete payment
- **Calendar**: Shows current status clearly

## Technical Features

### Real-time Countdown
```javascript
// Updates every minute
useEffect(() => {
  const interval = setInterval(fetchPaymentStatus, 60000);
  return () => clearInterval(interval);
}, [company?.companyId]);
```

### Progress Visualization
```javascript
// Progress bar calculation
const progressWidth = ((hoursRemaining * 60 + minutesRemaining) / (24 * 60)) * 100;
```

### Conditional Rendering
```javascript
// Show different content based on payment mode
{company?.paymentMode === 'free' ? (
  <FreeStatusDisplay />
) : (
  <CountdownDisplay />
)}
```

## Database Schema

### Company Document Structure
```javascript
{
  paymentMode: 'free' | 'paid',           // Current mode
  paymentModeChangedAt: Date,             // When last changed
  paymentCountdownStart: Date,            // When countdown started
  paymentDeadline: Date,                  // 24h deadline
  gracePeriodDeadline: Date,              // 7-day grace period
  status: 'active' | 'paused' | 'suspended'
}
```

## Testing

### Test Script
Run `node test-payment-mode.js` to:
1. Switch a company to FREE mode
2. Switch back to PAID mode with countdown
3. Verify database updates
4. Check time calculations

### Manual Testing
1. Start application: `npm run dev`
2. Login as super admin
3. View company details
4. Toggle payment modes
5. Observe real-time updates

## Security Considerations

### Access Control
- Only super admins can change payment modes
- JWT token validation on all endpoints
- Company isolation maintained

### Data Validation
- Payment mode must be 'free' or 'paid'
- Timestamps validated and sanitized
- Error handling for invalid requests

## Future Enhancements

### Potential Improvements
1. **SMS Notifications**: Alert company when switched to paid mode
2. **Email Reminders**: Send countdown reminders
3. **Payment Integration**: Direct payment links in notifications
4. **Audit Trail**: Log all payment mode changes
5. **Bulk Operations**: Change multiple companies at once

### Configuration Options
1. **Customizable Countdown**: Allow different time periods
2. **Grace Period Settings**: Configurable grace periods
3. **Notification Templates**: Customizable message templates

## Troubleshooting

### Common Issues
1. **Countdown Not Updating**: Check if component is receiving company prop
2. **Wrong Time Display**: Verify timezone handling
3. **Mode Not Switching**: Check super admin permissions

### Debug Commands
```bash
# Check company status
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://process.env.Backendurl:27017/notion-app');
const Company = require('./server/models/Company');
Company.findOne({companyId: 'YOUR_COMPANY_ID'}).then(console.log);
"
```

## API Reference

### Toggle Payment Mode
```http
PATCH /api/admin/companies/:companyId/payment-mode
Content-Type: application/json
x-auth-token: <super_admin_token>

{
  "paymentMode": "free" | "paid"
}
```

### Get Payment Status
```http
GET /api/admin/companies/:companyId/payment-status
x-auth-token: <super_admin_token>

Response:
{
  "paymentMode": "paid",
  "isCountingDown": true,
  "hoursRemaining": 23,
  "minutesRemaining": 45,
  "deadline": "2024-01-15T10:30:00.000Z",
  "isFree": false
}
```

## Summary

The payment mode system provides flexible control over company payment requirements with clear visual feedback and real-time countdown functionality. Super admins can instantly switch companies between free and paid modes, with automatic 24-hour payment windows when needed.

Key benefits:
- ✅ Instant mode switching
- ✅ Real-time countdown display
- ✅ Clear visual indicators
- ✅ Secure access control
- ✅ Comprehensive status tracking