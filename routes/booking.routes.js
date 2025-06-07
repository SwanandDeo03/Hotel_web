const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { validateRequest, schemas } = require('../middlewares/validateRequest');
const {
  createBooking,
  getUserBookings,
  getAllBookings,
  getBooking,
  cancelBooking,
  updateBookingStatus
} = require('../controllers/booking.controller');

// Protected routes (User)
router.post('/', protect, validateRequest(schemas.createBooking), createBooking);
router.get('/my-bookings', protect, getUserBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/cancel', protect, cancelBooking);

// Protected routes (Admin)
router.get('/admin/all', protect, isAdmin, getAllBookings);
router.put('/admin/:id/status', protect, isAdmin, validateRequest(schemas.updateBookingStatus), updateBookingStatus);

module.exports = router; 