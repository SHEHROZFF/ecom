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
    description: {
      type: String,
      required: [true, 'Please add a description for the ad.'],
      maxlength: [500, 'Description cannot exceed 500 characters.'],
    },
    link: {
      type: String,
      required: [true, 'Please add a link to the ad.'],
      match: [
        /^(https?:\/\/[^\s$.?#].[^\s]*)$/,
        'Please enter a valid URL.',
      ],
    },
    // We still keep a category field if needed, but our grouping is by layoutType now
    category: {
      type: String,
      enum: ['New Course', 'Product', 'Sale', 'Promotion', 'Event'],
      required: [true, 'Please specify the ad category.'],
    },
    price: {
      type: Number,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Paused', 'Expired'],
      default: 'Active',
    },
    targetAudience: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced', 'General'],
    },
    ctaText: {
      type: String,
      default: 'Learn More',
    },
    priority: {
      type: Number,
      default: 1,
    },
    // New fields for dynamic UI decisions:
    cardDesign: {
      type: String,
      enum: ['basic', 'modern', 'minimal', 'detailed'],
      default: 'basic',
    },
    layoutType: {
      // Use this to group by card height/design—e.g., 'large', 'medium', 'small'
      type: String,
      enum: ['large', 'medium', 'small'],
      default: 'medium',
    },
    layoutHint: {
      // JSON field to allow custom layout properties (custom sizes, spacing, etc.)
      type: Object,
      default: {},
    },
    displayPriority: {
      type: Number,
      default: 1,
    },
    variant: {
      // For A/B testing different designs
      type: String,
      default: 'A',
    },
    backgroundColor: {
      type: String,
      default: '#ffffff',
    },
    textColor: {
      type: String,
      default: '#000000',
    },
    // Optional analytics counters (you can update these as needed)
    clicks: {
      type: Number,
      default: 0,
    },
    views: {
      type: Number,
      default: 0,
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
//       match: [
//         /^(https?:\/\/[^\s$.?#].[^\s]*)$/,
//         'Please enter a valid URL.',
//       ],
//     },
//     category: {
//       type: String,
//       enum: ['New Course', 'Product', 'Sale', 'Promotion', 'Event'],
//       required: [true, 'Please specify the ad category.'],
//     },
//     price: {
//       type: Number,
//       required: false,
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
//       required: false,
//     },
//     ctaText: {
//       type: String,
//       default: 'Learn More',
//     },
//     priority: {
//       type: Number,
//       default: 1,
//     },
//     // New field for card design
//     cardDesign: {
//       type: String,
//       enum: ['basic', 'modern', 'minimal', 'detailed'], // add as many as you want
//       default: 'basic',
//     },
//     // Optional design properties
//     backgroundColor: {
//       type: String,
//       default: '#ffffff',
//     },
//     textColor: {
//       type: String,
//       default: '#000000',
//     },
//   },
//   { timestamps: true }
// );

// const Ad = mongoose.model('Ad', adSchema);
// module.exports = Ad;







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
//   },
//   { timestamps: true }
// );

// const Ad = mongoose.model('Ad', adSchema);
// module.exports = Ad;



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
