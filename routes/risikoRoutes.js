const express = require('express');
const router = express.Router();
const risikoController = require('../controllers/risikoController');
const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');

// Semua endpoint membutuhkan Token JWT
router.post(
    '/',
    authMiddleware,
    requirePermission('risk.create'),
    risikoController.createRisiko
);

router.get(
    '/',
    authMiddleware,
    requirePermission('risk.view'),
    risikoController.getAllRisiko
);

module.exports = router;