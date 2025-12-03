# Complete Payment Flow System

## Payment Mode Flow

### 1. FREE Mode
- **Status**: Company operates without any payment requirements
- **Access**: All users can access all features
- **Display**: Shows "FREE" in calendar and status
- **Duration**: Indefinite until super admin changes mode

### 2. PAID Mode - 24 Hour Window
- **Trigger**: Super admin switches company from FREE to PAID
- **Status**: 24-hour countdown starts immediately
- **Access**: All users can access app normally during this window
- **Display**: Shows countdown timer (e.g., "23h 45m remaining")
- **Duration**: Exactly 24 hours from when super admin clicked "Make PAID"

### 3. Grace Period (7 Days)
- **Trigger**: 24-hour payment deadline passes without payment
- **Status**: Company enters 7-day grace period
- **Access**: 
  - ✅ **Admin**: Can login and access payment page
  - ❌ **Regular Users**: Blocked with "Admin Access Only" message
- **Display**: Shows grace period countdown (e.g., "6d 23h remaining in grace period")
- **Duration**: 7 days from payment deadline

### 4. Payment Required
- **Trigger**: Grace period expires without payment
- **Status**: All access suspended
- **Access**: ❌ **All Users**: Blocked with "Payment Required" message
- **Display**: "Grace period has expired"
- **Duration**: Until payment is completed

## User Experience by Role

### Super Admin
- Can toggle any company between FREE and PAID modes
- Sees real-time countdown and status in admin panel
- Can unpause companies that were auto-paused

### Company Admin
- During 24h window: Normal access + optional payment
- During grace period: Full access + payment required message
- After grace period: Blocked until payment completed

### Regular Users
- During 24h window: Normal access (may see countdown notification)
- During grace period: Blocked with "Admin Access Only" message
- After grace period: Blocked until payment completed

## Technical Implementation

### Database Fields
```javascript
{
  paymentMode: 'free' | 'paid',
  paymentCountdownStart: Date,     // When 24h countdown started
  paymentDeadline: Date,           // 24 hours after countdown start
  gracePeriodDeadline: Date,       // 7 days after payment deadline
  hasPaid: Boolean,
  status: 'active' | 'paused'
}
```

### Timeline Example
```
Day 0: Super admin clicks "Make PAID"
├── paymentCountdownStart: 2024-01-01 10:00:00
├── paymentDeadline: 2024-01-02 10:00:00 (24h later)
└── gracePeriodDeadline: 2024-01-09 10:00:00 (7d after deadline)

Day 0-1: 24-hour window (all users can access)
Day 1-8: Grace period (admin only)
Day 8+: Payment required (all blocked)
```

### Access Control Logic
```javascript
// 24-hour window
if (now < paymentDeadline) {
  return "All users can access";
}

// Grace period
if (now >= paymentDeadline && now < gracePeriodDeadline) {
  return user.role === 'admin' ? "Admin access" : "Blocked";
}

// Grace expired
if (now >= gracePeriodDeadline) {
  return "All blocked until payment";
}
```

## Visual Indicators

### Calendar Display
- **FREE**: Shows "FREE" with green styling
- **24h Window**: Shows countdown with orange styling
- **Grace Period**: Shows grace countdown with red styling
- **Expired**: Shows "Payment Required" with red styling

### Payment Status Component
- Real-time countdown updates every minute
- Progress bar showing time remaining
- Color-coded based on urgency (green → orange → red)

## Testing Commands

```bash
# Test payment mode toggle
node server/test-payment-mode.js

# Test grace period simulation
node server/test-grace-period.js

# Check current company status
node server/check-company-status.js
```

## Summary

The complete payment flow provides:
1. **Flexible Control**: Super admin can instantly switch between free/paid
2. **Grace Period**: 7-day buffer for companies to complete payment
3. **Role-based Access**: Different restrictions for admin vs regular users
4. **Clear Communication**: Visual indicators and countdown timers
5. **Automatic Enforcement**: System automatically restricts access when needed

This ensures companies have adequate time to complete payments while maintaining system security and revenue protection.