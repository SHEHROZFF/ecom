// src/store/index.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import productReducer from './slices/productSlice';
import reviewReducer from './slices/reviewSlice';
import orderReducer from './slices/orderSlice';
import paymentReducer from './slices/paymentSlice';
import courseReducer from './slices/courseSlice';
import enrollmentReducer from './slices/enrollmentSlice';
import policyReducer from './slices/policySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productReducer,
    reviews: reviewReducer,
    orders: orderReducer,
    payment: paymentReducer,
    courses: courseReducer,
    enrollments: enrollmentReducer,
    policy: policyReducer,
  },
});

export default store;
