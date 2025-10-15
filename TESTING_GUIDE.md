# Multi-Tenant Testing Guide

## Prerequisites

Before testing, ensure:
- [x] Migration script has been run: `node server/migrateCompanyData.js`
- [x] Server is running: `npm run dev`
- [x] You have super admin credentials

## Test Plan

### Phase 1: Setup (15 minutes)

#### Step 1: Create Company A
1. Login as super admin
2. Navigate to `/super-admin`
3. Click "Add Company"
4. Fill in details:
   - Name: "Test Company A"
   - Admin Email: admin@companya.com
   - Admin Username: companya_admin
   - Admin Password: TestPass123
   - Upload a logo (optional)
5. Click "Create Company"
6. **Copy the company link** (e.g., `http://localhost:3000/login?company=comp_123_abc`)

#### Step 2: Create Company B
1. Still logged in as super admin
2. Click "Add Company" again
3. Fill in details:
   - Name: "Test Company B"
   - Admin Email: admin@companyb.com
   - Admin Username: companyb_admin
   - Admin Password: TestPass456
   - Upload a different logo (optional)
4. Click "Create Company"
5. **Copy the company link** (e.g., `http://localhost:3000/login?company=comp_456_def`)

### Phase 2: Company A Testing (20 minutes)

#### Step 1: Login to Company A
1. Open new incognito/private window
2. Visit Company A's link
3. Verify:
   - [ ] Company A logo displays
   - [ ] Company A name displays
4. Login with:
   - Username: companya_admin
   - Password: TestPass123
5. Verify successful login

#### Step 2: Create Users in Company A
1. Go to User Management
2. Create 2 test users:
   - User 1: companya_user1 / Pass123
   - User 2: companya_user2 / Pass123
3. Verify users are created

#### Step 3: Create Projects in Company A
1. Go to Projects page
2. Create 3 test projects:
   - Project A1: "Company A - Project 1"
   - Project A2: "Company A - Project 2"
   - Project A3: "Company A - Project 3"
3. Verify projects are created

#### Step 4: Create Documents in Company A
1. Go to Documents page
2. Create 2 test documents:
   - Doc A1: "Company A - Document 1"
   - Doc A2: "Company A - Document 2"
3. Verify documents are created

#### Step 5: Create Notes in Company A
1. Go to Notepad page
2. Create 2 test notes:
   - Note A1: "Company A - Note 1"
   - Note A2: "Company A - Note 2"
3. Verify notes are created

### Phase 3: Company B Testing (20 minutes)

#### Step 1: Login to Company B
1. Open another incognito/private window
2. Visit Company B's link
3. Verify:
   - [ ] Company B logo displays (different from A)
   - [ ] Company B name displays
4. Login with:
   - Username: companyb_admin
   - Password: TestPass456
5. Verify successful login

#### Step 2: Create Users in Company B
1. Go to User Management
2. Create 2 test users:
   - User 1: companyb_user1 / Pass123
   - User 2: companyb_user2 / Pass123
3. Verify users are created

#### Step 3: Create Projects in Company B
1. Go to Projects page
2. Create 3 test projects:
   - Project B1: "Company B - Project 1"
   - Project B2: "Company B - Project 2"
   - Project B3: "Company B - Project 3"
3. Verify projects are created

#### Step 4: Create Documents in Company B
1. Go to Documents page
2. Create 2 test documents:
   - Doc B1: "Company B - Document 1"
   - Doc B2: "Company B - Document 2"
3. Verify documents are created

#### Step 5: Create Notes in Company B
1. Go to Notepad page
2. Create 2 test notes:
   - Note B1: "Company B - Note 1"
   - Note B2: "Company B - Note 2"
3. Verify notes are created

### Phase 4: Data Isolation Testing (30 minutes)

#### Test 1: Company A Cannot See Company B Data
1. In Company A window:
   - Go to Projects page
   - Verify: **ONLY** see Company A projects (A1, A2, A3)
   - Verify: **DO NOT** see Company B projects (B1, B2, B3)
   
2. Go to Documents page
   - Verify: **ONLY** see Company A documents (A1, A2)
   - Verify: **DO NOT** see Company B documents (B1, B2)
   
3. Go to Notepad page
   - Verify: **ONLY** see Company A notes (A1, A2)
   - Verify: **DO NOT** see Company B notes (B1, B2)
   
4. Go to User Management
   - Verify: **ONLY** see Company A users
   - Verify: **DO NOT** see Company B users

**Result:** [ ] PASS / [ ] FAIL

#### Test 2: Company B Cannot See Company A Data
1. In Company B window:
   - Go to Projects page
   - Verify: **ONLY** see Company B projects (B1, B2, B3)
   - Verify: **DO NOT** see Company A projects (A1, A2, A3)
   
2. Go to Documents page
   - Verify: **ONLY** see Company B documents (B1, B2)
   - Verify: **DO NOT** see Company A documents (A1, A2)
   
3. Go to Notepad page
   - Verify: **ONLY** see Company B notes (B1, B2)
   - Verify: **DO NOT** see Company A notes (A1, A2)
   
4. Go to User Management
   - Verify: **ONLY** see Company B users
   - Verify: **DO NOT** see Company A users

**Result:** [ ] PASS / [ ] FAIL

#### Test 3: Super Admin Can See All Data
1. Login as super admin
2. Go to Projects page
   - Verify: See **BOTH** Company A and Company B projects
   
3. Go to Documents page
   - Verify: See **BOTH** Company A and Company B documents
   
4. Go to Notepad page
   - Verify: See **BOTH** Company A and Company B notes
   
5. Go to User Management
   - Verify: See **BOTH** Company A and Company B users

**Result:** [ ] PASS / [ ] FAIL

### Phase 5: Sharing Testing (20 minutes)

#### Test 1: Company A Sharing (Within Company)
1. Login as Company A admin
2. Create a new project
3. Try to share with Company A users
   - Verify: Can see Company A users in share list
   - Verify: **CANNOT** see Company B users in share list
4. Share project with companya_user1
5. Logout and login as companya_user1
6. Verify: Can see the shared project

**Result:** [ ] PASS / [ ] FAIL

#### Test 2: Company B Sharing (Within Company)
1. Login as Company B admin
2. Create a new document
3. Try to share with Company B users
   - Verify: Can see Company B users in share list
   - Verify: **CANNOT** see Company A users in share list
4. Share document with companyb_user1
5. Logout and login as companyb_user1
6. Verify: Can see the shared document

**Result:** [ ] PASS / [ ] FAIL

### Phase 6: Edge Cases (15 minutes)

#### Test 1: Invalid Company ID
1. Visit: `http://localhost:3000/login?company=invalid_id`
2. Verify: Shows error or default login page

**Result:** [ ] PASS / [ ] FAIL

#### Test 2: Paused Company
1. Login as super admin
2. Pause Company A
3. Try to login to Company A
4. Verify: Login is blocked with appropriate message

**Result:** [ ] PASS / [ ] FAIL

#### Test 3: Cross-Company Login Attempt
1. Try to login to Company A with Company B credentials
2. Verify: Login fails with "Invalid credentials"

**Result:** [ ] PASS / [ ] FAIL

#### Test 4: Direct API Access
1. Get auth token from Company A
2. Try to access Company B data using Company A token
3. Verify: Returns empty results or error

**Result:** [ ] PASS / [ ] FAIL

### Phase 7: Search & Filter Testing (10 minutes)

#### Test 1: Search in Company A
1. Login to Company A
2. Search for "Company B" in projects
3. Verify: No results found

**Result:** [ ] PASS / [ ] FAIL

#### Test 2: Search in Company B
1. Login to Company B
2. Search for "Company A" in documents
3. Verify: No results found

**Result:** [ ] PASS / [ ] FAIL

#### Test 3: Filter by User
1. Login to Company A
2. Filter projects by Company A user
3. Verify: Only shows Company A projects

**Result:** [ ] PASS / [ ] FAIL

## Test Results Summary

### Critical Tests
- [ ] Company A cannot see Company B data
- [ ] Company B cannot see Company A data
- [ ] Super admin can see all data
- [ ] Sharing respects company boundaries
- [ ] Invalid company ID handled
- [ ] Cross-company login blocked

### Pass Criteria
- **All critical tests must PASS**
- **At least 90% of all tests must PASS**
- **No data leakage between companies**

## If Tests Fail

### Data Leakage Detected
1. **STOP IMMEDIATELY**
2. Check route files for missing companyId filters
3. Check middleware is applied to all routes
4. Review database queries
5. Re-run migration if needed

### Sharing Issues
1. Check User.find() queries include companyId filter
2. Verify sharedWith array respects company boundaries
3. Check notification creation respects company

### Login Issues
1. Verify company exists in database
2. Check company status is 'active'
3. Verify user's companyId matches URL parameter

## Post-Testing Checklist

After all tests pass:
- [ ] Document any issues found
- [ ] Fix any non-critical issues
- [ ] Update documentation if needed
- [ ] Prepare for production deployment
- [ ] Create backup before deployment
- [ ] Plan rollback procedure

## Production Testing

After deploying to production:
1. Run same tests with real companies
2. Monitor logs for errors
3. Check for performance issues
4. Verify data isolation
5. Test with real users

## Success Criteria

✅ All critical tests pass
✅ No data leakage between companies
✅ Super admin can manage all companies
✅ Company admins can only manage their company
✅ Users can only see their company data
✅ Sharing works within company boundaries
✅ Edge cases handled gracefully

## Notes

- Keep both browser windows open during testing
- Use incognito/private windows to avoid session conflicts
- Take screenshots of any failures
- Document exact steps to reproduce issues
- Test on different browsers if possible

---

**Estimated Testing Time**: 2-3 hours
**Required**: 2 people (one for each company)
**Tools**: 2 browsers or incognito windows
