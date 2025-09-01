const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true
  },
  category: {
    type: String,
    enum: ['General', 'Work', 'Personal', 'Ideas', 'Tasks', 'Research', 'Meeting', 'Project'],
    default: 'General'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Note author is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isPinned: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permission: {
      type: String,
      enum: ['read', 'write', 'admin'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  attachments: [{
    filename: String,
    originalName: String,
    mimeType: String,
    size: Number,
    url: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    content: String,
    version: Number,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
noteSchema.index({ author: 1, category: 1 });
noteSchema.index({ tags: 1 });
noteSchema.index({ isPublic: 1 });
noteSchema.index({ isPinned: 1 });
noteSchema.index({ deleted: 1 });
noteSchema.index({ title: 'text', content: 'text' });

// Virtual for note excerpt
noteSchema.virtual('excerpt').get(function() {
  return this.content.length > 150 
    ? this.content.substring(0, 150) + '...' 
    : this.content;
});

// Virtual for word count
noteSchema.virtual('wordCount').get(function() {
  return this.content.trim().split(/\s+/).length;
});

// Method to soft delete
noteSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
noteSchema.methods.restore = function() {
  this.deleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Method to archive
noteSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Method to unarchive
noteSchema.methods.unarchive = function() {
  this.isArchived = false;
  return this.save();
};

// Method to pin/unpin
noteSchema.methods.togglePin = function() {
  this.isPinned = !this.isPinned;
  return this.save();
};

// Method to create new version
noteSchema.methods.createVersion = function(newContent, userId) {
  // Store current version in previous versions
  this.previousVersions.push({
    content: this.content,
    version: this.version,
    updatedAt: this.updatedAt,
    updatedBy: this.author
  });
  
  // Update content and version
  this.content = newContent;
  this.version += 1;
  
  return this.save();
};

module.exports = mongoose.model('Note', noteSchema);
