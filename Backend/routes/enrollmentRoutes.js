// routes/enrollmentRoutes.js

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  enrollInCourse,
  unenrollFromCourse,
  getMyEnrollments,
  updateEnrollment,
} = require('../controllers/enrollmentController');

// Enroll in a course
router.post('/:courseId', protect, enrollInCourse);

// Unenroll from a course
router.delete('/:courseId', protect, unenrollFromCourse);

// Update enrollment (progress, certificate, etc.)
router.patch('/:courseId', protect, updateEnrollment);

// Get all enrollments of current user
router.get('/my', protect, getMyEnrollments);

module.exports = router;
