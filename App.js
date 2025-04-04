import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import AppNavigator from "./navigation/AppNavigator";
import { CartProvider } from "./context/CartContext"; // Import CartProvider
import { OrderProvider } from "./context/OrderContext"; // Import OrderProvider
import { AuthProvider } from './context/AuthContext'; // Import AuthProvider
import { ProductProvider } from './context/ProductContext'; // Import ProductProvider
import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid"; // Import UUID library for generating unique IDs
import * as SecureStore from "expo-secure-store"; // Import Secure Store
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import AdminScreen from './screens/AdminScreen';

const Stack = createStackNavigator();

export default function App() {
  useEffect(() => {
    const initializeUserId = async () => {
      let userId = await SecureStore.getItemAsync('userId'); // Use Secure Store to get userId
      if (!userId) {
        // Generate a valid ObjectId-like string for user ID
        const fetchedUserId = uuidv4().replace(/-/g, "").slice(0, 24); // Generate a 24-character string
        await SecureStore.setItemAsync('userId', fetchedUserId); // Store userId in Secure Store
        console.log(`Generated userId: ${fetchedUserId}`);
      }
    };

    initializeUserId();
  }, []);

  useEffect(() => {
    const initializeToken = async () => {
      let token = await SecureStore.getItemAsync('token'); // Use Secure Store to get token
      if (!token) {
        // Simulate fetching a token from an API or authentication service
        const fetchedToken = "your_generated_token_here"; // Replace with actual logic to fetch token
        await SecureStore.setItemAsync('token', fetchedToken); // Store token in Secure Store
        console.log(`Generated token: ${fetchedToken}`);
      }
    };

    initializeToken();
  }, []);

  return (
    <AuthProvider>
      <Provider store={store}>
        <OrderProvider>
          <ProductProvider>
            <CartProvider>
              <NavigationContainer>
                <Stack.Navigator
                  screenOptions={{
                    headerStyle: {
                      backgroundColor: '#8B4513',
                    },
                    headerTintColor: '#fff',
                    headerTitleStyle: {
                      fontWeight: 'bold',
                    },
                  }}
                >
                  <Stack.Screen 
                    name="Admin" 
                    component={AdminScreen}
                    options={{ title: 'Admin Panel' }}
                  />
                  <Stack.Screen 
                    name="OrderDetails" 
                    component={OrderDetailsScreen}
                    options={{ title: 'Order Details' }}
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
