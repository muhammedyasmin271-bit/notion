const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  companyId: {
    type: String,
    required: true,
    index: true
  },
  companyName: {
    type: String,
    required: true
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  paymentDate: {
    type: Date,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'mobile_money', 'cash', 'check', 'other'],
    default: 'bank_transfer'
  },
  screenshotUrl: {
    type: String,
    required: true
  },
  note: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  period: {
    months: [Number], // Changed to array to support multiple months
    year: Number
  }
}, {
  timestamps: true
});

// Index for efficient queries
paymentSchema.index({ companyId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Payment', paymentSchema);

