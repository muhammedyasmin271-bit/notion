const mongoose = require('mongoose');

const whiteLabelSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    unique: true
  },
  companyName: {
    type: String,
    required: true
  },
  branding: {
    logo: String,
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    secondaryColor: {
      type: String,
      default: '#8B5CF6'
    },
    accentColor: {
      type: String,
      default: '#10B981'
    },
    customCSS: String
  },
  domain: {
    type: String,
    unique: true,
    sparse: true
  },
  features: {
    documents: { type: Boolean, default: true },
    projects: { type: Boolean, default: true },
    goals: { type: Boolean, default: true },
    meetings: { type: Boolean, default: true },
    notepad: { type: Boolean, default: true },
    reports: { type: Boolean, default: true },
    chat: { type: Boolean, default: true },
    ai: { type: Boolean, default: false }
  },
  settings: {
    maxUsers: { type: Number, default: 100 },
    storageLimit: { type: Number, default: 10 }, // GB
    customFooter: String,
    supportEmail: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('WhiteLabel', whiteLabelSchema);