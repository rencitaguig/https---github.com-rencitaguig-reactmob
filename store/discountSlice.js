import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from "../config";

// Async thunk actions
export const fetchDiscounts = createAsyncThunk(
  'discounts/fetchDiscounts',
  async (token, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/discounts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Network error');
    }
  }
);

export const createDiscount = createAsyncThunk(
  'discounts/createDiscount',
  async ({ data, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${BASE_URL}/api/discounts`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Network error');
    }
  }
);

export const updateDiscount = createAsyncThunk(
  'discounts/updateDiscount',
  async ({ id, data, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${BASE_URL}/api/discounts/${id}`, data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Network error');
    }
  }
);

export const deleteDiscount = createAsyncThunk(
  'discounts/deleteDiscount',
  async ({ id, token }, { rejectWithValue }) => {
    try {
      await axios.delete(`${BASE_URL}/api/discounts/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Network error');
    }
  }
);

const discountSlice = createSlice({
  name: "discounts",
  initialState: { discounts: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch discounts cases
      .addCase(fetchDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = action.payload;
      })
      .addCase(fetchDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message;
      })
      // Create discount cases
      .addCase(createDiscount.fulfilled, (state, action) => {
        state.discounts.push(action.payload);
      })
      .addCase(createDiscount.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      // Update discount cases
      .addCase(updateDiscount.fulfilled, (state, action) => {
        const index = state.discounts.findIndex(
          (discount) => discount._id === action.payload._id
        );
        if (index !== -1) {
          state.discounts[index] = action.payload;
        }
      })
      .addCase(updateDiscount.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      })
      // Delete discount cases
      .addCase(deleteDiscount.fulfilled, (state, action) => {
        state.discounts = state.discounts.filter(
          (discount) => discount._id !== action.payload
        );
      })
      .addCase(deleteDiscount.rejected, (state, action) => {
        state.error = action.payload || action.error.message;
      });
  },
});

export default discountSlice.reducer;