const express = require('express');
const router = express.Router();
const MeetingTemplate = require('../models/MeetingTemplate');
const auth = require('../middleware/auth');

// @route   GET /api/meeting-templates
// @desc    Get all meeting templates for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const { type, search, isPublic } = req.query;

        let query = {
            $or: [
                { createdBy: req.user.id, deleted: false },
                { isPublic: true, deleted: false }
            ]
        };

        // Apply filters
        if (type && type !== 'all') query.type = type;
        if (isPublic !== undefined) query.isPublic = isPublic === 'true';
        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }

        const templates = await MeetingTemplate.find(query)
            .sort({ createdAt: -1 })
            .populate('createdBy', 'name email')
            .lean();

        res.json(templates);
    } catch (error) {
        console.error('Error fetching meeting templates:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   GET /api/meeting-templates/:id
// @desc    Get meeting template by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
    try {
        const template = await MeetingTemplate.findOne({
            _id: req.params.id,
            $or: [
                { createdBy: req.user.id },
                { isPublic: true }
            ],
            deleted: false
        }).populate('createdBy', 'name email');

        if (!template) {
            return res.status(404).json({ message: 'Meeting template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Error fetching meeting template:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Meeting template not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   POST /api/meeting-templates
// @desc    Create a new meeting template
// @access  Private
router.post('/', auth, async (req, res) => {
    try {
        const {
            name, description, type, agenda, defaultDuration, tags, isPublic
        } = req.body;

        // Validate required fields
        if (!name) {
            return res.status(400).json({
                message: 'Template name is required'
            });
        }

        const newTemplate = new MeetingTemplate({
            name,
            description: description || '',
            type: type || 'Team Sync',
            agenda: agenda || [],
            defaultDuration: defaultDuration || '30',
            tags: tags || [],
            isPublic: isPublic || false,
            createdBy: req.user.id
        });

        const template = await newTemplate.save();
        await template.populate('createdBy', 'name email');

        res.status(201).json(template);
    } catch (error) {
        console.error('Error creating meeting template:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   PUT /api/meeting-templates/:id
// @desc    Update a meeting template
// @access  Private
router.put('/:id', auth, async (req, res) => {
    try {
        const {
            name, description, type, agenda, defaultDuration, tags, isPublic
        } = req.body;

        let template = await MeetingTemplate.findOne({
            _id: req.params.id,
            createdBy: req.user.id,
            deleted: false
        });

        if (!template) {
            return res.status(404).json({ message: 'Meeting template not found' });
        }

        // Update fields
        const updateFields = {};
        if (name !== undefined) updateFields.name = name;
        if (description !== undefined) updateFields.description = description;
        if (type !== undefined) updateFields.type = type;
        if (agenda !== undefined) updateFields.agenda = agenda;
        if (defaultDuration !== undefined) updateFields.defaultDuration = defaultDuration;
        if (tags !== undefined) updateFields.tags = tags;
        if (isPublic !== undefined) updateFields.isPublic = isPublic;

        template = await MeetingTemplate.findByIdAndUpdate(
            req.params.id,
            { $set: updateFields },
            { new: true, runValidators: true }
        ).populate('createdBy', 'name email');

        res.json(template);
    } catch (error) {
        console.error('Error updating meeting template:', error);
        if (error.name === 'ValidationError') {
            return res.status(400).json({ message: error.message });
        }
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Meeting template not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

// @route   DELETE /api/meeting-templates/:id
// @desc    Soft delete a meeting template
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const template = await MeetingTemplate.findOne({
            _id: req.params.id,
            createdBy: req.user.id,
            deleted: false
        });

        if (!template) {
            return res.status(404).json({ message: 'Meeting template not found' });
        }

        // Soft delete
        template.deleted = true;
        await template.save();

        res.json({ message: 'Meeting template deleted' });
    } catch (error) {
        console.error('Error deleting meeting template:', error);
        if (error.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Meeting template not found' });
        }
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;