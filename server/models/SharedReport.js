const mongoose = require('mongoose');

const SharedReportSchema = new mongoose.Schema({
  sharedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reportData: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  reportType: {
    type: String,
    default: 'management_report'
  },
  sharedAt: {
    type: Date,
    default: Date.now
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model('SharedReport', SharedReportSchema);