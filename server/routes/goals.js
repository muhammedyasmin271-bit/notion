const express = require('express');
const router = express.Router();
const Goal = require('../models/Goal');
const auth = require('../middleware/auth');

// @route   GET /api/goals
// @desc    Get all goals for authenticated user
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, priority, team, search, sortBy = 'dueDate', sortOrder = 'asc' } = req.query;
    
    let query = { owner: req.user.id, deleted: false };
    
    // Apply filters
    if (status && status !== 'all') query.status = status;
    if (priority && priority !== 'all') query.priority = priority;
    if (team && team !== 'all') query.team = team;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }
    
    // Build sort object
    let sort = {};
    if (sortBy === 'dueDate') {
      sort.dueDate = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'priority') {
      sort.priority = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'createdAt') {
      sort.createdAt = sortOrder === 'desc' ? -1 : 1;
    }
    
    const goals = await Goal.find(query)
      .sort(sort)
      .populate('owner', 'name email')
      .lean();
    
    res.json(goals);
  } catch (error) {
    console.error('Error fetching goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/goals/:id
// @desc    Get goal by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, deleted: false })
      .populate('owner', 'name email')
      .populate('team', 'name email');
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Check if user owns the goal or is a team member
    if (goal.owner.toString() !== req.user.id && !goal.team.includes(req.user.id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    res.json(goal);
  } catch (error) {
    console.error('Error fetching goal:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/goals
// @desc    Create a new goal
// @access  Private
router.post('/', auth, async (req, res) => {
  try {
    const { name, description, status, priority, dueDate, team, tags } = req.body;
    
    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'Goal name is required' });
    }
    
    const newGoal = new Goal({
      name,
      description,
      status: status || 'Not started',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      team: team || '',
      tags: tags || [],
      owner: req.user.id
    });
    
    const goal = await newGoal.save();
    await goal.populate('owner', 'name email');
    
    res.status(201).json(goal);
  } catch (error) {
    console.error('Error creating goal:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update a goal
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, description, status, priority, dueDate, team, tags, progress } = req.body;
    
    let goal = await Goal.findOne({ _id: req.params.id, deleted: false });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Check if user owns the goal
    if (goal.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Update fields
    const updateFields = {};
    if (name !== undefined) updateFields.name = name;
    if (description !== undefined) updateFields.description = description;
    if (status !== undefined) updateFields.status = status;
    if (priority !== undefined) updateFields.priority = priority;
    if (dueDate !== undefined) updateFields.dueDate = dueDate;
    if (team !== undefined) updateFields.team = team;
    if (tags !== undefined) updateFields.tags = tags;
    if (progress !== undefined) updateFields.progress = progress;
    
    goal = await Goal.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).populate('owner', 'name email');
    
    res.json(goal);
  } catch (error) {
    console.error('Error updating goal:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/goals/:id
// @desc    Soft delete a goal (move to trash)
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, deleted: false });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Check if user owns the goal
    if (goal.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Soft delete
    goal.deleted = true;
    goal.deletedAt = new Date();
    await goal.save();
    
    res.json({ message: 'Goal moved to trash' });
  } catch (error) {
    console.error('Error deleting goal:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/goals/:id/restore
// @desc    Restore a deleted goal
// @access  Private
router.patch('/:id/restore', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, deleted: true });
    
    if (!goal) {
      return res.status(404).json({ message: 'Deleted goal not found' });
    }
    
    // Check if user owns the goal
    if (goal.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Restore
    goal.deleted = false;
    goal.deletedAt = undefined;
    await goal.save();
    
    await goal.populate('owner', 'name email');
    res.json(goal);
  } catch (error) {
    console.error('Error restoring goal:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PATCH /api/goals/:id/complete
// @desc    Mark goal as complete
// @access  Private
router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, deleted: false });
    
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    
    // Check if user owns the goal
    if (goal.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    await goal.markComplete();
    await goal.populate('owner', 'name email');
    
    res.json(goal);
  } catch (error) {
    console.error('Error completing goal:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/goals/trash/all
// @desc    Get all deleted goals for user
// @access  Private
router.get('/trash/all', auth, async (req, res) => {
  try {
    const deletedGoals = await Goal.find({ 
      owner: req.user.id, 
      deleted: true 
    }).sort({ deletedAt: -1 });
    
    res.json(deletedGoals);
  } catch (error) {
    console.error('Error fetching deleted goals:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/goals/trash/:id
// @desc    Permanently delete a goal from trash
// @access  Private
router.delete('/trash/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, deleted: true });
    
    if (!goal) {
      return res.status(404).json({ message: 'Deleted goal not found' });
    }
    
    // Check if user owns the goal
    if (goal.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    // Permanent delete
    await Goal.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Goal permanently deleted' });
  } catch (error) {
    console.error('Error permanently deleting goal:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
