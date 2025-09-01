const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Document title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Document content is required'],
    trim: true
  },
  type: {
    type: String,
    default: 'Document'
  },
  category: {
    type: String,
    default: 'General'
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Document author is required']
  },
  status: {
    type: String,
    default: 'Draft'
  },
  version: {
    type: Number,
    default: 1
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isTemplate: {
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
  previousVersions: [{
    content: String,
    version: Number,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changeLog: String
  }],
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['Editor', 'Reviewer', 'Viewer'],
      default: 'Viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  reviewHistory: [{
    reviewer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['Approved', 'Rejected', 'Comments'],
      default: 'Comments'
    },
    comments: String,
    reviewedAt: {
      type: Date,
      default: Date.now
    }
  }],
  metadata: {
    language: {
      type: String,
      default: 'en'
    },
    pageCount: Number,
    wordCount: Number,
    lastModified: Date,
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
}, {
  timestamps: true
});

// Indexes for better query performance
documentSchema.index({ author: 1, type: 1 });
documentSchema.index({ category: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ tags: 1 });
documentSchema.index({ isPublic: 1 });
documentSchema.index({ deleted: 1 });
documentSchema.index({ title: 'text', content: 'text' });

// Virtual for document excerpt
documentSchema.virtual('excerpt').get(function() {
  return this.content.length > 200 
    ? this.content.substring(0, 200) + '...' 
    : this.content;
});

// Virtual for word count
documentSchema.virtual('wordCount').get(function() {
  return this.content.trim().split(/\s+/).length;
});

// Method to soft delete
documentSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
documentSchema.methods.restore = function() {
  this.deleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Method to archive
documentSchema.methods.archive = function() {
  this.isArchived = true;
  return this.save();
};

// Method to unarchive
documentSchema.methods.unarchive = function() {
  this.isArchived = false;
  return this.save();
};

// Method to create new version
documentSchema.methods.createVersion = function(newContent, userId, changeLog = '') {
  // Store current version in previous versions
  this.previousVersions.push({
    content: this.content,
    version: this.version,
    updatedAt: this.updatedAt,
    updatedBy: this.author,
    changeLog
  });
  
  // Update content and version
  this.content = newContent;
  this.version += 1;
  this.metadata.lastModified = new Date();
  this.metadata.lastModifiedBy = userId;
  
  return this.save();
};

// Method to add collaborator
documentSchema.methods.addCollaborator = function(userId, role = 'Viewer') {
  const existingCollaborator = this.collaborators.find(c => c.user.toString() === userId.toString());
  
  if (existingCollaborator) {
    existingCollaborator.role = role;
  } else {
    this.collaborators.push({
      user: userId,
      role,
      addedAt: new Date()
    });
  }
  
  return this.save();
};

// Method to remove collaborator
documentSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(c => c.user.toString() !== userId.toString());
  return this.save();
};

module.exports = mongoose.model('Document', documentSchema);
