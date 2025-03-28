import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from "../config";

export const fetchOrders = createAsyncThunk("orders/fetchOrders", async (token) => {
  const response = await axios.get(`${BASE_URL}/api/orders`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
});

export const updateOrderStatus = createAsyncThunk("orders/updateOrderStatus", async ({ orderId, status, token }) => {
  await axios.put(`${BASE_URL}/api/orders/${orderId}`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { orderId, status };
});

const orderSlice = createSlice({
  name: "orders",
  initialState: { orders: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        const { orderId, status } = action.payload;
        const order = state.orders.find((order) => order._id === orderId);
        if (order) order.status = status;
      });
  },
});

export default orderSlice.reducer;
