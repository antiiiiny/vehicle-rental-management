const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const Branch = require('../models/Branch');
const User = require('../models/User');
const { getAddonsCatalog } = require('../utils/pricingConfig');
const { ApiError } = require('../middleware/errorHandler');

async function getAddonsCatalogController(req, res, next) {
  try {
    const catalog = getAddonsCatalog();
    res.json({
      success: true,
      message: 'Add-ons catalog retrieved',
      data: { addons: catalog },
    });
  } catch (err) {
    next(err);
  }
}

async function getCustomerHistory(req, res, next) {
  try {
    let targetCustomerId;

    if (req.user.role === 'customer') {
      targetCustomerId = req.user.id;
    } else {
      targetCustomerId = req.query.customerId || req.user.id;
    }

    const customer = await User.findById(targetCustomerId).select('name email role createdAt');
    if (!customer) {
      throw new ApiError(404, 'Customer not found', 'NOT_FOUND');
    }

    const bookings = await Booking.find({ customerId: targetCustomerId })
      .populate({
        path: 'vehicleId',
        select: 'model type perDayRate branchId',
        populate: { path: 'branchId', select: 'name city' },
      })
      .sort({ createdAt: -1 });

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.status === 'returned').length;
    const activeBookings = bookings.filter((b) => ['reserved', 'picked_up'].includes(b.status)).length;
    const cancelledBookings = bookings.filter((b) => b.status === 'cancelled').length;

    let totalSpent = 0;
    let addonsTotalSpent = 0;
    let damageFeesPaid = 0;
    let lateFeesPaid = 0;
    let cancellationFeesPaid = 0;

    bookings.forEach((b) => {
      if (b.status === 'returned') {
        totalSpent += b.finalAmount || 0;
        addonsTotalSpent += b.addonsTotal || 0;
        damageFeesPaid += b.damageFee || 0;
        lateFeesPaid += b.lateFee || 0;
      } else if (b.status === 'cancelled') {
        totalSpent += b.cancellationFee || 0;
        cancellationFeesPaid += b.cancellationFee || 0;
      }
    });

    res.json({
      success: true,
      message: 'Customer rental history retrieved',
      data: {
        customer,
        summary: {
          totalBookings,
          completedBookings,
          activeBookings,
          cancelledBookings,
          totalSpent: Number(totalSpent.toFixed(2)),
          addonsTotalSpent: Number(addonsTotalSpent.toFixed(2)),
          damageFeesPaid: Number(damageFeesPaid.toFixed(2)),
          lateFeesPaid: Number(lateFeesPaid.toFixed(2)),
          cancellationFeesPaid: Number(cancellationFeesPaid.toFixed(2)),
        },
        bookings,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getFleetUtilization(req, res, next) {
  try {
    const { branchId, startDate, endDate } = req.query;

    const vehicleFilter = {};
    if (branchId) {
      vehicleFilter.branchId = branchId;
    }

    const vehicles = await Vehicle.find(vehicleFilter).populate('branchId', 'name city');
    const totalFleetCount = vehicles.length;
    const availableCount = vehicles.filter((v) => v.status === 'available').length;
    const maintenanceCount = vehicles.filter((v) => v.status === 'maintenance').length;
    const retiredCount = vehicles.filter((v) => v.status === 'retired').length;

    const vehicleIds = vehicles.map((v) => v._id);

    const bookingFilter = { vehicleId: { $in: vehicleIds } };
    if (startDate && endDate) {
      bookingFilter.startDate = { $lte: new Date(endDate) };
      bookingFilter.endDate = { $gte: new Date(startDate) };
    }

    const allBookings = await Booking.find(bookingFilter);

    // Active trip status
    const currentlyOnTripBookings = allBookings.filter((b) => b.status === 'picked_up');
    const reservedBookings = allBookings.filter((b) => b.status === 'reserved');
    const returnedBookings = allBookings.filter((b) => b.status === 'returned');

    const currentlyOnTripVehicleIds = new Set(currentlyOnTripBookings.map((b) => b.vehicleId.toString()));
    const activeRentedCount = currentlyOnTripVehicleIds.size;

    const utilizationRate = totalFleetCount > 0
      ? Number(((activeRentedCount / totalFleetCount) * 100).toFixed(2))
      : 0;

    // Breakdown by vehicle type
    const carVehicles = vehicles.filter((v) => v.type === 'car');
    const bikeVehicles = vehicles.filter((v) => v.type === 'bike');

    const carBookings = allBookings.filter((b) => {
      const v = vehicles.find((v) => v._id.toString() === b.vehicleId.toString());
      return v && v.type === 'car';
    });

    const bikeBookings = allBookings.filter((b) => {
      const v = vehicles.find((v) => v._id.toString() === b.vehicleId.toString());
      return v && v.type === 'bike';
    });

    // Model popularity ranking
    const modelStats = {};
    allBookings.forEach((b) => {
      const v = vehicles.find((v) => v._id.toString() === b.vehicleId.toString());
      if (v) {
        modelStats[v.model] = (modelStats[v.model] || 0) + 1;
      }
    });

    const popularModels = Object.keys(modelStats)
      .map((model) => ({ model, bookingCount: modelStats[model] }))
      .sort((a, b) => b.bookingCount - a.bookingCount);

    const totalRevenue = returnedBookings.reduce((sum, b) => sum + (b.finalAmount || 0), 0);

    res.json({
      success: true,
      message: 'Fleet utilization report generated',
      data: {
        fleetSummary: {
          totalFleetCount,
          availableCount,
          maintenanceCount,
          retiredCount,
          activeRentedCount,
          utilizationRatePercentage: utilizationRate,
        },
        typeBreakdown: {
          cars: {
            total: carVehicles.length,
            bookingsCount: carBookings.length,
          },
          bikes: {
            total: bikeVehicles.length,
            bookingsCount: bikeBookings.length,
          },
        },
        bookingStats: {
          totalBookings: allBookings.length,
          currentlyOnTrip: currentlyOnTripBookings.length,
          reserved: reservedBookings.length,
          returned: returnedBookings.length,
          totalRevenue: Number(totalRevenue.toFixed(2)),
        },
        popularModels,
      },
    });
  } catch (err) {
    next(err);
  }
}

async function getFinancialReport(req, res, next) {
  try {
    const bookings = await Booking.find()
      .populate('vehicleId', 'model type perDayRate')
      .populate('customerId', 'name email');

    let totalBaseRevenue = 0;
    let totalAddonsRevenue = 0;
    let totalDamageFees = 0;
    let totalLateFees = 0;
    let totalCancellationFees = 0;
    let totalRefundsIssued = 0;
    let totalCompletedRentals = 0;
    let totalCancelledRentals = 0;

    bookings.forEach((b) => {
      if (b.status === 'returned') {
        totalCompletedRentals += 1;
        totalBaseRevenue += (b.totalAmount || 0) - (b.addonsTotal || 0);
        totalAddonsRevenue += b.addonsTotal || 0;
        totalDamageFees += b.damageFee || 0;
        totalLateFees += b.lateFee || 0;
      } else if (b.status === 'cancelled') {
        totalCancelledRentals += 1;
        totalCancellationFees += b.cancellationFee || 0;
        totalRefundsIssued += b.refundAmount || 0;
      }
    });

    const netRevenue = totalBaseRevenue + totalAddonsRevenue + totalDamageFees + totalLateFees + totalCancellationFees;

    res.json({
      success: true,
      message: 'Financial summary report generated',
      data: {
        summary: {
          totalCompletedRentals,
          totalCancelledRentals,
          totalBaseRevenue: Number(totalBaseRevenue.toFixed(2)),
          totalAddonsRevenue: Number(totalAddonsRevenue.toFixed(2)),
          totalDamageFees: Number(totalDamageFees.toFixed(2)),
          totalLateFees: Number(totalLateFees.toFixed(2)),
          totalCancellationFees: Number(totalCancellationFees.toFixed(2)),
          totalRefundsIssued: Number(totalRefundsIssued.toFixed(2)),
          netRevenue: Number(netRevenue.toFixed(2)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getAddonsCatalogController,
  getCustomerHistory,
  getFleetUtilization,
  getFinancialReport,
};
