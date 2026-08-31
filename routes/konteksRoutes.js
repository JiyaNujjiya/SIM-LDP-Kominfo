const express = require('express');
const router = express.Router();

const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');
const konteksController = require('../controllers/konteksController');

router.post(
  '/',
  authMiddleware,
  requirePermission('risk.create'),
  konteksController.createKonteks
);

router.get(
  '/',
  authMiddleware,
  requirePermission('risk.view'),
  konteksController.getAllKonteks
);

router.get(
  '/:id',
  authMiddleware,
  requirePermission('risk.view'),
  konteksController.getKonteksById
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('risk.update'),
  konteksController.updateKonteks
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('risk.delete'),
  konteksController.deleteKonteks
);

module.exports = router;