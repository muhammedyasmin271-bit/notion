const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  companyId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  subdomain: { type: String, unique: true, sparse: true },
  status: { type: String, enum: ['active', 'paused', 'suspended'], default: 'active' },
  subscriptionStatus: { type: String, enum: ['trial', 'paid', 'expired'], default: 'trial' },
  adminEmail: { type: String, required: true, unique: true, sparse: true },
  adminPhone: String,
  adminUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  branding: {
    logo: String,
    primaryColor: { type: String, default: '#3B82F6' },
    companyName: String
  },
  limits: {
    maxUsers: { type: Number, default: 50 },
    maxStorage: { type: Number, default: 5368709120 } // 5GB in bytes
  },
  pricing: {
    monthlyAmount: { type: Number, default: 1000 }, // Custom monthly payment for this company
    currency: { type: String, default: 'ETB' }
  },
  companyLink: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = mongoose.model('Company', companySchema);
