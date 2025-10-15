const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const auth = require('../middleware/auth');
const { tenantFilter } = require('../middleware/tenantFilter');

// Apply tenant filtering to all routes
router.use(tenantFilter);

// Get all tasks (DISABLED - tasks are project-specific)
router.get('/', auth, async (req, res) => {
  res.status(400).json({ 
    message: 'Tasks are project-specific. Use /api/projects/:id/data to get project tasks.' 
  });
});

// Get tasks for a specific project
router.get('/project/:projectId', auth, async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user?.id;
    
    console.log(`Fetching tasks for project: ${projectId}, user: ${userId}`);
    
    if (!projectId) {
      console.error('No project ID provided');
      return res.status(400).json({ message: 'Project ID is required' });
    }

    if (!userId) {
      console.error('No user ID in request');
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`Looking up tasks for project ${projectId} and user ${userId}`);
    
    const tasks = await Task.find({ 
      $or: [
        { createdBy: userId, projectId: projectId },
        { createdBy: userId, 'projectId._id': projectId } // Handle populated projectId
      ]
    })
    .populate('createdBy', 'name email')
    .populate('projectId', 'name')
    .sort({ createdAt: -1 });
    
    console.log(`Found ${tasks.length} tasks for project ${projectId}`);
    res.json(tasks || []);
  } catch (error) {
    console.error('Error fetching project tasks:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new task (DISABLED - use project-specific endpoint)
router.post('/', auth, async (req, res) => {
  res.status(400).json({ 
    message: 'Tasks must be created within a project. Use /api/projects/:id/tasks endpoint instead.' 
  });
});

// Update a task
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text, completed } = req.body;
    
    if (!id) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const task = await Task.findOne({ _id: id, createdBy: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    if (text !== undefined) {
      const trimmedText = text.trim();
      if (!trimmedText) {
        return res.status(400).json({ message: 'Task text cannot be empty' });
      }
      task.text = trimmedText;
    }
    
    if (completed !== undefined) {
      task.completed = Boolean(completed);
    }

    await task.save();
    await task.populate('createdBy', 'name email');
    
    res.json(task);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a task
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ message: 'Task ID is required' });
    }

    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const task = await Task.findOneAndDelete({ _id: id, createdBy: req.user.id });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found or access denied' });
    }

    res.json({ message: 'Task deleted successfully', taskId: id });
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid task ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add comment to task
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    const comment = {
      text: text.trim(),
      author: req.user.id,
      createdAt: new Date()
    };

    task.comments.push(comment);
    await task.save();
    await task.populate('comments.author', 'name email');
    
    res.json(task);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;