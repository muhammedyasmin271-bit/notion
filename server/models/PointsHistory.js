const mongoose = require('mongoose');

const pointsHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  companyId: {
    type: String,
    required: true,
    index: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true,
    index: true
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task',
    index: true
  },
  points: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  // Track if this transaction has been reversed
  reversed: {
    type: Boolean,
    default: false
  },
  reversedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PointsHistory'
  },
  // Metadata
  completedDate: Date,
  dueDate: Date,
  daysDifference: Number // positive for late, negative for early
}, {
  timestamps: true
});

// Index for efficient queries
pointsHistorySchema.index({ userId: 1, companyId: 1 });
pointsHistorySchema.index({ projectId: 1 });
pointsHistorySchema.index({ companyId: 1, createdAt: -1 });
pointsHistorySchema.index({ reversed: 1 });

module.exports = mongoose.model('PointsHistory', pointsHistorySchema);

