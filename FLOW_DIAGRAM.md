# Flow Diagrams

## Company Creation Flow with Fixes

```
┌─────────────────────────────────────────────────────────────────┐
│                    CREATE COMPANY PAGE                          │
│  - Company Name, Email, Phone                                   │
│  - Admin Name, Email, Phone, Password                           │
│  - Select Plan (Free Trial or Paid)                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              POST /api/company/create                           │
│  - Validate all required fields                                 │
│  - Create admin user                                            │
│  - Create company record                                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│           SMS NOTIFICATION PROCESS (NEW FIX)                    │
│                                                                 │
│  1. Check SMS_API & SMS_TOKEN configured                        │
│  2. If configured:                                              │
│     - Format phone number                                       │
│     - Create SMS message                                        │
│     - Send via SMS service                                      │
│  3. If not configured:                                          │
│     - Log warning                                               │
│     - Continue (non-blocking)                                   │
│                                                                 │
│  ✅ Company creation succeeds regardless of SMS status          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              COMPANY CREATED SUCCESS PAGE                       │
│  - Display company details                                      │
│  - Show admin email                                             │
│  - Show selected plan                                           │
│  - Display "Login to Your Workspace" button                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│        LOGIN BUTTON CLICK (NEW FIX)                             │
│                                                                 │
│  OLD: React Router Link                                         │
│       - Sometimes unreliable with query params                  │
│                                                                 │
│  NEW: window.location.href = `/login?company=${companyId}`      │
│       - Full page navigation                                    │
│       - Reliable query parameter passing                        │
│       - Ensures company ID is in URL                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              COMPANY LOGIN PAGE                                 │
│  - Load company data via companyId                              │
│  - Display company branding (logo, name)                        │
│  - Show login form                                              │
│  - Admin can login with credentials                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## SMS Notification Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                  COMPANY CREATION ENDPOINT                       │
│              POST /api/company/create                            │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              CREATE ADMIN USER & COMPANY                         │
│  - Save to database                                              │
│  - Generate company link                                         │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│         SMS NOTIFICATION PROCESS (IMPROVED)                      │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Step 1: Check Configuration                             │    │
│  │ ✓ SMS_API environment variable exists?                  │    │
│  │ ✓ SMS_TOKEN environment variable exists?                │    │
│  │ ✓ Admin phone number provided?                          │    │
│  └──────────────────┬──────────────────────────────────────┘    │
│                     │                                            │
│         ┌───────────┴───────────┐                               │
│         │                       │                               │
│         ▼                       ▼                               │
│    ✅ ALL OK              ❌ MISSING CONFIG                     │
│         │                       │                               │
│         ▼                       ▼                               │
│  ┌─────────────────┐    ┌──────────────────┐                  │
│  │ Step 2: Format  │    │ Log Warning:     │                  │
│  │ Phone Number    │    │ SMS skipped      │                  │
│  │                 │    │ (non-blocking)   │                  │
│  │ +251XXXXXXXXX   │    └──────────────────┘                  │
│  │ 09XXXXXXXX      │                                           │
│  │ 9XXXXXXXX       │                                           │
│  └────────┬────────┘                                           │
│           │                                                    │
│           ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Step 3: Create Message                                  │  │
│  │ - Free Trial: "7 days free trial"                        │  │
│  │ - Paid Plan: "24 hours to complete payment"              │  │
│  │ - Include: Company name, login link                      │  │
│  └────────┬────────────────────────────────────────────────┘  │
│           │                                                    │
│           ▼                                                    │
│  ┌─────────────────────────────────────────────────────────┐  │
│  │ Step 4: Send SMS                                        │  │
│  │ - Call sendSMS(phone, message)                           │  │
│  │ - Wait for response                                      │  │
│  └────────┬────────────────────────────────────────────────┘  │
│           │                                                    │
│    ┌──────┴──────┐                                            │
│    │             │                                            │
│    ▼             ▼                                            │
│  ✅ SUCCESS   ❌ FAILED                                       │
│    │             │                                            │
│    ▼             ▼                                            │
│  Log OK      Log Error                                        │
│    │             │                                            │
│    └──────┬──────┘                                            │
│           │                                                    │
│           ▼                                                    │
│  ✅ CONTINUE (Non-blocking)                                  │
│     Company creation succeeds                                │
│                                                               │
└──────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────────────┐
│              RETURN SUCCESS RESPONSE                             │
│  - Company ID                                                    │
│  - Company Name                                                  │
│  - Admin Email                                                   │
│  - Company Link                                                  │
│  - Payment Deadline                                              │
└──────────────────────────────────────────────────────────────────┘
```

---

## Login Button Navigation Flow

```
┌─────────────────────────────────────────────────────────────────┐
│           COMPANY CREATED SUCCESS PAGE                          │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  "Login to Your Workspace" Button                         │ │
│  │                                                           │ │
│  │  onClick={() =>                                          │ │
│  │    window.location.href =                                │ │
│  │    `/login?company=${companyId}`                          │ │
│  │  }                                                        │ │
│  └───────────────────┬───────────────────────────────────────┘ │
│                      │                                          │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Browser Navigation           │
        │ Full page reload             │
        │ URL: /login?company=comp_... │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ LoginPage Component          │
        │ - Read companyId from URL    │
        │ - Fetch company data         │
        │ - Load company branding      │
        │ - Display login form         │
        └──────────────┬───────────────┘
                       │
                       ▼
        ┌──────────────────────────────┐
        │ Company Login Page           │
        │ - Company logo               │
        │ - Company name               │
        │ - Login form                 │
        │ - Admin can login            │
        └──────────────────────────────┘
```

---

## Comparison: Before vs After

### Login Button

```
BEFORE (Unreliable):
┌─────────────────────────────────────────┐
│ <Link to={`/login?company=${id}`}>      │
│   Login                                 │
│ </Link>                                 │
│                                         │
│ ❌ Sometimes loses query params         │
│ ❌ React Router may not navigate        │
│ ❌ Inconsistent behavior                │
└─────────────────────────────────────────┘

AFTER (Reliable):
┌─────────────────────────────────────────┐
│ <button                                 │
│   onClick={() =>                        │
│     window.location.href =              │
│     `/login?company=${id}`              │
│   }                                     │
│ >                                       │
│   Login                                 │
│ </button>                               │
│                                         │
│ ✅ Full page navigation                 │
│ ✅ Query params always preserved        │
│ ✅ Consistent behavior                  │
└─────────────────────────────────────────┘
```

### SMS Notification

```
BEFORE (No validation):
┌──────────────────────────────────────────┐
│ if (adminPhone) {                        │
│   try {                                  │
│     await sendSMS(...)                   │
│   } catch (e) { ... }                    │
│ }                                        │
│                                          │
│ ❌ No SMS config check                   │
│ ❌ Unclear logging                       │
│ ❌ Hard to debug                         │
└──────────────────────────────────────────┘

AFTER (With validation):
┌──────────────────────────────────────────┐
│ if (adminPhone &&                        │
│     process.env.SMS_API &&               │
│     process.env.SMS_TOKEN) {             │
│   try {                                  │
│     await sendSMS(...)                   │
│   } catch (e) { ... }                    │
│ } else {                                 │
│   console.log('SMS skipped')             │
│ }                                        │
│                                          │
│ ✅ Validates SMS config                  │
│ ✅ Clear logging                         │
│ ✅ Easy to debug                         │
│ ✅ Non-blocking                          │
└──────────────────────────────────────────┘
```
