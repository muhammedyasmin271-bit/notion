const express = require('express');
const router = express.Router();
const MeetingNote = require('../models/MeetingNote');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @route   GET /api/meetings
// @desc    Get all meeting notes for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, type, search, sortBy = 'date', sortOrder = 'desc' } = req.query;
    
    let query = { createdBy: req.user.id, deleted: false };
    
    // Apply filters
    if (status && status !== 'all') query.status = status;
    if (type && type !== 'all') query.type = type;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { summary: { $regex: search, $options: 'i' } }
      ];
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
    
    const meetings = await MeetingNote.find(query)
      .sort(sort)
      .populate('createdBy', 'name email')
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
router.get('/:id', auth, async (req, res) => {
  try {
    const meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false })
      .populate('createdBy', 'name email')
      .populate('project', 'title description');
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    
    // Temporarily allow all authenticated users to access meetings
    // TODO: Implement proper authorization based on attendees and creators
    console.log('Meeting access:', {
      userId: req.user.id,
      userName: req.user.name,
      meetingId: meeting._id,
      meetingCreator: meeting.createdBy.toString()
    });
    
    res.json(meeting);
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
router.post('/', auth, async (req, res) => {
  try {
    const { 
      title, type, date, time, duration, attendees, notes, 
      actionItems, summary, location, meetingLink, agenda 
    } = req.body;
    
    // Validate required fields
    if (!title || !date || !time || !duration) {
      return res.status(400).json({ 
        message: 'Title, date, time, and duration are required' 
      });
    }
    
    const newMeeting = new MeetingNote({
      title,
      type: type || 'Team Sync',
      date,
      time,
      duration,
      attendees: attendees || [],
      notes: notes || '',
      actionItems: actionItems || [],
      summary: summary || '',
      location: location || '',
      meetingLink: meetingLink || '',
      agenda: agenda || [],
      createdBy: req.user.id
    });
    
    const meeting = await newMeeting.save();
    await meeting.populate('createdBy', 'name email');
    
    // Notify all managers and users
    try {
      const recipients = await User.find({ role: { $in: ['manager', 'user'] }, isActive: true }).select('_id');
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
      }
    } catch (notifyErr) {
      console.error('Error creating meeting notifications:', notifyErr);
    }

    res.status(201).json(meeting);
  } catch (error) {
    console.error('Error creating meeting:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/meetings/:id
// @desc    Update a meeting note
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { 
      title, type, date, time, duration, attendees, notes, 
      actionItems, summary, location, meetingLink, agenda, status 
    } = req.body;
    
    let meeting = await MeetingNote.findOne({ _id: req.params.id, deleted: false });
    
    if (!meeting) {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    
    // Check if user created the meeting
    if (meeting.createdBy.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (type !== undefined) updateFields.type = type;
    if (date !== undefined) updateFields.date = date;
    if (time !== undefined) updateFields.time = time;
    if (duration !== undefined) updateFields.duration = duration;
    if (attendees !== undefined) updateFields.attendees = attendees;
    if (notes !== undefined) updateFields.notes = notes;
    if (actionItems !== undefined) updateFields.actionItems = actionItems;
    if (summary !== undefined) updateFields.summary = summary;
    if (location !== undefined) updateFields.location = location;
    if (meetingLink !== undefined) updateFields.meetingLink = meetingLink;
    if (agenda !== undefined) updateFields.agenda = agenda;
    if (status !== undefined) updateFields.status = status;
    
    meeting = await MeetingNote.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');
    
    res.json(meeting);
  } catch (error) {
    console.error('Error updating meeting:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Meeting note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/meetings/:id
// @desc    Soft delete a meeting note (move to trash)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
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
router.patch('/:id/restore', auth, async (req, res) => {
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
router.patch('/:id/complete', auth, async (req, res) => {
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
router.post('/:id/action-items', auth, async (req, res) => {
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
router.patch('/:id/action-items/:actionItemId/complete', auth, async (req, res) => {
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
router.get('/trash/all', auth, async (req, res) => {
  try {
    const deletedMeetings = await MeetingNote.find({ 
      createdBy: req.user.id, 
      deleted: true 
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
router.delete('/trash/:id', auth, async (req, res) => {
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
