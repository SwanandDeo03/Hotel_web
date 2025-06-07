const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please provide user ID']
  },
  hotelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hotel',
    required: [true, 'Please provide hotel ID']
  },
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: [true, 'Please provide room ID']
  },
  startDate: {
    type: Date,
    required: [true, 'Please provide check-in date']
  },
  endDate: {
    type: Date,
    required: [true, 'Please provide check-out date']
  },
  totalPrice: {
    type: Number,
    required: [true, 'Please provide total price']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled', 'completed'],
    default: 'pending'
  },
  numberOfGuests: {
    type: Number,
    required: [true, 'Please provide number of guests'],
    min: [1, 'Must have at least 1 guest']
  },
  specialRequests: {
    type: String,
    trim: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer'],
    required: [true, 'Please provide payment method']
  },
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for efficient querying
bookingSchema.index({ userId: 1, status: 1 });
bookingSchema.index({ hotelId: 1, status: 1 });
bookingSchema.index({ roomId: 1, status: 1 });
bookingSchema.index({ startDate: 1, endDate: 1 });

// Virtual for duration of stay
bookingSchema.virtual('duration').get(function() {
  return Math.ceil((this.endDate - this.startDate) / (1000 * 60 * 60 * 24));
});

// Method to check if booking can be cancelled
bookingSchema.methods.canBeCancelled = function() {
  const now = new Date();
  const hoursUntilCheckIn = (this.startDate - now) / (1000 * 60 * 60);
  return this.status === 'confirmed' && hoursUntilCheckIn >= 24;
};

// Pre-save middleware to validate dates
bookingSchema.pre('save', function(next) {
  if (this.startDate >= this.endDate) {
    next(new Error('Check-out date must be after check-in date'));
  }
  if (this.startDate < new Date()) {
    next(new Error('Cannot book for past dates'));
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema); 