const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendNotificationEmail } = require('../services/emailService');
const { sendNotificationSMS, getSMSUsage, validatePhoneNumber } = require('../services/smsService');

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

    // Send email notification if user has email notifications enabled
    if (recipient.email && recipient.preferences?.notifications?.email !== false) {
      try {
        const emailResult = await sendNotificationEmail(recipient, notification);
        notification.emailStatus = {
          sent: emailResult.success,
          sid: emailResult.messageId,
          error: emailResult.error || emailResult.message,
          sentAt: emailResult.success ? new Date() : undefined
        };
        await notification.save();
      } catch (emailError) {
        console.error('Error sending email notification:', emailError);
        // Don't fail the request if email fails
      }
    }

    // Send SMS notification if user has SMS notifications enabled
    if (recipient.phone && recipient.preferences?.notifications?.sms === true) {
      try {
        const smsResult = await sendNotificationSMS(recipient, notification);
        notification.smsStatus = {
          sent: smsResult.success,
          sid: smsResult.sid,
          error: smsResult.message,
          sentAt: smsResult.success ? new Date() : undefined
        };
        await notification.save();
      } catch (smsError) {
        console.error('Error sending SMS notification:', smsError);
        // Don't fail the request if SMS fails
      }
    }

    res.status(201).json(notification);
  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/test-email
// @desc    Send a test email notification
// @access  Private
router.post('/test-email', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.email) {
      return res.status(400).json({ message: 'No email configured for your account' });
    }

    const testNotification = {
      type: 'system',
      title: 'Test Email Notification',
      message: 'This is a test email notification from Notion App. If you received this, email notifications are working correctly!',
    };

    const result = await sendNotificationEmail(user, testNotification);
    
    if (result.success) {
      res.json({ message: 'Test email sent successfully', email: user.email });
    } else {
      res.status(500).json({ message: 'Failed to send test email', error: result.message });
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notifications/email-settings
// @desc    Update email notification preferences
// @access  Private
router.patch('/email-settings', auth, async (req, res) => {
  try {
    const { emailNotifications } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update email notification preference
    if (!user.preferences) {
      user.preferences = { notifications: {} };
    }
    if (!user.preferences.notifications) {
      user.preferences.notifications = {};
    }
    
    user.preferences.notifications.email = emailNotifications;
    user.markModified('preferences');
    await user.save();

    res.json({ 
      message: 'Email notification settings updated',
      emailNotifications: user.preferences.notifications.email
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/test-sms
// @desc    Send a test SMS notification
// @access  Private
router.post('/test-sms', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user.phone) {
      return res.status(400).json({ message: 'No phone number configured for your account' });
    }

    const testNotification = {
      type: 'system',
      title: 'Test SMS Notification',
      message: 'This is a test SMS from Notion App. SMS notifications are working!',
    };

    const result = await sendNotificationSMS(user, testNotification);
    
    if (result.success) {
      res.json({ message: 'Test SMS sent successfully', phone: user.phone });
    } else {
      res.status(500).json({ message: 'Failed to send test SMS', error: result.message });
    }
  } catch (error) {
    console.error('Error sending test SMS:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notifications/sms-settings
// @desc    Update SMS notification preferences
// @access  Private
router.patch('/sms-settings', auth, async (req, res) => {
  try {
    const { smsNotifications } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update SMS notification preference
    if (!user.preferences) {
      user.preferences = { notifications: {} };
    }
    if (!user.preferences.notifications) {
      user.preferences.notifications = {};
    }
    
    user.preferences.notifications.sms = smsNotifications;
    user.markModified('preferences');
    await user.save();

    res.json({ 
      message: 'SMS notification settings updated',
      smsNotifications: user.preferences.notifications.sms
    });
  } catch (error) {
    console.error('Error updating SMS settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notifications/sms-usage
// @desc    Get SMS usage statistics
// @access  Private
router.get('/sms-usage', auth, async (req, res) => {
  try {
    const usage = getSMSUsage(req.user.id);
    res.json(usage);
  } catch (error) {
    console.error('Error fetching SMS usage:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notifications/quiet-hours
// @desc    Update quiet hours settings
// @access  Private
router.patch('/quiet-hours', auth, async (req, res) => {
  try {
    const { enabled, start, end } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update quiet hours settings
    if (!user.preferences) {
      user.preferences = {};
    }
    if (!user.preferences.quietHours) {
      user.preferences.quietHours = {};
    }
    
    if (enabled !== undefined) user.preferences.quietHours.enabled = enabled;
    if (start) user.preferences.quietHours.start = start;
    if (end) user.preferences.quietHours.end = end;
    
    user.markModified('preferences');
    await user.save();

    res.json({ 
      message: 'Quiet hours settings updated',
      quietHours: user.preferences.quietHours
    });
  } catch (error) {
    console.error('Error updating quiet hours:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notifications/validate-phone
// @desc    Validate phone number format
// @access  Private
router.post('/validate-phone', auth, async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !phone.trim()) {
      return res.json({ valid: false, message: 'Phone number is required' });
    }
    
    const cleanedPhone = phone.replace(/[\s\-()]/g, '');
    
    // Validate Ethiopian format: 09XXXXXXXX (10 digits starting with 09)
    // Or international: +251XXXXXXXXX or 251XXXXXXXXX
    const ethiopianFormat = /^09\d{8}$/;
    const internationalFormat = /^(\+?251)9\d{8}$/;
    
    const isValid = ethiopianFormat.test(cleanedPhone) || internationalFormat.test(cleanedPhone);
    
    res.json({ 
      valid: isValid,
      message: isValid ? 'Phone number is valid' : 'Invalid phone number format. Use Ethiopian format (0912345678)'
    });
  } catch (error) {
    console.error('Error validating phone number:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;


