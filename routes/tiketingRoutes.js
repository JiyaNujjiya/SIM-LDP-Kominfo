const express = require('express');
const router = express.Router();
const tiketingController = require('../controllers/tiketingController');
const authMiddleware = require('../middleware/auth');

router.post('/', authMiddleware, tiketingController.createTiket);
router.get('/', authMiddleware, tiketingController.getAllTiket);

module.exports = router;