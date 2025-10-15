const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { tenantFilter } = require('../middleware/tenantFilter');
const Notification = require('../models/Notification');

// Apply auth to all routes first, then tenant filtering
router.use(auth);
router.use(tenantFilter);

// @route   GET /api/notepad
// @desc    Get all notes for authenticated user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { category, search, isPinned, isArchived, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    let query = {
      $or: [
        { author: req.user.id },
        { sharedWith: { $elemMatch: { user: req.user.id } } },
        { isPublic: true }
      ],
      deleted: false
    };
    
    // Add company filter (skip for superadmin)
    if (req.user.role !== 'superadmin') {
      query.companyId = req.companyId;
    }

    if (category && category !== 'all') query.category = category;
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';
    if (search) {
      query.$and = query.$and || [];
      query.$and.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } }
        ]
      });
    }

    let sort = {};
    if (sortBy === 'updatedAt') {
      sort.updatedAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'title') {
      sort.title = sortOrder === 'asc' ? 1 : -1;
    }

    if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
      sort.isPinned = -1;
    }

    const notes = await Note.find(query)
      .sort(sort)
      .populate('author', 'name email username')
      .populate('sharedWith.user', 'name email username')
      .lean();

    const notesWithCreatedBy = notes.map(note => ({
      ...note,
      createdBy: note.author._id,
      createdByName: note.author.name || note.author.username || 'Unknown',
      canShare: req.user.role === 'manager' || req.user.role === 'admin',
      sharedWith: note.sharedWith.map(share => ({
        ...share,
        user: {
          ...share.user,
          name: share.user?.name || share.user?.username || 'Unknown User'
        }
      }))
    }));

    res.json(notesWithCreatedBy);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notepad/users
// @desc    Get all users for sharing (managers and admins only)
// @access  Private
router.get('/users', async (req, res) => {
  try {
    // Check if user is manager or admin
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only managers and admins can access user list for sharing' });
    }

    const userQuery = { 
      isActive: true, 
      _id: { $ne: req.user.id } 
    };
    if (req.user.role !== 'superadmin') {
      userQuery.companyId = req.companyId;
    }
    const users = await User.find(userQuery).select('name username email').lean();
    
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
// @desc    Share a note with users (managers and admins only)
// @access  Private
router.post('/:id/share', async (req, res) => {
  try {
    // Check if user is manager or admin
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only managers and admins can share notes' });
    }

    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'Please select users to share with' });
    }

    const note = await Note.findOne({ _id: req.params.id, deleted: false });
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Only the note author can share this note' });
    }

    // Handle both userIds and usernames
    let validUserIds = [];
    
    console.log('🔵 Sharing note with userIds:', userIds);
    console.log('🔵 CompanyId:', req.companyId);
    
    for (const identifier of userIds) {
      // Check if it's already a valid ObjectId
      if (identifier.match(/^[0-9a-fA-F]{24}$/)) {
        // Verify user exists and is in same company
        const userQuery = { _id: identifier, isActive: true };
        if (req.user.role !== 'superadmin') {
          userQuery.companyId = req.companyId;
        }
        const user = await User.findOne(userQuery).select('_id');
        if (user) {
          validUserIds.push(identifier);
        } else {
          console.warn('⚠️ User not found or not in same company:', identifier);
        }
      } else {
        // Try to find user by username, name, or email - ONLY in same company
        const userQuery = {
          $or: [
            { username: identifier },
            { name: identifier },
            { email: identifier }
          ],
          isActive: true
        };
        // Add company filter
        if (req.user.role !== 'superadmin') {
          userQuery.companyId = req.companyId;
        }
        
        const user = await User.findOne(userQuery).select('_id');
        
        if (user) {
          validUserIds.push(user._id.toString());
        } else {
          console.warn('⚠️ User not found in company:', identifier);
        }
      }
    }
    
    console.log('✅ Valid users to share with:', validUserIds.length);

    if (validUserIds.length === 0) {
      return res.status(400).json({ message: 'No valid users found to share with' });
    }

    // Add new shares
    const existingUserIds = note.sharedWith.map(share => share.user.toString());
    const newUserIds = validUserIds.filter(id => !existingUserIds.includes(id));
    
    const newShares = newUserIds.map(userId => ({
      user: userId,
      permission: 'read',
      sharedAt: new Date()
    }));

    note.sharedWith.push(...newShares);
    await note.save();
    
    // Create notifications for each newly shared user
    const noteAuthor = await User.findById(req.user.id).select('name username');
    const authorName = noteAuthor?.name || noteAuthor?.username || 'Someone';
    
    for (const userId of newUserIds) {
      try {
        const notification = new Notification({
          recipient: userId,
          sender: req.user.id,
          type: 'note',
          priority: 'normal',
          title: 'Note Shared With You',
          message: `${authorName} shared a note "${note.title}" with you`,
          entityType: 'Note',
          entityId: note._id,
          metadata: {
            noteTitle: note.title,
            noteId: note._id,
            sharedBy: req.user.id,
            sharedByName: authorName
          }
        });
        await notification.save();
        console.log(`✅ Notification created for user ${userId}`);
      } catch (notifError) {
        console.error(`❌ Failed to create notification for user ${userId}:`, notifError);
      }
    }
    
    res.json({ 
      success: true,
      message: `Note shared with ${newShares.length} user(s)`
    });
  } catch (error) {
    console.error('Error sharing note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notepad/:id
// @desc    Get note by ID
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: false })
      .populate('author', 'name email username')
      .populate('sharedWith.user', 'name email username');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author._id.toString() !== req.user.id &&
      !note.isPublic &&
      !note.sharedWith.some(share => share.user && share.user._id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const noteObj = note.toObject();
    noteObj.createdBy = note.author._id;
    noteObj.createdByName = note.author.name || note.author.username || 'Unknown';
    noteObj.canShare = req.user.role === 'manager' || req.user.role === 'admin';
    noteObj.sharedWith = noteObj.sharedWith.map(share => ({
      ...share,
      user: {
        ...share.user,
        name: share.user?.name || share.user?.username || 'Unknown User'
      }
    }));

    res.json(noteObj);
  } catch (error) {
    console.error('Error fetching note:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notepad
// @desc    Create a new note
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { title, content, blocks, category, tags, isPublic } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    if (!content && (!blocks || blocks.length === 0)) {
      return res.status(400).json({ message: 'Either content or blocks must be provided' });
    }

    const newNote = new Note({
      title,
      content: content || '',
      blocks: blocks || [],
      category: category || 'General',
      tags: tags || [],
      isPublic: isPublic || false,
      author: req.user.id,
      companyId: req.companyId
    });

    const note = await newNote.save();
    await note.populate('author', 'name email username');

    const noteWithCreatedBy = {
      ...note.toObject(),
      createdBy: note.author._id,
      createdByName: note.author.name || note.author.username || 'Unknown',
      canShare: req.user.role === 'manager' || req.user.role === 'admin'
    };

    res.status(201).json(noteWithCreatedBy);
  } catch (error) {
    console.error('Error creating note:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notepad/:id
// @desc    Update a note
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    const { title, content, blocks, category, tags, isPublic, sharedWith } = req.body;

    let note = await Note.findOne({ _id: req.params.id, deleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (content !== undefined) updateFields.content = content;
    if (blocks !== undefined) updateFields.blocks = blocks;
    if (category !== undefined) updateFields.category = category;
    if (tags !== undefined) updateFields.tags = tags;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (sharedWith !== undefined) {
      if (sharedWith.length > 0) {
        const userIds = sharedWith.map(share => share.user);
        const validUsers = await User.find({ _id: { $in: userIds }, isActive: true }).select('_id');
        const validUserIds = validUsers.map(u => u._id.toString());
        
        updateFields.sharedWith = sharedWith.filter(share => 
          validUserIds.includes(share.user.toString())
        );
      } else {
        updateFields.sharedWith = [];
      }
    }

    note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('author', 'name email username')
     .populate('sharedWith.user', 'name email username');

    const noteObj = note.toObject();
    noteObj.canShare = req.user.role === 'manager' || req.user.role === 'admin';
    noteObj.sharedWith = noteObj.sharedWith.map(share => ({
      ...share,
      user: {
        ...share.user,
        name: share.user?.name || share.user?.username || 'Unknown User'
      }
    }));

    res.json(noteObj);
  } catch (error) {
    console.error('Error updating note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notepad/:id
// @desc    Soft delete a note
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: false });
    
    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    note.deleted = true;
    note.deletedAt = new Date();
    await note.save();

    res.json({ message: 'Note deleted successfully' });
  } catch (error) {
    console.error('Error deleting note:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;