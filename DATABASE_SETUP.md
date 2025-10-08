# Database Setup Instructions

## Issue: Text area data not saving to database

The issue you're experiencing is likely due to MongoDB not running locally. Here are the steps to fix it:

## Option 1: Start MongoDB Locally (Recommended)

### 1. Install MongoDB (if not already installed)

- Download MongoDB Community Server from: https://www.mongodb.com/try/download/community
- Install with default settings
- Make sure to install MongoDB as a Windows Service

### 2. Create MongoDB Data Directory

```bash
mkdir C:\data\db
```

### 3. Start MongoDB

```bash
# Option A: Start as Windows Service (if installed as service)
net start MongoDB

# Option B: Start manually
mongod --dbpath "C:\data\db"
```

### 4. Start the Application

```bash
# From the root directory (notion folder)
npm run dev
```

Or simply double-click the `start-app.bat` file we created.

## Option 2: Use MongoDB Atlas (Cloud Database)

### 1. Update server/.env file

Uncomment one of the MongoDB Atlas connection strings:

```
MONGODB_URI=mongodb+srv://muhammedyasmin271_db_user:xt8xWbq2jGjC0gap@cluster0.ifoywqr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
```

### 2. Comment out the local MongoDB URI:

```
# MONGODB_URI=mongodb://localhost:27017/notion-app
```

## Verification

### Check if MongoDB is running:

1. Open Command Prompt
2. Run: `tasklist | findstr mongod`
3. If you see `mongod.exe`, MongoDB is running

### Check if backend server is running:

1. Open browser
2. Go to: http://localhost:9000/api/health
3. You should see a JSON response with status "OK"

## Features Added to Handle Offline Mode

The MeetingEditorPage now includes:

1. **Auto-save to localStorage**: Data is saved locally every 5 seconds
2. **Offline detection**: Shows when server is unavailable
3. **Automatic sync**: When server comes back online, offline data is automatically synced
4. **Visual indicators**: Shows save status (saving, saved, offline)
5. **Backup system**: Creates backups before attempting server saves

## Troubleshooting

### If MongoDB won't start:

1. Check if port 27017 is in use: `netstat -an | findstr 27017`
2. Try different data directory: `mongod --dbpath "C:\mongodb\data"`
3. Check MongoDB logs in the data directory

### If backend won't start:

1. Check if port 5000 is in use: `netstat -an | findstr 5000`
2. Install backend dependencies: `cd server && npm install`
3. Check server logs for error messages

### If frontend won't connect to backend:

1. Verify backend is running on port 5000
2. Check CORS settings in server/index.js
3. Verify API_BASE_URL in src/services/api.js

## Current Status

Your meeting editor will now:

- ✅ Save all text area content (blocks and tableData) to localStorage
- ✅ Show visual feedback about save status
- ✅ Work offline and sync when server is available
- ✅ Auto-save every 5 seconds
- ✅ Create backups before server operations

The data is being preserved even if the database is not running!
