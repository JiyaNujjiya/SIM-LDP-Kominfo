const express = require('express');
const router = express.Router();
const risikoController = require('../controllers/risikoController');
const authMiddleware = require('../middleware/auth');

// Semua endpoint membutuhkan Token JWT
router.post('/', authMiddleware, risikoController.createRisiko);
router.get('/', authMiddleware, risikoController.getAllRisiko);

module.exports = router;