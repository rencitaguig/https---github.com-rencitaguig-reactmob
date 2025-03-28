import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import BASE_URL from "../config";

export const fetchReviews = createAsyncThunk("reviews/fetchReviews", async (productId) => {
  const response = await axios.get(`${BASE_URL}/api/reviews`);
  return response.data.filter((review) => review.productId._id === productId);
});

export const createReview = createAsyncThunk("reviews/createReview", async ({ reviewData, token }) => {
  const response = await axios.post(`${BASE_URL}/api/reviews`, reviewData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
});

export const updateReview = createAsyncThunk("reviews/updateReview", async ({ reviewId, updatedData, token }) => {
  await axios.put(`${BASE_URL}/api/reviews/${reviewId}`, updatedData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { reviewId, updatedData };
});

export const deleteReview = createAsyncThunk("reviews/deleteReview", async ({ reviewId, token }) => {
  await axios.delete(`${BASE_URL}/api/reviews/${reviewId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return reviewId;
});

const reviewSlice = createSlice({
  name: "reviews",
  initialState: { reviews: [], loading: false, error: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        state.reviews = action.payload;
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createReview.fulfilled, (state, action) => {
        state.reviews.push(action.payload);
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        const { reviewId, updatedData } = action.payload;
        const review = state.reviews.find((review) => review._id === reviewId);
        if (review) {
          review.rating = updatedData.rating;
          review.comment = updatedData.comment;
        }
      })
      .addCase(deleteReview.fulfilled, (state, action) => {
        state.reviews = state.reviews.filter((review) => review._id !== action.payload);
      });
  },
});

export default reviewSlice.reducer;
