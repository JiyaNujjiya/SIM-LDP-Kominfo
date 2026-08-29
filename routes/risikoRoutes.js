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

router.get(
    '/Penanggung-jawab-options',
    authMiddleware,
    requirePermission('risk.create'),
    risikoController.getPenanggungJawabOptions
);

router.get(
    '/layanan-options',
    authMiddleware,
    requirePermission('risk.create'),
    risikoController.getLayananOptions
)

router.get(
    '/layanan-prioritas-options',
    authMiddleware,
    requirePermission('risk.create'),
    risikoController.getLayananPrioritasOptions
);

router.get(
    '/ippd-options',
    authMiddleware,
    requirePermission('risk.create'),
    risikoController.getIppdOptions
)

module.exports = router;