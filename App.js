import React, { useEffect } from "react";
import { Provider } from "react-redux";
import { store } from "./store/store";
import { CartProvider } from "./context/CartContext";
import { OrderProvider } from "./context/OrderContext";
import { AuthProvider } from './context/AuthContext';
import { ProductProvider } from './context/ProductContext';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import HomeScreen from './screens/HomeScreen';
import CartScreen from './screens/CartScreen';
import ProfileScreen from './screens/ProfileScreen';
import AdminScreen from './screens/AdminScreen';
import DiscountScreen from './screens/DiscountScreen';
import OrderDetailsScreen from './screens/OrderDetailsScreen';
import * as SecureStore from "expo-secure-store";
import { v4 as uuidv4 } from "uuid";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function UserTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={DiscountScreen} />
      <Tab.Screen name="Cart" component={CartScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

function AdminTabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen 
        name="AdminPanel" 
        component={AdminScreen}
        options={{ title: 'Admin' }}
      />
      <Tab.Screen 
        name="Discounts" 
        component={DiscountScreen}
        options={{ title: 'Discounts' }}
      />
      <Tab.Screen 
        name="AdminProfile" 
        component={ProfileScreen}
        options={{ title: 'Profile' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  useEffect(() => {
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
                    name="UserTabs" 
                    component={UserTabs}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen 
                    name="AdminTabs" 
                    component={AdminTabs}
                    options={{ headerShown: false }}
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
