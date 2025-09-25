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
    maxlength: [10000, 'Description cannot exceed 10000 characters']
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
  team: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
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
    maxlength: [10000, 'Goal cannot exceed 10000 characters'],
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
  // Embedded tasks
  tasks: [{
    text: {
      type: String,
      required: [true, 'Task text is required'],
      trim: true,
      maxlength: [1000, 'Task text is too long (max 1000 characters)']
    },
    completed: {
      type: Boolean,
      default: false
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    dueDate: Date,
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    },
    // Comments moved to the main project level
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

module.exports = mongoose.model('Project', projectSchema);
