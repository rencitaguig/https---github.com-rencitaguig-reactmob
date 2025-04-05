import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from "../config";

// Define initial state type
const initialState = {
  reviews: [],
  loading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false
};

// Fetch reviews for a specific product
export const fetchReviews = createAsyncThunk(
  "reviews/fetchReviews",
  async (productId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${BASE_URL}/api/reviews`);
      return response.data.filter((review) => review.productId._id === productId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch reviews");
    }
  }
);

// Create a new review
export const createReview = createAsyncThunk(
  "reviews/createReview",
  async ({ reviewData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/reviews`,
        reviewData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.review; // Assuming the API returns the review object
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create review");
    }
  }
);

// Update an existing review
export const updateReview = createAsyncThunk(
  "reviews/updateReview",
  async ({ reviewId, updatedData, token }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${BASE_URL}/api/reviews/${reviewId}`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.review; // Return the updated review from the response
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update review");
    }
  }
);

// Delete a review
export const deleteReview = createAsyncThunk(
  "reviews/deleteReview",
  async ({ reviewId, token }, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${BASE_URL}/api/reviews/${reviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return reviewId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete review");
    }
  }
);

const reviewSlice = createSlice({
  name: "reviews",
  initialState,
  reducers: {
    clearReviewErrors: (state) => {
      state.error = null;
    },
    resetReviewState: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch reviews cases
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
        state.error = null;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create review cases
      .addCase(createReview.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.createLoading = false;
        state.reviews.push(action.payload);
        state.error = null;
      })
      .addCase(createReview.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload;
      })

      // Update review cases
      .addCase(updateReview.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.reviews.findIndex(
          (review) => review._id === action.payload._id
        );
        if (index !== -1) {
          state.reviews[index] = action.payload;
        }
        state.error = null;
      })
      .addCase(updateReview.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload;
      })

      // Delete review cases
      .addCase(deleteReview.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.reviews = state.reviews.filter(
          (review) => review._id !== action.payload
        );
        state.error = null;
      })
      .addCase(deleteReview.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearReviewErrors, resetReviewState } = reviewSlice.actions;
export default reviewSlice.reducer;