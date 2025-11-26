const express = require('express');
const router = express.Router();
const ContactMessage = require('../models/ContactMessage');
const auth = require('../middleware/auth');

// Public route - submit contact form
router.post('/submit', async (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        message: 'Name, email, and message are required' 
      });
    }

    // Create contact message
    const contactMessage = new ContactMessage({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone ? phone.trim() : '',
      message: message.trim(),
      status: 'new'
    });

    await contactMessage.save();

    res.status(201).json({
      message: 'Thank you for contacting us! We will get back to you soon.',
      success: true
    });
  } catch (error) {
    console.error('Error saving contact message:', error);
    res.status(500).json({ 
      message: 'Failed to submit message. Please try again.',
      error: error.message 
    });
  }
});

// Super admin route - get all contact messages
router.get('/messages', auth, async (req, res) => {
  try {
    // Check if user is super admin
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const { status, page = 1, limit = 50 } = req.query;
    const query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const messages = await ContactMessage.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await ContactMessage.countDocuments(query);

    res.json({
      messages,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / parseInt(limit))
    });
  } catch (error) {
    console.error('Error fetching contact messages:', error);
    res.status(500).json({ message: 'Failed to fetch messages', error: error.message });
  }
});

// Super admin route - get single message
router.get('/messages/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const message = await ContactMessage.findById(req.params.id);
    
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error fetching contact message:', error);
    res.status(500).json({ message: 'Failed to fetch message', error: error.message });
  }
});

// Super admin route - update message status
router.patch('/messages/:id/status', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const { status } = req.body;
    
    if (!['new', 'read', 'replied', 'archived'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const updateData = { status };
    
    if (status === 'read' && !req.body.readAt) {
      updateData.readAt = new Date();
    }
    
    if (status === 'replied') {
      updateData.repliedAt = new Date();
    }

    const message = await ContactMessage.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json(message);
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ message: 'Failed to update message', error: error.message });
  }
});

// Super admin route - delete message
router.delete('/messages/:id', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Super admin access required' });
    }

    const message = await ContactMessage.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Failed to delete message', error: error.message });
  }
});

module.exports = router;

