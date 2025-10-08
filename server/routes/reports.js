const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Report = require('../models/Report');
const User = require('../models/User');
const SharedReport = require('../models/SharedReport');

// @route   POST /api/reports
// @desc    Create or update report
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { reportId, title, description, blocks, tableData, attachments, sharedWith } = req.body;

    if (reportId && reportId !== 'new') {
      // Update existing report
      const report = await Report.findById(reportId);
      if (!report) {
        return res.status(404).json({ message: 'Report not found' });
      }
      
      if (report.owner.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized' });
      }

      report.title = title;
      report.description = description;
      report.blocks = blocks;
      report.tableData = tableData;
      report.attachments = attachments;
      report.sharedWith = sharedWith || [];
      report.status = 'submitted';

      await report.save();
      res.json({ message: 'Report updated successfully', report });
    } else {
      // Create new report
      const report = new Report({
        title,
        description,
        blocks,
        tableData,
        attachments,
        owner: req.user.id,
        sharedWith: sharedWith || [],
        status: 'submitted'
      });

      await report.save();
      res.json({ message: 'Report created successfully', report });
    }
  } catch (error) {
    console.error('Report save error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports
// @desc    Get user's reports
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const reports = await Report.find({ owner: req.user.id })
      .populate('sharedWith', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ reports });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/:id
// @desc    Get single report
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('sharedWith', 'name email');
    
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // Check if user owns report or it's shared with them
    const hasAccess = report.owner._id.toString() === req.user.id || 
                     report.sharedWith.some(user => user._id.toString() === req.user.id);
    
    if (!hasAccess) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ report });
  } catch (error) {
    console.error('Get report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/reports/:id/share
// @desc    Share report with users
// @access  Private
router.post('/:id/share', auth, async (req, res) => {
  try {
    const { userIds } = req.body;
    
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    if (report.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add users to sharedWith array
    const newSharedUsers = userIds.filter(id => !report.sharedWith.includes(id));
    report.sharedWith.push(...newSharedUsers);
    await report.save();

    // Create SharedReport records for tracking
    const sharedReports = newSharedUsers.map(userId => ({
      sharedBy: req.user.id,
      sharedWith: userId,
      reportData: {
        reportId: report._id,
        title: report.title
      }
    }));

    await SharedReport.insertMany(sharedReports);

    // Get user names for response
    const users = await User.find({ _id: { $in: userIds } }).select('name');
    const userNames = users.map(u => u.name);

    res.json({ 
      message: `Report shared successfully with: ${userNames.join(', ')}`,
      sharedWith: userNames
    });
  } catch (error) {
    console.error('Share report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/reports/shared/with-me
// @desc    Get reports shared with current user
// @access  Private
router.get('/shared/with-me', auth, async (req, res) => {
  try {
    const reports = await Report.find({ sharedWith: req.user.id })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    
    res.json({ reports });
  } catch (error) {
    console.error('Get shared reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;