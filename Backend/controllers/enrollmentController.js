// controllers/enrollmentController.js

const asyncHandler = require('express-async-handler');
const Enrollment = require('../models/Enrollment');
const Course = require('../models/Course');

/**
 * @desc    Enroll the current user in a specific course
 * @route   POST /api/enrollments/:courseId
 * @access  Private
 */
const enrollInCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  // 1. Check if course exists
  const course = await Course.findById(courseId);
  if (!course) {
    res.status(404);
    throw new Error('Course not found.');
  }

  // 2. Check if user already enrolled
  const existing = await Enrollment.findOne({ user: userId, course: courseId });
  if (existing) {
    res.status(400);
    throw new Error('You are already enrolled in this course.');
  }

  // 3. Create new enrollment
  // (If you have payment logic, set paymentStatus accordingly)
  const enrollment = await Enrollment.create({
    user: userId,
    course: courseId,
    paymentStatus: 'not_required', // or 'paid', etc.
    pricePaid: course.price, // Example: storing the course price
  });

  res.status(201).json({
    success: true,
    message: 'Enrollment successful',
    enrollment,
  });
});

/**
 * @desc    Unenroll user from a course
 * @route   DELETE /api/enrollments/:courseId
 * @access  Private
 */
const unenrollFromCourse = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
  if (!enrollment) {
    res.status(404);
    throw new Error('You are not enrolled in this course.');
  }

  await enrollment.deleteOne();
  res.json({
    success: true,
    message: 'Successfully unenrolled',
  });
});

/**
 * @desc    Get all enrollments for the logged-in user
 * @route   GET /api/enrollments/my
 * @access  Private
 */
const getMyEnrollments = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Populate course info (title, etc.) if you want
  const enrollments = await Enrollment.find({ user: userId })
    .populate('course', 'title image instructor price')
    .sort({ enrolledAt: -1 });

  res.json({
    success: true,
    count: enrollments.length,
    enrollments,
  });
});

/**
 * @desc    Update progress or status on an enrollment
 * @route   PATCH /api/enrollments/:courseId
 * @access  Private
 */
const updateEnrollment = asyncHandler(async (req, res) => {
  const { courseId } = req.params;
  const userId = req.user._id;

  const {
    progress,
    status,
    lastAccessed,
    completionDate,
    certificateUrl,
    lessonsProgress,
    notes,
  } = req.body;

  const enrollment = await Enrollment.findOne({ user: userId, course: courseId });
  if (!enrollment) {
    res.status(404);
    throw new Error('Enrollment not found for this user/course.');
  }

  // Update fields if they’re provided
  if (progress !== undefined) enrollment.progress = progress;
  if (status) enrollment.status = status;
  if (lastAccessed) enrollment.lastAccessed = lastAccessed;
  if (completionDate) enrollment.completionDate = completionDate;
  if (certificateUrl) enrollment.certificateUrl = certificateUrl;
  if (lessonsProgress) enrollment.lessonsProgress = lessonsProgress;
  if (notes !== undefined) enrollment.notes = notes;

  await enrollment.save();
  res.json({
    success: true,
    message: 'Enrollment updated',
    enrollment,
  });
});

module.exports = {
  enrollInCourse,
  unenrollFromCourse,
  getMyEnrollments,
  updateEnrollment,
};
