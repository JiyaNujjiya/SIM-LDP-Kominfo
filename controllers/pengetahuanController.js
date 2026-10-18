const db = require('../config/db');

const fs = require('fs');
const path = require('path');

const getUserInstansiId = async (req) => {
  const role = String(req.user?.role || '')
    .trim()
    .toLowerCase();

  if (role === 'admin') {
    return null;
  }

  const namaInstansi = String(
    req.user?.nama_instansi || ''
  ).trim();

  if (!namaInstansi) {
    throw new Error('INSTANSI_AKUN_KOSONG');
  }

  const [instansi] = await db.query(
    `
    SELECT id
    FROM instansi
    WHERE LOWER(TRIM(nama_instansi)) = LOWER(TRIM(?))
    LIMIT 1
    `,
    [namaInstansi]
  );

  if (instansi.length === 0) {
    throw new Error('INSTANSI_AKUN_TIDAK_DITEMUKAN');
  }

  return Number(instansi[0].id);
};

exports.getInstansiOptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        kode_instansi,
        nama_instansi
      FROM instansi
      WHERE status = 'Aktif'
      ORDER BY nama_instansi ASC
    `);

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('ERROR GET INSTANSI OPTIONS:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getLayananOptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        kode_layanan,
        nama_layanan,
        instansi_id,
        unit_kerja_id
      FROM layanan_digital
      WHERE status = 'Aktif'
      ORDER BY nama_layanan ASC
    `);

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('ERROR GET LAYANAN OPTIONS:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getUnitOptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        instansi_id,
        kode_unit,
        nama_unit
      FROM unit_kerja
      WHERE status = 'Aktif'
      ORDER BY nama_unit ASC
    `);

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('ERROR GET UNIT OPTIONS:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};


exports.getUserOptions = async (req, res) => {
  try {
    const instansiId = await getUserInstansiId(req);

    let rows;

    if (instansiId === null) {
      [rows] = await db.query(`
        SELECT
          id,
          nama,
          email,
          role,
          role_id,
          instansi_id
        FROM users
        ORDER BY nama ASC
      `);
    } else {
      [rows] = await db.query(
        `
        SELECT
          id,
          nama,
          email,
          role,
          role_id,
          instansi_id
        FROM users
        WHERE instansi_id = ?
        ORDER BY nama ASC
        `,
        [instansiId]
      );
    }

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('ERROR GET USER OPTIONS:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};



exports.getPengetahuanOptions = async (req, res) => {
  try {
    const instansiId = await getUserInstansiId(req);

    const [rows] = await db.query(
      `
      SELECT
        p.id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,
        p.layanan_id,
        COALESCE(p.nama_layanan, l.nama_layanan) AS nama_layanan,
        p.jenis_pengetahuan,
        p.sudah_terdokumentasi,
        p.aspek_pemdi,
        p.indikator_pemdi,
        p.pemilik_instansi_id,
        i.nama_instansi AS pemilik_instansi,
        p.pemilik_unit_kerja_id,
        uk.nama_unit AS pemilik_unit_kerja
      FROM mpn_pengetahuan p
      LEFT JOIN layanan_digital l
        ON l.id = p.layanan_id
      LEFT JOIN instansi i
        ON i.id = p.pemilik_instansi_id
      LEFT JOIN unit_kerja uk
        ON uk.id = p.pemilik_unit_kerja_id
      WHERE (? IS NULL OR p.pemilik_instansi_id = ?)
      ORDER BY p.nama_pengetahuan ASC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('ERROR GET PENGETAHUAN OPTIONS:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    return res.status(500).json({
      message: 'Gagal mengambil pilihan pengetahuan'
    });
  }
};

exports.getAllPerencanaan = async (req, res) => {
  try {
    const role = String(req.user?.role || '')
      .trim()
      .toLowerCase();

    const isAdmin = role === 'admin';

    // ADMIN: lihat semua
    if (isAdmin) {
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
        ORDER BY
          p.tahun_perencanaan DESC,
          p.created_at DESC
      `);

      return res.status(200).json({
        data: rows
      });
    }

    // NON-ADMIN: berdasarkan instansi login
    const namaInstansi = String(
      req.user?.nama_instansi || ''
    ).trim();

    if (!namaInstansi) {
      return res.status(403).json({
        message: 'Instansi akun belum ditentukan'
      });
    }

    const [instansi] = await db.query(
      `
      SELECT id
      FROM instansi
      WHERE LOWER(TRIM(nama_instansi)) = LOWER(TRIM(?))
      LIMIT 1
      `,
      [namaInstansi]
    );

    if (instansi.length === 0) {
      return res.status(403).json({
        message:
          'Instansi akun tidak ditemukan pada master instansi'
      });
    }

    const instansiId = Number(instansi[0].id);

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
      WHERE p.instansi_id = ?
      ORDER BY
        p.tahun_perencanaan DESC,
        p.created_at DESC
      `,
      [instansiId]
    );

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error(
      'ERROR GET ALL PERENCANAAN:',
      error
    );

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

    const role = String(req.user?.role || '')
      .trim()
      .toLowerCase();

    const isAdmin = role === 'admin';

    // ADMIN
    if (isAdmin) {
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
    }

    // NON-ADMIN
    const namaInstansi = String(
      req.user?.nama_instansi || ''
    ).trim();

    if (!namaInstansi) {
      return res.status(403).json({
        message: 'Instansi akun belum ditentukan'
      });
    }

    const [instansi] = await db.query(
      `
      SELECT id
      FROM instansi
      WHERE LOWER(TRIM(nama_instansi)) = LOWER(TRIM(?))
      LIMIT 1
      `,
      [namaInstansi]
    );

    if (instansi.length === 0) {
      return res.status(403).json({
        message:
          'Instansi akun tidak ditemukan pada master instansi'
      });
    }

    const instansiId = Number(instansi[0].id);

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
        AND p.instansi_id = ?
      LIMIT 1
      `,
      [id, instansiId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          'Data perencanaan tidak ditemukan atau bukan milik instansi Anda'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });

  } catch (error) {
    console.error(
      'ERROR GET DETAIL PERENCANAAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.createPerencanaan = async (req, res) => {
  try {
    const {
      instansi_id,
      tahun_perencanaan
    } = req.body;

    const createdBy = req.user?.id;

    const role = String(req.user?.role || '')
      .trim()
      .toLowerCase();

    const isAdmin = role === 'admin';

    // Validasi user
    if (!createdBy) {
      return res.status(401).json({
        message: 'User tidak terautentikasi'
      });
    }

    // Validasi tahun
    if (!tahun_perencanaan) {
      return res.status(400).json({
        message: 'Tahun perencanaan wajib diisi'
      });
    }

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

    let instansiId;

    // ADMIN:
    // boleh menentukan instansi dari request
    if (isAdmin) {
      instansiId = Number(instansi_id);

      if (
        !Number.isInteger(instansiId) ||
        instansiId <= 0
      ) {
        return res.status(400).json({
          message: 'ID instansi tidak valid'
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
          message: 'Instansi tidak ditemukan'
        });
      }
    }

    // NON-ADMIN:
    // instansi wajib mengikuti akun login
    else {
      const namaInstansi = String(
        req.user?.nama_instansi || ''
      ).trim();

      if (!namaInstansi) {
        return res.status(403).json({
          message: 'Instansi akun belum ditentukan'
        });
      }

      const [instansi] = await db.query(
        `
        SELECT id
        FROM instansi
        WHERE LOWER(TRIM(nama_instansi)) = LOWER(TRIM(?))
        LIMIT 1
        `,
        [namaInstansi]
      );

      if (instansi.length === 0) {
        return res.status(403).json({
          message:
            'Instansi akun tidak ditemukan pada master instansi'
        });
      }

      instansiId = Number(instansi[0].id);
    }

    // Cek duplicate
    const [duplicate] = await db.query(
      `
      SELECT id
      FROM mpn_perencanaan
      WHERE instansi_id = ?
        AND tahun_perencanaan = ?
      LIMIT 1
      `,
      [instansiId, tahun]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message:
          'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
      });
    }

    // Simpan
    const [result] = await db.query(
      `
      INSERT INTO mpn_perencanaan (
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
        'Draft',
        createdBy
      ]
    );

    return res.status(201).json({
      message: 'Data perencanaan berhasil ditambahkan',
      data: {
        id: result.insertId,
        instansi_id: instansiId,
        tahun_perencanaan: tahun
      }
    });

  } catch (error) {
    console.error(
      'ERROR CREATE PERENCANAAN:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
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
      tahun_perencanaan
    } = req.body;

    const role = String(req.user?.role || '')
      .trim()
      .toLowerCase();

    const isAdmin = role === 'admin';

    // Validasi ID perencanaan
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    // Cek apakah data perencanaan ada
    const [perencanaan] = await db.query(
      `
      SELECT
        id,
        instansi_id,
        tahun_perencanaan
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

    // Validasi tahun
    if (!tahun_perencanaan) {
      return res.status(400).json({
        message: 'Tahun perencanaan wajib diisi'
      });
    }

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

    let instansiId;

    // ADMIN:
    // boleh menentukan instansi dari request
    if (isAdmin) {
      instansiId = Number(instansi_id);

      if (
        !Number.isInteger(instansiId) ||
        instansiId <= 0
      ) {
        return res.status(400).json({
          message: 'ID instansi tidak valid'
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
          message: 'Instansi tidak ditemukan'
        });
      }
    }

    // NON-ADMIN:
    // instansi harus berasal dari akun login
    else {
      const namaInstansi = String(
        req.user?.nama_instansi || ''
      ).trim();

      if (!namaInstansi) {
        return res.status(403).json({
          message: 'Instansi akun belum ditentukan'
        });
      }

      const [instansi] = await db.query(
        `
        SELECT id
        FROM instansi
        WHERE LOWER(TRIM(nama_instansi)) = LOWER(TRIM(?))
        LIMIT 1
        `,
        [namaInstansi]
      );

      if (instansi.length === 0) {
        return res.status(403).json({
          message: 'Instansi akun tidak ditemukan pada master instansi'
        });
      }

      instansiId = Number(instansi[0].id);

      // Pastikan record yang diedit memang milik instansi user
      if (
        Number(perencanaan[0].instansi_id) !==
        instansiId
      ) {
        return res.status(403).json({
          message:
            'Anda tidak memiliki akses untuk mengubah perencanaan instansi lain'
        });
      }
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
        message:
          'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
      });
    }

    // Update
    await db.query(
      `
      UPDATE mpn_perencanaan
      SET
        instansi_id = ?,
        tahun_perencanaan = ?
      WHERE id = ?
      `,
      [
        instansiId,
        tahun,
        id
      ]
    );

    return res.status(200).json({
      message: 'Data perencanaan berhasil diperbarui',
      data: {
        id,
        instansi_id: instansiId,
        tahun_perencanaan: tahun
      }
    });

  } catch (error) {
    console.error(
      'ERROR UPDATE PERENCANAAN:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Perencanaan untuk instansi dan tahun tersebut sudah tersedia'
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

    const role = String(req.user?.role || '')
      .trim()
      .toLowerCase();

    const isAdmin = role === 'admin';

    // Ambil data terlebih dahulu
    const [perencanaan] = await db.query(
      `
      SELECT
        id,
        instansi_id
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

    // NON-ADMIN: cek kepemilikan instansi
    if (!isAdmin) {
      const namaInstansi = String(
        req.user?.nama_instansi || ''
      ).trim();

      if (!namaInstansi) {
        return res.status(403).json({
          message: 'Instansi akun belum ditentukan'
        });
      }

      const [instansi] = await db.query(
        `
        SELECT id
        FROM instansi
        WHERE LOWER(TRIM(nama_instansi)) = LOWER(TRIM(?))
        LIMIT 1
        `,
        [namaInstansi]
      );

      if (instansi.length === 0) {
        return res.status(403).json({
          message:
            'Instansi akun tidak ditemukan pada master instansi'
        });
      }

      const instansiId = Number(instansi[0].id);

      if (
        Number(perencanaan[0].instansi_id) !==
        instansiId
      ) {
        return res.status(403).json({
          message:
            'Anda tidak memiliki akses untuk menghapus perencanaan instansi lain'
        });
      }
    }

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
    console.error(
      'ERROR DELETE PERENCANAAN:',
      error
    );

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};

exports.getIndikatorPerencanaan = async (req, res) => {
  try {
    const perencanaanId = Number(req.params.id);

    if (
      !Number.isInteger(perencanaanId) ||
      perencanaanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    const instansiId = await getUserInstansiId(req);

    let perencanaan;

    if (instansiId === null) {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
        LIMIT 1
        `,
        [perencanaanId]
      );
    } else {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
          AND instansi_id = ?
        LIMIT 1
        `,
        [perencanaanId, instansiId]
      );
    }

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message:
          'Data perencanaan tidak ditemukan atau bukan milik instansi Anda'
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
    console.error(
      'ERROR GET INDIKATOR PERENCANAAN:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message:
          'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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

    if (
      !Number.isInteger(perencanaanId) ||
      perencanaanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

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
        message:
          'Kode indikator, nilai saat ini, dan nilai target wajib diisi'
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

    if (kode_indikator === 'CAKUPAN_DOKUMENTASI') {
      if (
        nilaiSaatIni < 0 ||
        nilaiSaatIni > 100 ||
        nilaiTarget < 0 ||
        nilaiTarget > 100
      ) {
        return res.status(400).json({
          message:
            'Nilai CAKUPAN_DOKUMENTASI harus antara 0 dan 100'
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
          message:
            'Nilai KESESUAIAN_PENGGUNA harus antara 1 dan 5'
        });
      }
    }

    const instansiId = await getUserInstansiId(req);

    let perencanaan;

    if (instansiId === null) {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
        LIMIT 1
        `,
        [perencanaanId]
      );
    } else {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
          AND instansi_id = ?
        LIMIT 1
        `,
        [perencanaanId, instansiId]
      );
    }

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message:
          'Data perencanaan tidak ditemukan atau bukan milik instansi Anda'
      });
    }

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
        message:
          'Indikator tersebut sudah tersedia pada perencanaan ini'
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
    console.error(
      'ERROR CREATE INDIKATOR PERENCANAAN:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message:
          'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Indikator tersebut sudah tersedia pada perencanaan ini'
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
        ip.id,
        ip.perencanaan_id,
        ip.kode_indikator,
        p.instansi_id
      FROM mpn_indikator_perencanaan ip
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      WHERE ip.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (indikator.length === 0) {
      return res.status(404).json({
        message: 'Data indikator tidak ditemukan'
      });
    }

    const instansiId = await getUserInstansiId(req);

    if (
      instansiId !== null &&
      Number(indikator[0].instansi_id) !== instansiId
    ) {
      return res.status(403).json({
        message:
          'Anda tidak memiliki akses untuk mengubah indikator instansi lain'
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

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message:
          'Instansi akun tidak valid atau belum terdaftar'
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
      SELECT
        ip.id,
        ip.perencanaan_id,
        p.instansi_id
      FROM mpn_indikator_perencanaan ip
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      WHERE ip.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (indikator.length === 0) {
      return res.status(404).json({
        message: 'Data indikator tidak ditemukan'
      });
    }

    const instansiId = await getUserInstansiId(req);

    if (
      instansiId !== null &&
      Number(indikator[0].instansi_id) !== instansiId
    ) {
      return res.status(403).json({
        message:
          'Anda tidak memiliki akses untuk menghapus indikator instansi lain'
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
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message:
          'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
        COALESCE(p.nama_layanan, l.nama_layanan) AS nama_layanan,
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
      LEFT JOIN layanan_digital l
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
      nama_layanan,
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
    if (
      !String(kode_pengetahuan || '').trim() ||
      !String(nama_layanan || '').trim() ||
      !String(nama_pengetahuan || '').trim()
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan, nama layanan, dan nama pengetahuan wajib diisi'
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

    const instansiAkunId = await getUserInstansiId(req);

    const instansiPemilikId =
      instansiAkunId ??
      (pemilik_instansi_id ? Number(pemilik_instansi_id) : null);

    const [result] = await db.query(
      `
      INSERT INTO mpn_pengetahuan
      (
        kode_pengetahuan,
        layanan_id,
        nama_layanan,
        nama_pengetahuan,
        jenis_pengetahuan,
        sudah_terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        pemilik_instansi_id,
        pemilik_unit_kerja_id,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        kode_pengetahuan.trim(),
        null,
        nama_layanan.trim(),
        nama_pengetahuan.trim(),
        jenis_pengetahuan,
        terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        instansiPemilikId,
        pemilik_unit_kerja_id || null,
        created_by
      ]
    );

    return res.status(201).json({
      message: 'Data pengetahuan berhasil disimpan',
      data: {
        id: result.insertId,
        kode_pengetahuan,
        layanan_id: null,
        nama_layanan: nama_layanan.trim(),
        nama_pengetahuan,
        jenis_pengetahuan,
        sudah_terdokumentasi: terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        pemilik_instansi_id: instansiPemilikId,
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


exports.createRencanaDokumentasiGabungan = async (req, res) => {
  let connection;

  try {
    const perencanaanId = Number(req.params.id);
    const {
      kode_pengetahuan,
      nama_layanan,
      nama_pengetahuan,
      jenis_pengetahuan = 'Eksplisit',
      sudah_terdokumentasi = 0,
      aspek_pemdi = null,
      indikator_pemdi = null,
      ditargetkan_tahun_ini = 1,
      penanggung_jawab_id,
      target_waktu_dokumentasi = null,
      tipe_dokumentasi
    } = req.body;

    const createdBy = Number(req.user?.id);
    const instansiAkunId = await getUserInstansiId(req);

    if (!Number.isInteger(perencanaanId) || perencanaanId <= 0) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    if (
      !String(kode_pengetahuan || '').trim() ||
      !String(nama_layanan || '').trim() ||
      !String(nama_pengetahuan || '').trim()
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan, nama layanan, dan nama pengetahuan wajib diisi'
      });
    }

    if (!['Eksplisit', 'Implisit'].includes(jenis_pengetahuan)) {
      return res.status(400).json({
        message: 'Jenis pengetahuan tidak valid'
      });
    }

    const terdokumentasi = Number(sudah_terdokumentasi);
    const ditargetkan = Number(ditargetkan_tahun_ini);
    const penanggungJawabId = Number(penanggung_jawab_id);

    if (![0, 1].includes(terdokumentasi) || ![0, 1].includes(ditargetkan)) {
      return res.status(400).json({
        message: 'Status dokumentasi dan target harus Ya atau Tidak'
      });
    }

    if (!Number.isInteger(penanggungJawabId) || penanggungJawabId <= 0) {
      return res.status(400).json({
        message: 'Penanggung jawab dokumentasi wajib dipilih'
      });
    }

    const tipeValid = ['Teks', 'Gambar', 'Audio', 'Video'];

    if (
      !Array.isArray(tipe_dokumentasi) ||
      tipe_dokumentasi.length === 0 ||
      tipe_dokumentasi.some((tipe) => !tipeValid.includes(tipe))
    ) {
      return res.status(400).json({
        message: 'Pilih minimal satu tipe dokumentasi yang valid'
      });
    }

    const tipeUnik = [...new Set(tipe_dokumentasi)];

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [perencanaan] = await connection.query(
      `
      SELECT id, instansi_id
      FROM mpn_perencanaan
      WHERE id = ?
      LIMIT 1
      `,
      [perencanaanId]
    );

    if (perencanaan.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Data perencanaan tidak ditemukan'
      });
    }

    const instansiId = Number(perencanaan[0].instansi_id);

    if (instansiAkunId !== null && instansiAkunId !== instansiId) {
      await connection.rollback();
      return res.status(403).json({
        message: 'Anda tidak memiliki akses ke perencanaan instansi lain'
      });
    }

    const [penanggungJawab] = await connection.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
        AND instansi_id = ?
      LIMIT 1
      `,
      [penanggungJawabId, instansiId]
    );

    if (penanggungJawab.length === 0) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Penanggung jawab harus berasal dari instansi yang sama'
      });
    }

    const [existing] = await connection.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE kode_pengetahuan = ?
      LIMIT 1
      `,
      [String(kode_pengetahuan).trim()]
    );

    if (existing.length > 0) {
      await connection.rollback();
      return res.status(409).json({
        message: 'ID pengetahuan sudah digunakan'
      });
    }

    const [pengetahuanResult] = await connection.query(
      `
      INSERT INTO mpn_pengetahuan (
        kode_pengetahuan,
        layanan_id,
        nama_layanan,
        nama_pengetahuan,
        jenis_pengetahuan,
        sudah_terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        pemilik_instansi_id,
        pemilik_unit_kerja_id,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        String(kode_pengetahuan).trim(),
        null,
        String(nama_layanan).trim(),
        String(nama_pengetahuan).trim(),
        jenis_pengetahuan,
        terdokumentasi,
        aspek_pemdi || null,
        indikator_pemdi || null,
        instansiId,
        null,
        createdBy
      ]
    );

    const pengetahuanId = pengetahuanResult.insertId;

    const [rencanaResult] = await connection.query(
      `
      INSERT INTO mpn_rencana_dokumentasi (
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

    const rencanaId = rencanaResult.insertId;

    for (const tipe of tipeUnik) {
      await connection.query(
        `
        INSERT INTO mpn_rencana_tipe_dokumentasi (
          rencana_dokumentasi_id,
          tipe_dokumentasi
        )
        VALUES (?, ?)
        `,
        [rencanaId, tipe]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: 'Rencana dokumentasi berhasil disimpan',
      data: {
        id: rencanaId,
        pengetahuan_id: pengetahuanId,
        perencanaan_id: perencanaanId,
        kode_pengetahuan: String(kode_pengetahuan).trim(),
        nama_layanan: String(nama_layanan).trim(),
        nama_pengetahuan: String(nama_pengetahuan).trim(),
        pemilik_instansi_id: instansiId,
        tipe_dokumentasi: tipeUnik
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERROR CREATE RENCANA GABUNGAN:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'ID pengetahuan atau rencana dokumentasi sudah digunakan'
      });
    }

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    return res.status(500).json({
      message: 'Gagal menyimpan rencana dokumentasi'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};


exports.getRencanaDokumentasi = async (req, res) => {
  try {
    const perencanaanId = Number(req.params.id);

    if (
      !Number.isInteger(perencanaanId) ||
      perencanaanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    const instansiId = await getUserInstansiId(req);

    let perencanaan;

    if (instansiId === null) {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
        LIMIT 1
        `,
        [perencanaanId]
      );
    } else {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
          AND instansi_id = ?
        LIMIT 1
        `,
        [perencanaanId, instansiId]
      );
    }

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message:
          'Data perencanaan tidak ditemukan atau bukan milik instansi Anda'
      });
    }

    
    const [rows] = await db.query(
      `
        SELECT
          rd.id,
          rd.perencanaan_id,
          rd.pengetahuan_id,
          p.kode_pengetahuan,
          p.nama_layanan,
          p.nama_pengetahuan,
          p.jenis_pengetahuan,
          p.sudah_terdokumentasi,
          p.aspek_pemdi,
          p.indikator_pemdi,
          rd.ditargetkan_tahun_ini,
          rd.penanggung_jawab_id,
          u.nama AS penanggung_jawab,
          DATE_FORMAT(
            rd.target_waktu_dokumentasi,
            '%Y-%m-%d'
          ) AS target_waktu_dokumentasi
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
    console.error(
      'ERROR GET RENCANA DOKUMENTASI:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message:
          'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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

    if (
      !Number.isInteger(perencanaanId) ||
      perencanaanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID perencanaan tidak valid'
      });
    }

    const pengetahuanId = Number(pengetahuan_id);

    if (
      !Number.isInteger(pengetahuanId) ||
      pengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'ID pengetahuan tidak valid'
      });
    }

    const ditargetkan = Number(
      ditargetkan_tahun_ini
    );

    if (![0, 1].includes(ditargetkan)) {
      return res.status(400).json({
        message:
          'Ditargetkan tahun ini harus bernilai 0 atau 1'
      });
    }

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

    const tipeUnik = [
      ...new Set(tipe_dokumentasi)
    ];

    const tipeTidakValid = tipeUnik.some(
      tipe => !tipeValid.includes(tipe)
    );

    if (tipeTidakValid) {
      return res.status(400).json({
        message: 'Tipe dokumentasi tidak valid'
      });
    }

    // Cek instansi perencanaan
    const instansiId = await getUserInstansiId(req);

    let perencanaan;

    if (instansiId === null) {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
        LIMIT 1
        `,
        [perencanaanId]
      );
    } else {
      [perencanaan] = await db.query(
        `
        SELECT id
        FROM mpn_perencanaan
        WHERE id = ?
          AND instansi_id = ?
        LIMIT 1
        `,
        [perencanaanId, instansiId]
      );
    }

    if (perencanaan.length === 0) {
      return res.status(404).json({
        message:
          'Data perencanaan tidak ditemukan atau bukan milik instansi Anda'
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

    // Penanggung jawab
    let penanggungJawabId = null;

    if (
      penanggung_jawab_id !== null &&
      penanggung_jawab_id !== ''
    ) {
      penanggungJawabId = Number(
        penanggung_jawab_id
      );

      if (
        !Number.isInteger(penanggungJawabId) ||
        penanggungJawabId <= 0
      ) {
        return res.status(400).json({
          message:
            'ID penanggung jawab tidak valid'
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
          message:
            'Penanggung jawab tidak ditemukan'
        });
      }
    }

    // Duplicate
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
        message:
          'Pengetahuan tersebut sudah memiliki rencana dokumentasi pada perencanaan ini'
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

    const rencanaDokumentasiId =
      result.insertId;

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
      message:
        'Rencana dokumentasi berhasil disimpan',
      data: {
        id: rencanaDokumentasiId,
        perencanaan_id: perencanaanId,
        pengetahuan_id: pengetahuanId,
        ditargetkan_tahun_ini: ditargetkan,
        penanggung_jawab_id:
          penanggungJawabId,
        target_waktu_dokumentasi:
          target_waktu_dokumentasi || null,
        tipe_dokumentasi: tipeUnik
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error(
      'ERROR CREATE RENCANA DOKUMENTASI:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message:
          'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pengetahuan tersebut sudah memiliki rencana dokumentasi pada perencanaan ini'
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
  let transactionStarted = false;

  try {
    const id = Number(req.params.id);

    const {
      kode_pengetahuan,
      nama_layanan,
      nama_pengetahuan,
      jenis_pengetahuan,
      sudah_terdokumentasi,
      aspek_pemdi,
      indikator_pemdi,
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

    const kode = String(kode_pengetahuan || '').trim();
    const layanan = String(nama_layanan || '').trim();
    const nama = String(nama_pengetahuan || '').trim();

    if (!kode || !layanan || !nama) {
      return res.status(400).json({
        message: 'ID Pengetahuan, Nama Layanan, dan Nama Pengetahuan wajib diisi'
      });
    }

    if (!['Eksplisit', 'Implisit'].includes(jenis_pengetahuan)) {
      return res.status(400).json({
        message: 'Jenis pengetahuan tidak valid'
      });
    }

    const terdokumentasi = Number(sudah_terdokumentasi);
    const ditargetkan = Number(ditargetkan_tahun_ini);
    const penanggungJawabId = Number(penanggung_jawab_id);

    if (
      ![0, 1].includes(terdokumentasi) ||
      ![0, 1].includes(ditargetkan)
    ) {
      return res.status(400).json({
        message: 'Status dokumentasi dan target tidak valid'
      });
    }

    if (
      !Number.isInteger(penanggungJawabId) ||
      penanggungJawabId <= 0
    ) {
      return res.status(400).json({
        message: 'Penanggung jawab dokumentasi wajib dipilih'
      });
    }

    const tipeValid = ['Teks', 'Gambar', 'Audio', 'Video'];

    if (
      !Array.isArray(tipe_dokumentasi) ||
      tipe_dokumentasi.length === 0 ||
      tipe_dokumentasi.some((tipe) => !tipeValid.includes(tipe))
    ) {
      return res.status(400).json({
        message: 'Pilih minimal satu tipe dokumentasi yang valid'
      });
    }

    const tipeUnik = [...new Set(tipe_dokumentasi)];
    const instansiAkunId = await getUserInstansiId(req);

    connection = await db.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    const [rencana] = await connection.query(
      `
      SELECT
        rd.id,
        rd.perencanaan_id,
        rd.pengetahuan_id,
        p.instansi_id
      FROM mpn_rencana_dokumentasi rd
      JOIN mpn_perencanaan p
        ON p.id = rd.perencanaan_id
      WHERE rd.id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [id]
    );

    if (rencana.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(404).json({
        message: 'Rencana dokumentasi tidak ditemukan'
      });
    }

    const instansiId = Number(rencana[0].instansi_id);
    const pengetahuanId = Number(rencana[0].pengetahuan_id);

    if (
      instansiAkunId !== null &&
      instansiAkunId !== instansiId
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(403).json({
        message: 'Anda tidak memiliki akses ke data instansi lain'
      });
    }

    const [pengetahuan] = await connection.query(
      `
      SELECT id, pemilik_instansi_id
      FROM mpn_pengetahuan
      WHERE id = ?
      LIMIT 1
      FOR UPDATE
      `,
      [pengetahuanId]
    );

    if (
      pengetahuan.length === 0 ||
      Number(pengetahuan[0].pemilik_instansi_id) !== instansiId
    ) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(403).json({
        message: 'Pengetahuan bukan milik instansi perencanaan'
      });
    }

    const [pemakaianLain] = await connection.query(
      `
      SELECT id
      FROM mpn_rencana_dokumentasi
      WHERE pengetahuan_id = ?
        AND id <> ?
      LIMIT 1
      `,
      [pengetahuanId, id]
    );

    if (pemakaianLain.length > 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(409).json({
        message: 'Pengetahuan ini digunakan pada rencana lain dan tidak dapat diedit bersama'
      });
    }

    const [duplikat] = await connection.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE kode_pengetahuan = ?
        AND id <> ?
      LIMIT 1
      `,
      [kode, pengetahuanId]
    );

    if (duplikat.length > 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(409).json({
        message: 'ID Pengetahuan sudah digunakan'
      });
    }

    const [penanggungJawab] = await connection.query(
      `
      SELECT id
      FROM users
      WHERE id = ?
        AND instansi_id = ?
      LIMIT 1
      `,
      [penanggungJawabId, instansiId]
    );

    if (penanggungJawab.length === 0) {
      await connection.rollback();
      transactionStarted = false;

      return res.status(400).json({
        message: 'Penanggung jawab harus berasal dari instansi yang sama'
      });
    }

    await connection.query(
      `
      UPDATE mpn_pengetahuan
      SET
        kode_pengetahuan = ?,
        nama_layanan = ?,
        nama_pengetahuan = ?,
        jenis_pengetahuan = ?,
        sudah_terdokumentasi = ?,
        aspek_pemdi = ?,
        indikator_pemdi = ?
      WHERE id = ?
      `,
      [
        kode,
        layanan,
        nama,
        jenis_pengetahuan,
        terdokumentasi,
        aspek_pemdi || null,
        indikator_pemdi || null,
        pengetahuanId
      ]
    );

    await connection.query(
      `
      UPDATE mpn_rencana_dokumentasi
      SET
        ditargetkan_tahun_ini = ?,
        penanggung_jawab_id = ?,
        target_waktu_dokumentasi = ?
      WHERE id = ?
      `,
      [
        ditargetkan,
        penanggungJawabId,
        target_waktu_dokumentasi || null,
        id
      ]
    );

    await connection.query(
      `
      DELETE FROM mpn_rencana_tipe_dokumentasi
      WHERE rencana_dokumentasi_id = ?
      `,
      [id]
    );

    for (const tipe of tipeUnik) {
      await connection.query(
        `
        INSERT INTO mpn_rencana_tipe_dokumentasi (
          rencana_dokumentasi_id,
          tipe_dokumentasi
        )
        VALUES (?, ?)
        `,
        [id, tipe]
      );
    }

    await connection.commit();
    transactionStarted = false;

    return res.status(200).json({
      message: 'Rencana dokumentasi berhasil diperbarui',
      data: {
        id,
        pengetahuan_id: pengetahuanId,
        kode_pengetahuan: kode,
        nama_layanan: layanan,
        nama_pengetahuan: nama,
        jenis_pengetahuan,
        sudah_terdokumentasi: terdokumentasi,
        aspek_pemdi,
        indikator_pemdi,
        ditargetkan_tahun_ini: ditargetkan,
        penanggung_jawab_id: penanggungJawabId,
        target_waktu_dokumentasi: target_waktu_dokumentasi || null,
        tipe_dokumentasi: tipeUnik
      }
    });
  } catch (error) {
    if (connection && transactionStarted) {
      await connection.rollback();
    }

    console.error('ERROR UPDATE RENCANA DOKUMENTASI:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'ID Pengetahuan sudah digunakan'
      });
    }

    return res.status(500).json({
      message: 'Gagal memperbarui rencana dokumentasi'
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
      SELECT
        rd.id,
        rd.perencanaan_id,
        p.instansi_id
      FROM mpn_rencana_dokumentasi rd
      JOIN mpn_perencanaan p
        ON p.id = rd.perencanaan_id
      WHERE rd.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rencana.length === 0) {
      return res.status(404).json({
        message: 'Rencana dokumentasi tidak ditemukan'
      });
    }

    const instansiId =
      await getUserInstansiId(req);

    if (
      instansiId !== null &&
      Number(rencana[0].instansi_id) !== instansiId
    ) {
      return res.status(403).json({
        message:
          'Anda tidak memiliki akses untuk menghapus rencana dokumentasi instansi lain'
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
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message:
          'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
    const instansiId = await getUserInstansiId(req);

    const query = `
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
        COALESCE(
          pp.unit_pengumpulan,
          uk.nama_unit
        ) AS unit_pengumpulan,

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

      LEFT JOIN unit_kerja uk
        ON uk.id = pp.unit_pengumpulan_id

      LEFT JOIN mpn_pengetahuan ph
        ON ph.id = pp.pengetahuan_hasil_id

      JOIN users u
        ON u.id = pp.created_by

      WHERE (? IS NULL OR p.pemilik_instansi_id = ?)

      ORDER BY pp.created_at DESC
    `;

    const [rows] = await db.query(query, [
      instansiId,
      instansiId
    ]);

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'ERROR GET PENGUMPULAN PENGOLAHAN:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    return res.status(500).json({
      message: 'Gagal mengambil data pengumpulan dan pengolahan'
    });
  }
};

exports.createPengumpulanPengolahan = async (req, res) => {
  try {
    const {
      rencana_dokumentasi_id = null,
      pengetahuan_id,
      tanggal_pengumpulan,
      unit_pengumpulan,
      lokasi_penyimpanan = null,
      keterangan_lokasi_lainnya = null,
      status_publikasi_simpan = null,
      metode_pengolahan = null,
      deskripsi_pengolahan = null,
      pengetahuan_hasil_id = null
    } = req.body;

    const createdBy = Number(req.user?.id);
    const instansiId = await getUserInstansiId(req);
    const pengetahuanId = Number(pengetahuan_id);
    const unitPengumpulan = String(unit_pengumpulan || '').trim();

    if (!Number.isInteger(createdBy) || createdBy <= 0) {
      return res.status(401).json({
        message: 'Pengguna belum terautentikasi'
      });
    }

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_pengumpulan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pengumpulan)
    ) {
      return res.status(400).json({
        message: 'Tanggal pengumpulan wajib diisi dengan benar'
      });
    }

    if (!unitPengumpulan) {
      return res.status(400).json({
        message: 'Unit Pengumpulan wajib diisi'
      });
    }

    if (unitPengumpulan.length > 255) {
      return res.status(400).json({
        message: 'Unit Pengumpulan maksimal 255 karakter'
      });
    }

    const [pengetahuan] = await db.query(
      `
      SELECT id, pemilik_instansi_id
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

    if (
      instansiId !== null &&
      Number(pengetahuan[0].pemilik_instansi_id) !== instansiId
    ) {
      return res.status(403).json({
        message: 'Pengetahuan bukan milik instansi Anda'
      });
    }

    const instansiPengetahuanId = Number(
      pengetahuan[0].pemilik_instansi_id
    );

    if (
      !Number.isInteger(instansiPengetahuanId) ||
      instansiPengetahuanId <= 0
    ) {
      return res.status(400).json({
        message: 'Instansi pemilik pengetahuan belum ditentukan'
      });
    }

    let rencanaDokumentasiId = null;

    if (
      rencana_dokumentasi_id !== null &&
      rencana_dokumentasi_id !== ''
    ) {
      rencanaDokumentasiId = Number(rencana_dokumentasi_id);

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
          rd.id,
          rd.pengetahuan_id,
          p.instansi_id
        FROM mpn_rencana_dokumentasi rd
        JOIN mpn_perencanaan p
          ON p.id = rd.perencanaan_id
        WHERE rd.id = ?
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
        Number(rencana[0].pengetahuan_id) !== pengetahuanId ||
        Number(rencana[0].instansi_id) !== instansiPengetahuanId
      ) {
        return res.status(400).json({
          message: 'Rencana dokumentasi tidak sesuai dengan pengetahuan'
        });
      }
    }

    let pengetahuanHasilId = null;

    if (
      pengetahuan_hasil_id !== null &&
      pengetahuan_hasil_id !== ''
    ) {
      pengetahuanHasilId = Number(pengetahuan_hasil_id);

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
          AND pemilik_instansi_id = ?
        LIMIT 1
        `,
        [pengetahuanHasilId, instansiPengetahuanId]
      );

      if (hasil.length === 0) {
        return res.status(400).json({
          message: 'Pengetahuan hasil tidak ditemukan pada instansi ini'
        });
      }
    }

    if (
      lokasi_penyimpanan &&
      String(lokasi_penyimpanan).length > 255
    ) {
      return res.status(400).json({
        message: 'Lokasi penyimpanan maksimal 255 karakter'
      });
    }

    if (
      status_publikasi_simpan &&
      String(status_publikasi_simpan).length > 100
    ) {
      return res.status(400).json({
        message: 'Status publikasi/simpan maksimal 100 karakter'
      });
    }

    if (
      metode_pengolahan &&
      String(metode_pengolahan).length > 150
    ) {
      return res.status(400).json({
        message: 'Metode pengolahan maksimal 150 karakter'
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO mpn_pengumpulan_pengolahan (
        rencana_dokumentasi_id,
        pengetahuan_id,
        tanggal_pengumpulan,
        unit_pengumpulan_id,
        unit_pengumpulan,
        lokasi_penyimpanan,
        keterangan_lokasi_lainnya,
        status_publikasi_simpan,
        metode_pengolahan,
        deskripsi_pengolahan,
        pengetahuan_hasil_id,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        rencanaDokumentasiId,
        pengetahuanId,
        tanggal_pengumpulan,
        null,
        unitPengumpulan,
        lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya || null,
        status_publikasi_simpan || null,
        metode_pengolahan || null,
        deskripsi_pengolahan || null,
        pengetahuanHasilId,
        createdBy
      ]
    );

    return res.status(201).json({
      message: 'Data pengumpulan dan pengolahan berhasil disimpan',
      data: {
        id: result.insertId,
        rencana_dokumentasi_id: rencanaDokumentasiId,
        pengetahuan_id: pengetahuanId,
        tanggal_pengumpulan,
        unit_pengumpulan_id: null,
        unit_pengumpulan: unitPengumpulan,
        lokasi_penyimpanan: lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya: keterangan_lokasi_lainnya || null,
        status_publikasi_simpan: status_publikasi_simpan || null,
        metode_pengolahan: metode_pengolahan || null,
        deskripsi_pengolahan: deskripsi_pengolahan || null,
        pengetahuan_hasil_id: pengetahuanHasilId,
        created_by: createdBy
      }
    });
  } catch (error) {
    console.error('ERROR CREATE PENGUMPULAN PENGOLAHAN:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
        COALESCE(pp.unit_pengumpulan, uk.nama_unit) AS unit_pengumpulan,

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

      LEFT JOIN unit_kerja uk
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
      unit_pengumpulan,
      lokasi_penyimpanan = null,
      keterangan_lokasi_lainnya = null,
      status_publikasi_simpan = null,
      metode_pengolahan = null,
      deskripsi_pengolahan = null,
      pengetahuan_hasil_id = null
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pengumpulan dan pengolahan tidak valid'
      });
    }

    const instansiAkunId = await getUserInstansiId(req);
    const pengetahuanId = Number(pengetahuan_id);
    const unitPengumpulan = String(unit_pengumpulan || '').trim();

    const [existingData] = await db.query(
      `
      SELECT
        pp.id,
        pp.pengetahuan_id,
        p.pemilik_instansi_id
      FROM mpn_pengumpulan_pengolahan pp
      JOIN mpn_pengetahuan p
        ON p.id = pp.pengetahuan_id
      WHERE pp.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existingData.length === 0) {
      return res.status(404).json({
        message: 'Data pengumpulan dan pengolahan tidak ditemukan'
      });
    }

    const instansiDataId = Number(
      existingData[0].pemilik_instansi_id
    );

    if (
      instansiAkunId !== null &&
      instansiDataId !== instansiAkunId
    ) {
      return res.status(403).json({
        message: 'Anda tidak memiliki akses untuk mengubah data instansi lain'
      });
    }

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_pengumpulan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pengumpulan)
    ) {
      return res.status(400).json({
        message: 'Tanggal pengumpulan wajib diisi dengan format yang benar'
      });
    }

    const tanggal = new Date(`${tanggal_pengumpulan}T00:00:00Z`);

    if (
      Number.isNaN(tanggal.getTime()) ||
      tanggal.toISOString().slice(0, 10) !== tanggal_pengumpulan
    ) {
      return res.status(400).json({
        message: 'Tanggal pengumpulan tidak valid'
      });
    }

    if (!unitPengumpulan) {
      return res.status(400).json({
        message: 'Unit Pengumpulan wajib diisi'
      });
    }

    if (unitPengumpulan.length > 255) {
      return res.status(400).json({
        message: 'Unit Pengumpulan maksimal 255 karakter'
      });
    }

    const [pengetahuan] = await db.query(
      `
      SELECT id, pemilik_instansi_id
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

    const instansiPengetahuanId = Number(
      pengetahuan[0].pemilik_instansi_id
    );

    if (
      instansiPengetahuanId !== instansiDataId ||
      (
        instansiAkunId !== null &&
        instansiPengetahuanId !== instansiAkunId
      )
    ) {
      return res.status(403).json({
        message: 'Pengetahuan harus berasal dari instansi yang sama'
      });
    }

    let rencanaDokumentasiId = null;

    if (
      rencana_dokumentasi_id !== null &&
      rencana_dokumentasi_id !== ''
    ) {
      rencanaDokumentasiId = Number(rencana_dokumentasi_id);

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
          rd.id,
          rd.pengetahuan_id,
          p.instansi_id
        FROM mpn_rencana_dokumentasi rd
        JOIN mpn_perencanaan p
          ON p.id = rd.perencanaan_id
        WHERE rd.id = ?
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
        Number(rencana[0].pengetahuan_id) !== pengetahuanId ||
        Number(rencana[0].instansi_id) !== instansiDataId
      ) {
        return res.status(400).json({
          message: 'Rencana dokumentasi tidak sesuai dengan pengetahuan'
        });
      }
    }

    let pengetahuanHasilId = null;

    if (
      pengetahuan_hasil_id !== null &&
      pengetahuan_hasil_id !== ''
    ) {
      pengetahuanHasilId = Number(pengetahuan_hasil_id);

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
          AND pemilik_instansi_id = ?
        LIMIT 1
        `,
        [pengetahuanHasilId, instansiDataId]
      );

      if (hasil.length === 0) {
        return res.status(400).json({
          message: 'Pengetahuan hasil tidak ditemukan pada instansi ini'
        });
      }
    }

    if (
      lokasi_penyimpanan !== null &&
      (
        typeof lokasi_penyimpanan !== 'string' ||
        lokasi_penyimpanan.length > 255
      )
    ) {
      return res.status(400).json({
        message: 'Lokasi penyimpanan maksimal 255 karakter'
      });
    }

    if (
      status_publikasi_simpan !== null &&
      (
        typeof status_publikasi_simpan !== 'string' ||
        status_publikasi_simpan.length > 100
      )
    ) {
      return res.status(400).json({
        message: 'Status publikasi/simpan maksimal 100 karakter'
      });
    }

    if (
      metode_pengolahan !== null &&
      (
        typeof metode_pengolahan !== 'string' ||
        metode_pengolahan.length > 150
      )
    ) {
      return res.status(400).json({
        message: 'Metode pengolahan maksimal 150 karakter'
      });
    }

    const [result] = await db.query(
      `
      UPDATE mpn_pengumpulan_pengolahan
      SET
        rencana_dokumentasi_id = ?,
        pengetahuan_id = ?,
        tanggal_pengumpulan = ?,
        unit_pengumpulan_id = NULL,
        unit_pengumpulan = ?,
        lokasi_penyimpanan = ?,
        keterangan_lokasi_lainnya = ?,
        status_publikasi_simpan = ?,
        metode_pengolahan = ?,
        deskripsi_pengolahan = ?,
        pengetahuan_hasil_id = ?
      WHERE id = ?
        AND pengetahuan_id IN (
          SELECT id
          FROM mpn_pengetahuan
          WHERE pemilik_instansi_id = ?
        )
      `,
      [
        rencanaDokumentasiId,
        pengetahuanId,
        tanggal_pengumpulan,
        unitPengumpulan,
        lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya || null,
        status_publikasi_simpan || null,
        metode_pengolahan || null,
        deskripsi_pengolahan || null,
        pengetahuanHasilId,
        id,
        instansiDataId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(409).json({
        message: 'Data tidak dapat diperbarui'
      });
    }

    return res.status(200).json({
      message: 'Data pengumpulan dan pengolahan berhasil diperbarui',
      data: {
        id,
        rencana_dokumentasi_id: rencanaDokumentasiId,
        pengetahuan_id: pengetahuanId,
        tanggal_pengumpulan,
        unit_pengumpulan_id: null,
        unit_pengumpulan: unitPengumpulan,
        lokasi_penyimpanan: lokasi_penyimpanan || null,
        keterangan_lokasi_lainnya: keterangan_lokasi_lainnya || null,
        status_publikasi_simpan: status_publikasi_simpan || null,
        metode_pengolahan: metode_pengolahan || null,
        deskripsi_pengolahan: deskripsi_pengolahan || null,
        pengetahuan_hasil_id: pengetahuanHasilId
      }
    });
  } catch (error) {
    console.error('ERROR UPDATE PENGUMPULAN PENGOLAHAN:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};


exports.deletePengumpulanPengolahan = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const instansiId = await getUserInstansiId(req);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pengumpulan dan pengolahan tidak valid'
      });
    }

    if (
      instansiId !== null &&
      (!Number.isInteger(Number(instansiId)) || Number(instansiId) <= 0)
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid'
      });
    }

    const [data] = await db.query(
      `
      SELECT pp.id
      FROM mpn_pengumpulan_pengolahan pp
      JOIN mpn_pengetahuan p
        ON p.id = pp.pengetahuan_id
      WHERE pp.id = ?
        AND (? IS NULL OR p.pemilik_instansi_id = ?)
      LIMIT 1
      `,
      [id, instansiId, instansiId]
    );

    if (data.length === 0) {
      return res.status(404).json({
        message: 'Data tidak ditemukan atau tidak dapat diakses'
      });
    }

    const [result] = await db.query(
      `
      DELETE pp
      FROM mpn_pengumpulan_pengolahan pp
      JOIN mpn_pengetahuan p
        ON p.id = pp.pengetahuan_id
      WHERE pp.id = ?
        AND (? IS NULL OR p.pemilik_instansi_id = ?)
      `,
      [id, instansiId, instansiId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Data tidak ditemukan atau tidak dapat diakses'
      });
    }

    return res.status(200).json({
      message: 'Data pengumpulan dan pengolahan berhasil dihapus'
    });

  } catch (error) {
    console.error(
      'ERROR DELETE PENGUMPULAN PENGOLAHAN:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
    const instansiId = await getUserInstansiId(req);

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
        COALESCE(
          pm.unit_pengguna,
          uk.nama_unit
        ) AS unit_pengguna,

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

      WHERE (? IS NULL OR p.pemilik_instansi_id = ?)

      ORDER BY pm.created_at DESC, pm.id DESC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });

  } catch (error) {
    console.error(
      'ERROR GET PEMANFAATAN PENGETAHUAN:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
      unit_pengguna = null,
      tujuan_pemanfaatan,
      rating_pengetahuan = null
    } = req.body;

    const created_by = Number(req.user?.id);
    const instansiId = await getUserInstansiId(req);
    const pengetahuanId = Number(pengetahuan_id);

    if (!Number.isInteger(created_by) || created_by <= 0) {
      return res.status(401).json({
        message: 'Pengguna belum terautentikasi'
      });
    }

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_pemanfaatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pemanfaatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal pemanfaatan harus menggunakan format YYYY-MM-DD'
      });
    }

    const tanggal = new Date(`${tanggal_pemanfaatan}T00:00:00Z`);

    if (
      Number.isNaN(tanggal.getTime()) ||
      tanggal.toISOString().slice(0, 10) !== tanggal_pemanfaatan
    ) {
      return res.status(400).json({
        message: 'Tanggal pemanfaatan tidak valid'
      });
    }

    if (!['Publik', 'Internal'].includes(jenis_pengguna)) {
      return res.status(400).json({
        message: 'Jenis pengguna harus Publik atau Internal'
      });
    }

    let unitPengguna = null;

    if (jenis_pengguna === 'Internal') {
      if (typeof unit_pengguna !== 'string') {
        return res.status(400).json({
          message: 'Unit Pengguna wajib diisi untuk pengguna internal'
        });
      }

      unitPengguna = unit_pengguna.trim();

      if (!unitPengguna) {
        return res.status(400).json({
          message: 'Unit Pengguna wajib diisi untuk pengguna internal'
        });
      }

      if (unitPengguna.length > 255) {
        return res.status(400).json({
          message: 'Unit Pengguna maksimal 255 karakter'
        });
      }
    }

    if (
      typeof tujuan_pemanfaatan !== 'string' ||
      !tujuan_pemanfaatan.trim()
    ) {
      return res.status(400).json({
        message: 'Tujuan pemanfaatan wajib diisi'
      });
    }

    const [pengetahuan] = await db.query(
      `
      SELECT id, pemilik_instansi_id
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

    if (
      instansiId !== null &&
      Number(pengetahuan[0].pemilik_instansi_id) !== Number(instansiId)
    ) {
      return res.status(403).json({
        message: 'Pengetahuan bukan milik instansi akun ini'
      });
    }

    let ratingPengetahuan = null;

    if (
      rating_pengetahuan !== null &&
      rating_pengetahuan !== ''
    ) {
      ratingPengetahuan = Number(rating_pengetahuan);

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

    const [result] = await db.query(
      `
      INSERT INTO mpn_pemanfaatan
      (
        pengetahuan_id,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unit_pengguna_id,
        unit_pengguna,
        tujuan_pemanfaatan,
        rating_pengetahuan,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        pengetahuanId,
        tanggal_pemanfaatan,
        jenis_pengguna,
        null,
        unitPengguna,
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
        unit_pengguna_id: null,
        unit_pengguna: unitPengguna,
        tujuan_pemanfaatan: tujuan_pemanfaatan.trim(),
        rating_pengetahuan: ratingPengetahuan,
        created_by
      }
    });

  } catch (error) {
    console.error(
      'ERROR CREATE PEMANFAATAN PENGETAHUAN:',
      error
    );

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
      unit_pengguna = null,
      tujuan_pemanfaatan,
      rating_pengetahuan = null
    } = req.body;

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID pemanfaatan tidak valid'
      });
    }

    const instansiId = await getUserInstansiId(req);

    const [existing] = await db.query(
      `
      SELECT
        pm.id,
        p.pemilik_instansi_id
      FROM mpn_pemanfaatan pm
      JOIN mpn_pengetahuan p
        ON p.id = pm.pengetahuan_id
      WHERE pm.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Data pemanfaatan pengetahuan tidak ditemukan'
      });
    }

    if (
      instansiId !== null &&
      Number(existing[0].pemilik_instansi_id) !== Number(instansiId)
    ) {
      return res.status(403).json({
        message: 'Anda tidak memiliki akses untuk mengubah data instansi lain'
      });
    }

    const pengetahuanId = Number(pengetahuan_id);

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_pemanfaatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_pemanfaatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal pemanfaatan harus menggunakan format YYYY-MM-DD'
      });
    }

    const tanggal = new Date(`${tanggal_pemanfaatan}T00:00:00Z`);

    if (
      Number.isNaN(tanggal.getTime()) ||
      tanggal.toISOString().slice(0, 10) !== tanggal_pemanfaatan
    ) {
      return res.status(400).json({
        message: 'Tanggal pemanfaatan tidak valid'
      });
    }

    if (!['Publik', 'Internal'].includes(jenis_pengguna)) {
      return res.status(400).json({
        message: 'Jenis pengguna harus Publik atau Internal'
      });
    }

    let unitPengguna = null;

    if (jenis_pengguna === 'Internal') {
      if (typeof unit_pengguna !== 'string') {
        return res.status(400).json({
          message: 'Unit Pengguna wajib diisi untuk pengguna internal'
        });
      }

      unitPengguna = unit_pengguna.trim();

      if (!unitPengguna) {
        return res.status(400).json({
          message: 'Unit Pengguna wajib diisi untuk pengguna internal'
        });
      }

      if (unitPengguna.length > 255) {
        return res.status(400).json({
          message: 'Unit Pengguna maksimal 255 karakter'
        });
      }
    }

    if (
      typeof tujuan_pemanfaatan !== 'string' ||
      !tujuan_pemanfaatan.trim()
    ) {
      return res.status(400).json({
        message: 'Tujuan pemanfaatan wajib diisi'
      });
    }

    const [pengetahuan] = await db.query(
      `
      SELECT id, pemilik_instansi_id
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

    if (
      instansiId !== null &&
      Number(pengetahuan[0].pemilik_instansi_id) !== Number(instansiId)
    ) {
      return res.status(403).json({
        message: 'Pengetahuan bukan milik instansi akun ini'
      });
    }

    if (
      Number(pengetahuan[0].pemilik_instansi_id) !==
      Number(existing[0].pemilik_instansi_id)
    ) {
      return res.status(403).json({
        message: 'Pengetahuan harus berasal dari instansi yang sama'
      });
    }

    let ratingPengetahuan = null;

    if (
      rating_pengetahuan !== null &&
      rating_pengetahuan !== ''
    ) {
      ratingPengetahuan = Number(rating_pengetahuan);

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

    const [result] = await db.query(
      `
      UPDATE mpn_pemanfaatan
      SET
        pengetahuan_id = ?,
        tanggal_pemanfaatan = ?,
        jenis_pengguna = ?,
        unit_pengguna_id = NULL,
        unit_pengguna = ?,
        tujuan_pemanfaatan = ?,
        rating_pengetahuan = ?
      WHERE id = ?
        AND pengetahuan_id IN (
          SELECT id
          FROM mpn_pengetahuan
          WHERE pemilik_instansi_id = ?
        )
      `,
      [
        pengetahuanId,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unitPengguna,
        tujuan_pemanfaatan.trim(),
        ratingPengetahuan,
        id,
        Number(existing[0].pemilik_instansi_id)
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Data pemanfaatan tidak ditemukan atau tidak dapat diakses'
      });
    }

    return res.status(200).json({
      message: 'Data pemanfaatan pengetahuan berhasil diperbarui',
      data: {
        id,
        pengetahuan_id: pengetahuanId,
        tanggal_pemanfaatan,
        jenis_pengguna,
        unit_pengguna_id: null,
        unit_pengguna: unitPengguna,
        tujuan_pemanfaatan: tujuan_pemanfaatan.trim(),
        rating_pengetahuan: ratingPengetahuan
      }
    });

  } catch (error) {
    console.error('ERROR UPDATE PEMANFAATAN:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
    const instansiId = await getUserInstansiId(req);

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

      WHERE (? IS NULL OR p.pemilik_instansi_id = ?)

      ORDER BY ap.created_at DESC, ap.id DESC
      `,
      [instansiId, instansiId]
    );

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

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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

    const pengetahuanId = Number(pengetahuan_id);
    const createdBy = Number(req.user?.id);
    const instansiId = await getUserInstansiId(req);

    if (!Number.isInteger(createdBy) || createdBy <= 0) {
      return res.status(401).json({
        message: 'Pengguna belum terautentikasi'
      });
    }

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_kegiatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_kegiatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal kegiatan harus berformat YYYY-MM-DD'
      });
    }

    const tanggal = new Date(`${tanggal_kegiatan}T00:00:00Z`);

    if (
      Number.isNaN(tanggal.getTime()) ||
      tanggal.toISOString().slice(0, 10) !== tanggal_kegiatan
    ) {
      return res.status(400).json({
        message: 'Tanggal kegiatan tidak valid'
      });
    }

    if (
      typeof penerima_pengetahuan !== 'string' ||
      !penerima_pengetahuan.trim()
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

    if (
      lesson_learned_evaluasi !== null &&
      typeof lesson_learned_evaluasi !== 'string'
    ) {
      return res.status(400).json({
        message: 'Lesson Learned / Evaluasi harus berupa teks'
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

    if (
      !Array.isArray(metode_alih) ||
      metode_alih.length === 0 ||
      metode_alih.some(
        (item) =>
          !item ||
          typeof item !== 'object' ||
          !metodeValid.includes(item.metode) ||
          (
            item.keterangan != null &&
            typeof item.keterangan !== 'string'
          ) ||
          (
            item.metode === 'Lainnya' &&
            !String(item.keterangan || '').trim()
          )
      )
    ) {
      return res.status(400).json({
        message: 'Pilih minimal satu metode transfer yang valid dan isi keterangan Lainnya bila dipilih'
      });
    }

    if (
      new Set(metode_alih.map((item) => item.metode)).size !==
      metode_alih.length
    ) {
      return res.status(400).json({
        message: 'Metode transfer tidak boleh duplikat'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [pengetahuan] = await connection.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
        AND (? IS NULL OR pemilik_instansi_id = ?)
      LIMIT 1
      `,
      [pengetahuanId, instansiId, instansiId]
    );

    if (pengetahuan.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: 'Pengetahuan tidak ditemukan atau bukan milik instansi Anda'
      });
    }

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
        createdBy
      ]
    );

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
          result.insertId,
          item.metode,
          item.keterangan || null
        ]
      );
    }

    await connection.commit();

    return res.status(201).json({
      message: 'Data alih pengetahuan berhasil disimpan',
      data: {
        id: result.insertId,
        pengetahuan_id: pengetahuanId,
        tanggal_kegiatan,
        penerima_pengetahuan: penerima_pengetahuan.trim(),
        lesson_learned_evaluasi: lesson_learned_evaluasi || null,
        metode_alih,
        created_by: createdBy
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERROR CREATE ALIH PENGETAHUAN:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
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

exports.getDetailAlihPengetahuan = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID alih pengetahuan tidak valid'
      });
    }

    const instansiId = await getUserInstansiId(req);

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
        AND (? IS NULL OR p.pemilik_instansi_id = ?)

      LIMIT 1
      `,
      [id, instansiId, instansiId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data alih pengetahuan tidak ditemukan atau tidak dapat diakses'
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

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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

    const pengetahuanId = Number(pengetahuan_id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID alih pengetahuan tidak valid'
      });
    }

    if (!Number.isInteger(pengetahuanId) || pengetahuanId <= 0) {
      return res.status(400).json({
        message: 'Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_kegiatan !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_kegiatan)
    ) {
      return res.status(400).json({
        message: 'Tanggal kegiatan harus berformat YYYY-MM-DD'
      });
    }

    const tanggal = new Date(`${tanggal_kegiatan}T00:00:00Z`);

    if (
      Number.isNaN(tanggal.getTime()) ||
      tanggal.toISOString().slice(0, 10) !== tanggal_kegiatan
    ) {
      return res.status(400).json({
        message: 'Tanggal kegiatan tidak valid'
      });
    }

    if (
      typeof penerima_pengetahuan !== 'string' ||
      !penerima_pengetahuan.trim()
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

    if (
      lesson_learned_evaluasi !== null &&
      typeof lesson_learned_evaluasi !== 'string'
    ) {
      return res.status(400).json({
        message: 'Lesson Learned / Evaluasi harus berupa teks'
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

    if (
      !Array.isArray(metode_alih) ||
      metode_alih.length === 0 ||
      metode_alih.some(
        (item) =>
          !item ||
          typeof item !== 'object' ||
          !metodeValid.includes(item.metode) ||
          (
            item.keterangan != null &&
            typeof item.keterangan !== 'string'
          ) ||
          (
            item.metode === 'Lainnya' &&
            !String(item.keterangan || '').trim()
          )
      )
    ) {
      return res.status(400).json({
        message: 'Pilih minimal satu metode transfer yang valid dan isi keterangan Lainnya bila dipilih'
      });
    }

    if (
      new Set(metode_alih.map((item) => item.metode)).size !==
      metode_alih.length
    ) {
      return res.status(400).json({
        message: 'Metode transfer tidak boleh duplikat'
      });
    }

    const instansiId = await getUserInstansiId(req);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `
      SELECT
        ap.id,
        p.pemilik_instansi_id

      FROM mpn_alih_pengetahuan ap

      JOIN mpn_pengetahuan p
        ON p.id = ap.pengetahuan_id

      WHERE ap.id = ?
        AND (? IS NULL OR p.pemilik_instansi_id = ?)

      LIMIT 1
      FOR UPDATE
      `,
      [id, instansiId, instansiId]
    );

    if (existing.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: 'Data alih pengetahuan tidak ditemukan atau tidak dapat diakses'
      });
    }

    const ownerId = Number(
      existing[0].pemilik_instansi_id
    );

    const [pengetahuan] = await connection.query(
      `
      SELECT id
      FROM mpn_pengetahuan
      WHERE id = ?
        AND pemilik_instansi_id = ?
      LIMIT 1
      `,
      [pengetahuanId, ownerId]
    );

    if (pengetahuan.length === 0) {
      await connection.rollback();

      return res.status(400).json({
        message: 'Pengetahuan harus berasal dari instansi yang sama'
      });
    }

    const [result] = await connection.query(
      `
      UPDATE mpn_alih_pengetahuan
      SET
        pengetahuan_id = ?,
        tanggal_kegiatan = ?,
        penerima_pengetahuan = ?,
        lesson_learned_evaluasi = ?
      WHERE id = ?
        AND pengetahuan_id IN (
          SELECT id
          FROM mpn_pengetahuan
          WHERE pemilik_instansi_id = ?
        )
      `,
      [
        pengetahuanId,
        tanggal_kegiatan,
        penerima_pengetahuan.trim(),
        lesson_learned_evaluasi || null,
        id,
        ownerId
      ]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: 'Data alih pengetahuan tidak dapat diperbarui'
      });
    }

    await connection.query(
      `
      DELETE FROM mpn_metode_alih
      WHERE alih_pengetahuan_id = ?
      `,
      [id]
    );

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
        penerima_pengetahuan: penerima_pengetahuan.trim(),
        lesson_learned_evaluasi: lesson_learned_evaluasi || null,
        metode_alih
      }
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERROR UPDATE ALIH PENGETAHUAN:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
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

exports.deleteAlihPengetahuan = async (req, res) => {
  let connection;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID alih pengetahuan tidak valid'
      });
    }

    const instansiId = await getUserInstansiId(req);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [data] = await connection.query(
      `
      SELECT ap.id

      FROM mpn_alih_pengetahuan ap

      JOIN mpn_pengetahuan p
        ON p.id = ap.pengetahuan_id

      WHERE ap.id = ?
        AND (? IS NULL OR p.pemilik_instansi_id = ?)

      LIMIT 1
      FOR UPDATE
      `,
      [id, instansiId, instansiId]
    );

    if (data.length === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: 'Data alih pengetahuan tidak ditemukan atau tidak dapat diakses'
      });
    }

    await connection.query(
      `
      DELETE FROM mpn_metode_alih
      WHERE alih_pengetahuan_id = ?
      `,
      [id]
    );

    const [result] = await connection.query(
      `
      DELETE ap

      FROM mpn_alih_pengetahuan ap

      JOIN mpn_pengetahuan p
        ON p.id = ap.pengetahuan_id

      WHERE ap.id = ?
        AND (? IS NULL OR p.pemilik_instansi_id = ?)
      `,
      [id, instansiId, instansiId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();

      return res.status(404).json({
        message: 'Data alih pengetahuan tidak dapat dihapus'
      });
    }

    await connection.commit();

    return res.status(200).json({
      message: 'Data alih pengetahuan berhasil dihapus'
    });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('ERROR DELETE ALIH PENGETAHUAN:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
    const instansiId = await getUserInstansiId(req);

    const [rows] = await db.query(
      `
      SELECT
        e.id,
        e.indikator_perencanaan_id,
        ip.perencanaan_id,
        ip.kode_indikator,
        ip.nilai_saat_ini,
        ip.nilai_target,
        DATE_FORMAT(e.tanggal_evaluasi, '%Y-%m-%d') AS tanggal_evaluasi,
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
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      JOIN users u
        ON u.id = e.created_by
      WHERE (? IS NULL OR p.instansi_id = ?)
      ORDER BY
        e.tanggal_evaluasi DESC,
        e.created_at DESC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('ERROR GET EVALUASI PENGETAHUAN:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
      analisis,
      tindak_lanjut,
      pelaksana_terkait
    } = req.body;

    const createdBy = Number(req.user?.id);
    const indikatorId = Number(indikator_perencanaan_id);
    const instansiId = await getUserInstansiId(req);

    if (!Number.isInteger(createdBy) || createdBy <= 0) {
      return res.status(401).json({
        message: 'Pengguna belum terautentikasi'
      });
    }

    if (!Number.isInteger(indikatorId) || indikatorId <= 0) {
      return res.status(400).json({
        message: 'Indikator Manajemen Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_evaluasi !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_evaluasi)
    ) {
      return res.status(400).json({
        message: 'Tanggal Evaluasi wajib diisi dengan format YYYY-MM-DD'
      });
    }

    const tanggal = new Date(`${tanggal_evaluasi}T00:00:00Z`);

    if (
      Number.isNaN(tanggal.getTime()) ||
      tanggal.toISOString().slice(0, 10) !== tanggal_evaluasi
    ) {
      return res.status(400).json({
        message: 'Tanggal Evaluasi tidak valid'
      });
    }

    if (
      nilai_realisasi === undefined ||
      nilai_realisasi === null ||
      String(nilai_realisasi).trim() === ''
    ) {
      return res.status(400).json({
        message: 'Realisasi wajib diisi'
      });
    }

    const nilaiRealisasi = Number(nilai_realisasi);

    if (
      !Number.isFinite(nilaiRealisasi) ||
      nilaiRealisasi < 0 ||
      nilaiRealisasi > 100
    ) {
      return res.status(400).json({
        message: 'Nilai Realisasi harus berada antara 0 sampai 100'
      });
    }

    if (typeof analisis !== 'string' || !analisis.trim()) {
      return res.status(400).json({
        message: 'Analisis wajib diisi'
      });
    }

    if (
      typeof tindak_lanjut !== 'string' ||
      !tindak_lanjut.trim()
    ) {
      return res.status(400).json({
        message: 'Tindak Lanjut wajib diisi'
      });
    }

    if (
      typeof pelaksana_terkait !== 'string' ||
      !pelaksana_terkait.trim()
    ) {
      return res.status(400).json({
        message: 'Pelaksana Terkait wajib diisi'
      });
    }

    if (pelaksana_terkait.trim().length > 255) {
      return res.status(400).json({
        message: 'Pelaksana Terkait maksimal 255 karakter'
      });
    }

    const [indikator] = await db.query(
      `
      SELECT
        ip.id,
        ip.perencanaan_id,
        ip.kode_indikator,
        ip.nilai_target,
        p.instansi_id
      FROM mpn_indikator_perencanaan ip
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      WHERE ip.id = ?
        AND (? IS NULL OR p.instansi_id = ?)
      LIMIT 1
      `,
      [indikatorId, instansiId, instansiId]
    );

    if (indikator.length === 0) {
      return res.status(404).json({
        message: 'Indikator tidak ditemukan atau bukan milik instansi Anda'
      });
    }

    const [existing] = await db.query(
      `
      SELECT id
      FROM mpn_evaluasi
      WHERE indikator_perencanaan_id = ?
        AND tanggal_evaluasi = ?
      LIMIT 1
      `,
      [indikatorId, tanggal_evaluasi]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        message: 'Evaluasi indikator pada tanggal tersebut sudah tersedia'
      });
    }

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
      SELECT
        ip.id,
        ?,
        ?,
        ?,
        ?,
        ?,
        ?
      FROM mpn_indikator_perencanaan ip
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      WHERE ip.id = ?
        AND (? IS NULL OR p.instansi_id = ?)
      `,
      [
        tanggal_evaluasi,
        nilaiRealisasi,
        analisis.trim(),
        tindak_lanjut.trim(),
        pelaksana_terkait.trim(),
        createdBy,
        indikatorId,
        instansiId,
        instansiId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({
        message: 'Anda tidak memiliki akses ke indikator tersebut'
      });
    }

    return res.status(201).json({
      message: 'Data evaluasi berhasil disimpan',
      data: {
        id: result.insertId,
        indikator_perencanaan_id: indikatorId,
        tanggal_evaluasi,
        nilai_realisasi: nilaiRealisasi,
        analisis: analisis.trim(),
        tindak_lanjut: tindak_lanjut.trim(),
        pelaksana_terkait: pelaksana_terkait.trim(),
        created_by: createdBy
      }
    });
  } catch (error) {
    console.error('ERROR CREATE EVALUASI:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Evaluasi indikator pada tanggal tersebut sudah tersedia'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
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

    const instansiId = await getUserInstansiId(req);

    const [rows] = await db.query(
      `
      SELECT
        e.id,
        e.indikator_perencanaan_id,
        ip.perencanaan_id,
        ip.kode_indikator,
        ip.nilai_saat_ini,
        ip.nilai_target,
        DATE_FORMAT(e.tanggal_evaluasi, '%Y-%m-%d') AS tanggal_evaluasi,
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
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      JOIN users u
        ON u.id = e.created_by
      WHERE e.id = ?
        AND (? IS NULL OR p.instansi_id = ?)
      LIMIT 1
      `,
      [id, instansiId, instansiId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data evaluasi tidak ditemukan atau tidak dapat diakses'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error('ERROR GET DETAIL EVALUASI:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

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
      analisis,
      tindak_lanjut,
      pelaksana_terkait
    } = req.body;

    const indikatorId = Number(indikator_perencanaan_id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID evaluasi tidak valid'
      });
    }

    if (!Number.isInteger(indikatorId) || indikatorId <= 0) {
      return res.status(400).json({
        message: 'Indikator Manajemen Pengetahuan wajib dipilih'
      });
    }

    if (
      typeof tanggal_evaluasi !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tanggal_evaluasi)
    ) {
      return res.status(400).json({
        message: 'Tanggal Evaluasi wajib menggunakan format YYYY-MM-DD'
      });
    }

    const tanggal = new Date(`${tanggal_evaluasi}T00:00:00Z`);

    if (
      Number.isNaN(tanggal.getTime()) ||
      tanggal.toISOString().slice(0, 10) !== tanggal_evaluasi
    ) {
      return res.status(400).json({
        message: 'Tanggal Evaluasi tidak valid'
      });
    }

    if (
      nilai_realisasi === undefined ||
      nilai_realisasi === null ||
      String(nilai_realisasi).trim() === ''
    ) {
      return res.status(400).json({
        message: 'Realisasi wajib diisi'
      });
    }

    const nilaiRealisasi = Number(nilai_realisasi);

    if (
      !Number.isFinite(nilaiRealisasi) ||
      nilaiRealisasi < 0 ||
      nilaiRealisasi > 100
    ) {
      return res.status(400).json({
        message: 'Nilai Realisasi harus berada antara 0 sampai 100'
      });
    }

    if (typeof analisis !== 'string' || !analisis.trim()) {
      return res.status(400).json({
        message: 'Analisis wajib diisi'
      });
    }

    if (
      typeof tindak_lanjut !== 'string' ||
      !tindak_lanjut.trim()
    ) {
      return res.status(400).json({
        message: 'Tindak Lanjut wajib diisi'
      });
    }

    if (
      typeof pelaksana_terkait !== 'string' ||
      !pelaksana_terkait.trim()
    ) {
      return res.status(400).json({
        message: 'Pelaksana Terkait wajib diisi'
      });
    }

    if (pelaksana_terkait.trim().length > 255) {
      return res.status(400).json({
        message: 'Pelaksana Terkait maksimal 255 karakter'
      });
    }

    const instansiId = await getUserInstansiId(req);

    const [existing] = await db.query(
      `
      SELECT
        e.id,
        p.instansi_id
      FROM mpn_evaluasi e
      JOIN mpn_indikator_perencanaan ip
        ON ip.id = e.indikator_perencanaan_id
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      WHERE e.id = ?
        AND (? IS NULL OR p.instansi_id = ?)
      LIMIT 1
      `,
      [id, instansiId, instansiId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Data evaluasi tidak ditemukan atau bukan milik instansi Anda'
      });
    }

    const pemilikInstansiId = Number(existing[0].instansi_id);

    const [indikator] = await db.query(
      `
      SELECT ip.id
      FROM mpn_indikator_perencanaan ip
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      WHERE ip.id = ?
        AND p.instansi_id = ?
      LIMIT 1
      `,
      [indikatorId, pemilikInstansiId]
    );

    if (indikator.length === 0) {
      return res.status(400).json({
        message: 'Indikator harus berasal dari instansi yang sama'
      });
    }

    const [duplicate] = await db.query(
      `
      SELECT id
      FROM mpn_evaluasi
      WHERE indikator_perencanaan_id = ?
        AND tanggal_evaluasi = ?
        AND id <> ?
      LIMIT 1
      `,
      [indikatorId, tanggal_evaluasi, id]
    );

    if (duplicate.length > 0) {
      return res.status(409).json({
        message: 'Evaluasi indikator pada tanggal tersebut sudah tersedia'
      });
    }

    const [result] = await db.query(
      `
      UPDATE mpn_evaluasi e
      JOIN mpn_indikator_perencanaan ip_lama
        ON ip_lama.id = e.indikator_perencanaan_id
      JOIN mpn_perencanaan p_lama
        ON p_lama.id = ip_lama.perencanaan_id
      JOIN mpn_indikator_perencanaan ip_baru
        ON ip_baru.id = ?
      JOIN mpn_perencanaan p_baru
        ON p_baru.id = ip_baru.perencanaan_id
      SET
        e.indikator_perencanaan_id = ?,
        e.tanggal_evaluasi = ?,
        e.nilai_realisasi = ?,
        e.analisis = ?,
        e.tindak_lanjut = ?,
        e.pelaksana_terkait = ?
      WHERE e.id = ?
        AND p_lama.instansi_id = ?
        AND p_baru.instansi_id = p_lama.instansi_id
        AND (? IS NULL OR p_lama.instansi_id = ?)
      `,
      [
        indikatorId,
        indikatorId,
        tanggal_evaluasi,
        nilaiRealisasi,
        analisis.trim(),
        tindak_lanjut.trim(),
        pelaksana_terkait.trim(),
        id,
        pemilikInstansiId,
        instansiId,
        instansiId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Data evaluasi tidak ditemukan atau tidak dapat diperbarui'
      });
    }

    return res.status(200).json({
      message: 'Data evaluasi berhasil diperbarui',
      data: {
        id,
        indikator_perencanaan_id: indikatorId,
        tanggal_evaluasi,
        nilai_realisasi: nilaiRealisasi,
        analisis: analisis.trim(),
        tindak_lanjut: tindak_lanjut.trim(),
        pelaksana_terkait: pelaksana_terkait.trim()
      }
    });
  } catch (error) {
    console.error('ERROR UPDATE EVALUASI:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Evaluasi indikator pada tanggal tersebut sudah tersedia'
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

    const instansiId = await getUserInstansiId(req);

    const [result] = await db.query(
      `
      DELETE e
      FROM mpn_evaluasi e
      JOIN mpn_indikator_perencanaan ip
        ON ip.id = e.indikator_perencanaan_id
      JOIN mpn_perencanaan p
        ON p.id = ip.perencanaan_id
      WHERE e.id = ?
        AND (? IS NULL OR p.instansi_id = ?)
      `,
      [id, instansiId, instansiId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Data evaluasi tidak ditemukan atau tidak dapat diakses'
      });
    }

    return res.status(200).json({
      message: 'Data evaluasi berhasil dihapus'
    });
  } catch (error) {
    console.error('ERROR DELETE EVALUASI:', error);

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid atau belum terdaftar'
      });
    }

    if (
      error.code === 'ER_ROW_IS_REFERENCED_2' ||
      error.code === 'ER_ROW_IS_REFERENCED'
    ) {
      return res.status(409).json({
        message: 'Data evaluasi tidak dapat dihapus karena masih digunakan'
      });
    }

    return res.status(500).json({
      message: 'Terjadi kesalahan pada server'
    });
  }
};