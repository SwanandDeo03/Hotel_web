const express = require('express');
const router = express.Router();
const { protect } = require('../middlewares/auth.middleware');
const { validateRequest, schemas } = require('../middlewares/validateRequest');
const {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile
} = require('../controllers/auth.controller');

// Public routes
router.post('/register', validateRequest(schemas.register), registerUser);
router.post('/login', validateRequest(schemas.login), loginUser);

// Protected routes
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, validateRequest(schemas.register), updateUserProfile);

module.exports = router; 