const db = require('../config/db');

exports.createKonteks = async (req, res) => {
  const {
    nama_instansi,
    nama_upr,
    tugas_upr,
    fungsi_upr,
    tahun_pelaksanaan,

    sasaran_upr,
    indikator_kinerja,
    target_kinerja,
    sasaran_pembangunan_nasional,

    pemilik_risiko,
    koordinator_risiko,
    pengelola_risiko,

    besaran_selera_risiko,
  } = req.body;

  const created_by = req.user ? req.user.id : null;

  try {
    const [result] = await db.query(
      `
      INSERT INTO mr_konteks (
        nama_instansi,
        nama_upr,
        tugas_upr,
        fungsi_upr,
        tahun_pelaksanaan,

        sasaran_upr,
        indikator_kinerja,
        target_kinerja,
        sasaran_pembangunan_nasional,

        pemilik_risiko,
        koordinator_risiko,
        pengelola_risiko,

        besaran_selera_risiko,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        nama_instansi,
        nama_upr,
        tugas_upr || null,
        fungsi_upr || null,
        tahun_pelaksanaan,

        sasaran_upr || null,
        indikator_kinerja || null,
        target_kinerja || null,
        sasaran_pembangunan_nasional || null,

        pemilik_risiko || null,
        koordinator_risiko || null,
        pengelola_risiko || null,

        besaran_selera_risiko || null,
        created_by,
      ]
    );

    res.status(201).json({
      message: 'Konteks risiko berhasil ditambahkan.',
      id: result.insertId,
    });

  } catch (error) {
    console.error('ERROR CREATE KONTEKS:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.getAllKonteks = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        k.*,
        u.nama AS pembuat
      FROM mr_konteks k
      LEFT JOIN users u
        ON u.id = k.created_by
      ORDER BY k.created_at DESC
    `);

    res.json(rows);

  } catch (error) {
    console.error('ERROR GET KONTEKS:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.getKonteksById = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        k.*,
        u.nama AS pembuat
      FROM mr_konteks k
      LEFT JOIN users u
        ON u.id = k.created_by
      WHERE k.id = ?
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Konteks risiko tidak ditemukan.',
      });
    }

    res.json(rows[0]);
  } catch (error) {
    console.error('ERROR GET DETAIL KONTEKS:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.updateKonteks = async (req, res) => {
  const { id } = req.params;

  const {
    nama_instansi,
    nama_upr,
    tugas_upr,
    fungsi_upr,
    tahun_pelaksanaan,
    sasaran_upr,
    indikator_kinerja,
    target_kinerja,
    sasaran_pembangunan_nasional,
    pemilik_risiko,
    koordinator_risiko,
    pengelola_risiko,
    besaran_selera_risiko,
  } = req.body;

  try {
    const [existing] = await db.query(
      'SELECT id FROM mr_konteks WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Konteks risiko tidak ditemukan.',
      });
    }

    await db.query(
      `
      UPDATE mr_konteks
      SET
        nama_instansi = ?,
        nama_upr = ?,
        tugas_upr = ?,
        fungsi_upr = ?,
        tahun_pelaksanaan = ?,
        sasaran_upr = ?,
        indikator_kinerja = ?,
        target_kinerja = ?,
        sasaran_pembangunan_nasional = ?,
        pemilik_risiko = ?,
        koordinator_risiko = ?,
        pengelola_risiko = ?,
        besaran_selera_risiko = ?
      WHERE id = ?
      `,
      [
        nama_instansi,
        nama_upr,
        tugas_upr || null,
        fungsi_upr || null,
        tahun_pelaksanaan,
        sasaran_upr || null,
        indikator_kinerja || null,
        target_kinerja || null,
        sasaran_pembangunan_nasional || null,
        pemilik_risiko || null,
        koordinator_risiko || null,
        pengelola_risiko || null,
        besaran_selera_risiko ?? null,
        id,
      ]
    );

    res.json({
      message: 'Konteks risiko berhasil diperbarui.',
    });
  } catch (error) {
    console.error('ERROR UPDATE KONTEKS:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.deleteKonteks = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query(
      'SELECT id FROM mr_konteks WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Konteks risiko tidak ditemukan.',
      });
    }

    await db.query(
      'DELETE FROM mr_konteks WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Konteks risiko berhasil dihapus.',
    });
  } catch (error) {
    console.error('ERROR DELETE KONTEKS:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};