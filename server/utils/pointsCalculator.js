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
    basePoints = 2;
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
      // Completed early - progressive bonus
      // 1 day early: +8 points
      // 2 days early: +10 points
      // 3 days early: +12 points
      // 4 days early: +14 points
      // And so on... (+2 points per additional day early, max at +30)
      const daysEarly = Math.abs(diffDays);
      const baseEarlyPoints = 8; // 1 day early
      const bonusPoints = Math.min((daysEarly - 1) * 2, 22); // +2 per extra day, capped at 22
      basePoints = Math.min(baseEarlyPoints + bonusPoints, 30); // Cap at 30 points
    } else if (diffDays === 0) {
      // On time (completed on due date)
      basePoints = 5;
    } else {
      // Completed late - progressive penalty
      // 1 day late: -2 points
      // 2 days late: -4 points
      // 3 days late: -6 points
      // 4 days late: -8 points
      // And so on... (-2 points per additional day late, max at -30)
      const daysLate = diffDays;
      basePoints = Math.max(-2 * daysLate, -30); // -2 per day late, capped at -30
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
    
    // Skip if points already awarded
    if (project.pointsAwarded) {
      console.log(`ℹ️ Points already awarded for project ${project._id}`);
      return;
    }

    // Skip if no due date and no completion date
    if (!project.dueDate || !project.completedDate) {
      console.log(`ℹ️ Skipping points - project ${project._id} missing dueDate (${project.dueDate}) or completedDate (${project.completedDate})`);
      return;
    }

    const projectPriority = project.priority || 'Medium';
    const points = calculatePoints(project.completedDate, project.dueDate, projectPriority);
    const daysDiff = calculateDaysDifference(project.completedDate, project.dueDate);
    console.log(`📊 Project ${project._id} completed: ${points} points (priority: ${projectPriority}, completed: ${project.completedDate}, due: ${project.dueDate}, days diff: ${daysDiff})`);

    // Get all users who should receive points (assignedTo + viewers, but NOT owner)
    const usernamesToAward = [
      ...(project.assignedTo || []),
      ...(project.viewers || [])
    ];

    // Remove duplicates
    const uniqueUsernames = [...new Set(usernamesToAward.map(u => u.toLowerCase().trim()))].filter(u => u);

    if (uniqueUsernames.length === 0) {
      console.log(`ℹ️ No users to award points to for project ${project._id}`);
      // Mark as awarded anyway to prevent retry
      project.pointsAwarded = true;
      await project.save();
      return;
    }

    console.log(`👥 Awarding ${points} points to users:`, uniqueUsernames);

    // Find users by username or name
    console.log(`🔍 Searching for users with companyId: ${companyId}, usernames:`, uniqueUsernames);
    const users = await User.find({
      companyId: companyId,
      $or: [
        { username: { $in: uniqueUsernames } },
        { name: { $in: uniqueUsernames } }
      ]
    });

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
        const newPoints = currentPoints + points;
        console.log(`💰 Updating ${user.name} (${user.username}) points: ${currentPoints} + ${points} = ${newPoints}`);
        
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
        console.log(`✅ Updated ${user.name} (${user.username}) points: ${currentPoints} → ${newPoints} (${points > 0 ? '+' : ''}${points})`);
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
      // Reset the flag anyway
      project.pointsAwarded = false;
      await project.save();
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

    // Reset project points awarded flag
    project.pointsAwarded = false;
    project.completedDate = undefined; // Clear completed date
    await project.save();

    // Update company rating
    await updateCompanyRating(companyId);

    console.log(`✅ Successfully reversed points for project ${project._id}`);
  } catch (error) {
    console.error(`❌ Error reversing points for project ${project._id}:`, error.message);
    // Don't throw - we don't want to break project updates if points fail
  }
}

module.exports = {
  calculatePoints,
  updateCompanyRating,
  awardProjectPoints,
  reverseProjectPoints
};
