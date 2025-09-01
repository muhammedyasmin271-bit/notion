// Web Push Notification utilities

const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLuxazjqAKVXTdtToTnMqz9-VPPbxKBNNx3i3_VFHSBYiZFSp7pSfs'; // Demo key

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Request notification permission
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Register service worker
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return null;
    }
  }
  return null;
};

// Subscribe to push notifications
export const subscribeToPush = async () => {
  const registration = await registerServiceWorker();
  if (!registration) return null;

  try {
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Store subscription in localStorage for demo purposes
    localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    console.log('Push subscription:', subscription);
    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push notifications:', error);
    return null;
  }
};

// Send web push notification (client-side simulation)
export const sendWebPushNotification = async (title, body, data = {}) => {
  // Check if notifications are supported and permitted
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission !== 'granted') {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) {
      console.log('Notification permission denied');
      return false;
    }
  }

  // For demo purposes, show browser notification directly
  // In production, this would be sent from your server
  try {
    const notification = new Notification(title, {
      body: body,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      vibrate: [100, 50, 100],
      data: data,
      requireInteraction: true
    });

    notification.onclick = function() {
      window.focus();
      notification.close();
    };

    return true;
  } catch (error) {
    console.error('Failed to show notification:', error);
    return false;
  }
};

// Initialize web push
export const initializeWebPush = async () => {
  const hasPermission = await requestNotificationPermission();
  if (hasPermission) {
    await subscribeToPush();
    return true;
  }
  return false;
};

// Default export for backward compatibility
const webPushService = {
  requestNotificationPermission,
  registerServiceWorker,
  subscribeToPush,
  sendWebPushNotification,
  initializeWebPush
};

export default webPushService;