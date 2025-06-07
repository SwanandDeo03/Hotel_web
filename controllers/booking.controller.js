const asyncHandler = require('express-async-handler');
const Booking = require('../models/booking.model');
const Room = require('../models/room.model');
const Hotel = require('../models/hotel.model');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private
const createBooking = asyncHandler(async (req, res) => {
  const { roomId, startDate, endDate, numberOfGuests, specialRequests, paymentMethod } = req.body;

  // Check if room exists and is available
  const room = await Room.findById(roomId);
  if (!room) {
    res.status(404);
    throw new Error('Room not found');
  }

  if (!room.isAvailable) {
    res.status(400);
    throw new Error('Room is not available');
  }

  // Check if room is available for the requested dates
  const isAvailable = await room.isAvailableForDates(
    new Date(startDate),
    new Date(endDate)
  );

  if (!isAvailable) {
    res.status(400);
    throw new Error('Room is not available for the selected dates');
  }

  // Check if number of guests is within room capacity
  if (numberOfGuests > room.maxGuests) {
    res.status(400);
    throw new Error(`Room can only accommodate ${room.maxGuests} guests`);
  }

  // Calculate total price
  const duration = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
  const totalPrice = room.pricePerNight * duration;

  // Create booking
  const booking = await Booking.create({
    userId: req.user._id,
    hotelId: room.hotelId,
    roomId,
    startDate,
    endDate,
    numberOfGuests,
    specialRequests,
    paymentMethod,
    totalPrice
  });

  res.status(201).json({
    success: true,
    data: booking
  });
});

// @desc    Get user's bookings
// @route   GET /api/bookings
// @access  Private
const getUserBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = { userId: req.user._id };

  // Add status filter if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  const bookings = await Booking.find(query)
    .populate('hotelId', 'name location')
    .populate('roomId', 'roomType roomNumber')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    count: bookings.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: bookings
  });
});

// @desc    Get all bookings (admin only)
// @route   GET /api/bookings/all
// @access  Private/Admin
const getAllBookings = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const query = {};

  // Add filters
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.hotelId) {
    query.hotelId = req.query.hotelId;
  }

  if (req.query.startDate && req.query.endDate) {
    query.startDate = { $gte: new Date(req.query.startDate) };
    query.endDate = { $lte: new Date(req.query.endDate) };
  }

  const bookings = await Booking.find(query)
    .populate('userId', 'name email')
    .populate('hotelId', 'name location')
    .populate('roomId', 'roomType roomNumber')
    .skip(startIndex)
    .limit(limit)
    .sort('-createdAt');

  const total = await Booking.countDocuments(query);

  res.json({
    success: true,
    count: bookings.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data: bookings
  });
});

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('userId', 'name email')
    .populate('hotelId', 'name location')
    .populate('roomId', 'roomType roomNumber');

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user is authorized to view this booking
  if (req.user.role !== 'admin' && booking.userId._id.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to view this booking');
  }

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Cancel booking
// @route   PUT /api/bookings/:id/cancel
// @access  Private
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  // Check if user is authorized to cancel this booking
  if (req.user.role !== 'admin' && booking.userId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to cancel this booking');
  }

  // Check if booking can be cancelled
  if (!booking.canBeCancelled()) {
    res.status(400);
    throw new Error('Booking cannot be cancelled (less than 24 hours before check-in)');
  }

  booking.status = 'cancelled';
  booking.cancellationReason = req.body.reason;
  booking.paymentStatus = 'refunded';
  await booking.save();

  res.json({
    success: true,
    data: booking
  });
});

// @desc    Update booking status (admin only)
// @route   PUT /api/bookings/:id/status
// @access  Private/Admin
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, paymentStatus } = req.body;

  const booking = await Booking.findById(req.params.id);

  if (!booking) {
    res.status(404);
    throw new Error('Booking not found');
  }

  if (status) booking.status = status;
  if (paymentStatus) booking.paymentStatus = paymentStatus;

  await booking.save();

  res.json({
    success: true,
    data: booking
  });
});

module.exports = {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus
}; 