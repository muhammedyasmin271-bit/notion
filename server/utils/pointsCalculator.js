const User = require('../models/User');
const Company = require('../models/Company');
const PointsHistory = require('../models/PointsHistory');

/**
 * Get priority multiplier for points calculation
 * @param {String} priority - Project priority ('Low', 'Medium', 'High', 'Critical')
 * @returns {Number} Multiplier value
 */
function getPriorityMultiplier(priority) {
  const priorityMap = {
    'Low': 0.5,      // Half points for low priority
    'Medium': 1.0,   // Normal points for medium priority
    'High': 1.5,     // 1.5x points for high priority
    'Critical': 2.0  // Double points for critical priority
  };
  
  return priorityMap[priority] || 1.0; // Default to 1.0 if priority is unknown
}

/**
 * Calculate points based on completion timing (progressive system)
 * @param {Date} completedDate - When the project was completed
 * @param {Date} dueDate - When the project was due
 * @param {String} priority - Project priority ('Low', 'Medium', 'High', 'Critical')
 * @returns {Number} Points to award (negative if late)
 */
function calculatePoints(completedDate, dueDate, priority = 'Medium') {
  // Get priority multiplier
  const priorityMultiplier = getPriorityMultiplier(priority);
  
  let basePoints;
  
  if (!dueDate) {
    // If no due date, give small positive points for completion
    basePoints = 1;
  } else {
    // Calculate difference in days (rounded to nearest day)
    const completed = new Date(completedDate);
    const due = new Date(dueDate);
    
    // Reset time to start of day for accurate day comparison
    completed.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = completed - due;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Progressive points system:
    // Points increase/decrease progressively based on days
    
    if (diffDays < 0) {
      // Completed early - progressive bonus (reduced points)
      // 1 day early: +3 points
      // 2 days early: +4 points
      // 3 days early: +5 points
      // 4 days early: +6 points
      // And so on... (+1 point per additional day early, max at +10)
      const daysEarly = Math.abs(diffDays);
      const baseEarlyPoints = 3; // 1 day early
      const bonusPoints = Math.min((daysEarly - 1) * 1, 7); // +1 per extra day, capped at 7
      basePoints = Math.min(baseEarlyPoints + bonusPoints, 10); // Cap at 10 points
    } else if (diffDays === 0) {
      // On time (completed on due date)
      basePoints = 2;
    } else {
      // Completed late - progressive penalty (reduced penalty)
      // 1 day late: -1 point
      // 2 days late: -2 points
      // 3 days late: -3 points
      // 4 days late: -4 points
      // And so on... (-1 point per additional day late, max at -10)
      const daysLate = diffDays;
      basePoints = Math.max(-1 * daysLate, -10); // -1 per day late, capped at -10
    }
  }
  
  // Apply priority multiplier and round to nearest integer
  // For negative points (late), we still multiply but keep it negative
  const multiplier = basePoints < 0 ? -priorityMultiplier : priorityMultiplier;
  const finalPoints = Math.round(Math.abs(basePoints) * priorityMultiplier) * (basePoints < 0 ? -1 : 1);
  
  return finalPoints;
}

/**
 * Update company rating based on average user points
 * @param {String} companyId - Company ID
 */
async function updateCompanyRating(companyId) {
  try {
    const users = await User.find({ 
      companyId: companyId,
      isActive: true 
    }).select('points');
    
    if (users.length === 0) {
      // No users, set rating to 0
      await Company.findOneAndUpdate(
        { companyId: companyId },
        { rating: 0 }
      );
      return;
    }

    const totalPoints = users.reduce((sum, user) => sum + (user.points || 0), 0);
    const averageRating = totalPoints / users.length;
    
    // Round to 2 decimal places
    const roundedRating = Math.round(averageRating * 100) / 100;
    
    await Company.findOneAndUpdate(
      { companyId: companyId },
      { rating: roundedRating }
    );
    
    console.log(`✅ Updated company rating for ${companyId}: ${roundedRating} (from ${users.length} users)`);
  } catch (error) {
    console.error(`❌ Error updating company rating for ${companyId}:`, error.message);
  }
}

/**
 * Calculate days difference for history tracking
 */
function calculateDaysDifference(completedDate, dueDate) {
  if (!dueDate) return null;
  const completed = new Date(completedDate);
  const due = new Date(dueDate);
  completed.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = completed - due;
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Award/penalize points to users when project is completed
 * @param {Object} project - Project document
 * @param {String} companyId - Company ID
 */
async function awardProjectPoints(project, companyId) {
  try {
    console.log(`🎯 awardProjectPoints called for project ${project._id}, companyId: ${companyId}`);
    console.log(`🎯 Project status: ${project.status}, pointsAwarded: ${project.pointsAwarded}`);
    console.log(`🎯 Project dueDate: ${project.dueDate}, completedDate: ${project.completedDate}`);
    
    // Check if points system is enabled for this company
    const company = await Company.findOne({ companyId: companyId });
    if (!company) {
      console.log(`⚠️ Company not found: ${companyId} - skipping points`);
      return;
    }
    
    // Check if company is paused - if paused, no points should be awarded
    if (company.status === 'paused') {
      console.log(`⏸️ Company ${companyId} (${company.name}) is PAUSED - skipping points award`);
      return;
    }
    
    // Default to true if pointsEnabled is not set (for backward compatibility)
    if (company.pointsEnabled === false) {
      console.log(`⏸️ Points system is DISABLED for company ${companyId} (${company.name}) - skipping points award`);
      return;
    }
    
    // Skip if points already awarded
    if (project.pointsAwarded) {
      console.log(`ℹ️ Points already awarded for project ${project._id}`);
      return;
    }

    // Skip if no completion date (dueDate is optional)
    if (!project.completedDate) {
      console.log(`ℹ️ Skipping points - project ${project._id} missing completedDate (${project.completedDate})`);
      return;
    }

    // Check if project has tasks and verify all are completed before awarding points
    const mongoose = require('mongoose');
    let hasIncompleteTasks = false;
    
    // Check for separate Task documents linked to this project
    try {
      const Task = mongoose.model('Task');
      const totalTasks = await Task.countDocuments({ projectId: project._id });
      
      if (totalTasks > 0) {
        const completedTasks = await Task.countDocuments({ 
          projectId: project._id, 
          completed: true 
        });
        
        console.log(`📋 Project has ${totalTasks} separate tasks, ${completedTasks} completed`);
        
        if (completedTasks < totalTasks) {
          console.log(`⚠️ Project ${project._id} has ${totalTasks - completedTasks} incomplete task(s), but awarding points anyway for project completion`);
          // Don't block points for incomplete tasks - project completion is separate from task completion
          // hasIncompleteTasks = true;
        } else {
          console.log(`✅ All ${totalTasks} separate tasks are completed`);
        }
      }
    } catch (taskError) {
      // Task model might not exist or there's an error, that's okay
      console.log(`ℹ️ Could not check separate Task documents: ${taskError.message}`);
    }
    
    // If there are incomplete tasks, don't award points
    if (hasIncompleteTasks) {
      return;
    }

    const projectPriority = project.priority || 'Medium';
    const points = calculatePoints(project.completedDate, project.dueDate, projectPriority);
    const daysDiff = calculateDaysDifference(project.completedDate, project.dueDate);
    console.log(`📊 Project ${project._id} completed: ${points} points (priority: ${projectPriority}, completed: ${project.completedDate}, due: ${project.dueDate}, days diff: ${daysDiff})`);

    // Get all users who should receive points (assignedTo + viewers + owner)
    const usernamesToAward = [
      ...(project.assignedTo || []),
      ...(project.viewers || [])
    ];

    // Remove duplicates
    const uniqueUsernames = [...new Set(usernamesToAward.map(u => u.toLowerCase().trim()))].filter(u => u);

    // If no assigned users, award points to project owner
    let shouldAwardToOwner = uniqueUsernames.length === 0;
    
    if (uniqueUsernames.length === 0) {
      console.log(`ℹ️ No assigned users found, will award points to project owner`);
    } else {
      console.log(`👥 Awarding ${points} points to users:`, uniqueUsernames);
    }

    // Find users by username or name
    console.log(`🔍 Searching for users with companyId: ${companyId}, usernames:`, uniqueUsernames);
    let users = [];
    
    if (uniqueUsernames.length > 0) {
      users = await User.find({
        companyId: companyId,
        $or: [
          { username: { $in: uniqueUsernames } },
          { name: { $in: uniqueUsernames } }
        ]
      });
    }
    
    // If no assigned users found, or if shouldAwardToOwner is true, add the project owner
    if (shouldAwardToOwner || users.length === 0) {
      console.log(`🔍 Adding project owner to receive points`);
      const owner = await User.findById(project.owner);
      if (owner && owner.companyId === companyId) {
        users.push(owner);
        console.log(`✅ Added project owner: ${owner.name} (${owner.username})`);
      } else {
        console.log(`⚠️ Project owner not found or not in same company`);
      }
    }

    console.log(`🔍 Found ${users.length} users:`, users.map(u => ({ id: u._id, name: u.name, username: u.username, currentPoints: u.points })));

    if (users.length === 0) {
      console.log(`⚠️ No users found for usernames:`, uniqueUsernames);
      console.log(`⚠️ Checking all users in company ${companyId}...`);
      const allCompanyUsers = await User.find({ companyId: companyId }).select('name username');
      console.log(`⚠️ All users in company:`, allCompanyUsers.map(u => ({ name: u.name, username: u.username })));
      project.pointsAwarded = true;
      await project.save();
      return;
    }

    // Create description for history
    let description = '';
    const priorityText = projectPriority !== 'Medium' ? ` (${projectPriority} Priority)` : '';
    if (!project.dueDate) {
      description = `Completed project without due date${priorityText}`;
    } else if (daysDiff < 0) {
      description = `Completed ${Math.abs(daysDiff)} day(s) early${priorityText}`;
    } else if (daysDiff === 0) {
      description = `Completed on time${priorityText}`;
    } else {
      description = `Completed ${daysDiff} day(s) late${priorityText}`;
    }

    // Update points for each user and create history records
    const updatePromises = users.map(async (user) => {
      try {
        const currentPoints = user.points || 0;
        const newPoints = Math.max(0, currentPoints + points); // Ensure points don't go below 0
        console.log(`💰 Updating ${user.name} (${user.username}) points: ${currentPoints} ${points >= 0 ? '+' : ''}${points} = ${newPoints}${currentPoints + points < 0 ? ' (capped at 0)' : ''}`);
        
        user.points = newPoints;
        await user.save();
        console.log(`✅ User ${user.name} saved with new points: ${user.points}`);
        
        // Create points history record
        const historyRecord = await PointsHistory.create({
          userId: user._id,
          companyId: companyId,
          projectId: project._id,
          points: points,
          description: description,
          completedDate: project.completedDate,
          dueDate: project.dueDate,
          daysDifference: daysDiff,
          reversed: false
        });
        
        console.log(`✅ Created PointsHistory record ${historyRecord._id} for user ${user.name}`);
        console.log(`✅ PointsHistory record details:`, {
          id: historyRecord._id.toString(),
          userId: historyRecord.userId?.toString(),
          companyId: historyRecord.companyId,
          companyIdType: typeof historyRecord.companyId,
          companyIdString: String(historyRecord.companyId),
          points: historyRecord.points,
          createdAt: historyRecord.createdAt,
          reversed: historyRecord.reversed
        });
        const pointsDisplay = points >= 0 ? `+${points}` : `${points}`; // Use - sign instead of saying negative
        console.log(`✅ Updated ${user.name} (${user.username}) points: ${currentPoints} → ${newPoints} (${pointsDisplay})`);
      } catch (userError) {
        console.error(`❌ Error updating points for user ${user.name}:`, userError.message);
        console.error(`❌ Error stack:`, userError.stack);
        throw userError;
      }
    });

    await Promise.all(updatePromises);
    console.log(`✅ All users updated successfully`);

    // Mark project as having points awarded
    project.pointsAwarded = true;
    await project.save();
    console.log(`✅ Project ${project._id} marked as pointsAwarded: true`);

    // Update company rating
    await updateCompanyRating(companyId);

    console.log(`✅ Successfully awarded points for project ${project._id}`);
  } catch (error) {
    console.error(`❌ Error awarding points for project ${project._id}:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
    // Don't throw - we don't want to break project updates if points fail
  }
}

/**
 * Reverse points when project status changes from "Done" to another status
 * @param {Object} project - Project document
 * @param {String} companyId - Company ID
 */
async function reverseProjectPoints(project, companyId) {
  try {
    // Skip if points were never awarded
    if (!project.pointsAwarded) {
      console.log(`ℹ️ No points to reverse for project ${project._id} - points were never awarded`);
      return;
    }

    console.log(`🔄 Reversing points for project ${project._id}`);

    // Find all points history records for this project that haven't been reversed
    const pointsRecords = await PointsHistory.find({
      projectId: project._id,
      reversed: false
    });

    if (pointsRecords.length === 0) {
      console.log(`ℹ️ No points records found to reverse for project ${project._id}`);
      // Don't reset pointsAwarded flag - once points are awarded, we keep track that this project was awarded
      // even if reversed, so it won't get points again if re-completed
      return;
    }

    console.log(`👥 Reversing ${pointsRecords.length} points records`);

    // Reverse points for each user
    const reversePromises = pointsRecords.map(async (record) => {
      const user = await User.findById(record.userId);
      if (!user) {
        console.log(`⚠️ User ${record.userId} not found for points reversal`);
        return;
      }

      const currentPoints = user.points || 0;
      const reversedPoints = currentPoints - record.points; // Subtract the original points
      user.points = reversedPoints;
      await user.save();

      // Mark the original record as reversed
      record.reversed = true;
      await record.save();

      // Create a reverse transaction record
      await PointsHistory.create({
        userId: user._id,
        companyId: companyId,
        projectId: project._id,
        points: -record.points, // Negative to show reversal
        description: `Reversed: ${record.description}`,
        completedDate: record.completedDate,
        dueDate: record.dueDate,
        daysDifference: record.daysDifference,
        reversed: false, // This reversal itself is not reversed
        reversedBy: record._id // Link to original transaction
      });

      console.log(`✅ Reversed ${user.name} (${user.username}) points: ${currentPoints} → ${reversedPoints} (${-record.points})`);
    });

    await Promise.all(reversePromises);

    // Keep pointsAwarded = true even after reversal
    // This ensures that once points are awarded for a project, they won't be awarded again
    // even if the project is later uncompleted and re-completed
    // The flag tracks that this project has received points before, not that it currently has active points
    project.completedDate = undefined; // Clear completed date when uncompleted
    await project.save();
    console.log(`ℹ️ Keeping pointsAwarded = true for project ${project._id} to prevent duplicate awards if re-completed`);

    // Update company rating
    await updateCompanyRating(companyId);

    console.log(`✅ Successfully reversed points for project ${project._id}`);
  } catch (error) {
    console.error(`❌ Error reversing points for project ${project._id}:`, error.message);
    // Don't throw - we don't want to break project updates if points fail
  }
}

/**
 * Reverse points when task status changes from "Completed" to another status
 * @param {Object} task - Task document
 * @param {String} companyId - Company ID
 */
async function reverseTaskPoints(task, companyId) {
  try {
    // Skip if points were never awarded
    if (!task.pointsAwarded) {
      console.log(`ℹ️ No points to reverse for task ${task._id} - points were never awarded`);
      return;
    }

    console.log(`🔄 Reversing points for task ${task._id}`);

    // Find all points history records for this task that haven't been reversed
    const pointsRecords = await PointsHistory.find({
      taskId: task._id,
      reversed: false
    });

    if (pointsRecords.length === 0) {
      console.log(`ℹ️ No points records found to reverse for task ${task._id}`);
      // Don't reset pointsAwarded flag - once points are awarded, we keep track that this task was awarded
      // even if reversed, so it won't get points again if re-completed
      return;
    }

    console.log(`👥 Reversing ${pointsRecords.length} points records`);

    // Reverse points for each user (should only be one for tasks)
    const reversePromises = pointsRecords.map(async (record) => {
      const user = await User.findById(record.userId);
      if (!user) {
        console.log(`⚠️ User ${record.userId} not found for points reversal`);
        return;
      }

      const currentPoints = user.points || 0;
      const reversedPoints = currentPoints - record.points; // Subtract the original points
      user.points = Math.max(0, reversedPoints); // Ensure points don't go below 0
      await user.save();

      // Mark the original record as reversed
      record.reversed = true;
      await record.save();

      // Create a reverse transaction record
      await PointsHistory.create({
        userId: user._id,
        companyId: companyId,
        projectId: record.projectId,
        taskId: task._id,
        points: -record.points, // Negative to show reversal
        description: `Reversed: ${record.description}`,
        completedDate: record.completedDate,
        dueDate: record.dueDate,
        daysDifference: record.daysDifference,
        reversed: false, // This reversal itself is not reversed
        reversedBy: record._id // Link to original transaction
      });

      console.log(`✅ Reversed ${user.name} (${user.username}) points: ${currentPoints} → ${user.points} (${-record.points})`);
    });

    await Promise.all(reversePromises);

    // Keep pointsAwarded = true even after reversal
    // This ensures that once points are awarded for a task, they won't be awarded again
    // even if the task is later uncompleted and re-completed
    // The flag tracks that this task has received points before, not that it currently has active points
    console.log(`ℹ️ Keeping pointsAwarded = true for task ${task._id} to prevent duplicate awards if re-completed`);

    // Update company rating
    await updateCompanyRating(companyId);

    console.log(`✅ Successfully reversed points for task ${task._id}`);
  } catch (error) {
    console.error(`❌ Error reversing points for task ${task._id}:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
    // Don't throw - we don't want to break task updates if points fail
  }
}

/**
 * Calculate task points (smaller than project points, varies by priority, affected by completion timing)
 * Tasks get approximately half the points of projects with simpler calculation
 * 
 * Task point calculation (simplified):
 * - Tasks use priority multipliers similar to projects
 * - Base points for tasks are approximately half of project base points
 * - Timing bonuses/penalties are proportional but capped appropriately
 * 
 * Point Calculation Examples (all values are whole numbers, no fractions):
 * 
 * LOW PRIORITY (0.5x multiplier):
 * - On time = 1 point (project: 2 points → 1 * 0.5 = 0.5 → rounded to 1)
 * - 1 day early = 2 points (project: 3 points → 1.5 * 0.5 = 0.75 → rounded to 1, but we use 2 for better reward)
 * - 1 day late = -1 point (same penalty)
 * 
 * MEDIUM PRIORITY (1.0x multiplier):
 * - On time = 1 point (project: 2 points → halved)
 * - 1 day early = 2 points (project: 3 points → halved, rounded up)
 * - 1 day late = -1 point (same penalty)
 * 
 * HIGH PRIORITY (1.5x multiplier):
 * - On time = 2 points (project: 3 points → 2 * 1.5 = 3, halved to ~1.5 → rounded to 2)
 * - 1 day early = 2 points (capped appropriately)
 * - 1 day late = -1 point (minimum penalty)
 * 
 * CRITICAL PRIORITY (2.0x multiplier):
 * - On time = 2 points (project: 4 points → halved)
 * - 1 day early = 3 points (project: 6 points → halved)
 * - 1 day late = -1 point (minimum penalty, but could be -2 for critical)
 */
function calculateTaskPoints(completedDate, dueDate, priority = 'Medium') {
  // Map task priority to format
  const taskPriorityMap = {
    'low': 'Low',
    'medium': 'Medium',
    'high': 'High',
    'Low': 'Low',
    'Medium': 'Medium',
    'High': 'High',
    'Critical': 'Critical',
    'critical': 'Critical'
  };
  const taskPriorityFormatted = taskPriorityMap[priority] || 'Medium';
  
  // Get priority multiplier (same as projects)
  const priorityMultiplier = getPriorityMultiplier(taskPriorityFormatted);
  
  let basePoints;
  
  if (!dueDate) {
    // If no due date, give 0.5 base points for tasks (vs 1 for projects)
    basePoints = 0.5;
  } else {
    // Calculate difference in days (rounded to nearest day)
    const completed = new Date(completedDate);
    const due = new Date(dueDate);
    
    // Reset time to start of day for accurate day comparison
    completed.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    
    const diffTime = completed - due;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    // Simplified task points calculation (approximately half of project points):
    if (diffDays < 0) {
      // Completed early - simplified bonus for tasks
      // 1 day early: 1.5 points base (vs 3 for projects, halved)
      // 2+ days early: +0.5 per additional day, capped at 5 points base
      const daysEarly = Math.abs(diffDays);
      basePoints = Math.min(1.5 + (daysEarly - 1) * 0.5, 5);
    } else if (diffDays === 0) {
      // On time (completed on due date) - 1 point base (vs 2 for projects, halved)
      basePoints = 1;
    } else {
      // Completed late - simplified penalty for tasks
      // 1 day late: -0.5 point base (vs -1 for projects, halved)
      // More days late: -0.5 per day, capped at -5 for tasks
      const daysLate = diffDays;
      basePoints = Math.max(-0.5 * daysLate, -5);
    }
  }
  
  // Apply priority multiplier and round to nearest integer
  // For negative points (late), we still multiply but keep it negative
  let finalPoints = Math.round(Math.abs(basePoints) * priorityMultiplier) * (basePoints < 0 ? -1 : 1);
  
  // Ensure minimum penalty of -1 for any late completion (if task was late but rounding made it 0)
  if (basePoints < 0 && finalPoints >= 0) {
    finalPoints = -1;
  }
  
  return finalPoints;
}

/**
 * Award task points to assignee
 * @param {Object} task - Task document
 * @param {Object} project - Project document
 * @param {String} companyId - Company ID
 */
async function awardTaskPoints(task, project, companyId) {
  try {
    console.log(`🎯 awardTaskPoints called for task ${task._id}, companyId: ${companyId}`);
    console.log(`🎯 Task status: ${task.status}, completed: ${task.completed}, pointsAwarded: ${task.pointsAwarded}`);
    
    // Check if points system is enabled for this company
    const company = await Company.findOne({ companyId: companyId });
    if (!company) {
      console.log(`⚠️ Company not found: ${companyId} - skipping points`);
      return;
    }
    
    // Check if company is paused - if paused, no points should be awarded
    if (company.status === 'paused') {
      console.log(`⏸️ Company ${companyId} (${company.name}) is PAUSED - skipping points award`);
      return;
    }
    
    // Default to true if pointsEnabled is not set (for backward compatibility)
    if (company.pointsEnabled === false) {
      console.log(`⏸️ Points system is DISABLED for company ${companyId} (${company.name}) - skipping points award`);
      return;
    }
    
    // Skip if points already awarded
    if (task.pointsAwarded) {
      console.log(`ℹ️ Points already awarded for task ${task._id}`);
      return;
    }

    // Skip if task is not completed
    if (!task.completed || task.status !== 'Completed') {
      console.log(`ℹ️ Task ${task._id} is not completed - skipping points`);
      return;
    }

    // Skip if no completion date
    if (!task.completedDate) {
      console.log(`ℹ️ Skipping points - task ${task._id} missing completedDate`);
      return;
    }

    // Only award points to assignee (not reporter or creator)
    if (!task.assignee) {
      console.log(`⚠️ Task ${task._id} has no assignee - skipping points`);
      task.pointsAwarded = true;
      await task.save();
      return;
    }

    const userToAward = await User.findById(task.assignee);
    if (!userToAward) {
      console.log(`⚠️ Assignee ${task.assignee} not found for task ${task._id}`);
      task.pointsAwarded = true;
      await task.save();
      return;
    }

    // Verify user is in the same company
    if (userToAward.companyId !== companyId) {
      console.log(`⚠️ User ${userToAward._id} is not in company ${companyId} - skipping points`);
      task.pointsAwarded = true;
      await task.save();
      return;
    }

    // Calculate task points using the same timing logic as projects
    const taskPoints = calculateTaskPoints(task.completedDate, task.dueDate, task.priority);
    const daysDiff = calculateDaysDifference(task.completedDate, task.dueDate);
    
    console.log(`📊 Task ${task._id} completed: ${taskPoints} points (priority: ${task.priority}, completed: ${task.completedDate}, due: ${task.dueDate}, days diff: ${daysDiff})`);
    console.log(`👤 Awarding ${taskPoints} points to assignee: ${userToAward.name} (${userToAward.username})`);

    // Create description for history
    let description = '';
    const priorityText = task.priority && task.priority !== 'medium' ? ` (${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)} Priority)` : '';
    if (!task.dueDate) {
      description = `Completed task without due date${priorityText}`;
    } else if (daysDiff < 0) {
      description = `Completed task ${Math.abs(daysDiff)} day(s) early${priorityText}`;
    } else if (daysDiff === 0) {
      description = `Completed task on time${priorityText}`;
    } else {
      description = `Completed task ${daysDiff} day(s) late${priorityText}`;
    }

    // Update user points
    const currentPoints = userToAward.points || 0;
    const newPoints = Math.max(0, currentPoints + taskPoints); // Ensure points don't go below 0
    console.log(`💰 Updating ${userToAward.name} (${userToAward.username}) points: ${currentPoints} ${taskPoints >= 0 ? '+' : ''}${taskPoints} = ${newPoints}${currentPoints + taskPoints < 0 ? ' (capped at 0)' : ''}`);
    
    userToAward.points = newPoints;
    await userToAward.save();
    console.log(`✅ User ${userToAward.name} saved with new points: ${userToAward.points}`);
    
    // Create points history record
    const historyRecord = await PointsHistory.create({
      userId: userToAward._id,
      companyId: companyId,
      projectId: project._id,
      taskId: task._id,
      points: taskPoints,
      description: description,
      completedDate: task.completedDate,
      dueDate: task.dueDate,
      daysDifference: daysDiff,
      reversed: false
    });
    
    console.log(`✅ Created PointsHistory record ${historyRecord._id} for user ${userToAward.name}`);
    const pointsDisplay = taskPoints >= 0 ? `+${taskPoints}` : `${taskPoints}`;
    console.log(`✅ Updated ${userToAward.name} (${userToAward.username}) points: ${currentPoints} → ${newPoints} (${pointsDisplay})`);

    // Mark task as having points awarded
    task.pointsAwarded = true;
    await task.save();
    console.log(`✅ Task ${task._id} marked as pointsAwarded: true`);

    // Update company rating
    await updateCompanyRating(companyId);

    console.log(`✅ Successfully awarded points for task ${task._id}`);
  } catch (error) {
    console.error(`❌ Error awarding points for task ${task._id}:`, error.message);
    console.error(`❌ Error stack:`, error.stack);
    // Don't throw - we don't want to break task updates if points fail
  }
}

module.exports = {
  calculatePoints,
  updateCompanyRating,
  awardProjectPoints,
  reverseProjectPoints,
  awardTaskPoints,
  reverseTaskPoints
};

