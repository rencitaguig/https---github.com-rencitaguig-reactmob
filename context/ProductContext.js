import React, { createContext, useState } from 'react';
import axios from 'axios';
import BASE_URL from '../config';

export const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const createProduct = async (productData, token) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/products`, productData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      await fetchProducts();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const updateProduct = async (id, productData, token) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/products/${id}`, productData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      await fetchProducts();
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const deleteProduct = async (id, token) => {
    try {
      await axios.delete(`${BASE_URL}/api/products/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      await fetchProducts();
    } catch (error) {
      throw error;
    }
  };

  return (
    <ProductContext.Provider value={{ products, fetchProducts, createProduct, updateProduct, deleteProduct }}>
      {children}
    </ProductContext.Provider>
  );
};
