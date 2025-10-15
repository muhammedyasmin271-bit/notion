const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  settingKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  category: {
    type: String,
    enum: ['payment', 'general', 'email', 'sms', 'other'],
    default: 'general'
  },
  value: {
    type: mongoose.Schema.Types.Mixed, // Can be string, number, object, array
    required: true
  },
  description: {
    type: String
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Create default payment settings on initialization
systemSettingsSchema.statics.ensureDefaults = async function() {
  const defaults = [
    {
      settingKey: 'payment.monthlyAmount',
      category: 'payment',
      value: 1000,
      description: 'Monthly subscription fee'
    },
    {
      settingKey: 'payment.bankName',
      category: 'payment',
      value: 'Commercial Bank of Ethiopia',
      description: 'Bank name for payments'
    },
    {
      settingKey: 'payment.accountName',
      category: 'payment',
      value: 'Mela Note Services',
      description: 'Account holder name'
    },
    {
      settingKey: 'payment.accountNumber',
      category: 'payment',
      value: '1000123456789',
      description: 'Bank account number'
    },
    {
      settingKey: 'payment.teleBirrPhone',
      category: 'payment',
      value: '+251912345678',
      description: 'Tele Birr phone number for mobile payments'
    },
    {
      settingKey: 'payment.currency',
      category: 'payment',
      value: 'ETB',
      description: 'Currency code'
    }
  ];

  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { settingKey: setting.settingKey },
      setting,
      { upsert: true, new: true }
    );
  }
};

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);

