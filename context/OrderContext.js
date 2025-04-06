import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config"; // Import BASE_URL
import * as SecureStore from "expo-secure-store"; // Import Secure Store

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]); // All orders for admin
  const [userOrders, setUserOrders] = useState([]); // User-specific orders

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await SecureStore.getItemAsync('token'); // Use Secure Store to get token
      const userId = await SecureStore.getItemAsync('userId'); // Use Secure Store to get userId
      const userRole = await SecureStore.getItemAsync('userRole'); // Use Secure Store to get userRole
      
      if (!token) {
        console.error("No token found. Unable to fetch orders.");
        return;
      }

      const response = await axios.get(`${BASE_URL}/api/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Set all orders for admin view
      setOrders(response.data);

      // Filter and set user-specific orders
      if (userId) {
        const filteredOrders = response.data.filter(order => {
          if (!order.userId) return false;
          const orderUserId = typeof order.userId === 'object' ? order.userId._id : order.userId;
          return orderUserId === userId;
        });
        setUserOrders(filteredOrders);
      }
    } catch (error) {
      console.error("Error fetching orders:", error.response ? error.response.data : error.message);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = await SecureStore.getItemAsync('token'); // Use Secure Store to get token
      if (!token) {
        console.error("No token found. Unable to update order status.");
        return;
      }
      await axios.put(`${BASE_URL}/api/orders/${orderId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders(); // Refresh orders after updating status
    } catch (error) {
      console.error("Error updating order status:", error.response ? error.response.data : error.message);
    }
  };

  return (
    <OrderContext.Provider value={{ 
      orders, // All orders for admin
      userOrders, // Filtered orders for user
      fetchOrders, 
      updateOrderStatus 
    }}>
      {children}
    </OrderContext.Provider>
  );
};
