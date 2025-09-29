# Meeting Page Troubleshooting Guide

## Issue: Meetings are created but not showing in the list

### Quick Diagnosis Steps:

1. **Check Server Status**
   - Look at the bottom-right corner of the Meeting Notes page
   - You should see a "Server Online" indicator
   - If it shows "Server Offline", the backend is not running

2. **Start the Backend Server**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   
3. **Check MongoDB Connection**
   - Make sure MongoDB is running on your system
   - Default connection: `mongodb://localhost:27017/notion-app`

4. **Check Browser Console**
   - Open Developer Tools (F12)
   - Go to Console tab
   - Look for error messages when creating or loading meetings

### Common Issues and Solutions:

#### 1. Backend Server Not Running
**Symptoms:** Server Status shows "Offline", API calls fail
**Solution:** 
```bash
cd server
npm run dev
```

#### 2. MongoDB Not Running
**Symptoms:** Server starts but can't connect to database
**Solution:**
- Windows: Start MongoDB service or run `mongod`
- Make sure MongoDB is installed and configured

#### 3. Port Conflicts
**Symptoms:** Server fails to start on port 5000
**Solution:**
- Check if another application is using port 5000
- Change port in server/.env file if needed

#### 4. CORS Issues
**Symptoms:** Network errors in browser console
**Solution:** Backend is already configured for CORS, but check if frontend is running on port 3000

### Testing the Fix:

1. **Create a Test Meeting:**
   - Go to Meeting Notes page
   - Click "Create Meeting"
   - Fill in title, date, time
   - Click "Create Meeting"
   - Check console for success/error messages

2. **Verify Database Storage:**
   - Check browser console for "Meeting created successfully" message
   - Go back to Meeting Notes list
   - Your meeting should appear in the list

3. **Check API Endpoints:**
   - Open http://localhost:5000/api/health in browser
   - Should show server status JSON
   - Open http://localhost:5000/api/meetings in browser (requires authentication)

### Debug Information Added:

The following debug information has been added to help diagnose issues:

1. **MeetingNotesPage:** Console logs when loading meetings
2. **MeetingEditorPage:** Console logs when saving meetings  
3. **ServerStatus Component:** Shows real-time server connectivity

### If Issues Persist:

1. Check the server console for error messages
2. Verify MongoDB is running and accessible
3. Check network tab in browser dev tools for failed requests
4. Ensure all dependencies are installed (`npm install` in both root and server directories)

### Quick Start Script:

Use the provided `start-dev.bat` file to start all services at once:
```bash
./start-dev.bat
```

This will start:
- MongoDB
- Backend server (port 5000)
- Frontend server (port 3000)