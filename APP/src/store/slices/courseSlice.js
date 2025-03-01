// src/store/slices/courseSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  fetchCourses,
  fetchFeaturedReels,
  fetchAds,
  searchCoursesAPI,
  fetchCourseById
} from '../../services/api';

export const fetchCoursesThunk = createAsyncThunk(
  'courses/fetchAll',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetchCourses(page, limit);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      // console.log('responsecourse',response);
      
      return response; // e.g. { courses: [...], pagination: {...} }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchFeaturedReelsThunk = createAsyncThunk(
  'courses/fetchFeaturedReels',
  async ({ page = 1, limit = 5 } = {}, { rejectWithValue }) => {
    try {
      const response = await fetchFeaturedReels(page, limit);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.data; // e.g. { reels: [...] }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchAdsThunk = createAsyncThunk(
  'courses/fetchAds',
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetchAds();
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response.data; // e.g. { ads: [...] }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const searchCoursesThunk = createAsyncThunk(
  'courses/search',
  async (query, { rejectWithValue }) => {
    try {
      const response = await searchCoursesAPI(query);
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response; // e.g. { courses: [...] }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchCourseByIdThunk = createAsyncThunk(
  'courses/fetchById',
  async (courseId, { rejectWithValue }) => {
    try {
      const response = await fetchCourseById(courseId);
      // console.log('byidthunk',response);
      
      if (!response.success) {
        return rejectWithValue(response.message);
      }
      return response; // e.g. { course: {...} }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  loading: false,
  error: null,
  courses: [],
  featuredReels: [],
  ads: [],
  searchedCourses: [],
  selectedCourse: null
};

const courseSlice = createSlice({
  name: 'courses',
  initialState,
  reducers: {
    clearCoursesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCoursesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCoursesThunk.fulfilled, (state, action) => {
        state.loading = false;
        // If your API returns { courses: [...] }
        state.courses = action.payload.data || [];
      })
      .addCase(fetchCoursesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchFeaturedReelsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedReelsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.featuredReels = action.payload.reels || [];
      })
      .addCase(fetchFeaturedReelsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchAdsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.ads = action.payload.ads || [];
      })
      .addCase(fetchAdsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(searchCoursesThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCoursesThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.searchedCourses = action.payload.courses || [];
      })
      .addCase(searchCoursesThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchCourseByIdThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCourseByIdThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCourse = action.payload.data || null;
      })
      .addCase(fetchCourseByIdThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearCoursesError } = courseSlice.actions;
export default courseSlice.reducer;
