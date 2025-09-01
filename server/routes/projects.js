const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Project = require('../models/Project');

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

// POST /api/projects - Create new project (auth required)
router.post('/', auth, async (req, res) => {
  try {
    const { name, status, priority, forPerson, notes, startDate, endDate } = req.body || {};

    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ message: 'Project name is required' });
    }

    const project = new Project({
      title: name,
      description: notes || '',
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

module.exports = router;
