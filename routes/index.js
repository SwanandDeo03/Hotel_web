const express = require('express');
const router = express.Router();
const authRoutes = require('./auth.routes');
const hotelRoutes = require('./hotel.routes');
const bookingRoutes = require('./booking.routes');

// Mount routes
router.use('/auth', authRoutes);
router.use('/hotels', hotelRoutes);
router.use('/bookings', bookingRoutes);

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// 404 handler
router.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

module.exports = router;