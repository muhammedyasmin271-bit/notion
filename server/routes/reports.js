const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { tenantFilter } = require('../middleware/tenantFilter');
const Report = require('../models/Report');
const User = require('../models/User');
const SharedReport = require('../models/SharedReport');

// Apply auth to all routes first, then tenant filtering
router.use(auth);
router.use(tenantFilter);

// @route   POST /api/reports
// @desc    Create or update report
// @access  Private
router.post('/', async (req, res) => {
  try {
    console.log('📝 Report submission request:', {
      user: req.user.id,
      hasTitle: !!req.body.title,
      hasBlocks: !!req.body.blocks,
      sharedWithCount: req.body.sharedWith ? req.body.sharedWith.length : 0,
      reportId: req.body.reportId
    });

    const { reportId, title, description, blocks, tableData, attachments, sharedWith } = req.body;

    // Validate required fields
    if (!title || !title.trim()) {
      console.log('❌ Validation failed: No title provided');
      return res.status(400).json({ message: 'Report title is required', success: false });
    }

    // Validate sharedWith array if provided
    if (sharedWith && !Array.isArray(sharedWith)) {
      console.log('❌ Validation failed: sharedWith is not an array');
      return res.status(400).json({ message: 'SharedWith must be an array', success: false });
    }

    // Validate user IDs in sharedWith array
    if (sharedWith && sharedWith.length > 0) {
      const mongoose = require('mongoose');
      const invalidIds = sharedWith.filter(id => !mongoose.Types.ObjectId.isValid(id));
      if (invalidIds.length > 0) {
        console.log('❌ Validation failed: Invalid user IDs:', invalidIds);
        return res.status(400).json({ message: 'Invalid user IDs provided', success: false });
      }

      // Check if all users exist
      const existingUsers = await User.find({ _id: { $in: sharedWith } }).select('_id');
      if (existingUsers.length !== sharedWith.length) {
        console.log('❌ Validation failed: Some users do not exist');
        return res.status(400).json({ message: 'Some users do not exist', success: false });
      }
    }

    if (reportId && reportId !== 'new' && reportId !== null) {
      // Update existing report
      console.log('🔄 Updating existing report:', reportId);
      const report = await Report.findById(reportId);
      if (!report) {
        console.log('❌ Report not found for update:', reportId);
        return res.status(404).json({ message: 'Report not found', success: false });
      }
      
      if (report.owner.toString() !== req.user.id) {
        console.log('❌ Unauthorized update attempt:', reportId, 'by user:', req.user.id);
        return res.status(403).json({ message: 'Not authorized to update this report', success: false });
      }

      // Update report fields
      report.title = title.trim();
      report.description = description || '';
      report.blocks = blocks || [];
      report.tableData = tableData || {};
      report.attachments = attachments || [];
      report.sharedWith = Array.isArray(sharedWith) ? sharedWith : [];
      report.status = 'submitted';

      console.log('📝 About to save report with sharedWith:', report.sharedWith);
      await report.save();
      console.log('✅ Report saved successfully with sharedWith:', report.sharedWith);
      console.log('✅ Report updated successfully:', {
        id: report._id,
        title: report.title,
        blocksCount: report.blocks.length,
        sharedWithCount: report.sharedWith.length
      });
      
      // Create SharedReport records for new shares
      if (sharedWith && sharedWith.length > 0) {
        console.log('📤 Processing sharing with users:', sharedWith);
        
        // Remove existing SharedReport records for this report
        const deleteResult = await SharedReport.deleteMany({ 'reportData.reportId': reportId });
        console.log('🗑️ Deleted existing shared records:', deleteResult.deletedCount);
        
        // Create new SharedReport records
        const sharedReports = sharedWith.map(userId => ({
          sharedBy: req.user.id,
          sharedWith: userId,
          reportData: {
            reportId: report._id,
            title: report.title
          }
        }));

        if (sharedReports.length > 0) {
          const insertResult = await SharedReport.insertMany(sharedReports);
          console.log('📋 Created shared records:', insertResult.length);
        }
        
        // Get user names for response
        const users = await User.find({ _id: { $in: sharedWith } }).select('name');
        const userNames = users.map(u => u.name);
        console.log('👥 Shared with users:', userNames);
        
        res.json({ 
          message: `Report updated and shared with: ${userNames.join(', ')}`, 
          report,
          success: true
        });
      } else {
        console.log('📝 Report updated without sharing');
        res.json({ 
          message: 'Report updated successfully', 
          report,
          success: true
        });
      }
    } else {
      // Create new report
      const reportData = {
        title: title.trim(),
        description: description || '',
        blocks: blocks || [],
        tableData: tableData || {},
        attachments: attachments || [],
        owner: req.user.id,
        companyId: req.companyId,
        sharedWith: Array.isArray(sharedWith) ? sharedWith : [],
        status: 'submitted'
      };
      
      console.log('🆕 Creating new report with data:', {
        title: reportData.title,
        companyId: reportData.companyId,
        sharedWithCount: reportData.sharedWith.length,
        sharedWith: reportData.sharedWith
      });
      
      const report = new Report(reportData);
      await report.save();
      console.log('✅ New report saved with sharedWith:', report.sharedWith);
      console.log('✅ New report created successfully:', report._id);
      
      // Create SharedReport records
      if (sharedWith && sharedWith.length > 0) {
        console.log('📤 Processing sharing for new report with users:', sharedWith);
        
        const sharedReports = sharedWith.map(userId => ({
          sharedBy: req.user.id,
          sharedWith: userId,
          reportData: {
            reportId: report._id,
            title: report.title
          }
        }));

        const insertResult = await SharedReport.insertMany(sharedReports);
        console.log('📋 Created shared records for new report:', insertResult.length);
        
        // Get user names for response
        const users = await User.find({ _id: { $in: sharedWith } }).select('name');
        const userNames = users.map(u => u.name);
        console.log('👥 New report shared with users:', userNames);
        
        res.json({ 
          message: `Report created and shared with: ${userNames.join(', ')}`, 
          report,
          success: true
        });
      } else {
        console.log('📝 New report created without sharing');
        res.json({ 
          message: 'Report created successfully', 
          report,
          success: true
        });
      }
    }
  } catch (error) {
    console.error('❌ Report save error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    res.status(500).json({ 
      message: 'Failed to save report. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      success: false
    });
  }
});

// @route   GET /api/reports
// @desc    Get user's reports
// @access  Private
router.get('/', async (req, res) => {
  try {
    const query = { owner: req.user.id };
    if (req.user.role !== 'superadmin') {
      query.companyId = req.companyId;
    }
    
    const reports = await Report.find(query)
      .populate('sharedWith', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ 
      reports,
      success: true
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve reports',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      success: false
    });
  }
});

// @route   GET /api/reports/shared/with-me
// @desc    Get reports shared with current user (NOT owned by them)
// @access  Private
router.get('/shared/with-me', async (req, res) => {
  try {
    let query;
    
    // Get current user to check role
    const currentUser = await User.findById(req.user.id).select('role');
    
    if (currentUser.role === 'admin') {
      // Admins can see all reports that have been shared with anyone IN THEIR COMPANY
      query = { 
        $and: [
          { sharedWith: { $exists: true, $ne: [] } }, // Has shared users
          { owner: { $ne: req.user.id } } // Not owned by admin
        ]
      };
      // Add company filter
      if (req.user.role !== 'superadmin') {
        query.$and.push({ companyId: req.companyId });
      }
    } else {
      // Regular users and managers only see reports shared with them (NOT owned by them)
      query = { 
        $and: [
          { sharedWith: req.user.id },
          { owner: { $ne: req.user.id } }
        ]
      };
      if (req.user.role !== 'superadmin') {
        query.$and.push({ companyId: req.companyId });
      }
    }
    
    console.log('🔵 Fetching shared reports with query:', JSON.stringify(query));
    
    const reports = await Report.find(query)
      .populate('owner', 'name email')
      .populate('sharedWith', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ 
      reports,
      success: true
    });
  } catch (error) {
    console.error('Get shared reports error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve shared reports',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      success: false
    });
  }
});

// @route   DELETE /api/reports/:id
// @desc    Delete report permanently from database
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    console.log('🗑️ Delete report request:', {
      reportId: req.params.id,
      userId: req.user.id
    });

    const report = await Report.findById(req.params.id);
    
    if (!report) {
      console.log('❌ Report not found:', req.params.id);
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user owns the report
    if (report.owner.toString() !== req.user.id) {
      console.log('❌ Unauthorized delete attempt:', req.params.id, 'by user:', req.user.id);
      return res.status(403).json({ message: 'Not authorized to delete this report' });
    }

    // Delete associated SharedReport records first
    const sharedReportDeleteResult = await SharedReport.deleteMany({ 
      'reportData.reportId': req.params.id 
    });
    console.log('🗑️ Deleted shared report records:', sharedReportDeleteResult.deletedCount);

    // Permanently delete the report from database
    await Report.findByIdAndDelete(req.params.id);
    console.log('✅ Report permanently deleted:', req.params.id);

    res.json({ 
      message: 'Report deleted successfully',
      success: true
    });
  } catch (error) {
    console.error('❌ Delete report error:', error);
    res.status(500).json({ 
      message: 'Failed to delete report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      success: false
    });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    console.log('📖 Fetching report:', req.params.id, 'for user:', req.user.id);
    
    const report = await Report.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('sharedWith', 'name email');
    
    if (!report) {
      console.log('❌ Report not found:', req.params.id);
      return res.status(404).json({ message: 'Report not found' });
    }

    // Get current user to check role
    const currentUser = await User.findById(req.user.id).select('role');
    
    // Check if user has access to the report
    const isOwner = report.owner._id.toString() === req.user.id;
    const isSharedWith = report.sharedWith.some(user => user._id.toString() === req.user.id);
    const isAdminViewingSharedReport = currentUser.role === 'admin' && report.sharedWith.length > 0;
    
    const hasAccess = isOwner || isSharedWith || isAdminViewingSharedReport;
    
    if (!hasAccess) {
      console.log('❌ Access denied for report:', req.params.id, 'user:', req.user.id);
      return res.status(403).json({ message: 'Not authorized to view this report' });
    }

    console.log('✅ Report fetched successfully:', {
      id: report._id,
      title: report.title,
      blocksCount: report.blocks ? report.blocks.length : 0,
      sharedWithCount: report.sharedWith ? report.sharedWith.length : 0
    });

    res.json({ 
      report,
      success: true
    });
  } catch (error) {
    console.error('❌ Get report error:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve report',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      success: false
    });
  }
});

// @route   POST /api/reports/:id/share
// @desc    Share report with users
// @access  Private
router.post('/:id/share', async (req, res) => {
  try {
    const { userIds } = req.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ message: 'User IDs are required for sharing' });
    }
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to share this report' });
    }

    // Validate that all user IDs exist IN THE SAME COMPANY
    const userQuery = { _id: { $in: userIds } };
    if (req.user.role !== 'superadmin') {
      userQuery.companyId = req.companyId;
    }
    
    const validUsers = await User.find(userQuery).select('_id name');
    if (validUsers.length !== userIds.length) {
      return res.status(400).json({ message: 'Some users do not exist in your company' });
    }
    
    console.log('✅ Sharing report with', validUsers.length, 'users from company');

    // Add users to sharedWith array (avoid duplicates)
    const currentSharedIds = report.sharedWith.map(id => id.toString());
    const newSharedUsers = userIds.filter(id => !currentSharedIds.includes(id.toString()));
    
    if (newSharedUsers.length > 0) {
      report.sharedWith.push(...newSharedUsers);
      await report.save();

      // Remove existing SharedReport records for this report
      await SharedReport.deleteMany({ 'reportData.reportId': report._id });
      
      // Create new SharedReport records for all shared users
      const allSharedUsers = [...currentSharedIds, ...newSharedUsers];
      const sharedReports = allSharedUsers.map(userId => ({
        sharedBy: req.user.id,
        sharedWith: userId,
        reportData: {
          reportId: report._id,
          title: report.title
        }
      }));

      await SharedReport.insertMany(sharedReports);
    }

    // Get user names for response
    const users = await User.find({ _id: { $in: userIds } }).select('name');
    const userNames = users.map(u => u.name);

    res.json({ 
      message: newSharedUsers.length > 0 
        ? `Report shared successfully with: ${userNames.join(', ')}`
        : `Report was already shared with: ${userNames.join(', ')}`,
      sharedWith: userNames,
      success: true
    });
  } catch (error) {
    console.error('Share report error:', error);
    res.status(500).json({ 
      message: 'Failed to share report. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Server error',
      success: false
    });
  }
});

module.exports = router;