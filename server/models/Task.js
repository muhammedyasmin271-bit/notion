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
TaskSchema.post('save', async function(doc) {
  if (!doc.projectId) return;
  
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(doc.projectId);
    if (project && typeof project.calculateProgress === 'function') {
      await project.calculateProgress();
    }
  } catch (error) {
    console.error('Error updating project progress:', error.message);
  }
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