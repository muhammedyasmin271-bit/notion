const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const auth = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/payments';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'payment-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png|pdf/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files (JPEG, PNG) and PDF are allowed!'));
  }
});

// @route   POST /api/payments/submit
// @desc    Submit payment proof (Admin/Company CEO only)
// @access  Private (Admin)
router.post('/submit', auth, upload.single('screenshot'), async (req, res) => {
  try {
    // Only admins can submit payments for their company
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only company admins can submit payments' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Payment screenshot is required' });
    }

    const { amount, paymentDate, paymentMethod, note, months, year } = req.body;

    console.log('📥 Payment submission received:', {
      amount,
      paymentDate,
      months,
      year,
      hasFile: !!req.file,
      fileName: req.file?.filename
    });

    // Get company info
    const company = await Company.findOne({ companyId: req.user.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Parse months array if it's a string (from FormData)
    const monthsArray = typeof months === 'string' ? JSON.parse(months) : months;

    // Validate months array
    if (!monthsArray || !Array.isArray(monthsArray) || monthsArray.length === 0) {
      return res.status(400).json({ message: 'Please select at least one month' });
    }

    console.log('💾 Creating payment document:', {
      companyId: req.user.companyId,
      companyName: company.name,
      amount: parseFloat(amount),
      months: monthsArray,
      year: parseInt(year)
    });

    const payment = new Payment({
      companyId: req.user.companyId,
      companyName: company.name,
      submittedBy: req.user.id,
      amount: parseFloat(amount),
      paymentDate: new Date(paymentDate),
      paymentMethod: paymentMethod || 'bank_transfer',
      screenshotUrl: `/uploads/payments/${req.file.filename}`,
      note: note || '',
      status: 'pending',
      period: {
        months: monthsArray,
        year: parseInt(year)
      }
    });

    const savedPayment = await payment.save();

    console.log('✅ Payment saved to database successfully!');
    console.log('📊 Payment Details:', {
      id: savedPayment._id,
      companyId: savedPayment.companyId,
      companyName: savedPayment.companyName,
      amount: savedPayment.amount,
      months: savedPayment.period.months,
      year: savedPayment.period.year,
      status: savedPayment.status,
      createdAt: savedPayment.createdAt
    });

    res.status(201).json({
      message: 'Payment submitted successfully! Waiting for super admin approval.',
      payment: savedPayment
    });
  } catch (error) {
    console.error('Error submitting payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments/my-company
// @desc    Get all payment submissions for current company (Admin only)
// @access  Private (Admin)
router.get('/my-company', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only company admins can view payments' });
    }

    const payments = await Payment.find({ companyId: req.user.companyId })
      .populate('submittedBy', 'name username email')
      .populate('verifiedBy', 'name username')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching company payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/all
// @desc    Get all payment submissions (Super Admin only)
// @access  Private (Super Admin)
router.get('/all', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admin can view all payments' });
    }

    const { status } = req.query;
    const query = status && status !== 'all' ? { status } : {};

    const payments = await Payment.find(query)
      .populate('submittedBy', 'name username email phone')
      .populate('verifiedBy', 'name username')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching all payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/payments/:id/verify
// @desc    Approve or reject payment (Super Admin only)
// @access  Private (Super Admin)
router.put('/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admin can verify payments' });
    }

    const { status, rejectionReason } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be "approved" or "rejected"' });
    }

    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Payment has already been processed' });
    }

    payment.status = status;
    payment.verifiedBy = req.user.id;
    payment.verifiedAt = new Date();

    if (status === 'rejected') {
      payment.rejectionReason = rejectionReason;
    }

    await payment.save();

    await payment.populate('submittedBy', 'name username email');
    await payment.populate('verifiedBy', 'name username');

    console.log(`✅ Payment ${status}:`, {
      paymentId: payment._id,
      companyId: payment.companyId,
      companyName: payment.companyName,
      status: status,
      verifiedBy: req.user.name
    });

    res.json({
      message: `Payment ${status} successfully`,
      payment
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/payments/:id
// @desc    Delete payment submission (Admin - own submissions only)
// @access  Private (Admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Only allow deletion if user is admin of the company or superadmin
    if (req.user.role === 'admin' && payment.companyId !== req.user.companyId) {
      return res.status(403).json({ message: 'Not authorized to delete this payment' });
    }

    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Only allow deletion if payment is still pending
    if (payment.status !== 'pending') {
      return res.status(400).json({ message: 'Cannot delete a processed payment' });
    }

    // Delete the screenshot file
    if (payment.screenshotUrl) {
      const filePath = path.join(__dirname, '..', payment.screenshotUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.json({ message: 'Payment submission deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

