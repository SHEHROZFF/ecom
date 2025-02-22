const mongoose = require('mongoose');

const videoLessonSchema = new mongoose.Schema(
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
      default: '',
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
      type: Number, // duration in seconds or minutes
      default: 0,
    },
    priority: {
      type: Number,
      default: 0, // Lower number means higher priority
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
  },
  { timestamps: true }
);

const VideoLesson = mongoose.model('VideoLesson', videoLessonSchema);
module.exports = VideoLesson;
