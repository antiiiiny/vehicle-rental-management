const mongoose = require('mongoose');

const inspectionSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'bookingId is required'],
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'vehicleId is required'],
    },
    inspectorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'inspectorId is required'],
    },
    stage: {
      type: String,
      enum: ['pickup', 'return'],
      required: [true, 'stage is required'],
    },
    odometer: {
      type: Number,
      required: [true, 'odometer is required'],
      min: [0, 'odometer must be non-negative'],
    },
    fuelLevel: {
      type: String,
      required: [true, 'fuelLevel is required'],
      trim: true,
    },
    damageNotes: {
      type: String,
      default: '',
      trim: true,
    },
    damageCharges: {
      type: Number,
      default: 0,
      min: [0, 'damageCharges must be non-negative'],
    },
    fuelCharges: {
      type: Number,
      default: 0,
      min: [0, 'fuelCharges must be non-negative'],
    },
    lateFee: {
      type: Number,
      default: 0,
      min: [0, 'lateFee must be non-negative'],
    },
    notes: {
      type: String,
      default: '',
      trim: true,
    },
  },
  { timestamps: true }
);

// Ensure at most one pickup and one return inspection per booking
inspectionSchema.index({ bookingId: 1, stage: 1 }, { unique: true });
inspectionSchema.index({ bookingId: 1 });
inspectionSchema.index({ vehicleId: 1 });
inspectionSchema.index({ inspectorId: 1 });

module.exports = mongoose.model('Inspection', inspectionSchema);
