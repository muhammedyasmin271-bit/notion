# ⚙️ Super Admin Settings - Payment Configuration

## ✅ Feature Complete!

Super admin can now configure payment settings that will be displayed to all company admins!

---

## 🎯 What It Does

### Super Admin Can Edit:

- 💰 **Monthly Subscription Amount** (e.g., 1000 ETB)
- 🏦 **Bank Name** (e.g., Commercial Bank of Ethiopia)
- 👤 **Account Name** (e.g., Mela Note Services)
- 🔢 **Account Number** (e.g., 1000123456789)
- 💱 **Currency** (e.g., ETB)

### Settings Are Used In:

- ✅ Admin "How to Pay" modal
- ✅ All company admins see the same payment instructions
- ✅ Updated in real-time

---

## 📂 Files Created

### Backend:

1. **`server/models/SystemSettings.js`** - Settings data model
2. **`server/routes/settings.js`** - Settings API endpoints

### Frontend:

3. **`src/components/SuperAdminPage/SuperAdminSettings.jsx`** - Settings page

### Modified:

4. **`server/index.js`** - Added settings routes and initialization
5. **`src/App.js`** - Added settings route
6. **`src/components/SuperAdminPage/SuperAdminPage.jsx`** - Added Settings button
7. **`src/components/AdminDashboard/PaymentSubmission.js`** - Loads settings dynamically

---

## 🔌 API Endpoints

### GET `/api/settings/payment`

- **Access:** Any authenticated user
- **Description:** Get payment settings for "How to Pay" display
- **Response:**

```json
{
  "monthlyAmount": 1000,
  "bankName": "Commercial Bank of Ethiopia",
  "accountName": "Mela Note Services",
  "accountNumber": "1000123456789",
  "currency": "ETB"
}
```

### GET `/api/settings/all`

- **Access:** Super Admin only
- **Description:** Get all system settings

### PUT `/api/settings/payment/bulk`

- **Access:** Super Admin only
- **Description:** Update multiple payment settings at once
- **Body:**

```json
{
  "monthlyAmount": 1500,
  "bankName": "New Bank Name",
  "accountName": "New Account Name",
  "accountNumber": "9876543210",
  "currency": "USD"
}
```

---

## 🎨 Settings Page Features

### Design:

- 🎨 Beautiful gradient background
- 💎 Clean, modern card design
- 📱 Responsive layout
- ✨ Smooth animations
- 💾 Save button with loading state
- 🔄 Reset button to reload settings

### Form Fields:

1. **Monthly Subscription Amount**

   - Number input with currency display
   - Shows currency on the right side

2. **Currency**

   - Text input (e.g., ETB, USD, EUR)

3. **Bank Name**

   - Text input

4. **Account Name**

   - Text input

5. **Account Number**
   - Text input
   - Displayed in green color
   - Monospace font for clarity

---

## 🚀 How to Use

### Super Admin Updates Settings:

**Step 1: Navigate to Settings**

```
1. Login as super admin
2. Go to Super Admin Dashboard
3. Click "Settings" button (gray gradient)
4. Or go directly to: /super-admin/settings
```

**Step 2: Edit Payment Information**

```
1. Update monthly amount (e.g., change from 1000 to 1500)
2. Update bank name if needed
3. Update account name if needed
4. Update account number if needed
5. Update currency if needed
```

**Step 3: Save Changes**

```
1. Click "Save Settings" (green button)
2. Wait for confirmation
3. See success message: "Settings saved successfully!"
```

### Admin Sees Updated Information:

**Step 1: Admin Opens Payment Page**

```
1. Login as company admin
2. Go to Admin Dashboard
3. Click "Payment" card
```

**Step 2: View Payment Instructions**

```
1. Click "How to Pay" button (green)
2. Modal opens with:
   - Updated bank name
   - Updated account name
   - Updated account number
   - Updated monthly amount
```

**Example:**

```
If super admin changes:
- Monthly Amount: 1000 → 1500
- Account Number: 1000123456789 → 9999888877776666

Admin sees in "How to Pay":
- Monthly Amount: 1500 ETB
- Account Number: 9999888877776666
```

---

## 📊 Database Schema

**Collection:** `systemsettings`

**Document Structure:**

```javascript
{
  _id: ObjectId,
  settingKey: String,           // 'payment.monthlyAmount'
  category: String,             // 'payment'
  value: Mixed,                 // 1000, "Bank Name", etc.
  description: String,          // "Monthly subscription fee"
  updatedBy: ObjectId,          // Super admin who updated
  createdAt: Date,
  updatedAt: Date
}
```

**Example Documents:**

```javascript
[
  {
    settingKey: "payment.monthlyAmount",
    category: "payment",
    value: 1000,
    description: "Monthly subscription fee",
  },
  {
    settingKey: "payment.bankName",
    category: "payment",
    value: "Commercial Bank of Ethiopia",
    description: "Bank name for payments",
  },
  {
    settingKey: "payment.accountNumber",
    category: "payment",
    value: "1000123456789",
    description: "Bank account number",
  },
];
```

---

## 🔒 Security

### Access Control:

- ✅ Only super admin can edit settings (`PUT /api/settings/...`)
- ✅ All authenticated users can view settings (`GET /api/settings/payment`)
- ✅ Auth middleware protection
- ✅ Role validation

### Validation:

- ✅ Required fields checked
- ✅ Super admin role verified
- ✅ Updates logged with user ID

---

## 🎯 Use Cases

### Use Case 1: Change Monthly Fee

**Scenario:** Increase monthly subscription from 1000 to 1500 ETB

**Super Admin:**

1. Go to Settings
2. Change "Monthly Subscription Amount" to 1500
3. Click "Save Settings"
4. ✅ Saved!

**Result:**

- All admins see "Monthly Amount: 1500 ETB" in "How to Pay"

---

### Use Case 2: Change Bank Account

**Scenario:** Change to different bank account

**Super Admin:**

1. Go to Settings
2. Update:
   - Bank Name: "Bank of Abyssinia"
   - Account Number: "9876543210"
3. Click "Save Settings"

**Result:**

- All admins see new bank details in "How to Pay" modal

---

### Use Case 3: Change Currency

**Scenario:** Change from ETB to USD

**Super Admin:**

1. Go to Settings
2. Change Currency: ETB → USD
3. Change Monthly Amount: 1000 → 50
4. Click "Save Settings"

**Result:**

- All admins see "Monthly Amount: 50 USD"

---

## 🧪 Testing

### Test 1: Update Settings

```
1. Super Admin: Go to /super-admin/settings
2. Change monthly amount to 2000
3. Change account number to "1111222233334444"
4. Click "Save Settings"
   Expected: ✅ "Settings saved successfully!"
5. Click "Reset" to reload
   Expected: ✅ Shows 2000 and new account number
```

### Test 2: Admin Sees Updates

```
1. Super Admin: Update settings (see Test 1)
2. Login as company admin
3. Go to /admin/payments
4. Click "How to Pay" button
   Expected: ✅ Modal shows updated values
5. Verify account number matches what super admin set
   Expected: ✅ Shows "1111222233334444"
```

### Test 3: Multiple Admins

```
1. Super Admin: Update monthly amount to 1800
2. Admin from Company A: Click "How to Pay"
   Expected: ✅ Shows 1800
3. Admin from Company B: Click "How to Pay"
   Expected: ✅ Shows 1800 (same settings)
4. Admin from Company C: Click "How to Pay"
   Expected: ✅ Shows 1800 (all see same)
```

---

## 🎨 UI Features

### Super Admin Settings Page:

- 🎨 Gradient background (blue-purple)
- 💎 Modern card design with backdrop blur
- 📋 Clean form layout
- 💚 Green "Save Settings" button with gradient
- 🔄 Gray "Reset" button to reload
- ✅ Success/error messages
- 📱 Responsive design

### Admin "How to Pay" Modal:

- 💾 Loads settings from database
- 🔄 Updates automatically when super admin changes them
- 💰 Shows monthly amount
- 🔢 Shows account number in green
- 🏦 Shows bank details

---

## 📋 Default Settings

When server starts, these defaults are created:

```javascript
{
  monthlyAmount: 1000,
  bankName: 'Commercial Bank of Ethiopia',
  accountName: 'Mela Note Services',
  accountNumber: '1000123456789',
  currency: 'ETB'
}
```

Super admin can change these anytime!

---

## 🔗 Navigation

### Access Super Admin Settings:

**Method 1:** From Dashboard

```
Super Admin Dashboard → Click "Settings" button
```

**Method 2:** Direct URL

```
http://localhost:3000/super-admin/settings
```

---

## ✅ Complete System Flow

### Setup (One Time):

```
1. Server starts
2. Default settings created in database
3. ✅ Ready to use
```

### Super Admin Updates:

```
1. Go to /super-admin/settings
2. Edit payment details
3. Click "Save Settings"
4. ✅ Saved to database
```

### Admin Views:

```
1. Go to /admin/payments
2. Click "How to Pay"
3. ✅ Sees updated settings from database
```

---

## 🎉 Features Summary

### What's Editable:

- ✅ Monthly subscription amount
- ✅ Currency code
- ✅ Bank name
- ✅ Account holder name
- ✅ Bank account number

### Where It's Used:

- ✅ Admin payment page "How to Pay" modal
- ✅ All companies see the same settings
- ✅ Updates apply to everyone immediately

### Who Can Edit:

- ✅ Only super admin
- ❌ Company admins can only view

---

## 🚀 Ready to Use!

**System is fully functional:**

1. ✅ Settings page created
2. ✅ API endpoints working
3. ✅ Database model created
4. ✅ Default settings initialized
5. ✅ Admin page loads settings
6. ✅ Super admin can edit
7. ✅ Changes reflect immediately

**Test it now:**

- Super Admin: `/super-admin/settings`
- Edit settings and save
- Admin: `/admin/payments` → "How to Pay"
- See your changes! 🎉
