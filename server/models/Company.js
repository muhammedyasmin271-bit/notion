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
  selectedPlan: { type: String, enum: ['free_trial', 'one_month', 'three_month', 'six_month'], default: 'free_trial' },
  pricePerUserPerMonth: { type: Number, default: 1 }, // Price per user per month in ETB
  hasPaid: { type: Boolean, default: false }, // Whether company has paid
  paymentMode: { type: String, enum: ['paid', 'free'], default: 'paid' }, // 'paid' = needs payment, 'free' = no payment required
  pausedAt: Date, // When company was paused
  unpausedAt: Date, // When company was unpaused (gives another 24 hours)
  paymentDeadline: Date, // Deadline for payment (24 hours for paid plans, 7 days for free trial)
  gracePeriodDeadline: Date, // Grace period deadline (7 days after payment deadline for paid plans)
  lastPaymentDate: Date, // Date of last approved payment
  paymentPeriodEnd: Date, // When the current payment period ends (calculated from last payment + plan duration)
  smsReminders: {
    paymentReminders: [Date], // SMS sent during 24h payment period
    trialReminders: [Date], // SMS sent during trial period
    graceReminders: [Date], // SMS sent during grace period
    lastSent: Date // Last SMS sent timestamp
  },
  deadlineStart: Date, // When company entered deadline (blocked) status
  paymentModeChangedAt: Date, // When payment mode was last changed by super admin
  paymentCountdownStart: Date, // When 24-hour countdown started for paid mode
  rating: { 
    type: Number, 
    default: 0 
  }, // Company rating based on average user points
  ratingBlocked: {
    type: Boolean,
    default: false
  }, // Whether rating display is blocked
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date
});

module.exports = mongoose.model('Company', companySchema);
