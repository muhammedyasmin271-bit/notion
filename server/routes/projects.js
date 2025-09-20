const express = require('express');
const router = express.Router();
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
    notes: p.description,
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

// PUT /api/projects/:id - Update project (manager only)
router.put('/:id', requireManager, async (req, res) => {
  try {
    const { name, title, notes, description, status, priority, forPerson, startDate, endDate } = req.body || {};

    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    if (title !== undefined) p.title = title;
    if (name !== undefined) p.title = name;
    // Handle both notes and description fields for compatibility
    if (notes !== undefined) p.description = notes;
    if (description !== undefined) p.description = description;
    if (status !== undefined) p.status = status;
    if (priority !== undefined) p.priority = priority;
    if (forPerson !== undefined) p.tags = forPerson ? [String(forPerson)] : [];
    if (startDate !== undefined) p.startDate = startDate ? new Date(startDate) : undefined;
    if (endDate !== undefined) p.dueDate = endDate ? new Date(endDate) : undefined;

    await p.save();
    await p.populate('owner', 'name email');
    res.json(mapProject(p));
  } catch (e) {
    console.error('Failed to update project:', e.message);
    res.status(500).json({ message: 'Server error' });
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
    const project = await Project.findById(req.params.id);
    if (!project) {
      console.log('Project not found:', req.params.id);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    const data = {
      tasks: project.tasks || [],
      comments: project.comments || [],
      activities: project.activities || []
    };
    console.log('Returning project data:', data);
    res.json(data);
  } catch (e) {
    console.error('Error loading project data:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/tasks - Add task
router.post('/:id/tasks', auth, async (req, res) => {
  try {
    console.log('Adding task to project:', req.params.id, req.body);
    const project = await Project.findById(req.params.id);
    if (!project) {
      console.log('Project not found for task add:', req.params.id);
      return res.status(404).json({ message: 'Project not found' });
    }
    
    if (!project.tasks) project.tasks = [];
    project.tasks.push(req.body);
    await project.save();
    console.log('Task added successfully, total tasks:', project.tasks.length);
    
    res.json(req.body);
  } catch (e) {
    console.error('Error adding task:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id/tasks/:taskId - Update task
router.put('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    const taskIndex = project.tasks.findIndex(t => t.id == req.params.taskId);
    if (taskIndex === -1) return res.status(404).json({ message: 'Task not found' });
    
    Object.assign(project.tasks[taskIndex], req.body);
    await project.save();
    
    res.json(project.tasks[taskIndex]);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/projects/:id/tasks/:taskId - Delete task
router.delete('/:id/tasks/:taskId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    project.tasks = project.tasks.filter(t => t.id != req.params.taskId);
    await project.save();
    
    res.json({ message: 'Task deleted' });
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:id/comments - Add comment
router.post('/:id/comments', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    
    if (!project.comments) project.comments = [];
    project.comments.push(req.body);
    await project.save();
    
    res.json(req.body);
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
