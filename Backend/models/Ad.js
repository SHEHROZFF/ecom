const mongoose = require('mongoose');

const adSchema = mongoose.Schema(
  {
    image: {
      type: String,
      required: [true, 'Please add an ad image URL.'],
      match: [
        /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i,
        'Please enter a valid image URL.',
      ],
    },
    title: {
      type: String,
      required: [true, 'Please add a title for the ad.'],
    },
    subtitle: {
      type: String,
      required: [true, 'Please add a subtitle for the ad.'],
    },
  },
  { timestamps: true }
);

const Ad = mongoose.model('Ad', adSchema);
module.exports = Ad;



// const mongoose = require('mongoose');

// const adSchema = mongoose.Schema(
//   {
//     image: {
//       type: String,
//       required: [true, 'Please add an ad image URL.'],
//       match: [
//         /^(https?:\/\/.*\.(?:png|jpg|jpeg|gif|svg|webp))$/i,
//         'Please enter a valid image URL.',
//       ],
//     },
//     title: {
//       type: String,
//       required: [true, 'Please add a title for the ad.'],
//     },
//     subtitle: {
//       type: String,
//       required: [true, 'Please add a subtitle for the ad.'],
//     },
//     description: {
//       type: String,
//       required: [true, 'Please add a description for the ad.'],
//       maxlength: [500, 'Description cannot exceed 500 characters.'],
//     },
//     link: {
//       type: String,
//       required: [true, 'Please add a link to the ad.'],
//       match: [/^(https?:\/\/[^\s$.?#].[^\s]*)$/, 'Please enter a valid URL.'],
//     },
//     category: {
//       type: String,
//       enum: ['New Course', 'Product', 'Sale', 'Promotion', 'Event'],
//       required: [true, 'Please specify the ad category.'],
//     },
//     price: {
//       type: Number,
//       required: false, // Only for product ads
//     },
//     startDate: {
//       type: Date,
//       required: true,
//     },
//     endDate: {
//       type: Date,
//       required: true,
//     },
//     status: {
//       type: String,
//       enum: ['Active', 'Paused', 'Expired'],
//       default: 'Active',
//     },
//     targetAudience: {
//       type: String,
//       enum: ['Beginner', 'Intermediate', 'Advanced', 'General'],
//       required: false, // Optional, depending on the ad content
//     },
//     ctaText: {
//       type: String,
//       default: 'Learn More',
//     },
//     priority: {
//       type: Number,
//       default: 1, // Ads with lower priority numbers will be displayed first
//     },
//   },
//   { timestamps: true }
// );

// const Ad = mongoose.model('Ad', adSchema);
// module.exports = Ad;
