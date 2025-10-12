const express = require('express');
const router = express.Router();
const WhiteLabel = require('../models/WhiteLabel');
const auth = require('../middleware/auth');

// Get white-label config by domain or companyId
router.get('/config', async (req, res) => {
  try {
    const { domain, companyId } = req.query;
    
    let config;
    if (domain) {
      config = await WhiteLabel.findOne({ domain, isActive: true });
    } else if (companyId) {
      config = await WhiteLabel.findOne({ companyId, isActive: true });
    }
    
    if (!config) {
      return res.status(404).json({ message: 'Configuration not found' });
    }
    
    res.json(config);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create white-label config (admin only)
router.post('/config', auth, async (req, res) => {
  try {
    const config = new WhiteLabel(req.body);
    await config.save();
    res.status(201).json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update white-label config
router.put('/config/:id', auth, async (req, res) => {
  try {
    const config = await WhiteLabel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(config);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;