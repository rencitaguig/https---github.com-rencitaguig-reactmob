import * as SecureStore from 'expo-secure-store';

export const addNotificationToHistory = async (notification) => {
  try {
    const existingHistory = await SecureStore.getItemAsync('notificationsHistory');
    const notifications = existingHistory ? JSON.parse(existingHistory) : [];
    
    // Add timestamp and read status if not present
    const enhancedNotification = {
      ...notification,
      timestamp: notification.timestamp || new Date().toISOString(),
      read: false
    };
    
    notifications.unshift(enhancedNotification);
    
    // Keep only last 50 notifications
    const trimmedNotifications = notifications.slice(0, 50);
    
    await SecureStore.setItemAsync('notificationsHistory', JSON.stringify(trimmedNotifications));
    return true;
  } catch (error) {
    console.error('Error adding notification to history:', error);
    return false;
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const existingHistory = await SecureStore.getItemAsync('notificationsHistory');
    if (!existingHistory) return false;

    const notifications = JSON.parse(existingHistory);
    const updatedNotifications = notifications.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    );

    await SecureStore.setItemAsync('notificationsHistory', JSON.stringify(updatedNotifications));
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};
