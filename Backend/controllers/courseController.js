const asyncHandler = require('express-async-handler');
const Course = require('../models/Course');

/**
 * @desc    Create a new course (non-featured by default)
 * @route   POST /api/courses
 * @access  Private/Admin
 */
const createCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    instructor,
    price,
    image,
    videos,
    rating,
    reviews,
    isFeatured,
    shortVideoLink, // new field
  } = req.body;

  if (!title || !description || !instructor || !price || !image) {
    res.status(400);
    throw new Error('Please provide all required fields.');
  }

  const course = new Course({
    title,
    description,
    instructor,
    price,
    image,
    videos: videos || [],
    rating: rating || 0,
    reviews: reviews || 0,
    isFeatured: isFeatured || false,
    shortVideoLink: isFeatured ? shortVideoLink : '',
  });

  const createdCourse = await course.save();
  res.status(201).json(createdCourse);
});

/**
 * @desc    Create a new featured course (isFeatured is forced to true)
 * @route   POST /api/courses/featured
 * @access  Private/Admin
 */
const createFeaturedCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    instructor,
    price,
    image,
    videos,
    rating,
    reviews,
    shortVideoLink, // new field
  } = req.body;

  if (!title || !description || !instructor || !price || !image) {
    res.status(400);
    throw new Error('Please provide all required fields.');
  }

  const course = new Course({
    title,
    description,
    instructor,
    price,
    image,
    videos: videos || [],
    rating: rating || 0,
    reviews: reviews || 0,
    isFeatured: true,
    shortVideoLink: shortVideoLink || '',
  });

  const createdCourse = await course.save();
  res.status(201).json(createdCourse);
});

/**
 * @desc    Get all courses with pagination & selective projection
 * @route   GET /api/courses
 * @access  Private
 */
const getCourses = asyncHandler(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Only select lightweight fields for list view
  const courses = await Course.find({})
    .select('title description image rating reviews isFeatured')
    .skip(skip)
    .limit(limit);
  
  res.json(courses);
});

/**
 * @desc    Get featured reels (lightweight data for featured courses)
 * @route   GET /api/courses/featuredreels
 * @access  Private
 */
const getFeaturedReels = asyncHandler(async (req, res) => {
  const reels = await Course.find({ isFeatured: true })
    .select('title shortVideoLink image');
  res.json(reels);
});

/**
 * @desc    Get a course by ID
 * @route   GET /api/courses/:id
 * @access  Private
 */
const getCourseById = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (course) {
    res.json(course);
  } else {
    res.status(404);
    throw new Error('Course not found.');
  }
});

/**
 * @desc    Update a course
 * @route   PUT /api/courses/:id
 * @access  Private/Admin
 */
const updateCourse = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    instructor,
    price,
    image,
    videos,
    rating,
    reviews,
    isFeatured,
    shortVideoLink, // new field
  } = req.body;
  const course = await Course.findById(req.params.id);

  if (course) {
    course.title = title || course.title;
    course.description = description || course.description;
    course.instructor = instructor || course.instructor;
    course.price = price || course.price;
    course.image = image || course.image;
    course.videos = videos || course.videos;
    course.rating = rating !== undefined ? rating : course.rating;
    course.reviews = reviews !== undefined ? reviews : course.reviews;
    course.isFeatured = isFeatured !== undefined ? isFeatured : course.isFeatured;
    course.shortVideoLink = isFeatured ? shortVideoLink : '';

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } else {
    res.status(404);
    throw new Error('Course not found.');
  }
});

/**
 * @desc    Delete a course
 * @route   DELETE /api/courses/:id
 * @access  Private/Admin
 */
const deleteCourse = asyncHandler(async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (course) {
    await course.deleteOne();
    res.json({ message: 'Course removed successfully.' });
  } else {
    res.status(404);
    throw new Error('Course not found.');
  }
});

module.exports = {
  createCourse,
  createFeaturedCourse,
  getCourses,
  getFeaturedReels,
  getCourseById,
  updateCourse,
  deleteCourse,
};








// const asyncHandler = require('express-async-handler');
// const Course = require('../models/Course');

// /**
//  * @desc    Create a new course (non-featured by default)
//  * @route   POST /api/courses
//  * @access  Private/Admin
//  */
// const createCourse = asyncHandler(async (req, res) => {
//   const {
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos,
//     rating,
//     reviews,
//     isFeatured,
//     shortVideoLink, // new field
//   } = req.body;

//   if (!title || !description || !instructor || !price || !image) {
//     res.status(400);
//     throw new Error('Please provide all required fields.');
//   }

//   const course = new Course({
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos: videos || [],
//     rating: rating || 0,
//     reviews: reviews || 0,
//     isFeatured: isFeatured || false,
//     shortVideoLink: isFeatured ? shortVideoLink : '',
//   });

//   const createdCourse = await course.save();
//   res.status(201).json(createdCourse);
// });

// /**
//  * @desc    Create a new featured course (isFeatured is forced to true)
//  * @route   POST /api/courses/featured
//  * @access  Private/Admin
//  */
// const createFeaturedCourse = asyncHandler(async (req, res) => {
//   const {
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos,
//     rating,
//     reviews,
//     shortVideoLink, // new field
//   } = req.body;

//   if (!title || !description || !instructor || !price || !image) {
//     res.status(400);
//     throw new Error('Please provide all required fields.');
//   }

//   const course = new Course({
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos: videos || [],
//     rating: rating || 0,
//     reviews: reviews || 0,
//     isFeatured: true,
//     shortVideoLink: shortVideoLink || '',
//   });

//   const createdCourse = await course.save();
//   res.status(201).json(createdCourse);
// });

// /**
//  * @desc    Get all courses
//  * @route   GET /api/courses
//  * @access  Private
//  */
// const getCourses = asyncHandler(async (req, res) => {
//   const courses = await Course.find({});
//   res.json(courses);
// });

// /**
//  * @desc    Get a course by ID
//  * @route   GET /api/courses/:id
//  * @access  Private
//  */
// const getCourseById = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (course) {
//     res.json(course);
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// /**
//  * @desc    Update a course
//  * @route   PUT /api/courses/:id
//  * @access  Private/Admin
//  */
// const updateCourse = asyncHandler(async (req, res) => {
//   const {
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos,
//     rating,
//     reviews,
//     isFeatured,
//     shortVideoLink, // new field
//   } = req.body;
//   const course = await Course.findById(req.params.id);

//   if (course) {
//     course.title = title || course.title;
//     course.description = description || course.description;
//     course.instructor = instructor || course.instructor;
//     course.price = price || course.price;
//     course.image = image || course.image;
//     course.videos = videos || course.videos;
//     course.rating = rating !== undefined ? rating : course.rating;
//     course.reviews = reviews !== undefined ? reviews : course.reviews;
//     course.isFeatured = isFeatured !== undefined ? isFeatured : course.isFeatured;
//     course.shortVideoLink = isFeatured ? shortVideoLink : '';

//     const updatedCourse = await course.save();
//     res.json(updatedCourse);
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// /**
//  * @desc    Delete a course
//  * @route   DELETE /api/courses/:id
//  * @access  Private/Admin
//  */
// const deleteCourse = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (course) {
//     await course.deleteOne();
//     res.json({ message: 'Course removed successfully.' });
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// module.exports = {
//   createCourse,
//   createFeaturedCourse,
//   getCourses,
//   getCourseById,
//   updateCourse,
//   deleteCourse,
// };








// const asyncHandler = require('express-async-handler');
// const Course = require('../models/Course');

// /**
//  * @desc    Create a new course (non-featured by default)
//  * @route   POST /api/courses
//  * @access  Private/Admin
//  */
// const createCourse = asyncHandler(async (req, res) => {
//   const { title, description, instructor, price, image, videos, rating, reviews, isFeatured } =
//     req.body;

//   if (!title || !description || !instructor || !price || !image) {
//     res.status(400);
//     throw new Error('Please provide all required fields.');
//   }

//   const course = new Course({
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos: videos || [],
//     rating: rating || 0,
//     reviews: reviews || 0,
//     isFeatured: isFeatured || false,
//   });

//   const createdCourse = await course.save();
//   res.status(201).json(createdCourse);
// });

// /**
//  * @desc    Create a new featured course (isFeatured is forced to true)
//  * @route   POST /api/courses/featured
//  * @access  Private/Admin
//  */
// const createFeaturedCourse = asyncHandler(async (req, res) => {
//   const { title, description, instructor, price, image, videos, rating, reviews } = req.body;

//   if (!title || !description || !instructor || !price || !image) {
//     res.status(400);
//     throw new Error('Please provide all required fields.');
//   }

//   const course = new Course({
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos: videos || [],
//     rating: rating || 0,
//     reviews: reviews || 0,
//     isFeatured: true,
//   });

//   const createdCourse = await course.save();
//   res.status(201).json(createdCourse);
// });

// /**
//  * @desc    Get all courses
//  * @route   GET /api/courses
//  * @access  Private
//  */
// const getCourses = asyncHandler(async (req, res) => {
//   const courses = await Course.find({});
//   res.json(courses);
// });

// /**
//  * @desc    Get a course by ID
//  * @route   GET /api/courses/:id
//  * @access  Private
//  */
// const getCourseById = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (course) {
//     res.json(course);
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// /**
//  * @desc    Update a course
//  * @route   PUT /api/courses/:id
//  * @access  Private/Admin
//  */
// const updateCourse = asyncHandler(async (req, res) => {
//   const { title, description, instructor, price, image, videos, rating, reviews, isFeatured } =
//     req.body;
//   const course = await Course.findById(req.params.id);

//   if (course) {
//     course.title = title || course.title;
//     course.description = description || course.description;
//     course.instructor = instructor || course.instructor;
//     course.price = price || course.price;
//     course.image = image || course.image;
//     course.videos = videos || course.videos;
//     course.rating = rating !== undefined ? rating : course.rating;
//     course.reviews = reviews !== undefined ? reviews : course.reviews;
//     course.isFeatured = isFeatured !== undefined ? isFeatured : course.isFeatured;

//     const updatedCourse = await course.save();
//     res.json(updatedCourse);
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// /**
//  * @desc    Delete a course
//  * @route   DELETE /api/courses/:id
//  * @access  Private/Admin
//  */
// const deleteCourse = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (course) {
//     await course.remove();
//     res.json({ message: 'Course removed successfully.' });
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// module.exports = {
//   createCourse,
//   createFeaturedCourse,
//   getCourses,
//   getCourseById,
//   updateCourse,
//   deleteCourse,
// };













// // controllers/courseController.js
// const asyncHandler = require('express-async-handler');
// const Course = require('../models/Course');

// /**
//  * @desc    Create a new course (non-featured by default)
//  * @route   POST /api/courses
//  * @access  Private/Admin
//  */
// const createCourse = asyncHandler(async (req, res) => {
//   const { title, description, instructor, price, image, videos, rating, reviews, isFeatured } =
//     req.body;

//   if (!title || !description || !instructor || !price || !image) {
//     res.status(400);
//     throw new Error('Please provide all required fields.');
//   }

//   const course = new Course({
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos: videos || [],
//     rating: rating || 0,
//     reviews: reviews || 0,
//     isFeatured: isFeatured || false, // allow override if needed
//   });

//   const createdCourse = await course.save();
//   res.status(201).json(createdCourse);
// });

// /**
//  * @desc    Create a new featured course (isFeatured is forced to true)
//  * @route   POST /api/courses/featured
//  * @access  Private/Admin
//  */
// const createFeaturedCourse = asyncHandler(async (req, res) => {
//   const { title, description, instructor, price, image, videos, rating, reviews } = req.body;

//   if (!title || !description || !instructor || !price || !image) {
//     res.status(400);
//     throw new Error('Please provide all required fields.');
//   }

//   const course = new Course({
//     title,
//     description,
//     instructor,
//     price,
//     image,
//     videos: videos || [],
//     rating: rating || 0,
//     reviews: reviews || 0,
//     isFeatured: true, // Always set featured to true
//   });

//   const createdCourse = await course.save();
//   res.status(201).json(createdCourse);
// });

// /**
//  * @desc    Get all courses
//  * @route   GET /api/courses
//  * @access  Private
//  */
// const getCourses = asyncHandler(async (req, res) => {
//   const courses = await Course.find({});
//   res.json(courses);
// });

// /**
//  * @desc    Get a course by ID
//  * @route   GET /api/courses/:id
//  * @access  Private
//  */
// const getCourseById = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (course) {
//     res.json(course);
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// /**
//  * @desc    Update a course
//  * @route   PUT /api/courses/:id
//  * @access  Private/Admin
//  */
// const updateCourse = asyncHandler(async (req, res) => {
//   const { title, description, instructor, price, image, videos, rating, reviews, isFeatured } =
//     req.body;
//   const course = await Course.findById(req.params.id);

//   if (course) {
//     course.title = title || course.title;
//     course.description = description || course.description;
//     course.instructor = instructor || course.instructor;
//     course.price = price || course.price;
//     course.image = image || course.image;
//     course.videos = videos || course.videos;
//     course.rating = rating !== undefined ? rating : course.rating;
//     course.reviews = reviews !== undefined ? reviews : course.reviews;
//     course.isFeatured = isFeatured !== undefined ? isFeatured : course.isFeatured;

//     const updatedCourse = await course.save();
//     res.json(updatedCourse);
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// /**
//  * @desc    Delete a course
//  * @route   DELETE /api/courses/:id
//  * @access  Private/Admin
//  */
// const deleteCourse = asyncHandler(async (req, res) => {
//   const course = await Course.findById(req.params.id);
//   if (course) {
//     await course.remove();
//     res.json({ message: 'Course removed successfully.' });
//   } else {
//     res.status(404);
//     throw new Error('Course not found.');
//   }
// });

// module.exports = {
//   createCourse,
//   createFeaturedCourse,
//   getCourses,
//   getCourseById,
//   updateCourse,
//   deleteCourse,
// };
