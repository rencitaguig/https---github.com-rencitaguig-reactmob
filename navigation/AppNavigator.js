import React, { useContext, useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NavigationContainer } from "@react-navigation/native";
import BottomTabNavigator from "./BottomTabNavigator";
import { OrderContext } from "../context/OrderContext"; // Import OrderContext

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { fetchOrders } = useContext(OrderContext); // Access fetchOrders from OrderContext

  useEffect(() => {
    if (fetchOrders) {
      fetchOrders(); // Fetch orders as soon as the app is opened
    }
  }, [fetchOrders]);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={BottomTabNavigator} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
