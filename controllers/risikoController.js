const db = require('../config/db');

const fs = require('fs');
const path = require('path');

// 1. Tambah Data Risiko (Form 1.0)
exports.createRisiko = async (req, res) => {
    const { 
        konteks_id,

        // a. identifikasi risiko
        sasaran_pembangunan_nasional,
        sasaran_upr,
        indikator_kinerja,
        kode_risiko,
        peristiwa_risiko,

        // b. analisis dan evaluasi risiko
        kategori_risiko, 
        penyebab, 
        dampak, 
        area_dampak,
        kemungkinan, 
        nilai_dampak, 
        prioritas_risiko,

        // c. perlakuan risiko
        keputusan_perlakuan,
        deskripsi_detail_perlakuan,
        waktu_rencana_perlakuan,
        penanggung_jawab_id,
        
        // d. risiko residual
        level_kemungkinan_residual,
        level_dampak_residual,

        // e. kolom tambahan
        layanan_id,
        layanan_prioritas_id,
        pemilik_layanan,
        strategis_operasional,
        lintas_sektor,
        membutuhkan_perubahan,

        ippd_ids

    } = req.body;
    
    const created_by = req.user ? req.user.id : null; 

    try {
        const query = `
            INSERT INTO mr_risiko (
            konteks_id,
            sasaran_pembangunan_nasional,
            sasaran_upr,
            indikator_kinerja,
            kode_risiko,
            peristiwa_risiko,
            kategori_risiko,
            penyebab,
            dampak,
            area_dampak,
            kemungkinan,
            nilai_dampak,
            prioritas_risiko,
            keputusan_perlakuan,
            deskripsi_detail_perlakuan,
            waktu_rencana_perlakuan,
            penanggung_jawab_id,
            level_kemungkinan_residual,
            level_dampak_residual,
            layanan_id,
            layanan_prioritas_id,
            pemilik_layanan,
            strategis_operasional,
            lintas_sektor,
            membutuhkan_perubahan,

            created_by
        ) 
            VALUES (?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?)
        `;
        
        const [result] = await db.query(query, [
            konteks_id || null,

            // a. identifikasi risiko
            sasaran_pembangunan_nasional || null,
            sasaran_upr || null,
            indikator_kinerja || null,
            kode_risiko,
            peristiwa_risiko,

            // b. analisis dan evaluasi Risiko
            kategori_risiko || null,
            penyebab || null,
            dampak || null,
            area_dampak || null,
            kemungkinan || null,
            nilai_dampak || null,
            prioritas_risiko || null,

            // c. perlakuan risiko
            keputusan_perlakuan || null,
            deskripsi_detail_perlakuan || null,
            waktu_rencana_perlakuan || null,
            penanggung_jawab_id || null,

            // d. risiko residual
            level_kemungkinan_residual || null,
            level_dampak_residual || null,

            // e. kolom tambahan
            layanan_id || null,
            layanan_prioritas_id || null,
            pemilik_layanan || null,
            strategis_operasional || null,
            lintas_sektor ? 1 : 0,
            membutuhkan_perubahan ? 1 : 0, 

            
            created_by
        ]);

        res.status(201).json({ 
            message: 'Data Risiko berhasil ditambahkan!' 
        });

        const risikoId = result.insertId;

        if (Array.isArray(ippd_ids) && ippd_ids.length > 0) {
            const values = ippd_ids.map((instansiId) => [
                risikoId,
                instansiId
            ]);

            await db.query(
                `
                INSERT INTO mr_risiko_IPPD (
                    risiko_id,
                    instansi_id
                )
                VALUES ?
                `,
                [values]
            );
        }

    } catch (error) {
        console.error('ERROR DATABASE:', error); 
        
        res.status(500).json({ 
            error: error.message });
    }
};

// 2. Ambil Semua Data Risiko
exports.getAllRisiko = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u.nama AS pembuat,
            k.nama_upr AS konteks_nama_upr,
            k.tahun_pelaksanaan AS konteks_tahun
            FROM mr_risiko r 
            LEFT JOIN users u 
              ON r.created_by = u.id 
            LEFT JOIN mr_konteks k
              ON r.konteks_id = k.id
            ORDER BY r.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('ERROR DATABASE:', error);
        res.status(500).json({ error: error.message });
    }
};

// 3. ambil penanggung jawab di step 3
exports.getPenanggungJawabOptions = async (req, res) => {
    try {
        const [rows] = await db.query (`
            SELECT 
                u.id,
                u.nama,
                u.upr_instansi,
                r.nama_role
            FROM users u
            LEFT JOIN roles r ON r.id = u.role_id
            ORDER BY u.nama ASC
        `);
        
        res.json(rows);
    } catch (error) {
        console.error('ERROR DATABASE:', error);

        res.status(500).json({
            error : error.message
        });
    }
}

// 4. mengambil daftar layanan pendukung
exports.getLayananOptions = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                kode_layanan,
                nama_layanan
            FROM layanan_digital
            WHERE status = 'Aktif'
            ORDER BY nama_layanan ASC
        `);

        res.json(rows);
    } catch (error) {
        console.error('ERROR DATABASE:', error);

        res.status(500).json({
            error: error.message
        });
    }
}

// 5. mengambil daftar layanan prioritas
exports.getLayananPrioritasOptions = async (req, res) => {
    try {
        const [rows] =await db.query(`
            SELECT 
                lp.id,
                lp.kode_prioritas,
                ld.nama_layanan
            FROM layanan_prioritas lp
            JOIN layanan_digital ld
                ON ld.id = lp.layanan_id
            ORDER BY lp.kode_prioritas ASC
        `);

        res.json(rows);
    
    } catch (error) {
        console.error('ERROR DATABASE:', error);

        res.status(500).json({
            error: error.message
        });
    }
};

// 6. mengambil daftar ippd/instansi terkait
exports.getIppdOptions = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                id,
                kode_instansi,
                nama_instansi,
                jenis_instansi
            FROM instansi
            WHERE status = 'Aktif'
            ORDER BY nama_instansi ASC
        `);
        
        res.json(rows);
    } catch (error) {
        console.error('ERROR DATABASE:', error);

        res.status(500).json({
            error: error.message
        });
    }
};

// 7. mengambil detail risiko berdasarkan id
exports.getRisikoById = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await db.query(`
            SELECT 
                r.*,
                pembuat.nama AS nama_pembuat,
                pj.nama AS nama_penanggung_jawab,
                ld.kode_layanan,
                ld.nama_layanan,
                lp.kode_prioritas,
                k.nama_upr AS konteks_nama_upr,
                k.tahun_pelaksanaan AS konteks_tahun
            FROM mr_risiko r

            LEFT JOIN users pembuat
                ON pembuat.id = r.created_by
                
            LEFT JOIN users pj
                ON pj.id = r.penanggung_jawab_id

            LEFT JOIN layanan_digital ld
                ON ld.id = r.layanan_id
                
            LEFT JOIN layanan_prioritas lp
                ON lp.id = r.layanan_prioritas_id

            LEFT JOIN mr_konteks k
                ON k.id = r.konteks_id

            WHERE r.id = ?
            LIMIT 1
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data risiko tidak ditemukan'
            });
        }

        const risiko = rows[0];
        const [ippdRows] = await db.query(`
            SELECT 
                i.id,
                i.kode_instansi,
                i.nama_instansi
            FROM mr_risiko_ippd mri
            JOIN instansi i
                ON i.id = mri.instansi_id
            WHERE mri.risiko_id = ?
            ORDER BY i.nama_instansi ASC
        `, [id]);

        risiko.ippd_terkait = ippdRows;

        res.json(risiko);
    
    } catch (error) {
        console.error('ERROR DATABASE:', error);

        res.status(500).json({
            error: error.message
        });
    }
};

// 8. Mengupdate tabel risiko
exports.updateRisiko = async (req, res) => {
  const { id } = req.params;

  const {
    sasaran_pembangunan_nasional,
    sasaran_upr,
    indikator_kinerja,
    kode_risiko,
    peristiwa_risiko,

    kategori_risiko,
    penyebab,
    dampak,
    area_dampak,
    kemungkinan,
    nilai_dampak,
    prioritas_risiko,

    keputusan_perlakuan,
    deskripsi_detail_perlakuan,
    waktu_rencana_perlakuan,
    penanggung_jawab_id,

    level_kemungkinan_residual,
    level_dampak_residual,

    layanan_id,
    layanan_prioritas_id,
    pemilik_layanan,
    strategis_operasional,
    lintas_sektor,
    membutuhkan_perubahan,

    ippd_ids,
  } = req.body;

  try {
    const [existing] = await db.query(
      `
       SELECT id, status_risiko
       FROM mr_risiko 
       WHERE id = ?
       `,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan.',
      });
    }

    if (String (existing[0].status_risiko).trim().toLowerCase() !== 'draft') {
      return res.status(400).json({
        message: 'Hanya risiko berstatus Draft yang dapat diedit',
      });
    }

    await db.query(
      `
      UPDATE mr_risiko
      SET
        sasaran_pembangunan_nasional = ?,
        sasaran_upr = ?,
        indikator_kinerja = ?,
        kode_risiko = ?,
        peristiwa_risiko = ?,

        kategori_risiko = ?,
        penyebab = ?,
        dampak = ?,
        area_dampak = ?,
        kemungkinan = ?,
        nilai_dampak = ?,
        prioritas_risiko = ?,

        keputusan_perlakuan = ?,
        deskripsi_detail_perlakuan = ?,
        waktu_rencana_perlakuan = ?,
        penanggung_jawab_id = ?,

        level_kemungkinan_residual = ?,
        level_dampak_residual = ?,

        layanan_id = ?,
        layanan_prioritas_id = ?,
        pemilik_layanan = ?,
        strategis_operasional = ?,
        lintas_sektor = ?,
        membutuhkan_perubahan = ?

      WHERE id = ?
      `,
      [
        sasaran_pembangunan_nasional,
        sasaran_upr,
        indikator_kinerja,
        kode_risiko,
        peristiwa_risiko,

        kategori_risiko,
        penyebab,
        dampak,
        area_dampak,
        kemungkinan,
        nilai_dampak,
        prioritas_risiko,

        keputusan_perlakuan,
        deskripsi_detail_perlakuan,
        waktu_rencana_perlakuan,
        penanggung_jawab_id,

        level_kemungkinan_residual,
        level_dampak_residual,

        layanan_id,
        layanan_prioritas_id,
        pemilik_layanan,
        strategis_operasional,
        lintas_sektor,
        membutuhkan_perubahan,

        id,
      ]
    );

    // Hapus relasi IPPD lama
    await db.query(
      'DELETE FROM mr_risiko_ippd WHERE risiko_id = ?',
      [id]
    );

    // Simpan kembali IPPD hasil edit
    if (Array.isArray(ippd_ids) && ippd_ids.length > 0) {
      const values = ippd_ids.map((instansiId) => [
        id,
        instansiId,
      ]);

      await db.query(
        `
        INSERT INTO mr_risiko_ippd
          (risiko_id, instansi_id)
        VALUES ?
        `,
        [values]
      );
    }

    res.json({
      message: 'Data risiko berhasil diperbarui.',
    });

  } catch (error) {
    console.error('ERROR UPDATE RISIKO:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Kode risiko sudah digunakan.',
      });
    }

    res.status(500).json({
      error: error.message,
    });
  }
};

// 9. Menghapus data form 1.0
exports.deleteRisiko = async (req, res) => {
  const { id } = req.params;

  try {
    const [existing] = await db.query(
      `SELECT id, status_risiko
       FROM mr_risiko 
       WHERE id = ?`,
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan.',
      });
    }

    if (String(existing[0].status_risiko).trim().toLowerCase() !== 'draft') {
      return res.status(400).json({
        message: 'Hanya risiko berstatus Draft yang dapat diedit',
      });
    }

    await db.query(
      'DELETE FROM mr_risiko_ippd WHERE risiko_id = ?',
      [id]
    );

    await db.query(
      'DELETE FROM mr_risiko WHERE id = ?',
      [id]
    );

    res.json({
      message: 'Data risiko berhasil dihapus.',
    });

  } catch (error) {
    console.error('ERROR DELETE RISIKO:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.submitRisiko = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT id, status_risiko
      FROM mr_risiko
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan.',
      });
    }

    const risiko = rows[0];

    if (risiko.status_risiko !== 'Draft') {
      return res.status(400).json({
        message: 'Hanya risiko berstatus Draft yang dapat diajukan.',
      });
    }

    await db.query(
      `
      UPDATE mr_risiko
      SET status_risiko = 'Diajukan'
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      message: 'Risiko berhasil diajukan.',
      status_risiko: 'Diajukan',
    });

  } catch (error) {
    console.error('ERROR SUBMIT RISIKO:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.approveRisiko = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT id, status_risiko
      FROM mr_risiko
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan.',
      });
    }

    const risiko = rows[0];

    if (risiko.status_risiko !== 'Diajukan') {
      return res.status(400).json({
        message: 'Hanya risiko berstatus Diajukan yang dapat disetujui.',
      });
    }

    await db.query(
      `
      UPDATE mr_risiko
      SET status_risiko = 'Disetujui'
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      message: 'Risiko berhasil disetujui.',
      status_risiko: 'Disetujui',
    });

  } catch (error) {
    console.error('ERROR APPROVE RISIKO:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.rejectRisiko = async (req, res) => {
  const { id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT id, status_risiko
      FROM mr_risiko
      WHERE id = ?
      LIMIT 1
      `,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan.',
      });
    }

    const risiko = rows[0];

    if (risiko.status_risiko !== 'Diajukan') {
      return res.status(400).json({
        message: 'Hanya risiko berstatus Diajukan yang dapat ditolak.',
      });
    }

    await db.query(
      `
      UPDATE mr_risiko
      SET status_risiko = 'Ditolak'
      WHERE id = ?
      `,
      [id]
    );

    res.json({
      message: 'Risiko berhasil ditolak.',
      status_risiko: 'Ditolak',
    });

  } catch (error) {
    console.error('ERROR REJECT RISIKO:', error);

    res.status(500).json({
      error: error.message,
    });
  }
};

// Form 2.0 - Daftar Layanan Digital Prioritas
exports.getForm2Risiko = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                r.id AS risiko_id,
                r.kode_risiko,
                r.besaran_risiko,

                lp.id AS layanan_prioritas_id,
                lp.kode_prioritas,
                ld.nama_layanan AS layanan_prioritas,

                f2.membutuhkan_mkb,
                f2.pic_id,
                pic.nama AS nama_pic,
                f2.target_penyusunan

            FROM mr_risiko r

            INNER JOIN layanan_prioritas lp
                ON lp.id = r.layanan_prioritas_id

            LEFT JOIN layanan_digital ld
                ON ld.id = lp.layanan_id

            LEFT JOIN mr_form2_prioritas f2
                ON f2.risiko_id = r.id

            LEFT JOIN users pic
                ON pic.id = f2.pic_id

            WHERE r.keputusan_perlakuan IN (
                'Mengurangi Risiko',
                'Membagi Risiko'
            )

            ORDER BY r.created_at DESC
        `);

        res.json(rows);

    } catch (error) {
        console.error('ERROR GET FORM 2.0:', error);

        res.status(500).json({
            error: error.message
        });
    }
};

// Form 2.0 - Simpan / Update data manual
exports.saveForm2Risiko = async (req, res) => {
    const { risiko_id } = req.params;

    console.log('PARAM FORM2:', req.params);
    console.log('RISIKO_ID:', risiko_id);

    const {
        membutuhkan_mkb,
        pic_id,
        target_penyusunan
    } = req.body;

    const created_by = req.user ? req.user.id : null;

    try {
        const [risikoRows] = await db.query(
            `
            SELECT id
            FROM mr_risiko
            WHERE id = ?
            `,
            [risiko_id]
        );

        if (risikoRows.length === 0) {
            return res.status(404).json({
                message: 'Data risiko tidak ditemukan'
            });
        }

        await db.query(
            `
            INSERT INTO mr_form2_prioritas (
                risiko_id,
                membutuhkan_mkb,
                pic_id,
                target_penyusunan,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)

            ON DUPLICATE KEY UPDATE
                membutuhkan_mkb = VALUES(membutuhkan_mkb),
                pic_id = VALUES(pic_id),
                target_penyusunan = VALUES(target_penyusunan),
                updated_at = CURRENT_TIMESTAMP
            `,
            [
                risiko_id,
                membutuhkan_mkb === null
                    ? null
                    : membutuhkan_mkb
                        ? 1
                        : 0,
                pic_id || null,
                target_penyusunan || null,
                created_by
            ]
        );

        res.json({
            message: 'Data Form 2.0 berhasil disimpan.'
        });

    } catch (error) {
        console.error('ERROR SAVE FORM 2.0:', error);

        res.status(500).json({
            error: error.message
        });
    }
};

// Form 3.0 peta risiko
exports.getPetaRisiko = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        kode_risiko,
        peristiwa_risiko,
        kemungkinan,
        nilai_dampak,
        besaran_risiko,
        status_risiko
      FROM mr_risiko
      WHERE kemungkinan IS NOT NULL
        AND nilai_dampak IS NOT NULL
      ORDER BY kode_risiko ASC
    `);

    res.json(rows);
  } catch (error) {
    console.error('ERROR GET PETA RISIKO', error);

    res.status(500).json({
      error: error.message
    });
  }
};

exports.getMonitoringSemester1 = async (req, res) => {
  try {
    const tahun =
      req.query.tahun || new Date().getFullYear();

    const [rows] = await db.query(
      `
      SELECT
        r.id AS risiko_id,
        r.kode_risiko,
        r.peristiwa_risiko,
        r.besaran_risiko,

        m.id AS monitoring_id,
        m.tahun,
        m.periode,
        m.risiko_saat_ini,
        m.proyeksi_risiko,
        m.perlakuan_risiko,
        m.rencana_penanganan,
        m.penanggung_jawab_id,
        u.nama AS nama_penanggung_jawab,
        m.waktu_pelaksanaan,
        m.hasil_pelaksanaan

      FROM mr_risiko r

      LEFT JOIN mr_monitoring m
        ON m.risiko_id = r.id
        AND m.tahun = ?
        AND m.periode = 'Semester I'

      LEFT JOIN users u
        ON u.id = m.penanggung_jawab_id

      ORDER BY r.kode_risiko ASC
      `,
      [tahun]
    );

    for (const item of rows) {
      if (!item.monitoring_id) {
        item.dokumen = [];
        continue;
      }

      const [dokumen] = await db.query(
        `
        SELECT
          id,
          monitoring_id,
          nama_file,
          path_file,
          tipe_file,
          ukuran_file,
          uploaded_at
        FROM mr_monitoring_dokumen
        WHERE monitoring_id = ?
        ORDER BY uploaded_at DESC
        `,
        [item.monitoring_id]
      );

      item.dokumen = dokumen;
    }

    res.json(rows);

  } catch (error) {
    console.error(
      'ERROR GET MONITORING SEMESTER I:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.saveMonitoringSemester1 = async (req, res) => {
  const {risiko_id} = req.params;

  const {
    tahun,
    risiko_saat_ini,
    proyeksi_risiko,
    perlakuan_risiko,
    rencana_penanganan,
    penanggung_jawab_id,
    waktu_pelaksanaan,
    hasil_pelaksanaan,
  } = req.body;

  try {
    const [risikoRows] = await db.query(
      `
      SELECT id
      FROM mr_risiko
      WHERE id = ?
      LIMIT 1
      `,
      [risiko_id]
    );

    if (risikoRows.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan',
      });
    }

    await db.query(
      `
      INSERT INTO mr_monitoring (
        risiko_id,
        tahun,
        periode,
        risiko_saat_ini,
        proyeksi_risiko,
        perlakuan_risiko,
        rencana_penanganan,
        penanggung_jawab_id,
        waktu_pelaksanaan,
        hasil_pelaksanaan,
        created_by
      )
      VALUES (?, ?, 'Semester I', ?, ?, ?, ?, ?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE
        risiko_saat_ini = VALUES(risiko_saat_ini),
        proyeksi_risiko = VALUES(proyeksi_risiko),
        perlakuan_risiko = VALUES(perlakuan_risiko),
        rencana_penanganan = VALUES(rencana_penanganan),
        penanggung_jawab_id = VALUES(penanggung_jawab_id),
        waktu_pelaksanaan = VALUES(waktu_pelaksanaan),
        hasil_pelaksanaan = VALUES(hasil_pelaksanaan)
      `,
      [
        risiko_id,
        tahun,
        risiko_saat_ini || null,
        proyeksi_risiko || null,
        perlakuan_risiko || null,
        rencana_penanganan || null,
        penanggung_jawab_id || null,
        waktu_pelaksanaan || null,
        hasil_pelaksanaan || null,
        req.user.id,
      ]
    );

    res.json({
      message: 'Monitoring Semester I berhasil disimpan',
    });
  } catch (error) {
    console.error('ERROR SAVE MONITORING SEMESTER I:', error);
  
    res.status(500).json({
      error: error.message,
    });
  }
};

exports.uploadMonitoringDokumen = async (req, res) => {
  const { monitoring_id } = req.params;

  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'File Data Dukung belum dipilih.',
      });
    }

    const [monitoringRows] =
      await db.query(
        `
        SELECT id
        FROM mr_monitoring
        WHERE id = ?
        LIMIT 1
        `,
        [monitoring_id]
      );

    if (monitoringRows.length === 0) {
      return res.status(404).json({
        message:
          'Data monitoring tidak ditemukan.',
      });
    }

    const pathFile =
      `uploads/monitoring/${req.file.filename}`;

    const [result] = await db.query(
      `
      INSERT INTO mr_monitoring_dokumen (
        monitoring_id,
        nama_file,
        path_file,
        tipe_file,
        ukuran_file,
        uploaded_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        monitoring_id,
        req.file.originalname,
        pathFile,
        req.file.mimetype,
        req.file.size,
        req.user.id,
      ]
    );

    res.status(201).json({
      message:
        'Data Dukung berhasil diunggah.',
      dokumen: {
        id: result.insertId,
        monitoring_id:
          Number(monitoring_id),
        nama_file:
          req.file.originalname,
        tipe_file:
          req.file.mimetype,
        ukuran_file:
          req.file.size,
      },
    });

  } catch (error) {
    console.error(
      'ERROR UPLOAD DATA DUKUNG:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.getMonitoringDokumen = async (req, res) => {
  const { monitoring_id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        monitoring_id,
        nama_file,
        path_file,
        tipe_file,
        ukuran_file,
        uploaded_at
      FROM mr_monitoring_dokumen
      WHERE monitoring_id = ?
      ORDER BY uploaded_at DESC
      `,
      [monitoring_id]
    );

    res.json(rows);

  } catch (error) {
    console.error(
      'ERROR GET DATA DUKUNG:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.downloadMonitoringDokumen = async (req, res) => {
  const { dokumen_id } = req.params;

  try {
    const [rows] = await db.query(
      `
      SELECT
        id,
        nama_file,
        path_file,
        tipe_file
      FROM mr_monitoring_dokumen
      WHERE id = ?
      LIMIT 1
      `,
      [dokumen_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Dokumen tidak ditemukan.',
      });
    }

    const dokumen = rows[0];

    const filePath = path.join(
      __dirname,
      '..',
      dokumen.path_file
    );

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        message: 'File fisik tidak ditemukan.',
      });
    }

    res.setHeader(
      'Content-Type',
      dokumen.tipe_file || 'application/octet-stream'
    );

    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(
        dokumen.nama_file
      )}"`
    );

    return res.sendFile(filePath);

  } catch (error) {
    console.error(
      'ERROR DOWNLOAD DATA DUKUNG:',
      error
    );

    return res.status(500).json({
      error: error.message,
    });
  }
};

exports.getMonitoringSemester2 = async (req, res) => {
  try {
    const tahun =
      req.query.tahun || new Date().getFullYear();

    const [rows] = await db.query(
      `
      SELECT
        r.id AS risiko_id,
        r.kode_risiko,
        r.peristiwa_risiko,
        r.besaran_risiko,

        m.id AS monitoring_id,
        m.tahun,
        m.periode,
        m.risiko_saat_ini,
        m.proyeksi_risiko,
        m.perlakuan_risiko,
        m.rencana_penanganan,
        m.penanggung_jawab_id,
        u.nama AS nama_penanggung_jawab,
        m.waktu_pelaksanaan,
        m.hasil_pelaksanaan

      FROM mr_risiko r

      LEFT JOIN mr_monitoring m
        ON m.risiko_id = r.id
        AND m.tahun = ?
        AND m.periode = 'Semester II'

      LEFT JOIN users u
        ON u.id = m.penanggung_jawab_id

      ORDER BY r.kode_risiko ASC
      `,
      [tahun]
    );

    for (const item of rows) {
      if (!item.monitoring_id) {
        item.dokumen = [];
        continue;
      }

      const [dokumen] = await db.query(
        `
        SELECT
          id,
          monitoring_id,
          nama_file,
          path_file,
          tipe_file,
          ukuran_file,
          uploaded_at
        FROM mr_monitoring_dokumen
        WHERE monitoring_id = ?
        ORDER BY uploaded_at DESC
        `,
        [item.monitoring_id]
      );

      item.dokumen = dokumen;
    }

    res.json(rows);

  } catch (error) {
    console.error(
      'ERROR GET MONITORING SEMESTER I:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.saveMonitoringSemester2 = async (req, res) => {
  const {risiko_id} = req.params;

  const {
    tahun,
    risiko_saat_ini,
    proyeksi_risiko,
    perlakuan_risiko,
    rencana_penanganan,
    penanggung_jawab_id,
    waktu_pelaksanaan,
    hasil_pelaksanaan,
  } = req.body;

  try {
    const [risikoRows] = await db.query(
      `
      SELECT id
      FROM mr_risiko
      WHERE id = ?
      LIMIT 1
      `,
      [risiko_id]
    );

    if (risikoRows.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan',
      });
    }

    await db.query(
      `
      INSERT INTO mr_monitoring (
        risiko_id,
        tahun,
        periode,
        risiko_saat_ini,
        proyeksi_risiko,
        perlakuan_risiko,
        rencana_penanganan,
        penanggung_jawab_id,
        waktu_pelaksanaan,
        hasil_pelaksanaan,
        created_by
      )
      VALUES (?, ?, 'Semester II', ?, ?, ?, ?, ?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE
        risiko_saat_ini = VALUES(risiko_saat_ini),
        proyeksi_risiko = VALUES(proyeksi_risiko),
        perlakuan_risiko = VALUES(perlakuan_risiko),
        rencana_penanganan = VALUES(rencana_penanganan),
        penanggung_jawab_id = VALUES(penanggung_jawab_id),
        waktu_pelaksanaan = VALUES(waktu_pelaksanaan),
        hasil_pelaksanaan = VALUES(hasil_pelaksanaan)
      `,
      [
        risiko_id,
        tahun,
        risiko_saat_ini || null,
        proyeksi_risiko || null,
        perlakuan_risiko || null,
        rencana_penanganan || null,
        penanggung_jawab_id || null,
        waktu_pelaksanaan || null,
        hasil_pelaksanaan || null,
        req.user.id,
      ]
    );

    res.json({
      message: 'Monitoring Semester II berhasil disimpan',
    });
  } catch (error) {
    console.error('ERROR SAVE MONITORING SEMESTER II:', error);
  
    res.status(500).json({
      error: error.message,
    });
  }
};

// Form 3.0 tahunan
exports.getMonitoringTahunan = async (req, res) => {
  try {
    const tahun =
      req.query.tahun || new Date().getFullYear();

    const [rows] = await db.query(
      `
      SELECT
        r.id AS risiko_id,
        r.kode_risiko,
        r.peristiwa_risiko,
        r.besaran_risiko,

        m.id AS monitoring_id,
        m.tahun,
        m.periode,
        m.risiko_saat_ini,
        m.proyeksi_risiko,
        m.hasil_pelaksanaan,
        m.rekomendasi

      FROM mr_risiko r

      LEFT JOIN mr_monitoring m
        ON m.risiko_id = r.id
        AND m.tahun = ?
        AND m.periode = 'Tahunan'

      ORDER BY r.kode_risiko ASC
      `,
      [tahun]
    );

    res.json(rows);
  } catch (error) {
    console.error(
      'ERROR GET MONITORING TAHUNAN:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};

exports.saveMonitoringTahunan = async (req, res) => {
  const { risiko_id } = req.params;

  const {
    tahun,
    risiko_saat_ini,
    proyeksi_risiko,
    hasil_pelaksanaan,
    rekomendasi,
  } = req.body;

  try {
    const [risikoRows] = await db.query(
      `
      SELECT id
      FROM mr_risiko
      WHERE id = ?
      LIMIT 1
      `,
      [risiko_id]
    );

    if (risikoRows.length === 0) {
      return res.status(404).json({
        message: 'Data risiko tidak ditemukan',
      });
    }

    await db.query(
      `
      INSERT INTO mr_monitoring (
        risiko_id,
        tahun,
        periode,
        risiko_saat_ini,
        proyeksi_risiko,
        hasil_pelaksanaan,
        rekomendasi,
        created_by
      )
      VALUES (?, ?, 'Tahunan', ?, ?, ?, ?, ?)

      ON DUPLICATE KEY UPDATE
        risiko_saat_ini = VALUES(risiko_saat_ini),
        proyeksi_risiko = VALUES(proyeksi_risiko),
        hasil_pelaksanaan = VALUES(hasil_pelaksanaan),
        rekomendasi = VALUES(rekomendasi)
      `,
      [
        risiko_id,
        tahun,
        risiko_saat_ini || null,
        proyeksi_risiko || null,
        hasil_pelaksanaan || null,
        rekomendasi || null,
        req.user.id,
      ]
    );

    res.json({
      message: 'Monitoring Tahunan berhasil disimpan',
    });
  } catch (error) {
    console.error(
      'ERROR SAVE MONITORING TAHUNAN:',
      error
    );

    res.status(500).json({
      error: error.message,
    });
  }
};