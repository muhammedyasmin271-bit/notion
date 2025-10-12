const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const Project = require('../models/Project');
const { requireManager } = require('../middleware/roleAuth');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup Multer for project file uploads
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    const safeOriginal = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${timestamp}-${safeOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB
});

// Map DB project to frontend expected shape
function mapProject(p) {
  const owner = p.owner && typeof p.owner === 'object' ? p.owner : null;
  const ownerId = owner ? String(owner._id) : (p.owner ? String(p.owner) : undefined);
  const ownerName = owner && owner.name ? owner.name : undefined;
  const forPerson = Array.isArray(p.assignedTo) && p.assignedTo.length > 0 ? p.assignedTo.join(', ') : (Array.isArray(p.tags) && p.tags.length > 0 ? p.tags[0] : '');
  const viewers = Array.isArray(p.viewers) && p.viewers.length > 0 ? p.viewers.join(', ') : '';
  const start = p.startDate ? new Date(p.startDate) : null;
  const end = p.dueDate ? new Date(p.dueDate) : null;
  const fmt = (d) => (d ? new Date(d).toISOString().split('T')[0] : undefined);
  return {
    id: String(p._id),
    name: p.title,
    priority: p.priority,
    forPerson: forPerson,
    viewers: viewers,
    notes: p.notes || p.description,
    description: p.description,
    status: p.status,
    ownerUid: ownerId,
    ownerName: ownerName,
    startDate: fmt(start),
    endDate: fmt(end),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
    assignedTo: p.assignedTo || [],
    changeCount: p.changeCount || 0,
    blocks: p.blocks || '',
    content: p.content || '',
    blockData: p.blockData || [],
    tableData: p.tableData || {},
    toggleStates: p.toggleStates || {},
    toggleContent: p.toggleContent || {},
    attachments: p.attachments || []
  };
}

// GET /api/projects - Get all projects (auth required)
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.username;
    const userRole = req.user.role;
    
    let projects;
    
    if (userRole === 'admin') {
      // Admin can see: all assigned/viewer projects + own projects
      projects = await Project.find({
        archived: false,
        $or: [
          { owner: userId },
          { assignedTo: { $exists: true, $ne: [] } },
          { viewers: { $exists: true, $ne: [] } }
        ]
      })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Regular users can see: own projects + assigned projects + viewer projects
      projects = await Project.find({
        archived: false,
        $or: [
          { owner: userId },
          { assignedTo: { $in: [userName, req.user.name] } },
          { viewers: { $in: [userName, req.user.name] } }
        ]
      })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 });
    }
    
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
    const { name, title, status, priority, forPerson, viewers, notes, description, startDate, endDate, blocks, content, blockData, tableData, toggleStates, toggleContent } = req.body || {};

    const safeName = (name && String(name).trim().length > 0) ? String(name).trim() :
      (title && String(title).trim().length > 0) ? String(title).trim() : 'Untitled Project';
    const safeDescription = (typeof description === 'string' && description.trim().length > 0)
      ? description
      : (typeof notes === 'string' && notes.trim().length > 0)
        ? notes
        : 'Project description will be added here.';

    // Parse assigned users and viewers (using usernames)
    const assignedUsers = forPerson ? forPerson.split(',').map(u => u.trim()).filter(u => u) : [];
    const viewerUsers = viewers ? viewers.split(',').map(u => u.trim()).filter(u => u) : [];
    
    console.log('Creating project with assigned users:', assignedUsers);
    console.log('Creating project with viewers:', viewerUsers);

    const project = new Project({
      title: safeName,
      description: safeDescription,
      status: status || 'Not started',
      priority: priority || 'Medium',
      owner: req.user.id,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: endDate ? new Date(endDate) : undefined,
      assignedTo: assignedUsers,
      viewers: viewerUsers,
      tags: forPerson ? [String(forPerson)] : [],
      blocks: blocks || '',
      content: content || '',
      blockData: blockData || [],
      tableData: tableData || {},
      toggleStates: toggleStates || {},
      toggleContent: toggleContent || {}
    });

    await project.save();
    await project.populate('owner', 'name email');

    // Send notifications for initial assignments
    if (assignedUsers.length > 0) {
      const User = require('../models/User');
      const Notification = require('../models/Notification');
      
      for (const assignedUserName of assignedUsers) {
        try {
          const assignedUser = await User.findOne({
            $or: [
              { name: { $regex: new RegExp(assignedUserName, 'i') } },
              { username: { $regex: new RegExp(assignedUserName, 'i') } },
              { email: { $regex: new RegExp(assignedUserName, 'i') } }
            ]
          });
          
          if (assignedUser) {
            console.log(`Creating assignment notification for user: ${assignedUser.name}`);
            
            const notification = new Notification({
              recipient: assignedUser._id,
              sender: req.user.id,
              type: 'project',
              title: 'New Project Assignment',
              message: `You have been assigned to project: ${project.title}`,
              entityType: 'Project',
              entityId: project._id,
              metadata: {
                projectTitle: project.title,
                assignedBy: req.user.name
              }
            });
            
            await notification.save();
            console.log(`Assignment notification created for ${assignedUser.name}`);
          }
        } catch (notificationError) {
          console.error(`Error creating assignment notification:`, notificationError);
        }
      }
    }

    res.status(201).json(mapProject(project));
  } catch (e) {
    console.error('Failed to create project:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/projects/:id - Get project by ID (auth required)
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.username;
    const userRole = req.user.role;
    
    const p = await Project.findById(req.params.id).populate('owner', 'name email');
    if (!p) return res.status(404).json({ message: 'Project not found' });
    
    // Check access permissions (admin, owner, assigned, or viewer)
    if (userRole !== 'admin') {
      const isOwner = p.owner && p.owner._id.toString() === userId;
      const isAssigned = p.assignedTo && Array.isArray(p.assignedTo) && 
        (p.assignedTo.includes(userName) || p.assignedTo.includes(req.user.name));
      const isViewer = p.viewers && Array.isArray(p.viewers) && 
        (p.viewers.includes(userName) || p.viewers.includes(req.user.name));
      
      if (!isOwner && !isAssigned && !isViewer) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }
    
    res.json(mapProject(p));
  } catch (e) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT /api/projects/:id/status - Update project status (all users)
router.put('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body || {};
    const User = require('../models/User');
    const Notification = require('../models/Notification');

    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    const previousStatus = p.status;
    if (status !== undefined) p.status = status;

    // Send notifications to assigned users about status change
    if (status && status !== previousStatus && p.assignedTo && p.assignedTo.length > 0) {
      for (const assignedUserName of p.assignedTo) {
        try {
          const assignedUser = await User.findOne({
            $or: [
              { name: { $regex: new RegExp(assignedUserName, 'i') } },
              { username: { $regex: new RegExp(assignedUserName, 'i') } },
              { email: { $regex: new RegExp(assignedUserName, 'i') } }
            ]
          });
          
          if (assignedUser && assignedUser._id.toString() !== req.user.id) {
            console.log(`Creating status update notification for user: ${assignedUser.name}`);
            
            const notification = new Notification({
              recipient: assignedUser._id,
              sender: req.user.id,
              type: 'project',
              title: 'Project Status Updated',
              message: `Project "${p.title}" status has been updated to ${status}`,
              entityType: 'Project',
              entityId: p._id,
              metadata: {
                projectTitle: p.title,
                previousStatus,
                newStatus: status,
                updatedBy: req.user.name
              }
            });
            
            await notification.save();
            console.log(`Status update notification created successfully for ${assignedUser.name}`);
          }
        } catch (notificationError) {
          console.error(`Error creating status update notification for ${assignedUserName}:`, notificationError);
        }
      }
    }

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

    const { title, description, status, priority, forPerson, viewers, startDate, endDate, blocks, content, blockData, tableData, toggleStates, toggleContent } = req.body;
    console.log('PUT /api/projects/:id - Received data:');
    console.log('blockData:', blockData);
    console.log('tableData:', tableData);
    console.log('toggleStates:', toggleStates);
    
    const isManager = req.user.role === 'manager';
    const User = require('../models/User');
    const Notification = require('../models/Notification');

    // Store previous assignment for comparison
    const previousAssignedTo = [...(p.assignedTo || [])];

    // Allow status updates and blocks/content for all users with access
    if (status) p.status = status;
    if (blocks !== undefined) p.blocks = blocks;
    if (content !== undefined) p.content = content;
    if (blockData !== undefined) p.blockData = blockData;
    if (tableData !== undefined) p.tableData = tableData;
    if (toggleStates !== undefined) p.toggleStates = toggleStates;
    if (toggleContent !== undefined) p.toggleContent = toggleContent;
    
    // Also update notes field if description is provided (for backward compatibility)
    if (description !== undefined) {
      p.notes = description;
      // If blocks/content aren't explicitly provided, try to extract from description
      if (blocks === undefined && content === undefined) {
        p.blocks = description;
        p.content = description;
      }
    }

    // Only managers can update other fields
    if (isManager) {
      if (title) p.title = title;
      if (description !== undefined) p.description = description;
      if (priority) p.priority = priority;
      if (forPerson !== undefined) {
        const assignedUsers = forPerson ? forPerson.split(',').map(u => u.trim()).filter(u => u) : [];
        p.assignedTo = assignedUsers;
        p.tags = forPerson ? [forPerson] : [];
        
        // Send notifications for new assignments
        if (assignedUsers.length > 0) {
          for (const assignedUserName of assignedUsers) {
            // Skip if user was already assigned
            if (previousAssignedTo.includes(assignedUserName)) continue;
            
            try {
              // Find user by name or username
              const assignedUser = await User.findOne({
                $or: [
                  { name: { $regex: new RegExp(assignedUserName, 'i') } },
                  { username: { $regex: new RegExp(assignedUserName, 'i') } },
                  { email: { $regex: new RegExp(assignedUserName, 'i') } }
                ]
              });
              
              if (assignedUser) {
                console.log(`Creating assignment notification for user: ${assignedUser.name} (${assignedUser._id})`);
                
                // Create notification
                const notification = new Notification({
                  recipient: assignedUser._id,
                  sender: req.user.id,
                  type: 'project',
                  title: 'New Project Assignment',
                  message: `You have been assigned to project: ${p.title}`,
                  entityType: 'Project',
                  entityId: p._id,
                  metadata: {
                    projectTitle: p.title,
                    assignedBy: req.user.name
                  }
                });
                
                await notification.save();
                console.log(`Assignment notification created successfully for ${assignedUser.name}`);
              } else {
                console.warn(`Could not find user for assignment: ${assignedUserName}`);
              }
            } catch (notificationError) {
              console.error(`Error creating assignment notification for ${assignedUserName}:`, notificationError);
            }
          }
        }
      }
      if (viewers !== undefined) {
        const viewerUsers = viewers ? viewers.split(',').map(u => u.trim()).filter(u => u) : [];
        p.viewers = viewerUsers;
      }
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
    const { notes, blockData, tableData, toggleStates, toggleContent } = req.body;
    console.log('PATCH /api/projects/:id/notes - Received data:');
    console.log('blockData:', blockData);
    console.log('tableData:', tableData);
    console.log('toggleStates:', toggleStates);

    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });

    // Update notes, blocks, content, and structured data fields
    const updateData = { 
      notes: notes,
      blocks: notes,
      content: notes
    };
    
    if (blockData !== undefined) updateData.blockData = blockData;
    if (tableData !== undefined) updateData.tableData = tableData;
    if (toggleStates !== undefined) updateData.toggleStates = toggleStates;
    if (toggleContent !== undefined) updateData.toggleContent = toggleContent;

    await Project.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
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

    const userName = req.user.username;
    const userRole = req.user.role;
    
    // Allow admins, owners, assigned users, and viewers to create tasks
    if (userRole !== 'admin') {
      const isOwner = project.owner && project.owner.toString() === userId;
      const isAssigned = project.assignedTo && Array.isArray(project.assignedTo) && 
        (project.assignedTo.includes(userName) || project.assignedTo.includes(req.user.name));
      const isViewer = project.viewers && Array.isArray(project.viewers) && 
        (project.viewers.includes(userName) || project.viewers.includes(req.user.name));
      
      if (!isOwner && !isAssigned && !isViewer) {
        return res.status(403).json({ message: 'Not authorized to create tasks in this project' });
      }
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

    // Check if user has permission to update
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const userName = req.user.username;
    const userRole = req.user.role;
    
    // Allow admins, managers, owners, assigned users, and viewers to update tasks
    if (userRole !== 'admin' && userRole !== 'manager') {
      const isOwner = project.owner && project.owner.toString() === userId;
      const isAssigned = project.assignedTo && Array.isArray(project.assignedTo) && 
        (project.assignedTo.includes(userName) || project.assignedTo.includes(req.user.name));
      const isViewer = project.viewers && Array.isArray(project.viewers) && 
        (project.viewers.includes(userName) || project.viewers.includes(req.user.name));
      
      if (!isOwner && !isAssigned && !isViewer) {
        return res.status(403).json({ message: 'Not authorized to update this task' });
      }
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

    // Check if user has permission to delete
    const project = await Project.findById(projectId);
    if (!project) {
      console.log('Project not found:', projectId);
      return res.status(404).json({ message: 'Project not found' });
    }

    const userName = req.user.username;
    const userRole = req.user.role;
    
    // Allow admins, managers, owners, assigned users, and viewers to delete tasks
    if (userRole !== 'admin' && userRole !== 'manager') {
      const isOwner = project.owner && project.owner.toString() === userId;
      const isAssigned = project.assignedTo && Array.isArray(project.assignedTo) && 
        (project.assignedTo.includes(userName) || project.assignedTo.includes(req.user.name));
      const isViewer = project.viewers && Array.isArray(project.viewers) && 
        (project.viewers.includes(userName) || project.viewers.includes(req.user.name));
      
      if (!isOwner && !isAssigned && !isViewer) {
        return res.status(403).json({ message: 'Not authorized to delete this task' });
      }
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

// POST /api/projects/:id/upload - Upload file to project
router.post('/:id/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user has access to upload files
    const userId = req.user.id;
    const userName = req.user.username;
    const userRole = req.user.role;
    
    if (userRole !== 'admin') {
      const isOwner = project.owner && project.owner._id.toString() === userId;
      const isAssigned = project.assignedTo && Array.isArray(project.assignedTo) && 
        (project.assignedTo.includes(userName) || project.assignedTo.includes(req.user.name));
      
      if (!isOwner && !isAssigned) {
        return res.status(403).json({ message: 'Not authorized to upload files to this project' });
      }
    }

    const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
    
    // Add attachment to project
    const attachment = {
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      url: fileUrl,
      uploadedBy: userId,
      uploadedAt: new Date()
    };

    project.attachments.push(attachment);
    await project.save();
    await project.populate('owner', 'name email');

    res.status(201).json({
      message: 'File uploaded successfully',
      attachment,
      project: mapProject(project)
    });
  } catch (error) {
    console.error('Error uploading file to project:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/projects/:projectId/tasks/:taskId/comments - Add comment to task
router.post('/:projectId/tasks/:taskId/comments', auth, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const Task = require('../models/Task');
    const task = await Task.findById(req.params.taskId);
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

// PUT /api/projects/:id/content - Update project content/blocks
router.put('/:id/content', auth, async (req, res) => {
  try {
    const { blocks, content } = req.body || {};
    
    const p = await Project.findById(req.params.id);
    if (!p) return res.status(404).json({ message: 'Project not found' });
    
    // Check if user has access to edit
    const userId = req.user.id;
    const userName = req.user.username;
    const userRole = req.user.role;
    
    if (userRole !== 'admin') {
      const isOwner = p.owner && p.owner._id.toString() === userId;
      const isAssigned = p.assignedTo && Array.isArray(p.assignedTo) && 
        (p.assignedTo.includes(userName) || p.assignedTo.includes(req.user.name));
      
      if (!isOwner && !isAssigned) {
        return res.status(403).json({ message: 'Not authorized to edit this project' });
      }
    }
    
    if (blocks !== undefined) p.blocks = blocks;
    if (content !== undefined) p.content = content;
    
    await p.save();
    await p.populate('owner', 'name email');
    
    res.json(mapProject(p));
  } catch (e) {
    console.error('Failed to update project content:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});