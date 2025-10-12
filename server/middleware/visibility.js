const mongoose = require('mongoose');

/**
 * Visibility middleware for role-based access control
 * Rules:
 * - Owner can always see their own items
 * - Admin can see items that are public OR shared with someone
 * - Regular users can only see items shared with them or public items
 * - Private items (not shared) are only visible to owner
 */

const getVisibilityFilter = (userId, userRole) => {
  const filter = {};
  
  if (userRole === 'admin') {
    // Admin can see: own items + public items + items shared with anyone
    filter.$or = [
      { owner: userId },
      { createdBy: userId },
      { author: userId },
      { isPublic: true },
      { 'sharedWith.0': { $exists: true } }, // Has at least one share
      { 'assignedTo.0': { $exists: true } }, // Has at least one assignment
      { 'team.0': { $exists: true } } // Has team members
    ];
  } else {
    // Regular users can see: own items + items shared with them + public items
    filter.$or = [
      { owner: userId },
      { createdBy: userId },
      { author: userId },
      { isPublic: true },
      { sharedWith: { $elemMatch: { user: userId } } },
      { assignedTo: userId },
      { team: userId }
    ];
  }
  
  return filter;
};

const applyVisibilityFilter = (query, userId, userRole) => {
  const visibilityFilter = getVisibilityFilter(userId, userRole);
  return query.find(visibilityFilter);
};

module.exports = {
  getVisibilityFilter,
  applyVisibilityFilter
};