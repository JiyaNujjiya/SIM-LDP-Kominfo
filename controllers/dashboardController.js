const db = require('../config/db');


const getDashboardScope = async (req) => {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
        const error = new Error('Pengguna belum terautentikasi.');
        error.status = 401;
        throw error;
    }

    const [rows] = await db.query(
        `
        SELECT
            id,
            role_id,
            role,
            instansi_id
        FROM users
        WHERE id = ?
        LIMIT 1
        `,
        [userId]
    );

    if (!rows.length) {
        const error = new Error('Akun pengguna tidak ditemukan.');
        error.status = 401;
        throw error;
    }

    const user = rows[0];

    const isAdmin =
        Number(user.role_id) === 1 ||
        String(user.role || '').toLowerCase() === 'admin';

    const instansiId = Number(user.instansi_id);

    if (!isAdmin && (!Number.isInteger(instansiId) || instansiId <= 0)) {
        const error = new Error('Akun belum memiliki instansi.');
        error.status = 403;
        throw error;
    }

    return {
        userId,
        isAdmin,
        instansiId: isAdmin ? null : instansiId
    };
};


const getScopedDashboardStats = async (scope) => {
    const global = scope.isAdmin ? 1 : 0;
    const instansiId = scope.instansiId;

    const [
        risikoResult,
        risikoTerbaruResult,
        perubahanResult,
        pengetahuanResult,
        bcpResult,
        ujiResult,
        permintaanResult,
        kueriResult,
        insidenResult,
        masalahResult
    ] = await Promise.all([
        db.query(
            `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(
                    CASE
                        WHEN CAST(COALESCE(r.besaran_risiko, 0) AS UNSIGNED) >= 17
                          OR LOWER(COALESCE(r.besaran_risiko, '')) IN
                             ('tinggi', 'sangat tinggi', 'ekstrem')
                        THEN 1 ELSE 0
                    END
                ), 0) AS tinggi,
                COALESCE(SUM(r.status_risiko = 'Draft'), 0) AS draft,
                COALESCE(SUM(r.status_risiko = 'Ditolak'), 0) AS perlu_perbaikan,
                COALESCE(SUM(r.status_risiko = 'Diajukan'), 0) AS diajukan
            FROM mr_risiko r
            JOIN users u ON u.id = r.created_by
            WHERE (? = 1 OR u.instansi_id = ?)
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT
                r.id,
                r.kode_risiko,
                r.peristiwa_risiko,
                r.besaran_risiko,
                r.status_risiko,
                r.created_at,
                COALESCE(ld.nama_layanan, r.nama_layanan_pendukung,
                    r.nama_layanan_prioritas) AS nama_layanan
            FROM mr_risiko r
            JOIN users u ON u.id = r.created_by
            LEFT JOIN layanan_digital ld ON ld.id = r.layanan_id
            WHERE (? = 1 OR u.instansi_id = ?)
            ORDER BY r.created_at DESC, r.id DESC
            LIMIT 5
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(p.status IN
                    ('Analisis', 'Implementasi', 'Evaluasi')), 0) AS aktif,
                COALESCE(SUM(p.status = 'Selesai'), 0) AS selesai
            FROM mpr_perubahan p
            JOIN users u ON u.id = p.created_by
            WHERE (? = 1 OR u.instansi_id = ?)
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(p.sudah_terdokumentasi = 1), 0)
                    AS terdokumentasi
            FROM mpn_pengetahuan p
            WHERE (? = 1 OR p.pemilik_instansi_id = ?)
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(b.status = 'Active'), 0) AS aktif
            FROM mkb_bcp b
            LEFT JOIN mr_risiko r ON r.id = b.id_risiko
            LEFT JOIN users u ON u.id = r.created_by
            WHERE (? = 1 OR u.instansi_id = ?)
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM mkb_uji uj
            JOIN mkb_insiden ins ON ins.id = uj.insiden_id
            JOIN mkb_bia bia ON bia.id = ins.bia_id
            LEFT JOIN mkb_layanan_prioritas ml
                ON ml.id = bia.mkb_layanan_prioritas_id
            LEFT JOIN layanan_prioritas lp
                ON lp.id = bia.layanan_prioritas_id
            LEFT JOIN layanan_digital ld
                ON ld.id = lp.layanan_id
            WHERE (
                ? = 1
                OR COALESCE(ml.instansi_id, ld.instansi_id) = ?
            )
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM mrp_permintaan_layanan p
            JOIN users u ON u.id = p.created_by
            WHERE (? = 1 OR u.instansi_id = ?)
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM mrp_kueri k
            JOIN users u ON u.id = k.created_by
            WHERE (? = 1 OR u.instansi_id = ?)
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT
                COUNT(*) AS total,
                COALESCE(SUM(i.status NOT IN
                    ('Dipulihkan', 'Ditutup')), 0) AS aktif
            FROM mrp_insiden i
            JOIN users u ON u.id = i.created_by
            WHERE (? = 1 OR u.instansi_id = ?)
            `,
            [global, instansiId]
        ),

        db.query(
            `
            SELECT COUNT(*) AS total
            FROM mrp_masalah m
            JOIN users u ON u.id = m.created_by
            WHERE (? = 1 OR u.instansi_id = ?)
            `,
            [global, instansiId]
        )
    ]);

    const risiko = risikoResult[0][0];
    const perubahan = perubahanResult[0][0];
    const pengetahuan = pengetahuanResult[0][0];
    const bcp = bcpResult[0][0];
    const uji = ujiResult[0][0];
    const permintaan = Number(permintaanResult[0][0].total);
    const kueri = Number(kueriResult[0][0].total);
    const insiden = Number(insidenResult[0][0].total);
    const masalah = Number(masalahResult[0][0].total);

    const persen = (bagian, total) =>
        total > 0
            ? Number(((bagian / total) * 100).toFixed(1))
            : 0;

    return {
        risiko: {
            total: Number(risiko.total),
            tinggi: Number(risiko.tinggi),
            draft: Number(risiko.draft),
            perlu_perbaikan: Number(risiko.perlu_perbaikan),
            diajukan: Number(risiko.diajukan),
            terbaru: risikoTerbaruResult[0]
        },
        perubahan: {
            total: Number(perubahan.total),
            aktif: Number(perubahan.aktif),
            selesai: Number(perubahan.selesai),
            persentase_selesai: persen(
                Number(perubahan.selesai),
                Number(perubahan.total)
            )
        },
        pengetahuan: {
            total: Number(pengetahuan.total),
            terdokumentasi: Number(pengetahuan.terdokumentasi),
            persentase_terdokumentasi: persen(
                Number(pengetahuan.terdokumentasi),
                Number(pengetahuan.total)
            )
        },
        keberlangsungan: {
            bcp_total: Number(bcp.total),
            bcp_aktif: Number(bcp.aktif),
            uji_total: Number(uji.total)
        },
        relasi_pengguna: {
            permintaan,
            kueri,
            insiden,
            masalah,
            insiden_aktif: Number(insidenResult[0][0].aktif),
            total: permintaan + kueri + insiden + masalah
        }
    };
};

exports.getSummary = async (req, res) => {
    try {
        const scope = await getDashboardScope(req);
        const result = await getScopedDashboardStats(scope);

        return res.status(200).json(result);
    } catch (error) {
        console.error('Dashboard summary error:', error);

        return res.status(error.status || 500).json({
            message: error.status
                ? error.message
                : 'Terjadi kesalahan saat mengambil data dashboard.'
        });
    }
};

exports.getPimpinanDashboard = async (req, res) => {
    try {
        const scope = await getDashboardScope(req);
        const stats = await getScopedDashboardStats(scope);

        const [approvalRows] = await db.query(
            `
            SELECT
                r.id,
                r.kode_risiko,
                r.peristiwa_risiko,
                r.besaran_risiko,
                r.status_risiko,
                r.created_at,
                COALESCE(ld.nama_layanan, r.nama_layanan_pendukung,
                    r.nama_layanan_prioritas) AS nama_layanan
            FROM mr_risiko r
            JOIN users u ON u.id = r.created_by
            LEFT JOIN layanan_digital ld ON ld.id = r.layanan_id
            WHERE r.status_risiko = 'Diajukan'
              AND (? = 1 OR u.instansi_id = ?)
            ORDER BY r.created_at ASC, r.id ASC
            `,
            [scope.isAdmin ? 1 : 0, scope.instansiId]
        );

        return res.status(200).json({
            approval: {
                total: approvalRows.length,
                risiko: approvalRows
            },
            risiko: {
                diajukan: approvalRows.length,
                tinggi: stats.risiko.tinggi,
                terbaru: stats.risiko.terbaru
            },
            perubahan: {
                total: stats.perubahan.total,
                aktif: stats.perubahan.aktif
            }
        });
    } catch (error) {
        console.error('Dashboard pimpinan error:', error);

        return res.status(error.status || 500).json({
            message: error.status
                ? error.message
                : 'Gagal mengambil dashboard pimpinan.'
        });
    }
};

exports.getPengelolaDashboard = async (req, res) => {
    try {
        const scope = await getDashboardScope(req);
        const stats = await getScopedDashboardStats(scope);

        const [notificationRows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM notifications
            WHERE user_id = ?
              AND is_read = 0
            `,
            [scope.userId]
        );

        return res.status(200).json({
            risiko: {
                total: stats.risiko.total,
                draft: stats.risiko.draft,
                perlu_perbaikan: stats.risiko.perlu_perbaikan,
                terbaru: stats.risiko.terbaru
            },
            pengetahuan: {
                total: stats.pengetahuan.total,
                terdokumentasi: stats.pengetahuan.terdokumentasi
            },
            notifikasi: {
                unread: Number(notificationRows[0]?.total || 0)
            }
        });
    } catch (error) {
        console.error('Dashboard pengelola error:', error);

        return res.status(error.status || 500).json({
            message: error.status
                ? error.message
                : 'Gagal mengambil dashboard pengelola.'
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