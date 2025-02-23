const asyncHandler = require('express-async-handler');
const Ad = require('../models/Ad');

/**
 * @desc    Create a new ad
 * @route   POST /api/ads
 * @access  Private/Admin
 */
const createAd = asyncHandler(async (req, res) => {
  const {
    image,
    title,
    subtitle,
    description,
    link,
    category,
    price,
    startDate,
    endDate,
    targetAudience,
    ctaText,
    priority,
    cardDesign,
    layoutHint,
    displayPriority,
    variant,
    backgroundColor,
    textColor,
  } = req.body;

  if (!image || !title || !subtitle) {
    res.status(400);
    throw new Error('Please provide image, title, and subtitle for the ad.');
  }

  const ad = new Ad({
    image,
    title,
    subtitle,
    description,
    link,
    category,
    price,
    startDate,
    endDate,
    targetAudience,
    ctaText,
    priority,
    cardDesign,
    layoutHint,
    displayPriority,
    variant,
    backgroundColor,
    textColor,
  });

  const createdAd = await ad.save();
  res.status(201).json(createdAd);
});

/**
 * @desc    Get all ads (optionally filter by active status)
 * @route   GET /api/ads
 * @access  Public
 */
const getAds = asyncHandler(async (req, res) => {
  // Optionally add query filtering here (e.g., only active ads)
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
  const {
    image,
    title,
    subtitle,
    description,
    link,
    category,
    price,
    startDate,
    endDate,
    targetAudience,
    ctaText,
    priority,
    cardDesign,
    layoutHint,
    displayPriority,
    variant,
    backgroundColor,
    textColor,
  } = req.body;

  const ad = await Ad.findById(req.params.id);

  if (ad) {
    ad.image = image || ad.image;
    ad.title = title || ad.title;
    ad.subtitle = subtitle || ad.subtitle;
    ad.description = description || ad.description;
    ad.link = link || ad.link;
    ad.category = category || ad.category;
    ad.price = price || ad.price;
    ad.startDate = startDate || ad.startDate;
    ad.endDate = endDate || ad.endDate;
    ad.targetAudience = targetAudience || ad.targetAudience;
    ad.ctaText = ctaText || ad.ctaText;
    ad.priority = priority || ad.priority;
    ad.cardDesign = cardDesign || ad.cardDesign;
    ad.layoutHint = layoutHint || ad.layoutHint;
    ad.displayPriority = displayPriority || ad.displayPriority;
    ad.variant = variant || ad.variant;
    ad.backgroundColor = backgroundColor || ad.backgroundColor;
    ad.textColor = textColor || ad.textColor;

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










// const asyncHandler = require('express-async-handler');
// const Ad = require('../models/Ad');

// /**
//  * @desc    Create a new ad
//  * @route   POST /api/ads
//  * @access  Private/Admin
//  */
// const createAd = asyncHandler(async (req, res) => {
//   const {
//     image,
//     title,
//     subtitle,
//     description,
//     link,
//     category,
//     price,
//     startDate,
//     endDate,
//     targetAudience,
//     ctaText,
//     priority,
//     cardDesign,
//     backgroundColor,
//     textColor,
//   } = req.body;

//   // Check required fields (keeping backwards compatibility with image, title, subtitle)
//   if (!image || !title || !subtitle) {
//     res.status(400);
//     throw new Error('Please provide image, title, and subtitle for the ad.');
//   }

//   const ad = new Ad({
//     image,
//     title,
//     subtitle,
//     description,
//     link,
//     category,
//     price,
//     startDate,
//     endDate,
//     targetAudience,
//     ctaText,
//     priority,
//     cardDesign,
//     backgroundColor,
//     textColor,
//   });

//   const createdAd = await ad.save();
//   res.status(201).json(createdAd);
// });

// /**
//  * @desc    Get all ads
//  * @route   GET /api/ads
//  * @access  Public
//  */
// const getAds = asyncHandler(async (req, res) => {
//   const ads = await Ad.find({});
//   res.json(ads);
// });

// /**
//  * @desc    Get a single ad by ID
//  * @route   GET /api/ads/:id
//  * @access  Public
//  */
// const getAdById = asyncHandler(async (req, res) => {
//   const ad = await Ad.findById(req.params.id);
//   if (ad) {
//     res.json(ad);
//   } else {
//     res.status(404);
//     throw new Error('Ad not found');
//   }
// });

// /**
//  * @desc    Update an ad
//  * @route   PUT /api/ads/:id
//  * @access  Private/Admin
//  */
// const updateAd = asyncHandler(async (req, res) => {
//   const {
//     image,
//     title,
//     subtitle,
//     description,
//     link,
//     category,
//     price,
//     startDate,
//     endDate,
//     targetAudience,
//     ctaText,
//     priority,
//     cardDesign,
//     backgroundColor,
//     textColor,
//   } = req.body;

//   const ad = await Ad.findById(req.params.id);

//   if (ad) {
//     ad.image = image || ad.image;
//     ad.title = title || ad.title;
//     ad.subtitle = subtitle || ad.subtitle;
//     ad.description = description || ad.description;
//     ad.link = link || ad.link;
//     ad.category = category || ad.category;
//     ad.price = price || ad.price;
//     ad.startDate = startDate || ad.startDate;
//     ad.endDate = endDate || ad.endDate;
//     ad.targetAudience = targetAudience || ad.targetAudience;
//     ad.ctaText = ctaText || ad.ctaText;
//     ad.priority = priority || ad.priority;
//     ad.cardDesign = cardDesign || ad.cardDesign;
//     ad.backgroundColor = backgroundColor || ad.backgroundColor;
//     ad.textColor = textColor || ad.textColor;

//     const updatedAd = await ad.save();
//     res.json(updatedAd);
//   } else {
//     res.status(404);
//     throw new Error('Ad not found');
//   }
// });

// /**
//  * @desc    Delete an ad
//  * @route   DELETE /api/ads/:id
//  * @access  Private/Admin
//  */
// const deleteAd = asyncHandler(async (req, res) => {
//   const ad = await Ad.findById(req.params.id);
//   if (ad) {
//     await ad.remove();
//     res.json({ message: 'Ad removed successfully' });
//   } else {
//     res.status(404);
//     throw new Error('Ad not found');
//   }
// });

// module.exports = {
//   createAd,
//   getAds,
//   getAdById,
//   updateAd,
//   deleteAd,
// };







// const asyncHandler = require('express-async-handler');
// const Ad = require('../models/Ad');

// /**
//  * @desc    Create a new ad
//  * @route   POST /api/ads
//  * @access  Private/Admin
//  */
// const createAd = asyncHandler(async (req, res) => {
//   const { image, title, subtitle } = req.body;

//   if (!image || !title || !subtitle) {
//     res.status(400);
//     throw new Error('Please provide image, title, and subtitle for the ad.');
//   }

//   const ad = new Ad({ image, title, subtitle });
//   const createdAd = await ad.save();
//   res.status(201).json(createdAd);
// });

// /**
//  * @desc    Get all ads
//  * @route   GET /api/ads
//  * @access  Public
//  */
// const getAds = asyncHandler(async (req, res) => {
//   const ads = await Ad.find({});
//   res.json(ads);
// });

// /**
//  * @desc    Get a single ad by ID
//  * @route   GET /api/ads/:id
//  * @access  Public
//  */
// const getAdById = asyncHandler(async (req, res) => {
//   const ad = await Ad.findById(req.params.id);
//   if (ad) {
//     res.json(ad);
//   } else {
//     res.status(404);
//     throw new Error('Ad not found');
//   }
// });

// /**
//  * @desc    Update an ad
//  * @route   PUT /api/ads/:id
//  * @access  Private/Admin
//  */
// const updateAd = asyncHandler(async (req, res) => {
//   const { image, title, subtitle } = req.body;
//   const ad = await Ad.findById(req.params.id);

//   if (ad) {
//     ad.image = image || ad.image;
//     ad.title = title || ad.title;
//     ad.subtitle = subtitle || ad.subtitle;
//     const updatedAd = await ad.save();
//     res.json(updatedAd);
//   } else {
//     res.status(404);
//     throw new Error('Ad not found');
//   }
// });

// /**
//  * @desc    Delete an ad
//  * @route   DELETE /api/ads/:id
//  * @access  Private/Admin
//  */
// const deleteAd = asyncHandler(async (req, res) => {
//   const ad = await Ad.findById(req.params.id);
//   if (ad) {
//     await ad.remove();
//     res.json({ message: 'Ad removed successfully' });
//   } else {
//     res.status(404);
//     throw new Error('Ad not found');
//   }
// });

// module.exports = {
//   createAd,
//   getAds,
//   getAdById,
//   updateAd,
//   deleteAd,
// };
