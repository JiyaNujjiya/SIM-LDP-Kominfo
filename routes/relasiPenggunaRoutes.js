const express = require('express');
const router = express.Router();

const relasiPenggunaController =
    require('../controllers/relasiPenggunaController');

const authMiddleware =
    require('../middleware/auth');

const requirePermission =
    require('../middleware/permissionMiddleware');


// =====================================================
// OVERVIEW / COMPATIBILITY HELPDESK
// =====================================================

router.get(
    '/',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllRelasiPengguna
);


// =====================================================
// MRP 1A - KATALOG LAYANAN
// =====================================================

// List katalog layanan
router.get(
    '/katalog-layanan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllKatalogLayanan
);

// Katalog berdasarkan layanan
router.get(
    '/layanan/:id/katalog',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getKatalogByLayanan
);

// Detail katalog
router.get(
    '/katalog-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getKatalogLayananById
);

// Tambah katalog
router.post(
    '/katalog-layanan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createKatalogLayanan
);

// Edit katalog
router.put(
    '/katalog-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateKatalogLayanan
);

// Hapus katalog
router.delete(
    '/katalog-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteKatalogLayanan
);

// =====================================================
// MRP 1A - STANDAR LAYANAN
// =====================================================

router.get(
    '/standar-layanan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllStandarLayanan
);

router.get(
    '/katalog-layanan/:id/standar',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getStandarByKatalog
);

router.get(
    '/standar-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getStandarLayananById
);

router.post(
    '/standar-layanan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createStandarLayanan
);

router.put(
    '/standar-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateStandarLayanan
);

router.delete(
    '/standar-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteStandarLayanan
);

// =====================================================
// MRP 1A - SLA LAYANAN
// =====================================================

router.get(
    '/sla-layanan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllSlaLayanan
);

router.get(
    '/standar-layanan/:id/sla',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getSlaByStandar
);

router.get(
    '/sla-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getSlaLayananById
);

router.post(
    '/sla-layanan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createSlaLayanan
);

router.put(
    '/sla-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateSlaLayanan
);

router.delete(
    '/sla-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteSlaLayanan
);

// =====================================================
// MRP 1A - OLA LAYANAN
// =====================================================

router.get(
    '/ola-layanan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllOlaLayanan
);

router.get(
    '/standar-layanan/:id/ola',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getOlaByStandar
);

router.get(
    '/ola-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getOlaLayananById
);

router.post(
    '/ola-layanan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createOlaLayanan
);

router.put(
    '/ola-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateOlaLayanan
);

router.delete(
    '/ola-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteOlaLayanan
);

// =====================================================
// MRP 1A - INDIKATOR TAMBAHAN STANDAR
// =====================================================

router.get(
    '/indikator-tambahan-standar',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllIndikatorTambahan
);

router.get(
    '/standar-layanan/:id/indikator-tambahan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getIndikatorTambahanByStandar
);

router.get(
    '/indikator-tambahan-standar/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getIndikatorTambahanById
);

router.post(
    '/indikator-tambahan-standar',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createIndikatorTambahan
);

router.put(
    '/indikator-tambahan-standar/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateIndikatorTambahan
);

router.delete(
    '/indikator-tambahan-standar/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteIndikatorTambahan
);

// =====================================================
// MRP 1A - TARGET KUERI & INSIDEN
// =====================================================

router.get(
    '/target-kueri-insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllTargetKueriInsiden
);

router.get(
    '/standar-layanan/:id/target-kueri-insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getTargetKueriInsidenByStandar
);

router.get(
    '/target-kueri-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getTargetKueriInsidenById
);

router.post(
    '/target-kueri-insiden',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createTargetKueriInsiden
);

router.put(
    '/target-kueri-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateTargetKueriInsiden
);

router.delete(
    '/target-kueri-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteTargetKueriInsiden
);

// =====================================================
// MRP 1B - RENCANA KOMUNIKASI PENGGUNA
// =====================================================

router.get(
    '/rencana-komunikasi',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllRencanaKomunikasi
);

router.get(
    '/layanan/:id/rencana-komunikasi',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getRencanaKomunikasiByLayanan
);

router.get(
    '/rencana-komunikasi/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getRencanaKomunikasiById
);

router.post(
    '/rencana-komunikasi',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createRencanaKomunikasi
);

router.put(
    '/rencana-komunikasi/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateRencanaKomunikasi
);

router.delete(
    '/rencana-komunikasi/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteRencanaKomunikasi
);

// =====================================================
// MRP 1B - MEDIA KOMUNIKASI
// =====================================================

router.get(
    '/media-komunikasi',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllMediaKomunikasi
);

router.get(
    '/rencana-komunikasi/:id/media',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getMediaByRencanaKomunikasi
);

router.get(
    '/media-komunikasi/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getMediaKomunikasiById
);

router.post(
    '/media-komunikasi',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createMediaKomunikasi
);

router.put(
    '/media-komunikasi/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateMediaKomunikasi
);

router.delete(
    '/media-komunikasi/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteMediaKomunikasi
);

// =====================================================
// MRP 1A - KATALOG LAYANAN TERKAIT
// =====================================================

router.get(
    '/katalog-layanan-terkait',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllKatalogLayananTerkait
);

router.get(
    '/katalog-layanan/:id/layanan-terkait',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getLayananTerkaitByKatalog
);

router.get(
    '/katalog-layanan-terkait/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getKatalogLayananTerkaitById
);

router.post(
    '/katalog-layanan-terkait',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createKatalogLayananTerkait
);

router.put(
    '/katalog-layanan-terkait/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateKatalogLayananTerkait
);

router.delete(
    '/katalog-layanan-terkait/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteKatalogLayananTerkait
);

// =====================================================
// MRP 2 - PERMINTAAN LAYANAN
// =====================================================

router.get(
    '/permintaan-layanan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllPermintaanLayanan
);

router.get(
    '/permintaan-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getPermintaanLayananById
);

router.post(
    '/permintaan-layanan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createPermintaanLayanan
);

router.put(
    '/permintaan-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updatePermintaanLayanan
);

router.delete(
    '/permintaan-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deletePermintaanLayanan
);

// =====================================================
// MRP 2 - TANGGAPAN PERMINTAAN
// Riwayat bersifat append-only
// =====================================================

router.get(
    '/tanggapan-permintaan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllTanggapanPermintaan
);

router.get(
    '/permintaan-layanan/:id/tanggapan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getTanggapanByPermintaan
);

router.get(
    '/tanggapan-permintaan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getTanggapanPermintaanById
);

router.post(
    '/tanggapan-permintaan',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .createTanggapanPermintaan
);

// =====================================================
// MRP 3A - MANAJEMEN KUERI
// =====================================================

router.get(
    '/kueri',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllKueri
);

router.get(
    '/layanan/:id/kueri',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getKueriByLayanan
);

router.get(
    '/kueri/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getKueriById
);

router.post(
    '/kueri',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createKueri
);

router.put(
    '/kueri/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateKueri
);

router.delete(
    '/kueri/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteKueri
);

// =====================================================
// MRP 3A - TANGGAPAN KUERI
// Riwayat bersifat append-only
// =====================================================

router.get(
    '/tanggapan-kueri',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllTanggapanKueri
);

router.get(
    '/kueri/:id/tanggapan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getTanggapanByKueri
);

router.get(
    '/tanggapan-kueri/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getTanggapanKueriById
);

router.post(
    '/tanggapan-kueri',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .createTanggapanKueri
);

// =====================================================
// MRP 3B - MANAJEMEN INSIDEN
// =====================================================

router.get(
    '/insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllInsiden
);

router.get(
    '/layanan/:id/insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getInsidenByLayanan
);

router.get(
    '/insiden/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getInsidenById
);

router.post(
    '/insiden',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createInsiden
);

router.put(
    '/insiden/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateInsiden
);

router.delete(
    '/insiden/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteInsiden
);

// =====================================================
// MRP 3B - PENANGANAN INSIDEN
// Riwayat bersifat append-only
// =====================================================

router.get(
    '/penanganan-insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllPenangananInsiden
);

router.get(
    '/insiden/:id/penanganan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getPenangananByInsiden
);

router.get(
    '/penanganan-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getPenangananInsidenById
);

router.post(
    '/penanganan-insiden',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .createPenangananInsiden
);

// =====================================================
// MRP 3C - MANAJEMEN MASALAH / RCA
// =====================================================

router.get(
    '/masalah',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllMasalah
);

router.get(
    '/masalah/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getMasalahById
);

router.post(
    '/masalah',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createMasalah
);

router.put(
    '/masalah/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateMasalah
);

router.delete(
    '/masalah/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteMasalah
);

// =====================================================
// MRP 3C - RELASI MASALAH DAN INSIDEN
// =====================================================

router.get(
    '/masalah-insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllMasalahInsiden
);

router.get(
    '/masalah/:id/insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getInsidenByMasalah
);

router.get(
    '/masalah-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getMasalahInsidenById
);

router.post(
    '/masalah-insiden',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createMasalahInsiden
);

router.put(
    '/masalah-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateMasalahInsiden
);

router.delete(
    '/masalah-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteMasalahInsiden
);

// =====================================================
// MRP 3C - RELASI MASALAH DAN PENGETAHUAN
// =====================================================

router.get(
    '/masalah-pengetahuan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllMasalahPengetahuan
);

router.get(
    '/masalah/:id/pengetahuan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getPengetahuanByMasalah
);

router.get(
    '/masalah-pengetahuan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getMasalahPengetahuanById
);

router.post(
    '/masalah-pengetahuan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createMasalahPengetahuan
);

router.put(
    '/masalah-pengetahuan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateMasalahPengetahuan
);

router.delete(
    '/masalah-pengetahuan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteMasalahPengetahuan
);

// =====================================================
// MRP 4 - EVALUASI
// =====================================================

router.get(
    '/evaluasi',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getAllEvaluasi
);

router.get(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController.getEvaluasiById
);

router.post(
    '/evaluasi',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController.createEvaluasi
);

router.put(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController.updateEvaluasi
);

router.delete(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController.deleteEvaluasi
);

// =====================================================
// MRP 4 BAGIAN 1 - EVALUASI LAYANAN
// =====================================================

router.get(
    '/evaluasi-layanan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllEvaluasiLayanan
);

router.get(
    '/evaluasi/:id/layanan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getLayananByEvaluasi
);

router.get(
    '/evaluasi-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getEvaluasiLayananById
);

router.post(
    '/evaluasi-layanan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createEvaluasiLayanan
);

router.put(
    '/evaluasi-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateEvaluasiLayanan
);

router.delete(
    '/evaluasi-layanan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteEvaluasiLayanan
);

// =====================================================
// MRP 4 BAGIAN 1
// INDIKATOR EVALUASI LAYANAN
// =====================================================

router.get(
    '/evaluasi-layanan-indikator',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllEvaluasiLayananIndikator
);

router.get(
    '/evaluasi-layanan/:id/indikator',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getIndikatorByEvaluasiLayanan
);

router.get(
    '/evaluasi-layanan-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getEvaluasiLayananIndikatorById
);

router.post(
    '/evaluasi-layanan-indikator',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createEvaluasiLayananIndikator
);

router.put(
    '/evaluasi-layanan-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateEvaluasiLayananIndikator
);

router.delete(
    '/evaluasi-layanan-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteEvaluasiLayananIndikator
);

// =====================================================
// MRP 4 BAGIAN 2
// EVALUASI KUERI & INSIDEN
// =====================================================

router.get(
    '/evaluasi-kueri-insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllEvaluasiKueriInsiden
);

router.get(
    '/evaluasi/:id/kueri-insiden',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getKueriInsidenByEvaluasi
);

router.get(
    '/evaluasi-kueri-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getEvaluasiKueriInsidenById
);

router.post(
    '/evaluasi-kueri-insiden',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createEvaluasiKueriInsiden
);

router.put(
    '/evaluasi-kueri-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateEvaluasiKueriInsiden
);

router.delete(
    '/evaluasi-kueri-insiden/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteEvaluasiKueriInsiden
);

// =====================================================
// MRP 4 BAGIAN 2
// INDIKATOR EVALUASI KUERI & INSIDEN
// =====================================================

router.get(
    '/evaluasi-kueri-insiden-indikator',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllEvaluasiKueriInsidenIndikator
);

router.get(
    '/evaluasi-kueri-insiden/:id/indikator',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getIndikatorByEvaluasiKueriInsiden
);

router.get(
    '/evaluasi-kueri-insiden-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getEvaluasiKueriInsidenIndikatorById
);

router.post(
    '/evaluasi-kueri-insiden-indikator',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createEvaluasiKueriInsidenIndikator
);

router.put(
    '/evaluasi-kueri-insiden-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateEvaluasiKueriInsidenIndikator
);

router.delete(
    '/evaluasi-kueri-insiden-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteEvaluasiKueriInsidenIndikator
);

// =====================================================
// MRP 4 - EVALUASI SERVICE REQUEST
// =====================================================

router.get(
    '/evaluasi-permintaan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllEvaluasiPermintaan
);

router.get(
    '/permintaan-layanan/:id/evaluasi',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getEvaluasiByPermintaan
);

router.get(
    '/evaluasi-permintaan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getEvaluasiPermintaanById
);

router.post(
    '/evaluasi-permintaan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createEvaluasiPermintaan
);

router.put(
    '/evaluasi-permintaan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateEvaluasiPermintaan
);

router.delete(
    '/evaluasi-permintaan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteEvaluasiPermintaan
);

// =====================================================
// MRP 4
// INDIKATOR EVALUASI SERVICE REQUEST
// =====================================================

router.get(
    '/evaluasi-permintaan-indikator',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllEvaluasiPermintaanIndikator
);

router.get(
    '/evaluasi-permintaan/:id/indikator',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getIndikatorByEvaluasiPermintaan
);

router.get(
    '/evaluasi-permintaan-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getEvaluasiPermintaanIndikatorById
);

router.post(
    '/evaluasi-permintaan-indikator',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createEvaluasiPermintaanIndikator
);

router.put(
    '/evaluasi-permintaan-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateEvaluasiPermintaanIndikator
);

router.delete(
    '/evaluasi-permintaan-indikator/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteEvaluasiPermintaanIndikator
);

// =====================================================
// MRP 4 - RENCANA PERBAIKAN
// =====================================================

router.get(
    '/rencana-perbaikan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getAllRencanaPerbaikan
);

router.get(
    '/evaluasi/:id/rencana-perbaikan',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getRencanaPerbaikanByEvaluasi
);

router.get(
    '/rencana-perbaikan/:id',
    authMiddleware,
    requirePermission('user_relation.view'),
    relasiPenggunaController
        .getRencanaPerbaikanById
);

router.post(
    '/rencana-perbaikan',
    authMiddleware,
    requirePermission('user_relation.create'),
    relasiPenggunaController
        .createRencanaPerbaikan
);

router.put(
    '/rencana-perbaikan/:id',
    authMiddleware,
    requirePermission('user_relation.update'),
    relasiPenggunaController
        .updateRencanaPerbaikan
);

router.delete(
    '/rencana-perbaikan/:id',
    authMiddleware,
    requirePermission('user_relation.delete'),
    relasiPenggunaController
        .deleteRencanaPerbaikan
);

module.exports = router;