const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Goal name is required'],
    trim: true,
    maxlength: [200, 'Goal name cannot exceed 200 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Goal owner is required']
  },
  companyId: {
    type: String,
    default: 'default',
    index: true
  },
  status: {
    type: String,
    enum: ['Not started', 'In progress', 'Done', 'On hold', 'Cancelled'],
    default: 'Not started'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  dueDate: {
    type: Date
  },
  team: {
    type: String,
    trim: true
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  milestones: [{
    title: String,
    description: String,
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  tags: [{
    type: String,
    trim: true
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
  isPublic: {
    type: Boolean,
    default: false
  },
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
  archived: {
    type: Boolean,
    default: false
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
goalSchema.index({ owner: 1, status: 1 });
goalSchema.index({ dueDate: 1 });
goalSchema.index({ priority: 1 });
goalSchema.index({ team: 1 });
goalSchema.index({ deleted: 1 });

// Virtual for goal age
goalSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for days until due
goalSchema.virtual('daysUntilDue').get(function() {
  if (!this.dueDate) return null;
  return Math.ceil((this.dueDate - Date.now()) / (1000 * 60 * 60 * 24));
});

// Method to mark as complete
goalSchema.methods.markComplete = function() {
  this.status = 'Done';
  this.progress = 100;
  this.completedDate = new Date();
  return this.save();
};

// Method to soft delete
goalSchema.methods.softDelete = function() {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
goalSchema.methods.restore = function() {
  this.deleted = false;
  this.deletedAt = undefined;
  return this.save();
};

module.exports = mongoose.model('Goal', goalSchema);
