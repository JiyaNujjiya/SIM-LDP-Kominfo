const express = require('express');

const router = express.Router();

const authMiddleware =
  require('../middleware/auth');

const notificationController =
  require(
    '../controllers/notificationController'
  );

router.get(
  '/',
  authMiddleware,
  notificationController.getMyNotifications
);

router.patch(
  '/read-all',
  authMiddleware,
  notificationController.markAllAsRead
);

router.patch(
  '/:id/read',
  authMiddleware,
  notificationController.markAsRead
);

module.exports = router;