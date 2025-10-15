# 🔧 Company Settings Troubleshooting

## ❌ Error: "Unexpected token '<', "<!DOCTYPE "... is not valid JSON"

### **What This Means:**

The frontend is receiving HTML instead of JSON from the backend. This typically means:

1. The backend route is not found (404 error)
2. The backend server is not running
3. The request is hitting the React dev server instead of the backend

---

## ✅ **FIX: Restart Backend Server**

### **Step 1: Stop Existing Server**

```bash
# Press Ctrl+C in the terminal running the backend
# Or close the terminal
```

### **Step 2: Start Backend Server**

```bash
cd server
npm start
```

**You should see:**

```
🚀 Server running on port 9000
MongoDB connected: localhost:27017
✅ System settings initialized
```

### **Step 3: Verify Routes Loaded**

Check the console for any errors when loading `company.js` routes.

---

## 🔍 **Verify Backend is Running**

### **Test 1: Health Check**

Open browser and go to:

```
http://localhost:9000/api/health
```

**Should return:**

```json
{
  "status": "OK",
  "message": "Notion App Backend is running",
  "database": "Connected",
  "timestamp": "2025-10-15T..."
}
```

**If you see HTML or error:**

- ❌ Backend is NOT running
- ✅ Start backend: `cd server && npm start`

---

### **Test 2: Test Company Endpoint**

Use browser developer tools (F12) → Network tab:

1. Open Company Settings page
2. Check Network tab for:
   - `GET /api/company/my-company`
   - `GET /api/company/stats`

**Should see:**

- Status: 200 OK
- Response: JSON object

**If you see:**

- Status: 404 → Route not registered
- Status: 500 → Server error
- HTML response → Backend not running

---

## 🔧 **Common Issues & Solutions**

### **Issue 1: Backend Not Running**

**Symptom:** Getting HTML responses, connection errors

**Solution:**

```bash
cd server
npm start
```

**Verify:** Go to `http://localhost:9000/api/health`

---

### **Issue 2: Route Not Found (404)**

**Symptom:** 404 errors in Network tab

**Check:**

1. Is `companyRoutes` imported in `server/index.js`?
2. Is `app.use('/api/company', companyRoutes);` added?
3. Did you restart the server after adding routes?

**Solution:**

```bash
# Restart backend
cd server
npm start
```

---

### **Issue 3: CORS Issues**

**Symptom:** CORS policy errors in console

**Check `server/index.js`:**

```javascript
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);
```

---

### **Issue 4: Wrong Port**

**Symptom:** Connection refused

**Check:**

- Backend should run on port 9000
- Frontend should proxy to `http://localhost:9000`

**Verify in `package.json` (root):**

```json
"proxy": "http://localhost:9000"
```

---

### **Issue 5: File Upload Not Working**

**Symptom:** Logo upload fails

**Check:**

1. Is `multer` installed? `npm list multer`
2. Is uploads directory created?
3. File size under 5MB?
4. File type is image?

**Solution:**

```bash
cd server
npm install multer
```

---

## 🎯 **Step-by-Step Fix**

### **Complete Reset:**

**1. Stop All Servers:**

- Stop frontend (Ctrl+C)
- Stop backend (Ctrl+C)

**2. Restart Backend:**

```bash
cd server
npm start
```

**Wait for:**

```
🚀 Server running on port 9000
MongoDB connected: localhost:27017
```

**3. Restart Frontend:**

```bash
# In project root
npm start
```

**4. Test Health Check:**

```
http://localhost:9000/api/health
```

**Should return JSON, not HTML**

**5. Try Company Settings Again:**

- Login as admin
- Go to `/admin/settings`
- Try saving branding
- Check console for errors

---

## 📋 **Checklist Before Testing**

- [ ] MongoDB is running
- [ ] Backend server is running on port 9000
- [ ] Frontend is running on port 3000
- [ ] No console errors on backend startup
- [ ] Health check returns JSON
- [ ] You're logged in as admin
- [ ] You have a valid company in database

---

## 🚀 **Quick Test Commands**

### **Test Backend Routes:**

```bash
# In new terminal
curl http://localhost:9000/api/health
```

**Should see JSON response**

### **Test Company Route (with auth):**

```bash
# Replace YOUR_TOKEN with actual JWT token
curl -H "x-auth-token: YOUR_TOKEN" http://localhost:9000/api/company/my-company
```

**Should see company data JSON**

---

## ✅ **After Fix**

When working correctly, you should see:

**Frontend Console:**

- ✅ No CORS errors
- ✅ API calls return JSON
- ✅ Success messages appear

**Backend Console:**

- ✅ `PUT /api/company/branding`
- ✅ No errors

**Network Tab:**

- ✅ Status: 200 OK
- ✅ Response Type: JSON
- ✅ Response has `branding` object

**MongoDB:**

- ✅ `company.branding` updated
- ✅ Data persists

---

## 🎊 **Summary**

**Most Common Fix:**

1. **RESTART BACKEND SERVER** ← This usually fixes it!
2. Make sure it's running on port 9000
3. Check health endpoint returns JSON
4. Try Company Settings again

**If still not working:**

- Check all servers are running
- Check MongoDB is running
- Check browser console for specific errors
- Check backend console for errors
