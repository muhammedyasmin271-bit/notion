# Payment Reminder SMS Feature

## Overview
When a company is created with a paid plan, the admin receives:
1. **Immediate SMS** - Company creation confirmation
2. **Scheduled SMS Reminders** - Every 6 hours until payment deadline

## How It Works

### Initial SMS (On Company Creation)
When a paid plan company is created, admin receives:
```
Welcome to [Company Name]! Your company has been created. 
Complete payment within 24 hours. Login: [company-link]
```

### Scheduled Reminders (Every 6 Hours)
Reminders are sent at:
- **18 hours before deadline** - First reminder
- **12 hours before deadline** - Second reminder  
- **6 hours before deadline** - Final reminder

Each reminder message:
```
⏰ Payment Reminder: [Company Name] - You have [X] hours to complete 
payment before your company is suspended. Login: [company-link]
```

## Files Modified

### 1. `server/services/paymentReminder.js` (NEW)
- Schedules SMS reminders at 18h, 12h, 6h intervals
- Manages reminder timeouts
- Cancels reminders when payment is made

### 2. `server/routes/company.js`
- Imports payment reminder service
- Calls `schedulePaymentReminders()` for paid plans
- Passes company details to scheduler

## Configuration

### Required Environment Variables
```
SMS_API=https://your-sms-api-endpoint
SMS_TOKEN=your-sms-token
IDENTIFIER_ID=your-identifier
SENDER_NAME=your-sender-name
```

## Testing

### Test 1: Create Paid Plan Company
1. Go to Super Admin page
2. Click "Add Company"
3. Select a paid plan (not free trial)
4. Fill in company details
5. Create company
6. **Expected**: 
   - ✅ Initial SMS sent immediately
   - ✅ Reminders scheduled for 18h, 12h, 6h before deadline

### Test 2: Verify Reminders
1. Check backend logs for:
   ```
   ⏰ Scheduling payment reminders for [Company Name]
      ✓ 18h reminder scheduled
      ✓ 12h reminder scheduled
      ✓ 6h reminder scheduled
   ```

### Test 3: Payment Cancels Reminders
1. When payment is approved
2. Reminders should be cancelled
3. No more SMS sent

## Backend Logs

### Scheduling
```
⏰ Scheduling payment reminders for Company Name
   ✓ 18h reminder scheduled
   ✓ 12h reminder scheduled
   ✓ 6h reminder scheduled
```

### Sending Reminders
```
📤 Sending 18h reminder to +251911234567
✅ 18h reminder sent
```

### Cancelling
```
🛑 Cancelling payment reminders for comp_XXXXX
   ✓ 18h reminder cancelled
   ✓ 12h reminder cancelled
   ✓ 6h reminder cancelled
```

## Features

✅ **Automatic Scheduling** - Reminders scheduled on company creation
✅ **Multiple Intervals** - 18h, 12h, 6h before deadline
✅ **SMS Integration** - Uses existing SMS service
✅ **Cancellable** - Reminders cancelled when payment made
✅ **Logging** - Full logging for debugging
✅ **Non-blocking** - SMS failures don't affect company creation

## Reminder Timeline Example

**Company Created**: 2024-01-01 10:00 AM
**Payment Deadline**: 2024-01-02 10:00 AM (24 hours)

| Time | Event |
|------|-------|
| 10:00 AM | Company created, initial SMS sent |
| 4:00 PM | 18h reminder scheduled |
| 10:00 PM | 12h reminder scheduled |
| 4:00 AM | 6h reminder scheduled |
| 10:00 AM | Deadline reached, company suspended if no payment |

## Status

✅ **IMPLEMENTED** - Payment reminder SMS system is active

## Notes

- Reminders only for paid plans (not free trial)
- SMS service must be configured
- Reminders are in-memory (lost on server restart)
- For production, consider using a job queue (Bull, RabbitMQ)
