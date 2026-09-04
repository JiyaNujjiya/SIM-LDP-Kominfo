const express = require('express');
const router = express.Router();

const pengetahuanController = require('../controllers/pengetahuanController');
const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');
const uploadDokumentasi = require('../middleware/pengetahuanUpload');

router.get(
  '/perencanaan',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getAllPerencanaan
);

router.get(
  '/perencanaan/:id',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getDetailPerencanaan
);

router.post(
  '/perencanaan',
  authMiddleware,
  requirePermission('knowledge.create'),
  pengetahuanController.createPerencanaan
);

router.put(
  '/perencanaan/:id',
  authMiddleware,
  requirePermission('knowledge.update'),
  pengetahuanController.updatePerencanaan
);

router.delete(
  '/perencanaan/:id',
  authMiddleware,
  requirePermission('knowledge.delete'),
  pengetahuanController.deletePerencanaan
);

router.get(
  '/perencanaan/:id/rencana-dokumentasi',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getRencanaDokumentasi
);

router.get(
  '/perencanaan/:id/indikator',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getIndikatorPerencanaan
);

router.post(
  '/perencanaan/:id/indikator',
  authMiddleware,
  requirePermission('knowledge.create'),
  pengetahuanController.createIndikatorPerencanaan
);

router.post(
  '/perencanaan/:id/rencana-dokumentasi',
  authMiddleware,
  requirePermission('knowledge.create'),
  pengetahuanController.createRencanaDokumentasi
);

router.put(
  '/indikator/:id',
  authMiddleware,
  requirePermission('knowledge.update'),
  pengetahuanController.updateIndikatorPerencanaan
);

router.delete(
  '/indikator/:id',
  authMiddleware,
  requirePermission('knowledge.delete'),
  pengetahuanController.deleteIndikatorPerencanaan
);

router.get(
  '/',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getAllPengetahuan
);

router.post(
  '/',
  authMiddleware,
  requirePermission('knowledge.create'),
  pengetahuanController.createPengetahuan
);

router.put(
  '/rencana-dokumentasi/:id',
  authMiddleware,
  requirePermission('knowledge.update'),
  pengetahuanController.updateRencanaDokumentasi
);

router.delete(
  '/rencana-dokumentasi/:id',
  authMiddleware,
  requirePermission('knowledge.delete'),
  pengetahuanController.deleteRencanaDokumentasi
);

router.get(
  '/pengumpulan-pengolahan',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getAllPengumpulanPengolahan
);

router.post(
  '/pengumpulan-pengolahan',
  authMiddleware,
  requirePermission('knowledge.create'),
  pengetahuanController.createPengumpulanPengolahan
);

router.get(
  '/pengumpulan-pengolahan/:id',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getDetailPengumpulanPengolahan
);

router.put(
  '/pengumpulan-pengolahan/:id',
  authMiddleware,
  requirePermission('knowledge.update'),
  pengetahuanController.updatePengumpulanPengolahan
);

router.delete(
  '/pengumpulan-pengolahan/:id',
  authMiddleware,
  requirePermission('knowledge.delete'),
  pengetahuanController.deletePengumpulanPengolahan
);

router.get(
  '/dokumentasi',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getAllDokumentasi
);

// POST dokumentasi TEKS
router.post(
  '/dokumentasi',
  authMiddleware,
  requirePermission('knowledge.create'),
  pengetahuanController.createDokumentasiTeks
);

// POST dokumentasi FILE
router.post(
  '/dokumentasi/file',
  authMiddleware,
  requirePermission('knowledge.create'),
  uploadDokumentasi.single('file'),
  pengetahuanController.createDokumentasiFile
);

router.post(
  '/dokumentasi',
  authMiddleware,
  requirePermission('knowledge.create'),
  pengetahuanController.createDokumentasiFile
);

router.get(
  '/dokumentasi/:id/file',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getFileDokumentasi
);

router.get(
  '/dokumentasi/:id',
  authMiddleware,
  requirePermission('knowledge.view'),
  pengetahuanController.getDetailDokumentasi
);

router.put(
  '/dokumentasi/:id',
  authMiddleware,
  requirePermission('knowledge.update'),
  pengetahuanController.updateDokumentasiTeks
);

router.delete(
  '/dokumentasi/:id',
  authMiddleware,
  requirePermission('knowledge.delete'),
  pengetahuanController.deleteDokumentasi
);
module.exports = router;
