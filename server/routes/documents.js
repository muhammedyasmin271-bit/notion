const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup Multer storage for attachments (top-level)
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Helpers
function isOwnerOrManager(req, document) {
  if (!req.user) return false;
  const isOwner = document.author && document.author.toString() === req.user.id;
  const isMgr = ['manager', 'admin'].includes(req.user.role);
  return isOwner || isMgr;
}

// @route   GET /api/documents
// @desc    Get all documents for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { type, category, status, search, sortBy = 'updatedAt', sortOrder = 'desc' } = req.query;
    const userId = req.user.id;

    // Visibility: documents the user can see
    const visibilityOr = [
      { author: userId, deleted: false },
      { isPublic: true, deleted: false },
      { 'collaborators.user': userId, deleted: false },
      { sharedWith: userId, deleted: false },
    ];

    const andFilters = [{ $or: visibilityOr }];

    // Apply additional filters
    if (type && type !== 'all') andFilters.push({ type });
    if (category && category !== 'all') andFilters.push({ category });
    if (status && status !== 'all') andFilters.push({ status });
    if (search) {
      andFilters.push({
        $or: [
          { title: { $regex: search, $options: 'i' } },
          { content: { $regex: search, $options: 'i' } },
          { tags: { $in: [new RegExp(search, 'i')] } },
        ],
      });
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

    const documents = await Document.find({ $and: andFilters })
      .sort(sort)
      .populate('author', 'name email')
      .populate('collaborators.user', 'name email')
      .lean();

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/trash/all
// @desc    Get all deleted documents for user
// @access  Private
router.get('/trash/all', auth, async (req, res) => {
  try {
    const deletedDocuments = await Document.find({ 
      author: req.user.id, 
      deleted: true 
    }).sort({ deletedAt: -1 });
    
    res.json(deletedDocuments);
  } catch (error) {
    console.error('Error fetching deleted documents:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/documents/:id/attachments
// @desc    Upload an attachment for a document
// @access  Private
router.post('/:id/attachments', auth, upload.single('file'), async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, deleted: false });

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Allow owner or manager/admin to upload
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      uploadedBy: req.user.id,
      uploadedAt: new Date()
    };

    document.attachments.push(attachment);
    await document.save();

    res.status(201).json({
      message: 'Attachment uploaded successfully',
      attachment
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/documents/:id
// @desc    Get document by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, deleted: false })
      .populate('author', 'name email')
      .populate('collaborators.user', 'name email')
      .populate('reviewHistory.reviewer', 'name email');
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user owns the document or has access
    if (document.author.toString() !== req.user.id && 
        !document.isPublic && 
        !document.collaborators.some(collab => collab.user.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(document);
  } catch (error) {
    console.error('Error fetching document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/documents
// @desc    Create a new document
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { title, content, type, category, tags, isPublic, isTemplate } = req.body;
    
    // Validate required fields
    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required' });
    }
    
    const newDocument = new Document({
      title,
      content,
      type: type || 'Document',
      category: category || 'General',
      tags: tags || [],
      isPublic: isPublic || false,
      isTemplate: isTemplate || false,
      author: req.user.id
    });
    
    const document = await newDocument.save();
    await document.populate('author', 'name email');
    
    res.status(201).json(document);
  } catch (error) {
    console.error('Error creating document:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/documents/:id
// @desc    Update a document
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, type, category, tags, isPublic, isTemplate, status } = req.body;
    
    let document = await Document.findOne({ _id: req.params.id, deleted: false });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Allow owner or manager/admin to update
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Create new version if content changed
    if (content && content !== document.content) {
      await document.createVersion(content, req.user.id);
    }
    
    // Update fields
    const updateFields = {};
    if (title !== undefined) updateFields.title = title;
    if (type !== undefined) updateFields.type = type;
    if (category !== undefined) updateFields.category = category;
    if (tags !== undefined) updateFields.tags = tags;
    if (isPublic !== undefined) updateFields.isPublic = isPublic;
    if (isTemplate !== undefined) updateFields.isTemplate = isTemplate;
    if (status !== undefined) updateFields.status = status;
    
    document = await Document.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('author', 'name email');
    
    res.json(document);
  } catch (error) {
    console.error('Error updating document:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id
// @desc    Soft delete a document (move to trash)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, deleted: false });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Allow owner or manager/admin to delete (soft delete)
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Soft delete
    document.deleted = true;
    document.deletedAt = new Date();
    await document.save();
    
    res.json({ message: 'Document moved to trash' });
  } catch (error) {
    console.error('Error deleting document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/documents/:id/restore
// @desc    Restore a deleted document
// @access  Private
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, deleted: true });
    
    if (!document) {
      return res.status(404).json({ message: 'Deleted document not found' });
    }
    
    // Allow owner or manager/admin to restore
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Restore
    document.deleted = false;
    document.deletedAt = undefined;
    await document.save();
    
    await document.populate('author', 'name email');
    res.json(document);
  } catch (error) {
    console.error('Error restoring document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/documents/:id/archive
// @desc    Toggle archive status of a document
// @access  Private
router.patch('/:id/archive', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, deleted: false });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Allow owner or manager/admin to toggle archive
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    if (document.isArchived) {
      await document.unarchive();
    } else {
      await document.archive();
    }
    
    await document.populate('author', 'name email');
    res.json(document);
  } catch (error) {
    console.error('Error toggling archive status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/documents/:id/collaborators
// @desc    Add collaborator to document
// @access  Private
router.post('/:id/collaborators', auth, async (req, res) => {
  try {
    const { userId, role = 'Viewer' } = req.body;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    const document = await Document.findOne({ _id: req.params.id, deleted: false });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Allow owner or manager/admin to manage collaborators
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await document.addCollaborator(userId, role);
    await document.populate('author', 'name email');
    await document.populate('collaborators.user', 'name email');
    
    res.json(document);
  } catch (error) {
    console.error('Error adding collaborator:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/documents/:id/collaborators/:collaboratorId
// @desc    Remove collaborator from document
// @access  Private
router.delete('/:id/collaborators/:collaboratorId', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, deleted: false });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Allow owner or manager/admin to remove collaborators
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await document.removeCollaborator(req.params.collaboratorId);
    await document.populate('author', 'name email');
    await document.populate('collaborators.user', 'name email');
    
    res.json(document);
  } catch (error) {
    console.error('Error removing collaborator:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/documents/:id/review
// @desc    Add review to document
// @access  Private
router.post('/:id/review', auth, async (req, res) => {
  try {
    const { status, comments } = req.body;
    
    if (!status) {
      return res.status(400).json({ message: 'Review status is required' });
    }
    
    const document = await Document.findOne({ _id: req.params.id, deleted: false });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user owns the document or is a collaborator
    if (document.author.toString() !== req.user.id && 
        !document.collaborators.some(collab => collab.user.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    document.reviewHistory.push({
      reviewer: req.user.id,
      status,
      comments: comments || '',
      reviewedAt: new Date()
    });
    
    await document.save();
    await document.populate('author', 'name email');
    await document.populate('reviewHistory.reviewer', 'name email');
    
    res.json(document);
  } catch (error) {
    console.error('Error adding review:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

 

// @route   POST /api/documents/:id/share
// @desc    Share document with specific user groups
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { shareType } = req.body; // 'all-managers', 'all-users', 'all'
    
    if (!shareType || !['all-managers', 'all-users', 'all'].includes(shareType)) {
      return res.status(400).json({ message: 'Valid share type is required' });
    }
    
    const document = await Document.findOne({ _id: req.params.id, deleted: false });
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }
    
    // Check if user owns the document
    if (document.author.toString() !== req.user.id) {
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
    document.sharedWith = [...new Set([...document.sharedWith, ...userIds])];
    
    // Add all users as collaborators with 'Viewer' role
    userIds.forEach(userId => {
      if (!document.collaborators.some(collab => collab.user.toString() === userId.toString())) {
        document.collaborators.push({
          user: userId,
          role: 'Viewer',
          addedAt: new Date()
        });
      }
    });
    
    await document.save();
    
    const populatedDocument = await Document.findById(document._id)
      .populate('author', 'name email')
      .populate('sharedWith', 'name email role')
      .populate('collaborators.user', 'name email role');
    
    // Create notifications for recipients
    try {
      const notifications = userIds
        .filter(id => id.toString() !== req.user.id)
        .map(id => ({
          recipient: id,
          sender: req.user.id,
          type: 'document',
          title: 'A document was shared with you',
          message: populatedDocument.title,
          entityType: 'Document',
          entityId: populatedDocument._id
        }));
      if (notifications.length > 0) {
        await Notification.insertMany(notifications);
      }
    } catch (notifyErr) {
      console.error('Error creating document share notifications:', notifyErr);
    }

    res.json({
      message: `Document shared with ${shareType}`,
      document: populatedDocument
    });
  } catch (error) {
    console.error('Error sharing document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/documents/trash/:id
// @desc    Permanently delete a document from trash
// @access  Private
router.delete('/trash/:id', auth, async (req, res) => {
  try {
    const document = await Document.findOne({ _id: req.params.id, deleted: true });
    
    if (!document) {
      return res.status(404).json({ message: 'Deleted document not found' });
    }
    
    // Allow owner or manager/admin to permanently delete
    if (!isOwnerOrManager(req, document)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Remove attachment files from disk
    try {
      if (Array.isArray(document.attachments)) {
        document.attachments.forEach(att => {
          if (att && att.filename) {
            const filePath = path.join(uploadsDir, att.filename);
            if (fs.existsSync(filePath)) {
              try { fs.unlinkSync(filePath); } catch (e) { console.error('Failed to unlink', filePath, e); }
            }
          }
        });
      }
    } catch (fileErr) {
      console.error('Error removing attachment files:', fileErr);
    }

    // Permanent delete
    await Document.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Document permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting document:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Document not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
