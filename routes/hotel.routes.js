const express = require('express');
const router = express.Router();
const { protect, isAdmin } = require('../middlewares/auth.middleware');
const { validateRequest, schemas } = require('../middlewares/validateRequest');
const {
  createHotel,
  getHotels,
  getHotel,
  updateHotel,
  deleteHotel,
  searchHotels
} = require('../controllers/hotel.controller');

// Public routes
router.get('/', getHotels);
router.get('/search', searchHotels);
router.get('/:id', getHotel);

// Protected routes (Admin only)
router.post('/', protect, isAdmin, validateRequest(schemas.createHotel), createHotel);
router.put('/:id', protect, isAdmin, validateRequest(schemas.updateHotel), updateHotel);
router.delete('/:id', protect, isAdmin, deleteHotel);

module.exports = router; 