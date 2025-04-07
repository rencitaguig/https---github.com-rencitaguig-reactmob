import * as SecureStore from 'expo-secure-store';
import { addNotificationToHistory } from '../utils/notificationHelper';

export const storeDiscountNotification = async (discount, userRole) => {
  try {
    if (userRole === 'admin') return true;

    const notification = {
      title: '🎉 New Discount Available!',
      body: `Get ${discount.percentage}% off with code: ${discount.code}`,
      data: {
        screen: 'DiscountDetailsScreen',  // Changed from 'DiscountDetails' to match navigation
        discountId: discount._id,
        type: 'discount'
      }
    };

    // Add to notification history
    await addNotificationToHistory(notification);

    // Store notification
    const existingNotifs = await SecureStore.getItemAsync('newDiscountNotifications');
    const notifications = existingNotifs ? JSON.parse(existingNotifs) : [];
    
    // Add timestamp to help with ordering
    notification.timestamp = new Date().toISOString();
    notifications.push(notification);
    
    await SecureStore.setItemAsync('newDiscountNotifications', JSON.stringify(notifications));

    return true;
  } catch (error) {
    console.error('Error storing discount notification:', error);
    return false;
  }
};
