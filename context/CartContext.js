import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../config"; // Import BASE_URL
import { getSecureItem } from '../utils/secureStorage'; // Import secure storage utility
import * as SecureStore from "expo-secure-store"; // Import Secure Store

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [onOrderPlaced, setOnOrderPlaced] = useState(null); // Callback for order placement

  useEffect(() => {
    loadCart();
  }, []);

  const addToCart = async (product) => {
    const updatedCart = [...cart, product];
    setCart(updatedCart);
    await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const removeFromCart = async (productId) => {
    const updatedCart = cart.filter((item) => item._id !== productId);
    setCart(updatedCart);
    await AsyncStorage.setItem("cart", JSON.stringify(updatedCart));
  };

  const loadCart = async () => {
    const storedCart = await AsyncStorage.getItem("cart");
    if (storedCart) {
      setCart(JSON.parse(storedCart));
      return JSON.parse(storedCart);
    }
    return [];
  };

  const checkout = async (orderData) => {
    try {
      const token = await SecureStore.getItemAsync('token');
      
      // Ensure numbers are properly formatted
      const formattedOrderData = {
        ...orderData,
        items: orderData.items.map(item => ({
          ...item,
          quantity: Number(item.quantity),
          price: Number(item.price)
        })),
        totalPrice: Number(orderData.totalPrice),
        originalPrice: Number(orderData.originalPrice),
        shippingFee: Number(orderData.shippingFee || 75)
      };

      const response = await axios.post(
        `${BASE_URL}/api/orders`,
        formattedOrderData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // Clear cart after successful order
      setCart([]);
      return response.data;
    } catch (error) {
      console.error('Checkout error:', error);
      throw error;
    }
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        loadCart,
        checkout,
        setOnOrderPlaced, // Expose the callback setter
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
