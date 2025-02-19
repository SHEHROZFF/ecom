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
