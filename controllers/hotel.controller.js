const asyncHandler = require('express-async-handler');
const Hotel = require('../models/hotel.model');

// @desc    Create a new hotel
// @route   POST /api/hotels
// @access  Private/Admin
const createHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.create({
    ...req.body,
    createdBy: req.user._id
  });

  res.status(201).json({
    success: true,
    data: hotel
  });
});

// @desc    Get all hotels with filters
// @route   GET /api/hotels
// @access  Public
const getHotels = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Build query
  const query = { isActive: true };

  // Add filters
  if (req.query.location) {
    query.location = { $regex: req.query.location, $options: 'i' };
  }

  if (req.query.starRating) {
    query.starRating = parseInt(req.query.starRating);
  }

  if (req.query.amenities) {
    const amenities = req.query.amenities.split(',');
    query.amenities = { $all: amenities };
  }

  // Execute query
  const hotels = await Hotel.find(query)
    .populate('createdBy', 'name email')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  // Get total count for pagination
  const total = await Hotel.countDocuments(query);

  res.json({
    success: true,
    count: hotels.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: hotels
  });
});

// @desc    Get single hotel
// @route   GET /api/hotels/:id
// @access  Public
const getHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id)
    .populate('createdBy', 'name email')
    .populate({
      path: 'rooms',
      match: { isAvailable: true }
    });

  if (!hotel) {
    res.status(404);
    throw new Error('Hotel not found');
  }

  res.json({
    success: true,
    data: hotel
  });
});

// @desc    Update hotel
// @route   PUT /api/hotels/:id
// @access  Private/Admin
const updateHotel = asyncHandler(async (req, res) => {
  let hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    res.status(404);
    throw new Error('Hotel not found');
  }

  // Check if user is admin or creator
  if (req.user.role !== 'admin' && hotel.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to update this hotel');
  }

  hotel = await Hotel.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('createdBy', 'name email');

  res.json({
    success: true,
    data: hotel
  });
});

// @desc    Delete hotel
// @route   DELETE /api/hotels/:id
// @access  Private/Admin
const deleteHotel = asyncHandler(async (req, res) => {
  const hotel = await Hotel.findById(req.params.id);

  if (!hotel) {
    res.status(404);
    throw new Error('Hotel not found');
  }

  // Check if user is admin or creator
  if (req.user.role !== 'admin' && hotel.createdBy.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to delete this hotel');
  }

  // Soft delete by setting isActive to false
  hotel.isActive = false;
  await hotel.save();

  res.json({
    success: true,
    data: {}
  });
});

// @desc    Search hotels
// @route   GET /api/hotels/search
// @access  Public
const searchHotels = asyncHandler(async (req, res) => {
  const { q } = req.query;

  if (!q) {
    res.status(400);
    throw new Error('Please provide a search query');
  }

  const hotels = await Hotel.find(
    {
      $text: { $search: q },
      isActive: true
    },
    { score: { $meta: 'textScore' } }
  )
    .sort({ score: { $meta: 'textScore' } })
    .populate('createdBy', 'name email')
    .limit(10);

  res.json({
    success: true,
    count: hotels.length,
    data: hotels
  });
});

module.exports = {
  createHotel,
  getHotels,
  getHotel,
  updateHotel,
  deleteHotel,
  searchHotels
}; 