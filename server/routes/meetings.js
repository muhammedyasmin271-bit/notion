const express = require('express');
const router = express.Router();
const MeetingNote = require('../models/MeetingNote');
const auth = require('../middleware/auth');
const { tenantFilter } = require('../middleware/tenantFilter');
const User = require('../models/User');
const Notification = require('../models/Notification');
const emailService = require('../services/emailService');
const { sendNotificationSMS } = require('../services/smsService');

// Apply auth to all routes first, then tenant filtering
router.use(auth);
router.use(tenantFilter);

// @route   GET /api/meetings/stats
// @desc    Get meeting statistics for dashboard cards
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all meetings for user in their company
    const allMeetings = await MeetingNote.find({ 
      createdBy: userId, 
      deleted: false,
      companyId: req.companyId 
    });

    // Calculate statistics
    const totalMeetings = allMeetings.length;
    const completedMeetings = allMeetings.filter(m => m.status === 'completed').length;
    const scheduledMeetings = allMeetings.filter(m => m.status === 'scheduled').length;

    // Calculate action items statistics
    let totalActionItems = 0;
    let completedActionItems = 0;

    allMeetings.forEach(meeting => {
      if (meeting.actionItems && meeting.actionItems.length > 0) {
        totalActionItems += meeting.actionItems.length;
        completedActionItems += meeting.actionItems.filter(item => item.completed).length;
      }
    });

    const actionItemsCompletionRate = totalActionItems > 0
      ? Math.round((completedActionItems / totalActionItems) * 100)
      : 0;

    const stats = {
      totalMeetings,
      completedMeetings,
      scheduledMeetings,
      scheduledPercentage: totalMeetings > 0 ? Math.round((scheduledMeetings / totalMeetings) * 100) : 0,
      actionItemsCompletionRate,
      totalActionItems,
      completedActionItems
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching meeting stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meetings
// @desc    Get all meeting notes for authenticated user (created by user or shared with user)
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { status, type, search, sortBy = 'date', sortOrder = 'desc' } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    // New visibility logic:
    // - No participants: Only owner can see
    // - Has participants: Owner + participants + admin can see
    let query = {
      $or: [
        { createdBy: userId }, // Owner can always see their meetings
        { 'sharedWith.user': userId } // Participants can see meetings shared with them
      ],
      deleted: false
    };

    // If user is admin, they can also see meetings that have participants
    if (userRole === 'admin') {
      query.$or.push({
        'sharedWith.0': { $exists: true } // Has at least one participant
      });
    }

    // Apply filters
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (search) {
      // Preserve visibility logic while adding search filters
      const searchConditions = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
      
      // Combine visibility conditions with search conditions
      query.$and = [
        { $or: query.$or }, // Keep our visibility logic
        { $or: searchConditions } // Add search conditions
      ];
      delete query.$or; // Remove the original $or since we're using $and now
    }

    // Build sort object
    let sort = {};
    if (sortBy === 'date') {
      sort.date = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'time') {
      sort.time = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    }

    // Add company filter
    if (req.user.role !== 'superadmin') {
      query.companyId = req.companyId;
    }
    
    const meetings = await MeetingNote.find(query)
      .sort(sort)
      .populate('createdBy', 'name email')
      .populate('sharedWith.user', 'name email')
      .lean();

    res.json(meetings);
  } catch (error) {
    console.error('Error fetching meetings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meetings/:id
// @desc    Get meeting note by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false })
      .populate('createdBy', 'name email')
      .populate('sharedWith.user', 'name email')
      .populate('project', 'title description');

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }

    // Check if user has access (creator, shared with, or admin with participants)
    const isCreator = meeting.createdBy._id.toString() === req.user.id;
    const sharedAccess = meeting.sharedWith.find(share => share.user && share.user._id.toString() === req.user.id);
    const isAdmin = req.user.role === 'admin';
    const hasParticipants = meeting.sharedWith && meeting.sharedWith.length > 0;

    // Access rules:
    // - Creator can always access
    // - Participants can access if shared with them
    // - Admin can access if meeting has participants
    const hasAccess = isCreator || sharedAccess || (isAdmin && hasParticipants);

    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized to access this meeting' });
    }

    // Add permission info to response
    const meetingObj = meeting.toObject();
    meetingObj.canEdit = isCreator;
    meetingObj.permission = isCreator ? 'write' : (sharedAccess?.permission || 'read');

    // Ensure blocks and tableData are properly returned
    meetingObj.blocks = meetingObj.blocks || [];
    meetingObj.tableData = meetingObj.tableData || {};

    res.json(meetingObj);
  } catch (error) {
    console.error('Error fetching meeting:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/meetings
// @desc    Create a new meeting note
// @access  Private
router.post('/', async (req, res) => {
  try {
    const {
      title, type, date, time, duration, attendees, notes,
      actionItems, summary, location, meetingLink, agenda,
      blocks, tableData, status
    } = req.body;

    // Set defaults for missing fields
    const meetingDate = date || new Date().toISOString();
    const meetingTime = time || '09:00';
    const meetingDuration = duration || '30';
    const meetingStatus = status || 'Scheduled';

    // Convert attendee names to user IDs for sharing
    let sharedWithUsers = [];
    if (attendees && attendees.length > 0) {
      try {
        // Find users by name or username - ONLY from same company
        const userQuery = {
          $or: [
            { name: { $in: attendees } },
            { username: { $in: attendees } }
          ],
          isActive: true,
          _id: { $ne: req.user.id }
        };
        // Add company filter
        if (req.user.role !== 'superadmin') {
          userQuery.companyId = req.companyId;
        }
        
        const users = await User.find(userQuery).select('_id name username');

        sharedWithUsers = users.map(user => ({
          user: user._id,
          permission: 'read',
          sharedAt: new Date()
        }));

        console.log('✅ Found users for sharing in company:', users.map(u => ({ id: u._id, name: u.name, username: u.username })));
      } catch (err) {
        console.error('Error finding users for sharing:', err);
      }
    }

    const newMeeting = new MeetingNote({
      title: title || 'Untitled Meeting',
      type: type || 'Team Sync',
      date: meetingDate,
      time: meetingTime,
      duration: meetingDuration,
      attendees: attendees || [],
      notes: notes || '',
      actionItems: actionItems || [],
      summary: summary || '',
      location: location || '',
      companyId: req.companyId,
      meetingLink: meetingLink || '',
      agenda: agenda || [],
      blocks: blocks || [],
      tableData: tableData || {},
      status: meetingStatus,
      createdBy: req.user.id,
      sharedWith: sharedWithUsers
    });

    const meeting = await newMeeting.save();
    await meeting.populate('createdBy', 'name email');

    // Notify all managers and users IN THE SAME COMPANY
    try {
      const recipientQuery = { role: { $in: ['manager', 'user'] }, isActive: true };
      // Filter by company
      if (req.user.role !== 'superadmin') {
        recipientQuery.companyId = req.companyId;
      }
      
      const recipients = await User.find(recipientQuery).select('_id phone preferences');
      console.log('🔵 Notifying users in company:', recipients.length);
      const notifications = recipients.map(r => ({
        recipient: r._id,
        sender: req.user.id,
        type: 'meeting',
        title: 'New meeting scheduled',
        message: `${title} on ${date} at ${time}`,
        entityType: 'MeetingNote',
        entityId: meeting._id,
        metadata: { date, time, duration }
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
        
        // Send SMS notifications to users with SMS enabled
        for (const recipient of recipients) {
          if (recipient.phone && recipient.preferences?.notifications?.sms === true) {
            const smsNotification = {
              title: 'New Meeting Scheduled',
              message: `${title}\nDate: ${new Date(date).toLocaleDateString()}\nTime: ${time}`
            };
            await sendNotificationSMS(recipient, smsNotification);
          }
        }
      }
    } catch (notifyErr) {
      console.error('Error creating meeting notifications:', notifyErr);
    }

    // Send email and SMS notifications to attendees
    try {
      if (sharedWithUsers && sharedWithUsers.length > 0) {
        const attendeeIds = sharedWithUsers.map(u => u.user);
        const attendeeUsers = await User.find({
          _id: { $in: attendeeIds }
        }).select('name email phone preferences');

        for (const user of attendeeUsers) {
          // Send email notification
          if (user.email && user.preferences?.notifications?.email !== false) {
            await emailService.sendMeetingInvitationEmail(user, {
              title: meeting.title,
              date: meeting.date,
              time: meeting.time,
              agenda: Array.isArray(meeting.agenda) && meeting.agenda.length > 0 
                ? meeting.agenda.map(a => a.topic || a).join(', ') 
                : meeting.notes || 'No agenda provided'
            }, req.user);
          }
          
          // Send SMS notification
          if (user.phone && user.preferences?.notifications?.sms === true) {
            const smsNotification = {
              title: `Meeting Invitation: ${meeting.title}`,
              message: `Date: ${new Date(meeting.date).toLocaleDateString()}\nTime: ${meeting.time}\nDuration: ${meeting.duration} minutes`
            };
            await sendNotificationSMS(user, smsNotification);
          }
        }
      }

      // Also notify all managers
      const managers = await User.find({
        role: { $in: ['manager', 'admin'] },
        emailNotifications: true,
        _id: { $ne: req.user.id }
      }).select('name email');

      for (const manager of managers) {
        if (manager.email) {
          await emailService.sendEmail({
            to: manager.email,
            subject: `New Meeting Scheduled: ${meeting.title}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">📅 New Meeting Scheduled</h2>
                <p>Hello ${manager.name},</p>
                <p><strong>${req.user.name}</strong> scheduled a new meeting:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">${meeting.title}</h3>
                  <p><strong>Date:</strong> ${new Date(meeting.date).toLocaleDateString()}</p>
                  <p><strong>Time:</strong> ${meeting.time}</p>
                  <p><strong>Duration:</strong> ${meeting.duration} minutes</p>
                  ${meeting.location ? `<p><strong>Location:</strong> ${meeting.location}</p>` : ''}
                  ${attendees && attendees.length > 0 ? `<p><strong>Attendees:</strong> ${attendees.join(', ')}</p>` : ''}
                </div>
                <p>Best regards,<br>Notion App Team</p>
              </div>
            `
          });
        }
      }
    } catch (emailError) {
      console.error('Error sending meeting email notifications:', emailError.message);
    }

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   PUT /api/meetings/:id
// @desc    Update a meeting note
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }

    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Update meeting with proper validation
    Object.keys(req.body).forEach(key => {
      // Only update specific fields to prevent unauthorized changes
      if (['title', 'type', 'date', 'time', 'duration', 'attendees', 'notes', 'actionItems', 'summary', 'location', 'meetingLink', 'agenda', 'blocks', 'tableData', 'status'].includes(key)) {
        meeting[key] = req.body[key];
      }
    });

    // Handle attendees updates - convert attendee names to user IDs for sharing
    if (req.body.attendees && Array.isArray(req.body.attendees)) {
      try {
        // Find users by name or username to handle both cases
        const users = await User.find({
          $or: [
            { name: { $in: req.body.attendees } },
            { username: { $in: req.body.attendees } }
          ],
          isActive: true,
          _id: { $ne: req.user.id }
        }).select('_id name username');

        meeting.sharedWith = users.map(user => ({
          user: user._id,
          permission: 'read',
          sharedAt: new Date()
        }));

        console.log('Updated shared users for meeting:', users.map(u => ({ id: u._id, name: u.name, username: u.username })));
      } catch (err) {
        console.error('Error updating shared users for meeting:', err);
      }
    }

    const updatedMeeting = await meeting.save({ runValidators: true });

    await updatedMeeting.populate('createdBy', 'name email');
    res.json(updatedMeeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: error.message || 'Server error' });
  }
});

// @route   DELETE /api/meetings/:id
// @desc    Soft delete a meeting note (move to trash)
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }

    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Soft delete
    meeting.deleted = true;
    meeting.deletedAt = new Date();
    await meeting.save();

    res.json({ message: 'Meeting note moved to trash' });
  } catch (error) {
    console.error('Error deleting meeting:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/meetings/:id/restore
// @desc    Restore a deleted meeting note
// @access  Private
router.patch('/:id/restore', async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: true });

    if (!meeting) {
      return res.status(404).json({ message: 'Deleted meeting note not found' });
    }

    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Restore
    meeting.deleted = false;
    meeting.deletedAt = undefined;
    await meeting.save();

    await meeting.populate('createdBy', 'name email');
    res.json(meeting);
  } catch (error) {
    console.error('Error restoring meeting:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/meetings/:id/complete
// @desc    Mark meeting as complete
// @access  Private
router.patch('/:id/complete', async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }

    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await meeting.markComplete();
    await meeting.populate('createdBy', 'name email');

    res.json(meeting);
  } catch (error) {
    console.error('Error completing meeting:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/meetings/:id/action-items
// @desc    Add action item to meeting
// @access  Private
router.post('/:id/action-items', async (req, res) => {
  try {
    const { description, assignee, dueDate } = req.body;

    if (!description) {
      return res.status(400).json({ message: 'Action item description is required' });
    }

    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }

    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const actionItem = {
      description,
      assignee: assignee || '',
      dueDate: dueDate || null
    };

    await meeting.addActionItem(actionItem);
    await meeting.populate('createdBy', 'name email');

    res.json(meeting);
  } catch (error) {
    console.error('Error adding action item:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/meetings/:id/action-items/:actionItemId/complete
// @desc    Mark action item as complete
// @access  Private
router.patch('/:id/action-items/:actionItemId/complete', async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false });

    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }

    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await meeting.completeActionItem(req.params.actionItemId);
    await meeting.populate('createdBy', 'name email');

    res.json(meeting);
  } catch (error) {
    console.error('Error completing action item:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/meetings/trash/all
// @desc    Get all deleted meeting notes for user
// @access  Private
router.get('/trash/all', async (req, res) => {
  try {
    const deletedMeetings = await MeetingNote.find({
      createdBy: req.user.id,
      deleted: true,
      companyId: req.companyId
    }).sort({ deletedAt: -1 });

    res.json(deletedMeetings);
  } catch (error) {
    console.error('Error fetching deleted meetings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/meetings/trash/:id
// @desc    Permanently delete a meeting note from trash
// @access  Private
router.delete('/trash/:id', async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: true });

    if (!meeting) {
      return res.status(404).json({ message: 'Deleted meeting note not found' });
    }

    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Permanent delete
    await MeetingNote.findByIdAndDelete(req.params.id);

    res.json({ message: 'Meeting note permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting meeting:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;