const express = require('express');
const router = express.Router();
const SystemSettings = require('../models/SystemSettings');
const auth = require('../middleware/auth');

// Middleware to check if user is super admin
const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== 'superadmin') {
    return res.status(403).json({ message: 'Access denied. Super admin only.' });
  }
  next();
};

// @route   GET /api/settings/payment
// @desc    Get payment settings (public - for "How to Pay" display)
// @access  Public (any authenticated user can view)
router.get('/payment', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.find({ category: 'payment' });
    
    // Convert to key-value object
    const paymentSettings = {};
    settings.forEach(setting => {
      const key = setting.settingKey.replace('payment.', '');
      paymentSettings[key] = setting.value;
    });

    res.json(paymentSettings);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/settings/all
// @desc    Get all system settings (Super Admin only)
// @access  Private (Super Admin)
router.get('/all', auth, isSuperAdmin, async (req, res) => {
  try {
    const settings = await SystemSettings.find().sort({ category: 1, settingKey: 1 });
    res.json(settings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings/:settingKey
// @desc    Update a system setting (Super Admin only)
// @access  Private (Super Admin)
router.put('/:settingKey', auth, isSuperAdmin, async (req, res) => {
  try {
    const { value } = req.body;
    
    if (value === undefined || value === null) {
      return res.status(400).json({ message: 'Value is required' });
    }

    const setting = await SystemSettings.findOneAndUpdate(
      { settingKey: req.params.settingKey },
      { 
        value,
        updatedBy: req.user.id
      },
      { new: true, upsert: true }
    );

    console.log('✅ Setting updated:', {
      key: req.params.settingKey,
      value: value,
      updatedBy: req.user.name
    });

    res.json({
      message: 'Setting updated successfully',
      setting
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/settings/payment/bulk
// @desc    Update multiple payment settings at once (Super Admin only)
// @access  Private (Super Admin)
router.put('/payment/bulk', auth, isSuperAdmin, async (req, res) => {
  try {
    const { monthlyAmount, bankName, accountName, accountNumber, teleBirrPhone, currency } = req.body;

    const updates = [];

    if (monthlyAmount !== undefined) {
      updates.push({
        settingKey: 'payment.monthlyAmount',
        value: parseFloat(monthlyAmount)
      });
    }

    if (bankName !== undefined) {
      updates.push({
        settingKey: 'payment.bankName',
        value: bankName
      });
    }

    if (accountName !== undefined) {
      updates.push({
        settingKey: 'payment.accountName',
        value: accountName
      });
    }

    if (accountNumber !== undefined) {
      updates.push({
        settingKey: 'payment.accountNumber',
        value: accountNumber
      });
    }

    if (teleBirrPhone !== undefined) {
      updates.push({
        settingKey: 'payment.teleBirrPhone',
        value: teleBirrPhone
      });
    }

    if (currency !== undefined) {
      updates.push({
        settingKey: 'payment.currency',
        value: currency
      });
    }

    // Update all settings
    for (const update of updates) {
      await SystemSettings.findOneAndUpdate(
        { settingKey: update.settingKey },
        { 
          value: update.value,
          updatedBy: req.user.id
        },
        { upsert: true, new: true }
      );
    }

    console.log('✅ Payment settings updated in bulk by:', req.user.name);

    res.json({ message: 'Payment settings updated successfully' });
  } catch (error) {
    console.error('Error updating payment settings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

