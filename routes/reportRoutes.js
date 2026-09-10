const express = require('express');
const verifyToken = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const {
  getAddonsCatalogController,
  getCustomerHistory,
  getFleetUtilization,
  getFinancialReport,
} = require('../controllers/reportController');

const router = express.Router();

router.get('/addons', getAddonsCatalogController);
router.get('/customer-history', verifyToken, getCustomerHistory);
router.get('/utilization', verifyToken, requireRole('branch_staff', 'admin'), getFleetUtilization);
router.get('/financials', verifyToken, requireRole('admin'), getFinancialReport);

module.exports = router;
