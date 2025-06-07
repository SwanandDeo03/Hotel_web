const asyncHandler = require('express-async-handler');
const Room = require('../models/room.model');
const Hotel = require('../models/hotel.model');

// @desc    Create a new room
// @route   POST /api/rooms
// @access  Private/Admin
const createRoom = asyncHandler(async (req, res) => {
  // Check if hotel exists
  const hotel = await Hotel.findById(req.body.hotelId);
  if (!hotel) {
    res.status(404);
    throw new Error('Hotel not found');
  }

  // Check if room number is unique
  const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
  if (existingRoom) {
    res.status(400);
    throw new Error('Room number already exists');
  }

  const room = await Room.create(req.body);

  res.status(201).json({
    success: true,
    data: room
  });
});

// @desc    Get all rooms with filters
// @route   GET /api/rooms
// @access  Public
const getRooms = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Build query
  const query = { isAvailable: true };

  // Add filters
  if (req.query.hotelId) {
    query.hotelId = req.query.hotelId;
  }

  if (req.query.roomType) {
    query.roomType = req.query.roomType;
  }

  if (req.query.priceMin || req.query.priceMax) {
    query.pricePerNight = {};
    if (req.query.priceMin) query.pricePerNight.$gte = parseInt(req.query.priceMin);
    if (req.query.priceMax) query.pricePerNight.$lte = parseInt(req.query.priceMax);
  }

  if (req.query.amenities) {
    const amenities = req.query.amenities.split(',');
    query.amenities = { $all: amenities };
  }

  if (req.query.maxGuests) {
    query.maxGuests = { $gte: parseInt(req.query.maxGuests) };
  }

  // Execute query
  const rooms = await Room.find(query)
    .populate('hotelId', 'name location starRating')
    .skip(startIndex)
    .limit(limit)
    .sort('pricePerNight');

  // Get total count for pagination
  const total = await Room.countDocuments(query);

  res.json({
    success: true,
    count: rooms.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: rooms
  });
});

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Public
const getRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate('hotelId', 'name location starRating amenities');

  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  res.json({
    success: true,
    data: room
  });
});

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
const updateRoom = asyncHandler(async (req, res) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  // Check if hotel exists if hotelId is being updated
  if (req.body.hotelId) {
    const hotel = await Hotel.findById(req.body.hotelId);
    if (!hotel) {
      res.status(404);
      throw new Error('Hotel not found');
    }
  }

  // Check if room number is unique if being updated
  if (req.body.roomNumber && req.body.roomNumber !== room.roomNumber) {
    const existingRoom = await Room.findOne({ roomNumber: req.body.roomNumber });
    if (existingRoom) {
      res.status(400);
      throw new Error('Room number already exists');
    }
  }

  room = await Room.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true
    }
  ).populate('hotelId', 'name location starRating');

  res.json({
    success: true,
    data: room
  });
});

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  // Check if room has any active bookings
  const hasActiveBookings = await room.bookings.some(booking => 
    booking.status === 'confirmed' && booking.endDate > new Date()
  );

  if (hasActiveBookings) {
    res.status(400);
    throw new Error('Cannot delete room with active bookings');
  }

  await room.remove();

  res.json({
    success: true,
    data: {}
  });
});

// @desc    Check room availability
// @route   GET /api/rooms/:id/availability
// @access  Public
const checkAvailability = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    res.status(400);
    throw new Error('Please provide both start and end dates');
  }

  const room = await Room.findById(req.params.id);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  const isAvailable = await room.isAvailableForDates(
    new Date(startDate),
    new Date(endDate)
  );

  res.json({
    success: true,
    data: {
      isAvailable,
      roomId: room._id,
      hotelId: room.hotelId,
      pricePerNight: room.pricePerNight,
      totalPrice: isAvailable ? 
        room.pricePerNight * Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24)) : 
        null
    }
  });
});

module.exports = {
  createRoom,
  getRooms,
  getRoom,
  updateRoom,
  deleteRoom,
  checkAvailability
}; 