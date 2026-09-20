const db = require('../config/db');

exports.getSummary = async (req, res) => {
    try {
        const [
            risikoTotalRows,
            risikoTinggiRows,
            risikoTerbaruRows,
            perubahanTotalRows,
            perubahanAktifRows,
            perubahanSelesaiRows,
            pengetahuanTotalRows,
            pengetahuanDokumentasiRows,
            bcpTotalRows,
            bcpAktifRows,
            ujiTotalRows,
            permintaanRows,
            kueriRows,
            insidenRows,
            masalahRows,
            insidenAktifRows
        ] = await Promise.all([
            db.query(`
                SELECT COUNT(*) AS total
                FROM mr_risiko
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mr_risiko
                WHERE LOWER(COALESCE(besaran_risiko, '')) IN (
                    'tinggi',
                    'sangat tinggi',
                    'ekstrem'
                )
            `),

            db.query(`
                SELECT
                    r.id,
                    r.kode_risiko,
                    r.peristiwa_risiko,
                    r.besaran_risiko,
                    r.status_risiko,
                    r.created_at,
                    ld.nama_layanan
                FROM mr_risiko r
                LEFT JOIN layanan_digital ld
                    ON ld.id = r.layanan_id
                ORDER BY r.created_at DESC, r.id DESC
                LIMIT 5
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mpr_perubahan
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mpr_perubahan
                WHERE status IN (
                    'Analisis',
                    'Implementasi',
                    'Evaluasi'
                )
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mpr_perubahan
                WHERE status = 'Selesai'
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mpn_pengetahuan
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mpn_pengetahuan
                WHERE sudah_terdokumentasi = 1
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mkb_bcp
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mkb_bcp
                WHERE status NOT IN (
                    'Selesai',
                    'Tidak Aktif'
                )
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mkb_uji
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mrp_permintaan_layanan
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mrp_kueri
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mrp_insiden
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mrp_masalah
            `),

            db.query(`
                SELECT COUNT(*) AS total
                FROM mrp_insiden
                WHERE status NOT IN (
                    'Dipulihkan',
                    'Ditutup'
                )
            `)
        ]);

        const risikoTotal =
            Number(risikoTotalRows[0][0]?.total || 0);

        const risikoTinggi =
            Number(risikoTinggiRows[0][0]?.total || 0);

        const perubahanTotal =
            Number(perubahanTotalRows[0][0]?.total || 0);

        const perubahanAktif =
            Number(perubahanAktifRows[0][0]?.total || 0);

        const perubahanSelesai =
            Number(perubahanSelesaiRows[0][0]?.total || 0);

        const pengetahuanTotal =
            Number(pengetahuanTotalRows[0][0]?.total || 0);

        const pengetahuanTerdokumentasi =
            Number(
                pengetahuanDokumentasiRows[0][0]?.total || 0
            );

        const bcpTotal =
            Number(bcpTotalRows[0][0]?.total || 0);

        const bcpAktif =
            Number(bcpAktifRows[0][0]?.total || 0);

        const ujiTotal =
            Number(ujiTotalRows[0][0]?.total || 0);

        const permintaan =
            Number(permintaanRows[0][0]?.total || 0);

        const kueri =
            Number(kueriRows[0][0]?.total || 0);

        const insiden =
            Number(insidenRows[0][0]?.total || 0);

        const masalah =
            Number(masalahRows[0][0]?.total || 0);

        const insidenAktif =
            Number(insidenAktifRows[0][0]?.total || 0);

        const cakupanDokumentasi =
            pengetahuanTotal > 0
                ? Number(
                    (
                        pengetahuanTerdokumentasi /
                        pengetahuanTotal *
                        100
                    ).toFixed(1)
                )
                : 0;

        const progresPerubahan =
            perubahanTotal > 0
                ? Number(
                    (
                        perubahanSelesai /
                        perubahanTotal *
                        100
                    ).toFixed(1)
                )
                : 0;

        return res.status(200).json({
            risiko: {
                total: risikoTotal,
                tinggi: risikoTinggi,
                terbaru: risikoTerbaruRows[0]
            },

            perubahan: {
                total: perubahanTotal,
                aktif: perubahanAktif,
                selesai: perubahanSelesai,
                persentase_selesai: progresPerubahan
            },

            pengetahuan: {
                total: pengetahuanTotal,
                terdokumentasi: pengetahuanTerdokumentasi,
                persentase_terdokumentasi: cakupanDokumentasi
            },

            keberlangsungan: {
                bcp_total: bcpTotal,
                bcp_aktif: bcpAktif,
                uji_total: ujiTotal
            },

            relasi_pengguna: {
                permintaan,
                kueri,
                insiden,
                masalah,
                insiden_aktif: insidenAktif,
                total:
                    permintaan +
                    kueri +
                    insiden +
                    masalah
            }
        });
    } catch (error) {
        console.error('Dashboard summary error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data dashboard.',
            error: error.message
        });
    }
};

exports.getPimpinanDashboard = async (req, res) => {
  try {
    const [
      approvalRows,
      highRiskRows,
      changeTotalRows,
      changeAktifRows,
      latestRiskRows
    ] = await Promise.all([
      db.query(`
        SELECT
          r.id,
          r.kode_risiko,
          r.peristiwa_risiko,
          r.besaran_risiko,
          r.status_risiko,
          r.created_at,
          ld.nama_layanan
        FROM mr_risiko r

        LEFT JOIN layanan_digital ld
          ON ld.id = r.layanan_id

        WHERE r.status_risiko = 'Diajukan'

        ORDER BY
          r.created_at ASC,
          r.id ASC
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM mr_risiko
        WHERE
          status_risiko <> 'Ditolak'
          AND CAST(
            COALESCE(
              besaran_risiko,
              0
            )
            AS UNSIGNED
          ) >= 17
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM mpr_perubahan
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM mpr_perubahan
        WHERE status IN (
          'Analisis',
          'Implementasi',
          'Evaluasi'
        )
      `),

      db.query(`
        SELECT
          r.id,
          r.kode_risiko,
          r.peristiwa_risiko,
          r.besaran_risiko,
          r.status_risiko,
          r.created_at,
          ld.nama_layanan

        FROM mr_risiko r

        LEFT JOIN layanan_digital ld
          ON ld.id = r.layanan_id

        ORDER BY
          r.created_at DESC,
          r.id DESC

        LIMIT 5
      `)
    ]);

    const approvalList =
      approvalRows[0];

    const risikoTinggi =
      Number(
        highRiskRows[0][0]?.total ||
          0
      );

    const perubahanTotal =
      Number(
        changeTotalRows[0][0]?.total ||
          0
      );

    const perubahanAktif =
      Number(
        changeAktifRows[0][0]?.total ||
          0
      );

    return res.status(200).json({
      approval: {
        total:
          approvalList.length,
        risiko:
          approvalList
      },

      risiko: {
        diajukan:
          approvalList.length,
        tinggi:
          risikoTinggi,
        terbaru:
          latestRiskRows[0]
      },

      perubahan: {
        total:
          perubahanTotal,
        aktif:
          perubahanAktif
      }
    });
  } catch (error) {
    console.error(
      'ERROR DASHBOARD PIMPINAN:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal mengambil dashboard pimpinan.',
      error:
        error.message
    });
  }
};

exports.getPengelolaDashboard = async (req, res) => {
  try {
    const [
      totalRisikoRows,
      draftRows,
      rejectedRows,
      latestRiskRows,
      knowledgeRows,
      documentedRows,
      unreadRows
    ] = await Promise.all([
      db.query(`
        SELECT COUNT(*) AS total
        FROM mr_risiko
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM mr_risiko
        WHERE status_risiko = 'Draft'
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM mr_risiko
        WHERE status_risiko = 'Ditolak'
      `),

      db.query(`
        SELECT
          r.id,
          r.kode_risiko,
          r.peristiwa_risiko,
          r.besaran_risiko,
          r.status_risiko,
          r.created_at,
          ld.nama_layanan
        FROM mr_risiko r
        LEFT JOIN layanan_digital ld
          ON ld.id = r.layanan_id
        ORDER BY
          r.created_at DESC,
          r.id DESC
        LIMIT 5
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM mpn_pengetahuan
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM mpn_pengetahuan
        WHERE sudah_terdokumentasi = 1
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM notifications
        WHERE user_id = ?
          AND is_read = 0
      `, [req.user.id])
    ]);

    return res.status(200).json({
      risiko: {
        total: Number(
          totalRisikoRows[0][0]?.total || 0
        ),
        draft: Number(
          draftRows[0][0]?.total || 0
        ),
        perlu_perbaikan: Number(
          rejectedRows[0][0]?.total || 0
        ),
        terbaru: latestRiskRows[0]
      },

      pengetahuan: {
        total: Number(
          knowledgeRows[0][0]?.total || 0
        ),
        terdokumentasi: Number(
          documentedRows[0][0]?.total || 0
        )
      },

      notifikasi: {
        unread: Number(
          unreadRows[0][0]?.total || 0
        )
      }
    });
  } catch (error) {
    console.error(
      'ERROR DASHBOARD PENGELOLA:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal mengambil dashboard pengelola.',
      error:
        error.message
    });
  }
};

exports.getAdminDashboard = async (req, res) => {
  try {
    const [
      totalUserRows,
      adminRows,
      pengelolaRows,
      pimpinanRows,
      auditorRows,
      latestAccountRows
    ] = await Promise.all([
      db.query(`
        SELECT COUNT(*) AS total
        FROM users
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE role_id = 1
           OR LOWER(COALESCE(role, '')) = 'admin'
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE role_id = 2
           OR LOWER(COALESCE(role, '')) = 'pengelola'
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE role_id = 3
           OR LOWER(COALESCE(role, '')) = 'pimpinan'
      `),

      db.query(`
        SELECT COUNT(*) AS total
        FROM users
        WHERE role_id = 4
           OR LOWER(COALESCE(role, '')) = 'auditor'
      `),

      db.query(`
        SELECT
          u.id,
          u.nama,
          u.email,
          u.role,
          u.role_id,
          r.nama_role,
          u.upr_instansi,
          u.created_at
        FROM users u
        LEFT JOIN roles r
          ON r.id = u.role_id
        ORDER BY
          u.created_at DESC,
          u.id DESC
        LIMIT 5
      `)
    ]);

    return res.status(200).json({
      akun: {
        total: Number(totalUserRows[0][0]?.total || 0),
        admin: Number(adminRows[0][0]?.total || 0),
        pengelola: Number(pengelolaRows[0][0]?.total || 0),
        pimpinan: Number(pimpinanRows[0][0]?.total || 0),
        auditor: Number(auditorRows[0][0]?.total || 0),
        terbaru: latestAccountRows[0]
      }
    });
  } catch (error) {
    console.error(
      'ERROR DASHBOARD ADMIN:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal mengambil dashboard administrator.',
      error:
        error.message
    });
  }
};