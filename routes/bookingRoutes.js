const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createBooking,
  listBookings,
  getBooking,
  getCancellationQuote,
  cancelBooking,
  updateBookingStatus,
} = require('../controllers/bookingController');

const router = express.Router();

const createBookingValidators = [
  body('vehicleId').notEmpty().withMessage('vehicleId is required'),
  body('startDate').isISO8601().withMessage('startDate must be a valid ISO date string (YYYY-MM-DD or full ISO)'),
  body('endDate').isISO8601().withMessage('endDate must be a valid ISO date string (YYYY-MM-DD or full ISO)'),
];

const statusValidators = [
  body('status')
    .isIn(['reserved', 'picked_up', 'returned', 'cancelled'])
    .withMessage('status must be one of: reserved, picked_up, returned, cancelled'),
];

router.post('/', verifyToken, createBookingValidators, validate, createBooking);
router.get('/', verifyToken, listBookings);
router.get('/:id', verifyToken, getBooking);
router.get('/:id/cancellation-quote', verifyToken, getCancellationQuote);
router.patch('/:id/cancel', verifyToken, cancelBooking);
router.patch(
  '/:id/status',
  verifyToken,
  requireRole('branch_staff', 'admin'),
  statusValidators,
  validate,
  updateBookingStatus
);

module.exports = router;
