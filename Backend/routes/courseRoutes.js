// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createCourse,
  createFeaturedCourse,
  getCourses,
  getFeaturedReels, // new function
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

// Standard course endpoints with pagination
router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

// Endpoint for creating a featured course (POST)
router.route('/featured')
  .post(protect, createFeaturedCourse);

// New endpoint for fetching featured reels (GET)
router.route('/featuredreels')
  .get(protect, getFeaturedReels);

// Endpoints for a single course (by id)
// Place these after other specific routes to avoid conflicts.
router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, updateCourse)
  .delete(protect, deleteCourse);

module.exports = router;











// // routes/courseRoutes.js
// const express = require('express');
// const router = express.Router();
// const { protect, admin } = require('../middleware/authMiddleware');
// const {
//   createCourse,
//   createFeaturedCourse,
//   getCourses,
//   getCourseById,
//   updateCourse,
//   deleteCourse,
// } = require('../controllers/courseController');

// // Standard course endpoints
// router.route('/')
//   .get(protect, getCourses)
//   .post(protect, createCourse);

// router.route('/:id')
//   .get(protect, getCourseById)
//   .put(protect, updateCourse)
//   .delete(protect, deleteCourse);

// // Separate endpoint for adding a featured course
// router.route('/featured')
//   .post(protect, createFeaturedCourse);

// module.exports = router;
