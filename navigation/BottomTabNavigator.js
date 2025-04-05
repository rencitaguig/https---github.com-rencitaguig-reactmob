import React, { useContext } from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import HomeScreen from "../screens/HomeScreen";
import CartScreen from "../screens/CartScreen";
import ProfileScreen from "../screens/ProfileScreen";
import AdminScreen from "../screens/AdminScreen";
import DiscountScreen from "../screens/DiscountScreen";
import { Ionicons } from "@expo/vector-icons";
import { AuthContext } from "../context/AuthContext"; // Corrected from UserContext to AuthContext

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  const { getVisibleScreens } = useContext(AuthContext); // Get the function to determine visible screens
  const visibleScreens = getVisibleScreens();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#FBF7F4",
          height: 65,
          paddingBottom: 10,
          paddingTop: 10,
          borderTopWidth: 0,
          elevation: 12,
          shadowColor: "#8B4513",
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: "#6B4423",
        tabBarInactiveTintColor: "#B68973",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
          marginTop: 4,
        },
      }}
    >
      {visibleScreens.includes("Home") && (
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="home" color={color} size={26} />
            ),
          }}
        />
      )}
      {visibleScreens.includes("Cart") && (
        <Tab.Screen
          name="Cart"
          component={CartScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="cart" color={color} size={26} />
            ),
          }}
        />
      )}
      {visibleScreens.includes("Profile") && (
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person" color={color} size={26} />
            ),
          }}
        />
      )}
      {visibleScreens.includes("Discounts") && (
        <Tab.Screen
          name="Discounts"
          component={DiscountScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="pricetag" color={color} size={26} />
            ),
          }}
        />
      )}
      {visibleScreens.includes("Admin") && (
        <Tab.Screen
          name="Admin"
          component={AdminScreen}
          options={{
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings" color={color} size={26} />
            ),
          }}
        />
      )}
    </Tab.Navigator>
  );
}