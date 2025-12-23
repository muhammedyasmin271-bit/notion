const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const fetch = require('node-fetch');
const Payment = require('../models/Payment');
const Company = require('../models/Company');
const auth = require('../middleware/auth');

/**
 * Calculate the base date for payment period extension.
 * Only preserves remaining time from actual paid periods, not trial or grace periods.
 * @param {Object} company - Company object with payment dates
 * @param {Date} now - Current date
 * @returns {Date} - Base date to extend from (only includes remaining paid time)
 */
function calculatePaymentBaseDate(company, now) {
  // Only preserve remaining time from paymentPeriodEnd if it's a paid period
  // Don't preserve time from trial periods, grace periods, or 24-hour deadlines
  if (company.paymentPeriodEnd && 
      new Date(company.paymentPeriodEnd) > now && 
      company.hasPaid && 
      company.lastPaymentDate) {
    // Only use paymentPeriodEnd if there was an actual payment
    return new Date(company.paymentPeriodEnd);
  }

  // For new payments or expired periods, start from now
  return now;
}

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

    // Screenshot is optional (not needed for Chapa payments)
    // if (!req.file) {
    //   return res.status(400).json({ message: 'Payment screenshot is required' });
    // }

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
      screenshotUrl: req.file ? `/uploads/payments/${req.file.filename}` : '',
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

    const payments = await Payment.find({ 
      companyId: req.user.companyId,
      status: 'approved'
    })
      .populate('submittedBy', 'name username email')
      .populate('verifiedBy', 'name username')
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    console.error('Error fetching company payments:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/company/:companyId/pause
// @desc    Pause company (Super Admin only)
// @access  Private (Super Admin)
router.post('/company/:companyId/pause', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admin can pause companies' });
    }

    const company = await Company.findOne({ companyId: req.params.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const now = new Date();
    company.status = 'paused';
    company.pausedAt = now;
    company.deadlineStart = now;
    // Clear payment deadlines when paused
    company.paymentDeadline = null;
    company.gracePeriodDeadline = null;
    company.paymentCountdownStart = null;
    await company.save();

    res.json({ message: 'Company paused successfully', company });
  } catch (error) {
    console.error('Error pausing company:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments/company/:companyId/play
// @desc    Reactivate company (gives 24 hours to pay) (Super Admin only)
// @access  Private (Super Admin)
router.post('/company/:companyId/play', auth, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ message: 'Only super admin can reactivate companies' });
    }

    const company = await Company.findOne({ companyId: req.params.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    const now = new Date();
    company.status = 'active';
    company.unpausedAt = now;
    company.paymentDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Exactly 24 hours
    company.gracePeriodDeadline = new Date(company.paymentDeadline.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days grace
    company.paymentCountdownStart = now; // Set countdown start
    company.deadlineStart = null; // Reset deadline counter
    await company.save();

    res.json({ message: 'Company reactivated for 24 hours', company });
  } catch (error) {
    console.error('Error reactivating company:', error);
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
    const query = status && status !== 'all' ? { status } : { status: 'approved' };

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

    // Chapa payments are auto-approved when successful and should not be manually approved/rejected
    if (payment.paymentMethod === 'chapa') {
      return res.status(400).json({ 
        message: 'Chapa payments are automatically approved when successful. They cannot be manually approved or rejected.' 
      });
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

    // If payment is approved, update company payment status and extend payment period
    if (status === 'approved') {
      const company = await Company.findOne({ companyId: payment.companyId });
      
      if (company) {
        const now = new Date();
        company.hasPaid = true;
        company.lastPaymentDate = now;
        company.status = 'active'; // Ensure company is active after payment
        
        // Calculate payment period end based on plan
        let monthsToAdd = 0;
        if (payment.period?.months && payment.period.months.length > 0) {
          // The months array length represents the number of months in the plan
          monthsToAdd = payment.period.months.length;
        } else {
          // Fallback: determine from selected plan
          switch (company.selectedPlan) {
            case 'one_month':
              monthsToAdd = 1;
              break;
            case 'three_month':
              monthsToAdd = 3;
              break;
            case 'six_month':
              monthsToAdd = 6;
              break;
            default:
              monthsToAdd = 1;
          }
        }
        
        console.log(`📅 Payment period calculation:`, {
          monthsArrayLength: payment.period?.months?.length || 0,
          selectedPlan: company.selectedPlan,
          monthsToAdd: monthsToAdd,
          currentPaymentPeriodEnd: company.paymentPeriodEnd,
          currentGracePeriodDeadline: company.gracePeriodDeadline,
          currentPaymentDeadline: company.paymentDeadline
        });
        
        // Calculate base date - only preserve remaining time from actual paid periods
        const baseDate = calculatePaymentBaseDate(company, now);
        
        // Extend payment period from the base date
        const newPeriodEnd = new Date(baseDate);
        newPeriodEnd.setMonth(newPeriodEnd.getMonth() + monthsToAdd);
        company.paymentPeriodEnd = newPeriodEnd;
        
        // Update payment deadline to match new period end
        company.paymentDeadline = newPeriodEnd;
        
        // Clear grace period deadline since payment is made
        company.gracePeriodDeadline = null;
        
        // Clear payment countdown start since payment is made (no longer need 24h reminder)
        company.paymentCountdownStart = null;
        
        await company.save();
        
        console.log(`✅ Company payment updated:`, {
          companyId: company.companyId,
          companyName: company.name,
          paymentPeriodEnd: company.paymentPeriodEnd,
          monthsAdded: monthsToAdd
        });
      }
    }

    await payment.populate('submittedBy', 'name username email');
    await payment.populate('verifiedBy', 'name username');

    console.log(`✅ Payment ${status}:`, {
      paymentId: payment._id,
      companyId: payment.companyId,
      companyName: payment.companyName,
      status: status,
      verifiedBy: req.user.username || req.user.id
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

// @route   POST /api/payments/chapa/initialize
// @desc    Initialize Chapa payment (Admin only)
// @access  Private (Admin)
router.post('/chapa/initialize', auth, async (req, res) => {
  try {
    // Only admins can initialize payments
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only company admins can initialize payments' });
    }

    const { amount, months, year, planName } = req.body;

    console.log('📥 Chapa payment request received:', {
      amount,
      months,
      year,
      planName,
      userId: req.user.id,
      companyId: req.user.companyId
    });

    if (!amount || parseFloat(amount) <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    // Months are automatically calculated from plan, so we'll generate them if not provided
    let monthsToUse = months;
    if (!monthsToUse || !Array.isArray(monthsToUse) || monthsToUse.length === 0) {
      // Auto-generate months based on current date (fallback)
      const currentMonth = new Date().getMonth() + 1;
      monthsToUse = [currentMonth];
    }

    // Get company info
    const company = await Company.findOne({ companyId: req.user.companyId });
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Get user info for payment
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Chapa API configuration
    const CHAPA_TOKEN = process.env.CHAPA_TOKEN || process.env.CHAPA_SECRET_KEY;
    const CHAPA_API = process.env.CHAPA_API || 'https://api.chapa.co/v1';
    const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
    
    if (!CHAPA_TOKEN) {
      console.error('❌ Chapa token not found in environment variables');
      return res.status(500).json({ 
        message: 'Payment gateway not configured. Please contact administrator.',
        error: 'CHAPA_TOKEN not found'
      });
    }
    
    console.log('🔧 Chapa Configuration:', {
      hasToken: !!CHAPA_TOKEN,
      tokenPrefix: CHAPA_TOKEN?.substring(0, 15) + '...',
      apiBase: CHAPA_API,
      baseUrl: BASE_URL
    });
    
    // Generate short transaction reference (max 50 chars)
    const txRef = `pay-${req.user.companyId}-${Date.now().toString().slice(-8)}`;

    // Use the exact amount from the plan (no minimum enforced)
    const chapaAmount = parseFloat(amount);
    
    if (chapaAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }
    
    // Prepare payment data for Chapa
    const paymentData = {
      amount: chapaAmount,
      currency: 'ETB',
      email: user.email || `${user.username}@gmail.com`,
      first_name: user.name?.split(' ')[0] || user.username || 'User',
      last_name: user.name?.split(' ').slice(1).join(' ') || 'Customer',
      phone_number: user.phone || '+251911123456',
      tx_ref: txRef,
      callback_url: `http://localhost:9000/api/payments/chapa/webhook`,
      return_url: `${BASE_URL}/payment-return?tx_ref=${txRef}&status=success&company=${req.user.companyId}`,
      customization: {
        title: planName?.substring(0, 16) || 'Subscription', // Max 16 chars
        description: `Payment for ${planName || 'Monthly Subscription'}`
      },
      meta: {
        companyId: req.user.companyId,
        companyName: company.name,
        userId: req.user.id,
        months: JSON.stringify(monthsToUse),
        year: year.toString(),
        planName: planName || 'Monthly Subscription'
      }
    };

    console.log('💳 Preparing Chapa payment:', {
      amount: paymentData.amount,
      currency: paymentData.currency,
      tx_ref: paymentData.tx_ref,
      email: paymentData.email,
      phone: paymentData.phone_number
    });

    // Initialize payment with Chapa
    try {
      const chapaUrl = `${CHAPA_API}/transaction/initialize`;
      console.log('🌐 Calling Chapa API:', chapaUrl);
      
      const chapaResponse = await fetch(chapaUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CHAPA_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      });

      const chapaData = await chapaResponse.json();

      console.log('📡 Chapa API Response Status:', chapaResponse.status);
      console.log('📡 Chapa API Response:', JSON.stringify(chapaData, null, 2));

      if (!chapaResponse.ok) {
        console.error('❌ Chapa API Error Details:', {
          status: chapaResponse.status,
          statusText: chapaResponse.statusText,
          responseData: chapaData,
          requestData: paymentData
        });
        return res.status(400).json({ 
          message: chapaData.message || chapaData.data?.message || 'Failed to initialize payment with Chapa',
          error: chapaData,
          details: `Chapa API returned ${chapaResponse.status}: ${chapaResponse.statusText}`,
          requestData: paymentData // Include request data for debugging
        });
      }

      if (!chapaData.data || !chapaData.data.checkout_url) {
        console.error('❌ Chapa response missing checkout URL:', chapaData);
        return res.status(400).json({
          message: 'Invalid response from payment gateway',
          error: 'No checkout URL received from Chapa',
          response: chapaData
        });
      }

      // Create pending payment record
      // Note: Chapa payments are auto-approved by Chapa callback/verify when successful
      // They should NOT be manually approved - the backend automatically approves them when payment succeeds
      const payment = new Payment({
        companyId: req.user.companyId,
        companyName: company.name,
        submittedBy: req.user.id,
        amount: chapaAmount, // Use the adjusted amount
        paymentDate: new Date(),
        paymentMethod: 'chapa',
        screenshotUrl: '', // Not needed for Chapa
        note: `Chapa payment for ${planName || 'subscription'}`,
        status: 'pending', // Will be auto-approved by Chapa callback/verify when successful
        period: {
          months: monthsToUse,
          year: parseInt(year)
        },
        chapaTxRef: txRef,
        chapaCheckoutUrl: chapaData.data?.checkout_url || null
      });

      await payment.save();
      console.log('💾 Payment record created:', payment._id);

      res.json({
        message: 'Payment initialized successfully',
        checkoutUrl: chapaData.data?.checkout_url,
        txRef: txRef,
        paymentId: payment._id,
        success: true
      });
    } catch (chapaError) {
      console.error('❌ Chapa integration error:', chapaError);
      return res.status(500).json({ 
        message: 'Failed to connect to payment gateway',
        error: chapaError.message,
        details: 'Please check your internet connection and try again'
      });
    }
  } catch (error) {
    console.error('❌ Error initializing Chapa payment:', error);
    res.status(500).json({ 
      message: 'Server error while initializing payment', 
      error: error.message 
    });
  }
});

// @route   POST /api/payments/chapa/webhook
// @desc    Handle Chapa webhook (server-to-server notification)
// @access  Public (called by Chapa)
router.post('/chapa/webhook', async (req, res) => {
  try {
    console.log('🔔 Chapa webhook received:', JSON.stringify(req.body, null, 2));
    
    const { tx_ref, status, event } = req.body;
    
    if (!tx_ref) {
      console.log('❌ Webhook: Missing tx_ref');
      return res.status(400).json({ message: 'Transaction reference is required' });
    }
    
    // Only process successful payment events
    if (event === 'charge.success' || status === 'success') {
      console.log('✅ Webhook: Processing successful payment event');
      
      // Find payment by Chapa transaction reference
      const payment = await Payment.findOne({ chapaTxRef: tx_ref });
      if (!payment) {
        console.log('❌ Webhook: Payment not found for tx_ref:', tx_ref);
        return res.status(404).json({ message: 'Payment not found' });
      }
      
      // Only update if still pending
      if (payment.status === 'pending') {
        console.log('✅ Webhook: Updating payment status to approved');
        
        payment.status = 'approved';
        payment.verifiedAt = new Date();
        await payment.save();
        
        // Update company payment status
        const company = await Company.findOne({ companyId: payment.companyId });
        if (company) {
          const now = new Date();
          company.hasPaid = true;
          company.lastPaymentDate = now;
          company.status = 'active';
          
          let monthsToAdd = payment.period?.months?.length || 1;
          
          if (monthsToAdd > 0) {
            const baseDate = calculatePaymentBaseDate(company, now);
            company.paymentPeriodEnd = new Date(baseDate);
            company.paymentPeriodEnd.setMonth(company.paymentPeriodEnd.getMonth() + monthsToAdd);
            company.paymentDeadline = new Date(company.paymentPeriodEnd);
            company.gracePeriodDeadline = null;
            company.paymentCountdownStart = null; // Clear 24h countdown since payment is made
          }
          
          await company.save();
          console.log(`✅ Webhook: Company payment status updated for ${company.name}`);
        }
      }
    }
    
    res.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.status(500).json({ message: 'Webhook processing failed' });
  }
});

// @route   POST /api/payments/chapa/callback
// @desc    Handle Chapa payment callback (legacy - for backward compatibility)
// @access  Public (called by Chapa)
router.post('/chapa/callback', async (req, res) => {
  try {
    const { tx_ref, status } = req.body;

    if (!tx_ref) {
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    // Find payment by Chapa transaction reference
    const payment = await Payment.findOne({ chapaTxRef: tx_ref });
    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' });
    }

    // Verify payment with Chapa
    const CHAPA_TOKEN = process.env.CHAPA_TOKEN || process.env.CHAPA_SECRET_KEY || 'CHASECK_TEST-xxxxxxxxxxxxx';
    const CHAPA_API = process.env.CHAPA_API || 'https://api.chapa.co/v1';
    
    try {
      const verifyUrl = `${CHAPA_API}/transaction/verify/${tx_ref}`;
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CHAPA_TOKEN}`
        }
      });

      const verifyData = await verifyResponse.json();

      console.log('🔍 Chapa verification response:', JSON.stringify(verifyData, null, 2));

      // STRICT CHECK: Only approve if Chapa explicitly confirms payment is successful
      // Check both the API response status AND the transaction status
      const apiStatus = verifyData.status?.toLowerCase();
      const transactionStatus = verifyData.data?.status?.toLowerCase();
      
      // Only approve if BOTH conditions are met:
      // 1. API response status is 'success'
      // 2. Transaction status is 'successful' (not pending, failed, or any other status)
      const isSuccessful = 
        apiStatus === 'success' && 
        transactionStatus === 'success' &&
        verifyData.data?.amount > 0; // Additional check: amount must be positive

      if (isSuccessful) {
        // Payment successful - ONLY approve when Chapa confirms success
        console.log('✅ Payment verified as successful by Chapa, updating payment status...');
        console.log('✅ Verification details:', {
          apiStatus,
          transactionStatus,
          amount: verifyData.data?.amount,
          tx_ref: verifyData.data?.tx_ref
        });
        payment.status = 'approved';
        payment.verifiedAt = new Date();
        payment.paymentDate = new Date(verifyData.data?.created_at || verifyData.data?.createdAt || Date.now());
        await payment.save();
        console.log('✅ Payment saved with approved status:', payment._id);

        // Update company payment status and extend payment period
        const company = await Company.findOne({ companyId: payment.companyId });
        
        if (company) {
          const now = new Date();
          company.hasPaid = true;
          company.lastPaymentDate = now;
          company.status = 'active'; // Ensure company is active after payment
          
          // Calculate payment period end based on plan
          let monthsToAdd = 0;
          if (payment.period?.months && payment.period.months.length > 0) {
            monthsToAdd = payment.period.months.length;
          } else {
            // Fallback: default to 1 month if months array is not available
            monthsToAdd = 1;
          }
          
          console.log(`📅 Chapa payment period calculation:`, {
            monthsArrayLength: payment.period?.months?.length || 0,
            monthsToAdd: monthsToAdd,
            currentPaymentPeriodEnd: company.paymentPeriodEnd,
            currentGracePeriodDeadline: company.gracePeriodDeadline,
            currentPaymentDeadline: company.paymentDeadline
          });
          
          if (monthsToAdd > 0) {
            // Calculate base date - only preserve remaining time from actual paid periods
            const baseDate = calculatePaymentBaseDate(company, now);
            
            // Extend payment period from the base date
            company.paymentPeriodEnd = new Date(baseDate);
            company.paymentPeriodEnd.setMonth(company.paymentPeriodEnd.getMonth() + monthsToAdd);
            
            // Update payment deadline to match new period end
            company.paymentDeadline = new Date(company.paymentPeriodEnd);
            
            // Clear grace period deadline since payment is made
            company.gracePeriodDeadline = null;
          }
          
          await company.save();
          console.log(`✅ Company payment status updated for ${company.name}`, {
            paymentPeriodEnd: company.paymentPeriodEnd,
            hasPaid: company.hasPaid,
            monthsAdded: monthsToAdd,
            status: company.status
          });
        }

        // Re-fetch payment to ensure we have the latest data
        const updatedPayment = await Payment.findById(payment._id).populate('submittedBy', 'name username email');

        return res.json({ 
          message: 'Payment verified and approved',
          payment: updatedPayment,
          status: updatedPayment.status,
          verified: true
        });
      } else {
        // Payment failed, not completed, or still pending
        // DO NOT approve - keep as pending or mark as rejected
        console.log('❌ Payment NOT successful:', {
          apiStatus: verifyData.status,
          transactionStatus: verifyData.data?.status,
          message: verifyData.message || 'Payment not completed'
        });
        
        // Only mark as rejected if explicitly failed, otherwise keep as pending
        if (verifyData.data?.status?.toLowerCase() === 'failed' || 
            verifyData.status?.toLowerCase() === 'failed') {
          payment.status = 'rejected';
          payment.rejectionReason = verifyData.message || verifyData.data?.message || 'Payment verification failed';
          await payment.save();
        }
        // If still pending or unknown status, leave it as pending (don't approve)

        return res.json({ 
          message: 'Payment not completed or verification failed',
          payment: payment,
          status: payment.status
        });
      }
    } catch (verifyError) {
      console.error('Chapa verification error:', verifyError);
      return res.status(500).json({ message: 'Failed to verify payment' });
    }
  } catch (error) {
    console.error('Error handling Chapa callback:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/payments/chapa/verify/:tx_ref
// @desc    Verify Chapa payment status (called when user returns from Chapa)
// @access  Private (Admin)
router.get('/chapa/verify/:tx_ref', auth, async (req, res) => {
  try {
    const { tx_ref } = req.params;
    
    console.log('🔍 Verify endpoint called with tx_ref:', tx_ref);
    console.log('🔍 User info:', {
      userId: req.user?.id,
      companyId: req.user?.companyId,
      role: req.user?.role
    });
    
    if (!tx_ref) {
      console.error('❌ Verify endpoint: Missing tx_ref');
      return res.status(400).json({ message: 'Transaction reference is required' });
    }

    // Find payment by Chapa transaction reference
    const payment = await Payment.findOne({ chapaTxRef: tx_ref });
    if (!payment) {
      console.error('❌ Verify endpoint: Payment not found for tx_ref:', tx_ref);
      return res.status(404).json({ message: 'Payment not found' });
    }
    
    console.log('✅ Payment found:', {
      paymentId: payment._id,
      currentStatus: payment.status,
      companyId: payment.companyId,
      amount: payment.amount
    });

    // Only allow company admin to verify their own payments
    if (payment.companyId !== req.user.companyId && req.user.role !== 'superadmin') {
      console.error('❌ Verify endpoint: Unauthorized', {
        paymentCompanyId: payment.companyId,
        userCompanyId: req.user.companyId,
        userRole: req.user.role
      });
      return res.status(403).json({ message: 'Not authorized to verify this payment' });
    }

    // Verify payment with Chapa
    let CHAPA_TOKEN = (process.env.CHAPA_TOKEN || process.env.CHAPA_SECRET_KEY || '').trim();
    if (CHAPA_TOKEN.startsWith('"') && CHAPA_TOKEN.endsWith('"')) {
      CHAPA_TOKEN = CHAPA_TOKEN.slice(1, -1);
    }
    const CHAPA_API = (process.env.CHAPA_API || 'https://api.chapa.co/v1').trim();
    
    try {
      const verifyUrl = `${CHAPA_API}/transaction/verify/${tx_ref}`;
      console.log('🌐 Calling Chapa verify API:', verifyUrl);
      console.log('🔑 Using token:', CHAPA_TOKEN ? CHAPA_TOKEN.substring(0, 15) + '...' : 'MISSING');
      
      const verifyResponse = await fetch(verifyUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${CHAPA_TOKEN}`
        }
      });

      console.log('📡 Chapa verify API response status:', verifyResponse.status);
      const verifyData = await verifyResponse.json();

      console.log('🔍 Chapa verify endpoint response:', JSON.stringify(verifyData, null, 2));

      // STRICT CHECK: Only approve if Chapa explicitly confirms payment is successful
      // Check both the API response status AND the transaction status
      const apiStatus = verifyData.status?.toLowerCase();
      const transactionStatus = verifyData.data?.status?.toLowerCase();
      
      // Only approve if BOTH conditions are met:
      // 1. API response status is 'success'
      // 2. Transaction status is 'successful' (not pending, failed, or any other status)
      const isSuccessful = 
        apiStatus === 'success' && 
        transactionStatus === 'success' &&
        verifyData.data?.amount > 0; // Additional check: amount must be positive

      if (isSuccessful) {
        // Payment successful - ONLY approve when Chapa confirms success
        // Only update if still pending (don't override if already processed)
        if (payment.status === 'pending') {
          console.log('✅ Payment verified as successful by Chapa, updating payment status...');
          console.log('✅ Verification details:', {
            apiStatus,
            transactionStatus,
            amount: verifyData.data?.amount,
            tx_ref: verifyData.data?.tx_ref
          });
          payment.status = 'approved';
          payment.verifiedAt = new Date();
          payment.paymentDate = new Date(verifyData.data?.created_at || verifyData.data?.createdAt || Date.now());
          await payment.save();
          console.log('✅ Payment saved with approved status:', payment._id);

          // Update company payment status
          const company = await Company.findOne({ companyId: payment.companyId });
          
          if (company) {
            const now = new Date();
            company.hasPaid = true;
            company.lastPaymentDate = now;
            company.status = 'active';
            
            let monthsToAdd = 0;
            if (payment.period?.months && payment.period.months.length > 0) {
              monthsToAdd = payment.period.months.length;
            } else {
              // Fallback: default to 1 month if months array is not available
              monthsToAdd = 1;
            }
            
            console.log(`📅 Chapa verify payment period calculation:`, {
              monthsArrayLength: payment.period?.months?.length || 0,
              monthsToAdd: monthsToAdd,
              currentPaymentPeriodEnd: company.paymentPeriodEnd,
              currentGracePeriodDeadline: company.gracePeriodDeadline,
              currentPaymentDeadline: company.paymentDeadline
            });
            
            if (monthsToAdd > 0) {
              // Calculate base date - only preserve remaining time from actual paid periods
              const baseDate = calculatePaymentBaseDate(company, now);
              
              // Extend payment period from the base date
              company.paymentPeriodEnd = new Date(baseDate);
              company.paymentPeriodEnd.setMonth(company.paymentPeriodEnd.getMonth() + monthsToAdd);
              
              // Update payment deadline to match new period end
              company.paymentDeadline = new Date(company.paymentPeriodEnd);
              
              // Clear grace period deadline since payment is made
              company.gracePeriodDeadline = null;
              
              // Clear payment countdown start since payment is made (no longer need 24h reminder)
              company.paymentCountdownStart = null;
            }
            
            await company.save();
            console.log(`✅ Company payment status updated for ${company.name}`, {
              paymentPeriodEnd: company.paymentPeriodEnd,
              hasPaid: company.hasPaid,
              monthsAdded: monthsToAdd,
              status: company.status
            });
          }
        }

        // Re-fetch payment to ensure we have the latest data
        const updatedPayment = await Payment.findById(payment._id).populate('submittedBy', 'name username email');
        
        return res.json({ 
          message: 'Payment verified successfully',
          payment: updatedPayment,
          status: updatedPayment.status,
          verified: true
        });
      } else {
        // Payment not successful
        if (payment.status === 'pending') {
          payment.status = 'rejected';
          payment.rejectionReason = verifyData.message || 'Payment verification failed';
          await payment.save();
        }

        return res.json({ 
          message: 'Payment verification failed',
          payment: payment,
          status: payment.status
        });
      }
    } catch (verifyError) {
      console.error('Chapa verification error:', verifyError);
      return res.status(500).json({ message: 'Failed to verify payment' });
    }
  } catch (error) {
    console.error('Error verifying Chapa payment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

