const express = require('express');

const router = express.Router();

const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');

router.get(
  '/summary',
  authMiddleware,
  requirePermission(
    'dashboard.view'
  ),
  dashboardController.getSummary
);

router.get(
  '/pimpinan',
  authMiddleware,
  requirePermission(
    'dashboard.view'
  ),
  dashboardController.getPimpinanDashboard
);

router.get(
  '/pengelola',
  authMiddleware,
  requirePermission(
    'dashboard.view'
  ),
  dashboardController.getPengelolaDashboard
);

router.get(
  '/admin',
  authMiddleware,
  requirePermission('dashboard.view'),
  dashboardController.getAdminDashboard
);

module.exports = router;