// src/store/slices/reviewSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  addOrUpdateReview,
  getProductReviewsAPI,
  deleteReviewAPI
} from '../../services/api';

export const addOrUpdateReviewThunk = createAsyncThunk(
  'reviews/addOrUpdate',
  async ({ reviewableId, reviewableType, rating, comment }, { rejectWithValue }) => {
    try {
      const response = await addOrUpdateReview(reviewableId, reviewableType, rating, comment);
      if (!response.success) {
        console.log(response.message);
        
        return rejectWithValue(response.message);
      }
      return response.data; // e.g. updated review info
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchReviews = createAsyncThunk(
  'reviews/fetch',
  async ({ reviewableId, reviewableType }, { rejectWithValue }) => {
    try {
      const response = await getProductReviewsAPI(reviewableId, reviewableType);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      
      return response; // e.g. { reviews: [...] }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteReviewThunk = createAsyncThunk(
  'reviews/delete',
  async (reviewId, { rejectWithValue }) => {
    try {
      const response = await deleteReviewAPI(reviewId);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.data; // e.g. { message: 'Review deleted' }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  reviews: [] // store fetched reviews
};

const reviewSlice = createSlice({
  name: 'reviews',
  initialState,
  reducers: {
    clearReviewError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(addOrUpdateReviewThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addOrUpdateReviewThunk.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
        // If needed, you can push or update the local `reviews` array
        // but it depends on how your backend responds
      })
      .addCase(addOrUpdateReviewThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchReviews.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReviews.fulfilled, (state, action) => {
        state.loading = false;
        // Might be { reviews: [...] }
        state.reviews = action.payload.data || [];
      })
      .addCase(fetchReviews.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(deleteReviewThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteReviewThunk.fulfilled, (state, action) => {
        state.loading = false;
        // If the server returns the deleted review's ID or something:
        // you can remove it from state.reviews
      })
      .addCase(deleteReviewThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearReviewError } = reviewSlice.actions;
export default reviewSlice.reducer;
