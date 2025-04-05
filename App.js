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

export default function App() {
  const [userRole, setUserRole] = useState(null); // Track user role
  const [isLoading, setIsLoading] = useState(true); // Track loading state

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
              <NavigationContainer>
                <BottomTabNavigator userRole={userRole} />
              </NavigationContainer>
            </CartProvider>
          </ProductProvider>
        </OrderProvider>
      </Provider>
    </AuthProvider>
  );
}
