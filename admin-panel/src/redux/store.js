// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import usersReducer from './slices/usersSlice';
import productsReducer from './slices/productsSlice';
import ordersReducer from './slices/ordersSlice';
import reviewsReducer from './slices/reviewsSlice';
import themeReducer from './slices/themeSlice';
import coursesReducer from './slices/coursesSlice';
import adsReducer from './slices/adsSlice'; // import the ads reducer

const store = configureStore({
  reducer: {
    auth: authReducer,
    users: usersReducer,
    products: productsReducer,
    orders: ordersReducer,
    reviews: reviewsReducer,
    theme: themeReducer,
    courses: coursesReducer,
    ads: adsReducer, // add ads reducer here
  },
  devTools: process.env.NODE_ENV !== 'production',
});

export default store;











// import { configureStore } from '@reduxjs/toolkit';
// import authReducer from './slices/authSlice';
// import usersReducer from './slices/usersSlice';
// import productsReducer from './slices/productsSlice';
// import ordersReducer from './slices/ordersSlice';
// import reviewsReducer from './slices/reviewsSlice';
// import themeReducer from './slices/themeSlice';

// const store = configureStore({
//   reducer: {
//     auth: authReducer,
//     users: usersReducer,
//     products: productsReducer,
//     orders: ordersReducer,
//     reviews: reviewsReducer,
//     theme: themeReducer,
//   },
//   devTools: process.env.NODE_ENV !== 'production',
// });

// export default store;
