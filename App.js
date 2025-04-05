import React, { useEffect, useState } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { NavigationContainer } from '@react-navigation/native';
import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";
import BottomTabNavigator from './navigation/BottomTabNavigator'; // Import BottomTabNavigator
import OrderDetailsScreen from './screens/OrderDetailsScreen'; // Import OrderDetailsScreen
import NotificationsDetails from './screens/NotificationsDetails'; // Add this import
import DiscountDetailsScreen from './screens/DiscountDetailsScreen'; // Fix import name
import { createStackNavigator } from '@react-navigation/stack'; // Add this import
import * as Notifications from 'expo-notifications'; // Add this import

const Stack = createStackNavigator(); // Add this line

export default function App() {
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Add ref for navigation
  const navigationRef = React.useRef();

  useEffect(() => {
    const setupNotifications = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Please enable notifications to receive product updates!');
        return;
      }

      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log('Notification clicked:', data); // Debug log
        
        if (!navigationRef.current) return;

        if (data?.screen === 'DiscountDetailsScreen' && data?.discountId) {
          // Ensure we navigate after a short delay
          setTimeout(() => {
            navigationRef.current.navigate('DiscountDetailsScreen', {
              discountId: data.discountId
            });
          }, 100);
        } else if (data?.screen === 'NotificationsDetails' && data?.orderId) {
          navigationRef.current.navigate('NotificationsDetails', { 
            orderId: data.orderId,
            notificationType: 'order' 
          });
        } else if (data?.screen === 'Product' && data?.productId) {
          navigationRef.current.navigate('Main', {
            screen: 'Home',
            params: { 
              productId: data.productId,
              showProductModal: true 
            }
          });
        }
      });

      return () => {
        Notifications.removeNotificationSubscription(responseListener);
      };
    };

    setupNotifications();
  }, []);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        const role = await SecureStore.getItemAsync("userRole"); // Get user role from Secure Store
        setUserRole(role);
      } catch (error) {
        console.error("Error fetching user role:", error);
      } finally {
        setIsLoading(false); // Set loading to false after initialization
      }
    };

    const initializeUserId = async () => {
      let userId = await SecureStore.getItemAsync('userId');
      if (!userId) {
        const fetchedUserId = uuidv4().replace(/-/g, "").slice(0, 24);
        await SecureStore.setItemAsync('userId', fetchedUserId);
      }
    };

    const initializeToken = async () => {
      let token = await SecureStore.getItemAsync('token');
      if (!token) {
        const fetchedToken = "your_generated_token_here";
        await SecureStore.setItemAsync('token', fetchedToken);
      }
    };

    initializeUserId();
    initializeToken();
    initializeApp();
  }, []);

  if (isLoading) {
    return null; // Show a loading screen or spinner if needed
  }

  return (
    <AuthProvider>
      <Provider store={store}>
        <OrderProvider>
          <ProductProvider>
            <CartProvider>
              <NavigationContainer ref={navigationRef}>
                <Stack.Navigator>
                  <Stack.Screen 
                    name="Main" 
                    component={BottomTabNavigator}
                    options={{ headerShown: false }}
                  />
          
                  <Stack.Screen 
                    name="NotificationsDetails" 
                    component={NotificationsDetails}
                    options={{
                      title: 'Notification Details',
                      headerStyle: {
                        backgroundColor: '#8B4513',
                      },
                      headerTintColor: '#fff',
                    }}
                  />

                  <Stack.Screen 
                    name="DiscountDetailsScreen" 
                    component={DiscountDetailsScreen}
                    options={{
                      title: 'Discount Details',
                      headerStyle: {
                        backgroundColor: '#8B4513',
                      },
                      headerTintColor: '#fff',
                    }}
                  />
                
                </Stack.Navigator>
              </NavigationContainer>
            </CartProvider>
          </ProductProvider>
        </OrderProvider>
      </Provider>
    </AuthProvider>
  );
}
