import * as SecureStore from 'expo-secure-store';

// Store notification for order status updates
export const storeOrderStatusNotification = async (order, newStatus) => {
  try {
    // Get status emoji
    const emoji = getStatusEmoji(newStatus);
    
    // Create notification data
    const notification = {
      title: `${emoji} Order Status Updated`,
      body: `Your Order #${order._id.slice(-6)} has been ${newStatus.toLowerCase()}`,
      data: {
        orderId: order._id,
        userId: order.userId._id,
        status: newStatus,
        items: order.items,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt,
        screen: 'NotificationsDetails',
        type: 'orderStatus',
      }
    };

    // Get existing notifications
    const existingNotifs = await SecureStore.getItemAsync('pendingOrderNotifications');
    const notifications = existingNotifs ? JSON.parse(existingNotifs) : [];
    
    // Add new notification
    notifications.push(notification);
    
    // Save back to storage
    await SecureStore.setItemAsync('pendingOrderNotifications', JSON.stringify(notifications));
    
    return true;
  } catch (error) {
    console.error('Error storing order status notification:', error);
    return false;
  }
};

// Get emoji for status
export const getStatusEmoji = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '⏳';
    case 'shipped':
      return '🚚';
    case 'delivered':
      return '✅';
    case 'cancelled':
      return '❌';
    default:
      return '📦';
  }
};

// Get color for status
export const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case 'pending':
      return '#FFA000';
    case 'shipped':
      return '#1E88E5';
    case 'delivered':
      return '#43A047';
    case 'cancelled':
      return '#E53935';
    default:
      return '#757575';
  }
};
