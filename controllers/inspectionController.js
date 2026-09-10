const Inspection = require('../models/Inspection');
const Booking = require('../models/Booking');
const { ApiError } = require('../middleware/errorHandler');

async function createPickupInspection(req, res, next) {
  try {
    const { bookingId, odometer, fuelLevel, damageNotes, notes } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    }

    if (booking.status !== 'reserved') {
      throw new ApiError(
        400,
        `Cannot perform pickup inspection on booking with status '${booking.status}'. Status must be 'reserved'.`,
        'INVALID_BOOKING_STATUS'
      );
    }

    const existingPickup = await Inspection.findOne({ bookingId, stage: 'pickup' });
    if (existingPickup) {
      throw new ApiError(409, 'Pickup inspection has already been completed for this booking', 'DUPLICATE_INSPECTION');
    }

    const inspection = await Inspection.create({
      bookingId,
      vehicleId: booking.vehicleId,
      inspectorId: req.user.id,
      stage: 'pickup',
      odometer: Number(odometer),
      fuelLevel,
      damageNotes: damageNotes || '',
      notes: notes || '',
    });

    booking.status = 'picked_up';
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Pickup inspection recorded successfully',
      data: {
        inspection,
        booking,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function createReturnInspection(req, res, next) {
  try {
    const {
      bookingId,
      odometer,
      fuelLevel,
      damageNotes,
      damageCharges = 0,
      fuelCharges = 0,
      lateFee = 0,
      notes,
    } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    }

    if (booking.status !== 'picked_up') {
      throw new ApiError(
        400,
        `Cannot perform return inspection on booking with status '${booking.status}'. Status must be 'picked_up'.`,
        'INVALID_BOOKING_STATUS'
      );
    }

    const existingReturn = await Inspection.findOne({ bookingId, stage: 'return' });
    if (existingReturn) {
      throw new ApiError(409, 'Return inspection has already been completed for this booking', 'DUPLICATE_INSPECTION');
    }

    // Validate odometer against pickup inspection
    const pickupInspection = await Inspection.findOne({ bookingId, stage: 'pickup' });
    const returnOdometer = Number(odometer);

    if (pickupInspection && returnOdometer < pickupInspection.odometer) {
      throw new ApiError(
        400,
        `Return odometer (${returnOdometer}) cannot be less than pickup odometer (${pickupInspection.odometer})`,
        'VALIDATION_ERROR'
      );
    }

    const damageFeeNum = Math.max(0, Number(damageCharges) || 0);
    const fuelChargesNum = Math.max(0, Number(fuelCharges) || 0);
    const lateFeeNum = Math.max(0, Number(lateFee) || 0);
    const totalExtra = fuelChargesNum;

    const inspection = await Inspection.create({
      bookingId,
      vehicleId: booking.vehicleId,
      inspectorId: req.user.id,
      stage: 'return',
      odometer: returnOdometer,
      fuelLevel,
      damageNotes: damageNotes || '',
      damageCharges: damageFeeNum,
      fuelCharges: fuelChargesNum,
      lateFee: lateFeeNum,
      notes: notes || '',
    });

    // Update booking financial summary and status
    booking.damageFee = damageFeeNum;
    booking.lateFee = lateFeeNum;
    booking.extraCharges = totalExtra;
    booking.finalAmount = booking.totalAmount + damageFeeNum + lateFeeNum + totalExtra;
    booking.status = 'returned';
    await booking.save();

    res.status(201).json({
      success: true,
      message: 'Return inspection recorded and charges computed successfully',
      data: {
        inspection,
        booking,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getInspectionsByBooking(req, res, next) {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    }

    // Customer can only view inspections for their own booking
    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to view inspections for this booking', 'FORBIDDEN');
    }

    const inspections = await Inspection.find({ bookingId })
      .populate('inspectorId', 'name email role')
      .populate('vehicleId', 'model type')
      .sort({ stage: 1 });

    res.json({
      success: true,
      message: 'OK',
      data: { inspections },
    });
  } catch (err) {
    next(err);
  }
}

async function getInspection(req, res, next) {
  try {
    const inspection = await Inspection.findById(req.params.id)
      .populate('bookingId')
      .populate('vehicleId', 'model type perDayRate')
      .populate('inspectorId', 'name email role');

    if (!inspection) {
      throw new ApiError(404, 'Inspection not found', 'NOT_FOUND');
    }

    // Customer can only view their own booking's inspection
    if (
      req.user.role === 'customer' &&
      inspection.bookingId &&
      inspection.bookingId.customerId &&
      inspection.bookingId.customerId.toString() !== req.user.id
    ) {
      throw new ApiError(403, 'You do not have permission to view this inspection', 'FORBIDDEN');
    }

    res.json({
      success: true,
      message: 'OK',
      data: { inspection },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createPickupInspection,
  createReturnInspection,
  getInspectionsByBooking,
  getInspection,
};
