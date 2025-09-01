// Notification utility functions
import { sendWebPushNotification } from './webPush';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const createNotification = async (recipientId, type, title, message, fromUserId = null, fromUserName = null, entityType = null, entityId = null) => {
  try {
    // Save to database first
    const token = localStorage.getItem('token');
    if (token) {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          recipientId,
          type,
          title,
          message,
          entityType,
          entityId,
          metadata: {
            fromUserId,
            fromUserName
          }
        })
      });

      if (response.ok) {
        const dbNotification = await response.json();
        
        // Also save to localStorage for offline access
        const localNotification = {
          id: dbNotification._id,
          recipientId,
          type,
          title,
          message,
          fromUserId,
          fromUserName,
          read: false,
          createdAt: dbNotification.createdAt,
          readAt: null
        };

        const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const updatedNotifications = [localNotification, ...existingNotifications];
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        
        // Trigger event for real-time updates
        window.dispatchEvent(new CustomEvent('notifications-updated'));
        
        // Send web push notification
        await sendWebPushNotification(title, message, {
          type,
          recipientId,
          fromUserName,
          id: dbNotification._id
        });
        
        return dbNotification;
      }
    }
    
    // Fallback to localStorage only if database save fails
    const notification = {
      id: Date.now() + Math.random(),
      recipientId,
      type,
      title,
      message,
      fromUserId,
      fromUserName,
      read: false,
      createdAt: new Date().toISOString(),
      readAt: null
    };

    const existingNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = [notification, ...existingNotifications];
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    
    window.dispatchEvent(new CustomEvent('notifications-updated'));
    
    await sendWebPushNotification(title, message, {
      type,
      recipientId,
      fromUserName,
      id: notification.id
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (userId) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await fetch(`${API_BASE_URL}/notifications`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const dbNotifications = await response.json();
        // Update localStorage with fresh data
        const localNotifications = dbNotifications.map(n => ({
          id: n._id,
          recipientId: n.recipient,
          type: n.type,
          title: n.title,
          message: n.message,
          fromUserId: n.sender?._id,
          fromUserName: n.sender?.name,
          read: n.read,
          createdAt: n.createdAt,
          readAt: n.readAt
        }));
        localStorage.setItem('notifications', JSON.stringify(localNotifications));
        return localNotifications;
      }
    }
    
    // Fallback to localStorage
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(notification => notification.recipientId === userId);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    // Fallback to localStorage
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    return notifications.filter(notification => notification.recipientId === userId);
  }
};

export const getUnreadCount = async (userId) => {
  try {
    const userNotifications = await getUserNotifications(userId);
    return userNotifications.filter(notification => !notification.read).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

export const markAsRead = async (notificationId) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        // Update localStorage
        const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
        const updatedNotifications = notifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true, readAt: new Date().toISOString() }
            : notification
        );
        localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
        window.dispatchEvent(new CustomEvent('notifications-updated'));
        return;
      }
    }
    
    // Fallback to localStorage only
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId 
        ? { ...notification, read: true, readAt: new Date().toISOString() }
        : notification
    );
    localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
    window.dispatchEvent(new CustomEvent('notifications-updated'));
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// Project-specific notification functions
export const notifyProjectAssignment = async (assignedUserId, assignedUserName, projectTitle, assignedByUserId, assignedByUserName) => {
  return await createNotification(
    assignedUserId,
    'project',
    'New Project Assignment',
    `You have been assigned to project: ${projectTitle}`,
    assignedByUserId,
    assignedByUserName
  );
};

export const notifyProjectUpdate = async (userId, userName, projectTitle, updateType, updatedByUserId, updatedByUserName) => {
  return await createNotification(
    userId,
    'project',
    'Project Updated',
    `Project "${projectTitle}" has been ${updateType}`,
    updatedByUserId,
    updatedByUserName
  );
};

export const notifyGoalAssignment = async (assignedUserId, assignedUserName, goalTitle, assignedByUserId, assignedByUserName) => {
  return await createNotification(
    assignedUserId,
    'goal',
    'New Goal Assignment',
    `You have been assigned to goal: ${goalTitle}`,
    assignedByUserId,
    assignedByUserName
  );
};

// Legacy function name for backward compatibility
export const addNotification = createNotification;

// Mark all notifications as read for a user
export const markAllNotificationsRead = (userId) => {
  const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
  const updatedNotifications = notifications.map(notification => 
    notification.recipientId === userId
      ? { ...notification, read: true, readAt: new Date().toISOString() }
      : notification
  );
  
  localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
  window.dispatchEvent(new CustomEvent('notifications-updated'));
};