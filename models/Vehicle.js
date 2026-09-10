const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    branchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', required: true },
    type: { type: String, enum: ['car', 'bike'], required: true },
    model: { type: String, required: true, trim: true },
    perDayRate: { type: Number, required: true, min: 0 },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'retired'],
      default: 'available',
    },
  },
  { timestamps: true }
);

vehicleSchema.index({ branchId: 1 });

module.exports = mongoose.model('Vehicle', vehicleSchema);
