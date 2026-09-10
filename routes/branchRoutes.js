const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  createBranch,
  listBranches,
  getBranch,
  updateBranch,
  deleteBranch,
} = require('../controllers/branchController');

const router = express.Router();

const branchValidators = [
  body('name').trim().notEmpty().withMessage('Branch name is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
];

router.get('/', listBranches);
router.get('/:id', getBranch);
router.post('/', verifyToken, requireRole('admin'), branchValidators, validate, createBranch);
router.patch('/:id', verifyToken, requireRole('admin'), updateBranch);
router.delete('/:id', verifyToken, requireRole('admin'), deleteBranch);

module.exports = router;
