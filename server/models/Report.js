const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  blocks: [{
    id: String,
    type: String,
    content: String,
    style: mongoose.Schema.Types.Mixed
  }],
  tableData: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  attachments: [{
    name: String,
    size: Number,
    path: String
  }],
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sharedWith: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['draft', 'submitted', 'published'],
    default: 'draft'
  },
  reportType: {
    type: String,
    default: 'management_report'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Report', ReportSchema);