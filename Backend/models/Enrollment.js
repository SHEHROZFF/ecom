const mongoose = require('mongoose');

const enrollmentSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    // ---- Payment / Transaction Info ----
    paymentStatus: {
      type: String,
      enum: ['not_required', 'paid', 'pending', 'refunded'],
      default: 'not_required',
    },
    paymentMethod: {
      type: String,
      default: '', // e.g., 'credit_card', 'paypal', etc.
    },
    transactionId: {
      type: String,
      default: '',
    },
    pricePaid: {
      type: Number,
      default: 0,
    },
    discountCode: {
      type: String,
      default: '',
    },
    // ---- Progress & Completion ----
    progress: {
      type: Number,
      default: 0, // e.g., 0 to 100
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled', 'paused'],
      default: 'active',
    },
    lastAccessed: {
      type: Date,
      default: Date.now,
    },
    completionDate: {
      type: Date,
      default: null, // Ensure a clean DB schema
    },
    // ---- Certification ----
    certificateUrl: {
      type: String,
      default: '',
    },
    // ---- Lesson-Level Tracking ----
    lessonsProgress: [
      {
        lessonId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'VideoLesson',
          required: true,
        },
        watchedDuration: {
          type: Number,
          default: 0,
          min: 0,
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
    notes: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// ✅ Index to ensure a user cannot enroll in the same course twice
enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// ✅ Pre-delete Hook: Ensure no orphan progress data
enrollmentSchema.pre('deleteOne', { document: true, query: false }, async function (next) {
  console.log(`Removing lesson progress for enrollment ${this._id}`);
  await this.model('Enrollment').updateMany(
    { _id: this._id },
    { $set: { lessonsProgress: [] } }
  );
  next();
});

const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
module.exports = Enrollment;










// // models/Enrollment.js
// const mongoose = require('mongoose');

// const enrollmentSchema = mongoose.Schema(
//   {
//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'User',
//       required: true,
//     },
//     course: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: 'Course',
//       required: true,
//     },
//     enrolledAt: {
//       type: Date,
//       default: Date.now,
//     },
//     // ---- Payment / Transaction Info ----
//     paymentStatus: {
//       type: String,
//       enum: ['not_required', 'paid', 'pending', 'refunded'],
//       default: 'not_required',
//     },
//     paymentMethod: {
//       type: String,
//       default: '', // e.g. 'credit_card', 'paypal', etc.
//     },
//     transactionId: {
//       type: String,
//       default: '',
//     },
//     pricePaid: {
//       type: Number,
//       default: 0,
//     },
//     discountCode: {
//       type: String,
//       default: '',
//     },
//     // ---- Progress & Completion ----
//     progress: {
//       type: Number,
//       default: 0, // e.g. 0 to 100
//     },
//     status: {
//       type: String,
//       enum: ['active', 'completed', 'cancelled', 'paused'],
//       default: 'active',
//     },
//     lastAccessed: {
//       type: Date,
//       default: Date.now,
//     },
//     completionDate: {
//       type: Date,
//     },
//     // ---- Certification ----
//     certificateUrl: {
//       type: String,
//       default: '',
//     },
//     // ---- Optional Lesson-Level Tracking ----
//     lessonsProgress: [
//       {
//         lessonId: String, // or mongoose.Schema.Types.ObjectId if lessons are in a separate collection
//         watchedDuration: Number,
//         completed: {
//           type: Boolean,
//           default: false,
//         },
//       },
//     ],
//     notes: {
//       type: String,
//       default: '',
//     },
//   },
//   {
//     timestamps: true,
//   }
// );

// // Ensure a user cannot enroll in the same course twice
// enrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

// const Enrollment = mongoose.model('Enrollment', enrollmentSchema);
// module.exports = Enrollment;


