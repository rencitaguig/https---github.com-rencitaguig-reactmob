import React, { createContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import BASE_URL from "../config"; // Import BASE_URL

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);

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

  const checkout = async (userId) => {
    if (cart.length === 0) return;

    const orderData = {
      userId,
      items: cart.map((item) => ({
        productId: item._id,
        name: item.name,
        quantity: 1, // Assuming quantity is 1
        price: item.price,
      })),
      totalPrice: cart.reduce((sum, item) => sum + item.price, 0),
    };

    try {
      const token = await AsyncStorage.getItem('token'); // Get token from async storage
      if (!token) {
        console.error("No token found");
        return;
      }
      console.log("Token:", token); // Debugging: log the token
      const response = await axios.post(`${BASE_URL}/api/orders`, orderData, { // Use BASE_URL
        headers: { Authorization: `Bearer ${token}` } // Include token in headers
      });
      console.log("Order placed:", response.data);
      setCart([]);
      await AsyncStorage.removeItem("cart");
    } catch (error) {
      console.error("Error placing order:", error.response ? error.response.data : error.message);
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, loadCart, checkout }}
    >
      {children}
    </CartContext.Provider>
  );
};
