import React, { useContext, useEffect } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from '@react-navigation/stack';
import { NavigationContainer } from "@react-navigation/native";
import BottomTabNavigator from "./BottomTabNavigator";
import { OrderContext } from "../context/OrderContext"; // Import OrderContext
import OrderDetailsScreen from '../screens/OrderDetailsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Main" component={BottomTabNavigator} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { fetchOrders } = useContext(OrderContext); // Access fetchOrders from OrderContext

  useEffect(() => {
    if (fetchOrders) {
      fetchOrders(); // Fetch orders as soon as the app is opened
    }
  }, [fetchOrders]);

  return (
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
          name="MainTabs" 
          component={TabNavigator} 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="OrderDetails" 
          component={OrderDetailsScreen}
          options={{ title: 'Order Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default AppNavigator;
