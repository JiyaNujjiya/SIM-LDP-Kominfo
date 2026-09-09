const express = require('express');
const router = express.Router();

const perubahanController = require('../controllers/perubahanController');
const authMiddleware = require('../middleware/auth');
const requirePermission = require('../middleware/permissionMiddleware');

router.get(
    '/unit-options',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getUnitOptions
);

router.get(
    '/user-options',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getUserOptions
);

router.get(
    '/layanan-options',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getLayananOptions
);

router.get(
    '/layanan-prioritas-options',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getLayananPrioritasOptions
);

router.get(
    '/perencanaan',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getAllPerencanaan
);

router.get(
    '/perencanaan/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getPerencanaanById
);

router.post(
    '/perencanaan',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createPerencanaan
);

router.put(
    '/perencanaan/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updatePerencanaan
);

router.delete(
    '/perencanaan/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deletePerencanaan
);

router.get(
    '/perencanaan/:id/analisis-prioritas',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getAnalisisPrioritasByPerencanaan
);

router.post(
    '/perencanaan/:id/analisis-prioritas',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createAnalisisPrioritas
);

router.get(
    '/analisis-prioritas/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getAnalisisPrioritasById
);

router.put(
    '/analisis-prioritas/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateAnalisisPrioritas
);

router.delete(
    '/analisis-prioritas/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteAnalisisPrioritas
);

router.get(
    '/dampak-teknis/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getDampakTeknisById
);

router.put(
    '/dampak-teknis/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateDampakTeknis
);

router.delete(
    '/dampak-teknis/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteDampakTeknis
);

router.get(
    '/:id/dampak-teknis',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getDampakTeknisByPerubahan
);

router.post(
    '/:id/dampak-teknis',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createDampakTeknis
);

router.get(
    '/:id/persetujuan/analisis-teknis',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getPersetujuanAnalisisTeknis
);

router.post(
    '/:id/persetujuan/analisis-teknis/setujui',
    authMiddleware,
    requirePermission('change.approve'),
    perubahanController.approveAnalisisTeknis
);

router.post(
    '/:id/persetujuan/analisis-teknis/tolak',
    authMiddleware,
    requirePermission('change.reject'),
    perubahanController.rejectAnalisisTeknis
);

router.get(
    '/indikator-dampak-organisasi',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getIndikatorDampakOrganisasi
);

router.get(
    '/analisis-organisasi/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getAnalisisOrganisasiById
);

router.put(
    '/analisis-organisasi/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateAnalisisOrganisasi
);

router.delete(
    '/analisis-organisasi/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteAnalisisOrganisasi
);

router.get(
    '/:id/analisis-organisasi',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getAnalisisOrganisasiByPerubahan
);

router.post(
    '/:id/analisis-organisasi',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createAnalisisOrganisasi
);

router.get(
    '/:id/persetujuan/analisis-organisasi',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getPersetujuanAnalisisOrganisasi
);

router.post(
    '/:id/persetujuan/analisis-organisasi/setujui',
    authMiddleware,
    requirePermission('change.approve'),
    perubahanController.approveAnalisisOrganisasi
);

router.post(
    '/:id/persetujuan/analisis-organisasi/tolak',
    authMiddleware,
    requirePermission('change.reject'),
    perubahanController.rejectAnalisisOrganisasi
);

router.get(
    '/implementasi/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getImplementasiById
);

router.put(
    '/implementasi/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateImplementasi
);

router.delete(
    '/implementasi/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteImplementasi
);

router.get(
    '/:id/implementasi',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getImplementasiByPerubahan
);

router.post(
    '/:id/implementasi',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createImplementasi
);

router.get(
    '/implementasi/:id/sumber-daya',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getSumberDayaByImplementasi
);

router.post(
    '/implementasi/:id/sumber-daya',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createSumberDaya
);

router.put(
    '/sumber-daya/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateSumberDaya
);

router.delete(
    '/sumber-daya/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteSumberDaya
);

router.get(
    '/implementasi/:id/anggaran',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getAnggaranByImplementasi
);

router.post(
    '/implementasi/:id/anggaran',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createAnggaran
);

router.put(
    '/anggaran/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateAnggaran
);

router.delete(
    '/anggaran/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteAnggaran
);

router.get(
    '/implementasi/:id/indikator-keberhasilan',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getIndikatorKeberhasilanByImplementasi
);

router.post(
    '/implementasi/:id/indikator-keberhasilan',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createIndikatorKeberhasilan
);

router.put(
    '/indikator-keberhasilan/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateIndikatorKeberhasilan
);

router.delete(
    '/indikator-keberhasilan/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteIndikatorKeberhasilan
);

router.get(
    '/implementasi/:id/strategi-implementasi',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getStrategiImplementasiByImplementasi
);

router.post(
    '/implementasi/:id/strategi-implementasi',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createStrategiImplementasi
);

router.get(
    '/strategi-implementasi/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getStrategiImplementasiById
);

router.put(
    '/strategi-implementasi/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateStrategiImplementasi
);

router.delete(
    '/strategi-implementasi/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteStrategiImplementasi
);

router.get(
    '/implementasi/:id/stakeholder',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getStakeholderByImplementasi
);

router.post(
    '/implementasi/:id/stakeholder',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createStakeholder
);

router.get(
    '/stakeholder/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getStakeholderById
);

router.put(
    '/stakeholder/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateStakeholder
);

router.delete(
    '/stakeholder/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteStakeholder
);

router.get(
    '/implementasi/:id/komunikasi',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getKomunikasiByImplementasi
);

router.post(
    '/implementasi/:id/komunikasi',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createKomunikasi
);

router.get(
    '/komunikasi/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getKomunikasiById
);

router.put(
    '/komunikasi/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateKomunikasi
);

router.delete(
    '/komunikasi/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteKomunikasi
);

router.get(
    '/implementasi/:id/pelatihan',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getPelatihanByImplementasi
);

router.post(
    '/implementasi/:id/pelatihan',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createPelatihan
);

router.get(
    '/pelatihan/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getPelatihanById
);

router.put(
    '/pelatihan/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updatePelatihan
);

router.delete(
    '/pelatihan/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deletePelatihan
);

router.get(
    '/:id/persetujuan/pelaksanaan',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getPersetujuanPelaksanaan
);

router.post(
    '/:id/persetujuan/pelaksanaan/approve',
    authMiddleware,
    requirePermission('change.approve'),
    perubahanController.approvePelaksanaan
);

router.post(
    '/:id/persetujuan/pelaksanaan/reject',
    authMiddleware,
    requirePermission('change.reject'),
    perubahanController.rejectPelaksanaan
);

router.get(
    '/implementasi/:id/evaluasi',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getEvaluasiByImplementasi
);

router.post(
    '/implementasi/:id/evaluasi',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createEvaluasi
);

router.get(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getEvaluasiById
);

router.put(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateEvaluasi
);

router.delete(
    '/evaluasi/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteEvaluasi
);

router.get(
    '/:id/logbook',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getLogPerubahanByPerubahan
);

router.post(
    '/:id/logbook',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createLogPerubahan
);

router.get(
    '/logbook/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getLogPerubahanById
);

router.put(
    '/logbook/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateLogPerubahan
);

router.delete(
    '/logbook/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteLogPerubahan
);

router.get(
    '/logbook/:id/bukti',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getBuktiPelaksanaanByLogbook
);

router.post(
    '/logbook/:id/bukti',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createBuktiPelaksanaan
);

router.get(
    '/bukti-pelaksanaan/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getBuktiPelaksanaanById
);

router.put(
    '/bukti-pelaksanaan/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updateBuktiPelaksanaan
);

router.delete(
    '/bukti-pelaksanaan/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deleteBuktiPelaksanaan
);

router.get(
    '/',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getAllPerubahan
);

router.post(
    '/',
    authMiddleware,
    requirePermission('change.create'),
    perubahanController.createPerubahan
);

router.get(
    '/:id',
    authMiddleware,
    requirePermission('change.view'),
    perubahanController.getPerubahanById
);

router.put(
    '/:id',
    authMiddleware,
    requirePermission('change.update'),
    perubahanController.updatePerubahan
);

router.delete(
    '/:id',
    authMiddleware,
    requirePermission('change.delete'),
    perubahanController.deletePerubahan
);

module.exports = router;