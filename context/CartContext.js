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

  const checkout = async (discountedPrice = null) => {
    if (cart.length === 0) return;

    try {
      let userId = await SecureStore.getItemAsync('userId'); // Use Secure Store to get userId
      if (!userId) {
        console.error("No user ID found");
        return; // Exit if userId is not found
      }

      // Ensure userId is formatted as an ObjectId
      if (!/^[a-f\d]{24}$/i.test(userId)) {
        console.error(`Invalid userId format: ${userId}`);
        return; // Exit if userId is not valid
      }

      console.log(`Using userId: ${userId}`); // Log the valid userId

      const token = await getSecureItem('token'); // Use secure storage to get token
      if (!token) {
        console.error("No token found");
        return;
      }

      const orderData = {
        userId,
        items: cart.map((item) => ({
          productId: item._id,
          name: item.name,
          quantity: 1, // Assuming quantity is 1
          price: item.price,
        })),
        totalPrice: discountedPrice || cart.reduce((sum, item) => sum + item.price, 0),
        originalPrice: cart.reduce((sum, item) => sum + item.price, 0),
      };

      const response = await axios.post(`${BASE_URL}/api/orders`, orderData, {
        headers: { Authorization: `Bearer ${token}` } // Include token in headers
      });
      console.log("Order placed:", response.data);
      setCart([]);
      await AsyncStorage.removeItem("cart");

      if (onOrderPlaced) {
        onOrderPlaced(); // Notify ProfileScreen about the new order
      }

      // Import and use OrderContext to refresh orders
      const { fetchOrders } = require('./OrderContext');
      fetchOrders();
      
    } catch (error) {
      console.error("Error placing order:", error.response ? error.response.data : error.message);
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
