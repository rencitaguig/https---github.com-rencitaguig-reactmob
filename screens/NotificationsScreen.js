import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);

  const loadNotifications = useCallback(async () => {
    try {
      const notificationsHistory = await SecureStore.getItemAsync('notificationsHistory');
      if (notificationsHistory) {
        const parsedNotifications = JSON.parse(notificationsHistory);
        setNotifications(parsedNotifications.sort((a, b) => 
          new Date(b.timestamp) - new Date(a.timestamp)
        ));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }, []);

  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      await loadNotifications();

      const notificationListener = Notifications.addNotificationReceivedListener(
        async (notification) => {
          const newNotification = {
            ...notification.request.content,
            timestamp: new Date().toISOString(),
            read: false,
          };

          const existingNotifs = await SecureStore.getItemAsync('notificationsHistory');
          const notifications = existingNotifs ? JSON.parse(existingNotifs) : [];
          notifications.unshift(newNotification);
          await SecureStore.setItemAsync('notificationsHistory', JSON.stringify(notifications));
          loadNotifications();
        }
      );

      const responseListener = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data;
          if (data?.screen) {
            navigation.navigate(data.screen, data);
          }
        }
      );

      return () => {
        Notifications.removeNotificationSubscription(notificationListener);
        Notifications.removeNotificationSubscription(responseListener);
      };
    };

    setupNotifications();
  }, [navigation, loadNotifications]);

  const handleNotificationPress = (notification) => {
    if (notification.data?.screen) {
      navigation.navigate(notification.data.screen, notification.data);
    }
  };

  const clearAllNotifications = async () => {
    try {
      await SecureStore.setItemAsync('notificationsHistory', JSON.stringify([]));
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity 
      style={[styles.notificationItem, !item.read && styles.unreadNotification]} 
      onPress={() => handleNotificationPress(item)}
    >
      <View style={styles.iconContainer}>
        <Ionicons 
          name={getNotificationIcon(item.data?.type)} 
          size={24} 
          color="#8B4513" 
        />
      </View>
      <View style={styles.contentContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.body}>{item.body}</Text>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleDateString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            month: 'short',
            day: 'numeric'
          })}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'orderStatus':
        return 'cart-outline';
      case 'discount':
        return 'pricetag-outline';
      case 'product':
        return 'cube-outline';
      default:
        return 'notifications-outline';
    }
  };

  return (
    <LinearGradient
      colors={['#EFEBE9', '#D7CCC8', '#BCAAA4']}
      style={styles.container}
    >
      {notifications.length > 0 ? (
        <>
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={clearAllNotifications}
          >
            <Text style={styles.clearButtonText}>Clear All</Text>
          </TouchableOpacity>
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item, index) => `notification-${index}`}
            contentContainerStyle={styles.listContainer}
          />
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="notifications-off-outline" size={64} color="#8B4513" />
          <Text style={styles.emptyText}>No notifications yet</Text>
        </View>
      )}
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEBE9',
  },
  listContainer: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    elevation: 3,
    shadowColor: '#8B4513',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  unreadNotification: {
    backgroundColor: '#FFF3E0',
    borderLeftWidth: 4,
    borderLeftColor: '#8B4513',
  },
  iconContainer: {
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#3E2723',
    marginBottom: 4,
  },
  body: {
    fontSize: 14,
    color: '#5D4037',
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 12,
    color: '#8D6E63',
  },
  clearButton: {
    backgroundColor: '#8B4513',
    padding: 10,
    margin: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#8B4513',
    marginTop: 16,
  },
});

export default NotificationsScreen;
