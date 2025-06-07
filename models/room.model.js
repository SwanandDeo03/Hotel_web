const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Please provide hotel ID']
  },
  roomType: {
    type: String,
    required: [true, 'Please provide room type'],
    enum: ['Single', 'Double', 'Deluxe', 'Suite', 'Executive Suite', 'Presidential Suite']
  },
  roomNumber: {
    type: String,
    required: [true, 'Please provide room number'],
    unique: true,
    trim: true
  },
  pricePerNight: {
    type: Number,
    required: [true, 'Please provide price per night'],
    min: [0, 'Price cannot be negative']
  },
  maxGuests: {
    type: Number,
    required: [true, 'Please provide maximum number of guests'],
    min: [1, 'Room must accommodate at least 1 guest']
  },
  amenities: [{
    type: String,
    enum: ['WiFi', 'AC', 'TV', 'Mini Bar', 'Safe', 'Balcony', 'Ocean View', 'Mountain View', 'City View']
  }],
  images: [{
    type: String,
    required: [true, 'Please provide at least one image']
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    required: [true, 'Please provide room description'],
    trim: true
  },
  floor: {
    type: Number,
    required: [true, 'Please provide floor number']
  },
  size: {
    type: Number,
    required: [true, 'Please provide room size in square meters']
  },
  bedType: {
    type: String,
    required: [true, 'Please provide bed type'],
    enum: ['Single', 'Double', 'Queen', 'King', 'Twin']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate bookings
roomSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'roomId',
  justOne: false
});

// Index for search
roomSchema.index({ hotelId: 1, roomType: 1, pricePerNight: 1 });

// Method to check room availability for given dates
roomSchema.methods.isAvailableForDates = async function(startDate, endDate) {
  const Booking = mongoose.model('Booking');
  
  const conflictingBooking = await Booking.findOne({
    roomId: this._id,
    status: 'confirmed',
    $or: [
      {
        startDate: { $lte: endDate },
        endDate: { $gte: startDate }
      }
    ]
  });

  return !conflictingBooking;
};

module.exports = mongoose.model('Room', roomSchema); 