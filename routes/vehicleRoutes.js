const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createVehicle,
  listVehicles,
  getVehicle,
  updateVehicle,
  deleteVehicle,
  searchAvailable,
} = require('../controllers/vehicleController');

const router = express.Router();

const vehicleValidators = [
  body('branchId').notEmpty().withMessage('branchId is required'),
  body('type').isIn(['car', 'bike']).withMessage('type must be car or bike'),
  body('model').trim().notEmpty().withMessage('model is required'),
  body('perDayRate').isFloat({ min: 0 }).withMessage('perDayRate must be a positive number'),
];

// specific route before /:id
router.get('/available', searchAvailable);

router.get('/', listVehicles);
router.get('/:id', getVehicle);
router.post('/', verifyToken, requireRole('admin'), vehicleValidators, validate, createVehicle);
router.patch('/:id', verifyToken, requireRole('admin'), updateVehicle);
router.delete('/:id', verifyToken, requireRole('admin'), deleteVehicle);

module.exports = router;
