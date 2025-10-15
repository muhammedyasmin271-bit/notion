const mongoose = require('mongoose');

const meetingNoteSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Meeting title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  type: {
    type: String,
    enum: ['Standup', 'Planning', 'Review', 'Retro', 'Presentation', 'Brainstorming', 'Client Meeting', 'Team Sync'],
    default: 'Team Sync'
  },
  date: {
    type: Date,
    default: Date.now
  },
  time: {
    type: String,
    default: '09:00'
  },
  duration: {
    type: String,
    default: '30'
  },
  attendees: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled', 'Postponed'],
    default: 'Scheduled'
  },
  notes: {
    type: String,
    trim: true,
    default: ''
  },
  actionItems: [{
    description: String,
    assignee: String,
    dueDate: Date,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  summary: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Meeting creator is required']
  },
  companyId: {
    type: String,
    default: 'default',
    index: true
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    permission: {
      type: String,
      enum: ['read', 'write'],
      default: 'read'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  location: {
    type: String,
    trim: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  agenda: [{
    topic: String,
    duration: String,
    presenter: String
  }],
  decisions: [{
    topic: String,
    decision: String,
    rationale: String
  }],
  followUps: [{
    description: String,
    assignedTo: String,
    dueDate: Date,
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High'],
      default: 'Medium'
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
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: Number,
    endDate: Date
  },

  blocks: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },
  tableData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
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
meetingNoteSchema.index({ createdBy: 1, date: 1 });
meetingNoteSchema.index({ status: 1 });
meetingNoteSchema.index({ type: 1 });
meetingNoteSchema.index({ project: 1 });
meetingNoteSchema.index({ deleted: 1 });
meetingNoteSchema.index({ date: 1 });

// Virtual for meeting status
meetingNoteSchema.virtual('isPast').get(function () {
  return new Date(this.date) < new Date();
});

// Virtual for meeting duration in minutes
meetingNoteSchema.virtual('durationMinutes').get(function () {
  const match = this.duration.match(/(\d+)\s*(min|hour|hr)/i);
  if (!match) return 0;

  const value = parseInt(match[1]);
  const unit = match[2].toLowerCase();

  if (unit === 'hour' || unit === 'hr') {
    return value * 60;
  }
  return value;
});

// Method to mark as complete
meetingNoteSchema.methods.markComplete = function () {
  this.status = 'Completed';
  return this.save();
};

// Method to soft delete
meetingNoteSchema.methods.softDelete = function () {
  this.deleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Method to restore
meetingNoteSchema.methods.restore = function () {
  this.deleted = false;
  this.deletedAt = undefined;
  return this.save();
};

// Method to add action item
meetingNoteSchema.methods.addActionItem = function (actionItem) {
  this.actionItems.push(actionItem);
  return this.save();
};

// Method to mark action item complete
meetingNoteSchema.methods.completeActionItem = function (actionItemId) {
  const actionItem = this.actionItems.id(actionItemId);
  if (actionItem) {
    actionItem.completed = true;
    actionItem.completedAt = new Date();
    return this.save();
  }
  return Promise.reject(new Error('Action item not found'));
};

module.exports = mongoose.model('MeetingNote', meetingNoteSchema);