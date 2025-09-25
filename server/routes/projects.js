const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const { requireManager } = require('../middleware/roleAuth');

// Map DB project to frontend expected shape
function mapProject(p) {
  const owner = p.owner && typeof p.owner === 'object' ? p.owner : null;
  const ownerId = owner ? String(owner._id) : (p.owner ? String(p.owner) : undefined);
  const ownerName = owner && owner.name ? owner.name : undefined;
  const forPerson = Array.isArray(p.tags) && p.tags.length > 0 ? p.tags[0] : undefined;
  const start = p.startDate ? new Date(p.startDate) : null;
  const end = p.dueDate ? new Date(p.dueDate) : null;
  const fmt = (d) => (d ? new Date(d).toISOString().split('T')[0] : undefined);
  return {
    id: String(p._id),
    name: p.title,
    priority: p.priority,
    forPerson: forPerson || '',
    notes: p.notes || p.description, // Use notes field first, fallback to description
    description: p.description, // Add description field for frontend compatibility
    status: p.status,
    ownerUid: ownerId,
    ownerName: ownerName,
    startDate: fmt(start),
    endDate: fmt(end),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

// GET /api/projects - Get all projects (auth required)
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ archived: false })
      .populate('owner', 'name email')
      .sort({ createdAt: -1 });
    const out = projects.map(mapProject);
    res.json(out);
  } catch (e) {
    console.error('Failed to fetch projects:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects - Create new project (manager only)
router.post('/', requireManager, async (req, res) => {
  try {
    const { name, title, status, priority, forPerson, notes, description, startDate, endDate } = req.body || {};

    const safeName = (name && String(name).trim().length > 0) ? String(name).trim() :
      (title && String(title).trim().length > 0) ? String(title).trim() : 'Untitled Project';
    const safeDescription = (typeof description === 'string' && description.trim().length > 0)
      ? description
      : (typeof notes === 'string' && notes.trim().length > 0)
        ? notes
        : 'Project description will be added here.';

    const project = new Project({
      title: safeName,
      description: safeDescription,
      status: status || 'Not started',
      priority: priority || 'Medium',
      owner: req.user.id,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: endDate ? new Date(endDate) : undefined,
      tags: forPerson ? [String(forPerson)] : [],
    });

    await project.save();
    await project.populate('owner', 'name email');

    res.status(201).json(mapProject(project));
  } catch (e) {
    console.error('Failed to create project:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id - Get project by ID (auth required)
router.get('/:id', auth, async (req, res) => {
  try {
    const p = await Project.findById(req.params.id).populate('owner', 'name email');
    if (!p) return res.status(404).json({ message: 'Project not found' });
    res.json(mapProject(p));
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id/status - Update project status (all users)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body || {};

    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    if (status !== undefined) p.status = status;

    await p.save();
    await p.populate('owner', 'name email');
    res.json(mapProject(p));
  } catch (e) {
    console.error('Failed to update project status:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id - Update project
router.put('/:id', auth, async (req, res) => {
  try {
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    const { title, description, status, priority, forPerson, startDate, endDate } = req.body;
    const isManager = req.user.role === 'manager';

    // Allow status updates for all users
    if (status) p.status = status;

    // Only managers can update other fields
    if (isManager) {
      if (title) p.title = title;
      if (description !== undefined) p.description = description;
      if (priority) p.priority = priority;
      if (forPerson !== undefined) p.tags = forPerson ? [forPerson] : [];
      if (startDate) p.startDate = new Date(startDate);
      if (endDate) p.dueDate = new Date(endDate);
    }

    await p.save();
    await p.populate('owner', 'name email');
    res.json(mapProject(p));
  } catch (e) {
    console.error('Project update error:', e.message);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// PATCH /api/projects/:id/goal - Update project goal
router.patch('/:id/goal', auth, async (req, res) => {
  try {
    const { goal } = req.body;

    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    // Update only the goal field without full validation
    await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { goal: goal } },
      { new: true, runValidators: false } // Disable full validation
    ).populate('owner', 'name email');

    // Fetch the updated project to return
    const updatedProject = await Project.findById(req.params.id).populate('owner', 'name email');
    res.json(mapProject(updatedProject));
  } catch (e) {
    console.error('Project goal update error:', e.message);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// PATCH /api/projects/:id/notes - Update project notes
router.patch('/:id/notes', auth, async (req, res) => {
  try {
    const { notes } = req.body;

    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    // Update only the notes field without full validation
    await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { notes: notes } },
      { new: true, runValidators: false }
    );

    res.json({ success: true, message: 'Notes saved successfully' });
  } catch (e) {
    console.error('Project notes update error:', e.message);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// PATCH /api/projects/:id/goal - Update project goal
router.patch('/:id/goal', auth, async (req, res) => {
  try {
    const { goal } = req.body;

    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    // Update only the goal field without full validation
    await Project.findByIdAndUpdate(
      req.params.id,
      { $set: { goal: goal } },
      { new: true, runValidators: false }
    );

    res.json({ success: true, message: 'Goal saved successfully' });
  } catch (e) {
    console.error('Project goal update error:', e.message);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// DELETE /api/projects/:id - Delete project (manager only)
router.delete('/:id', requireManager, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (e) {
    console.error('Failed to delete project:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id/data - Get project tasks, comments, activities
router.get('/:id/data', auth, async (req, res) => {
  try {
    console.log('Loading project data for ID:', req.params.id);

    // Find project
    const project = await Project.findById(req.params.id);
    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find tasks for this project
    const Task = require('../models/Task');
    const tasks = await Task.find({ projectId: req.params.id })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    const data = {
      tasks: tasks.map(task => ({
        ...task.toObject(),
        id: task._id.toString(),
        _id: undefined,
        __v: undefined
      })),
      activities: project.activities || []
    };

    console.log(`Returning project data with ${data.tasks.length} tasks`);
    res.json(data);
  } catch (e) {
    console.error('Error loading project data:', e);
    res.status(500).json({ message: 'Server error', error: e.message });
  }
});

// POST /api/projects/:id/tasks - Create a new task
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    const { id: projectId } = req.params;
    const { text, priority = 'medium', dueDate } = req.body;
    const userId = req.user.id;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Task text is required' });
    }

    if (!userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    console.log(`Creating task for project: ${projectId}, user: ${userId}`);

    // Verify project exists and user has access
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner && project.owner.toString() === userId;
    const isTeamMember = project.team && project.team.some(member => member.toString() === userId);

    if (!isOwner && !isTeamMember) {
      return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
    }

    // Create the task
    const Task = require('../models/Task');
    const newTask = new Task({
      text: text.trim(),
      priority: ['low', 'medium', 'high'].includes(priority) ? priority : 'medium',
      dueDate: dueDate || null,
      createdBy: userId,
      projectId: projectId
    });

    await newTask.save();
    await newTask.populate('createdBy', 'name email');
    await newTask.populate('projectId', 'name');

    console.log(`Task created successfully: ${newTask._id}`);
    res.status(201).json(newTask);
  } catch (e) {
    console.error('Error creating task:', e);
    res.status(500).json({
      message: 'Failed to create task',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

// PUT /api/projects/:id/tasks/:taskId - Update task
router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const { id: projectId, taskId } = req.params;
    const { text, completed, priority, dueDate } = req.body;
    const userId = req.user.id;

    console.log(`Updating task ${taskId} in project ${projectId}`);

    // Find the task
    const Task = require('../models/Task');
    const task = await Task.findOne({ _id: taskId, projectId: projectId });

    if (!task) {
      console.log('Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to update (owner or task creator)
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner && project.owner.toString() === userId;
    const isCreator = task.createdBy && task.createdBy.toString() === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Update task fields
    if (text !== undefined) task.text = text.trim();
    if (completed !== undefined) task.completed = Boolean(completed);
    if (priority !== undefined) task.priority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('createdBy', 'name email');
    await task.populate('projectId', 'name');

    console.log(`Task ${taskId} updated successfully`);
    res.json(task);
  } catch (e) {
    console.error('Error updating task:', e);
    res.status(500).json({
      message: 'Failed to update task',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

// DELETE /api/projects/:id/tasks/:taskId - Delete task
router.delete('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const { id: projectId, taskId } = req.params;
    const userId = req.user.id;

    console.log(`Deleting task ${taskId} from project ${projectId}`);

    // Find and delete the task
    const Task = require('../models/Task');
    const task = await Task.findOne({ _id: taskId, projectId: projectId });

    if (!task) {
      console.log('Task not found:', taskId);
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to delete (owner or task creator)
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const isOwner = project.owner && project.owner.toString() === userId;
    const isCreator = task.createdBy && task.createdBy.toString() === userId;

    if (!isOwner && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    // Delete the task
    await Task.findByIdAndDelete(taskId);

    console.log(`Task ${taskId} deleted successfully`);
    res.json({
      success: true,
      message: 'Task deleted successfully',
      taskId: taskId
    });
  } catch (e) {
    console.error('Error deleting task:', e);
    res.status(500).json({
      message: 'Failed to delete task',
      error: process.env.NODE_ENV === 'development' ? e.message : undefined
    });
  }
});

module.exports = router;
