const mongoose = require('mongoose');

// Define a schema for each video in the course with priority and coverImage fields
const videoSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a video title.'],
    },
    url: {
      type: String,
      required: [true, 'Please add a video URL.'],
      match: [
        /^(https?:\/\/.*\.(?:mp4|webm|ogg))$/i,
        'Please enter a valid video URL.',
      ],
    },
    coverImage: {
      type: String,
      default: '', // Optional cover image URL for the video
      match: [
        /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i,
        'Please enter a valid image URL.',
      ],
    },
    description: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // duration in seconds
      default: 0,
    },
    priority: {
      type: Number,
      default: 0, // Lower number = higher priority
    },
  },
  { _id: false } // No separate _id for each video object
);

const courseSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a course title.'],
    },
    description: {
      type: String,
      required: [true, 'Please add a course description.'],
    },
    instructor: {
      type: String,
      required: [true, 'Please add an instructor name.'],
    },
    price: {
      type: Number,
      required: [true, 'Please add a price.'],
      min: [0, 'Price must be a positive number.'],
    },
    image: {
      type: String,
      required: [true, 'Please add an image URL.'],
      match: [
        /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i,
        'Please enter a valid image URL.',
      ],
    },
    // Videos as an array of objects (each with coverImage, etc.)
    videos: {
      type: [videoSchema],
      default: [],
    },
    rating: {
      type: Number,
      default: 0,
    },
    reviews: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // New Field: Short Video Link for featured courses
    shortVideoLink: {
      type: String,
      default: '',
      match: [
        /^(https?:\/\/.*\.(?:mp4|webm|ogg))$/i,
        'Please enter a valid video URL.',
      ],
    },
  },
  { timestamps: true }
);

// Pre-save hook: sort videos by priority (ascending)
courseSchema.pre('save', function (next) {
  if (this.videos && this.videos.length > 0) {
    this.videos.sort((a, b) => a.priority - b.priority);
  }
  next();
});

// Pre deleteOne middleware to cascade deletion of reviews for this course
courseSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  console.log(`Cascade delete: Removing reviews for course ${this._id}`);
  await this.model('Review').deleteMany({
    reviewable: this._id,
    reviewableModel: 'Course',
  });
  next();
});

// Static method to calculate aggregated rating and review count for a course
courseSchema.statics.calculateRatings = async function (courseId) {
  const Review = mongoose.model('Review');
  const courseObjectId = new mongoose.Types.ObjectId(courseId);

  console.log('Calculating ratings for course:', courseId);

  const result = await Review.aggregate([
    {
      $match: {
        reviewable: courseObjectId,
        reviewableModel: 'Course',
      },
    },
    {
      $group: {
        _id: '$reviewable',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  console.log('Aggregation result for course:', result);

  if (result.length > 0) {
    await this.findByIdAndUpdate(courseId, {
      rating: result[0].averageRating,
      reviews: result[0].totalReviews,
    });
  } else {
    await this.findByIdAndUpdate(courseId, {
      rating: 0,
      reviews: 0,
    });
  }
};

const Course = mongoose.model('Course', courseSchema);
module.exports = Course;











// const mongoose = require('mongoose');

// // Define a schema for each video in the course with priority and coverImage fields
// const videoSchema = new mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: [true, 'Please add a video title.'],
//     },
//     url: {
//       type: String,
//       required: [true, 'Please add a video URL.'],
//       match: [
//         /^(https?:\/\/.*\.(?:mp4|webm|ogg))$/i,
//         'Please enter a valid video URL.',
//       ],
//     },
//     coverImage: {
//       type: String,
//       default: '', // Optional cover image URL for the video
//       match: [
//         /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i,
//         'Please enter a valid image URL.',
//       ],
//     },
//     description: {
//       type: String,
//       default: '',
//     },
//     duration: {
//       type: Number, // duration in seconds
//       default: 0,
//     },
//     priority: {
//       type: Number,
//       default: 0, // Lower number = higher priority
//     },
//   },
//   { _id: false } // No separate _id for each video object
// );

// const courseSchema = mongoose.Schema(
//   {
//     title: {
//       type: String,
//       required: [true, 'Please add a course title.'],
//     },
//     description: {
//       type: String,
//       required: [true, 'Please add a course description.'],
//     },
//     instructor: {
//       type: String,
//       required: [true, 'Please add an instructor name.'],
//     },
//     price: {
//       type: Number,
//       required: [true, 'Please add a price.'],
//       min: [0, 'Price must be a positive number.'],
//     },
//     image: {
//       type: String,
//       required: [true, 'Please add an image URL.'],
//       match: [
//         /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i,
//         'Please enter a valid image URL.',
//       ],
//     },
//     // Videos as an array of objects (each with coverImage, etc.)
//     videos: {
//       type: [videoSchema],
//       default: [],
//     },
//     rating: {
//       type: Number,
//       default: 0,
//     },
//     reviews: {
//       type: Number,
//       default: 0,
//     },
//     isFeatured: {
//       type: Boolean,
//       default: false,
//     },
//   },
//   { timestamps: true }
// );

// // Pre-save hook: sort videos by priority (ascending)
// courseSchema.pre('save', function (next) {
//   if (this.videos && this.videos.length > 0) {
//     this.videos.sort((a, b) => a.priority - b.priority);
//   }
//   next();
// });

// // Pre deleteOne middleware to cascade deletion of reviews for this course
// courseSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
//   console.log(`Cascade delete: Removing reviews for course ${this._id}`);
//   await this.model('Review').deleteMany({
//     reviewable: this._id,
//     reviewableModel: 'Course',
//   });
//   next();
// });

// // Static method to calculate aggregated rating and review count for a course
// courseSchema.statics.calculateRatings = async function (courseId) {
//   const Review = mongoose.model('Review');
//   const courseObjectId = new mongoose.Types.ObjectId(courseId);

//   console.log('Calculating ratings for course:', courseId);

//   const result = await Review.aggregate([
//     {
//       $match: {
//         reviewable: courseObjectId,
//         reviewableModel: 'Course',
//       },
//     },
//     {
//       $group: {
//         _id: '$reviewable',
//         averageRating: { $avg: '$rating' },
//         totalReviews: { $sum: 1 },
//       },
//     },
//   ]);

//   console.log('Aggregation result for course:', result);

//   if (result.length > 0) {
//     await this.findByIdAndUpdate(courseId, {
//       rating: result[0].averageRating,
//       reviews: result[0].totalReviews,
//     });
//   } else {
//     await this.findByIdAndUpdate(courseId, {
//       rating: 0,
//       reviews: 0,
//     });
//   }
// };

// const Course = mongoose.model('Course', courseSchema);
// module.exports = Course;











