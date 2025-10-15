const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  type: {
    type: String,
    enum: ['chat', 'meeting', 'document', 'note', 'project', 'goal', 'task', 'task_urgent', 'meeting_reminder', 'deadline', 'system'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high', 'urgent'],
    default: 'normal'
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    trim: true
  },
  entityType: {
    type: String,
    enum: ['Chat', 'MeetingNote', 'Document', 'Note', 'Project', 'Goal'],
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  metadata: {
    type: Object,
    default: {}
  },
  read: {
    type: Boolean,
    default: false
  },
  readAt: Date,
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: Date,
  smsStatus: {
    sent: { type: Boolean, default: false },
    delivered: { type: Boolean, default: false },
    sid: String,
    error: String,
    sentAt: Date
  },
  emailStatus: {
    sent: { type: Boolean, default: false },
    sid: String,
    error: String,
    sentAt: Date
  }
}, { timestamps: true });

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });
notificationSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);


