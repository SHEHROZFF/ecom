const asyncHandler = require('express-async-handler');
const Ad = require('../models/Ad');

/**
 * @desc    Create a new ad
 * @route   POST /api/ads
 * @access  Private/Admin
 */
const createAd = asyncHandler(async (req, res) => {
  const { image, title, subtitle } = req.body;

  if (!image || !title || !subtitle) {
    res.status(400);
    throw new Error('Please provide image, title, and subtitle for the ad.');
  }

  const ad = new Ad({ image, title, subtitle });
  const createdAd = await ad.save();
  res.status(201).json(createdAd);
});

/**
 * @desc    Get all ads
 * @route   GET /api/ads
 * @access  Public
 */
const getAds = asyncHandler(async (req, res) => {
  const ads = await Ad.find({});
  res.json(ads);
});

/**
 * @desc    Get a single ad by ID
 * @route   GET /api/ads/:id
 * @access  Public
 */
const getAdById = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (ad) {
    res.json(ad);
  } else {
    res.status(404);
    throw new Error('Ad not found');
  }
});

/**
 * @desc    Update an ad
 * @route   PUT /api/ads/:id
 * @access  Private/Admin
 */
const updateAd = asyncHandler(async (req, res) => {
  const { image, title, subtitle } = req.body;
  const ad = await Ad.findById(req.params.id);

  if (ad) {
    ad.image = image || ad.image;
    ad.title = title || ad.title;
    ad.subtitle = subtitle || ad.subtitle;
    const updatedAd = await ad.save();
    res.json(updatedAd);
  } else {
    res.status(404);
    throw new Error('Ad not found');
  }
});

/**
 * @desc    Delete an ad
 * @route   DELETE /api/ads/:id
 * @access  Private/Admin
 */
const deleteAd = asyncHandler(async (req, res) => {
  const ad = await Ad.findById(req.params.id);
  if (ad) {
    await ad.remove();
    res.json({ message: 'Ad removed successfully' });
  } else {
    res.status(404);
    throw new Error('Ad not found');
  }
});

module.exports = {
  createAd,
  getAds,
  getAdById,
  updateAd,
  deleteAd,
};
