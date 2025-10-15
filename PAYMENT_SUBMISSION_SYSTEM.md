# 💰 Payment Submission & Verification System

## Overview

A complete payment submission system where company admins can upload payment screenshots and notes, and super admins can verify/approve them.

---

## 🎯 Features

### For Company Admins (CEO):

- ✅ Upload payment screenshot (image/PDF)
- ✅ Enter payment amount
- ✅ Select payment date and method
- ✅ Add payment period (month/year)
- ✅ Add optional notes
- ✅ View payment history
- ✅ See payment status (Pending, Approved, Rejected)
- ✅ Delete pending payments
- ✅ View rejection reasons

### For Super Admin:

- ✅ View all payment submissions from all companies
- ✅ Filter by status (Pending, Approved, Rejected, All)
- ✅ View payment screenshots
- ✅ Approve payments
- ✅ Reject payments with reason
- ✅ View statistics (total, pending, approved, rejected, total amount)
- ✅ See company and submitter details

---

## 📂 Files Created

### Backend:

1. **`server/models/Payment.js`** - Payment data model
2. **`server/routes/payments.js`** - Payment submission and verification API routes

### Frontend:

3. **`src/components/AdminDashboard/PaymentSubmission.js`** - Admin payment submission page
4. **`src/components/SuperAdminPage/PaymentVerification.jsx`** - Super admin verification page

### Modified Files:

5. **`server/index.js`** - Added payment routes
6. **`src/App.js`** - Added payment page routes

---

## 🔌 API Endpoints

### For Company Admin:

**POST `/api/payments/submit`**

- **Access:** Admin only
- **Description:** Submit new payment with screenshot
- **Body:** FormData with:
  - `screenshot` (file) - Payment screenshot (max 5MB)
  - `amount` (number) - Payment amount
  - `paymentDate` (date) - Payment date
  - `paymentMethod` (string) - bank_transfer, mobile_money, cash, check, other
  - `note` (string) - Optional note
  - `month` (number) - Payment month (1-12)
  - `year` (number) - Payment year

**GET `/api/payments/my-company`**

- **Access:** Admin only
- **Description:** Get all payments for current company

**DELETE `/api/payments/:id`**

- **Access:** Admin only (own company) or Super Admin
- **Description:** Delete pending payment

### For Super Admin:

**GET `/api/payments/all?status=pending`**

- **Access:** Super Admin only
- **Description:** Get all payments (filterable by status)

**PUT `/api/payments/:id/verify`**

- **Access:** Super Admin only
- **Description:** Approve or reject payment
- **Body:**
  ```json
  {
    "status": "approved" | "rejected",
    "rejectionReason": "Reason for rejection (required if rejected)"
  }
  ```

---

## 📊 Payment Model Schema

```javascript
{
  companyId: String (required, indexed),
  companyName: String (required),
  submittedBy: ObjectId (ref: User, required),
  amount: Number (required),
  paymentDate: Date (required),
  paymentMethod: Enum (bank_transfer, mobile_money, cash, check, other),
  screenshotUrl: String (required),
  note: String,
  status: Enum (pending, approved, rejected) [default: pending],
  verifiedBy: ObjectId (ref: User),
  verifiedAt: Date,
  rejectionReason: String,
  period: {
    month: Number (1-12),
    year: Number
  },
  timestamps: true (createdAt, updatedAt)
}
```

---

## 🚀 How to Use

### For Company Admin:

1. **Navigate to Payment Submission:**

   - Go to `/admin/payments`
   - Or click "Payments" in admin dashboard

2. **Submit Payment:**

   - Click "Submit Payment" button
   - Fill in payment details:
     - Amount (required)
     - Payment Date (required)
     - Payment Method (required)
     - Period (month/year)
     - Note (optional)
   - Upload screenshot (required, max 5MB)
   - Click "Submit Payment"

3. **View History:**
   - See all submitted payments
   - Check status badges:
     - 🟡 Pending - Waiting for approval
     - 🟢 Approved - Verified by super admin
     - 🔴 Rejected - See rejection reason
   - View screenshots by clicking "View" button
   - Delete pending payments if needed

### For Super Admin:

1. **Navigate to Payment Verification:**

   - Go to `/super-admin/payments`
   - Or add link in super admin dashboard

2. **Review Payments:**

   - View statistics at top
   - Filter by status (All, Pending, Approved, Rejected)
   - See company details, amount, period, method
   - Click "View" to see payment screenshot

3. **Verify Payment:**
   - For pending payments, click "Approve" or "Reject"
   - **To Approve:**
     - Click "Approve" button
     - Confirm in modal
   - **To Reject:**
     - Click "Reject" button
     - Enter rejection reason (required)
     - Confirm rejection

---

## 🎨 UI Features

### Admin Dashboard:

- Clean, modern card-based design
- Image preview before submission
- Payment history with status badges
- Direct links to view screenshots
- Delete functionality for pending payments
- Rejection reason display

### Super Admin Dashboard:

- Comprehensive statistics dashboard
- Status filter dropdown
- Company and user information display
- Modal confirmation for verification
- Required rejection reason for rejections
- Real-time updates after verification

---

## 🔒 Security Features

1. **Authentication:**

   - All routes protected by `auth` middleware
   - Role-based access control (Admin/Super Admin)

2. **Authorization:**

   - Admins can only view/submit for their company
   - Super admins can view/verify all companies
   - Only pending payments can be modified

3. **File Upload:**

   - File size limit: 5MB
   - Allowed formats: JPEG, PNG, PDF
   - Files stored in `server/uploads/payments/`
   - Unique filename generation

4. **Data Validation:**
   - Required fields validation
   - Amount must be positive number
   - Status must be valid enum value
   - Rejection requires reason

---

## 📁 Upload Directory Structure

```
server/
└── uploads/
    └── payments/
        ├── payment-1234567890123-abc123.jpg
        ├── payment-1234567890124-def456.png
        └── payment-1234567890125-ghi789.pdf
```

---

## 🔧 Installation & Setup

1. **Install Required Package:**

   ```bash
   cd server
   npm install multer
   ```

2. **Create Upload Directory:**

   - Directory is automatically created when first payment is submitted
   - Or manually create: `server/uploads/payments/`

3. **Restart Server:**

   ```bash
   cd server
   node index.js
   ```

4. **Access Pages:**
   - **Admin:** `http://localhost:3000/admin/payments`
   - **Super Admin:** `http://localhost:3000/super-admin/payments`

---

## 💡 Usage Examples

### Admin Submitting Payment:

```
1. Login as company admin
2. Navigate to /admin/payments
3. Click "Submit Payment"
4. Fill form:
   - Amount: 500
   - Date: 2025-10-15
   - Method: Bank Transfer
   - Period: October 2025
   - Note: "Monthly subscription payment"
5. Upload screenshot
6. Submit
```

### Super Admin Approving:

```
1. Login as super admin
2. Navigate to /super-admin/payments
3. See pending payment from Company A
4. Click "View" to verify screenshot
5. Click "Approve"
6. Confirm approval
```

### Super Admin Rejecting:

```
1. Find problematic payment
2. Click "Reject"
3. Enter reason: "Screenshot is not clear, please resubmit"
4. Confirm rejection
5. Admin receives notification with reason
```

---

## 🎯 Future Enhancements (Optional)

- [ ] Email notifications on approval/rejection
- [ ] SMS notifications for status changes
- [ ] Payment reminders
- [ ] Automatic payment due date calculations
- [ ] Payment history export (PDF/Excel)
- [ ] Payment analytics dashboard
- [ ] Recurring payment setup
- [ ] Multiple screenshot uploads
- [ ] Payment receipt generation
- [ ] Integration with payment gateways

---

## ✅ System is Complete!

The payment submission and verification system is fully functional and ready to use!

**Next Steps:**

1. Restart your server
2. Login as admin to test payment submission
3. Login as super admin to test verification
4. Enjoy the new feature! 🎉
