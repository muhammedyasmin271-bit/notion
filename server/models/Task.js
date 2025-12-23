const mongoose = require('mongoose');



const TaskSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Task text is required'],
    trim: true,
    minlength: [1, 'Task text cannot be empty'],
    maxlength: [1000, 'Task text is too long (max 1000 characters)']
  },
  completed: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high'],
      message: 'Priority must be either low, medium, or high'
    },
    default: 'medium'
  },
  type: {
    type: String,
    enum: ['Task', 'Sprint', 'Story'],
    default: 'Task'
  },
  key: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['Development', 'Product Design', 'Marketing', 'Other'],
    default: 'Development'
  },
  status: {
    type: String,
    enum: ['In Progress', 'Completed', 'Overdue', 'Not Started', 'On Hold'],
    default: 'Not Started'
  },
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reporter: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  dueDate: {
    type: Date,
    validate: {
      validator: function(v) {
        if (!v) return true; // Allow null/undefined
        
        // Get today's date at midnight
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Get the due date at midnight
        const dueDate = new Date(v);
        dueDate.setHours(0, 0, 0, 0);
        
        // Allow today or future dates
        return dueDate >= today;
      },
      message: 'Due date cannot be in the past'
    }
  },
  comments: [{
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Task creator is required'],
    index: true
  },
  companyId: {
    type: String,
    default: 'default',
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project ID is required - tasks must belong to a project'],
    index: true
  },
  // Track if points have been awarded for this task (to prevent double-counting)
  pointsAwarded: {
    type: Boolean,
    default: false
  },
  completedDate: {
    type: Date
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index for faster queries
TaskSchema.index({ projectId: 1, completed: 1 });
TaskSchema.index({ createdBy: 1, completed: 1 });

// Middleware to update project progress after task changes
// Only update progress when 'completed' field changes, not for status/priority/assignee/dueDate changes
TaskSchema.post('save', async function(doc) {
  if (!doc.projectId) return;
  
  // Only update project progress if the 'completed' field was modified
  // This ensures status, priority, assignee, and dueDate changes don't affect project progress
  if (!doc.isModified('completed')) return;
  
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(doc.projectId);
    if (project && typeof project.calculateProgress === 'function') {
      await project.calculateProgress();
    }
    
    // Award points if task was just completed
    if (doc.completed && doc.status === 'Completed' && !doc.pointsAwarded) {
      const { awardTaskPoints } = require('../utils/pointsCalculator');
      await awardTaskPoints(doc, project, doc.companyId);
    }
  } catch (error) {
    console.error('Error updating project progress:', error.message);
  }
});

// Pre-save middleware to sync completed and status fields
TaskSchema.pre('save', function(next) {
  // Prevent changes to completed tasks that have points awarded
  // EXCEPT allow uncompleting (completed: false or status !== 'Completed') so points can be reversed
  if (this.pointsAwarded && !this.isNew) {
    const modifiedFields = this.modifiedPaths();
    const allowedFields = ['updatedAt']; // Only allow timestamp updates
    
    // Check if this is an uncompletion (allow this change so points can be reversed)
    const isUncompleting = (this.isModified('completed') && this.completed === false) ||
                          (this.isModified('status') && this.status !== 'Completed');
    
    if (!isUncompleting) {
      const hasDisallowedChanges = modifiedFields.some(field => !allowedFields.includes(field));
      
      if (hasDisallowedChanges) {
        const error = new Error('Cannot modify a completed task that has points awarded');
        error.name = 'ValidationError';
        return next(error);
      }
    }
  }
  
  // Sync completed and status fields bidirectionally
  // Priority: completed field takes precedence - if completed is true, status MUST be 'Completed'
  
  // When completed is being set or modified
  if (this.isModified('completed')) {
    if (this.completed === true) {
      // If marked as completed, status MUST be 'Completed' (override any conflicting status)
      this.status = 'Completed';
      if (!this.completedDate) {
        this.completedDate = new Date();
      }
    } else if (this.completed === false && this.status === 'Completed') {
      // If uncompleted and status is still 'Completed', reset status
      this.status = 'Not Started';
      this.completedDate = undefined;
    }
  }
  // When only status is being changed (and completed is not being modified)
  else if (this.isModified('status')) {
    if (this.status === 'Completed' && this.completed !== true) {
      // Status changed to 'Completed', so set completed to true
      this.completed = true;
      if (!this.completedDate) {
        this.completedDate = new Date();
      }
    } else if (this.status !== 'Completed' && this.completed === true) {
      // Status changed away from 'Completed', so set completed to false
      this.completed = false;
      this.completedDate = undefined;
    }
  }
  
  // Final safety check: if completed is true, ensure status is 'Completed' (handles edge cases)
  if (this.completed === true && this.status !== 'Completed') {
    this.status = 'Completed';
    if (!this.completedDate) {
      this.completedDate = new Date();
    }
  }
  
  next();
});

// Middleware to update project progress when a task is deleted
TaskSchema.post('findOneAndDelete', async function(doc) {
  if (!doc || !doc.projectId) return;
  
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(doc.projectId);
    if (project && typeof project.calculateProgress === 'function') {
      await project.calculateProgress();
    }
  } catch (error) {
    console.error('Error updating project progress after deletion:', error.message);
  }
});

module.exports = mongoose.model('Task', TaskSchema);