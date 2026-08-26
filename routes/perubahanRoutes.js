const express = require('express');
const router = express.Router();
const perubahanController = require('../controllers/perubahanController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, perubahanController.createPerubahan);
router.get('/', authMiddleware, perubahanController.getAllPerubahan);

module.exports = router;