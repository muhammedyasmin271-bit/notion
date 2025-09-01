const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { Chat, Message } = require('../models/Chat');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @route   GET /api/chat
// @desc    Get all chats for the authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.findByUser(req.user.id)
      .populate('lastMessage')
      .populate('participants.user', 'name email avatar role')
      .sort({ lastActivity: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/chat/:id
// @desc    Get chat by ID with messages
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user.id,
      deleted: false
    }).populate('participants.user', 'name email avatar role');

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    // Get messages for this chat
    const messages = await Message.find({
      chat: req.params.id,
      isDeleted: false
    })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({ chat, messages: messages.reverse() });
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat
// @desc    Create a new chat (direct or group)
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { type, participants, name, description, isPrivate } = req.body;

    if (!type || !participants || participants.length === 0) {
      return res.status(400).json({ message: 'Type and participants are required' });
    }

    // Add current user to participants if not already included
    if (!participants.includes(req.user.id)) {
      participants.push(req.user.id);
    }

    // For direct chats, check if one already exists
    if (type === 'direct' && participants.length === 2) {
      const existingChat = await Chat.findDirectChat(participants[0], participants[1]);
      if (existingChat) {
        return res.json(existingChat);
      }
    }

    // For group chats, name is required
    if (type === 'group' && !name) {
      return res.status(400).json({ message: 'Group name is required' });
    }

    const chat = new Chat({
      type,
      participants: participants.map(userId => ({
        user: userId,
        role: userId === req.user.id ? 'admin' : 'member'
      })),
      name: type === 'group' ? name : undefined,
      description: type === 'group' ? description : undefined,
      isPrivate: isPrivate || false
    });

    await chat.save();
    
    const populatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'name email avatar role');

    res.json(populatedChat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/:id/messages
// @desc    Send a message to a chat
// @access  Private
router.post('/:id/messages', auth, async (req, res) => {
  try {
    const { content, messageType = 'text', attachments = [] } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    // Check if user is participant in the chat
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user.id,
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    const message = new Message({
      chat: req.params.id,
      sender: req.user.id,
      content,
      messageType,
      attachments
    });

    await message.save();

    // Update chat's last message and activity
    chat.lastMessage = message._id;
    chat.lastActivity = new Date();
    await chat.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar');

    // Create notifications for other participants (not the sender)
    try {
      const recipientParticipants = chat.participants.filter(p => p.user.toString() !== req.user.id);
      const notifications = recipientParticipants.map(p => ({
        recipient: p.user,
        sender: req.user.id,
        type: 'chat',
        title: 'New chat message',
        message: content,
        entityType: 'Chat',
        entityId: chat._id,
        metadata: { chatId: chat._id, messageId: message._id }
      }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifyErr) {
      console.error('Error creating chat notifications:', notifyErr);
    }

    res.json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/chat/:id/messages/:messageId
// @desc    Edit a message
// @access  Private
router.put('/:id/messages/:messageId', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const message = await Message.findOne({
      _id: req.params.messageId,
      chat: req.params.id,
      sender: req.user.id,
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    message.content = content;
    message.isEdited = true;
    message.editedAt = new Date();

    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate('sender', 'name email avatar');

    res.json(populatedMessage);
  } catch (error) {
    console.error('Error editing message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/:id/messages/:messageId
// @desc    Delete a message (soft delete)
// @access  Private
router.delete('/:id/messages/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      chat: req.params.id,
      $or: [
        { sender: req.user.id },
        { 'chat.participants.user': req.user.id, 'chat.participants.role': { $in: ['admin', 'moderator'] } }
      ],
      isDeleted: false
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    message.isDeleted = true;
    message.deletedAt = new Date();
    await message.save();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/chat/:id/participants
// @desc    Add participant to group chat
// @access  Private
router.post('/:id/participants', auth, async (req, res) => {
  try {
    const { userId, role = 'member' } = req.body;

    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user.id,
      'participants.role': { $in: ['admin', 'moderator'] },
      type: 'group',
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    await chat.addParticipant(userId, role);

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'name email avatar role');

    res.json(updatedChat);
  } catch (error) {
    console.error('Error adding participant:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/:id/participants/:userId
// @desc    Remove participant from group chat
// @access  Private
router.delete('/:id/participants/:userId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user.id,
      'participants.role': { $in: ['admin', 'moderator'] },
      type: 'group',
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    await chat.removeParticipant(req.params.userId);

    const updatedChat = await Chat.findById(chat._id)
      .populate('participants.user', 'name email avatar role');

    res.json(updatedChat);
  } catch (error) {
    console.error('Error removing participant:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/chat/:id/archive
// @desc    Archive/unarchive a chat
// @access  Private
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user.id,
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    chat.isArchived = !chat.isArchived;
    await chat.save();

    res.json(chat);
  } catch (error) {
    console.error('Error archiving chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/chat/:id
// @desc    Soft delete a chat
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.id,
      'participants.user': req.user.id,
      'participants.role': 'admin',
      deleted: false
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found or access denied' });
    }

    await chat.softDelete();

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
