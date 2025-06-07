const Joi = require('joi');

const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorMessage = error.details.map(detail => detail.message).join(', ');
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }

    next();
  };
};

// Validation schemas
const schemas = {
  // Auth schemas
  register: Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(6),
    role: Joi.string().valid('user', 'admin')
  }),

  login: Joi.object({
    email: Joi.string().required().email(),
    password: Joi.string().required()
  }),

  // Hotel schemas
  createHotel: Joi.object({
    name: Joi.string().required().min(2).max(100),
    description: Joi.string().required(),
    location: Joi.string().required(),
    starRating: Joi.number().required().min(1).max(5),
    images: Joi.array().items(Joi.string()).min(1).required(),
    amenities: Joi.array().items(Joi.string())
  }),

  updateHotel: Joi.object({
    name: Joi.string().min(2).max(100),
    description: Joi.string(),
    location: Joi.string(),
    starRating: Joi.number().min(1).max(5),
    images: Joi.array().items(Joi.string()),
    amenities: Joi.array().items(Joi.string()),
    isActive: Joi.boolean()
  }),

  // Room schemas
  createRoom: Joi.object({
    hotelId: Joi.string().required(),
    roomType: Joi.string().required(),
    roomNumber: Joi.string().required(),
    pricePerNight: Joi.number().required().min(0),
    maxGuests: Joi.number().required().min(1),
    amenities: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()).min(1).required(),
    description: Joi.string().required(),
    floor: Joi.number().required(),
    size: Joi.number().required(),
    bedType: Joi.string().required()
  }),

  updateRoom: Joi.object({
    roomType: Joi.string(),
    pricePerNight: Joi.number().min(0),
    maxGuests: Joi.number().min(1),
    amenities: Joi.array().items(Joi.string()),
    images: Joi.array().items(Joi.string()),
    description: Joi.string(),
    isAvailable: Joi.boolean(),
    floor: Joi.number(),
    size: Joi.number(),
    bedType: Joi.string()
  }),

  // Booking schemas
  createBooking: Joi.object({
    hotelId: Joi.string().required(),
    roomId: Joi.string().required(),
    startDate: Joi.date().required().min('now'),
    endDate: Joi.date().required().min(Joi.ref('startDate')),
    numberOfGuests: Joi.number().required().min(1),
    specialRequests: Joi.string(),
    paymentMethod: Joi.string().required()
  }),

  updateBooking: Joi.object({
    status: Joi.string().valid('pending', 'confirmed', 'cancelled', 'completed'),
    paymentStatus: Joi.string().valid('pending', 'paid', 'refunded', 'failed'),
    cancellationReason: Joi.string()
  })
};

module.exports = {
  validateRequest,
  schemas
}; 