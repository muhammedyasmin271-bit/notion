# Meeting Reports Feature Test

## Overview
This document outlines the testing steps for the new Meeting Reports feature that saves meeting data to the database and displays it in the Reports page.

## Features Implemented

### 1. Meeting Editor Updates
- ✅ Updated `handleSave` function to navigate to `/reports` after saving
- ✅ Changed button text to "Create & View Report" / "Save & View Report"
- ✅ Meeting data (including blocks and tableData) is saved to MongoDB

### 2. Reports Page Updates
- ✅ Added new "Meeting Reports" tab as the default tab
- ✅ Professional card layout for displaying meeting reports
- ✅ Shows meeting metadata (date, time, duration, attendees, status, type)
- ✅ Displays meeting notes preview
- ✅ Shows structured content blocks preview (headings, bullets, todos, etc.)
- ✅ Displays action items with completion status
- ✅ Meeting metrics (content blocks, actions done, participants, word count)
- ✅ Loading skeleton while data is being fetched
- ✅ Empty state with call-to-action button

## Testing Steps

### Prerequisites
1. Start the development environment:
   ```bash
   # Option 1: Use the batch file
   start-dev.bat
   
   # Option 2: Manual start
   # Terminal 1: Start MongoDB
   mongod --dbpath=C:\data\db
   
   # Terminal 2: Start Backend
   cd server && npm run dev
   
   # Terminal 3: Start Frontend
   npm start
   ```

2. Ensure you're logged in to the application

### Test Case 1: Create New Meeting and View Report
1. Navigate to Meeting Editor: `http://localhost:3000/meeting-editor/new`
2. Fill in meeting details:
   - Title: "Weekly Team Standup"
   - Type: "Standup"
   - Date: Today's date
   - Time: "10:00"
   - Duration: "30"
   - Add some attendees
3. Add structured content using blocks:
   - Add a heading: "# Meeting Agenda"
   - Add bullet points: "• Review last week's progress"
   - Add todo items: "☐ Plan next sprint"
   - Add some regular text content
4. Click "Create & View Report"
5. Verify:
   - Meeting is saved to database
   - User is redirected to Reports page
   - Meeting appears in the Meeting Reports tab
   - All content is displayed correctly in the professional card format

### Test Case 2: Edit Existing Meeting and View Report
1. Navigate to an existing meeting in Meeting Editor
2. Make changes to the content (add blocks, modify text, etc.)
3. Click "Save & View Report"
4. Verify:
   - Changes are saved to database
   - User is redirected to Reports page
   - Updated content is displayed in the report

### Test Case 3: Reports Page Display
1. Navigate directly to Reports page: `http://localhost:3000/reports`
2. Verify:
   - "Meeting Reports" tab is selected by default
   - All meetings are displayed in professional card format
   - Each card shows:
     - Meeting title, date, time, duration
     - Status and type badges
     - Notes preview (if available)
     - Structured content preview (blocks)
     - Action items with completion status
     - Metrics (blocks count, actions done, participants, word count)
     - Location (if specified)
     - Creation date

### Test Case 4: Empty State
1. If no meetings exist, verify:
   - Empty state message is displayed
   - "Create Your First Meeting" button is shown
   - Button redirects to meeting editor

### Test Case 5: Loading State
1. Refresh the Reports page
2. Verify loading skeleton is displayed while data is being fetched

## Expected Database Structure

The meeting should be saved with the following structure:
```json
{
  "_id": "ObjectId",
  "title": "Weekly Team Standup",
  "type": "Standup",
  "date": "2024-01-15T00:00:00.000Z",
  "time": "10:00",
  "duration": "30",
  "attendees": ["John Doe", "Jane Smith"],
  "notes": "# Meeting Agenda\n\n• Review last week's progress\n\n☐ Plan next sprint",
  "status": "Scheduled",
  "location": "",
  "blocks": [
    {
      "id": "block-1",
      "type": "heading1",
      "content": "Meeting Agenda",
      "style": {}
    },
    {
      "id": "block-2",
      "type": "bullet",
      "content": "• Review last week's progress",
      "style": {}
    },
    {
      "id": "block-3",
      "type": "todo",
      "content": "☐ Plan next sprint",
      "style": {}
    }
  ],
  "tableData": {},
  "createdBy": "ObjectId",
  "createdAt": "2024-01-15T10:00:00.000Z",
  "updatedAt": "2024-01-15T10:00:00.000Z"
}
```

## Troubleshooting

### Common Issues
1. **Server not starting**: Ensure MongoDB is running and ports 3000/5000 are available
2. **Database connection**: Check MongoDB connection string in server/.env
3. **Authentication**: Ensure you're logged in before creating meetings
4. **API errors**: Check browser console and server logs for error messages

### Debug Steps
1. Check browser console for JavaScript errors
2. Check Network tab for API request/response
3. Check server logs for backend errors
4. Verify MongoDB is running and accessible

## Success Criteria
- ✅ Meeting data is successfully saved to MongoDB database
- ✅ User is redirected to Reports page after saving
- ✅ Meeting reports are displayed in professional card format
- ✅ All meeting content (blocks, notes, metadata) is properly displayed
- ✅ Loading and empty states work correctly
- ✅ No console errors or API failures