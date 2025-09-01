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
    maxlength: [1000, 'Description cannot exceed 1000 characters']
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
  archived: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for better query performance
projectSchema.index({ owner: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ dueDate: 1 });
projectSchema.index({ tags: 1 });
projectSchema.index({ archived: 1 });

// Virtual for project duration
projectSchema.virtual('duration').get(function() {
  if (!this.startDate) return 0;
  const endDate = this.completedDate || this.dueDate || new Date();
  return Math.ceil((endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Virtual for project status color
projectSchema.virtual('statusColor').get(function() {
  const colors = {
    'Not started': 'gray',
    'In progress': 'blue',
    'Done': 'green',
    'On hold': 'yellow',
    'Cancelled': 'red'
  };
  return colors[this.status] || 'gray';
});

// Method to update progress
projectSchema.methods.updateProgress = function() {
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
projectSchema.methods.addTeamMember = function(userId) {
  if (!this.team.includes(userId)) {
    this.team.push(userId);
    return this.save();
  }
  return Promise.resolve(this);
};

// Method to remove team member
projectSchema.methods.removeTeamMember = function(userId) {
  this.team = this.team.filter(id => id.toString() !== userId.toString());
  return this.save();
};

// Static method to find projects by status
projectSchema.statics.findByStatus = function(status) {
  return this.find({ status, archived: false }).populate('owner', 'name email');
};

// Static method to find projects by owner
projectSchema.statics.findByOwner = function(ownerId) {
  return this.find({ owner: ownerId, archived: false }).populate('team', 'name email');
};

// Pre-save middleware to update progress
projectSchema.pre('save', function(next) {
  if (this.isModified('milestones')) {
    this.updateProgress();
  }
  next();
});

module.exports = mongoose.model('Project', projectSchema);
