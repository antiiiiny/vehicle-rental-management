const mongoose = require('mongoose');

// Minimal stub — only the fields needed for the availability-overlap query.
// Full booking workflow (pricing, add-ons, cancellation, status transitions)
// is Stage 2 and is not implemented yet.
const bookingSchema = new mongoose.Schema(
  {
    vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['reserved', 'picked_up', 'returned', 'cancelled'],
      default: 'reserved',
    },
  },
  { timestamps: true }
);

bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ customerId: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
