const express = require('express');
const router = express.Router();
const bcpController = require('../controllers/bcpController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, bcpController.createBCP);
router.get('/', authMiddleware, bcpController.getAllBCP);

module.exports = router;