const express = require('express');
const router = express.Router();
const Note = require('../models/Note');
const User = require('../models/User');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');

// @route   GET /api/notes
// @desc    Get all notes for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { category, search, isPinned, isArchived, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;

    let query = { author: req.user.id, deleted: false };

    // Apply filters
    if (category && category !== 'all') query.category = category;
    if (isPinned !== undefined) query.isPinned = isPinned === 'true';
    if (isArchived !== undefined) query.isArchived = isArchived === 'true';
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Build sort object
    let sort = {};
    if (sortBy === 'updatedAt') {
      sort.updatedAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'asc' ? 1 : -1;
    } else if (sortBy === 'title') {
      sort.title = sortOrder === 'asc' ? 1 : -1;
    }

    // Always show pinned notes first
    if (sortBy === 'updatedAt' || sortBy === 'createdAt') {
      sort.isPinned = -1;
    }

    const notes = await Note.find(query)
      .sort(sort)
      .populate('author', 'name email')
      .lean();

    res.json(notes);
  } catch (error) {
    console.error('Error fetching notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/:id
// @desc    Get note by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: false })
      .populate('author', 'name email')
      .populate('sharedWith.user', 'name email');

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note or has access
    if (note.author.toString() !== req.user.id &&
      !note.isPublic &&
      !note.sharedWith.some(share => share.user.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(note);
  } catch (error) {
    console.error('Error fetching note:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notes
// @desc    Create a new note
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, category, tags, isPublic } = req.body;

    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }

    const newNote = new Note({
      title,
      content,
      category: category || 'General',
      tags: tags || [],
      isPublic: isPublic || false,
      author: req.user.id
    });

    const note = await newNote.save();
    await note.populate('author', 'name email');

    res.status(201).json(note);
  } catch (error) {
    console.error('Error creating note:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/notes/:id
// @desc    Update a note
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, category, tags, isPublic } = req.body;

    let note = await Note.findOne({ _id: req.params.id, deleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create new version if content changed
    if (content && content !== note.content) {
      await note.createVersion(content, req.user.id);
    }

    // Update fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (category !== undefined) updateFields.category = category;
    if (tags !== undefined) updateFields.tags = tags;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;

    note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('author', 'name email');

    res.json(note);
  } catch (error) {
    console.error('Error updating note:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notes/:id
// @desc    Soft delete a note (move to trash)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Soft delete
    note.deleted = true;
    note.deletedAt = new Date();
    await note.save();

    res.json({ message: 'Note moved to trash' });
  } catch (error) {
    console.error('Error deleting note:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notes/:id/restore
// @desc    Restore a deleted note
// @access  Private
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: true });

    if (!note) {
      return res.status(404).json({ message: 'Deleted note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Restore
    note.deleted = false;
    note.deletedAt = undefined;
    await note.save();

    await note.populate('author', 'name email');
    res.json(note);
  } catch (error) {
    console.error('Error restoring note:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notes/:id/pin
// @desc    Toggle pin status of a note
// @access  Private
router.patch('/:id/pin', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await note.togglePin();
    await note.populate('author', 'name email');

    res.json(note);
  } catch (error) {
    console.error('Error toggling pin status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/notes/:id/archive
// @desc    Toggle archive status of a note
// @access  Private
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (note.isArchived) {
      await note.unarchive();
    } else {
      await note.archive();
    }

    await note.populate('author', 'name email');
    res.json(note);
  } catch (error) {
    console.error('Error toggling archive status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/notes/:id/share
// @desc    Share note with specific user groups
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { shareType } = req.body; // 'all-managers', 'all-users', 'all'

    if (!shareType || !['all-managers', 'all-users', 'all'].includes(shareType)) {
      return res.status(400).json({ message: 'Valid share type is required' });
    }

    const note = await Note.findOne({ _id: req.params.id, deleted: false });

    if (!note) {
      return res.status(404).json({ message: 'Note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    let usersToShareWith = [];

    if (shareType === 'all-managers') {
      usersToShareWith = await User.find({ role: 'manager', isActive: true });
    } else if (shareType === 'all-users') {
      usersToShareWith = await User.find({ role: 'user', isActive: true });
    } else if (shareType === 'all') {
      usersToShareWith = await User.find({ isActive: true });
    }

    // Add all users to sharedWith array
    const userIds = usersToShareWith.map(user => user._id);
    note.sharedWith = [...new Set([...note.sharedWith, ...userIds])];

    await note.save();

    const populatedNote = await Note.findById(note._id)
      .populate('author', 'name email')
      .populate('sharedWith', 'name email role');

    // Create notifications for recipients
    try {
      const notifications = userIds
        .filter(id => id.toString() !== req.user.id)
        .map(id => ({
          recipient: id,
          sender: req.user.id,
          type: 'note',
          title: 'A note was shared with you',
          message: populatedNote.title,
          entityType: 'Note',
          entityId: populatedNote._id
        }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifyErr) {
      console.error('Error creating note share notifications:', notifyErr);
    }

    res.json({
      message: `Note shared with ${shareType}`,
      note: populatedNote
    });
  } catch (error) {
    console.error('Error sharing note:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/notes/trash/all
// @desc    Get all deleted notes for user
// @access  Private
router.get('/trash/all', auth, async (req, res) => {
  try {
    const deletedNotes = await Note.find({
      author: req.user.id,
      deleted: true
    }).sort({ deletedAt: -1 });

    res.json(deletedNotes);
  } catch (error) {
    console.error('Error fetching deleted notes:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/notes/trash/:id
// @desc    Permanently delete a note from trash
// @access  Private
router.delete('/trash/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ _id: req.params.id, deleted: true });

    if (!note) {
      return res.status(404).json({ message: 'Deleted note not found' });
    }

    // Check if user owns the note
    if (note.author.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Permanent delete
    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: 'Note permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting note:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Note not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
