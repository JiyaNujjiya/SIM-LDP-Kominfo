const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');
const laporanEksporController = require('../controllers/laporanEksporController');

router.get(
  '/',
  authMiddleware,
  requirePermission('dashboard.view'),
  laporanEksporController.exportLaporan
);

module.exports = router;