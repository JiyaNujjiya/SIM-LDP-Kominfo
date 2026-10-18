const db = require('../config/db');

const {
    notifyPimpinanChangeSubmitted,
    resolveChangeApprovalNotifications,
    notifyChangeDecision
} = require('../services/notificationService');

const isPositiveInteger = (value) => {
    const number = Number(value);
    return Number.isInteger(number) && number > 0;
};

const sendChangeApprovalNotification = async (perubahanId, actorId) => {
    const [rows] = await db.query(
        `
        SELECT
            id,
            kode_perubahan,
            created_by,
            lingkup
        FROM mpr_perubahan
        WHERE id = ?
        LIMIT 1
        `,
        [Number(perubahanId)]
    );

    if (rows.length === 0) return;

    const perubahan = rows[0];

    const butuhTeknis =
        perubahan.lingkup === 'Teknis' ||
        perubahan.lingkup === 'Teknis & Organisasi';

    const butuhOrganisasi =
        perubahan.lingkup === 'Organisasi' ||
        perubahan.lingkup === 'Teknis & Organisasi';

    let teknisSiap = true;
    let organisasiSiap = true;

    if (butuhTeknis) {
        const [teknisRows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM mpr_dampak_teknis
            WHERE perubahan_id = ?
            `,
            [Number(perubahanId)]
        );

        teknisSiap =
            Number(teknisRows[0].total) > 0;
    }

    if (butuhOrganisasi) {
        const [organisasiRows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM mpr_analisis_organisasi
            WHERE perubahan_id = ?
            `,
            [Number(perubahanId)]
        );

        organisasiSiap =
            Number(organisasiRows[0].total) > 0;
    }

    if (!teknisSiap || !organisasiSiap) {
        return;
    }

    await notifyPimpinanChangeSubmitted(
        perubahan,
        actorId
    );
};

const sendChangeDecisionNotifications = async ({
    perubahan,
    tahap,
    keputusan,
    statusPerubahan,
    actorId
}) => {
    try {
        await notifyChangeDecision({
            userId: perubahan.created_by,
            perubahan,
            tahap,
            decision: keputusan,
            actorId
        });

        if (
            keputusan === 'Tidak Disetujui' ||
            statusPerubahan === 'Implementasi'
        ) {
            await resolveChangeApprovalNotifications(
                perubahan.id
            );
        }
    } catch (notificationError) {
        console.error(
            'Gagal memproses notifikasi keputusan perubahan:',
            notificationError
        );
    }
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
            ORDER BY
                i.nama_instansi ASC,
                uk.nama_unit ASC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getUnitOptions error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil daftar unit kerja.'
        });
    }
};

exports.getUserOptions = async (req, res) => {
    try {
        const [actorRows] = await db.query(
            'SELECT instansi_id, role_id FROM users WHERE id = ? LIMIT 1',
            [req.user.id]
        );
        if (!actorRows.length) {
            return res.status(401).json({ message: 'Pengguna tidak ditemukan.' });
        }
        const isAdmin = req.user.isAdmin === true || Number(actorRows[0].role_id) === 1;
        if (!isAdmin && !actorRows[0].instansi_id) {
            return res.status(403).json({ message: 'Instansi pengguna belum terdaftar.' });
        }
        const sql = isAdmin
            ? 'SELECT id, nama, email, role, role_id FROM users ORDER BY nama ASC'
            : 'SELECT id, nama, email, role, role_id FROM users WHERE instansi_id = ? ORDER BY nama ASC';
        const [rows] = await db.query(sql, isAdmin ? [] : [actorRows[0].instansi_id]);
        return res.status(200).json({ data: rows });
    } catch (error) {
        console.error('getUserOptions error:', error);
        return res.status(500).json({ message: 'Gagal mengambil daftar pengguna.' });
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
        console.error(
            'getLayananOptions error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil daftar layanan digital.'
        });
    }
};

exports.getLayananPrioritasOptions = async (
    req,
    res
) => {
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
            ORDER BY
                lp.kode_prioritas ASC,
                ld.nama_layanan ASC
        `);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getLayananPrioritasOptions error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil daftar layanan prioritas.'
        });
    }
};

const perencanaanSelectQuery = `
    SELECT
        p.id,
        p.unit_terkait_id,
        uk.kode_unit,
        COALESCE(
            p.nama_unit,
            uk.nama_unit
        ) AS nama_unit,
        uk.instansi_id,
        i.kode_instansi,
        COALESCE(
            p.nama_instansi,
            i.nama_instansi
        ) AS nama_instansi,
        p.periode_perencanaan,
        p.created_by,
        u.nama AS dibuat_oleh,
        p.created_at,
        p.updated_at
    FROM mpr_perencanaan p
    LEFT JOIN unit_kerja uk
        ON uk.id = p.unit_terkait_id
    LEFT JOIN instansi i
        ON i.id = uk.instansi_id
    JOIN users u
        ON u.id = p.created_by
`;

// =========================================
// MPR01 - PERENCANAAN PERUBAHAN
// =========================================

exports.getAllPerencanaan = async (
    req,
    res
) => {
    try {
        const actor = await getPerubahanActor(req);
        if (!actor.isAdmin && !actor.instansi_id) {
            return res.status(403).json({ message: 'Instansi pengguna belum terdaftar.' });
        }
        const [rows] = await db.query(`
            ${perencanaanSelectQuery}
            ${actor.isAdmin ? '' : 'WHERE u.instansi_id = ?'}
            ORDER BY p.created_at DESC, p.id DESC
        `, actor.isAdmin ? [] : [actor.instansi_id]);

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getAllPerencanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data perencanaan perubahan.'
        });
    }
};

exports.getPerencanaanById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perencanaan tidak valid.'
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
                message:
                    'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getPerencanaanById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail perencanaan perubahan.'
        });
    }
};

exports.createPerencanaan = async (
    req,
    res
) => {
    const {
        nama_instansi,
        nama_unit,
        periode_perencanaan
    } = req.body;

    if (
        typeof nama_instansi !== 'string' ||
        nama_instansi.trim() === ''
    ) {
        return res.status(400).json({
            message:
                'nama_instansi wajib diisi.'
        });
    }

    if (
        nama_instansi.trim().length > 200
    ) {
        return res.status(400).json({
            message:
                'nama_instansi maksimal 200 karakter.'
        });
    }

    if (
        typeof nama_unit !== 'string' ||
        nama_unit.trim() === ''
    ) {
        return res.status(400).json({
            message:
                'nama_unit wajib diisi.'
        });
    }

    if (
        nama_unit.trim().length > 200
    ) {
        return res.status(400).json({
            message:
                'nama_unit maksimal 200 karakter.'
        });
    }

    if (
        typeof periode_perencanaan !== 'string' ||
        periode_perencanaan.trim() === ''
    ) {
        return res.status(400).json({
            message:
                'periode_perencanaan wajib diisi.'
        });
    }

    if (
        periode_perencanaan.trim().length > 100
    ) {
        return res.status(400).json({
            message:
                'periode_perencanaan maksimal 100 karakter.'
        });
    }

    try {
        const [result] = await db.query(
            `
            INSERT INTO mpr_perencanaan (
                unit_terkait_id,
                nama_instansi,
                nama_unit,
                periode_perencanaan,
                created_by
            )
            VALUES (
                NULL,
                ?,
                ?,
                ?,
                ?
            )
            `,
            [
                nama_instansi.trim(),
                nama_unit.trim(),
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
            [
                result.insertId
            ]
        );

        return res.status(201).json({
            message:
                'Data perencanaan perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createPerencanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan perencanaan perubahan.'
        });
    }
};

exports.updatePerencanaan = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        nama_instansi,
        nama_unit,
        periode_perencanaan
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perencanaan tidak valid.'
        });
    }

    if (
        typeof nama_instansi !== 'string' ||
        nama_instansi.trim() === ''
    ) {
        return res.status(400).json({
            message:
                'nama_instansi wajib diisi.'
        });
    }

    if (
        nama_instansi.trim().length > 200
    ) {
        return res.status(400).json({
            message:
                'nama_instansi maksimal 200 karakter.'
        });
    }

    if (
        typeof nama_unit !== 'string' ||
        nama_unit.trim() === ''
    ) {
        return res.status(400).json({
            message:
                'nama_unit wajib diisi.'
        });
    }

    if (
        nama_unit.trim().length > 200
    ) {
        return res.status(400).json({
            message:
                'nama_unit maksimal 200 karakter.'
        });
    }

    if (
        typeof periode_perencanaan !== 'string' ||
        periode_perencanaan.trim() === ''
    ) {
        return res.status(400).json({
            message:
                'periode_perencanaan wajib diisi.'
        });
    }

    if (
        periode_perencanaan.trim().length > 100
    ) {
        return res.status(400).json({
            message:
                'periode_perencanaan maksimal 100 karakter.'
        });
    }

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perencanaan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_perencanaan
            SET
                unit_terkait_id = NULL,
                nama_instansi = ?,
                nama_unit = ?,
                periode_perencanaan = ?
            WHERE id = ?
            `,
            [
                nama_instansi.trim(),
                nama_unit.trim(),
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
            [
                Number(id)
            ]
        );

        return res.status(200).json({
            message:
                'Data perencanaan perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updatePerencanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui perencanaan perubahan.'
        });
    }
};

exports.deletePerencanaan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perencanaan tidak valid.'
        });
    }

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perencanaan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        const [prioritasRows] =
            await db.query(
                `
                SELECT COUNT(*) AS total
                FROM mpr_analisis_prioritas
                WHERE perencanaan_id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            Number(
                prioritasRows[0].total
            ) > 0
        ) {
            return res.status(409).json({
                message:
                    'Perencanaan tidak dapat dihapus karena sudah memiliki analisis prioritas.'
            });
        }

        const [perubahanRows] =
            await db.query(
                `
                SELECT COUNT(*) AS total
                FROM mpr_perubahan
                WHERE perencanaan_id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            Number(
                perubahanRows[0].total
            ) > 0
        ) {
            return res.status(409).json({
                message:
                    'Perencanaan tidak dapat dihapus karena sudah memiliki data perubahan.'
            });
        }

        await db.query(
            `
            DELETE FROM mpr_perencanaan
            WHERE id = ?
            `,
            [
                Number(id)
            ]
        );

        return res.status(200).json({
            message:
                'Data perencanaan perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deletePerencanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus perencanaan perubahan.'
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

        COALESCE(
            ap.nama_layanan_prioritas,
            ld.nama_layanan
        ) AS nama_layanan_prioritas,

        COALESCE(
            ap.nama_layanan_prioritas,
            ld.nama_layanan
        ) AS nama_layanan,

        ap.komponen_perubahan,
        ap.aspek_pemdi,
        ap.indikator_pemdi,
        ap.kondisi_saat_ini,
        ap.kondisi_diharapkan,
        ap.urutan_prioritas,

        ap.created_at,
        ap.updated_at

    FROM mpr_analisis_prioritas ap

    LEFT JOIN layanan_prioritas lp
        ON lp.id = ap.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;

const validateAnalisisPrioritasInput = ({
    nama_layanan_prioritas,
    komponen_perubahan,
    aspek_pemdi,
    indikator_pemdi,
    kondisi_saat_ini,
    kondisi_diharapkan,
    urutan_prioritas
}) => {
    if (
        typeof nama_layanan_prioritas !== 'string' ||
        nama_layanan_prioritas.trim() === ''
    ) {
        return 'nama_layanan_prioritas wajib diisi.';
    }

    if (nama_layanan_prioritas.trim().length > 200) {
        return 'nama_layanan_prioritas maksimal 200 karakter.';
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
exports.getAnalisisPrioritasByPerencanaan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perencanaan tidak valid.'
        });
    }

    try {
        const [perencanaanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perencanaan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perencanaanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${analisisPrioritasSelectQuery}
                WHERE ap.perencanaan_id = ?
                ORDER BY
                    ap.urutan_prioritas ASC,
                    ap.id ASC
                `,
                [Number(id)]
            );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getAnalisisPrioritasByPerencanaan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil analisis prioritas.'
        });
    }
};


// GET /api/perubahan/analisis-prioritas/:id
exports.getAnalisisPrioritasById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID analisis prioritas tidak valid.'
        });
    }

    try {
        const [rows] =
            await db.query(
                `
                ${analisisPrioritasSelectQuery}
                WHERE ap.id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data analisis prioritas tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getAnalisisPrioritasById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail analisis prioritas.'
        });
    }
};


// POST /api/perubahan/perencanaan/:id/analisis-prioritas
exports.createAnalisisPrioritas = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        nama_layanan_prioritas,
        komponen_perubahan,
        aspek_pemdi,
        indikator_pemdi,
        kondisi_saat_ini,
        kondisi_diharapkan,
        urutan_prioritas
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perencanaan tidak valid.'
        });
    }

    const validationError =
        validateAnalisisPrioritasInput({
            nama_layanan_prioritas,
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
        const [perencanaanRows] =
            await db.query(
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
                message:
                    'Data perencanaan perubahan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mpr_analisis_prioritas (
                perencanaan_id,
                layanan_prioritas_id,
                nama_layanan_prioritas,
                komponen_perubahan,
                aspek_pemdi,
                indikator_pemdi,
                kondisi_saat_ini,
                kondisi_diharapkan,
                urutan_prioritas
            )
            VALUES (?, NULL, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                nama_layanan_prioritas.trim(),
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
            message:
                'Analisis prioritas perubahan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createAnalisisPrioritas error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan analisis prioritas.'
        });
    }
};

// PUT /api/perubahan/analisis-prioritas/:id
exports.updateAnalisisPrioritas = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        nama_layanan_prioritas,
        komponen_perubahan,
        aspek_pemdi,
        indikator_pemdi,
        kondisi_saat_ini,
        kondisi_diharapkan,
        urutan_prioritas
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID analisis prioritas tidak valid.'
        });
    }

    const validationError =
        validateAnalisisPrioritasInput({
            nama_layanan_prioritas,
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
        const [existingRows] =
            await db.query(
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
                message:
                    'Data analisis prioritas tidak ditemukan.'
            });
        }

        await db.query(
            `
            UPDATE mpr_analisis_prioritas
            SET
                layanan_prioritas_id = NULL,
                nama_layanan_prioritas = ?,
                komponen_perubahan = ?,
                aspek_pemdi = ?,
                indikator_pemdi = ?,
                kondisi_saat_ini = ?,
                kondisi_diharapkan = ?,
                urutan_prioritas = ?
            WHERE id = ?
            `,
            [
                nama_layanan_prioritas.trim(),
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
            message:
                'Analisis prioritas perubahan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateAnalisisPrioritas error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui analisis prioritas.'
        });
    }
};


// DELETE /api/perubahan/analisis-prioritas/:id
exports.deleteAnalisisPrioritas = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID analisis prioritas tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_analisis_prioritas
                WHERE id = ?
                `,
                [Number(id)]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data analisis prioritas tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Analisis prioritas perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteAnalisisPrioritas error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus analisis prioritas.'
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
        COALESCE(
            pr.nama_unit,
            ut.nama_unit
        ) AS nama_unit_terkait,

        p.kode_perubahan,

        p.nama_instansi,
        p.nama_unit,

        p.layanan_id,
        ld.kode_layanan,

        COALESCE(
            p.nama_layanan_digital,
            ld.nama_layanan
        ) AS nama_layanan_digital,

        COALESCE(
            p.nama_layanan_digital,
            ld.nama_layanan
        ) AS nama_layanan,

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

    LEFT JOIN unit_kerja ut
        ON ut.id = pr.unit_terkait_id

    LEFT JOIN layanan_digital ld
        ON ld.id = p.layanan_id

    LEFT JOIN unit_kerja up
        ON up.id = p.unit_pemohon_id

    JOIN users u
        ON u.id = p.created_by
`;


const validatePerubahanInput = ({
    perencanaan_id,
    kode_perubahan,
    nama_layanan_digital,
    detail_perubahan,
    nama_instansi,
    nama_unit,
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

    if (
        typeof nama_layanan_digital !== 'string' ||
        nama_layanan_digital.trim() === ''
    ) {
        return 'nama_layanan_digital wajib diisi.';
    }

    if (nama_layanan_digital.trim().length > 200) {
        return 'nama_layanan_digital maksimal 200 karakter.';
    }

    if (
        typeof detail_perubahan !== 'string' ||
        detail_perubahan.trim() === ''
    ) {
        return 'detail_perubahan wajib diisi.';
    }

    if (
        typeof nama_instansi !== 'string' ||
        nama_instansi.trim() === ''
    ) {
        return 'nama_instansi wajib diisi.';
    }

    if (nama_instansi.trim().length > 200) {
        return 'nama_instansi maksimal 200 karakter.';
    }

    if (
        typeof nama_unit !== 'string' ||
        nama_unit.trim() === ''
    ) {
        return 'nama_unit wajib diisi.';
    }

    if (nama_unit.trim().length > 200) {
        return 'nama_unit maksimal 200 karakter.';
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
exports.getAllPerubahan = async (
    req,
    res
) => {
    try {
        let query = `
            ${perubahanSelectQuery}
        `;

        const params = [];

        const actor = await getPerubahanActor(req);
        if (!actor.isAdmin && !actor.instansi_id) {
            return res.status(403).json({ message: 'Instansi pengguna belum terdaftar.' });
        }
        if (!actor.isAdmin) {
            query += `
                WHERE
                    u.instansi_id = ?
            `;

            params.push(
                actor.instansi_id
            );
        }

        query += `
            ORDER BY
                p.created_at DESC,
                p.id DESC
        `;

        const [rows] =
            await db.query(
                query,
                params
            );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getAllPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data perubahan.'
        });
    }
};


// GET /api/perubahan/:id
exports.getPerubahanById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        let query = `
            ${perubahanSelectQuery}
            WHERE p.id = ?
        `;

        const params = [
            Number(id)
        ];

        if (!(await getPerubahanActor(req)).isAdmin) {
            query += `
                AND
                    p.created_by IN (SELECT id FROM users WHERE instansi_id = ?)
            `;

            params.push(
                (await getPerubahanActor(req)).instansi_id
            );
        }

        query += `
            LIMIT 1
        `;

        const [rows] =
            await db.query(
                query,
                params
            );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'getPerubahanById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail perubahan.'
        });
    }
};


// POST /api/perubahan
exports.createPerubahan = async (
    req,
    res
) => {
    const {
        perencanaan_id,
        kode_perubahan,
        nama_layanan_digital,
        detail_perubahan,
        nama_instansi,
        nama_unit,
        klasifikasi,
        lingkup
    } = req.body;

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

    const finalNamaInstansi =
        req.user.isAdmin
            ? nama_instansi
            : (await getPerubahanActor(req)).instansi_id;

    const finalNamaUnit = nama_unit;

    const validationError =
        validatePerubahanInput({
            perencanaan_id,
            kode_perubahan,
            nama_layanan_digital,
            detail_perubahan,
            nama_instansi: finalNamaInstansi,
            nama_unit: finalNamaUnit,
            klasifikasi,
            lingkup
        });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        const [perencanaanRows] =
            await db.query(
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
                    'Data perencanaan tidak ditemukan.'
            });
        }

        const [duplicateRows] =
            await db.query(
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

        const [result] =
            await db.query(
                `
                INSERT INTO mpr_perubahan (
                    perencanaan_id,
                    kode_perubahan,
                    nama_instansi,
                    nama_unit,
                    nama_layanan_digital,
                    detail_perubahan,
                    unit_pemohon_id,
                    klasifikasi,
                    lingkup,
                    created_by
                )
                VALUES (?, ?, ?, ?, ?, ?, NULL, ?, ?, ?)
                `,
                [
                    Number(perencanaan_id),
                    kode_perubahan.trim(),
                    finalNamaInstansi.trim(),
                    finalNamaUnit.trim(),
                    nama_layanan_digital.trim(),
                    detail_perubahan.trim(),
                    klasifikasi,
                    lingkup,
                    req.user.id
                ]
            );

        const [rows] =
            await db.query(
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
exports.updatePerubahan = async (
    req,
    res
) => {
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
            message:
                'ID perubahan tidak valid.'
        });
    }

    const {
        perencanaan_id,
        kode_perubahan,
        nama_layanan_digital,
        detail_perubahan,
        nama_instansi,
        nama_unit,
        klasifikasi,
        lingkup
    } = req.body;

    const finalNamaInstansi =
        req.user.isAdmin
            ? nama_instansi
            : (await getPerubahanActor(req)).instansi_id;

    const finalNamaUnit = nama_unit;

    const validationError =
        validatePerubahanInput({
            perencanaan_id,
            kode_perubahan,
            nama_layanan_digital,
            detail_perubahan,
            nama_instansi: finalNamaInstansi,
            nama_unit: finalNamaUnit,
            klasifikasi,
            lingkup
        });

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }

    try {
        let existingQuery = `
            SELECT id
            FROM mpr_perubahan
            WHERE id = ?
        `;

        const existingParams = [
            Number(id)
        ];

        if (!(await getPerubahanActor(req)).isAdmin) {
            existingQuery += `
                AND created_by IN (SELECT id FROM users WHERE instansi_id = ?)
            `;

            existingParams.push(
                (await getPerubahanActor(req)).instansi_id
            );
        }

        existingQuery += `
            LIMIT 1
        `;

        const [existingRows] =
            await db.query(
                existingQuery,
                existingParams
            );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [perencanaanRows] =
            await db.query(
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

        const [duplicateRows] =
            await db.query(
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

        let updateQuery = `
            UPDATE mpr_perubahan
            SET
                perencanaan_id = ?,
                kode_perubahan = ?,
                nama_instansi = ?,
                nama_unit = ?,
                nama_layanan_digital = ?,
                detail_perubahan = ?,
                unit_pemohon_id = NULL,
                klasifikasi = ?,
                lingkup = ?
            WHERE id = ?
        `;

        const updateParams = [
            Number(perencanaan_id),
            kode_perubahan.trim(),
            finalNamaInstansi.trim(),
            finalNamaUnit.trim(),
            nama_layanan_digital.trim(),
            detail_perubahan.trim(),
            klasifikasi,
            lingkup,
            Number(id)
        ];

        if (!(await getPerubahanActor(req)).isAdmin) {
            updateQuery += `
                AND created_by IN (SELECT id FROM users WHERE instansi_id = ?)
            `;

            updateParams.push(
                (await getPerubahanActor(req)).instansi_id
            );
        }

        const [updateResult] =
            await db.query(
                updateQuery,
                updateParams
            );

        if (updateResult.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        await syncStatusSetelahAnalisis(
            Number(id)
        );

        let selectQuery = `
            ${perubahanSelectQuery}
            WHERE p.id = ?
        `;

        const selectParams = [
            Number(id)
        ];

        if (!(await getPerubahanActor(req)).isAdmin) {
            selectQuery += `
                AND p.created_by IN (SELECT id FROM users WHERE instansi_id = ?)
            `;

            selectParams.push(
                (await getPerubahanActor(req)).instansi_id
            );
        }

        selectQuery += `
            LIMIT 1
        `;

        const [rows] =
            await db.query(
                selectQuery,
                selectParams
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
exports.deletePerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        let deleteQuery = `
            DELETE FROM mpr_perubahan
            WHERE id = ?
        `;

        const deleteParams = [
            Number(id)
        ];

        if (!(await getPerubahanActor(req)).isAdmin) {
            deleteQuery += `
                AND
                    created_by IN (SELECT id FROM users WHERE instansi_id = ?)
            `;

            deleteParams.push(
                (await getPerubahanActor(req)).instansi_id
            );
        }

        const [result] =
            await db.query(
                deleteQuery,
                deleteParams
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Data perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deletePerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus data perubahan.'
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
    const [rows] =
        await db.query(
            `
            SELECT keputusan
            FROM mpr_persetujuan
            WHERE perubahan_id = ?
              AND tahap = ?
            ORDER BY
                diputuskan_at DESC,
                id DESC
            LIMIT 1
            `,
            [
                Number(
                    perubahanId
                ),
                tahap
            ]
        );

    return rows.length > 0
        ? rows[0].keputusan
        : null;
};


const syncStatusSetelahAnalisis = async (
    perubahanId
) => {
    const [perubahanRows] =
        await db.query(
            `
            SELECT
                id,
                lingkup,
                status
            FROM mpr_perubahan
            WHERE id = ?
            LIMIT 1
            `,
            [
                Number(
                    perubahanId
                )
            ]
        );

    if (
        perubahanRows.length === 0
    ) {
        return null;
    }

    const perubahan =
        perubahanRows[0];

    // Jangan mundurkan workflow
    // yang sudah masuk tahap selanjutnya.
    if (
        perubahan.status ===
            'Implementasi' ||
        perubahan.status ===
            'Evaluasi' ||
        perubahan.status ===
            'Selesai'
    ) {
        return perubahan.status;
    }

    let keputusanTeknis = null;
    let keputusanOrganisasi = null;

    if (
        perubahan.lingkup ===
            'Teknis' ||
        perubahan.lingkup ===
            'Teknis & Organisasi'
    ) {
        keputusanTeknis =
            await getLatestKeputusanPerubahan(
                perubahan.id,
                'Analisis Teknis'
            );
    }

    if (
        perubahan.lingkup ===
            'Organisasi' ||
        perubahan.lingkup ===
            'Teknis & Organisasi'
    ) {
        keputusanOrganisasi =
            await getLatestKeputusanPerubahan(
                perubahan.id,
                'Analisis Organisasi'
            );
    }

    const teknisDisetujui =
        perubahan.lingkup !==
            'Teknis' &&
        perubahan.lingkup !==
            'Teknis & Organisasi'
            ? true
            : keputusanTeknis ===
              'Disetujui';

    const organisasiDisetujui =
        perubahan.lingkup !==
            'Organisasi' &&
        perubahan.lingkup !==
            'Teknis & Organisasi'
            ? true
            : keputusanOrganisasi ===
              'Disetujui';

    const semuaDisetujui =
        teknisDisetujui &&
        organisasiDisetujui;

    const adaKeputusan =
        keputusanTeknis !== null ||
        keputusanOrganisasi !== null;

    let statusBaru =
        perubahan.status;

    if (semuaDisetujui) {
        statusBaru =
            'Implementasi';
    } else if (
        adaKeputusan ||
        perubahan.status ===
            'Analisis' ||
        perubahan.status ===
            'Implementasi'
    ) {
        statusBaru =
            'Analisis';
    }

    if (
        statusBaru !==
        perubahan.status
    ) {
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

        COALESCE(
            p.nama_layanan_digital,
            ld.nama_layanan
        ) AS nama_layanan,

        dt.aspek_teknis,
        dt.uraian_dampak,
        dt.tindakan_penanganan,

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

    LEFT JOIN layanan_digital ld
        ON ld.id = p.layanan_id

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
    aspek_teknis,
    uraian_dampak,
    tindakan_penanganan,
    mkb_insiden_id
}) => {
    if (
        typeof aspek_teknis !== 'string' ||
        aspek_teknis.trim() === ''
    ) {
        return 'aspek_teknis wajib diisi.';
    }

    if (
        aspek_teknis.trim().length > 200
    ) {
        return 'aspek_teknis maksimal 200 karakter.';
    }

    if (
        typeof uraian_dampak !== 'string' ||
        uraian_dampak.trim() === ''
    ) {
        return 'uraian_dampak wajib diisi.';
    }

    if (
        tindakan_penanganan !== undefined &&
        tindakan_penanganan !== null &&
        typeof tindakan_penanganan !== 'string'
    ) {
        return 'tindakan_penanganan harus berupa teks.';
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
exports.getDampakTeknisByPerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${dampakTeknisSelectQuery}

                WHERE
                    dt.perubahan_id = ?

                ORDER BY
                    dt.id ASC
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            data:
                rows
        });
    } catch (error) {
        console.error(
            'getDampakTeknisByPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil analisis dampak teknis.'
        });
    }
};


// GET /api/perubahan/dampak-teknis/:id
exports.getDampakTeknisById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID dampak teknis tidak valid.'
        });
    }

    try {
        const [rows] =
            await db.query(
                `
                ${dampakTeknisSelectQuery}

                WHERE
                    dt.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data dampak teknis tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'getDampakTeknisById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail dampak teknis.'
        });
    }
};


// POST /api/perubahan/:id/dampak-teknis
exports.createDampakTeknis = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        aspek_teknis,
        uraian_dampak,
        tindakan_penanganan,
        mkb_insiden_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    const validationError =
        validateDampakTeknisInput({
            aspek_teknis,
            uraian_dampak,
            tindakan_penanganan,
            mkb_insiden_id
        });

    if (validationError) {
        return res.status(400).json({
            message:
                validationError
        });
    }

    const normalizedMkbInsidenId =
        normalizeMkbInsidenId(
            mkb_insiden_id
        );

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        if (
            normalizedMkbInsidenId !==
            null
        ) {
            const [insidenRows] =
                await db.query(
                    `
                    SELECT id
                    FROM mkb_insiden
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        normalizedMkbInsidenId
                    ]
                );

            if (
                insidenRows.length ===
                0
            ) {
                return res.status(400).json({
                    message:
                        'Data insiden MKB tidak ditemukan.'
                });
            }
        }

        const [result] =
            await db.query(
                `
                INSERT INTO mpr_dampak_teknis (
                    perubahan_id,
                    aspek_teknis,
                    uraian_dampak,
                    tindakan_penanganan,
                    mkb_insiden_id,
                    created_by
                )
                VALUES (?, ?, ?, ?, ?, ?)
                `,
                [
                    Number(id),

                    aspek_teknis.trim(),

                    uraian_dampak.trim(),

                    typeof tindakan_penanganan ===
                        'string' &&
                    tindakan_penanganan.trim() !==
                        ''
                        ? tindakan_penanganan.trim()
                        : null,

                    normalizedMkbInsidenId,

                    req.user.id
                ]
            );

        await db.query(
            `
            UPDATE mpr_perubahan

            SET status = 'Analisis'

            WHERE id = ?
              AND status = 'Perencanaan'
            `,
            [
                Number(id)
            ]
        );

        const [rows] =
            await db.query(
                `
                ${dampakTeknisSelectQuery}

                WHERE
                    dt.id = ?

                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        try {
            await sendChangeApprovalNotification(
                Number(id),
                req.user.id
            );
        } catch (
            notificationError
        ) {
            console.error(
                'Gagal mengirim notifikasi persetujuan perubahan:',
                notificationError
            );
        }

        return res.status(201).json({
            message:
                'Analisis dampak teknis berhasil disimpan.',

            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'createDampakTeknis error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan analisis dampak teknis.'
        });
    }
};


// PUT /api/perubahan/dampak-teknis/:id
exports.updateDampakTeknis = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        aspek_teknis,
        uraian_dampak,
        tindakan_penanganan,
        mkb_insiden_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID dampak teknis tidak valid.'
        });
    }

    const validationError =
        validateDampakTeknisInput({
            aspek_teknis,
            uraian_dampak,
            tindakan_penanganan,
            mkb_insiden_id
        });

    if (validationError) {
        return res.status(400).json({
            message:
                validationError
        });
    }

    const normalizedMkbInsidenId =
        normalizeMkbInsidenId(
            mkb_insiden_id
        );

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT
                    id,
                    perubahan_id

                FROM mpr_dampak_teknis

                WHERE id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data dampak teknis tidak ditemukan.'
            });
        }

        const perubahanId =
            existingRows[0]
                .perubahan_id;

        if (
            normalizedMkbInsidenId !==
            null
        ) {
            const [insidenRows] =
                await db.query(
                    `
                    SELECT id
                    FROM mkb_insiden
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        normalizedMkbInsidenId
                    ]
                );

            if (
                insidenRows.length ===
                0
            ) {
                return res.status(400).json({
                    message:
                        'Data insiden MKB tidak ditemukan.'
                });
            }
        }

        await db.query(
            `
            UPDATE mpr_dampak_teknis

            SET
                aspek_teknis = ?,
                uraian_dampak = ?,
                tindakan_penanganan = ?,
                mkb_insiden_id = ?

            WHERE id = ?
            `,
            [
                aspek_teknis.trim(),

                uraian_dampak.trim(),

                typeof tindakan_penanganan ===
                    'string' &&
                tindakan_penanganan.trim() !==
                    ''
                    ? tindakan_penanganan.trim()
                    : null,

                normalizedMkbInsidenId,

                Number(id)
            ]
        );

        const [rows] =
            await db.query(
                `
                ${dampakTeknisSelectQuery}

                WHERE
                    dt.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        try {
            await sendChangeApprovalNotification(
                perubahanId,
                req.user.id
            );
        } catch (
            notificationError
        ) {
            console.error(
                'Gagal mengirim ulang notifikasi persetujuan perubahan:',
                notificationError
            );
        }

        return res.status(200).json({
            message:
                'Analisis dampak teknis berhasil diperbarui.',

            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'updateDampakTeknis error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui analisis dampak teknis.'
        });
    }
};


// DELETE /api/perubahan/dampak-teknis/:id
exports.deleteDampakTeknis = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID dampak teknis tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_dampak_teknis
                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data dampak teknis tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Analisis dampak teknis berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteDampakTeknis error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus analisis dampak teknis.'
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
        ON p.id =
           ps.perubahan_id
    JOIN users u
        ON u.id =
           ps.pic_id
`;

// GET /api/perubahan/:id/persetujuan/analisis-teknis
exports.getPersetujuanAnalisisTeknis = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${persetujuanSelectQuery}
                WHERE ps.perubahan_id = ?
                  AND ps.tahap = 'Analisis Teknis'
                ORDER BY
                    ps.diputuskan_at DESC,
                    ps.id DESC
                `,
                [Number(id)]
            );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getPersetujuanAnalisisTeknis error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil riwayat persetujuan analisis teknis.'
        });
    }
};


const createKeputusanAnalisisTeknis = async (
    req,
    res,
    keputusan
) => {
    const { id } = req.params;

    const {
        catatan_keputusan
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    if (
        catatan_keputusan !== undefined &&
        catatan_keputusan !== null &&
        typeof catatan_keputusan !==
            'string'
    ) {
        return res.status(400).json({
            message:
                'catatan_keputusan harus berupa teks.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT
                    id,
                    kode_perubahan,
                    status,
                    created_by
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        if (
            ![
                'Perencanaan',
                'Analisis'
            ].includes(
                perubahanRows[0].status
            )
        ) {
            return res.status(409).json({
                message:
                    'Keputusan analisis teknis tidak dapat dilakukan karena perubahan telah melewati tahap Analisis.'
            });
        }

        const [dampakTeknisRows] =
            await db.query(
                `
                SELECT
                    COUNT(*) AS total
                FROM mpr_dampak_teknis
                WHERE perubahan_id = ?
                `,
                [Number(id)]
            );

        if (
            Number(
                dampakTeknisRows[0].total
            ) === 0
        ) {
            return res.status(409).json({
                message:
                    'Analisis dampak teknis belum tersedia.'
            });
        }

        const [result] =
            await db.query(
                `
                INSERT INTO mpr_persetujuan (
                    perubahan_id,
                    tahap,
                    keputusan,
                    pic_id,
                    catatan_keputusan
                )
                VALUES (
                    ?,
                    'Analisis Teknis',
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    Number(id),

                    keputusan,

                    req.user.id,

                    typeof catatan_keputusan ===
                    'string'
                        ? catatan_keputusan.trim() ||
                          null
                        : null
                ]
            );

        const statusPerubahan =
            await syncStatusSetelahAnalisis(
                Number(id)
            );

        await sendChangeDecisionNotifications({
            perubahan:
                perubahanRows[0],

            tahap:
                'Analisis Teknis',

            keputusan,

            statusPerubahan,

            actorId:
                req.user.id
        });

        const [rows] =
            await db.query(
                `
                ${persetujuanSelectQuery}
                WHERE ps.id = ?
                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                keputusan ===
                'Disetujui'
                    ? 'Analisis teknis berhasil disetujui.'
                    : 'Analisis teknis berhasil ditolak.',

            data:
                rows[0]
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
    const [analisisRows] =
        await queryExecutor.query(
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

                u.nama
                    AS dibuat_oleh,

                ao.created_at,
                ao.updated_at

            FROM mpr_analisis_organisasi ao

            JOIN mpr_perubahan p
                ON p.id =
                   ao.perubahan_id

            JOIN users u
                ON u.id =
                   ao.created_by

            WHERE ao.id = ?

            LIMIT 1
            `,
            [
                Number(
                    analisisId
                )
            ]
        );

    if (
        analisisRows.length === 0
    ) {
        return null;
    }

    const analisis =
        analisisRows[0];

    const [dampakRows] =
        await queryExecutor.query(
            `
            SELECT
                d.id,
                d.analisis_organisasi_id,
                d.area_dampak,
                d.ukuran_perubahan,
                d.created_at,
                d.updated_at

            FROM mpr_dampak_organisasi d

            WHERE
                d.analisis_organisasi_id = ?

            ORDER BY FIELD(
                d.area_dampak,
                'Hubungan Pekerjaan',
                'Konten Pekerjaan',
                'Keterampilan dan Kompetensi',
                'Lingkungan Kerja'
            )
            `,
            [
                Number(
                    analisisId
                )
            ]
        );

    const dampakIds =
        dampakRows.map(
            (item) => item.id
        );

    let indikatorRows = [];

    if (
        dampakIds.length > 0
    ) {
        const placeholders =
            dampakIds
                .map(() => '?')
                .join(', ');

        const [rows] =
            await queryExecutor.query(
                `
                SELECT
                    doi.id,
                    doi.dampak_organisasi_id,
                    doi.indikator_id,

                    io.area_dampak,
                    io.kode_indikator,
                    io.indikator

                FROM mpr_dampak_organisasi_indikator doi

                JOIN mpr_indikator_dampak_organisasi io
                    ON io.id =
                       doi.indikator_id

                WHERE
                    doi.dampak_organisasi_id
                    IN (${placeholders})

                ORDER BY
                    doi.dampak_organisasi_id ASC,
                    io.id ASC
                `,
                dampakIds
            );

        indikatorRows =
            rows;
    }

    const dampak_organisasi =
        dampakRows.map(
            (dampak) => ({
                ...dampak,

                indikator:
                    indikatorRows.filter(
                        (indikator) =>
                            indikator
                                .dampak_organisasi_id ===
                            dampak.id
                    )
            })
        );

    return {
        ...analisis,
        dampak_organisasi
    };
};


// GET /api/perubahan/indikator-dampak-organisasi
exports.getIndikatorDampakOrganisasi = async (
    req,
    res
) => {
    try {
        const [rows] =
            await db.query(
                `
                SELECT
                    id,
                    area_dampak,
                    kode_indikator,
                    indikator

                FROM mpr_indikator_dampak_organisasi

                ORDER BY
                    FIELD(
                        area_dampak,
                        'Hubungan Pekerjaan',
                        'Konten Pekerjaan',
                        'Keterampilan dan Kompetensi',
                        'Lingkungan Kerja'
                    ),
                    id ASC
                `
            );

        const grouped =
            AREA_DAMPAK_ORGANISASI.map(
                (area) => ({
                    area_dampak:
                        area,

                    indikator:
                        rows.filter(
                            (item) =>
                                item.area_dampak ===
                                area
                        )
                })
            );

        return res.status(200).json({
            data:
                grouped
        });
    } catch (error) {
        console.error(
            'getIndikatorDampakOrganisasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator dampak organisasi.'
        });
    }
};

// GET /api/perubahan/:id/analisis-organisasi
exports.getAnalisisOrganisasiByPerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [analisisRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_analisis_organisasi
                WHERE perubahan_id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            analisisRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Analisis dampak organisasi belum tersedia.'
            });
        }

        const data =
            await buildAnalisisOrganisasiResponse(
                db,
                analisisRows[0].id
            );

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error(
            'getAnalisisOrganisasiByPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil analisis dampak organisasi.'
        });
    }
};


// GET /api/perubahan/analisis-organisasi/:id
exports.getAnalisisOrganisasiById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID analisis organisasi tidak valid.'
        });
    }

    try {
        const data =
            await buildAnalisisOrganisasiResponse(
                db,
                Number(id)
            );

        if (!data) {
            return res.status(404).json({
                message:
                    'Analisis dampak organisasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error(
            'getAnalisisOrganisasiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail analisis organisasi.'
        });
    }
};


const validateAnalisisOrganisasiInput = ({
    kesimpulan,
    rekomendasi,
    dampak_organisasi
}) => {
    if (
        !KESIMPULAN_ORGANISASI.includes(
            kesimpulan
        )
    ) {
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
        !Array.isArray(
            dampak_organisasi
        ) ||
        dampak_organisasi.length !== 4
    ) {
        return 'dampak_organisasi wajib berisi tepat 4 area dampak.';
    }

    const areaYangDikirim =
        new Set();

    for (
        const item of
        dampak_organisasi
    ) {
        if (
            !AREA_DAMPAK_ORGANISASI.includes(
                item.area_dampak
            )
        ) {
            return `area_dampak "${item.area_dampak}" tidak valid.`;
        }

        if (
            areaYangDikirim.has(
                item.area_dampak
            )
        ) {
            return `area_dampak "${item.area_dampak}" tidak boleh duplikat.`;
        }

        areaYangDikirim.add(
            item.area_dampak
        );

        if (
            !UKURAN_PERUBAHAN_ORGANISASI.includes(
                item.ukuran_perubahan
            )
        ) {
            return `ukuran_perubahan untuk "${item.area_dampak}" tidak valid.`;
        }

        if (
            item.indikator_ids !==
                undefined &&
            !Array.isArray(
                item.indikator_ids
            )
        ) {
            return `indikator_ids untuk "${item.area_dampak}" harus berupa array.`;
        }

        const indikatorIds =
            item.indikator_ids || [];

        const indikatorUnik =
            new Set();

        for (
            const indikatorId of
            indikatorIds
        ) {
            if (
                !isPositiveInteger(
                    indikatorId
                )
            ) {
                return `indikator_ids untuk "${item.area_dampak}" mengandung ID tidak valid.`;
            }

            if (
                indikatorUnik.has(
                    Number(
                        indikatorId
                    )
                )
            ) {
                return `indikator_ids untuk "${item.area_dampak}" tidak boleh duplikat.`;
            }

            indikatorUnik.add(
                Number(
                    indikatorId
                )
            );
        }
    }

    for (
        const area of
        AREA_DAMPAK_ORGANISASI
    ) {
        if (
            !areaYangDikirim.has(
                area
            )
        ) {
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
    for (
        const item of
        dampakOrganisasi
    ) {
        const indikatorIds =
            (
                item.indikator_ids ||
                []
            ).map(Number);

        if (
            indikatorIds.length > 0
        ) {
            const placeholders =
                indikatorIds
                    .map(() => '?')
                    .join(',');

            const [indikatorRows] =
                await connection.query(
                    `
                    SELECT
                        id,
                        area_dampak
                    FROM
                        mpr_indikator_dampak_organisasi
                    WHERE id IN (
                        ${placeholders}
                    )
                    `,
                    indikatorIds
                );

            if (
                indikatorRows.length !==
                indikatorIds.length
            ) {
                const error =
                    new Error(
                        `Terdapat indikator yang tidak ditemukan pada area "${item.area_dampak}".`
                    );

                error.statusCode =
                    400;

                throw error;
            }

            const indikatorSalahArea =
                indikatorRows.find(
                    (
                        indikator
                    ) =>
                        indikator
                            .area_dampak !==
                        item.area_dampak
                );

            if (
                indikatorSalahArea
            ) {
                const error =
                    new Error(
                        `Indikator ID ${indikatorSalahArea.id} tidak termasuk area "${item.area_dampak}".`
                    );

                error.statusCode =
                    400;

                throw error;
            }
        }

        const [dampakResult] =
            await connection.query(
                `
                INSERT INTO mpr_dampak_organisasi (
                    analisis_organisasi_id,
                    area_dampak,
                    ukuran_perubahan
                )
                VALUES (?, ?, ?)
                `,
                [
                    Number(
                        analisisOrganisasiId
                    ),
                    item.area_dampak,
                    item.ukuran_perubahan
                ]
            );

        for (
            const indikatorId of
            indikatorIds
        ) {
            await connection.query(
                `
                INSERT INTO
                    mpr_dampak_organisasi_indikator (
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
exports.createAnalisisOrganisasi = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        kesimpulan,
        rekomendasi,
        dampak_organisasi
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    const validationError =
        validateAnalisisOrganisasiInput({
            kesimpulan,
            rekomendasi,
            dampak_organisasi
        });

    if (validationError) {
        return res.status(400).json({
            message:
                validationError
        });
    }

    const connection =
        await db.getConnection();

    try {
        await connection.beginTransaction();

        const [perubahanRows] =
            await connection.query(
                `
                SELECT
                    id,
                    lingkup
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            await connection.rollback();

            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [existingRows] =
            await connection.query(
                `
                SELECT id
                FROM mpr_analisis_organisasi
                WHERE perubahan_id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            existingRows.length > 0
        ) {
            await connection.rollback();

            return res.status(409).json({
                message:
                    'Analisis dampak organisasi untuk perubahan ini sudah tersedia.'
            });
        }

        const [result] =
            await connection.query(
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

                    typeof rekomendasi ===
                    'string'
                        ? rekomendasi.trim() ||
                          null
                        : null,

                    req.user.id
                ]
            );

        await saveDampakOrganisasi(
            connection,
            result.insertId,
            dampak_organisasi
        );

        // Ketika analisis mulai dibuat,
        // status berpindah dari
        // Perencanaan -> Analisis.
        await connection.query(
            `
            UPDATE mpr_perubahan
            SET status = 'Analisis'
            WHERE id = ?
              AND status = 'Perencanaan'
            `,
            [
                Number(id)
            ]
        );

        const data =
            await buildAnalisisOrganisasiResponse(
                connection,
                result.insertId
            );

        await connection.commit();

        try {
            await sendChangeApprovalNotification(
                Number(id),
                req.user.id
            );
        } catch (
            notificationError
        ) {
            console.error(
                'Gagal mengirim notifikasi persetujuan perubahan:',
                notificationError
            );
        }

        return res.status(201).json({
            message:
                'Analisis dampak organisasi berhasil disimpan.',
            data
        });
    } catch (error) {
        await connection.rollback();

        console.error(
            'createAnalisisOrganisasi error:',
            error
        );

        if (
            error.statusCode ===
            400
        ) {
            return res.status(400).json({
                message:
                    error.message
            });
        }

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Analisis atau area dampak organisasi sudah tersedia.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan analisis dampak organisasi.'
        });
    } finally {
        connection.release();
    }
};

// PUT /api/perubahan/analisis-organisasi/:id
exports.updateAnalisisOrganisasi = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        kesimpulan,
        rekomendasi,
        dampak_organisasi
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID analisis organisasi tidak valid.'
        });
    }

    const validationError =
        validateAnalisisOrganisasiInput({
            kesimpulan,
            rekomendasi,
            dampak_organisasi
        });

    if (validationError) {
        return res.status(400).json({
            message:
                validationError
        });
    }

    const connection =
        await db.getConnection();

    try {
        await connection.beginTransaction();

        const [existingRows] =
            await connection.query(
                `
                SELECT
                    id,
                    perubahan_id
                FROM mpr_analisis_organisasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            existingRows.length === 0
        ) {
            await connection.rollback();

            return res.status(404).json({
                message:
                    'Analisis dampak organisasi tidak ditemukan.'
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

                typeof rekomendasi ===
                'string'
                    ? rekomendasi.trim() ||
                      null
                    : null,

                Number(id)
            ]
        );

        /*
         * Child dihapus lalu dibuat ulang
         * supaya payload PUT merepresentasikan
         * kondisi lengkap terbaru.
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

        const data =
            await buildAnalisisOrganisasiResponse(
                connection,
                Number(id)
            );

        await connection.commit();

        try {
            await sendChangeApprovalNotification(
                existingRows[0]
                    .perubahan_id,
                req.user.id
            );
        } catch (
            notificationError
        ) {
            console.error(
                'Gagal mengirim ulang notifikasi persetujuan perubahan:',
                notificationError
            );
        }

        return res.status(200).json({
            message:
                'Analisis dampak organisasi berhasil diperbarui.',
            data
        });
    } catch (error) {
        await connection.rollback();

        console.error(
            'updateAnalisisOrganisasi error:',
            error
        );

        if (
            error.statusCode ===
            400
        ) {
            return res.status(400).json({
                message:
                    error.message
            });
        }

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Terdapat data dampak organisasi yang duplikat.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui analisis dampak organisasi.'
        });
    } finally {
        connection.release();
    }
};


// DELETE /api/perubahan/analisis-organisasi/:id
exports.deleteAnalisisOrganisasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID analisis organisasi tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_analisis_organisasi
                WHERE id = ?
                `,
                [Number(id)]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Analisis dampak organisasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Analisis dampak organisasi berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteAnalisisOrganisasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus analisis dampak organisasi.'
        });
    }
};


// =========================================
// MPR02B - PERSETUJUAN ANALISIS ORGANISASI
// =========================================

// GET /api/perubahan/:id/persetujuan/analisis-organisasi
exports.getPersetujuanAnalisisOrganisasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${persetujuanSelectQuery}
                WHERE ps.perubahan_id = ?
                  AND ps.tahap =
                      'Analisis Organisasi'
                ORDER BY
                    ps.diputuskan_at DESC,
                    ps.id DESC
                `,
                [Number(id)]
            );

        return res.status(200).json({
            data:
                rows
        });
    } catch (error) {
        console.error(
            'getPersetujuanAnalisisOrganisasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil riwayat persetujuan analisis organisasi.'
        });
    }
};


const createKeputusanAnalisisOrganisasi = async (
    req,
    res,
    keputusan
) => {
    const { id } = req.params;

    const {
        catatan_keputusan
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    if (
        catatan_keputusan !== undefined &&
        catatan_keputusan !== null &&
        typeof catatan_keputusan !==
            'string'
    ) {
        return res.status(400).json({
            message:
                'catatan_keputusan harus berupa teks.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT
                    id,
                    kode_perubahan,
                    status,
                    created_by
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        if (
            ![
                'Perencanaan',
                'Analisis'
            ].includes(
                perubahanRows[0]
                    .status
            )
        ) {
            return res.status(409).json({
                message:
                    'Keputusan analisis organisasi tidak dapat dilakukan karena perubahan telah melewati tahap Analisis.'
            });
        }

        const [analisisRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_analisis_organisasi
                WHERE perubahan_id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            analisisRows.length === 0
        ) {
            return res.status(409).json({
                message:
                    'Analisis dampak organisasi belum tersedia.'
            });
        }

        const [result] =
            await db.query(
                `
                INSERT INTO mpr_persetujuan (
                    perubahan_id,
                    tahap,
                    keputusan,
                    pic_id,
                    catatan_keputusan
                )
                VALUES (
                    ?,
                    'Analisis Organisasi',
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    Number(id),

                    keputusan,

                    req.user.id,

                    typeof catatan_keputusan ===
                    'string'
                        ? catatan_keputusan.trim() ||
                          null
                        : null
                ]
            );

        const statusPerubahan =
            await syncStatusSetelahAnalisis(
                Number(id)
            );

        await sendChangeDecisionNotifications({
            perubahan:
                perubahanRows[0],

            tahap:
                'Analisis Organisasi',

            keputusan,

            statusPerubahan,

            actorId:
                req.user.id
        });

        const [rows] =
            await db.query(
                `
                ${persetujuanSelectQuery}
                WHERE ps.id = ?
                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                keputusan ===
                'Disetujui'
                    ? 'Analisis organisasi berhasil disetujui.'
                    : 'Analisis organisasi berhasil ditolak.',

            data:
                rows[0]
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


// POST /api/perubahan/:id/persetujuan/analisis-organisasi/setujui
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


// POST /api/perubahan/:id/persetujuan/analisis-organisasi/tolak
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

        uk.kode_unit
            AS kode_unit_pelaksana,

        uk.nama_unit
            AS nama_unit_pelaksana,

        imp.pic_implementasi_id,

        pic.nama
            AS nama_pic_implementasi,

        imp.created_by,

        creator.nama
            AS dibuat_oleh,

        imp.created_at,
        imp.updated_at

    FROM mpr_implementasi imp

    JOIN mpr_perubahan p
        ON p.id =
           imp.perubahan_id

    JOIN unit_kerja uk
        ON uk.id =
           imp.unit_pelaksana_id

    JOIN users pic
        ON pic.id =
           imp.pic_implementasi_id

    JOIN users creator
        ON creator.id =
           imp.created_by
`;

const isValidDateString = (value) => {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const [year, month, day] =
        value.split('-').map(Number);

    const date =
        new Date(
            Date.UTC(
                year,
                month - 1,
                day
            )
        );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};


const resolveUnitPelaksana = async (req, preservedId = null) => {
    const [accounts] = await db.query(
        'SELECT unit_kerja_id, instansi_id, role_id FROM users WHERE id = ? LIMIT 1',
        [req.user.id]
    );
    if (!accounts.length) {
        const error = new Error('Akun pengguna tidak ditemukan.');
        error.statusCode = 401;
        throw error;
    }
    const account = accounts[0];
    if (preservedId && isPositiveInteger(preservedId)) {
        return Number(preservedId);
    }
    if (isPositiveInteger(account.unit_kerja_id)) {
        const [units] = await db.query(
            'SELECT id FROM unit_kerja WHERE id = ? AND instansi_id = ? LIMIT 1',
            [Number(account.unit_kerja_id), Number(account.instansi_id)]
        );
        if (units.length) return Number(units[0].id);
    }
    if (isPositiveInteger(account.instansi_id)) {
        const [units] = await db.query(
            'SELECT id FROM unit_kerja WHERE instansi_id = ? AND status = ? ORDER BY id LIMIT 2',
            [Number(account.instansi_id), 'Aktif']
        );
        if (units.length === 1) return Number(units[0].id);
    }
    const error = new Error('Unit kerja akun belum ditetapkan atau instansi memiliki beberapa unit kerja. Hubungi admin untuk menetapkan unit kerja akun.');
    error.statusCode = 409;
    throw error;
};

const validateImplementasiInput = ({
    tanggal_rencana_pelaksanaan,
    jangka_waktu_pelaksanaan,
    unit_pelaksana_id,
    pic_implementasi_id
}) => {
    if (
        !isValidDateString(
            tanggal_rencana_pelaksanaan
        )
    ) {
        return 'tanggal_rencana_pelaksanaan wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.';
    }

    if (
        typeof jangka_waktu_pelaksanaan !==
            'string' ||
        jangka_waktu_pelaksanaan.trim() ===
            ''
    ) {
        return 'jangka_waktu_pelaksanaan wajib diisi.';
    }

    if (
        jangka_waktu_pelaksanaan
            .trim()
            .length > 100
    ) {
        return 'jangka_waktu_pelaksanaan maksimal 100 karakter.';
    }

    if (
        !isPositiveInteger(
            pic_implementasi_id
        )
    ) {
        return 'pic_implementasi_id wajib berupa ID yang valid.';
    }

    return null;
};


// GET /api/perubahan/:id/implementasi
exports.getImplementasiByPerubahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${implementasiSelectQuery}
                WHERE imp.perubahan_id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan belum tersedia.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'getImplementasiByPerubahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data implementasi perubahan.'
        });
    }
};


// GET /api/perubahan/implementasi/:id
exports.getImplementasiById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [rows] =
            await db.query(
                `
                ${implementasiSelectQuery}
                WHERE imp.id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'getImplementasiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail implementasi perubahan.'
        });
    }
};


// POST /api/perubahan/:id/implementasi
exports.createImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        tanggal_rencana_pelaksanaan,
        jangka_waktu_pelaksanaan,
        pic_implementasi_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    const validationError =
        validateImplementasiInput({
            tanggal_rencana_pelaksanaan,
            jangka_waktu_pelaksanaan,
                pic_implementasi_id
        });

    if (validationError) {
        return res.status(400).json({
            message:
                validationError
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        // Pastikan seluruh tahap analisis
        // sudah disetujui sebelum masuk MPR03.
        const statusPerubahan =
            await syncStatusSetelahAnalisis(
                Number(id)
            );

        if (
            statusPerubahan !==
            'Implementasi'
        ) {
            return res.status(409).json({
                message:
                    'Perubahan belum dapat masuk tahap implementasi karena proses analisis belum disetujui sepenuhnya.'
            });
        }

        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE perubahan_id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length > 0
        ) {
            return res.status(409).json({
                message:
                    'Implementasi untuk perubahan ini sudah tersedia.'
            });
        }

        const unitPelaksanaId = await resolveUnitPelaksana(req, null);

        const [picRows] =
            await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(
                        pic_implementasi_id
                    )
                ]
            );

        if (
            picRows.length === 0
        ) {
            return res.status(400).json({
                message:
                    'PIC implementasi tidak ditemukan.'
            });
        }

        const [result] =
            await db.query(
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

                    jangka_waktu_pelaksanaan
                        .trim(),

                    unitPelaksanaId,

                    Number(
                        pic_implementasi_id
                    ),

                    req.user.id
                ]
            );

        const [rows] =
            await db.query(
                `
                ${implementasiSelectQuery}
                WHERE imp.id = ?
                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Data implementasi perubahan berhasil disimpan.',
            data:
                rows[0]
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(
            'createImplementasi error:',
            error
        );

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
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
exports.updateImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        tanggal_rencana_pelaksanaan,
        jangka_waktu_pelaksanaan,
        pic_implementasi_id
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    const validationError =
        validateImplementasiInput({
            tanggal_rencana_pelaksanaan,
            jangka_waktu_pelaksanaan,
                pic_implementasi_id
        });

    if (validationError) {
        return res.status(400).json({
            message:
                validationError
        });
    }

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id, unit_pelaksana_id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const unitPelaksanaId = await resolveUnitPelaksana(req, existingRows[0].unit_pelaksana_id);

        const [picRows] =
            await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(
                        pic_implementasi_id
                    )
                ]
            );

        if (
            picRows.length === 0
        ) {
            return res.status(400).json({
                message:
                    'PIC implementasi tidak ditemukan.'
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

                jangka_waktu_pelaksanaan
                    .trim(),

                unitPelaksanaId,

                Number(
                    pic_implementasi_id
                ),

                Number(id)
            ]
        );

        const [rows] =
            await db.query(
                `
                ${implementasiSelectQuery}
                WHERE imp.id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            message:
                'Data implementasi perubahan berhasil diperbarui.',
            data:
                rows[0]
        });
    } catch (error) {
        if (error.statusCode) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        console.error(
            'updateImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui implementasi perubahan.'
        });
    }
};


// DELETE /api/perubahan/implementasi/:id
exports.deleteImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_implementasi
                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Data implementasi perubahan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus implementasi perubahan.'
        });
    }
};


// =========================================
// MPR03 - SUMBER DAYA
// =========================================

// GET /api/perubahan/implementasi/:id/sumber-daya
exports.getSumberDayaByImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
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
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            data:
                rows
        });
    } catch (error) {
        console.error(
            'getSumberDayaByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data sumber daya.'
        });
    }
};

// POST /api/perubahan/implementasi/:id/sumber-daya
exports.createSumberDaya = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        jenis_sumber_daya,
        deskripsi
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    if (
        ![
            'Manusia',
            'TIK'
        ].includes(
            jenis_sumber_daya
        )
    ) {
        return res.status(400).json({
            message:
                'jenis_sumber_daya harus Manusia atau TIK.'
        });
    }

    if (
        typeof deskripsi !==
            'string' ||
        deskripsi.trim() ===
            ''
    ) {
        return res.status(400).json({
            message:
                'deskripsi sumber daya wajib diisi.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length ===
            0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] =
            await db.query(
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

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM mpr_sumber_daya
                WHERE id = ?
                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Sumber daya implementasi berhasil disimpan.',
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'createSumberDaya error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan sumber daya.'
        });
    }
};


// PUT /api/perubahan/sumber-daya/:id
exports.updateSumberDaya = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        jenis_sumber_daya,
        deskripsi
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID sumber daya tidak valid.'
        });
    }

    if (
        ![
            'Manusia',
            'TIK'
        ].includes(
            jenis_sumber_daya
        )
    ) {
        return res.status(400).json({
            message:
                'jenis_sumber_daya harus Manusia atau TIK.'
        });
    }

    if (
        typeof deskripsi !==
            'string' ||
        deskripsi.trim() ===
            ''
    ) {
        return res.status(400).json({
            message:
                'deskripsi sumber daya wajib diisi.'
        });
    }

    try {
        const [result] =
            await db.query(
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

        if (
            result.affectedRows ===
            0
        ) {
            return res.status(404).json({
                message:
                    'Data sumber daya tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM mpr_sumber_daya
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            message:
                'Sumber daya implementasi berhasil diperbarui.',
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'updateSumberDaya error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui sumber daya.'
        });
    }
};


// DELETE /api/perubahan/sumber-daya/:id
exports.deleteSumberDaya = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID sumber daya tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_sumber_daya
                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows ===
            0
        ) {
            return res.status(404).json({
                message:
                    'Data sumber daya tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Sumber daya implementasi berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteSumberDaya error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus sumber daya.'
        });
    }
};


// =========================================
// MPR03 - ANGGARAN
// =========================================

// GET /api/perubahan/implementasi/:id/anggaran
exports.getAnggaranByImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length ===
            0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
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
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            data:
                rows
        });
    } catch (error) {
        console.error(
            'getAnggaranByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data anggaran.'
        });
    }
};


// POST /api/perubahan/implementasi/:id/anggaran
exports.createAnggaran = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        alokasi_anggaran,
        skema_pembiayaan
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    const nilaiAnggaran =
        Number(
            alokasi_anggaran
        );

    if (
        alokasi_anggaran === '' ||
        alokasi_anggaran === null ||
        alokasi_anggaran === undefined ||
        !Number.isFinite(
            nilaiAnggaran
        ) ||
        nilaiAnggaran < 0
    ) {
        return res.status(400).json({
            message:
                'alokasi_anggaran wajib berupa angka 0 atau lebih.'
        });
    }

    if (
        typeof skema_pembiayaan !==
            'string' ||
        skema_pembiayaan.trim() ===
            ''
    ) {
        return res.status(400).json({
            message:
                'skema_pembiayaan wajib diisi.'
        });
    }

    if (
        skema_pembiayaan
            .trim()
            .length > 255
    ) {
        return res.status(400).json({
            message:
                'skema_pembiayaan maksimal 255 karakter.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length ===
            0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] =
            await db.query(
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

        const [rows] =
            await db.query(
                `
                SELECT
                    id,
                    implementasi_id,
                    alokasi_anggaran,
                    skema_pembiayaan,
                    created_at,
                    updated_at
                FROM mpr_anggaran
                WHERE id = ?
                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Data anggaran implementasi berhasil disimpan.',
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'createAnggaran error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data anggaran.'
        });
    }
};

// PUT /api/perubahan/anggaran/:id
exports.updateAnggaran = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        alokasi_anggaran,
        skema_pembiayaan
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID anggaran tidak valid.'
        });
    }

    const nilaiAnggaran =
        Number(
            alokasi_anggaran
        );

    if (
        alokasi_anggaran === '' ||
        alokasi_anggaran === null ||
        alokasi_anggaran === undefined ||
        !Number.isFinite(
            nilaiAnggaran
        ) ||
        nilaiAnggaran < 0
    ) {
        return res.status(400).json({
            message:
                'alokasi_anggaran wajib berupa angka 0 atau lebih.'
        });
    }

    if (
        typeof skema_pembiayaan !==
            'string' ||
        skema_pembiayaan.trim() ===
            ''
    ) {
        return res.status(400).json({
            message:
                'skema_pembiayaan wajib diisi.'
        });
    }

    try {
        const [result] =
            await db.query(
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

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data anggaran tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM mpr_anggaran
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            message:
                'Anggaran implementasi berhasil diperbarui.',
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'updateAnggaran error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui anggaran.'
        });
    }
};


// DELETE /api/perubahan/anggaran/:id
exports.deleteAnggaran = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID anggaran tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_anggaran
                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data anggaran tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Anggaran implementasi berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteAnggaran error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus anggaran.'
        });
    }
};


// =========================================
// MPR03 - INDIKATOR KEBERHASILAN
// =========================================

// GET /api/perubahan/implementasi/:id/indikator-keberhasilan
exports.getIndikatorKeberhasilanByImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length ===
            0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
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
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            data:
                rows
        });
    } catch (error) {
        console.error(
            'getIndikatorKeberhasilanByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator keberhasilan.'
        });
    }
};


// POST /api/perubahan/implementasi/:id/indikator-keberhasilan
exports.createIndikatorKeberhasilan = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        indikator
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    if (
        typeof indikator !==
            'string' ||
        indikator.trim() ===
            ''
    ) {
        return res.status(400).json({
            message:
                'indikator keberhasilan wajib diisi.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length ===
            0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] =
            await db.query(
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

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM mpr_indikator_keberhasilan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Indikator keberhasilan berhasil disimpan.',
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'createIndikatorKeberhasilan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan indikator keberhasilan.'
        });
    }
};


// PUT /api/perubahan/indikator-keberhasilan/:id
exports.updateIndikatorKeberhasilan = async (
    req,
    res
) => {
    const { id } = req.params;

    const {
        indikator
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator keberhasilan tidak valid.'
        });
    }

    if (
        typeof indikator !==
            'string' ||
        indikator.trim() ===
            ''
    ) {
        return res.status(400).json({
            message:
                'indikator keberhasilan wajib diisi.'
        });
    }

    try {
        const [result] =
            await db.query(
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

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Indikator keberhasilan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                SELECT *
                FROM mpr_indikator_keberhasilan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            message:
                'Indikator keberhasilan berhasil diperbarui.',
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'updateIndikatorKeberhasilan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui indikator keberhasilan.'
        });
    }
};


// DELETE /api/perubahan/indikator-keberhasilan/:id
exports.deleteIndikatorKeberhasilan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator keberhasilan tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_indikator_keberhasilan
                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Indikator keberhasilan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Indikator keberhasilan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteIndikatorKeberhasilan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus indikator keberhasilan.'
        });
    }
};

// =====================================================
// MPR03 - STRATEGI IMPLEMENTASI
// =====================================================

const normalizeStrategiText = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    if (
        typeof value !== 'string'
    ) {
        return value;
    }

    const trimmed =
        value.trim();

    return trimmed === ''
        ? null
        : trimmed;
};


const validateStrategiImplementasiInput = (
    body
) => {
    const strategiIt =
        normalizeStrategiText(
            body.strategi_it_generik
        );

    const deskripsiIt =
        normalizeStrategiText(
            body.deskripsi_strategi_it
        );

    const rollbackPlan =
        normalizeStrategiText(
            body.rollback_plan
        );

    const strategiOrganisasi =
        normalizeStrategiText(
            body.strategi_organisasi_generik
        );

    const detailOrganisasi =
        normalizeStrategiText(
            body.detail_strategi_organisasi
        );

    const fields = [
        body.strategi_it_generik,
        body.deskripsi_strategi_it,
        body.rollback_plan,
        body.strategi_organisasi_generik,
        body.detail_strategi_organisasi
    ];

    for (
        const field of fields
    ) {
        if (
            field !== undefined &&
            field !== null &&
            typeof field !== 'string'
        ) {
            return {
                valid: false,
                message:
                    'Field strategi implementasi harus berupa teks.'
            };
        }
    }

    // Minimal salah satu strategi
    if (
        !strategiIt &&
        !strategiOrganisasi
    ) {
        return {
            valid: false,
            message:
                'Minimal salah satu strategi IT atau strategi organisasi wajib diisi.'
        };
    }

    // Jika bagian IT digunakan,
    // strategi + deskripsi harus lengkap.
    if (
        (
            strategiIt ||
            deskripsiIt ||
            rollbackPlan
        ) &&
        (
            !strategiIt ||
            !deskripsiIt
        )
    ) {
        return {
            valid: false,
            message:
                'Strategi IT dan deskripsi strategi IT wajib diisi secara lengkap.'
        };
    }

    if (
        strategiIt &&
        strategiIt.length > 150
    ) {
        return {
            valid: false,
            message:
                'strategi_it_generik maksimal 150 karakter.'
        };
    }

    // Jika bagian organisasi digunakan,
    // strategi + detail harus lengkap.
    if (
        (
            strategiOrganisasi ||
            detailOrganisasi
        ) &&
        (
            !strategiOrganisasi ||
            !detailOrganisasi
        )
    ) {
        return {
            valid: false,
            message:
                'Strategi organisasi dan detail strategi organisasi wajib diisi secara lengkap.'
        };
    }

    if (
        strategiOrganisasi &&
        strategiOrganisasi.length >
            150
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
            strategi_it_generik:
                strategiIt,

            deskripsi_strategi_it:
                deskripsiIt,

            rollback_plan:
                rollbackPlan,

            strategi_organisasi_generik:
                strategiOrganisasi,

            detail_strategi_organisasi:
                detailOrganisasi
        }
    };
};


const strategiImplementasiSelectQuery = `
    SELECT
        si.id,
        si.implementasi_id,

        p.id
            AS perubahan_id,

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
        ON imp.id =
           si.implementasi_id

    JOIN mpr_perubahan p
        ON p.id =
           imp.perubahan_id
`;


// GET /api/perubahan/implementasi/:id/strategi-implementasi
exports.getStrategiImplementasiByImplementasi =
async (
    req,
    res
) => {
    const { id } =
        req.params;

    if (
        !isPositiveInteger(id)
    ) {
        return res
            .status(400)
            .json({
                message:
                    'ID implementasi tidak valid.'
            });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length ===
            0
        ) {
            return res
                .status(404)
                .json({
                    message:
                        'Data implementasi perubahan tidak ditemukan.'
                });
        }

        const [rows] =
            await db.query(
                `
                ${strategiImplementasiSelectQuery}

                WHERE
                    si.implementasi_id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            rows.length === 0
        ) {
            return res
                .status(404)
                .json({
                    message:
                        'Strategi implementasi belum tersedia.'
                });
        }

        return res
            .status(200)
            .json({
                data:
                    rows[0]
            });
    } catch (error) {
        console.error(
            'getStrategiImplementasiByImplementasi error:',
            error
        );

        return res
            .status(500)
            .json({
                message:
                    'Terjadi kesalahan saat mengambil strategi implementasi.'
            });
    }
};


// GET /api/perubahan/strategi-implementasi/:id
exports.getStrategiImplementasiById =
async (
    req,
    res
) => {
    const { id } =
        req.params;

    if (
        !isPositiveInteger(id)
    ) {
        return res
            .status(400)
            .json({
                message:
                    'ID strategi implementasi tidak valid.'
            });
    }

    try {
        const [rows] =
            await db.query(
                `
                ${strategiImplementasiSelectQuery}

                WHERE
                    si.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            rows.length === 0
        ) {
            return res
                .status(404)
                .json({
                    message:
                        'Strategi implementasi tidak ditemukan.'
                });
        }

        return res
            .status(200)
            .json({
                data:
                    rows[0]
            });
    } catch (error) {
        console.error(
            'getStrategiImplementasiById error:',
            error
        );

        return res
            .status(500)
            .json({
                message:
                    'Terjadi kesalahan saat mengambil strategi implementasi.'
            });
    }
};


// POST /api/perubahan/implementasi/:id/strategi-implementasi
exports.createStrategiImplementasi =
async (
    req,
    res
) => {
    const { id } =
        req.params;

    if (
        !isPositiveInteger(id)
    ) {
        return res
            .status(400)
            .json({
                message:
                    'ID implementasi tidak valid.'
            });
    }

    const validation =
        validateStrategiImplementasiInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res
            .status(400)
            .json({
                message:
                    validation.message
            });
    }

    const data =
        validation.data;

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            implementasiRows.length ===
            0
        ) {
            return res
                .status(404)
                .json({
                    message:
                        'Data implementasi perubahan tidak ditemukan.'
                });
        }

        // Satu implementasi
        // hanya memiliki satu strategi.
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_strategi_implementasi
                WHERE implementasi_id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length > 0
        ) {
            return res
                .status(409)
                .json({
                    message:
                        'Strategi implementasi untuk perubahan ini sudah tersedia.'
                });
        }

        const [result] =
            await db.query(
                `
                INSERT INTO mpr_strategi_implementasi (
                    implementasi_id,
                    strategi_it_generik,
                    deskripsi_strategi_it,
                    rollback_plan,
                    strategi_organisasi_generik,
                    detail_strategi_organisasi
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?
                )
                `,
                [
                    Number(id),

                    data
                        .strategi_it_generik,

                    data
                        .deskripsi_strategi_it,

                    data
                        .rollback_plan,

                    data
                        .strategi_organisasi_generik,

                    data
                        .detail_strategi_organisasi
                ]
            );

        const [rows] =
            await db.query(
                `
                ${strategiImplementasiSelectQuery}

                WHERE
                    si.id = ?

                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res
            .status(201)
            .json({
                message:
                    'Strategi implementasi berhasil disimpan.',

                data:
                    rows[0]
            });
    } catch (error) {
        console.error(
            'createStrategiImplementasi error:',
            error
        );

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res
                .status(409)
                .json({
                    message:
                        'Strategi implementasi untuk perubahan ini sudah tersedia.'
                });
        }

        return res
            .status(500)
            .json({
                message:
                    'Terjadi kesalahan saat menyimpan strategi implementasi.'
            });
    }
};


// PUT /api/perubahan/strategi-implementasi/:id
exports.updateStrategiImplementasi =
async (
    req,
    res
) => {
    const { id } =
        req.params;

    if (
        !isPositiveInteger(id)
    ) {
        return res
            .status(400)
            .json({
                message:
                    'ID strategi implementasi tidak valid.'
            });
    }

    const validation =
        validateStrategiImplementasiInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res
            .status(400)
            .json({
                message:
                    validation.message
            });
    }

    const data =
        validation.data;

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_strategi_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length ===
            0
        ) {
            return res
                .status(404)
                .json({
                    message:
                        'Strategi implementasi tidak ditemukan.'
                });
        }

        await db.query(
            `
            UPDATE
                mpr_strategi_implementasi

            SET
                strategi_it_generik = ?,
                deskripsi_strategi_it = ?,
                rollback_plan = ?,
                strategi_organisasi_generik = ?,
                detail_strategi_organisasi = ?

            WHERE id = ?
            `,
            [
                data
                    .strategi_it_generik,

                data
                    .deskripsi_strategi_it,

                data
                    .rollback_plan,

                data
                    .strategi_organisasi_generik,

                data
                    .detail_strategi_organisasi,

                Number(id)
            ]
        );

        const [rows] =
            await db.query(
                `
                ${strategiImplementasiSelectQuery}

                WHERE
                    si.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        return res
            .status(200)
            .json({
                message:
                    'Strategi implementasi berhasil diperbarui.',

                data:
                    rows[0]
            });
    } catch (error) {
        console.error(
            'updateStrategiImplementasi error:',
            error
        );

        return res
            .status(500)
            .json({
                message:
                    'Terjadi kesalahan saat memperbarui strategi implementasi.'
            });
    }
};


// DELETE /api/perubahan/strategi-implementasi/:id
exports.deleteStrategiImplementasi =
async (
    req,
    res
) => {
    const { id } =
        req.params;

    if (
        !isPositiveInteger(id)
    ) {
        return res
            .status(400)
            .json({
                message:
                    'ID strategi implementasi tidak valid.'
            });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM
                    mpr_strategi_implementasi

                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows ===
            0
        ) {
            return res
                .status(404)
                .json({
                    message:
                        'Strategi implementasi tidak ditemukan.'
                });
        }

        return res
            .status(200)
            .json({
                message:
                    'Strategi implementasi berhasil dihapus.'
            });
    } catch (error) {
        console.error(
            'deleteStrategiImplementasi error:',
            error
        );

        return res
            .status(500)
            .json({
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
            message:
                'kategori_pemangku_kepentingan wajib diisi.'
        };
    }

    if (
        kategori_pemangku_kepentingan
            .trim()
            .length > 150
    ) {
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
            message:
                'sifat_resistensi wajib diisi.'
        };
    }

    if (
        sifat_resistensi
            .trim()
            .length > 200
    ) {
        return {
            valid: false,
            message:
                'sifat_resistensi maksimal 200 karakter.'
        };
    }

    if (
        typeof tingkat_resistensi !== 'string' ||
        tingkat_resistensi.trim() === ''
    ) {
        return {
            valid: false,
            message:
                'tingkat_resistensi wajib diisi.'
        };
    }

    if (
        tingkat_resistensi
            .trim()
            .length > 100
    ) {
        return {
            valid: false,
            message:
                'tingkat_resistensi maksimal 100 karakter.'
        };
    }

    return {
        valid: true,

        data: {
            nama_stakeholder:
                nama_stakeholder.trim(),

            kategori_pemangku_kepentingan:
                kategori_pemangku_kepentingan.trim(),

            sifat_resistensi:
                sifat_resistensi.trim(),

            tingkat_resistensi:
                tingkat_resistensi.trim()
        }
    };
};


// GET /api/perubahan/implementasi/:id/stakeholder
exports.getStakeholderByImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
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
        console.error(
            'getStakeholderByImplementasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data stakeholder.'
        });
    }
};


// GET /api/perubahan/stakeholder/:id
exports.getStakeholderById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID stakeholder tidak valid.'
        });
    }

    try {
        const [rows] =
            await db.query(
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

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data stakeholder tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getStakeholderById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data stakeholder.'
        });
    }
};


// POST /api/perubahan/implementasi/:id/stakeholder
exports.createStakeholder = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    const validation =
        validateStakeholderInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] =
            await db.query(
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

        const [rows] =
            await db.query(
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
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Data stakeholder berhasil disimpan.',

            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'createStakeholder error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data stakeholder.'
        });
    }
};


// PUT /api/perubahan/stakeholder/:id
exports.updateStakeholder = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID stakeholder tidak valid.'
        });
    }

    const validation =
        validateStakeholderInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_stakeholder
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data stakeholder tidak ditemukan.'
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

        const [rows] =
            await db.query(
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
            message:
                'Data stakeholder berhasil diperbarui.',

            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'updateStakeholder error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data stakeholder.'
        });
    }
};


// DELETE /api/perubahan/stakeholder/:id
exports.deleteStakeholder = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID stakeholder tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_stakeholder
                WHERE id = ?
                `,
                [Number(id)]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data stakeholder tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Data stakeholder berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteStakeholder error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus data stakeholder.'
        });
    }
};


// =====================================================
// MPR03 - KOMUNIKASI & MEDIA KOMUNIKASI
// =====================================================

const validateKomunikasiInput = (
    body
) => {
    const {
        informasi,
        pengirim_informan,
        target_audiens,
        tanggal_rencana_komunikasi,
        media_komunikasi
    } = body;

    if (
        typeof informasi !==
            'string' ||
        informasi.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'informasi wajib diisi.'
        };
    }

    if (
        typeof pengirim_informan !==
            'string' ||
        pengirim_informan.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'pengirim_informan wajib diisi.'
        };
    }

    if (
        pengirim_informan
            .trim()
            .length > 200
    ) {
        return {
            valid: false,
            message:
                'pengirim_informan maksimal 200 karakter.'
        };
    }

    if (
        typeof target_audiens !==
            'string' ||
        target_audiens.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'target_audiens wajib diisi.'
        };
    }

    if (
        !isValidDateString(
            tanggal_rencana_komunikasi
        )
    ) {
        return {
            valid: false,
            message:
                'tanggal_rencana_komunikasi wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.'
        };
    }

    if (
        !Array.isArray(
            media_komunikasi
        ) ||
        media_komunikasi.length ===
            0
    ) {
        return {
            valid: false,
            message:
                'media_komunikasi wajib berupa array dan minimal berisi satu media.'
        };
    }

    const normalizedMedia = [];

    for (
        const media of
        media_komunikasi
    ) {
        if (
            typeof media !==
                'string' ||
            media.trim() ===
                ''
        ) {
            return {
                valid: false,
                message:
                    'Setiap media_komunikasi wajib berupa teks dan tidak boleh kosong.'
            };
        }

        const trimmedMedia =
            media.trim();

        if (
            trimmedMedia.length >
            100
        ) {
            return {
                valid: false,
                message:
                    'Setiap media_komunikasi maksimal 100 karakter.'
            };
        }

        normalizedMedia.push(
            trimmedMedia
        );
    }

    // Mencegah media duplikat
    // meskipun beda huruf besar/kecil.
    const mediaKeys =
        normalizedMedia.map(
            (media) =>
                media.toLowerCase()
        );

    if (
        new Set(mediaKeys).size !==
        mediaKeys.length
    ) {
        return {
            valid: false,
            message:
                'media_komunikasi tidak boleh memiliki nilai yang sama.'
        };
    }

    return {
        valid: true,

        data: {
            informasi:
                informasi.trim(),

            pengirim_informan:
                pengirim_informan.trim(),

            target_audiens:
                target_audiens.trim(),

            tanggal_rencana_komunikasi,

            media_komunikasi:
                normalizedMedia
        }
    };
};


const buildKomunikasiResponse = async (
    queryExecutor,
    komunikasiId
) => {
    const [komunikasiRows] =
        await queryExecutor.query(
            `
            SELECT
                k.id,
                k.implementasi_id,

                p.id
                    AS perubahan_id,

                p.kode_perubahan,

                k.informasi,
                k.pengirim_informan,
                k.target_audiens,
                k.tanggal_rencana_komunikasi,

                k.created_at,
                k.updated_at

            FROM mpr_komunikasi k

            JOIN mpr_implementasi imp
                ON imp.id =
                   k.implementasi_id

            JOIN mpr_perubahan p
                ON p.id =
                   imp.perubahan_id

            WHERE k.id = ?

            LIMIT 1
            `,
            [
                Number(
                    komunikasiId
                )
            ]
        );

    if (
        komunikasiRows.length === 0
    ) {
        return null;
    }

    const [mediaRows] =
        await queryExecutor.query(
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
            [
                Number(
                    komunikasiId
                )
            ]
        );

    return {
        ...komunikasiRows[0],

        media_komunikasi:
            mediaRows
    };
};


// GET /api/perubahan/implementasi/:id/komunikasi
exports.getKomunikasiByImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [komunikasiRows] =
            await db.query(
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

        if (
            komunikasiRows.length === 0
        ) {
            return res.status(200).json({
                data: []
            });
        }

        const [mediaRows] =
            await db.query(
                `
                SELECT
                    mk.id,
                    mk.komunikasi_id,
                    mk.media_komunikasi,
                    mk.created_at

                FROM mpr_media_komunikasi mk

                JOIN mpr_komunikasi k
                    ON k.id =
                       mk.komunikasi_id

                WHERE
                    k.implementasi_id = ?

                ORDER BY mk.id ASC
                `,
                [Number(id)]
            );

        const data =
            komunikasiRows.map(
                (komunikasi) => ({
                    ...komunikasi,

                    media_komunikasi:
                        mediaRows.filter(
                            (media) =>
                                media
                                    .komunikasi_id ===
                                komunikasi.id
                        )
                })
            );

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
exports.getKomunikasiById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID komunikasi tidak valid.'
        });
    }

    try {
        const data =
            await buildKomunikasiResponse(
                db,
                Number(id)
            );

        if (!data) {
            return res.status(404).json({
                message:
                    'Data komunikasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data
        });
    } catch (error) {
        console.error(
            'getKomunikasiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data komunikasi.'
        });
    }
};


// POST /api/perubahan/implementasi/:id/komunikasi
exports.createKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    const validation =
        validateKomunikasiInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    let connection;

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        connection =
            await db.getConnection();

        await connection
            .beginTransaction();

        const [result] =
            await connection.query(
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

        for (
            const media of
            data.media_komunikasi
        ) {
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

            data:
                responseData
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error(
            'createKomunikasi error:',
            error
        );

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
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
exports.updateKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID komunikasi tidak valid.'
        });
    }

    const validation =
        validateKomunikasiInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    let connection;

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_komunikasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data komunikasi tidak ditemukan.'
            });
        }

        connection =
            await db.getConnection();

        await connection
            .beginTransaction();

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

        /*
         * Media diganti berdasarkan
         * payload terbaru.
         */
        await connection.query(
            `
            DELETE FROM mpr_media_komunikasi
            WHERE komunikasi_id = ?
            `,
            [Number(id)]
        );

        for (
            const media of
            data.media_komunikasi
        ) {
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

            data:
                responseData
        });
    } catch (error) {
        if (connection) {
            await connection.rollback();
        }

        console.error(
            'updateKomunikasi error:',
            error
        );

        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
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
exports.deleteKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID komunikasi tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_komunikasi
                WHERE id = ?
                `,
                [Number(id)]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data komunikasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Rencana komunikasi berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteKomunikasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus rencana komunikasi.'
        });
    }
};


// =====================================================
// MPR03 - PELATIHAN
// =====================================================

const validatePelatihanInput = (
    body
) => {
    const {
        nama_pelatihan,
        target_peserta,
        target_jumlah,
        metode_pelatihan,
        tanggal_rencana_pelaksanaan
    } = body;

    if (
        typeof nama_pelatihan !==
            'string' ||
        nama_pelatihan.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'nama_pelatihan wajib diisi.'
        };
    }

    if (
        nama_pelatihan
            .trim()
            .length > 200
    ) {
        return {
            valid: false,
            message:
                'nama_pelatihan maksimal 200 karakter.'
        };
    }

    if (
        typeof target_peserta !==
            'string' ||
        target_peserta.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'target_peserta wajib diisi.'
        };
    }

    if (
        target_peserta
            .trim()
            .length > 255
    ) {
        return {
            valid: false,
            message:
                'target_peserta maksimal 255 karakter.'
        };
    }

    if (
        !Number.isInteger(
            Number(
                target_jumlah
            )
        ) ||
        Number(
            target_jumlah
        ) <= 0
    ) {
        return {
            valid: false,
            message:
                'target_jumlah wajib berupa bilangan bulat lebih dari 0.'
        };
    }

    if (
        typeof metode_pelatihan !==
            'string' ||
        metode_pelatihan.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'metode_pelatihan wajib diisi.'
        };
    }

    if (
        metode_pelatihan
            .trim()
            .length > 150
    ) {
        return {
            valid: false,
            message:
                'metode_pelatihan maksimal 150 karakter.'
        };
    }

    if (
        !isValidDateString(
            tanggal_rencana_pelaksanaan
        )
    ) {
        return {
            valid: false,
            message:
                'tanggal_rencana_pelaksanaan wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.'
        };
    }

    return {
        valid: true,

        data: {
            nama_pelatihan:
                nama_pelatihan.trim(),

            target_peserta:
                target_peserta.trim(),

            target_jumlah:
                Number(
                    target_jumlah
                ),

            metode_pelatihan:
                metode_pelatihan.trim(),

            tanggal_rencana_pelaksanaan
        }
    };
};


// GET /api/perubahan/implementasi/:id/pelatihan
exports.getPelatihanByImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
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
            data:
                rows
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
exports.getPelatihanById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID pelatihan tidak valid.'
        });
    }

    try {
        const [rows] =
            await db.query(
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

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data pelatihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'getPelatihanById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data pelatihan.'
        });
    }
};


// POST /api/perubahan/implementasi/:id/pelatihan
exports.createPelatihan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    const validation =
        validatePelatihanInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [result] =
            await db.query(
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

        const [rows] =
            await db.query(
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
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Data pelatihan berhasil disimpan.',

            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'createPelatihan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data pelatihan.'
        });
    }
};


// PUT /api/perubahan/pelatihan/:id
exports.updatePelatihan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID pelatihan tidak valid.'
        });
    }

    const validation =
        validatePelatihanInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_pelatihan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data pelatihan tidak ditemukan.'
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

        const [rows] =
            await db.query(
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
            message:
                'Data pelatihan berhasil diperbarui.',

            data:
                rows[0]
        });
    } catch (error) {
        console.error(
            'updatePelatihan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data pelatihan.'
        });
    }
};


// DELETE /api/perubahan/pelatihan/:id
exports.deletePelatihan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID pelatihan tidak valid.'
        });
    }

    try {
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_pelatihan
                WHERE id = ?
                `,
                [Number(id)]
            );

        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Data pelatihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Data pelatihan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deletePelatihan error:',
            error
        );

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
exports.getPersetujuanPelaksanaan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${persetujuanSelectQuery}

                WHERE
                    ps.perubahan_id = ?
                    AND ps.tahap = 'Pelaksanaan'

                ORDER BY
                    ps.diputuskan_at DESC,
                    ps.id DESC
                `,
                [Number(id)]
            );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getPersetujuanPelaksanaan error:',
            error
        );

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

    const {
        catatan_keputusan
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID perubahan tidak valid.'
        });
    }

    if (
        catatan_keputusan !== undefined &&
        catatan_keputusan !== null &&
        typeof catatan_keputusan !==
            'string'
    ) {
        return res.status(400).json({
            message:
                'catatan_keputusan harus berupa teks.'
        });
    }

    try {
        // Pastikan perubahan tersedia.
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        /*
         * Sinkronkan status berdasarkan
         * keputusan Analisis Teknis
         * dan/atau Analisis Organisasi.
         */
        const statusPerubahan =
            await syncStatusSetelahAnalisis(
                Number(id)
            );

        /*
         * Persetujuan pelaksanaan
         * hanya dilakukan ketika
         * perubahan telah masuk
         * tahap Implementasi.
         */
        if (
            statusPerubahan !==
            'Implementasi'
        ) {
            return res.status(409).json({
                message:
                    'Pelaksanaan belum dapat diputuskan karena tahap analisis belum disetujui sepenuhnya.'
            });
        }

        // Pastikan data implementasi tersedia.
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE perubahan_id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(400).json({
                message:
                    'Data implementasi perubahan belum tersedia.'
            });
        }

        /*
         * Simpan sebagai history,
         * sehingga keputusan lama
         * tidak ditimpa.
         */
        const [result] =
            await db.query(
                `
                INSERT INTO mpr_persetujuan (
                    perubahan_id,
                    tahap,
                    keputusan,
                    pic_id,
                    catatan_keputusan
                )
                VALUES (
                    ?,
                    'Pelaksanaan',
                    ?,
                    ?,
                    ?
                )
                `,
                [
                    Number(id),

                    keputusan,

                    req.user.id,

                    typeof catatan_keputusan ===
                        'string' &&
                    catatan_keputusan.trim() !==
                        ''
                        ? catatan_keputusan.trim()
                        : null
                ]
            );

        const [rows] =
            await db.query(
                `
                ${persetujuanSelectQuery}

                WHERE ps.id = ?

                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        /*
         * Setelah pelaksanaan
         * disetujui, workflow
         * berpindah ke Evaluasi.
         */
        if (
            keputusan ===
            'Disetujui'
        ) {
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
                keputusan ===
                'Disetujui'
                    ? 'Pelaksanaan perubahan berhasil disetujui.'
                    : 'Pelaksanaan perubahan berhasil ditolak.',

            data:
                rows[0]
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


// POST /api/perubahan/:id/persetujuan/pelaksanaan/approve
exports.approvePelaksanaan = async (
    req,
    res
) => {
    return createKeputusanPelaksanaan(
        req,
        res,
        'Disetujui'
    );
};


// POST /api/perubahan/:id/persetujuan/pelaksanaan/reject
exports.rejectPelaksanaan = async (
    req,
    res
) => {
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

        u.nama
            AS dibuat_oleh,

        ev.created_at,
        ev.updated_at

    FROM mpr_evaluasi ev

    JOIN mpr_implementasi imp
        ON imp.id =
           ev.implementasi_id

    JOIN mpr_perubahan p
        ON p.id =
           imp.perubahan_id

    JOIN users u
        ON u.id =
           ev.created_by
`;


const validateEvaluasiInput = ({
    tanggal_evaluasi,
    ringkasan_tinjauan,
    isu_perbaikan,
    pembelajaran
}) => {
    if (
        !isValidDateString(
            tanggal_evaluasi
        )
    ) {
        return {
            valid: false,
            message:
                'tanggal_evaluasi wajib berformat YYYY-MM-DD dan berupa tanggal yang valid.'
        };
    }

    if (
        typeof ringkasan_tinjauan !==
            'string' ||
        ringkasan_tinjauan.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'ringkasan_tinjauan wajib diisi.'
        };
    }

    if (
        isu_perbaikan !== undefined &&
        isu_perbaikan !== null &&
        typeof isu_perbaikan !==
            'string'
    ) {
        return {
            valid: false,
            message:
                'isu_perbaikan harus berupa teks.'
        };
    }

    if (
        typeof pembelajaran !==
            'string' ||
        pembelajaran.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'pembelajaran wajib diisi.'
        };
    }

    return {
        valid: true,

        data: {
            tanggal_evaluasi,

            ringkasan_tinjauan:
                ringkasan_tinjauan.trim(),

            isu_perbaikan:
                typeof isu_perbaikan ===
                'string'
                    ? isu_perbaikan.trim() ||
                      null
                    : null,

            pembelajaran:
                pembelajaran.trim()
        }
    };
};


// GET /api/perubahan/implementasi/:id/evaluasi
exports.getEvaluasiByImplementasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_implementasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${evaluasiSelectQuery}

                WHERE
                    ev.implementasi_id = ?

                ORDER BY
                    ev.tanggal_evaluasi DESC,
                    ev.id DESC
                `,
                [Number(id)]
            );

        return res.status(200).json({
            data:
                rows
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
exports.getEvaluasiById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi tidak valid.'
        });
    }

    try {
        const [rows] =
            await db.query(
                `
                ${evaluasiSelectQuery}

                WHERE ev.id = ?

                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data evaluasi perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
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
exports.createEvaluasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID implementasi tidak valid.'
        });
    }

    const validation =
        validateEvaluasiInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [implementasiRows] =
            await db.query(
                `
                SELECT
                    imp.id,
                    imp.perubahan_id,

                    p.klasifikasi,
                    p.status

                FROM mpr_implementasi imp

                JOIN mpr_perubahan p
                    ON p.id =
                       imp.perubahan_id

                WHERE imp.id = ?

                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            implementasiRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data implementasi perubahan tidak ditemukan.'
            });
        }

        const implementasi =
            implementasiRows[0];

        /*
         * Evaluasi hanya dapat dimulai
         * ketika perubahan telah masuk
         * tahap Implementasi.
         *
         * Evaluasi tambahan tetap dapat
         * disimpan ketika status sudah
         * berada pada Evaluasi.
         */
        if (
            implementasi.status !==
                'Implementasi' &&
            implementasi.status !==
                'Evaluasi'
        ) {
            return res.status(409).json({
                message:
                    'Evaluasi belum dapat dilakukan karena perubahan belum berada pada tahap Implementasi.'
            });
        }

        /*
         * Untuk klasifikasi Normal
         * dan Emergency, keputusan
         * Pelaksanaan terakhir wajib
         * Disetujui.
         *
         * Standard tidak memerlukan
         * persetujuan berulang.
         */
        if (
            implementasi.klasifikasi ===
                'Normal' ||
            implementasi.klasifikasi ===
                'Emergency'
        ) {
            const keputusanPelaksanaan =
                await getLatestKeputusanPerubahan(
                    implementasi
                        .perubahan_id,

                    'Pelaksanaan'
                );

            if (
                keputusanPelaksanaan !==
                'Disetujui'
            ) {
                return res.status(409).json({
                    message:
                        'Evaluasi belum dapat dilakukan karena keputusan pelaksanaan terbaru belum Disetujui.'
                });
            }
        }

        const [result] =
            await db.query(
                `
                INSERT INTO mpr_evaluasi (
                    implementasi_id,
                    tanggal_evaluasi,
                    ringkasan_tinjauan,
                    isu_perbaikan,
                    pembelajaran,
                    created_by
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?
                )
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

        /*
         * Ketika evaluasi pertama dibuat,
         * workflow resmi menjadi Evaluasi.
         */
        if (
            implementasi.status ===
            'Implementasi'
        ) {
            await db.query(
                `
                UPDATE mpr_perubahan

                SET status = 'Evaluasi'

                WHERE id = ?
                  AND status = 'Implementasi'
                `,
                [
                    Number(
                        implementasi
                            .perubahan_id
                    )
                ]
            );
        }

        const [rows] =
            await db.query(
                `
                ${evaluasiSelectQuery}

                WHERE ev.id = ?

                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Evaluasi perubahan berhasil disimpan.',

            data:
                rows[0]
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
exports.updateEvaluasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi tidak valid.'
        });
    }

    const validation =
        validateEvaluasiInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_evaluasi
                WHERE id = ?
                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            existingRows.length === 0
        ) {
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

        const [rows] =
            await db.query(
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

            data:
                rows[0]
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
exports.deleteEvaluasi = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi tidak valid.'
        });
    }

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT
                    ev.id,
                    ev.implementasi_id,

                    imp.perubahan_id

                FROM mpr_evaluasi ev

                JOIN mpr_implementasi imp
                    ON imp.id =
                       ev.implementasi_id

                WHERE ev.id = ?

                LIMIT 1
                `,
                [Number(id)]
            );

        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data evaluasi perubahan tidak ditemukan.'
            });
        }

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
        ON p.id =
           lp.perubahan_id

    JOIN users u
        ON u.id =
           lp.created_by
`;


const validateLogPerubahanInput = ({
    tanggal_pelaksanaan,
    catatan,
    status_perubahan
}) => {
    if (
        !isValidDateString(
            tanggal_pelaksanaan
        )
    ) {
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
            message:
                'catatan wajib diisi.'
        };
    }

    if (
        typeof status_perubahan !==
            'string' ||
        status_perubahan.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'status_perubahan wajib diisi.'
        };
    }

    if (
        status_perubahan
            .trim()
            .length > 50
    ) {
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

            catatan:
                catatan.trim(),

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
            message:
                'ID perubahan tidak valid.'
        });
    }

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${logPerubahanSelectQuery}

                WHERE
                    lp.perubahan_id = ?

                ORDER BY
                    lp.tanggal_pelaksanaan DESC,
                    lp.id DESC
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            data:
                rows
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
        const [rows] =
            await db.query(
                `
                ${logPerubahanSelectQuery}

                WHERE lp.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
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
            message:
                'ID perubahan tidak valid.'
        });
    }

    const validation =
        validateLogPerubahanInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [perubahanRows] =
            await db.query(
                `
                SELECT
                    id,
                    status

                FROM mpr_perubahan

                WHERE id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            perubahanRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data perubahan tidak ditemukan.'
            });
        }

        const perubahan =
            perubahanRows[0];

        if (
            perubahan.status !==
                'Evaluasi' &&
            perubahan.status !==
                'Selesai'
        ) {
            return res.status(409).json({
                message:
                    'Logbook belum dapat dicatat karena perubahan belum berada pada tahap Evaluasi.'
            });
        }

        /*
         * Saat logbook mulai dicatat,
         * perubahan dapat ditandai selesai.
         */
        await db.query(
            `
            UPDATE mpr_perubahan

            SET status = 'Selesai'

            WHERE id = ?
              AND status = 'Evaluasi'
            `,
            [
                Number(id)
            ]
        );

        const [result] =
            await db.query(
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

        const [rows] =
            await db.query(
                `
                ${logPerubahanSelectQuery}

                WHERE lp.id = ?

                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Logbook perubahan berhasil disimpan.',

            data:
                rows[0]
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
        validateLogPerubahanInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_log_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length === 0
        ) {
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

        const [rows] =
            await db.query(
                `
                ${logPerubahanSelectQuery}

                WHERE lp.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            message:
                'Logbook perubahan berhasil diperbarui.',

            data:
                rows[0]
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
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_log_perubahan
                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows === 0
        ) {
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
        ON lp.id =
           bp.log_perubahan_id

    JOIN mpr_perubahan p
        ON p.id =
           lp.perubahan_id

    JOIN users u
        ON u.id =
           bp.uploaded_by
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
        typeof jenis_bukti !==
            'string' ||
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
        typeof nama_bukti !==
            'string' ||
        nama_bukti.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'nama_bukti wajib diisi.'
        };
    }

    if (
        nama_bukti
            .trim()
            .length > 255
    ) {
        return {
            valid: false,
            message:
                'nama_bukti maksimal 255 karakter.'
        };
    }

    if (
        typeof lokasi_bukti !==
            'string' ||
        lokasi_bukti.trim() ===
            ''
    ) {
        return {
            valid: false,
            message:
                'lokasi_bukti wajib diisi.'
        };
    }

    if (
        keterangan !== undefined &&
        keterangan !== null &&
        typeof keterangan !==
            'string'
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
                typeof keterangan ===
                'string'
                    ? keterangan.trim() ||
                      null
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
        const [logRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_log_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            logRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        const [rows] =
            await db.query(
                `
                ${buktiPelaksanaanSelectQuery}

                WHERE
                    bp.log_perubahan_id = ?

                ORDER BY
                    bp.id ASC
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            data:
                rows
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
        const [rows] =
            await db.query(
                `
                ${buktiPelaksanaanSelectQuery}

                WHERE bp.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            rows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data bukti pelaksanaan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data:
                rows[0]
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
        validateBuktiPelaksanaanInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [logRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_log_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            logRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Data logbook perubahan tidak ditemukan.'
            });
        }

        const [result] =
            await db.query(
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

        const [rows] =
            await db.query(
                `
                ${buktiPelaksanaanSelectQuery}

                WHERE bp.id = ?

                LIMIT 1
                `,
                [
                    result.insertId
                ]
            );

        return res.status(201).json({
            message:
                'Bukti pelaksanaan berhasil disimpan.',

            data:
                rows[0]
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
        validateBuktiPelaksanaanInput(
            req.body
        );

    if (
        !validation.valid
    ) {
        return res.status(400).json({
            message:
                validation.message
        });
    }

    const data =
        validation.data;

    try {
        const [existingRows] =
            await db.query(
                `
                SELECT id
                FROM mpr_bukti_pelaksanaan
                WHERE id = ?
                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        if (
            existingRows.length === 0
        ) {
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

        const [rows] =
            await db.query(
                `
                ${buktiPelaksanaanSelectQuery}

                WHERE bp.id = ?

                LIMIT 1
                `,
                [
                    Number(id)
                ]
            );

        return res.status(200).json({
            message:
                'Bukti pelaksanaan berhasil diperbarui.',

            data:
                rows[0]
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
        const [result] =
            await db.query(
                `
                DELETE FROM mpr_bukti_pelaksanaan
                WHERE id = ?
                `,
                [
                    Number(id)
                ]
            );

        if (
            result.affectedRows === 0
        ) {
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

const MPR_SCOPE_RULES = {
    getPersetujuanAnalisisTeknis: { type: 'perubahan' },
    approveAnalisisTeknis: { type: 'perubahan' },
    rejectAnalisisTeknis: { type: 'perubahan' },
    getPersetujuanAnalisisOrganisasi: { type: 'perubahan' },
    approveAnalisisOrganisasi: { type: 'perubahan' },
    rejectAnalisisOrganisasi: { type: 'perubahan' },
    getImplementasiById: { type: 'record', table: 'mpr_implementasi' },
    updateImplementasi: { type: 'record', table: 'mpr_implementasi' },
    deleteImplementasi: { type: 'record', table: 'mpr_implementasi' },
    getImplementasiByPerubahan: { type: 'perubahan' },
    createImplementasi: { type: 'perubahan' },
    getSumberDayaByImplementasi: { type: 'implementasi' },
    createSumberDaya: { type: 'implementasi' },
    updateSumberDaya: { type: 'record', table: 'mpr_sumber_daya' },
    deleteSumberDaya: { type: 'record', table: 'mpr_sumber_daya' },
    getAnggaranByImplementasi: { type: 'implementasi' },
    createAnggaran: { type: 'implementasi' },
    updateAnggaran: { type: 'record', table: 'mpr_anggaran' },
    deleteAnggaran: { type: 'record', table: 'mpr_anggaran' },
    getIndikatorKeberhasilanByImplementasi: { type: 'implementasi' },
    createIndikatorKeberhasilan: { type: 'implementasi' },
    updateIndikatorKeberhasilan: { type: 'record', table: 'mpr_indikator_keberhasilan' },
    deleteIndikatorKeberhasilan: { type: 'record', table: 'mpr_indikator_keberhasilan' },
    getStrategiImplementasiByImplementasi: { type: 'implementasi' },
    createStrategiImplementasi: { type: 'implementasi' },
    getStrategiImplementasiById: { type: 'record', table: 'mpr_strategi_implementasi' },
    updateStrategiImplementasi: { type: 'record', table: 'mpr_strategi_implementasi' },
    deleteStrategiImplementasi: { type: 'record', table: 'mpr_strategi_implementasi' },
    getStakeholderByImplementasi: { type: 'implementasi' },
    createStakeholder: { type: 'implementasi' },
    getStakeholderById: { type: 'record', table: 'mpr_stakeholder' },
    updateStakeholder: { type: 'record', table: 'mpr_stakeholder' },
    deleteStakeholder: { type: 'record', table: 'mpr_stakeholder' },
    getKomunikasiByImplementasi: { type: 'implementasi' },
    createKomunikasi: { type: 'implementasi' },
    getKomunikasiById: { type: 'record', table: 'mpr_komunikasi' },
    updateKomunikasi: { type: 'record', table: 'mpr_komunikasi' },
    deleteKomunikasi: { type: 'record', table: 'mpr_komunikasi' },
    getPelatihanByImplementasi: { type: 'implementasi' },
    createPelatihan: { type: 'implementasi' },
    getPelatihanById: { type: 'record', table: 'mpr_pelatihan' },
    updatePelatihan: { type: 'record', table: 'mpr_pelatihan' },
    deletePelatihan: { type: 'record', table: 'mpr_pelatihan' },
    getPersetujuanPelaksanaan: { type: 'perubahan' },
    approvePelaksanaan: { type: 'perubahan' },
    rejectPelaksanaan: { type: 'perubahan' },
    getEvaluasiByImplementasi: { type: 'implementasi' },
    createEvaluasi: { type: 'implementasi' },
    getEvaluasiById: { type: 'record', table: 'mpr_evaluasi' },
    updateEvaluasi: { type: 'record', table: 'mpr_evaluasi' },
    deleteEvaluasi: { type: 'record', table: 'mpr_evaluasi' },
    getLogPerubahanByPerubahan: { type: 'perubahan' },
    createLogPerubahan: { type: 'perubahan' },
    getLogPerubahanById: { type: 'record', table: 'mpr_log_perubahan' },
    updateLogPerubahan: { type: 'record', table: 'mpr_log_perubahan' },
    deleteLogPerubahan: { type: 'record', table: 'mpr_log_perubahan' },
    getBuktiPelaksanaanByLogbook: { type: 'logbook' },
    createBuktiPelaksanaan: { type: 'logbook' },
    getBuktiPelaksanaanById: { type: 'record', table: 'mpr_bukti_pelaksanaan' },
    updateBuktiPelaksanaan: { type: 'record', table: 'mpr_bukti_pelaksanaan' },
    deleteBuktiPelaksanaan: { type: 'record', table: 'mpr_bukti_pelaksanaan' },
};

const MPR_SCOPE_PATHS = {
    mpr_implementasi: 'JOIN mpr_perubahan p ON p.id = x.perubahan_id',
    mpr_sumber_daya: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_anggaran: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_indikator_keberhasilan: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_strategi_implementasi: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_stakeholder: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_komunikasi: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_pelatihan: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_evaluasi: 'JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id',
    mpr_log_perubahan: 'JOIN mpr_perubahan p ON p.id = x.perubahan_id',
    mpr_bukti_pelaksanaan: 'JOIN mpr_log_perubahan logp ON logp.id = x.log_perubahan_id JOIN mpr_perubahan p ON p.id = logp.perubahan_id'
};

const verifyMprScope = async (req, rule) => {
    const actor = Number(req.user?.id);
    if (!Number.isSafeInteger(actor) || actor < 1) {
        return { status: 401, message: 'Autentikasi pengguna tidak valid.' };
    }

    const [accounts] = await db.query(
        `SELECT u.id, u.role_id, u.instansi_id, i.nama_instansi
         FROM users u
         LEFT JOIN instansi i ON i.id = u.instansi_id
         WHERE u.id = ? LIMIT 1`,
        [actor]
    );

    if (!accounts.length) {
        return { status: 401, message: 'Akun pengguna tidak ditemukan.' };
    }

    const account = accounts[0];
    if (Number(account.role_id) === 1) {
        return null;
    }

    const instansiId = Number(account.instansi_id);
    if (!Number.isSafeInteger(instansiId) || instansiId < 1 || !account.nama_instansi) {
        return { status: 403, message: 'Instansi akun tidak valid.' };
    }

    const targetId = Number(req.params.id);
    if (!Number.isSafeInteger(targetId) || targetId < 1) {
        return { status: 400, message: 'ID data tidak valid.' };
    }

    let fromSql;
    if (rule.type === 'perubahan') {
        fromSql = 'mpr_perubahan p';
    } else if (rule.type === 'implementasi') {
        fromSql = `${'mpr_implementasi'} x ${MPR_SCOPE_PATHS.mpr_implementasi}`;
    } else if (rule.type === 'logbook') {
        fromSql = `mpr_log_perubahan x ${MPR_SCOPE_PATHS.mpr_log_perubahan}`;
    } else {
        const join = MPR_SCOPE_PATHS[rule.table];
        if (!join) {
            return { status: 500, message: 'Konfigurasi akses perubahan belum lengkap.' };
        }
        fromSql = `${rule.table} x ${join}`;
    }

    const identifier = rule.type === 'perubahan' ? 'p.id' : 'x.id';
    const [matched] = await db.query(
        `SELECT 1 AS allowed FROM ${fromSql}
         WHERE ${identifier} = ?
         AND LOWER(TRIM(p.nama_instansi)) = LOWER(TRIM(?))
         LIMIT 1`,
        [targetId, account.nama_instansi]
    );

    if (!matched.length) {
        return { status: 404, message: 'Data perubahan tidak ditemukan untuk instansi ini.' };
    }

    if (req.body && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
        const unitId = req.body.unit_pelaksana_id;
        if (unitId !== undefined) {
            const [units] = await db.query(
                'SELECT id FROM unit_kerja WHERE id = ? AND instansi_id = ? LIMIT 1',
                [Number(unitId), instansiId]
            );
            if (!units.length) {
                return { status: 403, message: 'Unit pelaksana bukan milik instansi pengguna.' };
            }
        }

        const picId = req.body.pic_implementasi_id;
        if (picId !== undefined) {
            const [pics] = await db.query(
                'SELECT id FROM users WHERE id = ? AND instansi_id = ? LIMIT 1',
                [Number(picId), instansiId]
            );
            if (!pics.length) {
                return { status: 403, message: 'PIC implementasi bukan milik instansi pengguna.' };
            }
        }
    }
    return null;
};

for (const [functionName, rule] of Object.entries(MPR_SCOPE_RULES)) {
    const original = exports[functionName];
    if (typeof original !== 'function') {
        throw new Error(`Handler Manajemen Perubahan tidak tersedia: ${functionName}`);
    }
    exports[functionName] = async (req, res) => {
        try {
            const denied = await verifyMprScope(req, rule);
            if (denied) {
                return res.status(denied.status).json({ message: denied.message });
            }
            return await original(req, res);
        } catch (error) {
            console.error('Pemeriksaan instansi Manajemen Perubahan gagal:', error);
            if (!res.headersSent) {
                return res.status(500).json({ message: 'Gagal memeriksa akses instansi.' });
            }
        }
    };
}


const getPerubahanActor = async (req) => {
    const [rows] = await db.query(
        'SELECT id, instansi_id, role_id FROM users WHERE id = ? LIMIT 1',
        [req.user && req.user.id]
    );
    if (!rows.length) {
        const error = new Error('Pengguna tidak ditemukan.');
        error.statusCode = 401;
        throw error;
    }
    return {
        instansi_id: rows[0].instansi_id,
        isAdmin: Number(rows[0].role_id) === 1
    };
};

const perubahanAccessMap = {
    Perencanaan: ['mpr_perencanaan p', 'p.created_by'],
    AnalisisPrioritas: ['mpr_analisis_prioritas x JOIN mpr_perencanaan p ON p.id = x.perencanaan_id', 'p.created_by'],
    Perubahan: ['mpr_perubahan p', 'p.created_by'],
    DampakTeknis: ['mpr_dampak_teknis x JOIN mpr_perubahan p ON p.id = x.perubahan_id', 'p.created_by'],
    AnalisisOrganisasi: ['mpr_analisis_organisasi x JOIN mpr_perubahan p ON p.id = x.perubahan_id', 'p.created_by'],
    Implementasi: ['mpr_implementasi x JOIN mpr_perubahan p ON p.id = x.perubahan_id', 'p.created_by'],
    SumberDaya: ['mpr_sumber_daya x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    Anggaran: ['mpr_anggaran x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    IndikatorKeberhasilan: ['mpr_indikator_keberhasilan x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    StrategiImplementasi: ['mpr_strategi_implementasi x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    Stakeholder: ['mpr_stakeholder x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    Komunikasi: ['mpr_komunikasi x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    Pelatihan: ['mpr_pelatihan x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    Evaluasi: ['mpr_evaluasi x JOIN mpr_implementasi imp ON imp.id = x.implementasi_id JOIN mpr_perubahan p ON p.id = imp.perubahan_id', 'p.created_by'],
    LogPerubahan: ['mpr_log_perubahan x JOIN mpr_perubahan p ON p.id = x.perubahan_id', 'p.created_by'],
    BuktiPelaksanaan: ['mpr_bukti_pelaksanaan x JOIN mpr_log_perubahan l ON l.id = x.log_perubahan_id JOIN mpr_perubahan p ON p.id = l.perubahan_id', 'p.created_by'],
    Persetujuan: ['mpr_persetujuan x JOIN mpr_perubahan p ON p.id = x.perubahan_id', 'p.created_by']
};

const perubahanScope = async (req, res, next, kind, id) => {
    try {
        const actor = await getPerubahanActor(req);
        if (actor.isAdmin) return next();
        if (!isPositiveInteger(actor.instansi_id)) {
            return res.status(403).json({ message: 'Instansi pengguna belum terdaftar.' });
        }
        if (!isPositiveInteger(id)) {
            return res.status(400).json({ message: 'ID data tidak valid.' });
        }
        const [from, owner] = perubahanAccessMap[kind];
        const alias = kind === 'Perencanaan' || kind === 'Perubahan' ? 'p' : 'x';
        const [rows] = await db.query(
            `SELECT 1 AS ada FROM ${from} JOIN users pemilik ON pemilik.id = ${owner} WHERE ${alias}.id = ? AND pemilik.instansi_id = ? LIMIT 1`,
            [Number(id), Number(actor.instansi_id)]
        );
        if (!rows.length) {
            return res.status(404).json({ message: 'Data tidak ditemukan untuk instansi Anda.' });
        }
        return next();
    } catch (error) {
        console.error('perubahanScope error:', error);
        return res.status(error.statusCode || 500).json({ message: error.statusCode ? error.message : 'Gagal memverifikasi akses instansi.' });
    }
};

const scopePerubahanHandler = (name, kind) => {
    const original = exports[name];
    if (typeof original !== 'function') throw new Error(`Handler ${name} tidak ditemukan`);
    exports[name] = (req, res, next) => perubahanScope(req, res, () => original(req, res, next), kind, req.params.id);
};

const scopedParentHandlers = {
    Perencanaan: ['getPerencanaanById', 'updatePerencanaan', 'deletePerencanaan', 'getAnalisisPrioritasByPerencanaan', 'createAnalisisPrioritas'],
    AnalisisPrioritas: ['getAnalisisPrioritasById', 'updateAnalisisPrioritas', 'deleteAnalisisPrioritas'],
    Perubahan: ['getPerubahanById', 'updatePerubahan', 'deletePerubahan', 'getDampakTeknisByPerubahan', 'createDampakTeknis', 'getPersetujuanAnalisisTeknis', 'approveAnalisisTeknis', 'rejectAnalisisTeknis', 'getAnalisisOrganisasiByPerubahan', 'createAnalisisOrganisasi', 'getPersetujuanAnalisisOrganisasi', 'approveAnalisisOrganisasi', 'rejectAnalisisOrganisasi', 'getImplementasiByPerubahan', 'createImplementasi', 'getLogPerubahanByPerubahan', 'createLogPerubahan', 'getPersetujuanPelaksanaan', 'approvePelaksanaan', 'rejectPelaksanaan'],
    DampakTeknis: ['getDampakTeknisById', 'updateDampakTeknis', 'deleteDampakTeknis'],
    AnalisisOrganisasi: ['getAnalisisOrganisasiById', 'updateAnalisisOrganisasi', 'deleteAnalisisOrganisasi'],
    Implementasi: ['getImplementasiById', 'updateImplementasi', 'deleteImplementasi', 'getSumberDayaByImplementasi', 'createSumberDaya', 'getAnggaranByImplementasi', 'createAnggaran', 'getIndikatorKeberhasilanByImplementasi', 'createIndikatorKeberhasilan', 'getStrategiImplementasiByImplementasi', 'createStrategiImplementasi', 'getStakeholderByImplementasi', 'createStakeholder', 'getKomunikasiByImplementasi', 'createKomunikasi', 'getPelatihanByImplementasi', 'createPelatihan', 'getEvaluasiByImplementasi', 'createEvaluasi'],
    SumberDaya: ['updateSumberDaya', 'deleteSumberDaya'],
    Anggaran: ['updateAnggaran', 'deleteAnggaran'],
    IndikatorKeberhasilan: ['updateIndikatorKeberhasilan', 'deleteIndikatorKeberhasilan'],
    StrategiImplementasi: ['getStrategiImplementasiById', 'updateStrategiImplementasi', 'deleteStrategiImplementasi'],
    Stakeholder: ['getStakeholderById', 'updateStakeholder', 'deleteStakeholder'],
    Komunikasi: ['getKomunikasiById', 'updateKomunikasi', 'deleteKomunikasi'],
    Pelatihan: ['getPelatihanById', 'updatePelatihan', 'deletePelatihan'],
    Evaluasi: ['getEvaluasiById', 'updateEvaluasi', 'deleteEvaluasi'],
    LogPerubahan: ['getLogPerubahanById', 'updateLogPerubahan', 'deleteLogPerubahan', 'getBuktiPelaksanaanByLogbook', 'createBuktiPelaksanaan'],
    BuktiPelaksanaan: ['getBuktiPelaksanaanById', 'updateBuktiPelaksanaan', 'deleteBuktiPelaksanaan']
};

for (const [kind, names] of Object.entries(scopedParentHandlers)) {
    for (const name of names) scopePerubahanHandler(name, kind);
}

const originalCreatePerubahan = exports.createPerubahan;
exports.createPerubahan = async (req, res, next) => {
    return perubahanScope(req, res, () => originalCreatePerubahan(req, res, next), 'Perencanaan', req.body.perencanaan_id);
};
const originalUpdatePerubahan = exports.updatePerubahan;
exports.updatePerubahan = async (req, res, next) => {
    return perubahanScope(req, res, () => {
        perubahanScope(req, res, () => originalUpdatePerubahan(req, res, next), 'Perencanaan', req.body.perencanaan_id);
    }, 'Perubahan', req.params.id);
};
