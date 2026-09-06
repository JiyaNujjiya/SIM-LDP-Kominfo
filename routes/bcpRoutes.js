const express = require('express');
const router = express.Router();

const bcpController = require('../controllers/bcpController');

const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');


// =====================================================
// PROSES 2 - BUSINESS IMPACT ANALYSIS (BIA)
// =====================================================

// GET semua BIA
router.get(
    '/bia',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getAllBia
);

// GET BIA berdasarkan layanan prioritas
router.get(
    '/layanan-prioritas/:id/bia',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getBiaByLayananPrioritas
);

// GET detail BIA
router.get(
    '/bia/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getBiaById
);

// CREATE BIA
router.post(
    '/bia',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createBia
);

// UPDATE BIA
router.put(
    '/bia/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateBia
);

// DELETE BIA
router.delete(
    '/bia/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteBia
);


// =====================================================
// LEGACY BCP
// ENDPOINT EXISTING - JANGAN DIHAPUS
// =====================================================

router.post(
    '/',
    authMiddleware,
    bcpController.createBCP
);

router.get(
    '/',
    authMiddleware,
    bcpController.getAllBCP
);

// =====================================================
// PROSES 2 - FORM 10
// DAFTAR INSIDEN / GANGGUAN POTENSIAL
// =====================================================

router.get(
    '/bia/:id/insiden',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getInsidenByBia
);

router.post(
    '/bia/:id/insiden',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createInsiden
);

router.get(
    '/insiden/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getInsidenById
);

router.put(
    '/insiden/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateInsiden
);

router.delete(
    '/insiden/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteInsiden
);

// =====================================================
// PROSES 2 - FORM 10
// MODUL TERKAIT
// =====================================================

router.get(
    '/insiden/:id/modul',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getModulByInsiden
);

router.post(
    '/insiden/:id/modul',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createModulInsiden
);

router.get(
    '/insiden-modul/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getInsidenModulById
);

router.put(
    '/insiden-modul/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateModulInsiden
);

router.delete(
    '/insiden-modul/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteModulInsiden
);

// =====================================================
// PROSES 2 - FORM 10
// PETA KETERGANTUNGAN
// =====================================================

router.get(
    '/bia/:id/ketergantungan',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getKetergantunganByBia
);

router.post(
    '/bia/:id/ketergantungan',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createKetergantungan
);

router.get(
    '/ketergantungan/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getKetergantunganById
);

router.put(
    '/ketergantungan/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateKetergantungan
);

router.delete(
    '/ketergantungan/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteKetergantungan
);

// =====================================================
// PROSES 3 - FORM 11
// STRATEGI / SKENARIO PEMULIHAN
// =====================================================

router.get(
    '/insiden/:id/strategi',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getStrategiByInsiden
);

router.post(
    '/insiden/:id/strategi',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createStrategiPemulihan
);

router.get(
    '/strategi/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getStrategiById
);

router.put(
    '/strategi/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateStrategiPemulihan
);

router.delete(
    '/strategi/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteStrategiPemulihan
);

// =====================================================
// PROSES 3 - FORM 11
// LANGKAH PEMULIHAN
// =====================================================

router.get(
    '/strategi/:id/langkah',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getLangkahByStrategi
);

router.post(
    '/strategi/:id/langkah',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createLangkahPemulihan
);

router.get(
    '/langkah-pemulihan/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getLangkahPemulihanById
);

router.put(
    '/langkah-pemulihan/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateLangkahPemulihan
);

router.delete(
    '/langkah-pemulihan/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteLangkahPemulihan
);

// =====================================================
// PROSES 4 - FORM 12
// UJI COBA KEBERLANGSUNGAN
// =====================================================

router.get(
    '/insiden/:id/uji',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getUjiByInsiden
);

router.post(
    '/insiden/:id/uji',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createUji
);

router.get(
    '/uji/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getUjiById
);

router.put(
    '/uji/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateUji
);

router.delete(
    '/uji/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteUji
);

// =====================================================
// PROSES 4 - FORM 13
// EVALUASI & PEMBELAJARAN
// =====================================================

router.get(
    '/uji/:id/evaluasi',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getEvaluasiByUji
);

router.post(
    '/uji/:id/evaluasi',
    authMiddleware,
    requirePermission('continuity.create'),
    bcpController.createEvaluasi
);

router.get(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('continuity.view'),
    bcpController.getEvaluasiById
);

router.put(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('continuity.update'),
    bcpController.updateEvaluasi
);

router.delete(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('continuity.delete'),
    bcpController.deleteEvaluasi
);

module.exports = router;