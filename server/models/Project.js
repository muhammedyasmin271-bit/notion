const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Project title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Project description is required'],
    trim: true,
    maxlength: [5000000, 'Description cannot exceed 5000000 characters']
  },
  status: {
    type: String,
    enum: ['Not started', 'In Progress', 'Done', 'On hold', 'Cancelled'],
    default: 'Not started'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Critical'],
    default: 'Medium'
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Project owner is required']
  },
  companyId: {
    type: String,
    default: 'default',
    index: true
  },
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  assignedTo: [{
    type: String,
    trim: true
  }],
  viewers: [{
    type: String,
    trim: true
  }],
  startDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  goal: {
    type: String,
    trim: true,
    maxlength: [5000000, 'Goal cannot exceed 5000000 characters'],
    default: ''
  },
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
  budget: {
    estimated: Number,
    actual: Number,
    currency: {
      type: String,
      default: 'USD'
    }
  },
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

  activities: [{
    id: Number,
    user: String,
    action: String,
    timestamp: String,
    type: String
  }],

  // Project notes as blocks
  notes: {
    type: String,
    default: ''
  },

  // Project goals as blocks (separate from notes)
  goal: {
    type: String,
    default: ''
  },

  // Project blocks/content for rich text editing
  blocks: {
    type: String,
    default: ''
  },

  content: {
    type: String,
    default: ''
  },

  // Structured block data
  blockData: {
    type: mongoose.Schema.Types.Mixed,
    default: []
  },

  // Table data for table blocks
  tableData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Toggle states for toggle blocks
  toggleStates: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Toggle content for toggle blocks
  toggleContent: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Track changes made by non-managers
  changeCount: {
    type: Number,
    default: 0
  },
  // Track if points have been awarded for this project (to prevent double-counting)
  pointsAwarded: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for tasks count
projectSchema.virtual('taskCount', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  count: true
});

// Virtual for completed tasks count
projectSchema.virtual('completedTasks', {
  ref: 'Task',
  localField: '_id',
  foreignField: 'projectId',
  match: { completed: true },
  count: true
});

// Calculate progress based on completed tasks
projectSchema.methods.calculateProgress = async function () {
  const Task = mongoose.model('Task');
  const totalTasks = await Task.countDocuments({ projectId: this._id });
  const completedTasks = await Task.countDocuments({
    projectId: this._id,
    completed: true
  });

  this.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  return this.save();
};

// Indexes for better query performance
projectSchema.index({ owner: 1, status: 1 });
projectSchema.index({ team: 1, status: 1 });
projectSchema.index({ dueDate: 1 });
projectSchema.index({ priority: 1 });

// Indexes for better query performance
projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ dueDate: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ archived: 1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function () {
  if (!this.startDate) return 0;
  const endDate = this.completedDate || this.dueDate || new Date();
  return Math.ceil((endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for project status color
projectSchema.virtual('statusColor').get(function () {
  const colors = {
    'Not started': 'gray',
    'In Progress': 'blue',
    'Done': 'green',
    'On hold': 'yellow',
    'Cancelled': 'red'
  };
  return colors[this.status] || 'gray';
});

// Method to update progress
projectSchema.methods.updateProgress = function () {
  if (this.milestones.length === 0) return;

  const completedMilestones = this.milestones.filter(m => m.completed).length;
  this.progress = Math.round((completedMilestones / this.milestones.length) * 100);

  if (this.progress === 100 && this.status !== 'Done') {
    this.status = 'Done';
    this.completedDate = new Date();
  }

  return this.save();
};

// Method to add team member
projectSchema.methods.addTeamMember = function (userId) {
  if (!this.team.includes(userId)) {
    this.team.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove team member
projectSchema.methods.removeTeamMember = function (userId) {
  this.team = this.team.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Static method to find projects by status
projectSchema.statics.findByStatus = function (status) {
  return this.find({ status, archived: false }).populate('owner', 'name email');
};

// Static method to find projects by owner
projectSchema.statics.findByOwner = function (ownerId) {
  return this.find({ owner: ownerId, archived: false }).populate('team', 'name email');
};

// Pre-save middleware to update progress
projectSchema.pre('save', function (next) {
  if (this.isModified('milestones')) {
    this.updateProgress();
  }
  next();
});

// Post-save hook to award points when project is completed (for milestone-based completion)
projectSchema.post('save', function (doc) {
  // Only process if status is "Done", has dueDate and completedDate, and points haven't been awarded
  if (doc.status === 'Done' && doc.dueDate && doc.completedDate && !doc.pointsAwarded && doc.companyId) {
    // Use process.nextTick to ensure this runs after the save is complete
    process.nextTick(async () => {
      try {
        // Import here to avoid circular dependency
        const { awardProjectPoints } = require('../utils/pointsCalculator');
        // Reload fresh document to ensure we have latest state
        const ProjectModel = mongoose.model('Project');
        const freshProject = await ProjectModel.findById(doc._id);
        if (freshProject && freshProject.status === 'Done' && !freshProject.pointsAwarded) {
          await awardProjectPoints(freshProject, doc.companyId);
        }
      } catch (error) {
        console.error(`❌ Error in post-save hook for project ${doc._id}:`, error.message);
        // Don't throw - we don't want to break saves
      }
    });
  }
});

module.exports = mongoose.model('Project', projectSchema);
