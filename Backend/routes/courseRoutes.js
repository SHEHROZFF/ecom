// routes/courseRoutes.js
const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createCourse,
  createFeaturedCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
} = require('../controllers/courseController');

// Standard course endpoints
router.route('/')
  .get(protect, getCourses)
  .post(protect, createCourse);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, updateCourse)
  .delete(protect, deleteCourse);

// Separate endpoint for adding a featured course
router.route('/featured')
  .post(protect, createFeaturedCourse);

module.exports = router;
