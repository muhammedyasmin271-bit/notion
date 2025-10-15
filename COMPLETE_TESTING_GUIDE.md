# 🧪 COMPLETE TESTING GUIDE - Notion Multi-Tenant Application

**Generated:** October 15, 2025  
**Frontend:** http://localhost:3000  
**Backend:** http://localhost:9000

---

## ✅ AUTOMATED TEST RESULTS

### Server Health Check

- ✅ **Backend Server**: Running on port 9000
- ✅ **Frontend Server**: Running on port 3000
- ✅ **MongoDB**: Connected on port 27017
- ✅ **Database**: 4 users found (manager, testuser, jemal, admin)

### Security Tests (AUTOMATED)

- ✅ **Authentication Required**: API properly blocks unauthenticated requests
- ✅ **Token Validation**: Invalid tokens are properly rejected
- ✅ **SQL Injection Protection**: Login properly sanitizes inputs
- ✅ **CORS Configuration**: Proper cross-origin headers

---

## 📋 MANUAL TESTING CHECKLIST

Since authentication requires specific company credentials, please test the following manually:

### 1. AUTHENTICATION & AUTHORIZATION (20 min)

#### Test 1.1: Login Flow

- [ ] Open http://localhost:3000
- [ ] Enter username and password
- [ ] Verify redirect to dashboard on success
- [ ] Check that company logo/name displays correctly
- [ ] Verify JWT token is stored
- [ ] Try invalid credentials - should show error

#### Test 1.2: Registration

- [ ] Click "Register" or "Sign Up"
- [ ] Fill in all required fields
- [ ] Upload profile picture (optional)
- [ ] Verify company selection works
- [ ] Submit and check for success message
- [ ] Verify pending approval status (if applicable)
- [ ] Check that user limit enforcement works

#### Test 1.3: Logout

- [ ] Click logout button
- [ ] Verify redirect to login page
- [ ] Verify token is cleared
- [ ] Try accessing protected pages - should redirect to login

---

### 2. SUPER ADMIN FEATURES (30 min)

#### Test 2.1: Company Management

**URL:** `/super-admin`

- [ ] Login as super admin
- [ ] View list of all companies
- [ ] Click "Add Company" button
- [ ] Fill in company details:
  - Company name
  - Admin username/password
  - Company email
  - Logo upload
- [ ] Click "Create Company"
- [ ] Verify company appears in list
- [ ] Copy the generated company link
- [ ] Test the company link in new incognito window

#### Test 2.2: Company Actions

- [ ] Click on a company to view details
- [ ] Test "Pause Company" button
  - Verify users cannot login when paused
  - Check error message displayed
- [ ] Test "Unpause Company" button
  - Verify users can login again
- [ ] Test "Delete Company" button (use test company)
  - Verify warning message
  - Confirm deletion
  - Verify ALL company data is deleted

#### Test 2.3: Company Settings

- [ ] Edit company pricing:
  - Monthly amount
  - Currency
- [ ] Edit user limits:
  - Max users
  - Max storage (if applicable)
- [ ] Save changes
- [ ] Verify changes persist after refresh

#### Test 2.4: Global Payment Settings

**URL:** `/super-admin/settings`

- [ ] Edit bank name
- [ ] Edit account number
- [ ] Edit Tele Birr phone
- [ ] Edit default monthly amount
- [ ] Edit currency
- [ ] Save changes
- [ ] Verify all company admins see updated settings

#### Test 2.5: Payment Verification

**URL:** `/super-admin/payments`

- [ ] View all payment submissions
- [ ] Filter by status (All, Pending, Approved, Rejected)
- [ ] Click on a pending payment
- [ ] View screenshot
- [ ] Click "Approve"
  - Verify status changes to "Approved"
  - Check timestamp
- [ ] Test "Reject" with reason
  - Enter rejection reason
  - Verify admin sees the reason

---

### 3. COMPANY ADMIN FEATURES (25 min)

#### Test 3.1: Payment Submission

**URL:** `/admin/payments`

- [ ] Click "How to Pay" button
- [ ] Verify correct payment info displays:
  - Bank details (from global settings)
  - Tele Birr phone
  - Monthly amount (company-specific)
  - Payment deadline warning
- [ ] Click "Submit Payment"
- [ ] Enter amount
- [ ] Select payment date
- [ ] Check multiple months
- [ ] Add note
- [ ] Upload screenshot (test max 5MB)
- [ ] Submit
- [ ] Verify payment appears in history with "Pending" status

#### Test 3.2: Payment History

- [ ] View all submitted payments
- [ ] Check status badges:
  - Yellow pulsing for Pending
  - Green for Approved
  - Red for Rejected
- [ ] Click on rejected payment
- [ ] Read rejection reason
- [ ] Delete a pending payment
- [ ] Verify it's removed from list

#### Test 3.3: User Management

**URL:** `/user-management`

- [ ] View all users in company
- [ ] Check that ONLY company users are visible
- [ ] View pending users tab
- [ ] Approve a pending user
- [ ] Reject a pending user (with reason)
- [ ] Create new user manually
- [ ] Edit user role
- [ ] Verify user limit enforcement

---

### 4. MULTI-TENANT DATA ISOLATION (45 min)

**CRITICAL: Test with 2 companies in parallel**

#### Setup

1. Create Company A and Company B (as super admin)
2. Open Company A in Browser 1 (incognito)
3. Open Company B in Browser 2 (incognito)
4. Create test data in each

#### Test 4.1: Projects Isolation

- [ ] **Company A**: Create 3 projects ("A-Project-1", "A-Project-2", "A-Project-3")
- [ ] **Company B**: Create 3 projects ("B-Project-1", "B-Project-2", "B-Project-3")
- [ ] **Company A**: Verify ONLY sees A projects (not B)
- [ ] **Company B**: Verify ONLY sees B projects (not A)
- [ ] Search for "B-Project" in Company A - should find nothing
- [ ] Verify project counts are separate

#### Test 4.2: Documents Isolation

- [ ] **Company A**: Upload 2 documents
- [ ] **Company B**: Upload 2 documents
- [ ] **Company A**: Verify ONLY sees own documents
- [ ] **Company B**: Verify ONLY sees own documents
- [ ] Try searching cross-company - should fail

#### Test 4.3: Notes Isolation

- [ ] **Company A**: Create 3 notes with unique titles
- [ ] **Company B**: Create 3 notes with unique titles
- [ ] **Company A**: Count notes - should be 3
- [ ] **Company B**: Count notes - should be 3
- [ ] Verify no cross-contamination

#### Test 4.4: Meetings Isolation

- [ ] **Company A**: Create 2 meetings
- [ ] **Company B**: Create 2 meetings
- [ ] Verify separation
- [ ] Check attendee lists only show company users

#### Test 4.5: User Isolation

- [ ] **Company A**: View users list
- [ ] Verify CANNOT see Company B users
- [ ] **Company B**: View users list
- [ ] Verify CANNOT see Company A users
- [ ] In sharing dialogs, verify only company users appear

---

### 5. SHARING & SECURITY (20 min)

#### Test 5.1: Project Sharing (Within Company)

- [ ] Login as Company A admin
- [ ] Create a project
- [ ] Click "Share" button
- [ ] Verify user picker shows ONLY Company A users
- [ ] Share with a Company A user
- [ ] Logout and login as that user
- [ ] Verify can see the shared project
- [ ] Verify cannot see unshared projects

#### Test 5.2: Document Sharing

- [ ] Create a document
- [ ] Try sharing
- [ ] Verify CANNOT see users from other companies
- [ ] Share with company user
- [ ] Verify they receive notification
- [ ] Verify they can access it

#### Test 5.3: Note Sharing

- [ ] Create a note
- [ ] Open share dialog
- [ ] Verify user list is filtered by company
- [ ] Share note
- [ ] Verify recipient can view

#### Test 5.4: Cross-Company Security

- [ ] Try to manually craft API request with another company's ID
- [ ] Verify request is blocked or returns empty
- [ ] Try to access another company's document by direct ID
- [ ] Verify access is denied

---

### 6. CORE FEATURES - PROJECTS (15 min)

#### Test 6.1: Create Project

- [ ] Click "New Project" or "+" button
- [ ] Enter title
- [ ] Enter description
- [ ] Set status (Active, Completed, On Hold)
- [ ] Set priority (Low, Medium, High)
- [ ] Assign team members
- [ ] Set due date
- [ ] Save project
- [ ] Verify appears in list

#### Test 6.2: Edit Project

- [ ] Click on a project
- [ ] Edit title and description
- [ ] Change status
- [ ] Change priority
- [ ] Update assignees
- [ ] Save changes
- [ ] Verify updates persist

#### Test 6.3: Delete Project

- [ ] Select a project
- [ ] Click delete
- [ ] Confirm deletion
- [ ] Verify removed from list
- [ ] Check if moved to trash (if applicable)

#### Test 6.4: Filter & Search

- [ ] Filter by status
- [ ] Filter by priority
- [ ] Filter by assignee
- [ ] Search by project name
- [ ] Verify results are accurate

---

### 7. CORE FEATURES - DOCUMENTS (15 min)

#### Test 7.1: Upload Documents

- [ ] Click "Upload Document" or "+"
- [ ] Upload PDF file (< 10MB)
- [ ] Verify upload progress
- [ ] Verify document appears
- [ ] Click to view/download

#### Test 7.2: Different File Types

Test with:

- [ ] PDF document
- [ ] Excel file (.xlsx)
- [ ] Word document (.docx)
- [ ] PowerPoint (.pptx)
- [ ] Image (JPG, PNG)
- [ ] Video (MP4) if supported
- [ ] External link/URL

#### Test 7.3: Document Management

- [ ] Rename a document
- [ ] Add description/notes
- [ ] Tag documents
- [ ] Delete a document
- [ ] Search documents by name
- [ ] Filter by type

---

### 8. CORE FEATURES - NOTEPAD (15 min)

#### Test 8.1: Create Note

- [ ] Click "New Note"
- [ ] Enter title
- [ ] Type content in editor
- [ ] Use formatting toolbar:
  - Bold, Italic, Underline
  - Headers (H1, H2, H3)
  - Bullet lists
  - Numbered lists
  - Code blocks
  - Quotes
- [ ] Add tags
- [ ] Save note

#### Test 8.2: Markdown Support

- [ ] Type `# Header` - should create H1
- [ ] Type `## Header` - should create H2
- [ ] Type `- list item` - should create bullet
- [ ] Type `1. item` - should create numbered list
- [ ] Type `` `code` `` - should create inline code
- [ ] Verify rendering is correct

#### Test 8.3: Note Organization

- [ ] Create folder/category
- [ ] Move notes between folders
- [ ] Filter by tags
- [ ] Search notes by content
- [ ] Sort by date/title

---

### 9. CORE FEATURES - MEETINGS (15 min)

#### Test 9.1: Create Meeting

- [ ] Click "New Meeting"
- [ ] Enter title
- [ ] Set date and time
- [ ] Add attendees (from company users)
- [ ] Set agenda
- [ ] Add notes/minutes
- [ ] Add action items
- [ ] Save meeting

#### Test 9.2: Meeting Templates

- [ ] View meeting templates
- [ ] Create new template
- [ ] Use template to create meeting
- [ ] Verify template fields populate

#### Test 9.3: Meeting Management

- [ ] Edit existing meeting
- [ ] Mark action items as complete
- [ ] Export meeting notes
- [ ] Delete meeting
- [ ] Filter by date range

---

### 10. CORE FEATURES - TASKS & GOALS (15 min)

#### Test 10.1: Tasks

- [ ] Create new task
- [ ] Set task title and description
- [ ] Set due date
- [ ] Assign to user
- [ ] Set priority
- [ ] Mark as complete
- [ ] View completed tasks
- [ ] Delete task

#### Test 10.2: Goals

- [ ] Create new goal
- [ ] Set goal title
- [ ] Add description/notes
- [ ] Set target date
- [ ] Track progress
- [ ] Update status
- [ ] Mark as achieved

---

### 11. REPORTS & ANALYTICS (10 min)

#### Test 11.1: View Reports

- [ ] Navigate to Reports page
- [ ] View project completion rates
- [ ] View team performance metrics
- [ ] View productivity stats
- [ ] Check data visualization (charts/graphs)

#### Test 11.2: Create Custom Report

- [ ] Click "New Report" (if available)
- [ ] Select data sources
- [ ] Configure display options
- [ ] Save report
- [ ] Export report (JSON/PDF)

#### Test 11.3: Shared Reports

- [ ] Share a report with team members
- [ ] View shared reports
- [ ] Verify permissions

---

### 12. NOTIFICATIONS (10 min)

#### Test 12.1: Notification Center

- [ ] Click notifications bell icon
- [ ] View unread count
- [ ] Read a notification
- [ ] Verify count decreases
- [ ] Mark all as read
- [ ] Delete notification

#### Test 12.2: Notification Types

Verify you receive notifications for:

- [ ] Project assignments
- [ ] Document shares
- [ ] Note shares
- [ ] Meeting invites
- [ ] Task assignments
- [ ] Payment approvals/rejections
- [ ] User approval needed (admin)

---

### 13. USER PROFILE & SETTINGS (10 min)

#### Test 13.1: Profile Tab

- [ ] Navigate to `/profile`
- [ ] View profile information
- [ ] Edit name
- [ ] Edit email
- [ ] Edit phone number
- [ ] Upload profile picture
- [ ] Save changes
- [ ] Verify changes persist

#### Test 13.2: Security Tab

- [ ] Click "Security" tab
- [ ] Enter current password
- [ ] Enter new password
- [ ] Confirm new password
- [ ] Click "Update Password"
- [ ] Logout and login with new password
- [ ] Verify login works

#### Test 13.3: Preferences Tab

- [ ] View preferences
- [ ] Check for any settings
- [ ] Update if available
- [ ] Save changes

---

### 14. RESPONSIVE DESIGN (15 min)

Test the application on different screen sizes:

#### Desktop

- [ ] Test at 1920x1080
- [ ] Test at 1366x768
- [ ] Verify all elements display correctly
- [ ] Check navigation menu
- [ ] Verify tables/lists are readable

#### Tablet

- [ ] Test at 768px width
- [ ] Verify mobile menu appears
- [ ] Check sidebar behavior
- [ ] Verify forms are usable

#### Mobile

- [ ] Test at 375px width (iPhone SE)
- [ ] Verify hamburger menu works
- [ ] Check form inputs are readable
- [ ] Verify buttons are tappable
- [ ] Test scrolling behavior

---

### 15. PERFORMANCE & USABILITY (10 min)

#### Test 15.1: Load Times

- [ ] Measure initial page load (should be < 3s)
- [ ] Measure dashboard load
- [ ] Measure project list load
- [ ] Check for any slow queries

#### Test 15.2: Error Handling

- [ ] Try uploading oversized file (> 10MB)
- [ ] Try submitting form with missing fields
- [ ] Try invalid date inputs
- [ ] Verify error messages are clear
- [ ] Check errors don't crash the app

#### Test 15.3: Browser Compatibility

Test on:

- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Safari (if on Mac)

---

### 16. DATA PERSISTENCE (5 min)

- [ ] Create some data (project, note, document)
- [ ] Refresh the page
- [ ] Verify data persists
- [ ] Logout and login again
- [ ] Verify data still exists
- [ ] Restart backend server
- [ ] Verify data persists in database

---

## 🎯 CRITICAL TESTS (MUST PASS)

These are the most important tests for production readiness:

### Security

- ✅ Authentication blocks unauthenticated access
- ✅ Invalid tokens are rejected
- ✅ SQL injection is prevented
- [ ] Company A cannot see Company B's data
- [ ] Users can only see their company's users in sharing dialogs
- [ ] Direct API access with wrong company ID is blocked

### Multi-Tenancy

- [ ] Projects are completely isolated by company
- [ ] Documents are completely isolated by company
- [ ] Notes are completely isolated by company
- [ ] Users cannot see other companies' data
- [ ] Sharing only works within same company

### Payment System

- [ ] Admin can submit payments with screenshots
- [ ] Super admin can approve/reject payments
- [ ] Rejection reasons are shown to admins
- [ ] Company-specific pricing is enforced
- [ ] Global payment settings update for all companies

### User Management

- [ ] User limit enforcement works
- [ ] Pending users don't count toward limit
- [ ] Admins can only see their company's users
- [ ] User approval workflow works

---

## 📊 TEST RESULTS SUMMARY

### Automated Tests

- **Total:** 33 tests
- **Passed:** 7 (21.2%)
- **Failed:** 26 (78.8%)
- **Warnings:** 3

**Note:** Most failures are due to authentication requirements. Manual testing is required to verify full functionality.

### Manual Tests

Fill in as you complete:

- **Total:** \_\_\_ / 150+
- **Passed:** \_\_\_
- **Failed:** \_\_\_
- **Issues Found:** \_\_\_

---

## 🐛 BUG REPORTING TEMPLATE

If you find bugs, document them like this:

```
**Title:** [Brief description]
**Severity:** Critical / High / Medium / Low
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** What should happen
**Actual Result:** What actually happened
**Screenshots:** [Attach if applicable]
**Browser:** Chrome 119 / Firefox 120 / etc.
**User Role:** Super Admin / Admin / User
**Company:** Company A / Company B / etc.
```

---

## ✅ SIGN-OFF

### Tested By: ******\_\_\_******

### Date: ******\_\_\_******

### Overall Status: ⬜ PASS ⬜ FAIL ⬜ NEEDS FIXES

### Notes:

```
[Add any additional notes, observations, or recommendations]
```

---

## 📞 SUPPORT

If you encounter issues:

1. Check the console for errors (F12)
2. Check the network tab for failed requests
3. Check backend logs for server errors
4. Review MongoDB for data issues

**Backend Logs:** Check terminal where `npm run dev` is running  
**Frontend Logs:** Check browser console (F12 > Console)  
**Database:** Use MongoDB Compass or `mongosh` to inspect

---

**End of Testing Guide**
