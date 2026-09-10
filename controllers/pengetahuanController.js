const db = require('../config/db');

const fs = require('fs');
const path = require('path');


exports.getAllPerencanaan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.instansi_id,
        i.nama_instansi,
        p.tahun_perencanaan,
        p.status,
        p.created_by,
        u.nama AS pembuat,
        p.created_at,
        p.updated_at
      FROM mpn_perencanaan p
      JOIN instansi i
        ON i.id = p.instansi_id
      JOIN users u
        ON u.id = p.created_by
      ORDER BY p.tahun_perencanaan DESC, p.created_at DESC
    `);

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('ERROR GET PERENCANAAN:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getDetailPerencanaan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.instansi_id,
        i.nama_instansi,
        p.tahun_perencanaan,
        p.status,
        p.created_by,
        u.nama AS pembuat,
        p.created_at,
        p.updated_at
      FROM mpn_perencanaan p
      JOIN instansi i
        ON i.id = p.instansi_id
      JOIN users u
        ON u.id = p.created_by
      WHERE p.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error('ERROR GET DETAIL PERENCANAAN:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createPerencanaan = async (req, res) => {
  try {
    const {
      instansi_id,
      tahun_perencanaan,
      status = 'Draft'
    } = req.body;

    const created_by = req.user.id;

    // Validasi field wajib
    if (!instansi_id || !tahun_perencanaan) {
      return res.status(400).json({
        message: 'Instansi dan tahun perencanaan wajib diisi'
      });
    }

    // Validasi ID instansi
    const instansiId = Number(instansi_id);

    if (!Number.isInteger(instansiId) || instansiId <= 0) {
      return res.status(400).json({
        message: 'ID instansi tidak valid'
      });
    }

    // Validasi tahun
    const tahun = Number(tahun_perencanaan);

    if (
      !Number.isInteger(tahun) ||
      tahun < 1901 ||
      tahun > 2155
    ) {
      return res.status(400).json({
        message: 'Tahun perencanaan tidak valid'
      });
    }

    // Validasi status
    const statusValid = ['Draft', 'Aktif', 'Selesai'];

    if (!statusValid.includes(status)) {
      return res.status(400).json({
        message: 'Status harus Draft, Aktif, atau Selesai'
      });
    }

    // Cek apakah instansi benar-benar ada
    const [instansi] = await db.query(
      `
      SELECT id
      FROM instansi
      WHERE id = ?
      LIMIT 1
      `,
      [instansiId]
    );

    if (instansi.length === 0) {
      return res.status(400).json({
        message: 'Instansi tidak ditemukan'
      });
    }

    // Cek duplicate instansi + tahun
    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE instansi_id = ?
        AND tahun_perencanaan = ?
      LIMIT 1
      `,
      [instansiId, tahun]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
      });
    }

    // Simpan perencanaan
    const [result] = await db.query(
      `
      INSERT INTO mpn_perencanaan
        (
          instansi_id,
          tahun_perencanaan,
          status,
          created_by
        )
      VALUES (?, ?, ?, ?)
      `,
      [
        instansiId,
        tahun,
        status,
        created_by
      ]
    );

    return res.status(201).json({
      message: 'Data perencanaan berhasil disimpan',
      data: {
        id: result.insertId,
        instansi_id: instansiId,
        tahun_perencanaan: tahun,
        status: status,
        created_by: created_by
      }
    });

  } catch (error) {
    console.error('ERROR CREATE PERENCANAAN:', error);

    // Pengaman kalau duplicate lolos dari pengecekan sebelumnya
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.updatePerencanaan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      instansi_id,
      tahun_perencanaan,
      status
    } = req.body;

    // Validasi ID perencanaan
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    // Cek apakah data perencanaan ada
    const [perencanaan] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    // Validasi field wajib
    if (!instansi_id || !tahun_perencanaan || !status) {
      return res.status(400).json({
        message: 'Instansi, tahun perencanaan, dan status wajib diisi'
      });
    }

    const instansiId = Number(instansi_id);
    const tahun = Number(tahun_perencanaan);

    // Validasi instansi_id
    if (!Number.isInteger(instansiId) || instansiId <= 0) {
      return res.status(400).json({
        message: 'ID instansi tidak valid'
      });
    }

    // Validasi tahun
    if (
      !Number.isInteger(tahun) ||
      tahun < 1901 ||
      tahun > 2155
    ) {
      return res.status(400).json({
        message: 'Tahun perencanaan tidak valid'
      });
    }

    // Validasi status
    const statusValid = ['Draft', 'Aktif', 'Selesai'];

    if (!statusValid.includes(status)) {
      return res.status(400).json({
        message: 'Status harus Draft, Aktif, atau Selesai'
      });
    }

    // Cek instansi
    const [instansi] = await db.query(
      `
      SELECT id
      FROM instansi
      WHERE id = ?
      LIMIT 1
      `,
      [instansiId]
    );

    if (instansi.length === 0) {
      return res.status(400).json({
        message: 'Instansi tidak ditemukan'
      });
    }

    // Cek duplicate selain data yang sedang diedit
    const [duplicate] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE instansi_id = ?
        AND tahun_perencanaan = ?
        AND id <> ?
      LIMIT 1
      `,
      [instansiId, tahun, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message: 'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
      });
    }

    // Update data
    await db.query(
      `
      UPDATE mpn_perencanaan
      SET
        instansi_id = ?,
        tahun_perencanaan = ?,
        status = ?
      WHERE id = ?
      `,
      [
        instansiId,
        tahun,
        status,
        id
      ]
    );

    return res.status(200).json({
      message: 'Data perencanaan berhasil diperbarui',
      data: {
        id,
        instansi_id: instansiId,
        tahun_perencanaan: tahun,
        status
      }
    });

  } catch (error) {
    console.error('ERROR UPDATE PERENCANAAN:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.deletePerencanaan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    // Cek data
    const [perencanaan] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    // Hapus data
    await db.query(
      `
      DELETE FROM mpn_perencanaan
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: 'Data perencanaan berhasil dihapus'
    });

  } catch (error) {
    console.error('ERROR DELETE PERENCANAAN:', error);

    // Jika masih dipakai tabel lain melalui foreign key
    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Data perencanaan tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getIndikatorPerencanaan = async (req, res) => {
  try {
    const perencanaanId = Number(req.params.id);

    if (!Number.isInteger(perencanaanId) || perencanaanId <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    // Pastikan perencanaan ada
    const [perencanaan] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [perencanaanId]
    );

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        perencanaan_id,
        kode_indikator,
        nilai_saat_ini,
        nilai_target,
        created_at,
        updated_at
      FROM mpn_indikator_perencanaan
      WHERE perencanaan_id = ?
      ORDER BY id ASC
      `,
      [perencanaanId]
    );

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error('ERROR GET INDIKATOR PERENCANAAN:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createIndikatorPerencanaan = async (req, res) => {
  try {
    const perencanaanId = Number(req.params.id);

    const {
      kode_indikator,
      nilai_saat_ini,
      nilai_target
    } = req.body;

    if (!Number.isInteger(perencanaanId) || perencanaanId <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    // Jangan pakai !nilai_saat_ini karena angka 0 valid
    if (
      !kode_indikator ||
      nilai_saat_ini === undefined ||
      nilai_saat_ini === null ||
      nilai_saat_ini === '' ||
      nilai_target === undefined ||
      nilai_target === null ||
      nilai_target === ''
    ) {
      return res.status(400).json({
        message: 'Kode indikator, nilai saat ini, dan nilai target wajib diisi'
      });
    }

    const nilaiSaatIni = Number(nilai_saat_ini);
    const nilaiTarget = Number(nilai_target);

    if (
      !Number.isFinite(nilaiSaatIni) ||
      !Number.isFinite(nilaiTarget)
    ) {
      return res.status(400).json({
        message: 'Nilai indikator harus berupa angka'
      });
    }

    const indikatorValid = [
      'CAKUPAN_DOKUMENTASI',
      'KESESUAIAN_PENGGUNA'
    ];

    if (!indikatorValid.includes(kode_indikator)) {
      return res.status(400).json({
        message: 'Kode indikator tidak valid'
      });
    }

    // Validasi range berdasarkan jenis indikator
    if (kode_indikator === 'CAKUPAN_DOKUMENTASI') {
      if (
        nilaiSaatIni < 0 ||
        nilaiSaatIni > 100 ||
        nilaiTarget < 0 ||
        nilaiTarget > 100
      ) {
        return res.status(400).json({
          message: 'Nilai CAKUPAN_DOKUMENTASI harus antara 0 dan 100'
        });
      }
    }

    if (kode_indikator === 'KESESUAIAN_PENGGUNA') {
      if (
        nilaiSaatIni < 1 ||
        nilaiSaatIni > 5 ||
        nilaiTarget < 1 ||
        nilaiTarget > 5
      ) {
        return res.status(400).json({
          message: 'Nilai KESESUAIAN_PENGGUNA harus antara 1 dan 5'
        });
      }
    }

    // Pastikan perencanaan ada
    const [perencanaan] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [perencanaanId]
    );

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    // Cek duplicate indikator
    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_indikator_perencanaan
      WHERE perencanaan_id = ?
        AND kode_indikator = ?
      LIMIT 1
      `,
      [perencanaanId, kode_indikator]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Indikator tersebut sudah tersedia pada perencanaan ini'
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO mpn_indikator_perencanaan
      (
        perencanaan_id,
        kode_indikator,
        nilai_saat_ini,
        nilai_target
      )
      VALUES (?, ?, ?, ?)
      `,
      [
        perencanaanId,
        kode_indikator,
        nilaiSaatIni,
        nilaiTarget
      ]
    );

    return res.status(201).json({
      message: 'Indikator perencanaan berhasil disimpan',
      data: {
        id: result.insertId,
        perencanaan_id: perencanaanId,
        kode_indikator,
        nilai_saat_ini: nilaiSaatIni,
        nilai_target: nilaiTarget
      }
    });

  } catch (error) {
    console.error('ERROR CREATE INDIKATOR PERENCANAAN:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Indikator tersebut sudah tersedia pada perencanaan ini'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.updateIndikatorPerencanaan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      kode_indikator,
      nilai_saat_ini,
      nilai_target
    } = req.body;

    // Validasi ID indikator
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID indikator tidak valid'
      });
    }

    // Cek indikator ada atau tidak
    const [indikator] = await db.query(
      `
      SELECT
        id,
        perencanaan_id,
        kode_indikator
      FROM mpn_indikator_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (indikator.length === 0) {
      return res.status(404).json({
        message: 'Data indikator tidak ditemukan'
      });
    }

    // Validasi field wajib
    if (
      !kode_indikator ||
      nilai_saat_ini === undefined ||
      nilai_saat_ini === null ||
      nilai_saat_ini === '' ||
      nilai_target === undefined ||
      nilai_target === null ||
      nilai_target === ''
    ) {
      return res.status(400).json({
        message: 'Kode indikator, nilai saat ini, dan nilai target wajib diisi'
      });
    }

    const nilaiSaatIni = Number(nilai_saat_ini);
    const nilaiTarget = Number(nilai_target);

    if (
      !Number.isFinite(nilaiSaatIni) ||
      !Number.isFinite(nilaiTarget)
    ) {
      return res.status(400).json({
        message: 'Nilai indikator harus berupa angka'
      });
    }

    const indikatorValid = [
      'CAKUPAN_DOKUMENTASI',
      'KESESUAIAN_PENGGUNA'
    ];

    if (!indikatorValid.includes(kode_indikator)) {
      return res.status(400).json({
        message: 'Kode indikator tidak valid'
      });
    }

    // Validasi range
    if (kode_indikator === 'CAKUPAN_DOKUMENTASI') {
      if (
        nilaiSaatIni < 0 ||
        nilaiSaatIni > 100 ||
        nilaiTarget < 0 ||
        nilaiTarget > 100
      ) {
        return res.status(400).json({
          message: 'Nilai CAKUPAN_DOKUMENTASI harus antara 0 dan 100'
        });
      }
    }

    if (kode_indikator === 'KESESUAIAN_PENGGUNA') {
      if (
        nilaiSaatIni < 1 ||
        nilaiSaatIni > 5 ||
        nilaiTarget < 1 ||
        nilaiTarget > 5
      ) {
        return res.status(400).json({
          message: 'Nilai KESESUAIAN_PENGGUNA harus antara 1 dan 5'
        });
      }
    }

    const perencanaanId = indikator[0].perencanaan_id;

    // Cek duplicate jika kode indikator diubah
    const [duplicate] = await db.query(
      `
      SELECT id
      FROM mpn_indikator_perencanaan
      WHERE perencanaan_id = ?
        AND kode_indikator = ?
        AND id <> ?
      LIMIT 1
      `,
      [perencanaanId, kode_indikator, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message: 'Indikator tersebut sudah tersedia pada perencanaan ini'
      });
    }

    await db.query(
      `
      UPDATE mpn_indikator_perencanaan
      SET
        kode_indikator = ?,
        nilai_saat_ini = ?,
        nilai_target = ?
      WHERE id = ?
      `,
      [
        kode_indikator,
        nilaiSaatIni,
        nilaiTarget,
        id
      ]
    );

    return res.status(200).json({
      message: 'Indikator perencanaan berhasil diperbarui',
      data: {
        id,
        perencanaan_id: perencanaanId,
        kode_indikator,
        nilai_saat_ini: nilaiSaatIni,
        nilai_target: nilaiTarget
      }
    });

  } catch (error) {
    console.error('ERROR UPDATE INDIKATOR PERENCANAAN:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Indikator tersebut sudah tersedia pada perencanaan ini'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.deleteIndikatorPerencanaan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID indikator tidak valid'
      });
    }

    const [indikator] = await db.query(
      `
      SELECT id
      FROM mpn_indikator_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (indikator.length === 0) {
      return res.status(404).json({
        message: 'Data indikator tidak ditemukan'
      });
    }

    await db.query(
      `
      DELETE FROM mpn_indikator_perencanaan
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: 'Indikator perencanaan berhasil dihapus'
    });

  } catch (error) {
    console.error('ERROR DELETE INDIKATOR PERENCANAAN:', error);

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Indikator tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getAllPengetahuan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        p.id,
        p.kode_pengetahuan,
        p.layanan_id,
        l.nama_layanan,
        p.nama_pengetahuan,
        p.jenis_pengetahuan,
        p.sudah_terdokumentasi,
        p.aspek_pemdi,
        p.indikator_pemdi,
        p.pemilik_instansi_id,
        i.nama_instansi AS pemilik_instansi,
        p.pemilik_unit_kerja_id,
        uk.nama_unit AS pemilik_unit_kerja,
        p.created_by,
        u.nama AS pembuat,
        p.created_at,
        p.updated_at
      FROM mpn_pengetahuan p
      JOIN layanan_digital l
        ON l.id = p.layanan_id
      LEFT JOIN instansi i
        ON i.id = p.pemilik_instansi_id
      LEFT JOIN unit_kerja uk
        ON uk.id = p.pemilik_unit_kerja_id
      JOIN users u
        ON u.id = p.created_by
      ORDER BY p.created_at DESC
    `);

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error('ERROR GET PENGETAHUAN:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createPengetahuan = async (req, res) => {
  try {
    const {
      kode_pengetahuan,
      layanan_id,
      nama_pengetahuan,
      jenis_pengetahuan = 'Eksplisit',
      sudah_terdokumentasi = 0,
      aspek_pemdi = null,
      indikator_pemdi = null,
      pemilik_instansi_id = null,
      pemilik_unit_kerja_id = null
    } = req.body;

    const created_by = req.user.id;

    // Field wajib
    if (!kode_pengetahuan || !layanan_id || !nama_pengetahuan) {
      return res.status(400).json({
        message: 'Kode pengetahuan, layanan, dan nama pengetahuan wajib diisi'
      });
    }

    const layananId = Number(layanan_id);

    if (!Number.isInteger(layananId) || layananId <= 0) {
      return res.status(400).json({
        message: 'ID layanan tidak valid'
      });
    }

    // Validasi jenis pengetahuan
    const jenisValid = ['Eksplisit', 'Implisit'];

    if (!jenisValid.includes(jenis_pengetahuan)) {
      return res.status(400).json({
        message: 'Jenis pengetahuan harus Eksplisit atau Implisit'
      });
    }

    // Validasi sudah terdokumentasi
    const terdokumentasi = Number(sudah_terdokumentasi);

    if (![0, 1].includes(terdokumentasi)) {
      return res.status(400).json({
        message: 'Status sudah terdokumentasi harus 0 atau 1'
      });
    }

    // Cek layanan
    const [layanan] = await db.query(
      `
      SELECT id
      FROM layanan_digital
      WHERE id = ?
      LIMIT 1
      `,
      [layananId]
    );

    if (layanan.length === 0) {
      return res.status(400).json({
        message: 'Layanan tidak ditemukan'
      });
    }

    // Cek kode duplicate
    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE kode_pengetahuan = ?
      LIMIT 1
      `,
      [kode_pengetahuan]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Kode pengetahuan sudah digunakan'
      });
    }

    // Validasi instansi jika diisi
    if (pemilik_instansi_id !== null && pemilik_instansi_id !== '') {
      const instansiId = Number(pemilik_instansi_id);

      if (!Number.isInteger(instansiId) || instansiId <= 0) {
        return res.status(400).json({
          message: 'ID pemilik instansi tidak valid'
        });
      }

      const [instansi] = await db.query(
        `
        SELECT id
        FROM instansi
        WHERE id = ?
        LIMIT 1
        `,
        [instansiId]
      );

      if (instansi.length === 0) {
        return res.status(400).json({
          message: 'Pemilik instansi tidak ditemukan'
        });
      }
    }

    // Validasi unit kerja jika diisi
    if (pemilik_unit_kerja_id !== null && pemilik_unit_kerja_id !== '') {
      const unitId = Number(pemilik_unit_kerja_id);

      if (!Number.isInteger(unitId) || unitId <= 0) {
        return res.status(400).json({
          message: 'ID pemilik unit kerja tidak valid'
        });
      }

      const [unit] = await db.query(
        `
        SELECT id
        FROM unit_kerja
        WHERE id = ?
        LIMIT 1
        `,
        [unitId]
      );

      if (unit.length === 0) {
        return res.status(400).json({
          message: 'Pemilik unit kerja tidak ditemukan'
        });
      }
    }

    const [result] = await db.query(
      `
      INSERT INTO mpn_pengetahuan
      (
        kode_pengetahuan,
        layanan_id,
        nama_pengetahuan,
        jenis_pengetahuan,
        sudah_terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        pemilik_instansi_id,
        pemilik_unit_kerja_id,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        kode_pengetahuan,
        layananId,
        nama_pengetahuan,
        jenis_pengetahuan,
        terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        pemilik_instansi_id || null,
        pemilik_unit_kerja_id || null,
        created_by
      ]
    );

    return res.status(201).json({
      message: 'Data pengetahuan berhasil disimpan',
      data: {
        id: result.insertId,
        kode_pengetahuan,
        layanan_id: layananId,
        nama_pengetahuan,
        jenis_pengetahuan,
        sudah_terdokumentasi: terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        pemilik_instansi_id: pemilik_instansi_id || null,
        pemilik_unit_kerja_id: pemilik_unit_kerja_id || null,
        created_by
      }
    });

  } catch (error) {
    console.error('ERROR CREATE PENGETAHUAN:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Kode pengetahuan sudah digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getRencanaDokumentasi = async (req, res) => {
  try {
    const perencanaanId = Number(req.params.id);

    if (!Number.isInteger(perencanaanId) || perencanaanId <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    // Pastikan perencanaan ada
    const [perencanaan] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [perencanaanId]
    );

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    // Ambil rencana dokumentasi
    const [rows] = await db.query(
      `
      SELECT
        rd.id,
        rd.perencanaan_id,
        rd.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,
        rd.ditargetkan_tahun_ini,
        rd.penanggung_jawab_id,
        u.nama AS penanggung_jawab,
        DATE_FORMAT(rd.target_waktu_dokumentasi, '%Y-%m-%d') AS target_waktu_dokumentasi
      FROM mpn_rencana_dokumentasi rd
      JOIN mpn_pengetahuan p
        ON p.id = rd.pengetahuan_id
      LEFT JOIN users u
        ON u.id = rd.penanggung_jawab_id
      WHERE rd.perencanaan_id = ?
      ORDER BY rd.id ASC
      `,
      [perencanaanId]
    );

    // Ambil tipe dokumentasi
    for (const row of rows) {
      const [tipe] = await db.query(
        `
        SELECT tipe_dokumentasi
        FROM mpn_rencana_tipe_dokumentasi
        WHERE rencana_dokumentasi_id = ?
        ORDER BY id ASC
        `,
        [row.id]
      );

      row.tipe_dokumentasi = tipe.map(
        item => item.tipe_dokumentasi
      );
    }

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error('ERROR GET RENCANA DOKUMENTASI:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createRencanaDokumentasi = async (req, res) => {
  let connection;

  try {
    const perencanaanId = Number(req.params.id);

    const {
      pengetahuan_id,
      ditargetkan_tahun_ini,
      penanggung_jawab_id = null,
      target_waktu_dokumentasi = null,
      tipe_dokumentasi
    } = req.body;

    if (!Number.isInteger(perencanaanId) || perencanaanId <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    const pengetahuanId = Number(pengetahuan_id);

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'ID pengetahuan tidak valid'
      });
    }

    // Validasi ditargetkan tahun ini
    const ditargetkan = Number(ditargetkan_tahun_ini);

    if (![0, 1].includes(ditargetkan)) {
      return res.status(400).json({
        message: 'Ditargetkan tahun ini harus bernilai 0 atau 1'
      });
    }

    // Validasi tipe dokumentasi
    if (
      !Array.isArray(tipe_dokumentasi) ||
      tipe_dokumentasi.length === 0
    ) {
      return res.status(400).json({
        message: 'Tipe dokumentasi wajib diisi'
      });
    }

    const tipeValid = [
      'Teks',
      'Gambar',
      'Audio',
      'Video'
    ];

    const tipeUnik = [...new Set(tipe_dokumentasi)];

    const tipeTidakValid = tipeUnik.some(
      tipe => !tipeValid.includes(tipe)
    );

    if (tipeTidakValid) {
      return res.status(400).json({
        message: 'Tipe dokumentasi tidak valid'
      });
    }

    // Cek perencanaan
    const [perencanaan] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [perencanaanId]
    );

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    // Cek pengetahuan
    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // Validasi penanggung jawab jika diisi
    let penanggungJawabId = null;

    if (
      penanggung_jawab_id !== null &&
      penanggung_jawab_id !== ''
    ) {
      penanggungJawabId = Number(penanggung_jawab_id);

      if (
        !Number.isInteger(penanggungJawabId) ||
        penanggungJawabId <= 0
      ) {
        return res.status(400).json({
          message: 'ID penanggung jawab tidak valid'
        });
      }

      const [user] = await db.query(
        `
        SELECT id
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [penanggungJawabId]
      );

      if (user.length === 0) {
        return res.status(400).json({
          message: 'Penanggung jawab tidak ditemukan'
        });
      }
    }

    // Cek duplicate perencanaan + pengetahuan
    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_rencana_dokumentasi
      WHERE perencanaan_id = ?
        AND pengetahuan_id = ?
      LIMIT 1
      `,
      [perencanaanId, pengetahuanId]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Pengetahuan tersebut sudah memiliki rencana dokumentasi pada perencanaan ini'
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO mpn_rencana_dokumentasi
      (
        perencanaan_id,
        pengetahuan_id,
        ditargetkan_tahun_ini,
        penanggung_jawab_id,
        target_waktu_dokumentasi
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        perencanaanId,
        pengetahuanId,
        ditargetkan,
        penanggungJawabId,
        target_waktu_dokumentasi || null
      ]
    );

    const rencanaDokumentasiId = result.insertId;

    for (const tipe of tipeUnik) {
      await connection.query(
        `
        INSERT INTO mpn_rencana_tipe_dokumentasi
        (
          rencana_dokumentasi_id,
          tipe_dokumentasi
        )
        VALUES (?, ?)
        `,
        [
          rencanaDokumentasiId,
          tipe
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: 'Rencana dokumentasi berhasil disimpan',
      data: {
        id: rencanaDokumentasiId,
        perencanaan_id: perencanaanId,
        pengetahuan_id: pengetahuanId,
        ditargetkan_tahun_ini: ditargetkan,
        penanggung_jawab_id: penanggungJawabId,
        target_waktu_dokumentasi:
          target_waktu_dokumentasi || null,
        tipe_dokumentasi: tipeUnik
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERROR CREATE RENCANA DOKUMENTASI:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Pengetahuan tersebut sudah memiliki rencana dokumentasi pada perencanaan ini'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.updateRencanaDokumentasi = async (req, res) => {
  let connection;

  try {
    const id = Number(req.params.id);

    const {
      pengetahuan_id,
      ditargetkan_tahun_ini,
      penanggung_jawab_id,
      target_waktu_dokumentasi = null,
      tipe_dokumentasi
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID rencana dokumentasi tidak valid'
      });
    }

    // Cek data rencana
    const [rencana] = await db.query(
      `
      SELECT
        id,
        perencanaan_id
      FROM mpn_rencana_dokumentasi
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rencana.length === 0) {
      return res.status(404).json({
        message: 'Rencana dokumentasi tidak ditemukan'
      });
    }

    const perencanaanId = rencana[0].perencanaan_id;

    // Validasi pengetahuan
    const pengetahuanId = Number(pengetahuan_id);

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'ID pengetahuan tidak valid'
      });
    }

    // Validasi ditargetkan tahun ini
    const ditargetkan = Number(ditargetkan_tahun_ini);

    if (![0, 1].includes(ditargetkan)) {
      return res.status(400).json({
        message: 'Ditargetkan tahun ini harus bernilai 0 atau 1'
      });
    }

    // Penanggung jawab wajib
    const penanggungJawabId = Number(penanggung_jawab_id);

    if (
      !Number.isInteger(penanggungJawabId) ||
      penanggungJawabId <= 0
    ) {
      return res.status(400).json({
        message: 'Penanggung jawab wajib diisi dan harus valid'
      });
    }

    // Validasi tipe dokumentasi
    if (
      !Array.isArray(tipe_dokumentasi) ||
      tipe_dokumentasi.length === 0
    ) {
      return res.status(400).json({
        message: 'Tipe dokumentasi wajib diisi'
      });
    }

    const tipeValid = [
      'Teks',
      'Gambar',
      'Audio',
      'Video'
    ];

    const tipeUnik = [...new Set(tipe_dokumentasi)];

    if (
      tipeUnik.some(tipe => !tipeValid.includes(tipe))
    ) {
      return res.status(400).json({
        message: 'Tipe dokumentasi tidak valid'
      });
    }

    // Cek pengetahuan
    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // Cek user penanggung jawab
    const [user] = await db.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
      [penanggungJawabId]
    );

    if (user.length === 0) {
      return res.status(400).json({
        message: 'Penanggung jawab tidak ditemukan'
      });
    }

    // Cek duplicate dalam perencanaan yang sama,
    // kecuali data yang sedang diedit
    const [duplicate] = await db.query(
      `
      SELECT id
      FROM mpn_rencana_dokumentasi
      WHERE perencanaan_id = ?
        AND pengetahuan_id = ?
        AND id <> ?
      LIMIT 1
      `,
      [
        perencanaanId,
        pengetahuanId,
        id
      ]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message: 'Pengetahuan tersebut sudah memiliki rencana dokumentasi pada perencanaan ini'
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    await connection.query(
      `
      UPDATE mpn_rencana_dokumentasi
      SET
        pengetahuan_id = ?,
        ditargetkan_tahun_ini = ?,
        penanggung_jawab_id = ?,
        target_waktu_dokumentasi = ?
      WHERE id = ?
      `,
      [
        pengetahuanId,
        ditargetkan,
        penanggungJawabId,
        target_waktu_dokumentasi || null,
        id
      ]
    );

    // Hapus tipe lama
    await connection.query(
      `
      DELETE FROM mpn_rencana_tipe_dokumentasi
      WHERE rencana_dokumentasi_id = ?
      `,
      [id]
    );

    // Simpan tipe baru
    for (const tipe of tipeUnik) {
      await connection.query(
        `
        INSERT INTO mpn_rencana_tipe_dokumentasi
        (
          rencana_dokumentasi_id,
          tipe_dokumentasi
        )
        VALUES (?, ?)
        `,
        [id, tipe]
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: 'Rencana dokumentasi berhasil diperbarui',
      data: {
        id,
        perencanaan_id: perencanaanId,
        pengetahuan_id: pengetahuanId,
        ditargetkan_tahun_ini: ditargetkan,
        penanggung_jawab_id: penanggungJawabId,
        target_waktu_dokumentasi:
          target_waktu_dokumentasi || null,
        tipe_dokumentasi: tipeUnik
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERROR UPDATE RENCANA DOKUMENTASI:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Pengetahuan tersebut sudah memiliki rencana dokumentasi pada perencanaan ini'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.deleteRencanaDokumentasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID rencana dokumentasi tidak valid'
      });
    }

    const [rencana] = await db.query(
      `
      SELECT id
      FROM mpn_rencana_dokumentasi
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rencana.length === 0) {
      return res.status(404).json({
        message: 'Rencana dokumentasi tidak ditemukan'
      });
    }

    await db.query(
      `
      DELETE FROM mpn_rencana_dokumentasi
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: 'Rencana dokumentasi berhasil dihapus'
    });

  } catch (error) {
    console.error('ERROR DELETE RENCANA DOKUMENTASI:', error);

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Rencana dokumentasi tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getAllPengumpulanPengolahan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        pp.id,
        pp.rencana_dokumentasi_id,
        pp.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        DATE_FORMAT(
          pp.tanggal_pengumpulan,
          '%Y-%m-%d'
        ) AS tanggal_pengumpulan,

        pp.unit_pengumpulan_id,
        uk.nama_unit AS unit_pengumpulan,

        pp.lokasi_penyimpanan,
        pp.keterangan_lokasi_lainnya,
        pp.status_publikasi_simpan,
        pp.metode_pengolahan,
        pp.deskripsi_pengolahan,

        pp.pengetahuan_hasil_id,
        ph.kode_pengetahuan AS kode_pengetahuan_hasil,
        ph.nama_pengetahuan AS nama_pengetahuan_hasil,

        pp.created_by,
        u.nama AS pembuat,
        pp.created_at,
        pp.updated_at

      FROM mpn_pengumpulan_pengolahan pp

      JOIN mpn_pengetahuan p
        ON p.id = pp.pengetahuan_id

      JOIN unit_kerja uk
        ON uk.id = pp.unit_pengumpulan_id

      LEFT JOIN mpn_pengetahuan ph
        ON ph.id = pp.pengetahuan_hasil_id

      JOIN users u
        ON u.id = pp.created_by

      ORDER BY pp.created_at DESC
    `);

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error(
      'ERROR GET PENGUMPULAN PENGOLAHAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createPengumpulanPengolahan = async (req, res) => {
  try {
    const {
      rencana_dokumentasi_id = null,
      pengetahuan_id,
      tanggal_pengumpulan,
      unit_pengumpulan_id,
      lokasi_penyimpanan = null,
      keterangan_lokasi_lainnya = null,
      status_publikasi_simpan = null,
      metode_pengolahan = null,
      deskripsi_pengolahan = null,
      pengetahuan_hasil_id = null
    } = req.body;

    const created_by = req.user.id;

    // =========================
    // VALIDASI FIELD WAJIB
    // =========================

    const pengetahuanId = Number(pengetahuan_id);
    const unitPengumpulanId = Number(unit_pengumpulan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    if (!tanggal_pengumpulan) {
      return res.status(400).json({
        message: 'Tanggal pengumpulan wajib diisi'
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pengumpulan)
    ) {
      return res.status(400).json({
        message: 'Format tanggal pengumpulan harus YYYY-MM-DD'
      });
    }

    if (
      !Number.isInteger(unitPengumpulanId) ||
      unitPengumpulanId <= 0
    ) {
      return res.status(400).json({
        message: 'Unit pengumpulan wajib diisi dan harus valid'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // CEK UNIT KERJA
    // =========================

    const [unit] = await db.query(
      `
      SELECT id
      FROM unit_kerja
      WHERE id = ?
      LIMIT 1
      `,
      [unitPengumpulanId]
    );

    if (unit.length === 0) {
      return res.status(400).json({
        message: 'Unit pengumpulan tidak ditemukan'
      });
    }

    // =========================
    // CEK RENCANA DOKUMENTASI
    // jika dikirim
    // =========================

    let rencanaDokumentasiId = null;

    if (
      rencana_dokumentasi_id !== null &&
      rencana_dokumentasi_id !== ''
    ) {
      rencanaDokumentasiId =
        Number(rencana_dokumentasi_id);

      if (
        !Number.isInteger(rencanaDokumentasiId) ||
        rencanaDokumentasiId <= 0
      ) {
        return res.status(400).json({
          message: 'ID rencana dokumentasi tidak valid'
        });
      }

      const [rencana] = await db.query(
        `
        SELECT
          id,
          pengetahuan_id
        FROM mpn_rencana_dokumentasi
        WHERE id = ?
        LIMIT 1
        `,
        [rencanaDokumentasiId]
      );

      if (rencana.length === 0) {
        return res.status(400).json({
          message: 'Rencana dokumentasi tidak ditemukan'
        });
      }

      // Business rule:
      // rencana harus merujuk pengetahuan yang sama
      if (
        Number(rencana[0].pengetahuan_id) !==
        pengetahuanId
      ) {
        return res.status(400).json({
          message: 'Pengetahuan tidak sesuai dengan rencana dokumentasi'
        });
      }
    }

    // =========================
    // CEK PENGETAHUAN HASIL
    // jika dikirim
    // =========================

    let pengetahuanHasilId = null;

    if (
      pengetahuan_hasil_id !== null &&
      pengetahuan_hasil_id !== ''
    ) {
      pengetahuanHasilId =
        Number(pengetahuan_hasil_id);

      if (
        !Number.isInteger(pengetahuanHasilId) ||
        pengetahuanHasilId <= 0
      ) {
        return res.status(400).json({
          message: 'ID pengetahuan hasil tidak valid'
        });
      }

      const [hasil] = await db.query(
        `
        SELECT id
        FROM mpn_pengetahuan
        WHERE id = ?
        LIMIT 1
        `,
        [pengetahuanHasilId]
      );

      if (hasil.length === 0) {
        return res.status(400).json({
          message: 'Data pengetahuan hasil tidak ditemukan'
        });
      }
    }

    // =========================
    // VALIDASI PANJANG VARCHAR
    // =========================

    if (
      lokasi_penyimpanan &&
      lokasi_penyimpanan.length > 255
    ) {
      return res.status(400).json({
        message: 'Lokasi penyimpanan maksimal 255 karakter'
      });
    }

    if (
      status_publikasi_simpan &&
      status_publikasi_simpan.length > 100
    ) {
      return res.status(400).json({
        message: 'Status publikasi/simpan maksimal 100 karakter'
      });
    }

    if (
      metode_pengolahan &&
      metode_pengolahan.length > 150
    ) {
      return res.status(400).json({
        message: 'Metode pengolahan maksimal 150 karakter'
      });
    }

    // =========================
    // INSERT
    // =========================

    const [result] = await db.query(
      `
      INSERT INTO mpn_pengumpulan_pengolahan
      (
        rencana_dokumentasi_id,
        pengetahuan_id,
        tanggal_pengumpulan,
        unit_pengumpulan_id,
        lokasi_penyimpanan,
        keterangan_lokasi_lainnya,
        status_publikasi_simpan,
        metode_pengolahan,
        deskripsi_pengolahan,
        pengetahuan_hasil_id,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        rencanaDokumentasiId,
        pengetahuanId,
        tanggal_pengumpulan,
        unitPengumpulanId,
        lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya || null,
        status_publikasi_simpan || null,
        metode_pengolahan || null,
        deskripsi_pengolahan || null,
        pengetahuanHasilId,
        created_by
      ]
    );

    return res.status(201).json({
      message: 'Data pengumpulan dan pengolahan berhasil disimpan',
      data: {
        id: result.insertId,
        rencana_dokumentasi_id: rencanaDokumentasiId,
        pengetahuan_id: pengetahuanId,
        tanggal_pengumpulan,
        unit_pengumpulan_id: unitPengumpulanId,
        lokasi_penyimpanan:
          lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya:
          keterangan_lokasi_lainnya || null,
        status_publikasi_simpan:
          status_publikasi_simpan || null,
        metode_pengolahan:
          metode_pengolahan || null,
        deskripsi_pengolahan:
          deskripsi_pengolahan || null,
        pengetahuan_hasil_id: pengetahuanHasilId,
        created_by
      }
    });

  } catch (error) {
    console.error(
      'ERROR CREATE PENGUMPULAN PENGOLAHAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getDetailPengumpulanPengolahan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pengumpulan dan pengolahan tidak valid'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        pp.id,
        pp.rencana_dokumentasi_id,

        pp.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        DATE_FORMAT(
          pp.tanggal_pengumpulan,
          '%Y-%m-%d'
        ) AS tanggal_pengumpulan,

        pp.unit_pengumpulan_id,
        uk.nama_unit AS unit_pengumpulan,

        pp.lokasi_penyimpanan,
        pp.keterangan_lokasi_lainnya,
        pp.status_publikasi_simpan,
        pp.metode_pengolahan,
        pp.deskripsi_pengolahan,

        pp.pengetahuan_hasil_id,
        ph.kode_pengetahuan AS kode_pengetahuan_hasil,
        ph.nama_pengetahuan AS nama_pengetahuan_hasil,

        pp.created_by,
        u.nama AS pembuat,
        pp.created_at,
        pp.updated_at

      FROM mpn_pengumpulan_pengolahan pp

      JOIN mpn_pengetahuan p
        ON p.id = pp.pengetahuan_id

      JOIN unit_kerja uk
        ON uk.id = pp.unit_pengumpulan_id

      LEFT JOIN mpn_pengetahuan ph
        ON ph.id = pp.pengetahuan_hasil_id

      JOIN users u
        ON u.id = pp.created_by

      WHERE pp.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data pengumpulan dan pengolahan tidak ditemukan'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });

  } catch (error) {
    console.error(
      'ERROR GET DETAIL PENGUMPULAN PENGOLAHAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.updatePengumpulanPengolahan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      rencana_dokumentasi_id = null,
      pengetahuan_id,
      tanggal_pengumpulan,
      unit_pengumpulan_id,
      lokasi_penyimpanan = null,
      keterangan_lokasi_lainnya = null,
      status_publikasi_simpan = null,
      metode_pengolahan = null,
      deskripsi_pengolahan = null,
      pengetahuan_hasil_id = null
    } = req.body;

    // =========================
    // CEK ID
    // =========================

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pengumpulan dan pengolahan tidak valid'
      });
    }

    const [existingData] = await db.query(
      `
      SELECT id
      FROM mpn_pengumpulan_pengolahan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingData.length === 0) {
      return res.status(404).json({
        message: 'Data pengumpulan dan pengolahan tidak ditemukan'
      });
    }

    // =========================
    // VALIDASI FIELD WAJIB
    // =========================

    const pengetahuanId = Number(pengetahuan_id);
    const unitPengumpulanId = Number(unit_pengumpulan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    if (!tanggal_pengumpulan) {
      return res.status(400).json({
        message: 'Tanggal pengumpulan wajib diisi'
      });
    }

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pengumpulan)
    ) {
      return res.status(400).json({
        message: 'Format tanggal pengumpulan harus YYYY-MM-DD'
      });
    }

    if (
      !Number.isInteger(unitPengumpulanId) ||
      unitPengumpulanId <= 0
    ) {
      return res.status(400).json({
        message: 'Unit pengumpulan wajib diisi dan harus valid'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // CEK UNIT KERJA
    // =========================

    const [unit] = await db.query(
      `
      SELECT id
      FROM unit_kerja
      WHERE id = ?
      LIMIT 1
      `,
      [unitPengumpulanId]
    );

    if (unit.length === 0) {
      return res.status(400).json({
        message: 'Unit pengumpulan tidak ditemukan'
      });
    }

    // =========================
    // CEK RENCANA DOKUMENTASI
    // =========================

    let rencanaDokumentasiId = null;

    if (
      rencana_dokumentasi_id !== null &&
      rencana_dokumentasi_id !== ''
    ) {
      rencanaDokumentasiId =
        Number(rencana_dokumentasi_id);

      if (
        !Number.isInteger(rencanaDokumentasiId) ||
        rencanaDokumentasiId <= 0
      ) {
        return res.status(400).json({
          message: 'ID rencana dokumentasi tidak valid'
        });
      }

      const [rencana] = await db.query(
        `
        SELECT
          id,
          pengetahuan_id
        FROM mpn_rencana_dokumentasi
        WHERE id = ?
        LIMIT 1
        `,
        [rencanaDokumentasiId]
      );

      if (rencana.length === 0) {
        return res.status(400).json({
          message: 'Rencana dokumentasi tidak ditemukan'
        });
      }

      if (
        Number(rencana[0].pengetahuan_id) !==
        pengetahuanId
      ) {
        return res.status(400).json({
          message: 'Pengetahuan tidak sesuai dengan rencana dokumentasi'
        });
      }
    }

    // =========================
    // CEK PENGETAHUAN HASIL
    // =========================

    let pengetahuanHasilId = null;

    if (
      pengetahuan_hasil_id !== null &&
      pengetahuan_hasil_id !== ''
    ) {
      pengetahuanHasilId =
        Number(pengetahuan_hasil_id);

      if (
        !Number.isInteger(pengetahuanHasilId) ||
        pengetahuanHasilId <= 0
      ) {
        return res.status(400).json({
          message: 'ID pengetahuan hasil tidak valid'
        });
      }

      const [hasil] = await db.query(
        `
        SELECT id
        FROM mpn_pengetahuan
        WHERE id = ?
        LIMIT 1
        `,
        [pengetahuanHasilId]
      );

      if (hasil.length === 0) {
        return res.status(400).json({
          message: 'Data pengetahuan hasil tidak ditemukan'
        });
      }
    }

    // =========================
    // VALIDASI PANJANG FIELD
    // =========================

    if (
      lokasi_penyimpanan &&
      lokasi_penyimpanan.length > 255
    ) {
      return res.status(400).json({
        message: 'Lokasi penyimpanan maksimal 255 karakter'
      });
    }

    if (
      status_publikasi_simpan &&
      status_publikasi_simpan.length > 100
    ) {
      return res.status(400).json({
        message: 'Status publikasi/simpan maksimal 100 karakter'
      });
    }

    if (
      metode_pengolahan &&
      metode_pengolahan.length > 150
    ) {
      return res.status(400).json({
        message: 'Metode pengolahan maksimal 150 karakter'
      });
    }

    // =========================
    // UPDATE
    // =========================

    await db.query(
      `
      UPDATE mpn_pengumpulan_pengolahan
      SET
        rencana_dokumentasi_id = ?,
        pengetahuan_id = ?,
        tanggal_pengumpulan = ?,
        unit_pengumpulan_id = ?,
        lokasi_penyimpanan = ?,
        keterangan_lokasi_lainnya = ?,
        status_publikasi_simpan = ?,
        metode_pengolahan = ?,
        deskripsi_pengolahan = ?,
        pengetahuan_hasil_id = ?
      WHERE id = ?
      `,
      [
        rencanaDokumentasiId,
        pengetahuanId,
        tanggal_pengumpulan,
        unitPengumpulanId,
        lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya || null,
        status_publikasi_simpan || null,
        metode_pengolahan || null,
        deskripsi_pengolahan || null,
        pengetahuanHasilId,
        id
      ]
    );

    return res.status(200).json({
      message: 'Data pengumpulan dan pengolahan berhasil diperbarui',
      data: {
        id,
        rencana_dokumentasi_id: rencanaDokumentasiId,
        pengetahuan_id: pengetahuanId,
        tanggal_pengumpulan,
        unit_pengumpulan_id: unitPengumpulanId,
        lokasi_penyimpanan:
          lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya:
          keterangan_lokasi_lainnya || null,
        status_publikasi_simpan:
          status_publikasi_simpan || null,
        metode_pengolahan:
          metode_pengolahan || null,
        deskripsi_pengolahan:
          deskripsi_pengolahan || null,
        pengetahuan_hasil_id: pengetahuanHasilId
      }
    });

  } catch (error) {
    console.error(
      'ERROR UPDATE PENGUMPULAN PENGOLAHAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.deletePengumpulanPengolahan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pengumpulan dan pengolahan tidak valid'
      });
    }

    const [data] = await db.query(
      `
      SELECT id
      FROM mpn_pengumpulan_pengolahan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (data.length === 0) {
      return res.status(404).json({
        message: 'Data pengumpulan dan pengolahan tidak ditemukan'
      });
    }

    await db.query(
      `
      DELETE FROM mpn_pengumpulan_pengolahan
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: 'Data pengumpulan dan pengolahan berhasil dihapus'
    });

  } catch (error) {
    console.error(
      'ERROR DELETE PENGUMPULAN PENGOLAHAN:',
      error
    );

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Data tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getAllDokumentasi = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        d.id,
        d.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        d.pengumpulan_pengolahan_id,

        d.nama_dokumentasi,
        d.tipe_dokumentasi,
        d.konten_teks,

        d.nama_file,
        d.file_path,
        d.mime_type,

        d.uploaded_by,
        u.nama AS pengunggah,

        d.created_at,
        d.updated_at

      FROM mpn_dokumentasi d

      JOIN mpn_pengetahuan p
        ON p.id = d.pengetahuan_id

      LEFT JOIN mpn_pengumpulan_pengolahan pp
        ON pp.id = d.pengumpulan_pengolahan_id

      JOIN users u
        ON u.id = d.uploaded_by

      ORDER BY d.created_at DESC
    `);

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error(
      'ERROR GET DOKUMENTASI PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createDokumentasiTeks = async (req, res) => {
  let connection;

  try {
    const {
      pengetahuan_id,
      pengumpulan_pengolahan_id = null,
      nama_dokumentasi,
      konten_teks
    } = req.body;

    const uploaded_by = req.user.id;

    // =========================
    // VALIDASI PENGETAHUAN
    // =========================

    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    // =========================
    // VALIDASI NAMA DOKUMENTASI
    // =========================

    if (
      typeof nama_dokumentasi !== 'string' ||
      nama_dokumentasi.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Nama dokumentasi wajib diisi'
      });
    }

    if (nama_dokumentasi.trim().length > 200) {
      return res.status(400).json({
        message: 'Nama dokumentasi maksimal 200 karakter'
      });
    }

    // =========================
    // VALIDASI KONTEN TEKS
    // =========================

    if (
      typeof konten_teks !== 'string' ||
      konten_teks.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Konten teks wajib diisi'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // CEK PENGUMPULAN PENGOLAHAN
    // jika diisi
    // =========================

    let pengumpulanPengolahanId = null;

    if (
      pengumpulan_pengolahan_id !== null &&
      pengumpulan_pengolahan_id !== ''
    ) {
      pengumpulanPengolahanId =
        Number(pengumpulan_pengolahan_id);

      if (
        !Number.isInteger(pengumpulanPengolahanId) ||
        pengumpulanPengolahanId <= 0
      ) {
        return res.status(400).json({
          message: 'ID pengumpulan dan pengolahan tidak valid'
        });
      }

      const [pengumpulan] = await db.query(
        `
        SELECT
          id,
          pengetahuan_id
        FROM mpn_pengumpulan_pengolahan
        WHERE id = ?
        LIMIT 1
        `,
        [pengumpulanPengolahanId]
      );

      if (pengumpulan.length === 0) {
        return res.status(400).json({
          message: 'Data pengumpulan dan pengolahan tidak ditemukan'
        });
      }

      // Supaya relasi tidak nyambung ke pengetahuan yang berbeda
      if (
        Number(pengumpulan[0].pengetahuan_id) !==
        pengetahuanId
      ) {
        return res.status(400).json({
          message: 'Pengetahuan tidak sesuai dengan data pengumpulan dan pengolahan'
        });
      }
    }

    // =========================
    // TRANSACTION
    // =========================

    connection = await db.getConnection();

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO mpn_dokumentasi
      (
        pengetahuan_id,
        pengumpulan_pengolahan_id,
        nama_dokumentasi,
        tipe_dokumentasi,
        konten_teks,
        nama_file,
        file_path,
        mime_type,
        uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        pengetahuanId,
        pengumpulanPengolahanId,
        nama_dokumentasi.trim(),
        'Teks',
        konten_teks.trim(),
        null,
        null,
        null,
        uploaded_by
      ]
    );

    // Karena sekarang sudah benar-benar punya dokumentasi
    await connection.query(
      `
      UPDATE mpn_pengetahuan
      SET sudah_terdokumentasi = 1
      WHERE id = ?
      `,
      [pengetahuanId]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Dokumentasi pengetahuan berhasil disimpan',
      data: {
        id: result.insertId,
        pengetahuan_id: pengetahuanId,
        pengumpulan_pengolahan_id:
          pengumpulanPengolahanId,
        nama_dokumentasi: nama_dokumentasi.trim(),
        tipe_dokumentasi: 'Teks',
        konten_teks: konten_teks.trim(),
        uploaded_by
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      'ERROR CREATE DOKUMENTASI TEKS:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getDetailDokumentasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID dokumentasi tidak valid'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        d.id,
        d.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        d.pengumpulan_pengolahan_id,

        d.nama_dokumentasi,
        d.tipe_dokumentasi,
        d.konten_teks,

        d.nama_file,
        d.file_path,
        d.mime_type,

        d.uploaded_by,
        u.nama AS pengunggah,

        d.created_at,
        d.updated_at

      FROM mpn_dokumentasi d

      JOIN mpn_pengetahuan p
        ON p.id = d.pengetahuan_id

      JOIN users u
        ON u.id = d.uploaded_by

      WHERE d.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Dokumentasi pengetahuan tidak ditemukan'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });

  } catch (error) {
    console.error(
      'ERROR GET DETAIL DOKUMENTASI:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.updateDokumentasiTeks = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      pengetahuan_id,
      pengumpulan_pengolahan_id = null,
      nama_dokumentasi,
      konten_teks
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID dokumentasi tidak valid'
      });
    }

    // =========================
    // CEK DOKUMENTASI
    // =========================

    const [dokumentasi] = await db.query(
      `
      SELECT
        id,
        tipe_dokumentasi
      FROM mpn_dokumentasi
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (dokumentasi.length === 0) {
      return res.status(404).json({
        message: 'Dokumentasi pengetahuan tidak ditemukan'
      });
    }

    if (dokumentasi[0].tipe_dokumentasi !== 'Teks') {
      return res.status(400).json({
        message: 'Endpoint ini hanya untuk dokumentasi teks'
      });
    }

    // =========================
    // VALIDASI PENGETAHUAN
    // =========================

    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    if (
      typeof nama_dokumentasi !== 'string' ||
      nama_dokumentasi.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Nama dokumentasi wajib diisi'
      });
    }

    if (nama_dokumentasi.trim().length > 200) {
      return res.status(400).json({
        message: 'Nama dokumentasi maksimal 200 karakter'
      });
    }

    if (
      typeof konten_teks !== 'string' ||
      konten_teks.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Konten teks wajib diisi'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // CEK PENGUMPULAN
    // =========================

    let pengumpulanPengolahanId = null;

    if (
      pengumpulan_pengolahan_id !== null &&
      pengumpulan_pengolahan_id !== ''
    ) {
      pengumpulanPengolahanId =
        Number(pengumpulan_pengolahan_id);

      if (
        !Number.isInteger(pengumpulanPengolahanId) ||
        pengumpulanPengolahanId <= 0
      ) {
        return res.status(400).json({
          message: 'ID pengumpulan dan pengolahan tidak valid'
        });
      }

      const [pengumpulan] = await db.query(
        `
        SELECT
          id,
          pengetahuan_id
        FROM mpn_pengumpulan_pengolahan
        WHERE id = ?
        LIMIT 1
        `,
        [pengumpulanPengolahanId]
      );

      if (pengumpulan.length === 0) {
        return res.status(400).json({
          message: 'Data pengumpulan dan pengolahan tidak ditemukan'
        });
      }

      if (
        Number(pengumpulan[0].pengetahuan_id) !==
        pengetahuanId
      ) {
        return res.status(400).json({
          message: 'Pengetahuan tidak sesuai dengan data pengumpulan dan pengolahan'
        });
      }
    }

    // =========================
    // UPDATE
    // =========================

    await db.query(
      `
      UPDATE mpn_dokumentasi
      SET
        pengetahuan_id = ?,
        pengumpulan_pengolahan_id = ?,
        nama_dokumentasi = ?,
        konten_teks = ?
      WHERE id = ?
      `,
      [
        pengetahuanId,
        pengumpulanPengolahanId,
        nama_dokumentasi.trim(),
        konten_teks.trim(),
        id
      ]
    );

    return res.status(200).json({
      message: 'Dokumentasi pengetahuan berhasil diperbarui',
      data: {
        id,
        pengetahuan_id: pengetahuanId,
        pengumpulan_pengolahan_id:
          pengumpulanPengolahanId,
        nama_dokumentasi:
          nama_dokumentasi.trim(),
        tipe_dokumentasi: 'Teks',
        konten_teks: konten_teks.trim()
      }
    });

  } catch (error) {
    console.error(
      'ERROR UPDATE DOKUMENTASI TEKS:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.deleteDokumentasi = async (req, res) => {
  let connection;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID dokumentasi tidak valid'
      });
    }

    const [dokumentasi] = await db.query(
      `
      SELECT
        id,
        pengetahuan_id
      FROM mpn_dokumentasi
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (dokumentasi.length === 0) {
      return res.status(404).json({
        message: 'Dokumentasi pengetahuan tidak ditemukan'
      });
    }

    const pengetahuanId =
      dokumentasi[0].pengetahuan_id;

    connection = await db.getConnection();

    await connection.beginTransaction();

    // Hapus dokumentasi
    await connection.query(
      `
      DELETE FROM mpn_dokumentasi
      WHERE id = ?
      `,
      [id]
    );

    // Hitung dokumentasi lain milik pengetahuan tersebut
    const [sisaDokumentasi] = await connection.query(
      `
      SELECT COUNT(*) AS total
      FROM mpn_dokumentasi
      WHERE pengetahuan_id = ?
      `,
      [pengetahuanId]
    );

    // Jika sudah tidak punya dokumentasi lagi
    if (Number(sisaDokumentasi[0].total) === 0) {
      await connection.query(
        `
        UPDATE mpn_pengetahuan
        SET sudah_terdokumentasi = 0
        WHERE id = ?
        `,
        [pengetahuanId]
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: 'Dokumentasi pengetahuan berhasil dihapus'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      'ERROR DELETE DOKUMENTASI:',
      error
    );

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Dokumentasi tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.createDokumentasiFile = async (req, res) => {


  let connection;
  let finalPath = null;

  const hapusTempFile = () => {
    if (
      req.file &&
      req.file.path &&
      fs.existsSync(req.file.path)
    ) {
      fs.unlinkSync(req.file.path);
    }
  };

  try {
    const {
      pengetahuan_id,
      pengumpulan_pengolahan_id = null,
      nama_dokumentasi
    } = req.body;

    const uploaded_by = req.user.id;

    // =========================
    // FILE WAJIB
    // =========================

    if (!req.file) {
      return res.status(400).json({
        message: 'File dokumentasi wajib diunggah'
      });
    }

    // =========================
    // PENGETAHUAN
    // =========================

    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      hapusTempFile();

      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    // =========================
    // NAMA DOKUMENTASI
    // =========================

    if (
      typeof nama_dokumentasi !== 'string' ||
      nama_dokumentasi.trim() === ''
    ) {
      hapusTempFile();

      return res.status(400).json({
        message: 'Nama dokumentasi wajib diisi'
      });
    }

    if (nama_dokumentasi.trim().length > 200) {
      hapusTempFile();

      return res.status(400).json({
        message: 'Nama dokumentasi maksimal 200 karakter'
      });
    }

    // =========================
    // TENTUKAN TIPE DARI MIME
    // =========================

    let tipeDokumentasi;

    if (req.file.mimetype.startsWith('image/')) {
      tipeDokumentasi = 'Gambar';
    } else if (req.file.mimetype.startsWith('audio/')) {
      tipeDokumentasi = 'Audio';
    } else if (req.file.mimetype.startsWith('video/')) {
      tipeDokumentasi = 'Video';
    } else {
      hapusTempFile();

      return res.status(400).json({
        message: 'Tipe dokumentasi tidak didukung'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      hapusTempFile();

      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // CEK PENGUMPULAN
    // =========================

    let pengumpulanPengolahanId = null;

    if (
      pengumpulan_pengolahan_id !== null &&
      pengumpulan_pengolahan_id !== ''
    ) {
      pengumpulanPengolahanId =
        Number(pengumpulan_pengolahan_id);

      if (
        !Number.isInteger(pengumpulanPengolahanId) ||
        pengumpulanPengolahanId <= 0
      ) {
        hapusTempFile();

        return res.status(400).json({
          message: 'ID pengumpulan dan pengolahan tidak valid'
        });
      }

      const [pengumpulan] = await db.query(
        `
        SELECT
          id,
          pengetahuan_id
        FROM mpn_pengumpulan_pengolahan
        WHERE id = ?
        LIMIT 1
        `,
        [pengumpulanPengolahanId]
      );

      if (pengumpulan.length === 0) {
        hapusTempFile();

        return res.status(400).json({
          message: 'Data pengumpulan dan pengolahan tidak ditemukan'
        });
      }

      if (
        Number(pengumpulan[0].pengetahuan_id) !==
        pengetahuanId
      ) {
        hapusTempFile();

        return res.status(400).json({
          message:
            'Pengetahuan tidak sesuai dengan data pengumpulan dan pengolahan'
        });
      }
    }

    // =========================
    // PINDAHKAN DARI TEMP
    // KE PRIVATE STORAGE
    // =========================

    const finalDir = path.join(
      process.cwd(),
      'storage',
      'pengetahuan',
      'files'
    );

    fs.mkdirSync(finalDir, {
      recursive: true
    });

    finalPath = path.join(
      finalDir,
      req.file.filename
    );

    fs.renameSync(
      req.file.path,
      finalPath
    );

    // Simpan relative path, bukan absolute Windows path
    const relativePath = path
      .relative(process.cwd(), finalPath)
      .replace(/\\/g, '/');

    // =========================
    // DATABASE TRANSACTION
    // =========================

    connection = await db.getConnection();

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO mpn_dokumentasi
      (
        pengetahuan_id,
        pengumpulan_pengolahan_id,
        nama_dokumentasi,
        tipe_dokumentasi,
        konten_teks,
        nama_file,
        file_path,
        mime_type,
        uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        pengetahuanId,
        pengumpulanPengolahanId,
        nama_dokumentasi.trim(),
        tipeDokumentasi,
        null,
        req.file.originalname,
        relativePath,
        req.file.mimetype,
        uploaded_by
      ]
    );

    await connection.query(
      `
      UPDATE mpn_pengetahuan
      SET sudah_terdokumentasi = 1
      WHERE id = ?
      `,
      [pengetahuanId]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'File dokumentasi berhasil diunggah',

      data: {
        id: result.insertId,
        pengetahuan_id: pengetahuanId,
        pengumpulan_pengolahan_id:
          pengumpulanPengolahanId,
        nama_dokumentasi:
          nama_dokumentasi.trim(),
        tipe_dokumentasi:
          tipeDokumentasi,
        nama_file:
          req.file.originalname,
        mime_type:
          req.file.mimetype,
        uploaded_by
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    // Kalau file sudah sempat pindah tetapi DB gagal
    if (
      finalPath &&
      fs.existsSync(finalPath)
    ) {
      fs.unlinkSync(finalPath);
    }

    hapusTempFile();

    console.error(
      'ERROR CREATE DOKUMENTASI FILE:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getFileDokumentasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID dokumentasi tidak valid'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        id,
        nama_file,
        file_path,
        mime_type
      FROM mpn_dokumentasi
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Dokumentasi pengetahuan tidak ditemukan'
      });
    }

    const dokumentasi = rows[0];

    if (!dokumentasi.file_path) {
      return res.status(400).json({
        message: 'Dokumentasi ini tidak memiliki file'
      });
    }

    const baseDir = path.resolve(
      process.cwd(),
      'storage',
      'pengetahuan',
      'files'
    );

    const filePath = path.resolve(
      process.cwd(),
      dokumentasi.file_path
    );

    if (!filePath.startsWith(baseDir + path.sep)) {
      return res.status(400).json({
        message: 'Path file tidak valid'
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File dokumentasi tidak ditemukan di penyimpanan'
      });
    }

    if (dokumentasi.mime_type) {
      res.type(dokumentasi.mime_type);
    }
    res.setHeader(
  'Cache-Control',
  'private, no-store, max-age=0'
);

    return res.sendFile(filePath);

  } catch (error) {
    console.error(
      'ERROR GET FILE DOKUMENTASI:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getAllPemanfaatan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        pm.id,
        pm.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        DATE_FORMAT(
          pm.tanggal_pemanfaatan,
          '%Y-%m-%d'
        ) AS tanggal_pemanfaatan,

        pm.jenis_pengguna,

        pm.unit_pengguna_id,
        uk.nama_unit AS unit_pengguna,

        pm.tujuan_pemanfaatan,
        pm.rating_pengetahuan,

        pm.created_by,
        u.nama AS pembuat,

        pm.created_at,
        pm.updated_at

      FROM mpn_pemanfaatan pm

      JOIN mpn_pengetahuan p
        ON p.id = pm.pengetahuan_id

      LEFT JOIN unit_kerja uk
        ON uk.id = pm.unit_pengguna_id

      JOIN users u
        ON u.id = pm.created_by

      ORDER BY pm.created_at DESC
    `);

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error(
      'ERROR GET PEMANFAATAN PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createPemanfaatan = async (req, res) => {
  try {
    const {
      pengetahuan_id,
      tanggal_pemanfaatan,
      jenis_pengguna,
      unit_pengguna_id = null,
      tujuan_pemanfaatan,
      rating_pengetahuan = null
    } = req.body;

    const created_by = req.user.id;

    // =========================
    // VALIDASI PENGETAHUAN
    // =========================

    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    // =========================
    // VALIDASI TANGGAL
    // =========================

    if (
      typeof tanggal_pemanfaatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pemanfaatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal pemanfaatan wajib menggunakan format YYYY-MM-DD'
      });
    }

    // =========================
    // VALIDASI JENIS PENGGUNA
    // =========================

    const jenisPenggunaValid = [
      'Publik',
      'Internal'
    ];

    if (!jenisPenggunaValid.includes(jenis_pengguna)) {
      return res.status(400).json({
        message: 'Jenis pengguna harus Publik atau Internal'
      });
    }

    // =========================
    // VALIDASI TUJUAN
    // =========================

    if (
      typeof tujuan_pemanfaatan !== 'string' ||
      tujuan_pemanfaatan.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Tujuan pemanfaatan wajib diisi'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // VALIDASI UNIT PENGGUNA
    // unit boleh NULL
    // =========================

    let unitPenggunaId = null;

    if (
      unit_pengguna_id !== null &&
      unit_pengguna_id !== ''
    ) {
      unitPenggunaId = Number(unit_pengguna_id);

      if (
        !Number.isInteger(unitPenggunaId) ||
        unitPenggunaId <= 0
      ) {
        return res.status(400).json({
          message: 'ID unit pengguna tidak valid'
        });
      }

      const [unit] = await db.query(
        `
        SELECT id
        FROM unit_kerja
        WHERE id = ?
        LIMIT 1
        `,
        [unitPenggunaId]
      );

      if (unit.length === 0) {
        return res.status(400).json({
          message: 'Unit pengguna tidak ditemukan'
        });
      }
    }

    // =========================
    // VALIDASI RATING
    // DB: NULL atau 1-5
    // =========================

    let ratingPengetahuan = null;

    if (
      rating_pengetahuan !== null &&
      rating_pengetahuan !== ''
    ) {
      ratingPengetahuan =
        Number(rating_pengetahuan);

      if (
        !Number.isInteger(ratingPengetahuan) ||
        ratingPengetahuan < 1 ||
        ratingPengetahuan > 5
      ) {
        return res.status(400).json({
          message: 'Rating pengetahuan harus bernilai 1 sampai 5'
        });
      }
    }

    // =========================
    // INSERT
    // =========================

    const [result] = await db.query(
      `
      INSERT INTO mpn_pemanfaatan
      (
        pengetahuan_id,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unit_pengguna_id,
        tujuan_pemanfaatan,
        rating_pengetahuan,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        pengetahuanId,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unitPenggunaId,
        tujuan_pemanfaatan.trim(),
        ratingPengetahuan,
        created_by
      ]
    );

    return res.status(201).json({
      message: 'Data pemanfaatan pengetahuan berhasil disimpan',
      data: {
        id: result.insertId,
        pengetahuan_id: pengetahuanId,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unit_pengguna_id: unitPenggunaId,
        tujuan_pemanfaatan:
          tujuan_pemanfaatan.trim(),
        rating_pengetahuan:
          ratingPengetahuan,
        created_by
      }
    });

  } catch (error) {
    console.error(
      'ERROR CREATE PEMANFAATAN PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getDetailPemanfaatan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pemanfaatan tidak valid'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        pm.id,
        pm.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        DATE_FORMAT(
          pm.tanggal_pemanfaatan,
          '%Y-%m-%d'
        ) AS tanggal_pemanfaatan,

        pm.jenis_pengguna,

        pm.unit_pengguna_id,
        uk.nama_unit AS unit_pengguna,

        pm.tujuan_pemanfaatan,
        pm.rating_pengetahuan,

        pm.created_by,
        u.nama AS pembuat,

        pm.created_at,
        pm.updated_at

      FROM mpn_pemanfaatan pm

      JOIN mpn_pengetahuan p
        ON p.id = pm.pengetahuan_id

      LEFT JOIN unit_kerja uk
        ON uk.id = pm.unit_pengguna_id

      JOIN users u
        ON u.id = pm.created_by

      WHERE pm.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data pemanfaatan pengetahuan tidak ditemukan'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });

  } catch (error) {
    console.error(
      'ERROR GET DETAIL PEMANFAATAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.updatePemanfaatan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      pengetahuan_id,
      tanggal_pemanfaatan,
      jenis_pengguna,
      unit_pengguna_id = null,
      tujuan_pemanfaatan,
      rating_pengetahuan = null
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pemanfaatan tidak valid'
      });
    }

    // Cek data
    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_pemanfaatan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Data pemanfaatan pengetahuan tidak ditemukan'
      });
    }

    // Pengetahuan
    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    // Tanggal
    if (
      typeof tanggal_pemanfaatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pemanfaatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal pemanfaatan wajib menggunakan format YYYY-MM-DD'
      });
    }

    // Jenis pengguna
    if (
      !['Publik', 'Internal'].includes(jenis_pengguna)
    ) {
      return res.status(400).json({
        message: 'Jenis pengguna harus Publik atau Internal'
      });
    }

    // Tujuan
    if (
      typeof tujuan_pemanfaatan !== 'string' ||
      tujuan_pemanfaatan.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Tujuan pemanfaatan wajib diisi'
      });
    }

    // Cek pengetahuan
    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // Unit pengguna boleh NULL
    let unitPenggunaId = null;

    if (
      unit_pengguna_id !== null &&
      unit_pengguna_id !== ''
    ) {
      unitPenggunaId = Number(unit_pengguna_id);

      if (
        !Number.isInteger(unitPenggunaId) ||
        unitPenggunaId <= 0
      ) {
        return res.status(400).json({
          message: 'ID unit pengguna tidak valid'
        });
      }

      const [unit] = await db.query(
        `
        SELECT id
        FROM unit_kerja
        WHERE id = ?
        LIMIT 1
        `,
        [unitPenggunaId]
      );

      if (unit.length === 0) {
        return res.status(400).json({
          message: 'Unit pengguna tidak ditemukan'
        });
      }
    }

    // Rating NULL atau 1-5
    let ratingPengetahuan = null;

    if (
      rating_pengetahuan !== null &&
      rating_pengetahuan !== ''
    ) {
      ratingPengetahuan =
        Number(rating_pengetahuan);

      if (
        !Number.isInteger(ratingPengetahuan) ||
        ratingPengetahuan < 1 ||
        ratingPengetahuan > 5
      ) {
        return res.status(400).json({
          message: 'Rating pengetahuan harus bernilai 1 sampai 5'
        });
      }
    }

    await db.query(
      `
      UPDATE mpn_pemanfaatan
      SET
        pengetahuan_id = ?,
        tanggal_pemanfaatan = ?,
        jenis_pengguna = ?,
        unit_pengguna_id = ?,
        tujuan_pemanfaatan = ?,
        rating_pengetahuan = ?
      WHERE id = ?
      `,
      [
        pengetahuanId,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unitPenggunaId,
        tujuan_pemanfaatan.trim(),
        ratingPengetahuan,
        id
      ]
    );

    return res.status(200).json({
      message: 'Data pemanfaatan pengetahuan berhasil diperbarui',
      data: {
        id,
        pengetahuan_id: pengetahuanId,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unit_pengguna_id: unitPenggunaId,
        tujuan_pemanfaatan:
          tujuan_pemanfaatan.trim(),
        rating_pengetahuan:
          ratingPengetahuan
      }
    });

  } catch (error) {
    console.error(
      'ERROR UPDATE PEMANFAATAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.deletePemanfaatan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pemanfaatan tidak valid'
      });
    }

    const [data] = await db.query(
      `
      SELECT id
      FROM mpn_pemanfaatan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (data.length === 0) {
      return res.status(404).json({
        message: 'Data pemanfaatan pengetahuan tidak ditemukan'
      });
    }

    await db.query(
      `
      DELETE FROM mpn_pemanfaatan
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: 'Data pemanfaatan pengetahuan berhasil dihapus'
    });

  } catch (error) {
    console.error(
      'ERROR DELETE PEMANFAATAN:',
      error
    );

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Data pemanfaatan tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getAllAlihPengetahuan = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        ap.id,
        ap.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        DATE_FORMAT(
          ap.tanggal_kegiatan,
          '%Y-%m-%d'
        ) AS tanggal_kegiatan,

        ap.penerima_pengetahuan,
        ap.lesson_learned_evaluasi,

        ap.created_by,
        u.nama AS pembuat,

        ap.created_at,
        ap.updated_at

      FROM mpn_alih_pengetahuan ap

      JOIN mpn_pengetahuan p
        ON p.id = ap.pengetahuan_id

      JOIN users u
        ON u.id = ap.created_by

      ORDER BY ap.created_at DESC
    `);

    // Ambil metode untuk masing-masing kegiatan alih
    for (const row of rows) {
      const [metode] = await db.query(
        `
        SELECT
          id,
          metode,
          keterangan,
          created_at
        FROM mpn_metode_alih
        WHERE alih_pengetahuan_id = ?
        ORDER BY id ASC
        `,
        [row.id]
      );

      row.metode_alih = metode;
    }

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error(
      'ERROR GET ALIH PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createAlihPengetahuan = async (req, res) => {
  let connection;

  try {
    const {
      pengetahuan_id,
      tanggal_kegiatan,
      penerima_pengetahuan,
      lesson_learned_evaluasi = null,
      metode_alih = []
    } = req.body;

    const created_by = req.user.id;

    // =========================
    // VALIDASI PENGETAHUAN
    // =========================

    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    // =========================
    // VALIDASI TANGGAL
    // =========================

    if (
      typeof tanggal_kegiatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_kegiatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal kegiatan wajib menggunakan format YYYY-MM-DD'
      });
    }

    // =========================
    // VALIDASI PENERIMA
    // =========================

    if (
      typeof penerima_pengetahuan !== 'string' ||
      penerima_pengetahuan.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Penerima pengetahuan wajib diisi'
      });
    }

    if (penerima_pengetahuan.trim().length > 255) {
      return res.status(400).json({
        message: 'Penerima pengetahuan maksimal 255 karakter'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // VALIDASI METODE ALIH
    // =========================

    if (!Array.isArray(metode_alih)) {
      return res.status(400).json({
        message: 'Metode alih harus berupa array'
      });
    }

    const metodeValid = [
      'Pelatihan',
      'Workshop',
      'Sosialisasi',
      'Mentoring',
      'Sharing',
      'Lainnya'
    ];

    for (const item of metode_alih) {
      if (
        !item ||
        typeof item !== 'object' ||
        !metodeValid.includes(item.metode)
      ) {
        return res.status(400).json({
          message: 'Metode alih tidak valid'
        });
      }
    }

    // =========================
    // TRANSACTION
    // =========================

    connection = await db.getConnection();

    await connection.beginTransaction();

    const [result] = await connection.query(
      `
      INSERT INTO mpn_alih_pengetahuan
      (
        pengetahuan_id,
        tanggal_kegiatan,
        penerima_pengetahuan,
        lesson_learned_evaluasi,
        created_by
      )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        pengetahuanId,
        tanggal_kegiatan,
        penerima_pengetahuan.trim(),
        lesson_learned_evaluasi || null,
        created_by
      ]
    );

    const alihPengetahuanId = result.insertId;

    // Simpan masing-masing metode
    for (const item of metode_alih) {
      await connection.query(
        `
        INSERT INTO mpn_metode_alih
        (
          alih_pengetahuan_id,
          metode,
          keterangan
        )
        VALUES (?, ?, ?)
        `,
        [
          alihPengetahuanId,
          item.metode,
          item.keterangan || null
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: 'Data alih pengetahuan berhasil disimpan',
      data: {
        id: alihPengetahuanId,
        pengetahuan_id: pengetahuanId,
        tanggal_kegiatan,
        penerima_pengetahuan:
          penerima_pengetahuan.trim(),
        lesson_learned_evaluasi:
          lesson_learned_evaluasi || null,
        metode_alih,
        created_by
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      'ERROR CREATE ALIH PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getDetailAlihPengetahuan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID alih pengetahuan tidak valid'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        ap.id,
        ap.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,

        DATE_FORMAT(
          ap.tanggal_kegiatan,
          '%Y-%m-%d'
        ) AS tanggal_kegiatan,

        ap.penerima_pengetahuan,
        ap.lesson_learned_evaluasi,

        ap.created_by,
        u.nama AS pembuat,

        ap.created_at,
        ap.updated_at

      FROM mpn_alih_pengetahuan ap

      JOIN mpn_pengetahuan p
        ON p.id = ap.pengetahuan_id

      JOIN users u
        ON u.id = ap.created_by

      WHERE ap.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data alih pengetahuan tidak ditemukan'
      });
    }

    const [metode] = await db.query(
      `
      SELECT
        id,
        metode,
        keterangan,
        created_at
      FROM mpn_metode_alih
      WHERE alih_pengetahuan_id = ?
      ORDER BY id ASC
      `,
      [id]
    );

    rows[0].metode_alih = metode;

    return res.status(200).json({
      data: rows[0]
    });

  } catch (error) {
    console.error(
      'ERROR GET DETAIL ALIH PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.updateAlihPengetahuan = async (req, res) => {
  let connection;

  try {
    const id = Number(req.params.id);

    const {
      pengetahuan_id,
      tanggal_kegiatan,
      penerima_pengetahuan,
      lesson_learned_evaluasi = null,
      metode_alih = []
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID alih pengetahuan tidak valid'
      });
    }

    // =========================
    // CEK DATA ALIH
    // =========================

    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_alih_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Data alih pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // VALIDASI PENGETAHUAN
    // =========================

    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan wajib diisi dan harus valid'
      });
    }

    // =========================
    // VALIDASI TANGGAL
    // =========================

    if (
      typeof tanggal_kegiatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_kegiatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal kegiatan wajib menggunakan format YYYY-MM-DD'
      });
    }

    // =========================
    // VALIDASI PENERIMA
    // =========================

    if (
      typeof penerima_pengetahuan !== 'string' ||
      penerima_pengetahuan.trim() === ''
    ) {
      return res.status(400).json({
        message: 'Penerima pengetahuan wajib diisi'
      });
    }

    if (penerima_pengetahuan.trim().length > 255) {
      return res.status(400).json({
        message: 'Penerima pengetahuan maksimal 255 karakter'
      });
    }

    // =========================
    // CEK PENGETAHUAN
    // =========================

    const [pengetahuan] = await db.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [pengetahuanId]
    );

    if (pengetahuan.length === 0) {
      return res.status(400).json({
        message: 'Data pengetahuan tidak ditemukan'
      });
    }

    // =========================
    // VALIDASI METODE
    // =========================

    if (!Array.isArray(metode_alih)) {
      return res.status(400).json({
        message: 'Metode alih harus berupa array'
      });
    }

    const metodeValid = [
      'Pelatihan',
      'Workshop',
      'Sosialisasi',
      'Mentoring',
      'Sharing',
      'Lainnya'
    ];

    for (const item of metode_alih) {
      if (
        !item ||
        typeof item !== 'object' ||
        !metodeValid.includes(item.metode)
      ) {
        return res.status(400).json({
          message: 'Metode alih tidak valid'
        });
      }

      if (
        item.keterangan !== undefined &&
        item.keterangan !== null &&
        typeof item.keterangan !== 'string'
      ) {
        return res.status(400).json({
          message: 'Keterangan metode harus berupa teks'
        });
      }
    }

    // =========================
    // TRANSACTION
    // =========================

    connection = await db.getConnection();

    await connection.beginTransaction();

    await connection.query(
      `
      UPDATE mpn_alih_pengetahuan
      SET
        pengetahuan_id = ?,
        tanggal_kegiatan = ?,
        penerima_pengetahuan = ?,
        lesson_learned_evaluasi = ?
      WHERE id = ?
      `,
      [
        pengetahuanId,
        tanggal_kegiatan,
        penerima_pengetahuan.trim(),
        lesson_learned_evaluasi || null,
        id
      ]
    );

    // Hapus metode lama
    await connection.query(
      `
      DELETE FROM mpn_metode_alih
      WHERE alih_pengetahuan_id = ?
      `,
      [id]
    );

    // Masukkan metode terbaru
    for (const item of metode_alih) {
      await connection.query(
        `
        INSERT INTO mpn_metode_alih
        (
          alih_pengetahuan_id,
          metode,
          keterangan
        )
        VALUES (?, ?, ?)
        `,
        [
          id,
          item.metode,
          item.keterangan || null
        ]
      );
    }

    await connection.commit();

    return res.status(200).json({
      message: 'Data alih pengetahuan berhasil diperbarui',
      data: {
        id,
        pengetahuan_id: pengetahuanId,
        tanggal_kegiatan,
        penerima_pengetahuan:
          penerima_pengetahuan.trim(),
        lesson_learned_evaluasi:
          lesson_learned_evaluasi || null,
        metode_alih
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      'ERROR UPDATE ALIH PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.deleteAlihPengetahuan = async (req, res) => {
  let connection;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID alih pengetahuan tidak valid'
      });
    }

    const [data] = await db.query(
      `
      SELECT id
      FROM mpn_alih_pengetahuan
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (data.length === 0) {
      return res.status(404).json({
        message: 'Data alih pengetahuan tidak ditemukan'
      });
    }

    connection = await db.getConnection();

    await connection.beginTransaction();

    // Hapus child terlebih dahulu
    await connection.query(
      `
      DELETE FROM mpn_metode_alih
      WHERE alih_pengetahuan_id = ?
      `,
      [id]
    );

    // Hapus parent
    await connection.query(
      `
      DELETE FROM mpn_alih_pengetahuan
      WHERE id = ?
      `,
      [id]
    );

    await connection.commit();

    return res.status(200).json({
      message: 'Data alih pengetahuan berhasil dihapus'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      'ERROR DELETE ALIH PENGETAHUAN:',
      error
    );

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Data alih pengetahuan tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });

  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.getAllEvaluasi = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        e.id,
        e.indikator_perencanaan_id,

        ip.perencanaan_id,
        ip.kode_indikator,
        ip.nilai_saat_ini,
        ip.nilai_target,

        DATE_FORMAT(
          e.tanggal_evaluasi,
          '%Y-%m-%d'
        ) AS tanggal_evaluasi,

        e.nilai_realisasi,
        e.analisis,
        e.tindak_lanjut,
        e.pelaksana_terkait,

        e.created_by,
        u.nama AS pembuat,

        e.created_at,
        e.updated_at

      FROM mpn_evaluasi e

      JOIN mpn_indikator_perencanaan ip
        ON ip.id = e.indikator_perencanaan_id

      JOIN users u
        ON u.id = e.created_by

      ORDER BY
        e.tanggal_evaluasi DESC,
        e.created_at DESC
    `);

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error(
      'ERROR GET EVALUASI PENGETAHUAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createEvaluasi = async (req, res) => {
  try {
    const {
      indikator_perencanaan_id,
      tanggal_evaluasi,
      nilai_realisasi,
      analisis = null,
      tindak_lanjut = null,
      pelaksana_terkait
    } = req.body;

    const created_by = req.user.id;

    // =========================
    // VALIDASI INDIKATOR
    // =========================

    const indikatorId = Number(
      indikator_perencanaan_id
    );

    if (
      !Number.isInteger(indikatorId) ||
      indikatorId <= 0
    ) {
      return res.status(400).json({
        message:
          'ID indikator perencanaan wajib diisi dan harus valid'
      });
    }

    // =========================
    // VALIDASI TANGGAL
    // =========================

    if (
      typeof tanggal_evaluasi !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(
        tanggal_evaluasi
      )
    ) {
      return res.status(400).json({
        message:
          'Tanggal evaluasi wajib menggunakan format YYYY-MM-DD'
      });
    }

    // =========================
    // VALIDASI NILAI REALISASI
    // DB CHECK: 0 - 100
    // =========================

    const nilaiRealisasi =
      Number(nilai_realisasi);

    if (
      !Number.isFinite(nilaiRealisasi) ||
      nilaiRealisasi < 0 ||
      nilaiRealisasi > 100
    ) {
      return res.status(400).json({
        message:
          'Nilai realisasi harus berada antara 0 sampai 100'
      });
    }

    // =========================
    // VALIDASI PELAKSANA
    // =========================

    if (
      typeof pelaksana_terkait !== 'string' ||
      pelaksana_terkait.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Pelaksana terkait wajib diisi'
      });
    }

    if (
      pelaksana_terkait.trim().length > 255
    ) {
      return res.status(400).json({
        message:
          'Pelaksana terkait maksimal 255 karakter'
      });
    }

    // =========================
    // CEK INDIKATOR
    // =========================

    const [indikator] = await db.query(
      `
      SELECT
        id,
        perencanaan_id,
        kode_indikator,
        nilai_target
      FROM mpn_indikator_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [indikatorId]
    );

    if (indikator.length === 0) {
      return res.status(400).json({
        message:
          'Indikator perencanaan tidak ditemukan'
      });
    }

    // =========================
    // CEK DUPLICATE
    // indikator + tanggal harus unik
    // =========================

    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_evaluasi
      WHERE indikator_perencanaan_id = ?
        AND tanggal_evaluasi = ?
      LIMIT 1
      `,
      [
        indikatorId,
        tanggal_evaluasi
      ]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message:
          'Evaluasi indikator pada tanggal tersebut sudah tersedia'
      });
    }

    // =========================
    // INSERT
    // =========================

    const [result] = await db.query(
      `
      INSERT INTO mpn_evaluasi
      (
        indikator_perencanaan_id,
        tanggal_evaluasi,
        nilai_realisasi,
        analisis,
        tindak_lanjut,
        pelaksana_terkait,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
      [
        indikatorId,
        tanggal_evaluasi,
        nilaiRealisasi,
        analisis || null,
        tindak_lanjut || null,
        pelaksana_terkait.trim(),
        created_by
      ]
    );

    return res.status(201).json({
      message:
        'Data evaluasi berhasil disimpan',

      data: {
        id: result.insertId,
        indikator_perencanaan_id:
          indikatorId,
        tanggal_evaluasi,
        nilai_realisasi:
          nilaiRealisasi,
        analisis:
          analisis || null,
        tindak_lanjut:
          tindak_lanjut || null,
        pelaksana_terkait:
          pelaksana_terkait.trim(),
        created_by
      }
    });

  } catch (error) {
    console.error(
      'ERROR CREATE EVALUASI:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Evaluasi indikator pada tanggal tersebut sudah tersedia'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan pada server'
    });
  }
};

exports.getDetailEvaluasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID evaluasi tidak valid'
      });
    }

    const [rows] = await db.query(
      `
      SELECT
        e.id,
        e.indikator_perencanaan_id,

        ip.perencanaan_id,
        ip.kode_indikator,
        ip.nilai_saat_ini,
        ip.nilai_target,

        DATE_FORMAT(
          e.tanggal_evaluasi,
          '%Y-%m-%d'
        ) AS tanggal_evaluasi,

        e.nilai_realisasi,
        e.analisis,
        e.tindak_lanjut,
        e.pelaksana_terkait,

        e.created_by,
        u.nama AS pembuat,

        e.created_at,
        e.updated_at

      FROM mpn_evaluasi e

      JOIN mpn_indikator_perencanaan ip
        ON ip.id = e.indikator_perencanaan_id

      JOIN users u
        ON u.id = e.created_by

      WHERE e.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data evaluasi tidak ditemukan'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });

  } catch (error) {
    console.error(
      'ERROR GET DETAIL EVALUASI:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.updateEvaluasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    const {
      indikator_perencanaan_id,
      tanggal_evaluasi,
      nilai_realisasi,
      analisis = null,
      tindak_lanjut = null,
      pelaksana_terkait
    } = req.body;

    // =========================
    // VALIDASI ID
    // =========================

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID evaluasi tidak valid'
      });
    }

    // =========================
    // CEK DATA EVALUASI
    // =========================

    const [existingEvaluasi] = await db.query(
      `
      SELECT id
      FROM mpn_evaluasi
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingEvaluasi.length === 0) {
      return res.status(404).json({
        message: 'Data evaluasi tidak ditemukan'
      });
    }

    // =========================
    // VALIDASI INDIKATOR
    // =========================

    const indikatorId = Number(
      indikator_perencanaan_id
    );

    if (
      !Number.isInteger(indikatorId) ||
      indikatorId <= 0
    ) {
      return res.status(400).json({
        message:
          'ID indikator perencanaan wajib diisi dan harus valid'
      });
    }

    // =========================
    // VALIDASI TANGGAL
    // =========================

    if (
      typeof tanggal_evaluasi !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_evaluasi)
    ) {
      return res.status(400).json({
        message:
          'Tanggal evaluasi wajib menggunakan format YYYY-MM-DD'
      });
    }

    // =========================
    // VALIDASI NILAI REALISASI
    // DB: 0 - 100
    // =========================

    const nilaiRealisasi =
      Number(nilai_realisasi);

    if (
      !Number.isFinite(nilaiRealisasi) ||
      nilaiRealisasi < 0 ||
      nilaiRealisasi > 100
    ) {
      return res.status(400).json({
        message:
          'Nilai realisasi harus berada antara 0 sampai 100'
      });
    }

    // =========================
    // VALIDASI PELAKSANA
    // =========================

    if (
      typeof pelaksana_terkait !== 'string' ||
      pelaksana_terkait.trim() === ''
    ) {
      return res.status(400).json({
        message:
          'Pelaksana terkait wajib diisi'
      });
    }

    if (
      pelaksana_terkait.trim().length > 255
    ) {
      return res.status(400).json({
        message:
          'Pelaksana terkait maksimal 255 karakter'
      });
    }

    // =========================
    // CEK INDIKATOR
    // =========================

    const [indikator] = await db.query(
      `
      SELECT id
      FROM mpn_indikator_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [indikatorId]
    );

    if (indikator.length === 0) {
      return res.status(400).json({
        message:
          'Indikator perencanaan tidak ditemukan'
      });
    }

    // =========================
    // CEK DUPLICATE
    // indikator + tanggal
    // kecuali record yang sedang diedit
    // =========================

    const [duplicate] = await db.query(
      `
      SELECT id
      FROM mpn_evaluasi
      WHERE indikator_perencanaan_id = ?
        AND tanggal_evaluasi = ?
        AND id <> ?
      LIMIT 1
      `,
      [
        indikatorId,
        tanggal_evaluasi,
        id
      ]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message:
          'Evaluasi indikator pada tanggal tersebut sudah tersedia'
      });
    }

    // =========================
    // UPDATE
    // created_by TIDAK diubah
    // =========================

    await db.query(
      `
      UPDATE mpn_evaluasi
      SET
        indikator_perencanaan_id = ?,
        tanggal_evaluasi = ?,
        nilai_realisasi = ?,
        analisis = ?,
        tindak_lanjut = ?,
        pelaksana_terkait = ?
      WHERE id = ?
      `,
      [
        indikatorId,
        tanggal_evaluasi,
        nilaiRealisasi,
        analisis || null,
        tindak_lanjut || null,
        pelaksana_terkait.trim(),
        id
      ]
    );

    return res.status(200).json({
      message:
        'Data evaluasi berhasil diperbarui',

      data: {
        id,
        indikator_perencanaan_id:
          indikatorId,
        tanggal_evaluasi,
        nilai_realisasi:
          nilaiRealisasi,
        analisis:
          analisis || null,
        tindak_lanjut:
          tindak_lanjut || null,
        pelaksana_terkait:
          pelaksana_terkait.trim()
      }
    });

  } catch (error) {
    console.error(
      'ERROR UPDATE EVALUASI:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Evaluasi indikator pada tanggal tersebut sudah tersedia'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.deleteEvaluasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID evaluasi tidak valid'
      });
    }

    const [data] = await db.query(
      `
      SELECT id
      FROM mpn_evaluasi
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (data.length === 0) {
      return res.status(404).json({
        message: 'Data evaluasi tidak ditemukan'
      });
    }

    await db.query(
      `
      DELETE FROM mpn_evaluasi
      WHERE id = ?
      `,
      [id]
    );

    return res.status(200).json({
      message: 'Data evaluasi berhasil dihapus'
    });

  } catch (error) {
    console.error(
      'ERROR DELETE EVALUASI:',
      error
    );

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message:
          'Data evaluasi tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};