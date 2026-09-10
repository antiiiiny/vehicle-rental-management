const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'vehicleId is required'],
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'customerId is required'],
    },
    startDate: {
      type: Date,
      required: [true, 'startDate is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'endDate is required'],
    },
    status: {
      type: String,
      enum: ['reserved', 'picked_up', 'returned', 'cancelled'],
      default: 'reserved',
    },
    baseRate: {
      type: Number,
      required: true,
      min: 0,
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    damageFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    lateFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    extraCharges: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      default: function () {
        return this.totalAmount;
      },
      min: 0,
    },
    cancellationReason: {
      type: String,
      trim: true,
    },
    cancelledAt: {
      type: Date,
    },
    cancellationFee: {
      type: Number,
      default: 0,
      min: 0,
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    addons: [
      {
        addonId: { type: String, required: true },
        name: { type: String, required: true },
        ratePerDay: { type: Number, required: true, min: 0 },
        totalAmount: { type: Number, required: true, min: 0 },
      },
    ],
    addonsTotal: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

bookingSchema.index({ vehicleId: 1, startDate: 1, endDate: 1 });
bookingSchema.index({ customerId: 1 });
bookingSchema.index({ status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);

