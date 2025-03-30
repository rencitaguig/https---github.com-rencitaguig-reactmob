import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import BASE_URL from "../config"; // Import BASE_URL

export const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        const response = await axios.get(`${BASE_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOrders(response.data); // Fetch all orders without filtering by user ID
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
    }
  };

  const updateOrderStatus = async (orderId, status) => {
    try {
      const token = await AsyncStorage.getItem('token');
      await axios.put(`${BASE_URL}/api/orders/${orderId}`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error("Error updating order status:", error.response ? error.response.data : error.message);
    }
  };

  return (
    <OrderContext.Provider value={{ orders, fetchOrders, updateOrderStatus }}>
      {children}
    </OrderContext.Provider>
  );
};
