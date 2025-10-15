const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const { tenantFilter } = require('../middleware/tenantFilter');
const Project = require('../models/Project');
const { requireManager } = require('../middleware/roleAuth');

// Apply auth to all routes first, then tenant filtering
router.use(auth);
router.use(tenantFilter);

const multer = require('multer');
const path = require('path');
const fs = require('fs');
const emailService = require('../services/emailService');
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
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.username;
    const userRole = req.user.role;
    
    console.log('🔵 GET /api/projects - User:', userName, 'Role:', userRole, 'CompanyId:', req.companyId);
    
    let projects;
    const baseQuery = { archived: false };
    
    // Add company filter (skip for superadmin)
    if (userRole !== 'superadmin') {
      baseQuery.companyId = req.companyId;
    }
    
    console.log('🔵 Query filter:', JSON.stringify(baseQuery));
    
    if (userRole === 'admin' || userRole === 'superadmin') {
      // Admin can see: all company projects
      projects = await Project.find(baseQuery)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 });
    } else if (userRole === 'manager') {
      // Managers can see: own projects + assigned projects + viewer projects
      projects = await Project.find({
        ...baseQuery,
        $or: [
          { owner: userId },
          { assignedTo: { $in: [userName, req.user.name] } },
          { viewers: { $in: [userName, req.user.name] } }
        ]
      })
        .populate('owner', 'name email')
        .sort({ createdAt: -1 });
    } else {
      // Regular users can ONLY see their own projects
      projects = await Project.find({
        ...baseQuery,
        owner: userId
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

// POST /api/projects - Create new project (all authenticated users)
router.post('/', async (req, res) => {
  try {
    const { name, title, status, priority, forPerson, viewers, notes, description, startDate, endDate, blocks, content, blockData, tableData, toggleStates, toggleContent } = req.body || {};

    const safeName = (name && String(name).trim().length > 0) ? String(name).trim() :
      (title && String(title).trim().length > 0) ? String(title).trim() : 'Untitled Project';
    const safeDescription = (typeof description === 'string' && description.trim().length > 0)
      ? description
      : (typeof notes === 'string' && notes.trim().length > 0)
        ? notes
        : 'Project description will be added here.';

    // Only managers/admins can assign projects to others
    const canAssignToOthers = ['admin', 'manager'].includes(req.user.role);
    
    // Parse assigned users and viewers (using usernames) - only if user has permission
    const assignedUsers = (canAssignToOthers && forPerson) ? forPerson.split(',').map(u => u.trim()).filter(u => u) : [];
    const viewerUsers = (canAssignToOthers && viewers) ? viewers.split(',').map(u => u.trim()).filter(u => u) : [];
    
    console.log('🔵 Creating project:', safeName);
    console.log('🔵 User:', req.user.username, 'CompanyId:', req.companyId);
    console.log('🔵 Assigned users:', assignedUsers);
    console.log('🔵 Viewers:', viewerUsers);

    const project = new Project({
      title: safeName,
      description: safeDescription,
      status: status || 'Not started',
      priority: priority || 'Medium',
      owner: req.user.id,
      companyId: req.companyId,
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
            
            // Send email notification
            if (assignedUser.email && assignedUser.emailNotifications) {
              try {
                await emailService.sendEmail({
                  to: assignedUser.email,
                  subject: `New Project Assignment: ${project.title}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #667eea;">📊 New Project Assignment</h2>
                      <p>Hello ${assignedUser.name},</p>
                      <p><strong>${req.user.name}</strong> has assigned you to a new project:</p>
                      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">${project.title}</h3>
                        <p>${project.description}</p>
                        <p><strong>Priority:</strong> ${project.priority}</p>
                        <p><strong>Status:</strong> ${project.status}</p>
                        ${project.dueDate ? `<p><strong>Due Date:</strong> ${new Date(project.dueDate).toLocaleDateString()}</p>` : ''}
                      </div>
                      <p>Please check your Notion App to view the project details and start working on it.</p>
                      <p>Best regards,<br>Notion App Team</p>
                    </div>
                  `
                });
                console.log(`Project assignment email sent to ${assignedUser.email}`);
              } catch (emailError) {
                console.error(`Error sending project assignment email to ${assignedUser.email}:`, emailError.message);
              }
            }
            
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
router.get('/:id', async (req, res) => {
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
router.put('/:id/status', async (req, res) => {
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
            
            // Send email notification for status update
            if (assignedUser.email && assignedUser.emailNotifications) {
              try {
                const statusColors = {
                  'Not started': '#999',
                  'In Progress': '#2196F3',
                  'Done': '#4CAF50',
                  'On hold': '#FF9800',
                  'Cancelled': '#F44336'
                };
                const statusColor = statusColors[status] || '#667eea';
                
                await emailService.sendEmail({
                  to: assignedUser.email,
                  subject: `Project Status Updated: ${p.title}`,
                  html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                      <h2 style="color: #667eea;">📊 Project Status Updated</h2>
                      <p>Hello ${assignedUser.name},</p>
                      <p><strong>${req.user.name}</strong> updated the status of <strong>${p.title}</strong>:</p>
                      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>Previous Status:</strong> <span style="color: ${statusColors[previousStatus] || '#999'}">${previousStatus}</span></p>
                        <p><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${status}</span></p>
                      </div>
                      <p>Please check your Notion App for more details.</p>
                      <p>Best regards,<br>Notion App Team</p>
                    </div>
                  `
                });
                console.log(`Status update email sent to ${assignedUser.email}`);
              } catch (emailError) {
                console.error(`Error sending status update email to ${assignedUser.email}:`, emailError.message);
              }
            }
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
router.put('/:id', async (req, res) => {
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
router.patch('/:id/goal', async (req, res) => {
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
router.patch('/:id/notes', async (req, res) => {
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
router.patch('/:id/goal', async (req, res) => {
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
router.get('/:id/data', async (req, res) => {
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
router.post('/:id/tasks', async (req, res) => {
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

    // Send email notification to project owner and assigned users
    try {
      const User = require('../models/User');
      const projectWithOwner = await Project.findById(projectId).populate('owner', 'name email emailNotifications');
      
      // Notify project owner if they're not the task creator
      if (projectWithOwner.owner && projectWithOwner.owner._id.toString() !== userId) {
        if (projectWithOwner.owner.email && projectWithOwner.owner.emailNotifications) {
          await emailService.sendEmail({
            to: projectWithOwner.owner.email,
            subject: `New Task Created: ${newTask.text}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #667eea;">📋 New Task Created</h2>
                <p>Hello ${projectWithOwner.owner.name},</p>
                <p><strong>${req.user.name}</strong> created a new task in project <strong>${project.title}</strong>:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <h3 style="margin-top: 0; color: #333;">${newTask.text}</h3>
                  <p><strong>Priority:</strong> ${newTask.priority}</p>
                  <p><strong>Due Date:</strong> ${newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString() : 'Not set'}</p>
                </div>
                <p>Best regards,<br>Notion App Team</p>
              </div>
            `
          });
        }
      }

      // Notify assigned users about the new task
      if (project.assignedTo && project.assignedTo.length > 0) {
        const assignedUsers = await User.find({
          $or: [
            { username: { $in: project.assignedTo } },
            { name: { $in: project.assignedTo } }
          ],
          emailNotifications: true,
          _id: { $ne: userId }
        }).select('name email emailNotifications');

        for (const user of assignedUsers) {
          if (user.email && user.emailNotifications) {
            await emailService.sendEmail({
              to: user.email,
              subject: `New Task in ${project.title}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #667eea;">📋 New Task</h2>
                  <p>Hello ${user.name},</p>
                  <p>A new task was created in <strong>${project.title}</strong>:</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #333;">${newTask.text}</h3>
                    <p><strong>Priority:</strong> ${newTask.priority}</p>
                    <p><strong>Due Date:</strong> ${newTask.dueDate ? new Date(newTask.dueDate).toLocaleDateString() : 'Not set'}</p>
                  </div>
                  <p>Best regards,<br>Notion App Team</p>
                </div>
              `
            });
          }
        }
      }
    } catch (emailError) {
      console.error('Error sending task creation email:', emailError.message);
    }

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
router.put('/:id/tasks/:taskId', async (req, res) => {
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
    const wasCompleted = task.completed;
    if (text !== undefined) task.text = text.trim();
    if (completed !== undefined) task.completed = Boolean(completed);
    if (priority !== undefined) task.priority = ['low', 'medium', 'high'].includes(priority) ? priority : 'medium';
    if (dueDate !== undefined) task.dueDate = dueDate || null;

    await task.save();
    await task.populate('createdBy', 'name email');
    await task.populate('projectId', 'name');

    // Send email notification when task is completed
    if (!wasCompleted && task.completed) {
      try {
        const User = require('../models/User');
        const projectWithOwner = await Project.findById(projectId).populate('owner', 'name email emailNotifications');
        
        // Notify project owner
        if (projectWithOwner.owner && projectWithOwner.owner._id.toString() !== userId) {
          if (projectWithOwner.owner.email && projectWithOwner.owner.emailNotifications) {
            await emailService.sendEmail({
              to: projectWithOwner.owner.email,
              subject: `Task Completed: ${task.text}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #4CAF50;">✅ Task Completed</h2>
                  <p>Hello ${projectWithOwner.owner.name},</p>
                  <p><strong>${req.user.name}</strong> completed a task in <strong>${project.title}</strong>:</p>
                  <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                    <h3 style="margin-top: 0; color: #333;">${task.text}</h3>
                    <p style="color: #4CAF50; font-weight: bold;">✓ Completed</p>
                  </div>
                  <p>Best regards,<br>Notion App Team</p>
                </div>
              `
            });
          }
        }

        // Notify task creator if different from updater
        if (task.createdBy && task.createdBy._id.toString() !== userId) {
          if (task.createdBy.email && task.createdBy.emailNotifications) {
            await emailService.sendEmail({
              to: task.createdBy.email,
              subject: `Your Task Was Completed: ${task.text}`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #4CAF50;">✅ Task Completed</h2>
                  <p>Hello ${task.createdBy.name},</p>
                  <p><strong>${req.user.name}</strong> completed your task:</p>
                  <div style="background-color: #e8f5e9; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                    <h3 style="margin-top: 0; color: #333;">${task.text}</h3>
                  </div>
                  <p>Best regards,<br>Notion App Team</p>
                </div>
              `
            });
          }
        }
      } catch (emailError) {
        console.error('Error sending task completion email:', emailError.message);
      }
    }

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
router.delete('/:id/tasks/:taskId', async (req, res) => {
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
router.post('/:id/upload', upload.single('file'), async (req, res) => {
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
router.post('/:projectId/tasks/:taskId/comments', async (req, res) => {
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
router.put('/:id/content', async (req, res) => {
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