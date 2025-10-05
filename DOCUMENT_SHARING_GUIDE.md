# Document Sharing Functionality Guide

## Overview
The document sharing functionality has been implemented to allow managers to upload documents and share them with specific users or groups.

## Features Implemented

### 1. Manager Upload with Sharing
- **Title & Description**: Managers must provide a title and description for documents
- **File Upload**: Support for all file types (PDF, images, videos, Excel, Word, etc.)
- **Sharing Options**:
  - **All Users**: Share with everyone in the system
  - **All Managers**: Share with all managers only
  - **All Regular Users**: Share with all regular users only
  - **Specific Users**: Select individual users from a picker

### 2. User Picker for Specific Sharing
- Interactive user selection interface
- Shows user avatars, names, emails, and roles
- Multi-select functionality with visual feedback
- Real-time filtering of available users

### 3. Document Reception
- Users receive notifications when documents are shared with them
- Documents appear in their "Shared with Me" filter
- Clear indication of who shared the document
- Download and preview functionality

### 4. Document Management
- **Preview Modal**: View document details and attachments
- **Download**: Direct download of attached files
- **Sharing Info**: Shows who shared the document
- **File Type Icons**: Visual indicators for different file types

## How to Use

### For Managers:
1. Click "Upload Document" button
2. Fill in required title and optional description
3. Choose sharing option:
   - Leave "Send To" empty for personal document
   - Select "All Users", "All Managers", or "All Regular Users" for group sharing
   - Select "Specific Users" and pick individual recipients
4. Select file to upload
5. Click "Upload Document"

### For Users:
1. View all documents in "All Documents" tab
2. Filter to "Shared with Me" to see documents shared by others
3. Click eye icon to preview document
4. Click download icon to download attached files
5. See sharing information (who shared it) on document cards

## Technical Implementation

### Backend Changes:
- Enhanced `/api/documents` POST route to handle file uploads with sharing
- Added sharing logic for different recipient types
- Automatic notification creation for shared documents
- File storage in `/uploads` directory with proper URL generation

### Frontend Changes:
- Updated DocumentsPage with upload modal
- Added user picker component for specific sharing
- Enhanced document cards with sharing information
- Added preview modal for document viewing
- Improved file type detection and icons

### Database:
- Documents store sharing information in `sharedWith` and `collaborators` arrays
- Notifications created automatically when documents are shared
- File attachments stored with metadata (filename, size, type, URL)

## File Types Supported:
- **PDF**: Red icon, direct download
- **Images**: Purple icon, preview and download
- **Videos**: Pink icon, direct download
- **Excel/Spreadsheets**: Green icon, direct download
- **Documents**: Blue icon (default), direct download

## Security Features:
- Only managers can share documents with groups
- Regular users can only share with specific individuals
- File size limit: 25MB per file
- Proper authentication required for all operations
- Access control based on user roles

## Notifications:
- Recipients receive notifications when documents are shared
- Notification includes document title and sender name
- Notifications appear in the notifications panel
- Real-time updates when new documents are shared

## Usage Examples:

### Manager sharing with all users:
1. Upload document
2. Set "Send To" = "All Users"
3. All active users receive the document and notification

### Manager sharing with specific users:
1. Upload document
2. Set "Send To" = "Specific Users"
3. Use picker to select individual users
4. Only selected users receive the document and notification

### User receiving shared document:
1. Notification appears in notifications panel
2. Document appears in "Shared with Me" filter
3. Can preview and download the document
4. Sees who shared it on the document card

This implementation provides a complete document sharing workflow that meets the requirements for managers to upload and share documents with specific recipients, while ensuring users can properly receive and access shared documents.