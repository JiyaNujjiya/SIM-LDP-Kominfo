const express = require('express');
const router = express.Router();
const risikoController = require('../controllers/risikoController');
const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');
const auth = require('../middleware/auth');
const uploadMonitoring = require('../middleware/uploadMonitoring');

// CREATE RISIKO
router.post(
  '/',
  authMiddleware,
  requirePermission('risk.create'),
  risikoController.createRisiko
);


// OPTIONS / MASTER DATA
router.get(
  '/penanggung-jawab-options',
  authMiddleware,
  requirePermission('risk.create'),
  risikoController.getPenanggungJawabOptions
);

router.get(
  '/layanan-options',
  authMiddleware,
  requirePermission('risk.create'),
  risikoController.getLayananOptions
);

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
);


// FORM 2.0
router.get(
  '/form2',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getForm2Risiko
);

router.put(
  '/form2/:risiko_id',
  authMiddleware,
  requirePermission('risk.update'),
  risikoController.saveForm2Risiko
);

// FORM 3.0 - PETA RISIKO
router.get(
  '/peta-risiko',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getPetaRisiko
);

// WORKFLOW RISIKO
router.post(
  '/:id/submit',
  authMiddleware,
  requirePermission('risk.submit'),
  risikoController.submitRisiko
);

router.post(
  '/:id/approve',
  authMiddleware,
  requirePermission('risk.approve'),
  risikoController.approveRisiko
);

router.post(
  '/:id/reject',
  authMiddleware,
  requirePermission('risk.reject'),
  risikoController.rejectRisiko
);

// GET ALL RISIKO
router.get(
  '/',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getAllRisiko
);

// Form 3.0 semester I
router.get(
  '/monitoring/semester-1',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getMonitoringSemester1,
);


router.put(
  '/monitoring/semester-1/:risiko_id',
  authMiddleware,
  requirePermission('risk.update'),
  risikoController.saveMonitoringSemester1
);

router.post(
  '/monitoring/:monitoring_id/dokumen',
  authMiddleware,
  requirePermission('risk.update'),
  uploadMonitoring.single('file'),
  risikoController.uploadMonitoringDokumen
);

router.get(
  '/monitoring/:monitoring_id/dokumen',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getMonitoringDokumen
);

router.get(
  '/monitoring/dokumen/:dokumen_id/download',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.downloadMonitoringDokumen
);

// Form 3.0 semester II
router.get(
  '/monitoring/semester-2',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getMonitoringSemester2
);

router.put(
  '/monitoring/semester-2/:risiko_id',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.saveMonitoringSemester2
)

// Form 3.0 tahunan
router.get(
  '/monitoring/tahunan',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getMonitoringTahunan
);

router.put(
  '/monitoring/tahunan/:risiko_id',
  authMiddleware,
  requirePermission('risk.update'),
  risikoController.saveMonitoringTahunan
);

// ROUTE BERDASARKAN ID
router.get(
  '/:id',
  authMiddleware,
  requirePermission('risk.view'),
  risikoController.getRisikoById
);

router.put(
  '/:id',
  authMiddleware,
  requirePermission('risk.update'),
  risikoController.updateRisiko
);

router.delete(
  '/:id',
  authMiddleware,
  requirePermission('risk.delete'),
  risikoController.deleteRisiko
);


module.exports = router;