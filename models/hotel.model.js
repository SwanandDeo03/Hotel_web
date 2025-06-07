const mongoose = require('mongoose');

const hotelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide hotel name'],
    trim: true,
    maxlength: [100, 'Hotel name cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please provide hotel description'],
    trim: true
  },
  location: {
    type: String,
    required: [true, 'Please provide hotel location'],
    trim: true
  },
  starRating: {
    type: Number,
    required: [true, 'Please provide star rating'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot be more than 5']
  },
  images: [{
    type: String,
    required: [true, 'Please provide at least one image']
  }],
  amenities: [{
    type: String,
    enum: ['WiFi', 'Pool', 'AC', 'Gym', 'Parking', 'Restaurant', 'Pet-friendly', 'Spa', 'Bar', 'Room Service']
  }],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate rooms
hotelSchema.virtual('rooms', {
  ref: 'Room',
  localField: '_id',
  foreignField: 'hotelId',
  justOne: false
});

// Index for search
hotelSchema.index({ name: 'text', location: 'text', description: 'text' });

module.exports = mongoose.model('Hotel', hotelSchema); 