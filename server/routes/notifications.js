const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/notifications
// @desc    Get notifications for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { unreadOnly = 'false', limit = 50 } = req.query;
    const query = { recipient: req.user.id, deleted: false };
    if (unreadOnly === 'true') query.read = false;

    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.json(notifications);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.read = true;
    notification.readAt = new Date();
    await notification.save();

    res.json(notification);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.patch('/read-all', auth, async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, read: false }, {
      $set: { read: true, readAt: new Date() }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Soft delete a notification
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const notification = await Notification.findOne({ _id: req.params.id, recipient: req.user.id });
    if (!notification) return res.status(404).json({ message: 'Notification not found' });

    notification.deleted = true;
    notification.deletedAt = new Date();
    await notification.save();

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications
// @desc    Create a new notification
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { recipientId, type, title, message, entityType, entityId, metadata } = req.body;

    // Find recipient user
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: 'Recipient user not found' });
    }

    const notification = new Notification({
      recipient: recipientId,
      sender: req.user.id,
      type,
      title,
      message,
      entityType,
      entityId,
      metadata: metadata || {}
    });

    await notification.save();
    
    // Populate sender info for response
    await notification.populate('sender', 'name email');

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


