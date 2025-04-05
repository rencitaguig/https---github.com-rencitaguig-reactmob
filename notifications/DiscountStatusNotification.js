import * as SecureStore from 'expo-secure-store';

export const storeDiscountNotification = async (discount, userRole) => {
  try {
    if (userRole === 'admin') return true;

    const notification = {
      title: '🎉 New Discount Available!',
      body: `Get ${discount.percentage}% off with code: ${discount.code}`,
      data: {
        screen: 'DiscountDetailsScreen',
        discountId: discount._id,
        params: {
          discountId: discount._id
        },
        type: 'discount'
      }
    };

    // Store notification
    const existingNotifs = await SecureStore.getItemAsync('newDiscountNotifications');
    const notifications = existingNotifs ? JSON.parse(existingNotifs) : [];
    notifications.push(notification);
    await SecureStore.setItemAsync('newDiscountNotifications', JSON.stringify(notifications));

    return true;
  } catch (error) {
    console.error('Error storing discount notification:', error);
    return false;
  }
};
