const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createPickupInspection,
  createReturnInspection,
  getInspectionsByBooking,
  getInspection,
} = require('../controllers/inspectionController');

const router = express.Router();

const pickupValidators = [
  body('bookingId').notEmpty().withMessage('bookingId is required'),
  body('odometer').isFloat({ min: 0 }).withMessage('odometer must be a non-negative number'),
  body('fuelLevel').trim().notEmpty().withMessage('fuelLevel is required'),
];

const returnValidators = [
  body('bookingId').notEmpty().withMessage('bookingId is required'),
  body('odometer').isFloat({ min: 0 }).withMessage('odometer must be a non-negative number'),
  body('fuelLevel').trim().notEmpty().withMessage('fuelLevel is required'),
  body('damageCharges').optional().isFloat({ min: 0 }).withMessage('damageCharges must be a non-negative number'),
  body('fuelCharges').optional().isFloat({ min: 0 }).withMessage('fuelCharges must be a non-negative number'),
  body('lateFee').optional().isFloat({ min: 0 }).withMessage('lateFee must be a non-negative number'),
];

router.post(
  '/pickup',
  verifyToken,
  requireRole('branch_staff', 'admin'),
  pickupValidators,
  validate,
  createPickupInspection
);

router.post(
  '/return',
  verifyToken,
  requireRole('branch_staff', 'admin'),
  returnValidators,
  validate,
  createReturnInspection
);

router.get('/booking/:bookingId', verifyToken, getInspectionsByBooking);
router.get('/:id', verifyToken, getInspection);

module.exports = router;
