const express = require('express');
const router = express.Router();

const bcpController = require('../controllers/bcpController');

const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');

router.get(
  '/ruang-lingkup',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllRuangLingkup
);

router.get(
  '/layanan-prioritas/:id/detail',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getDetailLayananPrioritas
);

router.get(
  '/layanan-prioritas/:id/ruang-lingkup',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getRuangLingkupByLayananPrioritas
);

router.get(
  '/ruang-lingkup/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getRuangLingkupById
);

router.post(
  '/ruang-lingkup',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createRuangLingkup
);

router.put(
  '/ruang-lingkup/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateRuangLingkup
);

router.delete(
  '/ruang-lingkup/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteRuangLingkup
);

router.get(
  '/tim-manajemen',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllTimManajemen
);

router.get(
  '/layanan-prioritas/:id/tim-manajemen',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimManajemenByLayananPrioritas
);

router.get(
  '/user-options',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getUserOptions
);


router.get(
  '/user-options-form13',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getUserOptionsForm13
);


router.get(
  '/pegawai-options',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getPegawaiOptions
);

router.get(
  '/tim-manajemen/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimManajemenById
);

router.post(
  '/tim-manajemen',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createTimManajemen
);

router.put(
  '/tim-manajemen/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateTimManajemen
);

router.delete(
  '/tim-manajemen/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteTimManajemen
);

router.get(
  '/tanggap-insiden',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllTimTanggapInsiden
);

router.get(
  '/layanan-prioritas/:id/tanggap-insiden',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimTanggapInsidenByLayananPrioritas
);

router.get(
  '/tanggap-insiden/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimTanggapInsidenById
);

router.post(
  '/tanggap-insiden',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createTimTanggapInsiden
);

router.put(
  '/tanggap-insiden/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateTimTanggapInsiden
);

router.delete(
  '/tanggap-insiden/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteTimTanggapInsiden
);

router.get(
  '/pemulihan-layanan',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllTimPemulihanLayanan
);

router.get(
  '/layanan-prioritas/:id/pemulihan-layanan',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimPemulihanLayananByLayananPrioritas
);

router.get(
  '/pemulihan-layanan/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimPemulihanLayananById
);

router.post(
  '/pemulihan-layanan',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createTimPemulihanLayanan
);

router.put(
  '/pemulihan-layanan/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateTimPemulihanLayanan
);

router.delete(
  '/pemulihan-layanan/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteTimPemulihanLayanan
);

router.get(
  '/operasional',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllTimOperasional
);

router.get(
  '/layanan-prioritas/:id/operasional',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimOperasionalByLayananPrioritas
);

router.get(
  '/operasional/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getTimOperasionalById
);

router.post(
  '/operasional',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createTimOperasional
);

router.put(
  '/operasional/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateTimOperasional
);

router.delete(
  '/operasional/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteTimOperasional
);

router.get(
  '/rencana-komunikasi',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllRencanaKomunikasi
);

router.get(
  '/layanan-prioritas/:id/rencana-komunikasi',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getRencanaKomunikasiByLayananPrioritas
);

router.get(
  '/rencana-komunikasi/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getRencanaKomunikasiById
);

router.post(
  '/rencana-komunikasi',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createRencanaKomunikasi
);

router.put(
  '/rencana-komunikasi/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateRencanaKomunikasi
);

router.delete(
  '/rencana-komunikasi/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteRencanaKomunikasi
);

router.get(
  '/daftar-kontak',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllDaftarKontak
);

router.get(
  '/layanan-prioritas/:id/daftar-kontak',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getDaftarKontakByLayananPrioritas
);

router.get(
  '/daftar-kontak/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getDaftarKontakById
);

router.post(
  '/daftar-kontak',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createDaftarKontak
);

router.put(
  '/daftar-kontak/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateDaftarKontak
);

router.delete(
  '/daftar-kontak/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteDaftarKontak
);

router.get(
  '/sumber-daya-manusia',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllSumberDayaManusia
);

router.get(
  '/layanan-prioritas/:id/sumber-daya-manusia',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getSumberDayaManusiaByLayananPrioritas
);

router.get(
  '/sumber-daya-manusia/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getSumberDayaManusiaById
);

router.post(
  '/sumber-daya-manusia',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createSumberDayaManusia
);

router.put(
  '/sumber-daya-manusia/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateSumberDayaManusia
);

router.delete(
  '/sumber-daya-manusia/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteSumberDayaManusia
);

router.get(
  '/fasilitas-operasional',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllFasilitasOperasional
);

router.get(
  '/layanan-prioritas/:id/fasilitas-operasional',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getFasilitasOperasionalByLayananPrioritas
);

router.get(
  '/fasilitas-operasional/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getFasilitasOperasionalById
);

router.post(
  '/fasilitas-operasional',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createFasilitasOperasional
);

router.put(
  '/fasilitas-operasional/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateFasilitasOperasional
);

router.delete(
  '/fasilitas-operasional/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteFasilitasOperasional
);

router.get(
  '/sumber-daya-tik',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllSumberDayaTik
);

router.get(
  '/layanan-prioritas/:id/sumber-daya-tik',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getSumberDayaTikByLayananPrioritas
);

router.get(
  '/sumber-daya-tik/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getSumberDayaTikById
);

router.post(
  '/sumber-daya-tik',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createSumberDayaTik
);

router.put(
  '/sumber-daya-tik/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateSumberDayaTik
);

router.delete(
  '/sumber-daya-tik/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteSumberDayaTik
);

router.get(
  '/akses-sistem-tik',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllAksesSistemTik
);

router.get(
  '/layanan-prioritas/:id/akses-sistem-tik',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAksesSistemTikByLayananPrioritas
);

router.get(
  '/akses-sistem-tik/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAksesSistemTikById
);

router.post(
  '/akses-sistem-tik',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createAksesSistemTik
);

router.put(
  '/akses-sistem-tik/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateAksesSistemTik
);

router.delete(
  '/akses-sistem-tik/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteAksesSistemTik
);

router.get(
  '/sumber-daya-eksternal-tik',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllSumberDayaEksternalTik
);

router.get(
  '/layanan-prioritas/:id/sumber-daya-eksternal-tik',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getSumberDayaEksternalTikByLayananPrioritas
);

router.get(
  '/sumber-daya-eksternal-tik/:id',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getSumberDayaEksternalTikById
);

router.post(
  '/sumber-daya-eksternal-tik',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createSumberDayaEksternalTik
);

router.put(
  '/sumber-daya-eksternal-tik/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateSumberDayaEksternalTik
);

router.delete(
  '/sumber-daya-eksternal-tik/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteSumberDayaEksternalTik
);

// =====================================================
// PROSES 2 - BUSINESS IMPACT ANALYSIS (BIA)
// =====================================================

// GET semua BIA

router.get(
  '/bia-layanan-options',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getBiaLayananOptions
);

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
  bcpController.validateForm10Required('target'),
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




router.use(
  '/bia/:id/insiden',
  authMiddleware,
  bcpController.checkForm10Instansi('bia')
);

router.use(
  '/bia/:id/ketergantungan',
  authMiddleware,
  bcpController.checkForm10Instansi('bia')
);

router.use(
  '/insiden/:id',
  authMiddleware,
  bcpController.checkForm10Instansi('insiden')
);

router.use(
  '/insiden-modul/:id',
  authMiddleware,
  bcpController.checkForm10Instansi('modul')
);

router.use(
  '/ketergantungan/:id',
  authMiddleware,
  bcpController.checkForm10Instansi('ketergantungan')
);

router.get(
  '/module-options',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getModuleOptions
);

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
  bcpController.validateForm10Required('insiden'),
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
  bcpController.validateForm10Required('insiden'),
  bcpController.updateInsiden
);

router.delete(
  '/insiden/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteInsiden
);

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
  bcpController.validateForm10Required('modul'),
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
  bcpController.validateForm10Required('modul'),
  bcpController.updateModulInsiden
);

router.delete(
  '/insiden-modul/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteModulInsiden
);

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
  bcpController.validateForm10Required('ketergantungan'),
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
  bcpController.validateForm10Required('ketergantungan'),
  bcpController.updateKetergantungan
);

router.delete(
  '/ketergantungan/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteKetergantungan
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


router.use(
  '/strategi/:id',
  authMiddleware,
  bcpController.checkForm11Instansi('strategi')
);

router.use(
  '/langkah-pemulihan/:id',
  authMiddleware,
  bcpController.checkForm11Instansi('langkah')
);

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
  bcpController.validateForm11Required('strategi'),
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
  bcpController.validateForm11Required('strategi'),
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
  bcpController.validateForm11Required('langkah'),
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
  bcpController.validateForm11Required('langkah'),
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


router.use(
  '/insiden/:id/uji',
  authMiddleware,
  bcpController.checkForm12and13Instansi('insiden')
);

router.use(
  '/uji/:id',
  authMiddleware,
  bcpController.checkForm12and13Instansi('uji')
);

router.use(
  '/evaluasi/:id',
  authMiddleware,
  bcpController.checkForm12and13Instansi('evaluasi')
);

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
  bcpController.validateForm12and13('uji'),
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
  bcpController.validateForm12and13('uji'),
  bcpController.updateUji
);

router.delete(
  '/uji/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteUji
);

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
  bcpController.validateForm12and13('evaluasi'),
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
  bcpController.validateForm12and13('evaluasi'),
  bcpController.updateEvaluasi
);

router.delete(
  '/evaluasi/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteEvaluasi
);

router.get(
  '/struktur-tim',
  authMiddleware,
  requirePermission('continuity.view'),
  bcpController.getAllStrukturTim
);

router.post(
  '/struktur-tim',
  authMiddleware,
  requirePermission('continuity.create'),
  bcpController.createStrukturTim
);

router.put(
  '/struktur-tim/:id',
  authMiddleware,
  requirePermission('continuity.update'),
  bcpController.updateStrukturTim
);

router.delete(
  '/struktur-tim/:id',
  authMiddleware,
  requirePermission('continuity.delete'),
  bcpController.deleteStrukturTim
);

module.exports = router;