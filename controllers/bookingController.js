const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Inspection = require('../models/Inspection');
const { ApiError } = require('../middleware/errorHandler');
const { calculateAddonsTotal } = require('../utils/pricingConfig');
const { calculateCancellationDetails } = require('../utils/cancellationPolicy');

async function createBooking(req, res, next) {
  try {
    const { vehicleId, startDate, endDate, customerId: requestedCustomerId, addons = [] } = req.body;

    // Determine customer ID (customer role is locked to their own ID)
    let customerId = req.user.id;
    if (['admin', 'branch_staff'].includes(req.user.role) && requestedCustomerId) {
      customerId = requestedCustomerId;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new ApiError(400, 'Invalid startDate or endDate format', 'VALIDATION_ERROR');
    }

    if (start >= end) {
      throw new ApiError(400, 'endDate must be after startDate', 'VALIDATION_ERROR');
    }

    // Verify vehicle existence and availability status
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      throw new ApiError(404, 'Vehicle not found', 'NOT_FOUND');
    }

    if (vehicle.status !== 'available') {
      throw new ApiError(400, `Vehicle is not available for booking (status: ${vehicle.status})`, 'VEHICLE_UNAVAILABLE');
    }

    // Check for date range overlap conflicts
    const conflictingBooking = await Booking.findOne({
      vehicleId,
      status: { $in: ['reserved', 'picked_up'] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    });

    if (conflictingBooking) {
      throw new ApiError(
        409,
        'Vehicle is already booked for the selected date range',
        'BOOKING_CONFLICT'
      );
    }

    // Calculate duration in days (minimum 1 day)
    const diffTime = end.getTime() - start.getTime();
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    const baseRate = vehicle.perDayRate;

    // Calculate add-on charges
    const { addonsList, addonsTotal } = calculateAddonsTotal(addons, totalDays);
    const totalAmount = (totalDays * baseRate) + addonsTotal;

    const booking = await Booking.create({
      vehicleId,
      customerId,
      startDate: start,
      endDate: end,
      baseRate,
      totalDays,
      addons: addonsList,
      addonsTotal,
      totalAmount,
      finalAmount: totalAmount,
      status: 'reserved',
    });

    const populatedBooking = await Booking.findById(booking._id)
      .populate('vehicleId', 'model type perDayRate branchId')
      .populate('customerId', 'name email');

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: populatedBooking },
    });
  } catch (err) {
    next(err);
  }
}

async function listBookings(req, res, next) {
  try {
    const filter = {};

    // Customer can only view their own bookings
    if (req.user.role === 'customer') {
      filter.customerId = req.user.id;
    } else if (req.query.customerId) {
      filter.customerId = req.query.customerId;
    }

    if (req.query.status) {
      filter.status = req.query.status;
    }

    if (req.query.vehicleId) {
      filter.vehicleId = req.query.vehicleId;
    }

    if (req.query.branchId) {
      const branchVehicles = await Vehicle.find({ branchId: req.query.branchId }).distinct('_id');
      filter.vehicleId = { $in: branchVehicles };
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: 'vehicleId',
        select: 'model type perDayRate branchId status',
        populate: { path: 'branchId', select: 'name city' },
      })
      .populate('customerId', 'name email role')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      message: 'OK',
      data: { bookings },
    });
  } catch (err) {
    next(err);
  }
}

async function getBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'vehicleId',
        select: 'model type perDayRate branchId status',
        populate: { path: 'branchId', select: 'name city' },
      })
      .populate('customerId', 'name email role');

    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    }

    // Role-based access check: customer can only view own booking
    if (req.user.role === 'customer' && booking.customerId._id.toString() !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to access this booking', 'FORBIDDEN');
    }

    // Fetch associated inspections
    const inspections = await Inspection.find({ bookingId: booking._id })
      .populate('inspectorId', 'name email role')
      .sort({ createdAt: 1 });

    res.json({
      success: true,
      message: 'OK',
      data: {
        booking,
        inspections,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getCancellationQuote(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    }

    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to access this cancellation quote', 'FORBIDDEN');
    }

    const quote = calculateCancellationDetails(booking);

    res.json({
      success: true,
      message: 'Cancellation quote generated',
      data: {
        bookingId: booking._id,
        currentStatus: booking.status,
        quote,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function cancelBooking(req, res, next) {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    }

    // Ownership check for customers
    if (req.user.role === 'customer' && booking.customerId.toString() !== req.user.id) {
      throw new ApiError(403, 'You do not have permission to cancel this booking', 'FORBIDDEN');
    }

    if (booking.status !== 'reserved') {
      throw new ApiError(
        400,
        `Cannot cancel booking in '${booking.status}' status. Only 'reserved' bookings can be cancelled.`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    const cancellationDetails = calculateCancellationDetails(booking);

    booking.status = 'cancelled';
    booking.cancellationReason = req.body.reason || 'Cancelled by user';
    booking.cancelledAt = new Date();
    booking.cancellationFee = cancellationDetails.cancellationFee;
    booking.refundAmount = cancellationDetails.refundAmount;
    await booking.save();

    res.json({
      success: true,
      message: 'Booking cancelled successfully',
      data: {
        booking,
        cancellationDetails,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const { status } = req.body;
    const allowedStatuses = ['reserved', 'picked_up', 'returned', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status '${status}'. Allowed: ${allowedStatuses.join(', ')}`, 'VALIDATION_ERROR');
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      throw new ApiError(404, 'Booking not found', 'NOT_FOUND');
    }

    // State transition validation
    const validTransitions = {
      reserved: ['picked_up', 'cancelled'],
      picked_up: ['returned'],
      returned: [],
      cancelled: [],
    };

    if (!validTransitions[booking.status].includes(status)) {
      throw new ApiError(
        400,
        `Invalid status transition from '${booking.status}' to '${status}'`,
        'INVALID_STATUS_TRANSITION'
      );
    }

    booking.status = status;
    if (status === 'cancelled') {
      const cancellationDetails = calculateCancellationDetails(booking);
      booking.cancelledAt = new Date();
      booking.cancellationReason = req.body.reason || 'Cancelled by staff/admin';
      booking.cancellationFee = cancellationDetails.cancellationFee;
      booking.refundAmount = cancellationDetails.refundAmount;
    }
    await booking.save();

    res.json({
      success: true,
      message: `Booking status updated to ${status}`,
      data: { booking },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createBooking,
  listBookings,
  getBooking,
  getCancellationQuote,
  cancelBooking,
  updateBookingStatus,
};
