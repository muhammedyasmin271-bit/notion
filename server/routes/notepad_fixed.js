const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const auth = require('../middleware/auth');

// @route   GET /api/notepad/users
// @desc    Get all users for sharing
// @access  Private
router.get('/users', auth, async (req, res) => {
  try {
    const users = await User.find({ 
      isActive: true, 
      _id: { $ne: req.user.id } 
    }).select('name username email').lean();
    
    const usersWithFallback = users.map(user => ({
      ...user,
      name: user.name || user.username || 'Unknown User'
    }));
    
    res.json(usersWithFallback);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notepad/:id/share
// @desc    Share a note with selected users (NO ROLE RESTRICTION)
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    console.log('=== SHARE ENDPOINT HIT ===');
    console.log('Note ID:', req.params.id);
    console.log('Request body:', req.body);
    console.log('User ID:', req.user.id);
    console.log('User role:', req.user.role);
    
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      console.log('No userIds provided or invalid format');
      return res.status(400).json({ message: 'Please select users to share with' });
    }
    
    console.log('UserIds to share with:', userIds);

    const note = await Note.findOne({ _id: req.params.id, deleted: false });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Allow ANY user to share their own notes (removed role restriction)
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the note author can share this note' });
    }

    // Validate users exist
    const validUsers = await User.find({ 
      _id: { $in: userIds }, 
      isActive: true 
    }).select('_id');

    if (validUsers.length === 0) {
      return res.status(400).json({ message: 'No valid users found' });
    }

    // Add new shares
    const existingUserIds = note.sharedWith.map(share => share.user.toString());
    const newUserIds = validUsers
      .map(u => u._id.toString())
      .filter(id => !existingUserIds.includes(id));
    
    const newShares = newUserIds.map(userId => ({
      user: userId,
      permission: 'read',
      sharedAt: new Date()
    }));

    note.sharedWith.push(...newShares);
    await note.save();

    console.log('Share successful! Shared with', newShares.length, 'users');
    
    res.json({ 
      success: true,
      message: `Note shared with ${newShares.length} user(s)`
    });
  } catch (error) {
    console.error('=== SHARE ERROR ===');
    console.error('Error sharing note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;