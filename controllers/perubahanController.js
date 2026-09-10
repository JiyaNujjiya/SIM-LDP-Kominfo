const db = require('../config/db');

const isPositiveInteger = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
};

exports.getUnitOptions = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                uk.id,
                uk.instansi_id,
                uk.kode_unit,
                uk.nama_unit,
                uk.status,
                i.kode_instansi,
                i.nama_instansi
            FROM unit_kerja uk
            JOIN instansi i
                ON i.id = uk.instansi_id
            WHERE uk.status = 'Aktif'
            ORDER BY i.nama_instansi ASC, uk.nama_unit ASC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getUnitOptions error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil daftar unit kerja.'
        });
    }
};

exports.getUserOptions = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                id,
                nama,
                email,
                role,
                role_id
            FROM users
            ORDER BY nama ASC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getUserOptions error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil daftar pengguna.'
        });
    }
};

exports.getLayananOptions = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                ld.id,
                ld.instansi_id,
                ld.unit_kerja_id,
                ld.kode_layanan,
                ld.nama_layanan,
                ld.jenis_layanan,
                ld.status,
                i.kode_instansi,
                i.nama_instansi,
                uk.kode_unit,
                uk.nama_unit
            FROM layanan_digital ld
            JOIN instansi i
                ON i.id = ld.instansi_id
            LEFT JOIN unit_kerja uk
                ON uk.id = ld.unit_kerja_id
            WHERE ld.status = 'Aktif'
            ORDER BY ld.nama_layanan ASC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getLayananOptions error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil daftar layanan digital.'
        });
    }
};

exports.getLayananPrioritasOptions = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                lp.id,
                lp.id AS layanan_prioritas_id,
                lp.kode_prioritas,
                lp.layanan_id,
                ld.kode_layanan,
                ld.nama_layanan
            FROM layanan_prioritas lp
            JOIN layanan_digital ld
                ON ld.id = lp.layanan_id
            WHERE ld.status = 'Aktif'
            ORDER BY lp.kode_prioritas ASC, ld.nama_layanan ASC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getLayananPrioritasOptions error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil daftar layanan prioritas.'
        });
    }
};

const perencanaanSelectQuery = `
    SELECT
        p.id,
        p.unit_terkait_id,
        uk.kode_unit,
        uk.nama_unit,
        uk.instansi_id,
        i.kode_instansi,
        i.nama_instansi,
        p.periode_perencanaan,
        p.created_by,
        u.nama AS dibuat_oleh,
        p.created_at,
        p.updated_at
    FROM mpr_perencanaan p
    JOIN unit_kerja uk
        ON uk.id = p.unit_terkait_id
    JOIN instansi i
        ON i.id = uk.instansi_id
    JOIN users u
        ON u.id = p.created_by
`;

// =========================================
// MPR01 - PERENCANAAN PERUBAHAN
// =========================================

exports.getAllPerencanaan = async (req, res) => {
    try {
        const [rows] = await db.query(`
            ${perencanaanSelectQuery}
            ORDER BY p.created_at DESC, p.id DESC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getAllPerencanaan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil data perencanaan perubahan.'
        });
    }
};

exports.getPerencanaanById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perencanaan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${perencanaanSelectQuery}
            WHERE p.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getPerencanaanById error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil detail perencanaan perubahan.'
        });
    }
};

exports.createPerencanaan = async (req, res) => {
    const {
        unit_terkait_id,
        periode_perencanaan
    } = req.body;

    if (!isPositiveInteger(unit_terkait_id)) {
        return res.status(400).json({
            message: 'unit_terkait_id wajib berupa ID yang valid.'
        });
    }

    if (
        typeof periode_perencanaan !== 'string' ||
        periode_perencanaan.trim() === ''
    ) {
        return res.status(400).json({
            message: 'periode_perencanaan wajib diisi.'
        });
    }

    if (periode_perencanaan.trim().length > 100) {
        return res.status(400).json({
            message: 'periode_perencanaan maksimal 100 karakter.'
        });
    }

    try {
        const [unitRows] = await db.query(
            `
            SELECT id
            FROM unit_kerja
            WHERE id = ?
            LIMIT 1
            `,
            [Number(unit_terkait_id)]
        );

        if (unitRows.length === 0) {
            return res.status(400).json({
                message: 'Unit kerja terkait tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_perencanaan (
                unit_terkait_id,
                periode_perencanaan,
                created_by
            )
            VALUES (?, ?, ?)
            `,
            [
                Number(unit_terkait_id),
                periode_perencanaan.trim(),
                req.user.id
            ]
        );

        const [rows] = await db.query(
            `
            ${perencanaanSelectQuery}
            WHERE p.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Data perencanaan perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createPerencanaan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menyimpan perencanaan perubahan.'
        });
    }
};

exports.updatePerencanaan = async (req, res) => {
    const { id } = req.params;

    const {
        unit_terkait_id,
        periode_perencanaan
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perencanaan tidak valid.'
        });
    }

    if (!isPositiveInteger(unit_terkait_id)) {
        return res.status(400).json({
            message: 'unit_terkait_id wajib berupa ID yang valid.'
        });
    }

    if (
        typeof periode_perencanaan !== 'string' ||
        periode_perencanaan.trim() === ''
    ) {
        return res.status(400).json({
            message: 'periode_perencanaan wajib diisi.'
        });
    }

    if (periode_perencanaan.trim().length > 100) {
        return res.status(400).json({
            message: 'periode_perencanaan maksimal 100 karakter.'
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_perencanaan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        const [unitRows] = await db.query(
            `
            SELECT id
            FROM unit_kerja
            WHERE id = ?
            LIMIT 1
            `,
            [Number(unit_terkait_id)]
        );

        if (unitRows.length === 0) {
            return res.status(400).json({
                message: 'Unit kerja terkait tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_perencanaan
            SET
                unit_terkait_id = ?,
                periode_perencanaan = ?
            WHERE id = ?
            `,
            [
                Number(unit_terkait_id),
                periode_perencanaan.trim(),
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${perencanaanSelectQuery}
            WHERE p.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Data perencanaan perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updatePerencanaan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui perencanaan perubahan.'
        });
    }
};

exports.deletePerencanaan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perencanaan tidak valid.'
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_perencanaan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        const [prioritasRows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM mpr_analisis_prioritas
            WHERE perencanaan_id = ?
            `,
            [Number(id)]
        );

        const [perubahanRows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM mpr_perubahan
            WHERE perencanaan_id = ?
            `,
            [Number(id)]
        );

        if (
            Number(prioritasRows[0].total) > 0 ||
            Number(perubahanRows[0].total) > 0
        ) {
            return res.status(409).json({
                message:
                    'Perencanaan tidak dapat dihapus karena sudah digunakan pada analisis prioritas atau data perubahan.'
            });
        }

        await db.query(
            `
            DELETE FROM mpr_perencanaan
            WHERE id = ?
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Data perencanaan perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error('deletePerencanaan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus perencanaan perubahan.'
        });
    }
};

// =========================================
// MPR01 - ANALISIS PRIORITAS PERUBAHAN
// =========================================

const analisisPrioritasSelectQuery = `
    SELECT
        ap.id,
        ap.perencanaan_id,
        ap.layanan_prioritas_id,

        lp.kode_prioritas,
        lp.layanan_id,

        ld.kode_layanan,
        ld.nama_layanan,

        ap.komponen_perubahan,
        ap.aspek_pemdi,
        ap.indikator_pemdi,
        ap.kondisi_saat_ini,
        ap.kondisi_diharapkan,
        ap.urutan_prioritas,

        ap.created_at,
        ap.updated_at
    FROM mpr_analisis_prioritas ap
    JOIN layanan_prioritas lp
        ON lp.id = ap.layanan_prioritas_id
    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;

const validateAnalisisPrioritasInput = ({
    layanan_prioritas_id,
    komponen_perubahan,
    aspek_pemdi,
    indikator_pemdi,
    kondisi_saat_ini,
    kondisi_diharapkan,
    urutan_prioritas
}) => {
    if (!isPositiveInteger(layanan_prioritas_id)) {
        return 'layanan_prioritas_id wajib berupa ID yang valid.';
    }

    if (
        typeof komponen_perubahan !== 'string' ||
        komponen_perubahan.trim() === ''
    ) {
        return 'komponen_perubahan wajib diisi.';
    }

    if (
        typeof aspek_pemdi !== 'string' ||
        aspek_pemdi.trim() === ''
    ) {
        return 'aspek_pemdi wajib diisi.';
    }

    if (aspek_pemdi.trim().length > 200) {
        return 'aspek_pemdi maksimal 200 karakter.';
    }

    if (
        typeof indikator_pemdi !== 'string' ||
        indikator_pemdi.trim() === ''
    ) {
        return 'indikator_pemdi wajib diisi.';
    }

    if (indikator_pemdi.trim().length > 200) {
        return 'indikator_pemdi maksimal 200 karakter.';
    }

    if (
        typeof kondisi_saat_ini !== 'string' ||
        kondisi_saat_ini.trim() === ''
    ) {
        return 'kondisi_saat_ini wajib diisi.';
    }

    if (
        typeof kondisi_diharapkan !== 'string' ||
        kondisi_diharapkan.trim() === ''
    ) {
        return 'kondisi_diharapkan wajib diisi.';
    }

    if (!isPositiveInteger(urutan_prioritas)) {
        return 'urutan_prioritas wajib berupa angka lebih dari 0.';
    }

    return null;
};

// GET /api/perubahan/perencanaan/:id/analisis-prioritas
exports.getAnalisisPrioritasByPerencanaan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perencanaan tidak valid.'
        });
    }

    try {
        const [perencanaanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perencanaan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perencanaanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${analisisPrioritasSelectQuery}
            WHERE ap.perencanaan_id = ?
            ORDER BY ap.urutan_prioritas ASC, ap.id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getAnalisisPrioritasByPerencanaan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil analisis prioritas.'
        });
    }
};

// GET /api/perubahan/analisis-prioritas/:id
exports.getAnalisisPrioritasById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID analisis prioritas tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${analisisPrioritasSelectQuery}
            WHERE ap.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data analisis prioritas tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getAnalisisPrioritasById error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil detail analisis prioritas.'
        });
    }
};

// POST /api/perubahan/perencanaan/:id/analisis-prioritas
exports.createAnalisisPrioritas = async (req, res) => {
    const { id } = req.params;

    const {
        layanan_prioritas_id,
        komponen_perubahan,
        aspek_pemdi,
        indikator_pemdi,
        kondisi_saat_ini,
        kondisi_diharapkan,
        urutan_prioritas
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perencanaan tidak valid.'
        });
    }

    const validationError = validateAnalisisPrioritasInput({
        layanan_prioritas_id,
        komponen_perubahan,
        aspek_pemdi,
        indikator_pemdi,
        kondisi_saat_ini,
        kondisi_diharapkan,
        urutan_prioritas
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        const [perencanaanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perencanaan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perencanaanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        const [layananRows] = await db.query(
            `
            SELECT id
            FROM layanan_prioritas
            WHERE id = ?
            LIMIT 1
            `,
            [Number(layanan_prioritas_id)]
        );

        if (layananRows.length === 0) {
            return res.status(400).json({
                message: 'Layanan prioritas tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_analisis_prioritas (
                perencanaan_id,
                layanan_prioritas_id,
                komponen_perubahan,
                aspek_pemdi,
                indikator_pemdi,
                kondisi_saat_ini,
                kondisi_diharapkan,
                urutan_prioritas
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                Number(layanan_prioritas_id),
                komponen_perubahan.trim(),
                aspek_pemdi.trim(),
                indikator_pemdi.trim(),
                kondisi_saat_ini.trim(),
                kondisi_diharapkan.trim(),
                Number(urutan_prioritas)
            ]
        );

        const [rows] = await db.query(
            `
            ${analisisPrioritasSelectQuery}
            WHERE ap.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Analisis prioritas perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createAnalisisPrioritas error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menyimpan analisis prioritas.'
        });
    }
};

// PUT /api/perubahan/analisis-prioritas/:id
exports.updateAnalisisPrioritas = async (req, res) => {
    const { id } = req.params;

    const {
        layanan_prioritas_id,
        komponen_perubahan,
        aspek_pemdi,
        indikator_pemdi,
        kondisi_saat_ini,
        kondisi_diharapkan,
        urutan_prioritas
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID analisis prioritas tidak valid.'
        });
    }

    const validationError = validateAnalisisPrioritasInput({
        layanan_prioritas_id,
        komponen_perubahan,
        aspek_pemdi,
        indikator_pemdi,
        kondisi_saat_ini,
        kondisi_diharapkan,
        urutan_prioritas
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_analisis_prioritas
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data analisis prioritas tidak ditemukan.'
            });
        }

        const [layananRows] = await db.query(
            `
            SELECT id
            FROM layanan_prioritas
            WHERE id = ?
            LIMIT 1
            `,
            [Number(layanan_prioritas_id)]
        );

        if (layananRows.length === 0) {
            return res.status(400).json({
                message: 'Layanan prioritas tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_analisis_prioritas
            SET
                layanan_prioritas_id = ?,
                komponen_perubahan = ?,
                aspek_pemdi = ?,
                indikator_pemdi = ?,
                kondisi_saat_ini = ?,
                kondisi_diharapkan = ?,
                urutan_prioritas = ?
            WHERE id = ?
            `,
            [
                Number(layanan_prioritas_id),
                komponen_perubahan.trim(),
                aspek_pemdi.trim(),
                indikator_pemdi.trim(),
                kondisi_saat_ini.trim(),
                kondisi_diharapkan.trim(),
                Number(urutan_prioritas),
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${analisisPrioritasSelectQuery}
            WHERE ap.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Analisis prioritas perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateAnalisisPrioritas error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui analisis prioritas.'
        });
    }
};

// DELETE /api/perubahan/analisis-prioritas/:id
exports.deleteAnalisisPrioritas = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID analisis prioritas tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_analisis_prioritas
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data analisis prioritas tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Analisis prioritas perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteAnalisisPrioritas error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus analisis prioritas.'
        });
    }
};

// =========================================
// MPR01 - DATA PERUBAHAN
// =========================================

const perubahanSelectQuery = `
    SELECT
        p.id,
        p.perencanaan_id,
        pr.periode_perencanaan,

        pr.unit_terkait_id,
        ut.kode_unit AS kode_unit_terkait,
        ut.nama_unit AS nama_unit_terkait,

        p.kode_perubahan,

        p.layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        p.detail_perubahan,

        p.unit_pemohon_id,
        up.kode_unit AS kode_unit_pemohon,
        up.nama_unit AS nama_unit_pemohon,

        p.klasifikasi,
        p.lingkup,
        p.status,

        p.created_by,
        u.nama AS dibuat_oleh,

        p.created_at,
        p.updated_at
    FROM mpr_perubahan p
    JOIN mpr_perencanaan pr
        ON pr.id = p.perencanaan_id
    JOIN unit_kerja ut
        ON ut.id = pr.unit_terkait_id
    JOIN layanan_digital ld
        ON ld.id = p.layanan_id
    JOIN unit_kerja up
        ON up.id = p.unit_pemohon_id
    JOIN users u
        ON u.id = p.created_by
`;

const validatePerubahanInput = ({
    perencanaan_id,
    kode_perubahan,
    layanan_id,
    detail_perubahan,
    unit_pemohon_id,
    klasifikasi,
    lingkup
}) => {
    if (!isPositiveInteger(perencanaan_id)) {
        return 'perencanaan_id wajib berupa ID yang valid.';
    }

    if (
        typeof kode_perubahan !== 'string' ||
        kode_perubahan.trim() === ''
    ) {
        return 'kode_perubahan wajib diisi.';
    }

    if (kode_perubahan.trim().length > 50) {
        return 'kode_perubahan maksimal 50 karakter.';
    }

    if (!isPositiveInteger(layanan_id)) {
        return 'layanan_id wajib berupa ID yang valid.';
    }

    if (
        typeof detail_perubahan !== 'string' ||
        detail_perubahan.trim() === ''
    ) {
        return 'detail_perubahan wajib diisi.';
    }

    if (!isPositiveInteger(unit_pemohon_id)) {
        return 'unit_pemohon_id wajib berupa ID yang valid.';
    }

    const klasifikasiValid = [
        'Normal',
        'Standard',
        'Emergency'
    ];

    if (!klasifikasiValid.includes(klasifikasi)) {
        return 'klasifikasi harus Normal, Standard, atau Emergency.';
    }

    const lingkupValid = [
        'Teknis',
        'Organisasi',
        'Teknis & Organisasi'
    ];

    if (!lingkupValid.includes(lingkup)) {
        return 'lingkup harus Teknis, Organisasi, atau Teknis & Organisasi.';
    }

    return null;
};

// GET /api/perubahan
exports.getAllPerubahan = async (req, res) => {
    try {
        const [rows] = await db.query(`
            ${perubahanSelectQuery}
            ORDER BY p.created_at DESC, p.id DESC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getAllPerubahan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil data perubahan.'
        });
    }
};

// GET /api/perubahan/:id
exports.getPerubahanById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${perubahanSelectQuery}
            WHERE p.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getPerubahanById error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil detail perubahan.'
        });
    }
};

// POST /api/perubahan
exports.createPerubahan = async (req, res) => {
    const {
        perencanaan_id,
        kode_perubahan,
        layanan_id,
        detail_perubahan,
        unit_pemohon_id,
        klasifikasi,
        lingkup
    } = req.body;

    // Status tidak boleh ditentukan manual
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'status'
        )
    ) {
        return res.status(400).json({
            message:
                'status perubahan dikelola otomatis oleh workflow dan tidak dapat ditentukan secara manual.'
        });
    }

    const validationError = validatePerubahanInput({
        perencanaan_id,
        kode_perubahan,
        layanan_id,
        detail_perubahan,
        unit_pemohon_id,
        klasifikasi,
        lingkup
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        // Pastikan perencanaan ada
        const [perencanaanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perencanaan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(perencanaan_id)]
        );

        if (perencanaanRows.length === 0) {
            return res.status(400).json({
                message:
                    'Perencanaan perubahan tidak ditemukan.'
            });
        }

        // Pastikan layanan digital ada
        const [layananRows] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [Number(layanan_id)]
        );

        if (layananRows.length === 0) {
            return res.status(400).json({
                message:
                    'Layanan digital tidak ditemukan.'
            });
        }

        // Pastikan unit pemohon ada
        const [unitRows] = await db.query(
            `
            SELECT id
            FROM unit_kerja
            WHERE id = ?
            LIMIT 1
            `,
            [Number(unit_pemohon_id)]
        );

        if (unitRows.length === 0) {
            return res.status(400).json({
                message:
                    'Unit pemohon tidak ditemukan.'
            });
        }

        // Cek kode perubahan duplicate
        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE kode_perubahan = ?
            LIMIT 1
            `,
            [kode_perubahan.trim()]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message:
                    'kode_perubahan sudah digunakan.'
            });
        }

        // Status tidak dimasukkan.
        // Database otomatis menggunakan default 'Perencanaan'.
        const [result] = await db.query(
            `
            INSERT INTO mpr_perubahan (
                perencanaan_id,
                kode_perubahan,
                layanan_id,
                detail_perubahan,
                unit_pemohon_id,
                klasifikasi,
                lingkup,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(perencanaan_id),
                kode_perubahan.trim(),
                Number(layanan_id),
                detail_perubahan.trim(),
                Number(unit_pemohon_id),
                klasifikasi,
                lingkup,
                req.user.id
            ]
        );

        const [rows] = await db.query(
            `
            ${perubahanSelectQuery}
            WHERE p.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Data perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createPerubahan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'kode_perubahan sudah digunakan.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data perubahan.'
        });
    }
};

// PUT /api/perubahan/:id
exports.updatePerubahan = async (req, res) => {
    const { id } = req.params;

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'status'
        )
    ) {
        return res.status(400).json({
            message:
                'status perubahan dikelola otomatis oleh workflow dan tidak dapat diubah secara manual.'
        });
    }

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    const {
        perencanaan_id,
        kode_perubahan,
        layanan_id,
        detail_perubahan,
        unit_pemohon_id,
        klasifikasi,
        lingkup
    } = req.body;

    const validationError = validatePerubahanInput({
        perencanaan_id,
        kode_perubahan,
        layanan_id,
        detail_perubahan,
        unit_pemohon_id,
        klasifikasi,
        lingkup
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [perencanaanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perencanaan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(perencanaan_id)]
        );

        if (perencanaanRows.length === 0) {
            return res.status(400).json({
                message:
                    'Perencanaan perubahan tidak ditemukan.'
            });
        }

        const [layananRows] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [Number(layanan_id)]
        );

        if (layananRows.length === 0) {
            return res.status(400).json({
                message:
                    'Layanan digital tidak ditemukan.'
            });
        }

        const [unitRows] = await db.query(
            `
            SELECT id
            FROM unit_kerja
            WHERE id = ?
            LIMIT 1
            `,
            [Number(unit_pemohon_id)]
        );

        if (unitRows.length === 0) {
            return res.status(400).json({
                message:
                    'Unit pemohon tidak ditemukan.'
            });
        }

        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE kode_perubahan = ?
              AND id <> ?
            LIMIT 1
            `,
            [
                kode_perubahan.trim(),
                Number(id)
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message:
                    'kode_perubahan sudah digunakan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_perubahan
            SET
                perencanaan_id = ?,
                kode_perubahan = ?,
                layanan_id = ?,
                detail_perubahan = ?,
                unit_pemohon_id = ?,
                klasifikasi = ?,
                lingkup = ?
            WHERE id = ?
            `,
            [
                Number(perencanaan_id),
                kode_perubahan.trim(),
                Number(layanan_id),
                detail_perubahan.trim(),
                Number(unit_pemohon_id),
                klasifikasi,
                lingkup,
                Number(id)
            ]
        );

        // Jika lingkup berubah, sinkronkan lagi
        // kebutuhan approval Teknis / Organisasi.
        await syncStatusSetelahAnalisis(
            Number(id)
        );

        const [rows] = await db.query(
            `
            ${perubahanSelectQuery}
            WHERE p.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Data perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updatePerubahan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'kode_perubahan sudah digunakan.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data perubahan.'
        });
    }
};

// DELETE /api/perubahan/:id
exports.deletePerubahan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_perubahan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Data perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error('deletePerubahan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus data perubahan.'
        });
    }
};

// =====================================================
// WORKFLOW STATUS MANAJEMEN PERUBAHAN
// =====================================================

const getLatestKeputusanPerubahan = async (
    perubahanId,
    tahap
) => {
    const [rows] = await db.query(
        `
        SELECT keputusan
        FROM mpr_persetujuan
        WHERE perubahan_id = ?
          AND tahap = ?
        ORDER BY diputuskan_at DESC, id DESC
        LIMIT 1
        `,
        [
            Number(perubahanId),
            tahap
        ]
    );

    return rows.length > 0
        ? rows[0].keputusan
        : null;
};

const syncStatusSetelahAnalisis = async (perubahanId) => {
    const [perubahanRows] = await db.query(
        `
        SELECT
            id,
            lingkup,
            status
        FROM mpr_perubahan
        WHERE id = ?
        LIMIT 1
        `,
        [Number(perubahanId)]
    );

    if (perubahanRows.length === 0) {
        return null;
    }

    const perubahan = perubahanRows[0];

    // Jangan mundurkan workflow yang sudah masuk tahap berikutnya.
    if (
        perubahan.status === 'Implementasi' ||
        perubahan.status === 'Evaluasi' ||
        perubahan.status === 'Selesai'
    ) {
        return perubahan.status;
    }

    let keputusanTeknis = null;
    let keputusanOrganisasi = null;

    if (
        perubahan.lingkup === 'Teknis' ||
        perubahan.lingkup === 'Teknis & Organisasi'
    ) {
        keputusanTeknis =
            await getLatestKeputusanPerubahan(
                perubahan.id,
                'Analisis Teknis'
            );
    }

    if (
        perubahan.lingkup === 'Organisasi' ||
        perubahan.lingkup === 'Teknis & Organisasi'
    ) {
        keputusanOrganisasi =
            await getLatestKeputusanPerubahan(
                perubahan.id,
                'Analisis Organisasi'
            );
    }

    const teknisDisetujui =
        perubahan.lingkup !== 'Teknis' &&
        perubahan.lingkup !== 'Teknis & Organisasi'
            ? true
            : keputusanTeknis === 'Disetujui';

    const organisasiDisetujui =
        perubahan.lingkup !== 'Organisasi' &&
        perubahan.lingkup !== 'Teknis & Organisasi'
            ? true
            : keputusanOrganisasi === 'Disetujui';

    const semuaDisetujui =
        teknisDisetujui &&
        organisasiDisetujui;

    const adaKeputusan =
        keputusanTeknis !== null ||
        keputusanOrganisasi !== null;

    let statusBaru = perubahan.status;

    if (semuaDisetujui) {
        statusBaru = 'Implementasi';
    } else if (
        adaKeputusan ||
        perubahan.status === 'Analisis' ||
        perubahan.status === 'Implementasi'
    ) {
        statusBaru = 'Analisis';
    }

    if (statusBaru !== perubahan.status) {
        await db.query(
            `
            UPDATE mpr_perubahan
            SET status = ?
            WHERE id = ?
            `,
            [
                statusBaru,
                perubahan.id
            ]
        );
    }

    return statusBaru;
};

// =========================================
// MPR02A - ANALISIS DAMPAK TEKNIS
// =========================================

const dampakTeknisSelectQuery = `
    SELECT
        dt.id,
        dt.perubahan_id,

        p.kode_perubahan,
        p.layanan_id AS perubahan_layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        dt.risiko_id,
        r.kode_risiko,
        r.peristiwa_risiko,
        r.penyebab,
        r.dampak,
        r.kemungkinan,
        r.nilai_dampak,
        r.besaran_risiko,
        r.keputusan_perlakuan,
        r.prioritas_risiko,

        dt.mkb_insiden_id,
        mi.nama_insiden,
        mi.jenis_kejadian,
        mi.kategori_dampak AS kategori_dampak_insiden,

        dt.created_by,
        u.nama AS dibuat_oleh,
        dt.created_at
    FROM mpr_dampak_teknis dt
    JOIN mpr_perubahan p
        ON p.id = dt.perubahan_id
    JOIN layanan_digital ld
        ON ld.id = p.layanan_id
    JOIN mr_risiko r
        ON r.id = dt.risiko_id
    LEFT JOIN mkb_insiden mi
        ON mi.id = dt.mkb_insiden_id
    JOIN users u
        ON u.id = dt.created_by
`;

const normalizeMkbInsidenId = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return null;
    }

    return Number(value);
};

const validateDampakTeknisInput = ({
    risiko_id,
    mkb_insiden_id
}) => {
    if (!isPositiveInteger(risiko_id)) {
        return 'risiko_id wajib berupa ID yang valid.';
    }

    if (
        mkb_insiden_id !== undefined &&
        mkb_insiden_id !== null &&
        mkb_insiden_id !== '' &&
        !isPositiveInteger(mkb_insiden_id)
    ) {
        return 'mkb_insiden_id harus berupa ID yang valid atau dikosongkan.';
    }

    return null;
};

// GET /api/perubahan/:id/dampak-teknis
exports.getDampakTeknisByPerubahan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${dampakTeknisSelectQuery}
            WHERE dt.perubahan_id = ?
            ORDER BY dt.id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getDampakTeknisByPerubahan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil analisis dampak teknis.'
        });
    }
};

// GET /api/perubahan/dampak-teknis/:id
exports.getDampakTeknisById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID dampak teknis tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${dampakTeknisSelectQuery}
            WHERE dt.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data dampak teknis tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getDampakTeknisById error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil detail dampak teknis.'
        });
    }
};

// POST /api/perubahan/:id/dampak-teknis
exports.createDampakTeknis = async (req, res) => {
    const { id } = req.params;

    const {
        risiko_id,
        mkb_insiden_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    const validationError = validateDampakTeknisInput({
        risiko_id,
        mkb_insiden_id
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const normalizedMkbInsidenId =
        normalizeMkbInsidenId(mkb_insiden_id);

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [risikoRows] = await db.query(
            `
            SELECT id
            FROM mr_risiko
            WHERE id = ?
            LIMIT 1
            `,
            [Number(risiko_id)]
        );

        if (risikoRows.length === 0) {
            return res.status(400).json({
                message: 'Data risiko tidak ditemukan.'
            });
        }

        if (normalizedMkbInsidenId !== null) {
            const [insidenRows] = await db.query(
                `
                SELECT id
                FROM mkb_insiden
                WHERE id = ?
                LIMIT 1
                `,
                [normalizedMkbInsidenId]
            );

            if (insidenRows.length === 0) {
                return res.status(400).json({
                    message: 'Data insiden MKB tidak ditemukan.'
                });
            }
        }

        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM mpr_dampak_teknis
            WHERE perubahan_id = ?
              AND risiko_id = ?
            LIMIT 1
            `,
            [
                Number(id),
                Number(risiko_id)
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message: 'Risiko tersebut sudah tercatat pada perubahan ini.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_dampak_teknis (
                perubahan_id,
                risiko_id,
                mkb_insiden_id,
                created_by
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                Number(id),
                Number(risiko_id),
                normalizedMkbInsidenId,
                req.user.id
            ]
        );

        // Saat analisis dampak mulai dicatat,
// workflow berpindah dari Perencanaan ke Analisis.
await db.query(
    `
    UPDATE mpr_perubahan
    SET status = 'Analisis'
    WHERE id = ?
      AND status = 'Perencanaan'
    `,
    [Number(id)]
);

        const [rows] = await db.query(
            `
            ${dampakTeknisSelectQuery}
            WHERE dt.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Analisis dampak teknis berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createDampakTeknis error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Risiko tersebut sudah tercatat pada perubahan ini.'
            });
        }

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menyimpan analisis dampak teknis.'
        });
    }
};

// PUT /api/perubahan/dampak-teknis/:id
exports.updateDampakTeknis = async (req, res) => {
    const { id } = req.params;

    const {
        risiko_id,
        mkb_insiden_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID dampak teknis tidak valid.'
        });
    }

    const validationError = validateDampakTeknisInput({
        risiko_id,
        mkb_insiden_id
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const normalizedMkbInsidenId =
        normalizeMkbInsidenId(mkb_insiden_id);

    try {
        const [existingRows] = await db.query(
            `
            SELECT id, perubahan_id
            FROM mpr_dampak_teknis
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data dampak teknis tidak ditemukan.'
            });
        }

        const perubahanId = existingRows[0].perubahan_id;

        const [risikoRows] = await db.query(
            `
            SELECT id
            FROM mr_risiko
            WHERE id = ?
            LIMIT 1
            `,
            [Number(risiko_id)]
        );

        if (risikoRows.length === 0) {
            return res.status(400).json({
                message: 'Data risiko tidak ditemukan.'
            });
        }

        if (normalizedMkbInsidenId !== null) {
            const [insidenRows] = await db.query(
                `
                SELECT id
                FROM mkb_insiden
                WHERE id = ?
                LIMIT 1
                `,
                [normalizedMkbInsidenId]
            );

            if (insidenRows.length === 0) {
                return res.status(400).json({
                    message: 'Data insiden MKB tidak ditemukan.'
                });
            }
        }

        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM mpr_dampak_teknis
            WHERE perubahan_id = ?
              AND risiko_id = ?
              AND id <> ?
            LIMIT 1
            `,
            [
                perubahanId,
                Number(risiko_id),
                Number(id)
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message: 'Risiko tersebut sudah tercatat pada perubahan ini.'
            });
        }

        await db.query(
            `
            UPDATE mpr_dampak_teknis
            SET
                risiko_id = ?,
                mkb_insiden_id = ?
            WHERE id = ?
            `,
            [
                Number(risiko_id),
                normalizedMkbInsidenId,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${dampakTeknisSelectQuery}
            WHERE dt.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Analisis dampak teknis berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateDampakTeknis error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Risiko tersebut sudah tercatat pada perubahan ini.'
            });
        }

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui analisis dampak teknis.'
        });
    }
};

// DELETE /api/perubahan/dampak-teknis/:id
exports.deleteDampakTeknis = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID dampak teknis tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_dampak_teknis
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data dampak teknis tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Analisis dampak teknis berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteDampakTeknis error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus analisis dampak teknis.'
        });
    }
};

// =========================================
// MPR02A - PERSETUJUAN ANALISIS TEKNIS
// =========================================

const persetujuanSelectQuery = `
    SELECT
        ps.id,
        ps.perubahan_id,
        p.kode_perubahan,
        ps.tahap,
        ps.keputusan,
        ps.pic_id,
        u.nama AS nama_pic,
        ps.catatan_keputusan,
        ps.diputuskan_at
    FROM mpr_persetujuan ps
    JOIN mpr_perubahan p
        ON p.id = ps.perubahan_id
    JOIN users u
        ON u.id = ps.pic_id
`;

// GET /api/perubahan/:id/persetujuan/analisis-teknis
exports.getPersetujuanAnalisisTeknis = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${persetujuanSelectQuery}
            WHERE ps.perubahan_id = ?
              AND ps.tahap = 'Analisis Teknis'
            ORDER BY ps.diputuskan_at DESC, ps.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getPersetujuanAnalisisTeknis error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil riwayat persetujuan analisis teknis.'
        });
    }
};

const createKeputusanAnalisisTeknis = async (
    req,
    res,
    keputusan
) => {
    const { id } = req.params;
    const { catatan_keputusan } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    if (
        catatan_keputusan !== undefined &&
        catatan_keputusan !== null &&
        typeof catatan_keputusan !== 'string'
    ) {
        return res.status(400).json({
            message: 'catatan_keputusan harus berupa teks.'
        });
    }

    try {
        // Pastikan data perubahan ada
        const [perubahanRows] = await db.query(
            `
            SELECT
                id,
                kode_perubahan,
                status
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        // Keputusan analisis hanya boleh dilakukan
        // selama workflow masih berada pada tahap
        // Perencanaan atau Analisis.
        if (
            !['Perencanaan', 'Analisis'].includes(
                perubahanRows[0].status
            )
        ) {
            return res.status(409).json({
                message:
                    'Keputusan analisis teknis tidak dapat dilakukan karena perubahan telah melewati tahap Analisis.'
            });
        }

        // Analisis teknis harus sudah memiliki minimal satu risiko
        const [dampakTeknisRows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM mpr_dampak_teknis
            WHERE perubahan_id = ?
            `,
            [Number(id)]
        );

        if (Number(dampakTeknisRows[0].total) === 0) {
            return res.status(409).json({
                message:
                    'Analisis dampak teknis belum tersedia.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_persetujuan (
                perubahan_id,
                tahap,
                keputusan,
                pic_id,
                catatan_keputusan
            )
            VALUES (?, 'Analisis Teknis', ?, ?, ?)
            `,
            [
                Number(id),
                keputusan,
                req.user.id,
                typeof catatan_keputusan === 'string'
                    ? catatan_keputusan.trim() || null
                    : null
            ]
        );

        await syncStatusSetelahAnalisis(
            Number(id)
        );

        const [rows] = await db.query(
            `
            ${persetujuanSelectQuery}
            WHERE ps.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                keputusan === 'Disetujui'
                    ? 'Analisis teknis berhasil disetujui.'
                    : 'Analisis teknis berhasil ditolak.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createKeputusanAnalisisTeknis error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan keputusan analisis teknis.'
        });
    }
};


// POST /api/perubahan/:id/persetujuan/analisis-teknis/setujui
exports.approveAnalisisTeknis = async (
    req,
    res
) => {
    return createKeputusanAnalisisTeknis(
        req,
        res,
        'Disetujui'
    );
};


// POST /api/perubahan/:id/persetujuan/analisis-teknis/tolak
exports.rejectAnalisisTeknis = async (
    req,
    res
) => {
    return createKeputusanAnalisisTeknis(
        req,
        res,
        'Tidak Disetujui'
    );
};

// =========================================
// MPR02B - ANALISIS DAMPAK ORGANISASI
// =========================================

const AREA_DAMPAK_ORGANISASI = [
    'Hubungan Pekerjaan',
    'Konten Pekerjaan',
    'Keterampilan dan Kompetensi',
    'Lingkungan Kerja'
];

const UKURAN_PERUBAHAN_ORGANISASI = [
    'Tidak Ada',
    'Rendah',
    'Sedang',
    'Tinggi'
];

const KESIMPULAN_ORGANISASI = [
    'Tidak Ada',
    'Rendah',
    'Sedang',
    'Tinggi'
];

const buildAnalisisOrganisasiResponse = async (
    queryExecutor,
    analisisId
) => {
    const [analisisRows] = await queryExecutor.query(
        `
        SELECT
            ao.id,
            ao.perubahan_id,
            p.kode_perubahan,
            p.detail_perubahan,
            p.lingkup,
            p.klasifikasi,
            ao.kesimpulan,
            ao.rekomendasi,
            ao.created_by,
            u.nama AS dibuat_oleh,
            ao.created_at,
            ao.updated_at
        FROM mpr_analisis_organisasi ao
        JOIN mpr_perubahan p
            ON p.id = ao.perubahan_id
        JOIN users u
            ON u.id = ao.created_by
        WHERE ao.id = ?
        LIMIT 1
        `,
        [Number(analisisId)]
    );

    if (analisisRows.length === 0) {
        return null;
    }

    const analisis = analisisRows[0];

    const [dampakRows] = await queryExecutor.query(
        `
        SELECT
            d.id,
            d.analisis_organisasi_id,
            d.area_dampak,
            d.ukuran_perubahan,
            d.created_at,
            d.updated_at
        FROM mpr_dampak_organisasi d
        WHERE d.analisis_organisasi_id = ?
        ORDER BY FIELD(
            d.area_dampak,
            'Hubungan Pekerjaan',
            'Konten Pekerjaan',
            'Keterampilan dan Kompetensi',
            'Lingkungan Kerja'
        )
        `,
        [Number(analisisId)]
    );

    for (const dampak of dampakRows) {
        const [indikatorRows] = await queryExecutor.query(
            `
            SELECT
                i.id,
                i.area_dampak,
                i.indikator,
                i.urutan
            FROM mpr_dampak_organisasi_indikator doi
            JOIN mpr_indikator_dampak_organisasi i
                ON i.id = doi.indikator_id
            WHERE doi.dampak_organisasi_id = ?
            ORDER BY i.urutan ASC, i.id ASC
            `,
            [dampak.id]
        );

        dampak.indikator = indikatorRows;
    }

    analisis.dampak_organisasi = dampakRows;

    return analisis;
};

// GET /api/perubahan/indikator-dampak-organisasi
exports.getIndikatorDampakOrganisasi = async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                area_dampak,
                indikator,
                urutan
            FROM mpr_indikator_dampak_organisasi
            ORDER BY FIELD(
                area_dampak,
                'Hubungan Pekerjaan',
                'Konten Pekerjaan',
                'Keterampilan dan Kompetensi',
                'Lingkungan Kerja'
            ),
            urutan ASC
            `
        );

        const data = AREA_DAMPAK_ORGANISASI.map((area) => ({
            area_dampak: area,
            indikator: rows.filter(
                (row) => row.area_dampak === area
            )
        }));

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error('getIndikatorDampakOrganisasi error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil indikator dampak organisasi.'
        });
    }
};

// GET /api/perubahan/:id/analisis-organisasi
exports.getAnalisisOrganisasiByPerubahan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [analisisRows] = await db.query(
            `
            SELECT id
            FROM mpr_analisis_organisasi
            WHERE perubahan_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (analisisRows.length === 0) {
            return res.status(404).json({
                message: 'Analisis dampak organisasi belum tersedia.'
            });
        }

        const data = await buildAnalisisOrganisasiResponse(
            db,
            analisisRows[0].id
        );

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error('getAnalisisOrganisasiByPerubahan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil analisis dampak organisasi.'
        });
    }
};

// GET /api/perubahan/analisis-organisasi/:id
exports.getAnalisisOrganisasiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID analisis organisasi tidak valid.'
        });
    }

    try {
        const data = await buildAnalisisOrganisasiResponse(
            db,
            Number(id)
        );

        if (!data) {
            return res.status(404).json({
                message: 'Analisis dampak organisasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error('getAnalisisOrganisasiById error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil detail analisis organisasi.'
        });
    }
};

const validateAnalisisOrganisasiInput = ({
    kesimpulan,
    rekomendasi,
    dampak_organisasi
}) => {
    if (!KESIMPULAN_ORGANISASI.includes(kesimpulan)) {
        return 'kesimpulan harus Tidak Ada, Rendah, Sedang, atau Tinggi.';
    }

    if (
        rekomendasi !== undefined &&
        rekomendasi !== null &&
        typeof rekomendasi !== 'string'
    ) {
        return 'rekomendasi harus berupa teks.';
    }

    if (
        !Array.isArray(dampak_organisasi) ||
        dampak_organisasi.length !== 4
    ) {
        return 'dampak_organisasi wajib berisi tepat 4 area dampak.';
    }

    const areaYangDikirim = new Set();

    for (const item of dampak_organisasi) {
        if (!AREA_DAMPAK_ORGANISASI.includes(item.area_dampak)) {
            return `area_dampak "${item.area_dampak}" tidak valid.`;
        }

        if (areaYangDikirim.has(item.area_dampak)) {
            return `area_dampak "${item.area_dampak}" tidak boleh duplikat.`;
        }

        areaYangDikirim.add(item.area_dampak);

        if (
            !UKURAN_PERUBAHAN_ORGANISASI.includes(
                item.ukuran_perubahan
            )
        ) {
            return `ukuran_perubahan untuk "${item.area_dampak}" tidak valid.`;
        }

        if (
            item.indikator_ids !== undefined &&
            !Array.isArray(item.indikator_ids)
        ) {
            return `indikator_ids untuk "${item.area_dampak}" harus berupa array.`;
        }

        const indikatorIds = item.indikator_ids || [];
        const indikatorUnik = new Set();

        for (const indikatorId of indikatorIds) {
            if (!isPositiveInteger(indikatorId)) {
                return `indikator_ids untuk "${item.area_dampak}" mengandung ID tidak valid.`;
            }

            if (indikatorUnik.has(Number(indikatorId))) {
                return `indikator_ids untuk "${item.area_dampak}" tidak boleh duplikat.`;
            }

            indikatorUnik.add(Number(indikatorId));
        }
    }

    for (const area of AREA_DAMPAK_ORGANISASI) {
        if (!areaYangDikirim.has(area)) {
            return `Area dampak "${area}" wajib diisi.`;
        }
    }

    return null;
};

const saveDampakOrganisasi = async (
    connection,
    analisisOrganisasiId,
    dampakOrganisasi
) => {
    for (const item of dampakOrganisasi) {
        const indikatorIds = (item.indikator_ids || []).map(Number);

        if (indikatorIds.length > 0) {
            const placeholders = indikatorIds
                .map(() => '?')
                .join(',');

            const [indikatorRows] = await connection.query(
                `
                SELECT
                    id,
                    area_dampak
                FROM mpr_indikator_dampak_organisasi
                WHERE id IN (${placeholders})
                `,
                indikatorIds
            );

            if (indikatorRows.length !== indikatorIds.length) {
                const error = new Error(
                    `Terdapat indikator yang tidak ditemukan pada area "${item.area_dampak}".`
                );

                error.statusCode = 400;
                throw error;
            }

            const indikatorSalahArea = indikatorRows.find(
                (indikator) =>
                    indikator.area_dampak !== item.area_dampak
            );

            if (indikatorSalahArea) {
                const error = new Error(
                    `Indikator ID ${indikatorSalahArea.id} tidak termasuk area "${item.area_dampak}".`
                );

                error.statusCode = 400;
                throw error;
            }
        }

        const [dampakResult] = await connection.query(
            `
            INSERT INTO mpr_dampak_organisasi (
                analisis_organisasi_id,
                area_dampak,
                ukuran_perubahan
            )
            VALUES (?, ?, ?)
            `,
            [
                Number(analisisOrganisasiId),
                item.area_dampak,
                item.ukuran_perubahan
            ]
        );

        for (const indikatorId of indikatorIds) {
            await connection.query(
                `
                INSERT INTO mpr_dampak_organisasi_indikator (
                    dampak_organisasi_id,
                    indikator_id
                )
                VALUES (?, ?)
                `,
                [
                    dampakResult.insertId,
                    indikatorId
                ]
            );
        }
    }
};

// POST /api/perubahan/:id/analisis-organisasi
exports.createAnalisisOrganisasi = async (req, res) => {
    const { id } = req.params;

    const {
        kesimpulan,
        rekomendasi,
        dampak_organisasi
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    const validationError = validateAnalisisOrganisasiInput({
        kesimpulan,
        rekomendasi,
        dampak_organisasi
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [perubahanRows] = await connection.query(
            `
            SELECT id, lingkup
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [existingRows] = await connection.query(
            `
            SELECT id
            FROM mpr_analisis_organisasi
            WHERE perubahan_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length > 0) {
            await connection.rollback();

            return res.status(409).json({
                message: 'Analisis dampak organisasi untuk perubahan ini sudah tersedia.'
            });
        }

        const [result] = await connection.query(
            `
            INSERT INTO mpr_analisis_organisasi (
                perubahan_id,
                kesimpulan,
                rekomendasi,
                created_by
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                Number(id),
                kesimpulan,
                typeof rekomendasi === 'string'
                    ? rekomendasi.trim() || null
                    : null,
                req.user.id
            ]
        );

        await saveDampakOrganisasi(
    connection,
    result.insertId,
    dampak_organisasi
);

// Saat analisis dampak mulai dicatat,
// workflow berpindah dari Perencanaan ke Analisis.
        await connection.query(
            `
            UPDATE mpr_perubahan
            SET status = 'Analisis'
            WHERE id = ?
            AND status = 'Perencanaan'
            `,
            [Number(id)]
        );

        const data = await buildAnalisisOrganisasiResponse(
            connection,
            result.insertId
        );

        await connection.commit();

        return res.status(201).json({
            message: 'Analisis dampak organisasi berhasil disimpan.',
            data
        });
    } catch (error) {
        await connection.rollback();

        console.error('createAnalisisOrganisasi error:', error);

        if (error.statusCode === 400) {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Analisis atau area dampak organisasi sudah tersedia.'
            });
        }

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menyimpan analisis dampak organisasi.'
        });
    } finally {
        connection.release();
    }
};

// PUT /api/perubahan/analisis-organisasi/:id
exports.updateAnalisisOrganisasi = async (req, res) => {
    const { id } = req.params;

    const {
        kesimpulan,
        rekomendasi,
        dampak_organisasi
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID analisis organisasi tidak valid.'
        });
    }

    const validationError = validateAnalisisOrganisasiInput({
        kesimpulan,
        rekomendasi,
        dampak_organisasi
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existingRows] = await connection.query(
            `
            SELECT id
            FROM mpr_analisis_organisasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            await connection.rollback();

            return res.status(404).json({
                message: 'Analisis dampak organisasi tidak ditemukan.'
            });
        }

        await connection.query(
            `
            UPDATE mpr_analisis_organisasi
            SET
                kesimpulan = ?,
                rekomendasi = ?
            WHERE id = ?
            `,
            [
                kesimpulan,
                typeof rekomendasi === 'string'
                    ? rekomendasi.trim() || null
                    : null,
                Number(id)
            ]
        );

        /*
         * Child dihapus lalu dibuat ulang supaya payload PUT
         * merepresentasikan kondisi lengkap terbaru.
         * FK junction -> dampak_organisasi memakai ON DELETE CASCADE.
         */
        await connection.query(
            `
            DELETE FROM mpr_dampak_organisasi
            WHERE analisis_organisasi_id = ?
            `,
            [Number(id)]
        );

        await saveDampakOrganisasi(
            connection,
            Number(id),
            dampak_organisasi
        );

        const data = await buildAnalisisOrganisasiResponse(
            connection,
            Number(id)
        );

        await connection.commit();

        return res.status(200).json({
            message: 'Analisis dampak organisasi berhasil diperbarui.',
            data
        });
    } catch (error) {
        await connection.rollback();

        console.error('updateAnalisisOrganisasi error:', error);

        if (error.statusCode === 400) {
            return res.status(400).json({
                message: error.message
            });
        }

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message: 'Terdapat data dampak organisasi yang duplikat.'
            });
        }

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui analisis dampak organisasi.'
        });
    } finally {
        connection.release();
    }
};

// DELETE /api/perubahan/analisis-organisasi/:id
exports.deleteAnalisisOrganisasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID analisis organisasi tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_analisis_organisasi
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Analisis dampak organisasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Analisis dampak organisasi berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteAnalisisOrganisasi error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus analisis dampak organisasi.'
        });
    }
};

// =========================================
// MPR02B - PERSETUJUAN ANALISIS ORGANISASI
// =========================================

// GET /api/perubahan/:id/persetujuan/analisis-organisasi
exports.getPersetujuanAnalisisOrganisasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${persetujuanSelectQuery}
            WHERE ps.perubahan_id = ?
              AND ps.tahap = 'Analisis Organisasi'
            ORDER BY ps.diputuskan_at DESC, ps.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getPersetujuanAnalisisOrganisasi error:',
            error
        );

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil riwayat persetujuan analisis organisasi.'
        });
    }
};

const createKeputusanAnalisisOrganisasi = async (
    req,
    res,
    keputusan
) => {
    const { id } = req.params;
    const { catatan_keputusan } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    if (
        catatan_keputusan !== undefined &&
        catatan_keputusan !== null &&
        typeof catatan_keputusan !== 'string'
    ) {
        return res.status(400).json({
            message: 'catatan_keputusan harus berupa teks.'
        });
    }

    try {
        // Pastikan perubahan ada
        const [perubahanRows] = await db.query(
            `
            SELECT
                id,
                kode_perubahan,
                status
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        // Keputusan analisis hanya boleh dilakukan
        // selama workflow masih berada pada tahap
        // Perencanaan atau Analisis.
        if (
            !['Perencanaan', 'Analisis'].includes(
                perubahanRows[0].status
            )
        ) {
            return res.status(409).json({
                message:
                    'Keputusan analisis organisasi tidak dapat dilakukan karena perubahan telah melewati tahap Analisis.'
            });
        }

        // Analisis organisasi wajib tersedia sebelum keputusan
        const [analisisRows] = await db.query(
            `
            SELECT id
            FROM mpr_analisis_organisasi
            WHERE perubahan_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (analisisRows.length === 0) {
            return res.status(409).json({
                message:
                    'Analisis dampak organisasi belum tersedia.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_persetujuan (
                perubahan_id,
                tahap,
                keputusan,
                pic_id,
                catatan_keputusan
            )
            VALUES (?, 'Analisis Organisasi', ?, ?, ?)
            `,
            [
                Number(id),
                keputusan,
                req.user.id,
                typeof catatan_keputusan === 'string'
                    ? catatan_keputusan.trim() || null
                    : null
            ]
        );

        await syncStatusSetelahAnalisis(
            Number(id)
        );

        const [rows] = await db.query(
            `
            ${persetujuanSelectQuery}
            WHERE ps.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                keputusan === 'Disetujui'
                    ? 'Analisis organisasi berhasil disetujui.'
                    : 'Analisis organisasi berhasil ditolak.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createKeputusanAnalisisOrganisasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan keputusan analisis organisasi.'
        });
    }
};


// APPROVE
exports.approveAnalisisOrganisasi = async (
    req,
    res
) => {
    return createKeputusanAnalisisOrganisasi(
        req,
        res,
        'Disetujui'
    );
};


// REJECT
exports.rejectAnalisisOrganisasi = async (
    req,
    res
) => {
    return createKeputusanAnalisisOrganisasi(
        req,
        res,
        'Tidak Disetujui'
    );
};

// =========================================
// MPR03 - IMPLEMENTASI PERUBAHAN
// =========================================

const implementasiSelectQuery = `
    SELECT
        imp.id,
        imp.perubahan_id,

        p.kode_perubahan,
        p.detail_perubahan,
        p.lingkup,
        p.klasifikasi,
        p.status,

        imp.tanggal_rencana_pelaksanaan,
        imp.jangka_waktu_pelaksanaan,

        imp.unit_pelaksana_id,
        uk.kode_unit AS kode_unit_pelaksana,
        uk.nama_unit AS nama_unit_pelaksana,

        imp.pic_implementasi_id,
        pic.nama AS nama_pic_implementasi,

        imp.created_by,
        creator.nama AS dibuat_oleh,

        imp.created_at,
        imp.updated_at
    FROM mpr_implementasi imp
    JOIN mpr_perubahan p
        ON p.id = imp.perubahan_id
    JOIN unit_kerja uk
        ON uk.id = imp.unit_pelaksana_id
    JOIN users pic
        ON pic.id = imp.pic_implementasi_id
    JOIN users creator
        ON creator.id = imp.created_by
`;

const isValidDateString = (value) => {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};

const validateImplementasiInput = ({
    tanggal_rencana_pelaksanaan,
    jangka_waktu_pelaksanaan,
    unit_pelaksana_id,
    pic_implementasi_id
}) => {
    if (!isValidDateString(tanggal_rencana_pelaksanaan)) {
        return 'tanggal_rencana_pelaksanaan wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.';
    }

    if (
        typeof jangka_waktu_pelaksanaan !== 'string' ||
        jangka_waktu_pelaksanaan.trim() === ''
    ) {
        return 'jangka_waktu_pelaksanaan wajib diisi.';
    }

    if (jangka_waktu_pelaksanaan.trim().length > 100) {
        return 'jangka_waktu_pelaksanaan maksimal 100 karakter.';
    }

    if (!isPositiveInteger(unit_pelaksana_id)) {
        return 'unit_pelaksana_id wajib berupa ID yang valid.';
    }

    if (!isPositiveInteger(pic_implementasi_id)) {
        return 'pic_implementasi_id wajib berupa ID yang valid.';
    }

    return null;
};

// GET /api/perubahan/:id/implementasi
exports.getImplementasiByPerubahan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${implementasiSelectQuery}
            WHERE imp.perubahan_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan belum tersedia.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getImplementasiByPerubahan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil data implementasi perubahan.'
        });
    }
};

// GET /api/perubahan/implementasi/:id
exports.getImplementasiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${implementasiSelectQuery}
            WHERE imp.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getImplementasiById error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil detail implementasi perubahan.'
        });
    }
};

// POST /api/perubahan/:id/implementasi
exports.createImplementasi = async (req, res) => {
    const { id } = req.params;

    const {
        tanggal_rencana_pelaksanaan,
        jangka_waktu_pelaksanaan,
        unit_pelaksana_id,
        pic_implementasi_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    const validationError = validateImplementasiInput({
        tanggal_rencana_pelaksanaan,
        jangka_waktu_pelaksanaan,
        unit_pelaksana_id,
        pic_implementasi_id
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        // Pastikan data perubahan ada
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        // Sinkronkan status berdasarkan keputusan analisis terbaru
        const statusPerubahan =
            await syncStatusSetelahAnalisis(Number(id));

        // MPR03 hanya boleh dimulai jika analisis sudah disetujui
        if (statusPerubahan !== 'Implementasi') {
            return res.status(409).json({
                message:
                    'Perubahan belum dapat masuk tahap implementasi karena proses analisis belum disetujui sepenuhnya.'
            });
        }

        // Satu perubahan hanya boleh memiliki satu implementasi
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE perubahan_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length > 0) {
            return res.status(409).json({
                message:
                    'Implementasi untuk perubahan ini sudah tersedia.'
            });
        }

        // Pastikan unit pelaksana ada
        const [unitRows] = await db.query(
            `
            SELECT id
            FROM unit_kerja
            WHERE id = ?
            LIMIT 1
            `,
            [Number(unit_pelaksana_id)]
        );

        if (unitRows.length === 0) {
            return res.status(400).json({
                message: 'Unit pelaksana tidak ditemukan.'
            });
        }

        // Pastikan PIC implementasi ada
        const [picRows] = await db.query(
            `
            SELECT id
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [Number(pic_implementasi_id)]
        );

        if (picRows.length === 0) {
            return res.status(400).json({
                message: 'PIC implementasi tidak ditemukan.'
            });
        }

        // Simpan implementasi
        const [result] = await db.query(
            `
            INSERT INTO mpr_implementasi (
                perubahan_id,
                tanggal_rencana_pelaksanaan,
                jangka_waktu_pelaksanaan,
                unit_pelaksana_id,
                pic_implementasi_id,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                tanggal_rencana_pelaksanaan,
                jangka_waktu_pelaksanaan.trim(),
                Number(unit_pelaksana_id),
                Number(pic_implementasi_id),
                req.user.id
            ]
        );

        // Ambil data hasil insert
        const [rows] = await db.query(
            `
            ${implementasiSelectQuery}
            WHERE imp.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Data implementasi perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createImplementasi error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Implementasi untuk perubahan ini sudah tersedia.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan implementasi perubahan.'
        });
    }
};

// PUT /api/perubahan/implementasi/:id
exports.updateImplementasi = async (req, res) => {
    const { id } = req.params;

    const {
        tanggal_rencana_pelaksanaan,
        jangka_waktu_pelaksanaan,
        unit_pelaksana_id,
        pic_implementasi_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    const validationError = validateImplementasiInput({
        tanggal_rencana_pelaksanaan,
        jangka_waktu_pelaksanaan,
        unit_pelaksana_id,
        pic_implementasi_id
    });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [unitRows] = await db.query(
            `
            SELECT id
            FROM unit_kerja
            WHERE id = ?
            LIMIT 1
            `,
            [Number(unit_pelaksana_id)]
        );

        if (unitRows.length === 0) {
            return res.status(400).json({
                message: 'Unit pelaksana tidak ditemukan.'
            });
        }

        const [picRows] = await db.query(
            `
            SELECT id
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [Number(pic_implementasi_id)]
        );

        if (picRows.length === 0) {
            return res.status(400).json({
                message: 'PIC implementasi tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_implementasi
            SET
                tanggal_rencana_pelaksanaan = ?,
                jangka_waktu_pelaksanaan = ?,
                unit_pelaksana_id = ?,
                pic_implementasi_id = ?
            WHERE id = ?
            `,
            [
                tanggal_rencana_pelaksanaan,
                jangka_waktu_pelaksanaan.trim(),
                Number(unit_pelaksana_id),
                Number(pic_implementasi_id),
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${implementasiSelectQuery}
            WHERE imp.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Data implementasi perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateImplementasi error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui implementasi perubahan.'
        });
    }
};

// DELETE /api/perubahan/implementasi/:id
exports.deleteImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_implementasi
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Data implementasi perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteImplementasi error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus implementasi perubahan.'
        });
    }
};

// =========================================
// MPR03 - SUMBER DAYA
// =========================================

// GET /api/perubahan/implementasi/:id/sumber-daya
exports.getSumberDayaByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                jenis_sumber_daya,
                deskripsi,
                created_at,
                updated_at
            FROM mpr_sumber_daya
            WHERE implementasi_id = ?
            ORDER BY id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getSumberDayaByImplementasi error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil data sumber daya.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/sumber-daya
exports.createSumberDaya = async (req, res) => {
    const { id } = req.params;
    const { jenis_sumber_daya, deskripsi } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    if (!['Manusia', 'TIK'].includes(jenis_sumber_daya)) {
        return res.status(400).json({
            message: 'jenis_sumber_daya harus Manusia atau TIK.'
        });
    }

    if (
        typeof deskripsi !== 'string' ||
        deskripsi.trim() === ''
    ) {
        return res.status(400).json({
            message: 'deskripsi sumber daya wajib diisi.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_sumber_daya (
                implementasi_id,
                jenis_sumber_daya,
                deskripsi
            )
            VALUES (?, ?, ?)
            `,
            [
                Number(id),
                jenis_sumber_daya,
                deskripsi.trim()
            ]
        );

        const [rows] = await db.query(
            `
            SELECT *
            FROM mpr_sumber_daya
            WHERE id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Sumber daya implementasi berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createSumberDaya error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menyimpan sumber daya.'
        });
    }
};

// PUT /api/perubahan/sumber-daya/:id
exports.updateSumberDaya = async (req, res) => {
    const { id } = req.params;
    const { jenis_sumber_daya, deskripsi } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID sumber daya tidak valid.'
        });
    }

    if (!['Manusia', 'TIK'].includes(jenis_sumber_daya)) {
        return res.status(400).json({
            message: 'jenis_sumber_daya harus Manusia atau TIK.'
        });
    }

    if (
        typeof deskripsi !== 'string' ||
        deskripsi.trim() === ''
    ) {
        return res.status(400).json({
            message: 'deskripsi sumber daya wajib diisi.'
        });
    }

    try {
        const [result] = await db.query(
            `
            UPDATE mpr_sumber_daya
            SET
                jenis_sumber_daya = ?,
                deskripsi = ?
            WHERE id = ?
            `,
            [
                jenis_sumber_daya,
                deskripsi.trim(),
                Number(id)
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data sumber daya tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            SELECT *
            FROM mpr_sumber_daya
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Sumber daya implementasi berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateSumberDaya error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui sumber daya.'
        });
    }
};

// DELETE /api/perubahan/sumber-daya/:id
exports.deleteSumberDaya = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID sumber daya tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `DELETE FROM mpr_sumber_daya WHERE id = ?`,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data sumber daya tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Sumber daya implementasi berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteSumberDaya error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus sumber daya.'
        });
    }
};

// =========================================
// MPR03 - ANGGARAN
// =========================================

// GET /api/perubahan/implementasi/:id/anggaran
exports.getAnggaranByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `SELECT id FROM mpr_implementasi WHERE id = ? LIMIT 1`,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                alokasi_anggaran,
                skema_pembiayaan,
                created_at,
                updated_at
            FROM mpr_anggaran
            WHERE implementasi_id = ?
            ORDER BY id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getAnggaranByImplementasi error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil data anggaran.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/anggaran
exports.createAnggaran = async (req, res) => {
    const { id } = req.params;
    const { alokasi_anggaran, skema_pembiayaan } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    const nilaiAnggaran = Number(alokasi_anggaran);

    if (
        alokasi_anggaran === '' ||
        alokasi_anggaran === null ||
        alokasi_anggaran === undefined ||
        !Number.isFinite(nilaiAnggaran) ||
        nilaiAnggaran < 0
    ) {
        return res.status(400).json({
            message: 'alokasi_anggaran wajib berupa angka 0 atau lebih.'
        });
    }

    if (
        typeof skema_pembiayaan !== 'string' ||
        skema_pembiayaan.trim() === ''
    ) {
        return res.status(400).json({
            message: 'skema_pembiayaan wajib diisi.'
        });
    }

    if (skema_pembiayaan.trim().length > 255) {
        return res.status(400).json({
            message: 'skema_pembiayaan maksimal 255 karakter.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `SELECT id FROM mpr_implementasi WHERE id = ? LIMIT 1`,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_anggaran (
                implementasi_id,
                alokasi_anggaran,
                skema_pembiayaan
            )
            VALUES (?, ?, ?)
            `,
            [
                Number(id),
                nilaiAnggaran,
                skema_pembiayaan.trim()
            ]
        );

        const [rows] = await db.query(
            `SELECT * FROM mpr_anggaran WHERE id = ? LIMIT 1`,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Anggaran implementasi berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createAnggaran error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menyimpan anggaran.'
        });
    }
};

// PUT /api/perubahan/anggaran/:id
exports.updateAnggaran = async (req, res) => {
    const { id } = req.params;
    const { alokasi_anggaran, skema_pembiayaan } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID anggaran tidak valid.'
        });
    }

    const nilaiAnggaran = Number(alokasi_anggaran);

    if (
        alokasi_anggaran === '' ||
        alokasi_anggaran === null ||
        alokasi_anggaran === undefined ||
        !Number.isFinite(nilaiAnggaran) ||
        nilaiAnggaran < 0
    ) {
        return res.status(400).json({
            message: 'alokasi_anggaran wajib berupa angka 0 atau lebih.'
        });
    }

    if (
        typeof skema_pembiayaan !== 'string' ||
        skema_pembiayaan.trim() === ''
    ) {
        return res.status(400).json({
            message: 'skema_pembiayaan wajib diisi.'
        });
    }

    try {
        const [result] = await db.query(
            `
            UPDATE mpr_anggaran
            SET
                alokasi_anggaran = ?,
                skema_pembiayaan = ?
            WHERE id = ?
            `,
            [
                nilaiAnggaran,
                skema_pembiayaan.trim(),
                Number(id)
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data anggaran tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `SELECT * FROM mpr_anggaran WHERE id = ? LIMIT 1`,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Anggaran implementasi berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateAnggaran error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui anggaran.'
        });
    }
};

// DELETE /api/perubahan/anggaran/:id
exports.deleteAnggaran = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID anggaran tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `DELETE FROM mpr_anggaran WHERE id = ?`,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data anggaran tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Anggaran implementasi berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteAnggaran error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus anggaran.'
        });
    }
};

// =========================================
// MPR03 - INDIKATOR KEBERHASILAN
// =========================================

// GET /api/perubahan/implementasi/:id/indikator-keberhasilan
exports.getIndikatorKeberhasilanByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `SELECT id FROM mpr_implementasi WHERE id = ? LIMIT 1`,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                indikator,
                created_at,
                updated_at
            FROM mpr_indikator_keberhasilan
            WHERE implementasi_id = ?
            ORDER BY id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getIndikatorKeberhasilanByImplementasi error:',
            error
        );

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengambil indikator keberhasilan.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/indikator-keberhasilan
exports.createIndikatorKeberhasilan = async (req, res) => {
    const { id } = req.params;
    const { indikator } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    if (
        typeof indikator !== 'string' ||
        indikator.trim() === ''
    ) {
        return res.status(400).json({
            message: 'indikator keberhasilan wajib diisi.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `SELECT id FROM mpr_implementasi WHERE id = ? LIMIT 1`,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_indikator_keberhasilan (
                implementasi_id,
                indikator
            )
            VALUES (?, ?)
            `,
            [
                Number(id),
                indikator.trim()
            ]
        );

        const [rows] = await db.query(
            `
            SELECT *
            FROM mpr_indikator_keberhasilan
            WHERE id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Indikator keberhasilan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createIndikatorKeberhasilan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menyimpan indikator keberhasilan.'
        });
    }
};

// PUT /api/perubahan/indikator-keberhasilan/:id
exports.updateIndikatorKeberhasilan = async (req, res) => {
    const { id } = req.params;
    const { indikator } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID indikator keberhasilan tidak valid.'
        });
    }

    if (
        typeof indikator !== 'string' ||
        indikator.trim() === ''
    ) {
        return res.status(400).json({
            message: 'indikator keberhasilan wajib diisi.'
        });
    }

    try {
        const [result] = await db.query(
            `
            UPDATE mpr_indikator_keberhasilan
            SET indikator = ?
            WHERE id = ?
            `,
            [
                indikator.trim(),
                Number(id)
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Indikator keberhasilan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            SELECT *
            FROM mpr_indikator_keberhasilan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Indikator keberhasilan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateIndikatorKeberhasilan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memperbarui indikator keberhasilan.'
        });
    }
};

// DELETE /api/perubahan/indikator-keberhasilan/:id
exports.deleteIndikatorKeberhasilan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID indikator keberhasilan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_indikator_keberhasilan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Indikator keberhasilan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Indikator keberhasilan berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteIndikatorKeberhasilan error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat menghapus indikator keberhasilan.'
        });
    }
};

// =====================================================
// MPR03 - STRATEGI IMPLEMENTASI
// =====================================================

const normalizeStrategiText = (value) => {
    if (value === undefined || value === null) {
        return null;
    }

    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();

    return trimmed === '' ? null : trimmed;
};

const validateStrategiImplementasiInput = (body) => {
    const strategiIt = normalizeStrategiText(body.strategi_it_generik);
    const deskripsiIt = normalizeStrategiText(body.deskripsi_strategi_it);
    const rollbackPlan = normalizeStrategiText(body.rollback_plan);

    const strategiOrganisasi = normalizeStrategiText(
        body.strategi_organisasi_generik
    );

    const detailOrganisasi = normalizeStrategiText(
        body.detail_strategi_organisasi
    );

    // Semua field yang dikirim harus berupa string atau null
    const fields = [
        body.strategi_it_generik,
        body.deskripsi_strategi_it,
        body.rollback_plan,
        body.strategi_organisasi_generik,
        body.detail_strategi_organisasi
    ];

    for (const field of fields) {
        if (
            field !== undefined &&
            field !== null &&
            typeof field !== 'string'
        ) {
            return {
                valid: false,
                message: 'Field strategi implementasi harus berupa teks.'
            };
        }
    }

    // Minimal salah satu strategi
    if (!strategiIt && !strategiOrganisasi) {
        return {
            valid: false,
            message:
                'Minimal salah satu strategi IT atau strategi organisasi wajib diisi.'
        };
    }

    // Kalau salah satu bagian IT terisi,
    // strategi_it_generik + deskripsi_strategi_it wajib lengkap
    if (
        (strategiIt || deskripsiIt || rollbackPlan) &&
        (!strategiIt || !deskripsiIt)
    ) {
        return {
            valid: false,
            message:
                'Strategi IT dan deskripsi strategi IT wajib diisi secara lengkap.'
        };
    }

    // Maksimal varchar(150)
    if (strategiIt && strategiIt.length > 150) {
        return {
            valid: false,
            message: 'strategi_it_generik maksimal 150 karakter.'
        };
    }

    // Kalau salah satu bagian organisasi terisi,
    // keduanya wajib lengkap
    if (
        (strategiOrganisasi || detailOrganisasi) &&
        (!strategiOrganisasi || !detailOrganisasi)
    ) {
        return {
            valid: false,
            message:
                'Strategi organisasi dan detail strategi organisasi wajib diisi secara lengkap.'
        };
    }

    if (
        strategiOrganisasi &&
        strategiOrganisasi.length > 150
    ) {
        return {
            valid: false,
            message:
                'strategi_organisasi_generik maksimal 150 karakter.'
        };
    }

    return {
        valid: true,
        data: {
            strategi_it_generik: strategiIt,
            deskripsi_strategi_it: deskripsiIt,
            rollback_plan: rollbackPlan,
            strategi_organisasi_generik: strategiOrganisasi,
            detail_strategi_organisasi: detailOrganisasi
        }
    };
};

const strategiImplementasiSelectQuery = `
    SELECT
        si.id,
        si.implementasi_id,
        p.id AS perubahan_id,
        p.kode_perubahan,
        si.strategi_it_generik,
        si.deskripsi_strategi_it,
        si.rollback_plan,
        si.strategi_organisasi_generik,
        si.detail_strategi_organisasi,
        si.created_at,
        si.updated_at
    FROM mpr_strategi_implementasi si
    JOIN mpr_implementasi imp
        ON imp.id = si.implementasi_id
    JOIN mpr_perubahan p
        ON p.id = imp.perubahan_id
`;

// GET /api/perubahan/implementasi/:id/strategi-implementasi
exports.getStrategiImplementasiByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${strategiImplementasiSelectQuery}
            WHERE si.implementasi_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Strategi implementasi belum tersedia.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getStrategiImplementasiByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil strategi implementasi.'
        });
    }
};

// GET /api/perubahan/strategi-implementasi/:id
exports.getStrategiImplementasiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID strategi implementasi tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${strategiImplementasiSelectQuery}
            WHERE si.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Strategi implementasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getStrategiImplementasiById error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil strategi implementasi.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/strategi-implementasi
exports.createStrategiImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    const validation = validateStrategiImplementasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        // Cek parent implementasi
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        // Satu implementasi hanya boleh satu strategi
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_strategi_implementasi
            WHERE implementasi_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length > 0) {
            return res.status(409).json({
                message:
                    'Strategi implementasi untuk perubahan ini sudah tersedia.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_strategi_implementasi (
                implementasi_id,
                strategi_it_generik,
                deskripsi_strategi_it,
                rollback_plan,
                strategi_organisasi_generik,
                detail_strategi_organisasi
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                data.strategi_it_generik,
                data.deskripsi_strategi_it,
                data.rollback_plan,
                data.strategi_organisasi_generik,
                data.detail_strategi_organisasi
            ]
        );

        const [rows] = await db.query(
            `
            ${strategiImplementasiSelectQuery}
            WHERE si.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Strategi implementasi berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createStrategiImplementasi error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Strategi implementasi untuk perubahan ini sudah tersedia.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan strategi implementasi.'
        });
    }
};

// PUT /api/perubahan/strategi-implementasi/:id
exports.updateStrategiImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID strategi implementasi tidak valid.'
        });
    }

    const validation = validateStrategiImplementasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_strategi_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Strategi implementasi tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_strategi_implementasi
            SET
                strategi_it_generik = ?,
                deskripsi_strategi_it = ?,
                rollback_plan = ?,
                strategi_organisasi_generik = ?,
                detail_strategi_organisasi = ?
            WHERE id = ?
            `,
            [
                data.strategi_it_generik,
                data.deskripsi_strategi_it,
                data.rollback_plan,
                data.strategi_organisasi_generik,
                data.detail_strategi_organisasi,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${strategiImplementasiSelectQuery}
            WHERE si.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Strategi implementasi berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateStrategiImplementasi error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui strategi implementasi.'
        });
    }
};

// DELETE /api/perubahan/strategi-implementasi/:id
exports.deleteStrategiImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID strategi implementasi tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_strategi_implementasi
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Strategi implementasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Strategi implementasi berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteStrategiImplementasi error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus strategi implementasi.'
        });
    }
};

// =====================================================
// MPR03 - STAKEHOLDER
// =====================================================

const validateStakeholderInput = (body) => {
    const {
        nama_stakeholder,
        kategori_pemangku_kepentingan,
        sifat_resistensi,
        tingkat_resistensi
    } = body;

    if (
        typeof nama_stakeholder !== 'string' ||
        nama_stakeholder.trim() === ''
    ) {
        return {
            valid: false,
            message: 'nama_stakeholder wajib diisi.'
        };
    }

    if (nama_stakeholder.trim().length > 200) {
        return {
            valid: false,
            message: 'nama_stakeholder maksimal 200 karakter.'
        };
    }

    if (
        typeof kategori_pemangku_kepentingan !== 'string' ||
        kategori_pemangku_kepentingan.trim() === ''
    ) {
        return {
            valid: false,
            message: 'kategori_pemangku_kepentingan wajib diisi.'
        };
    }

    if (kategori_pemangku_kepentingan.trim().length > 150) {
        return {
            valid: false,
            message:
                'kategori_pemangku_kepentingan maksimal 150 karakter.'
        };
    }

    if (
        typeof sifat_resistensi !== 'string' ||
        sifat_resistensi.trim() === ''
    ) {
        return {
            valid: false,
            message: 'sifat_resistensi wajib diisi.'
        };
    }

    if (sifat_resistensi.trim().length > 200) {
        return {
            valid: false,
            message: 'sifat_resistensi maksimal 200 karakter.'
        };
    }

    if (
        typeof tingkat_resistensi !== 'string' ||
        tingkat_resistensi.trim() === ''
    ) {
        return {
            valid: false,
            message: 'tingkat_resistensi wajib diisi.'
        };
    }

    if (tingkat_resistensi.trim().length > 100) {
        return {
            valid: false,
            message: 'tingkat_resistensi maksimal 100 karakter.'
        };
    }

    return {
        valid: true,
        data: {
            nama_stakeholder: nama_stakeholder.trim(),
            kategori_pemangku_kepentingan:
                kategori_pemangku_kepentingan.trim(),
            sifat_resistensi: sifat_resistensi.trim(),
            tingkat_resistensi: tingkat_resistensi.trim()
        }
    };
};

// GET /api/perubahan/implementasi/:id/stakeholder
exports.getStakeholderByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_stakeholder,
                kategori_pemangku_kepentingan,
                sifat_resistensi,
                tingkat_resistensi,
                created_at,
                updated_at
            FROM mpr_stakeholder
            WHERE implementasi_id = ?
            ORDER BY id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getStakeholderByImplementasi error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data stakeholder.'
        });
    }
};

// GET /api/perubahan/stakeholder/:id
exports.getStakeholderById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID stakeholder tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_stakeholder,
                kategori_pemangku_kepentingan,
                sifat_resistensi,
                tingkat_resistensi,
                created_at,
                updated_at
            FROM mpr_stakeholder
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data stakeholder tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getStakeholderById error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data stakeholder.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/stakeholder
exports.createStakeholder = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    const validation = validateStakeholderInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message: 'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_stakeholder (
                implementasi_id,
                nama_stakeholder,
                kategori_pemangku_kepentingan,
                sifat_resistensi,
                tingkat_resistensi
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                data.nama_stakeholder,
                data.kategori_pemangku_kepentingan,
                data.sifat_resistensi,
                data.tingkat_resistensi
            ]
        );

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_stakeholder,
                kategori_pemangku_kepentingan,
                sifat_resistensi,
                tingkat_resistensi,
                created_at,
                updated_at
            FROM mpr_stakeholder
            WHERE id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Data stakeholder berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createStakeholder error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data stakeholder.'
        });
    }
};

// PUT /api/perubahan/stakeholder/:id
exports.updateStakeholder = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID stakeholder tidak valid.'
        });
    }

    const validation = validateStakeholderInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_stakeholder
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data stakeholder tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_stakeholder
            SET
                nama_stakeholder = ?,
                kategori_pemangku_kepentingan = ?,
                sifat_resistensi = ?,
                tingkat_resistensi = ?
            WHERE id = ?
            `,
            [
                data.nama_stakeholder,
                data.kategori_pemangku_kepentingan,
                data.sifat_resistensi,
                data.tingkat_resistensi,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_stakeholder,
                kategori_pemangku_kepentingan,
                sifat_resistensi,
                tingkat_resistensi,
                created_at,
                updated_at
            FROM mpr_stakeholder
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Data stakeholder berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updateStakeholder error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data stakeholder.'
        });
    }
};

// DELETE /api/perubahan/stakeholder/:id
exports.deleteStakeholder = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID stakeholder tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_stakeholder
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data stakeholder tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Data stakeholder berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteStakeholder error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus data stakeholder.'
        });
    }
};

// =====================================================
// MPR03 - KOMUNIKASI & MEDIA KOMUNIKASI
// =====================================================

const validateKomunikasiInput = (body) => {
    const {
        informasi,
        pengirim_informan,
        target_audiens,
        tanggal_rencana_komunikasi,
        media_komunikasi
    } = body;

    if (
        typeof informasi !== 'string' ||
        informasi.trim() === ''
    ) {
        return {
            valid: false,
            message: 'informasi wajib diisi.'
        };
    }

    if (
        typeof pengirim_informan !== 'string' ||
        pengirim_informan.trim() === ''
    ) {
        return {
            valid: false,
            message: 'pengirim_informan wajib diisi.'
        };
    }

    if (pengirim_informan.trim().length > 200) {
        return {
            valid: false,
            message: 'pengirim_informan maksimal 200 karakter.'
        };
    }

    if (
        typeof target_audiens !== 'string' ||
        target_audiens.trim() === ''
    ) {
        return {
            valid: false,
            message: 'target_audiens wajib diisi.'
        };
    }

    if (!isValidDateString(tanggal_rencana_komunikasi)) {
        return {
            valid: false,
            message:
                'tanggal_rencana_komunikasi wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.'
        };
    }

    if (
        !Array.isArray(media_komunikasi) ||
        media_komunikasi.length === 0
    ) {
        return {
            valid: false,
            message:
                'media_komunikasi wajib berupa array dan minimal berisi satu media.'
        };
    }

    const normalizedMedia = [];

    for (const media of media_komunikasi) {
        if (
            typeof media !== 'string' ||
            media.trim() === ''
        ) {
            return {
                valid: false,
                message:
                    'Setiap media_komunikasi wajib berupa teks dan tidak boleh kosong.'
            };
        }

        const trimmedMedia = media.trim();

        if (trimmedMedia.length > 100) {
            return {
                valid: false,
                message:
                    'Setiap media_komunikasi maksimal 100 karakter.'
            };
        }

        normalizedMedia.push(trimmedMedia);
    }

    // Hindari duplicate, termasuk beda huruf besar-kecil
    const mediaKeys = normalizedMedia.map((media) =>
        media.toLowerCase()
    );

    if (new Set(mediaKeys).size !== mediaKeys.length) {
        return {
            valid: false,
            message:
                'media_komunikasi tidak boleh memiliki nilai yang sama.'
        };
    }

    return {
        valid: true,
        data: {
            informasi: informasi.trim(),
            pengirim_informan: pengirim_informan.trim(),
            target_audiens: target_audiens.trim(),
            tanggal_rencana_komunikasi,
            media_komunikasi: normalizedMedia
        }
    };
};

const buildKomunikasiResponse = async (
    queryExecutor,
    komunikasiId
) => {
    const [komunikasiRows] = await queryExecutor.query(
        `
        SELECT
            k.id,
            k.implementasi_id,
            p.id AS perubahan_id,
            p.kode_perubahan,
            k.informasi,
            k.pengirim_informan,
            k.target_audiens,
            k.tanggal_rencana_komunikasi,
            k.created_at,
            k.updated_at
        FROM mpr_komunikasi k
        JOIN mpr_implementasi imp
            ON imp.id = k.implementasi_id
        JOIN mpr_perubahan p
            ON p.id = imp.perubahan_id
        WHERE k.id = ?
        LIMIT 1
        `,
        [Number(komunikasiId)]
    );

    if (komunikasiRows.length === 0) {
        return null;
    }

    const [mediaRows] = await queryExecutor.query(
        `
        SELECT
            id,
            komunikasi_id,
            media_komunikasi,
            created_at
        FROM mpr_media_komunikasi
        WHERE komunikasi_id = ?
        ORDER BY id ASC
        `,
        [Number(komunikasiId)]
    );

    return {
        ...komunikasiRows[0],
        media_komunikasi: mediaRows
    };
};

// GET /api/perubahan/implementasi/:id/komunikasi
exports.getKomunikasiByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [komunikasiRows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                informasi,
                pengirim_informan,
                target_audiens,
                tanggal_rencana_komunikasi,
                created_at,
                updated_at
            FROM mpr_komunikasi
            WHERE implementasi_id = ?
            ORDER BY id ASC
            `,
            [Number(id)]
        );

        if (komunikasiRows.length === 0) {
            return res.status(200).json({
                data: []
            });
        }

        const [mediaRows] = await db.query(
            `
            SELECT
                mk.id,
                mk.komunikasi_id,
                mk.media_komunikasi,
                mk.created_at
            FROM mpr_media_komunikasi mk
            JOIN mpr_komunikasi k
                ON k.id = mk.komunikasi_id
            WHERE k.implementasi_id = ?
            ORDER BY mk.id ASC
            `,
            [Number(id)]
        );

        const data = komunikasiRows.map((komunikasi) => ({
            ...komunikasi,
            media_komunikasi: mediaRows.filter(
                (media) =>
                    media.komunikasi_id === komunikasi.id
            )
        }));

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error(
            'getKomunikasiByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data komunikasi.'
        });
    }
};

// GET /api/perubahan/komunikasi/:id
exports.getKomunikasiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID komunikasi tidak valid.'
        });
    }

    try {
        const data = await buildKomunikasiResponse(
            db,
            Number(id)
        );

        if (!data) {
            return res.status(404).json({
                message: 'Data komunikasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error('getKomunikasiById error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data komunikasi.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/komunikasi
exports.createKomunikasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    const validation = validateKomunikasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;
    let connection;

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [result] = await connection.query(
            `
            INSERT INTO mpr_komunikasi (
                implementasi_id,
                informasi,
                pengirim_informan,
                target_audiens,
                tanggal_rencana_komunikasi
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                data.informasi,
                data.pengirim_informan,
                data.target_audiens,
                data.tanggal_rencana_komunikasi
            ]
        );

        for (const media of data.media_komunikasi) {
            await connection.query(
                `
                INSERT INTO mpr_media_komunikasi (
                    komunikasi_id,
                    media_komunikasi
                )
                VALUES (?, ?)
                `,
                [
                    result.insertId,
                    media
                ]
            );
        }

        await connection.commit();

        const responseData =
            await buildKomunikasiResponse(
                db,
                result.insertId
            );

        return res.status(201).json({
            message:
                'Rencana komunikasi berhasil disimpan.',
            data: responseData
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('createKomunikasi error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Media komunikasi tidak boleh duplikat.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan rencana komunikasi.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// PUT /api/perubahan/komunikasi/:id
exports.updateKomunikasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID komunikasi tidak valid.'
        });
    }

    const validation = validateKomunikasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;
    let connection;

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_komunikasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data komunikasi tidak ditemukan.'
            });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        await connection.query(
            `
            UPDATE mpr_komunikasi
            SET
                informasi = ?,
                pengirim_informan = ?,
                target_audiens = ?,
                tanggal_rencana_komunikasi = ?
            WHERE id = ?
            `,
            [
                data.informasi,
                data.pengirim_informan,
                data.target_audiens,
                data.tanggal_rencana_komunikasi,
                Number(id)
            ]
        );

        // Media diganti sesuai payload terbaru
        await connection.query(
            `
            DELETE FROM mpr_media_komunikasi
            WHERE komunikasi_id = ?
            `,
            [Number(id)]
        );

        for (const media of data.media_komunikasi) {
            await connection.query(
                `
                INSERT INTO mpr_media_komunikasi (
                    komunikasi_id,
                    media_komunikasi
                )
                VALUES (?, ?)
                `,
                [
                    Number(id),
                    media
                ]
            );
        }

        await connection.commit();

        const responseData =
            await buildKomunikasiResponse(
                db,
                Number(id)
            );

        return res.status(200).json({
            message:
                'Rencana komunikasi berhasil diperbarui.',
            data: responseData
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error('updateKomunikasi error:', error);

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Media komunikasi tidak boleh duplikat.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui rencana komunikasi.'
        });
    } finally {
        if (connection) {
            connection.release();
        }
    }
};

// DELETE /api/perubahan/komunikasi/:id
exports.deleteKomunikasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID komunikasi tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_komunikasi
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data komunikasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Rencana komunikasi berhasil dihapus.'
        });
    } catch (error) {
        console.error('deleteKomunikasi error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus rencana komunikasi.'
        });
    }
};

// =====================================================
// MPR03 - PELATIHAN
// =====================================================

const validatePelatihanInput = (body) => {
    const {
        nama_pelatihan,
        target_peserta,
        target_jumlah,
        metode_pelatihan,
        tanggal_rencana_pelaksanaan
    } = body;

    if (
        typeof nama_pelatihan !== 'string' ||
        nama_pelatihan.trim() === ''
    ) {
        return {
            valid: false,
            message: 'nama_pelatihan wajib diisi.'
        };
    }

    if (nama_pelatihan.trim().length > 200) {
        return {
            valid: false,
            message: 'nama_pelatihan maksimal 200 karakter.'
        };
    }

    if (
        typeof target_peserta !== 'string' ||
        target_peserta.trim() === ''
    ) {
        return {
            valid: false,
            message: 'target_peserta wajib diisi.'
        };
    }

    if (target_peserta.trim().length > 255) {
        return {
            valid: false,
            message: 'target_peserta maksimal 255 karakter.'
        };
    }

    if (
        !Number.isInteger(Number(target_jumlah)) ||
        Number(target_jumlah) <= 0
    ) {
        return {
            valid: false,
            message:
                'target_jumlah wajib berupa bilangan bulat lebih dari 0.'
        };
    }

    if (
        typeof metode_pelatihan !== 'string' ||
        metode_pelatihan.trim() === ''
    ) {
        return {
            valid: false,
            message: 'metode_pelatihan wajib diisi.'
        };
    }

    if (metode_pelatihan.trim().length > 150) {
        return {
            valid: false,
            message: 'metode_pelatihan maksimal 150 karakter.'
        };
    }

    if (!isValidDateString(tanggal_rencana_pelaksanaan)) {
        return {
            valid: false,
            message:
                'tanggal_rencana_pelaksanaan wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.'
        };
    }

    return {
        valid: true,
        data: {
            nama_pelatihan: nama_pelatihan.trim(),
            target_peserta: target_peserta.trim(),
            target_jumlah: Number(target_jumlah),
            metode_pelatihan: metode_pelatihan.trim(),
            tanggal_rencana_pelaksanaan
        }
    };
};

// GET /api/perubahan/implementasi/:id/pelatihan
exports.getPelatihanByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_pelatihan,
                target_peserta,
                target_jumlah,
                metode_pelatihan,
                tanggal_rencana_pelaksanaan,
                created_at,
                updated_at
            FROM mpr_pelatihan
            WHERE implementasi_id = ?
            ORDER BY id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getPelatihanByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data pelatihan.'
        });
    }
};

// GET /api/perubahan/pelatihan/:id
exports.getPelatihanById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID pelatihan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_pelatihan,
                target_peserta,
                target_jumlah,
                metode_pelatihan,
                tanggal_rencana_pelaksanaan,
                created_at,
                updated_at
            FROM mpr_pelatihan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message: 'Data pelatihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error('getPelatihanById error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data pelatihan.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/pelatihan
exports.createPelatihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    const validation = validatePelatihanInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_pelatihan (
                implementasi_id,
                nama_pelatihan,
                target_peserta,
                target_jumlah,
                metode_pelatihan,
                tanggal_rencana_pelaksanaan
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                data.nama_pelatihan,
                data.target_peserta,
                data.target_jumlah,
                data.metode_pelatihan,
                data.tanggal_rencana_pelaksanaan
            ]
        );

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_pelatihan,
                target_peserta,
                target_jumlah,
                metode_pelatihan,
                tanggal_rencana_pelaksanaan,
                created_at,
                updated_at
            FROM mpr_pelatihan
            WHERE id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message: 'Data pelatihan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error('createPelatihan error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data pelatihan.'
        });
    }
};

// PUT /api/perubahan/pelatihan/:id
exports.updatePelatihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID pelatihan tidak valid.'
        });
    }

    const validation = validatePelatihanInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_pelatihan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message: 'Data pelatihan tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_pelatihan
            SET
                nama_pelatihan = ?,
                target_peserta = ?,
                target_jumlah = ?,
                metode_pelatihan = ?,
                tanggal_rencana_pelaksanaan = ?
            WHERE id = ?
            `,
            [
                data.nama_pelatihan,
                data.target_peserta,
                data.target_jumlah,
                data.metode_pelatihan,
                data.tanggal_rencana_pelaksanaan,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            SELECT
                id,
                implementasi_id,
                nama_pelatihan,
                target_peserta,
                target_jumlah,
                metode_pelatihan,
                tanggal_rencana_pelaksanaan,
                created_at,
                updated_at
            FROM mpr_pelatihan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message: 'Data pelatihan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error('updatePelatihan error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data pelatihan.'
        });
    }
};

// DELETE /api/perubahan/pelatihan/:id
exports.deletePelatihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID pelatihan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_pelatihan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message: 'Data pelatihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message: 'Data pelatihan berhasil dihapus.'
        });
    } catch (error) {
        console.error('deletePelatihan error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus data pelatihan.'
        });
    }
};

// =====================================================
// MPR03 - PERSETUJUAN PELAKSANAAN
// =====================================================

// GET /api/perubahan/:id/persetujuan/pelaksanaan
exports.getPersetujuanPelaksanaan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message: 'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${persetujuanSelectQuery}
            WHERE ps.perubahan_id = ?
              AND ps.tahap = 'Pelaksanaan'
            ORDER BY ps.diputuskan_at DESC, ps.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error('getPersetujuanPelaksanaan error:', error);

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil persetujuan pelaksanaan.'
        });
    }
};

const createKeputusanPelaksanaan = async (
    req,
    res,
    keputusan
) => {
    const { id } = req.params;
    const { catatan_keputusan } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    if (
        catatan_keputusan !== undefined &&
        catatan_keputusan !== null &&
        typeof catatan_keputusan !== 'string'
    ) {
        return res.status(400).json({
            message:
                'catatan_keputusan harus berupa teks.'
        });
    }

    try {
        // Pastikan perubahan ada
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        // Sinkronkan status berdasarkan keputusan
        // Analisis Teknis dan/atau Analisis Organisasi terbaru
        const statusPerubahan =
            await syncStatusSetelahAnalisis(
                Number(id)
            );

        // Persetujuan pelaksanaan hanya boleh dilakukan
        // jika perubahan sudah resmi masuk tahap Implementasi
        if (statusPerubahan !== 'Implementasi') {
            return res.status(409).json({
                message:
                    'Pelaksanaan belum dapat diputuskan karena tahap analisis belum disetujui sepenuhnya.'
            });
        }

        // Pastikan data implementasi sudah tersedia
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE perubahan_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(400).json({
                message:
                    'Data implementasi perubahan belum tersedia.'
            });
        }

        // Simpan keputusan sebagai history persetujuan
        const [result] = await db.query(
            `
            INSERT INTO mpr_persetujuan (
                perubahan_id,
                tahap,
                keputusan,
                pic_id,
                catatan_keputusan
            )
            VALUES (?, 'Pelaksanaan', ?, ?, ?)
            `,
            [
                Number(id),
                keputusan,
                req.user.id,
                typeof catatan_keputusan === 'string' &&
                catatan_keputusan.trim() !== ''
                    ? catatan_keputusan.trim()
                    : null
            ]
        );

        const [rows] = await db.query(
            `
            ${persetujuanSelectQuery}
            WHERE ps.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        if (keputusan === 'Disetujui') {
            await db.query(
                `
                UPDATE mpr_perubahan
                SET status = 'Evaluasi'
                WHERE id = ?
                `,
                [Number(id)]
            );
        }

        return res.status(201).json({
            message:
                keputusan === 'Disetujui'
                    ? 'Pelaksanaan perubahan berhasil disetujui.'
                    : 'Pelaksanaan perubahan berhasil ditolak.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createKeputusanPelaksanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan keputusan pelaksanaan.'
        });
    }
};

exports.approvePelaksanaan = async (req, res) => {
    return createKeputusanPelaksanaan(
        req,
        res,
        'Disetujui'
    );
};

exports.rejectPelaksanaan = async (req, res) => {
    return createKeputusanPelaksanaan(
        req,
        res,
        'Tidak Disetujui'
    );
};

// =====================================================
// MPR04 - EVALUASI PERUBAHAN
// =====================================================

const evaluasiSelectQuery = `
    SELECT
        ev.id,
        ev.implementasi_id,

        imp.perubahan_id,
        p.kode_perubahan,
        p.detail_perubahan,
        p.klasifikasi,
        p.lingkup,
        p.status,

        ev.tanggal_evaluasi,
        ev.ringkasan_tinjauan,
        ev.isu_perbaikan,
        ev.pembelajaran,

        ev.created_by,
        u.nama AS dibuat_oleh,

        ev.created_at,
        ev.updated_at
    FROM mpr_evaluasi ev
    JOIN mpr_implementasi imp
        ON imp.id = ev.implementasi_id
    JOIN mpr_perubahan p
        ON p.id = imp.perubahan_id
    JOIN users u
        ON u.id = ev.created_by
`;

const validateEvaluasiInput = ({
    tanggal_evaluasi,
    ringkasan_tinjauan,
    isu_perbaikan,
    pembelajaran
}) => {
    if (!isValidDateString(tanggal_evaluasi)) {
        return {
            valid: false,
            message:
                'tanggal_evaluasi wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.'
        };
    }

    if (
        typeof ringkasan_tinjauan !== 'string' ||
        ringkasan_tinjauan.trim() === ''
    ) {
        return {
            valid: false,
            message: 'ringkasan_tinjauan wajib diisi.'
        };
    }

    if (
        isu_perbaikan !== undefined &&
        isu_perbaikan !== null &&
        typeof isu_perbaikan !== 'string'
    ) {
        return {
            valid: false,
            message: 'isu_perbaikan harus berupa teks.'
        };
    }

    if (
        typeof pembelajaran !== 'string' ||
        pembelajaran.trim() === ''
    ) {
        return {
            valid: false,
            message: 'pembelajaran wajib diisi.'
        };
    }

    return {
        valid: true,
        data: {
            tanggal_evaluasi,
            ringkasan_tinjauan:
                ringkasan_tinjauan.trim(),
            isu_perbaikan:
                typeof isu_perbaikan === 'string'
                    ? isu_perbaikan.trim() || null
                    : null,
            pembelajaran:
                pembelajaran.trim()
        }
    };
};


// GET /api/perubahan/implementasi/:id/evaluasi
exports.getEvaluasiByImplementasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT id
            FROM mpr_implementasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE ev.implementasi_id = ?
            ORDER BY ev.tanggal_evaluasi DESC, ev.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getEvaluasiByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data evaluasi perubahan.'
        });
    }
};


// GET /api/perubahan/evaluasi/:id
exports.getEvaluasiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID evaluasi tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE ev.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data evaluasi perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getEvaluasiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail evaluasi perubahan.'
        });
    }
};


// POST /api/perubahan/implementasi/:id/evaluasi
exports.createEvaluasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID implementasi tidak valid.'
        });
    }

    const validation =
        validateEvaluasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [implementasiRows] = await db.query(
            `
            SELECT
                imp.id,
                imp.perubahan_id,
                p.klasifikasi,
                p.status
            FROM mpr_implementasi imp
            JOIN mpr_perubahan p
                ON p.id = imp.perubahan_id
            WHERE imp.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (implementasiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const implementasi =
            implementasiRows[0];

        // Evaluasi hanya dapat dimulai setelah
        // perubahan masuk tahap Implementasi.
        // Evaluasi berikutnya tetap boleh ditambahkan
        // ketika status sudah Evaluasi.
        if (
            implementasi.status !== 'Implementasi' &&
            implementasi.status !== 'Evaluasi'
        ) {
            return res.status(409).json({
                message:
                    'Evaluasi belum dapat dilakukan karena perubahan belum berada pada tahap Implementasi.'
            });
        }

        // Untuk Normal dan Emergency,
        // keputusan pelaksanaan terbaru harus Disetujui.
        // Standard tidak memerlukan persetujuan berulang.
        if (
            implementasi.klasifikasi === 'Normal' ||
            implementasi.klasifikasi === 'Emergency'
        ) {
            const keputusanPelaksanaan =
                await getLatestKeputusanPerubahan(
                    implementasi.perubahan_id,
                    'Pelaksanaan'
                );

            if (
                keputusanPelaksanaan !== 'Disetujui'
            ) {
                return res.status(409).json({
                    message:
                        'Evaluasi belum dapat dilakukan karena keputusan pelaksanaan terbaru belum Disetujui.'
                });
            }
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_evaluasi (
                implementasi_id,
                tanggal_evaluasi,
                ringkasan_tinjauan,
                isu_perbaikan,
                pembelajaran,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                data.tanggal_evaluasi,
                data.ringkasan_tinjauan,
                data.isu_perbaikan,
                data.pembelajaran,
                req.user.id
            ]
        );

        // Begitu evaluasi pertama dibuat,
        // workflow resmi masuk tahap Evaluasi.
        if (implementasi.status === 'Implementasi') {
            await db.query(
                `
                UPDATE mpr_perubahan
                SET status = 'Evaluasi'
                WHERE id = ?
                  AND status = 'Implementasi'
                `,
                [
                    Number(
                        implementasi.perubahan_id
                    )
                ]
            );
        }

        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE ev.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Evaluasi perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createEvaluasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan evaluasi perubahan.'
        });
    }
};


// PUT /api/perubahan/evaluasi/:id
exports.updateEvaluasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID evaluasi tidak valid.'
        });
    }

    const validation =
        validateEvaluasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data evaluasi perubahan tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_evaluasi
            SET
                tanggal_evaluasi = ?,
                ringkasan_tinjauan = ?,
                isu_perbaikan = ?,
                pembelajaran = ?
            WHERE id = ?
            `,
            [
                data.tanggal_evaluasi,
                data.ringkasan_tinjauan,
                data.isu_perbaikan,
                data.pembelajaran,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE ev.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Evaluasi perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateEvaluasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui evaluasi perubahan.'
        });
    }
};


// DELETE /api/perubahan/evaluasi/:id
exports.deleteEvaluasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID evaluasi tidak valid.'
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT
                ev.id,
                ev.implementasi_id,
                imp.perubahan_id
            FROM mpr_evaluasi ev
            JOIN mpr_implementasi imp
                ON imp.id = ev.implementasi_id
            WHERE ev.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data evaluasi perubahan tidak ditemukan.'
            });
        }

        const evaluasi =
            existingRows[0];

        await db.query(
            `
            DELETE FROM mpr_evaluasi
            WHERE id = ?
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Evaluasi perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteEvaluasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus evaluasi perubahan.'
        });
    }
};

// =====================================================
// MPR05 - PENCATATAN / LOGBOOK PERUBAHAN
// =====================================================

const logPerubahanSelectQuery = `
    SELECT
        lp.id,
        lp.perubahan_id,

        p.kode_perubahan,
        p.detail_perubahan,
        p.klasifikasi,
        p.lingkup,
        p.status AS status_workflow,

        lp.tanggal_pelaksanaan,
        lp.catatan,
        lp.status_perubahan,

        lp.created_by,
        u.nama AS dibuat_oleh,

        lp.created_at
    FROM mpr_log_perubahan lp
    JOIN mpr_perubahan p
        ON p.id = lp.perubahan_id
    JOIN users u
        ON u.id = lp.created_by
`;


const validateLogPerubahanInput = ({
    tanggal_pelaksanaan,
    catatan,
    status_perubahan
}) => {
    if (!isValidDateString(tanggal_pelaksanaan)) {
        return {
            valid: false,
            message:
                'tanggal_pelaksanaan wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.'
        };
    }

    if (
        typeof catatan !== 'string' ||
        catatan.trim() === ''
    ) {
        return {
            valid: false,
            message: 'catatan wajib diisi.'
        };
    }

    if (
        typeof status_perubahan !== 'string' ||
        status_perubahan.trim() === ''
    ) {
        return {
            valid: false,
            message: 'status_perubahan wajib diisi.'
        };
    }

    if (status_perubahan.trim().length > 50) {
        return {
            valid: false,
            message:
                'status_perubahan maksimal 50 karakter.'
        };
    }

    return {
        valid: true,
        data: {
            tanggal_pelaksanaan,
            catatan: catatan.trim(),
            status_perubahan:
                status_perubahan.trim()
        }
    };
};


// GET /api/perubahan/:id/logbook
exports.getLogPerubahanByPerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${logPerubahanSelectQuery}
            WHERE lp.perubahan_id = ?
            ORDER BY
                lp.tanggal_pelaksanaan DESC,
                lp.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getLogPerubahanByPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil logbook perubahan.'
        });
    }
};


// GET /api/perubahan/logbook/:id
exports.getLogPerubahanById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID logbook perubahan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${logPerubahanSelectQuery}
            WHERE lp.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getLogPerubahanById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail logbook perubahan.'
        });
    }
};


// POST /api/perubahan/:id/logbook
exports.createLogPerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID perubahan tidak valid.'
        });
    }

    const validation =
        validateLogPerubahanInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [perubahanRows] = await db.query(
            `
            SELECT
                id,
                status
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        await db.query(
            `
            UPDATE mpr_perubahan
            SET status = 'Selesai'
            WHERE id = ?
            AND status = 'Evaluasi'
            `,
            [Number(id)]
        );

        if (perubahanRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const perubahan = perubahanRows[0];

        if (
            perubahan.status !== 'Evaluasi' &&
            perubahan.status !== 'Selesai'
        ) {
            return res.status(409).json({
                message:
                    'Logbook belum dapat dicatat karena perubahan belum berada pada tahap Evaluasi.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_log_perubahan (
                perubahan_id,
                tanggal_pelaksanaan,
                catatan,
                status_perubahan,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                data.tanggal_pelaksanaan,
                data.catatan,
                data.status_perubahan,
                req.user.id
            ]
        );

        const [rows] = await db.query(
            `
            ${logPerubahanSelectQuery}
            WHERE lp.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Logbook perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createLogPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan logbook perubahan.'
        });
    }
};


// PUT /api/perubahan/logbook/:id
exports.updateLogPerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID logbook perubahan tidak valid.'
        });
    }

    const validation =
        validateLogPerubahanInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_log_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_log_perubahan
            SET
                tanggal_pelaksanaan = ?,
                catatan = ?,
                status_perubahan = ?
            WHERE id = ?
            `,
            [
                data.tanggal_pelaksanaan,
                data.catatan,
                data.status_perubahan,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${logPerubahanSelectQuery}
            WHERE lp.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Logbook perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateLogPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui logbook perubahan.'
        });
    }
};


// DELETE /api/perubahan/logbook/:id
exports.deleteLogPerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID logbook perubahan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_log_perubahan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Logbook perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteLogPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus logbook perubahan.'
        });
    }
};

// =====================================================
// MPR05 - BUKTI PELAKSANAAN
// =====================================================

const buktiPelaksanaanSelectQuery = `
    SELECT
        bp.id,
        bp.log_perubahan_id,

        lp.perubahan_id,
        p.kode_perubahan,

        bp.jenis_bukti,
        bp.nama_bukti,
        bp.lokasi_bukti,
        bp.keterangan,

        bp.uploaded_by,
        u.nama AS diunggah_oleh,

        bp.created_at
    FROM mpr_bukti_pelaksanaan bp
    JOIN mpr_log_perubahan lp
        ON lp.id = bp.log_perubahan_id
    JOIN mpr_perubahan p
        ON p.id = lp.perubahan_id
    JOIN users u
        ON u.id = bp.uploaded_by
`;


const validateBuktiPelaksanaanInput = ({
    jenis_bukti,
    nama_bukti,
    lokasi_bukti,
    keterangan
}) => {
    const jenisBuktiValid = [
        'Foto',
        'Video',
        'Dokumen'
    ];

    if (
        typeof jenis_bukti !== 'string' ||
        !jenisBuktiValid.includes(
            jenis_bukti.trim()
        )
    ) {
        return {
            valid: false,
            message:
                'jenis_bukti harus Foto, Video, atau Dokumen.'
        };
    }

    if (
        typeof nama_bukti !== 'string' ||
        nama_bukti.trim() === ''
    ) {
        return {
            valid: false,
            message: 'nama_bukti wajib diisi.'
        };
    }

    if (nama_bukti.trim().length > 255) {
        return {
            valid: false,
            message:
                'nama_bukti maksimal 255 karakter.'
        };
    }

    if (
        typeof lokasi_bukti !== 'string' ||
        lokasi_bukti.trim() === ''
    ) {
        return {
            valid: false,
            message: 'lokasi_bukti wajib diisi.'
        };
    }

    if (
        keterangan !== undefined &&
        keterangan !== null &&
        typeof keterangan !== 'string'
    ) {
        return {
            valid: false,
            message:
                'keterangan harus berupa teks.'
        };
    }

    return {
        valid: true,
        data: {
            jenis_bukti:
                jenis_bukti.trim(),
            nama_bukti:
                nama_bukti.trim(),
            lokasi_bukti:
                lokasi_bukti.trim(),
            keterangan:
                typeof keterangan === 'string'
                    ? keterangan.trim() || null
                    : null
        }
    };
};


// GET /api/perubahan/logbook/:id/bukti
exports.getBuktiPelaksanaanByLogbook = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID logbook perubahan tidak valid.'
        });
    }

    try {
        const [logRows] = await db.query(
            `
            SELECT id
            FROM mpr_log_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (logRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${buktiPelaksanaanSelectQuery}
            WHERE bp.log_perubahan_id = ?
            ORDER BY bp.id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getBuktiPelaksanaanByLogbook error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil bukti pelaksanaan.'
        });
    }
};


// GET /api/perubahan/bukti-pelaksanaan/:id
exports.getBuktiPelaksanaanById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID bukti pelaksanaan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${buktiPelaksanaanSelectQuery}
            WHERE bp.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data bukti pelaksanaan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getBuktiPelaksanaanById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail bukti pelaksanaan.'
        });
    }
};


// POST /api/perubahan/logbook/:id/bukti
exports.createBuktiPelaksanaan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID logbook perubahan tidak valid.'
        });
    }

    const validation =
        validateBuktiPelaksanaanInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [logRows] = await db.query(
            `
            SELECT id
            FROM mpr_log_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (logRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_bukti_pelaksanaan (
                log_perubahan_id,
                jenis_bukti,
                nama_bukti,
                lokasi_bukti,
                keterangan,
                uploaded_by
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                data.jenis_bukti,
                data.nama_bukti,
                data.lokasi_bukti,
                data.keterangan,
                req.user.id
            ]
        );

        const [rows] = await db.query(
            `
            ${buktiPelaksanaanSelectQuery}
            WHERE bp.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Bukti pelaksanaan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createBuktiPelaksanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan bukti pelaksanaan.'
        });
    }
};


// PUT /api/perubahan/bukti-pelaksanaan/:id
exports.updateBuktiPelaksanaan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID bukti pelaksanaan tidak valid.'
        });
    }

    const validation =
        validateBuktiPelaksanaanInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const data = validation.data;

    try {
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mpr_bukti_pelaksanaan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data bukti pelaksanaan tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_bukti_pelaksanaan
            SET
                jenis_bukti = ?,
                nama_bukti = ?,
                lokasi_bukti = ?,
                keterangan = ?
            WHERE id = ?
            `,
            [
                data.jenis_bukti,
                data.nama_bukti,
                data.lokasi_bukti,
                data.keterangan,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${buktiPelaksanaanSelectQuery}
            WHERE bp.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Bukti pelaksanaan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateBuktiPelaksanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui bukti pelaksanaan.'
        });
    }
};


// DELETE /api/perubahan/bukti-pelaksanaan/:id
exports.deleteBuktiPelaksanaan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID bukti pelaksanaan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mpr_bukti_pelaksanaan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data bukti pelaksanaan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Bukti pelaksanaan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteBuktiPelaksanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus bukti pelaksanaan.'
        });
    }
};