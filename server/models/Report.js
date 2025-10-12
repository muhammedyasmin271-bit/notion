const mongoose = require('mongoose');

const BlockSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true
  },
  content: {
    type: String,
    default: ''
  },
  style: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  calloutType: String,
  priorityLevel: String,
  highlightColor: String,
  tagColor: String,
  progress: Number,
  expanded: Boolean,
  toggleContent: String,
  url: String,
  emailAddress: String,
  address: String,
  visible: Boolean
}, { _id: false });

const ReportSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  blocks: [BlockSchema],
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
  isPublic: {
    type: Boolean,
    default: false
  },
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