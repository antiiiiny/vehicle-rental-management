const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { ApiError } = require('../middleware/errorHandler');

async function createVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.create(req.body);
    res.status(201).json({ success: true, message: 'Vehicle created', data: { vehicle } });
  } catch (err) {
    next(err);
  }
}

async function listVehicles(req, res, next) {
  try {
    const filter = {};
    if (req.query.branchId) filter.branchId = req.query.branchId;
    if (req.query.type) filter.type = req.query.type;
    if (req.query.status) filter.status = req.query.status;

    const vehicles = await Vehicle.find(filter).populate('branchId', 'name city').sort({ createdAt: -1 });
    res.json({ success: true, message: 'OK', data: { vehicles } });
  } catch (err) {
    next(err);
  }
}

async function getVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('branchId', 'name city');
    if (!vehicle) throw new ApiError(404, 'Vehicle not found', 'NOT_FOUND');
    res.json({ success: true, message: 'OK', data: { vehicle } });
  } catch (err) {
    next(err);
  }
}

async function updateVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!vehicle) throw new ApiError(404, 'Vehicle not found', 'NOT_FOUND');
    res.json({ success: true, message: 'Vehicle updated', data: { vehicle } });
  } catch (err) {
    next(err);
  }
}

async function deleteVehicle(req, res, next) {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) throw new ApiError(404, 'Vehicle not found', 'NOT_FOUND');
    res.json({ success: true, message: 'Vehicle deleted', data: {} });
  } catch (err) {
    next(err);
  }
}

// Availability Search Engine: vehicles at a branch, of a type, that are
// `available` and have no overlapping active booking in [startDate, endDate).
async function searchAvailable(req, res, next) {
  try {
    const { branchId, startDate, endDate, type } = req.query;

    if (!startDate || !endDate) {
      throw new ApiError(400, 'startDate and endDate are required', 'VALIDATION_ERROR');
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || start >= end) {
      throw new ApiError(400, 'Invalid date range', 'VALIDATION_ERROR');
    }

    const vehicleFilter = { status: 'available' };
    if (branchId) vehicleFilter.branchId = branchId;
    if (type) vehicleFilter.type = type;

    const candidates = await Vehicle.find(vehicleFilter).populate('branchId', 'name city');

    const conflictingBookings = await Booking.find({
      vehicleId: { $in: candidates.map((v) => v._id) },
      status: { $in: ['reserved', 'picked_up'] },
      startDate: { $lt: end },
      endDate: { $gt: start },
    }).distinct('vehicleId');

    const busyIds = new Set(conflictingBookings.map((id) => id.toString()));
    const available = candidates.filter((v) => !busyIds.has(v._id.toString()));

    res.json({ success: true, message: 'OK', data: { vehicles: available } });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createVehicle,
  listVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  searchAvailable,
};
