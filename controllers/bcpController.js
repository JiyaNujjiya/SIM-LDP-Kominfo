const db = require('../config/db');

exports.createBCP = async (req, res) => {
    const { id_risiko, nama_layanan, rto_jam, rpo_jam, strategi, status } = req.body;
    try {
        await db.query(
            'INSERT INTO mkb_bcp (id_risiko, nama_layanan, rto_jam, rpo_jam, strategi, status) VALUES (?, ?, ?, ?, ?, ?)',
            [id_risiko, nama_layanan, rto_jam || 4, rpo_jam || 2, strategi, status || 'Draft']
        );
        res.status(201).json({ message: 'Rencana BCP berhasil dibuat!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllBCP = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT b.*, r.kode_risiko, r.peristiwa_risiko 
            FROM mkb_bcp b 
            LEFT JOIN mr_risiko r ON b.id_risiko = r.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// =====================================================
// HELPER
// =====================================================

const isPositiveInteger = (value) => {
    const number = Number(value);

    return (
        Number.isInteger(number) &&
        number > 0
    );
};

const isNonNegativeIntegerOrNull = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return true;
    }

    const number = Number(value);

    return (
        Number.isInteger(number) &&
        number >= 0
    );
};

const normalizeOptionalText = (value) => {
    if (
        value === undefined ||
        value === null
    ) {
        return null;
    }

    if (typeof value !== 'string') {
        return value;
    }

    const trimmed = value.trim();

    return trimmed === ''
        ? null
        : trimmed;
};


// =====================================================
// PROSES 2 - BUSINESS IMPACT ANALYSIS (BIA)
// =====================================================

const biaSelectQuery = `
    SELECT
        b.id,
        b.layanan_prioritas_id,

        lp.kode_prioritas,
        lp.alasan_prioritas,
        lp.membutuhkan_mkb,
        lp.pic_id,
        lp.target_penyusunan,
        lp.status AS status_layanan_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,
        ld.deskripsi AS deskripsi_layanan,
        ld.jenis_layanan,

        b.dampak_operasional,
        b.ketergantungan_pengguna,
        b.solusi_alternatif,
        b.ketergantungan_antar_sistem,
        b.tingkat_kritikalitas,
        b.mekanisme_keberlangsungan,
        b.mtpd,
        b.rto,
        b.rpo,
        b.mbco,

        b.created_at,
        b.updated_at

    FROM mkb_bia b

    JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;


const validateBiaInput = (
    body,
    {
        requireLayananPrioritas = false
    } = {}
) => {
    const {
        layanan_prioritas_id,
        dampak_operasional,
        ketergantungan_pengguna,
        solusi_alternatif,
        ketergantungan_antar_sistem,
        tingkat_kritikalitas,
        mekanisme_keberlangsungan,
        mtpd,
        rto,
        rpo,
        mbco
    } = body;

    if (
        requireLayananPrioritas &&
        !isPositiveInteger(layanan_prioritas_id)
    ) {
        return {
            valid: false,
            message:
                'layanan_prioritas_id wajib berupa ID yang valid.'
        };
    }

    const textFields = [
        ['dampak_operasional', dampak_operasional],
        ['ketergantungan_pengguna', ketergantungan_pengguna],
        ['solusi_alternatif', solusi_alternatif],
        [
            'ketergantungan_antar_sistem',
            ketergantungan_antar_sistem
        ],
        ['tingkat_kritikalitas', tingkat_kritikalitas],
        ['mbco', mbco]
    ];

    for (const [fieldName, value] of textFields) {
        if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'string'
        ) {
            return {
                valid: false,
                message:
                    `${fieldName} harus berupa teks.`
            };
        }
    }

    if (
        typeof tingkat_kritikalitas === 'string' &&
        tingkat_kritikalitas.trim().length > 50
    ) {
        return {
            valid: false,
            message:
                'tingkat_kritikalitas maksimal 50 karakter.'
        };
    }

    if (
        mekanisme_keberlangsungan !== undefined &&
        mekanisme_keberlangsungan !== null &&
        mekanisme_keberlangsungan !== '' &&
        !['BCP', 'DRP'].includes(
            mekanisme_keberlangsungan
        )
    ) {
        return {
            valid: false,
            message:
                'mekanisme_keberlangsungan harus BCP atau DRP.'
        };
    }

    if (!isNonNegativeIntegerOrNull(mtpd)) {
        return {
            valid: false,
            message:
                'mtpd harus berupa bilangan bulat 0 atau lebih.'
        };
    }

    if (!isNonNegativeIntegerOrNull(rto)) {
        return {
            valid: false,
            message:
                'rto harus berupa bilangan bulat 0 atau lebih.'
        };
    }

    if (!isNonNegativeIntegerOrNull(rpo)) {
        return {
            valid: false,
            message:
                'rpo harus berupa bilangan bulat 0 atau lebih.'
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET ALL BIA
// GET /api/keberlangsungan/bia
// =====================================================

exports.getAllBia = async (req, res) => {
    try {
        const [rows] = await db.query(
            `
            ${biaSelectQuery}
            ORDER BY b.id DESC
            `
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getAllBia error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data BIA.'
        });
    }
};


// =====================================================
// GET BIA BY ID
// GET /api/keberlangsungan/bia/:id
// =====================================================

exports.getBiaById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID BIA tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${biaSelectQuery}
            WHERE b.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data BIA tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getBiaById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail BIA.'
        });
    }
};


// =====================================================
// GET BIA BY LAYANAN PRIORITAS
// GET /api/keberlangsungan/layanan-prioritas/:id/bia
// =====================================================

exports.getBiaByLayananPrioritas = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan prioritas tidak valid.'
        });
    }

    try {
        const [layananRows] = await db.query(
            `
            SELECT id
            FROM layanan_prioritas
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (layananRows.length === 0) {
            return res.status(404).json({
                message:
                    'Layanan prioritas tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${biaSelectQuery}
            WHERE b.layanan_prioritas_id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data:
                rows.length > 0
                    ? rows[0]
                    : null
        });
    } catch (error) {
        console.error(
            'getBiaByLayananPrioritas error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil BIA layanan prioritas.'
        });
    }
};


// =====================================================
// CREATE BIA
// POST /api/keberlangsungan/bia
// =====================================================

exports.createBia = async (req, res) => {
    const {
        layanan_prioritas_id,
        dampak_operasional,
        ketergantungan_pengguna,
        solusi_alternatif,
        ketergantungan_antar_sistem,
        tingkat_kritikalitas,
        mekanisme_keberlangsungan,
        mtpd,
        rto,
        rpo,
        mbco
    } = req.body;

    const validation = validateBiaInput(
        req.body,
        {
            requireLayananPrioritas: true
        }
    );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        // Pastikan layanan prioritas tersedia
        const [layananRows] = await db.query(
            `
            SELECT
                id,
                layanan_id,
                kode_prioritas,
                membutuhkan_mkb,
                status
            FROM layanan_prioritas
            WHERE id = ?
            LIMIT 1
            `,
            [Number(layanan_prioritas_id)]
        );

        if (layananRows.length === 0) {
            return res.status(404).json({
                message:
                    'Layanan prioritas tidak ditemukan.'
            });
        }

        // Satu layanan prioritas hanya memiliki satu BIA
        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mkb_bia
            WHERE layanan_prioritas_id = ?
            LIMIT 1
            `,
            [Number(layanan_prioritas_id)]
        );

        if (existingRows.length > 0) {
            return res.status(409).json({
                message:
                    'BIA untuk layanan prioritas tersebut sudah tersedia.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mkb_bia (
                layanan_prioritas_id,
                dampak_operasional,
                ketergantungan_pengguna,
                solusi_alternatif,
                ketergantungan_antar_sistem,
                tingkat_kritikalitas,
                mekanisme_keberlangsungan,
                mtpd,
                rto,
                rpo,
                mbco
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(layanan_prioritas_id),

                normalizeOptionalText(
                    dampak_operasional
                ),

                normalizeOptionalText(
                    ketergantungan_pengguna
                ),

                normalizeOptionalText(
                    solusi_alternatif
                ),

                normalizeOptionalText(
                    ketergantungan_antar_sistem
                ),

                normalizeOptionalText(
                    tingkat_kritikalitas
                ),

                mekanisme_keberlangsungan === ''
                    ? null
                    : mekanisme_keberlangsungan ?? null,

                mtpd === undefined ||
                mtpd === null ||
                mtpd === ''
                    ? null
                    : Number(mtpd),

                rto === undefined ||
                rto === null ||
                rto === ''
                    ? null
                    : Number(rto),

                rpo === undefined ||
                rpo === null ||
                rpo === ''
                    ? null
                    : Number(rpo),

                normalizeOptionalText(
                    mbco
                )
            ]
        );

        const [rows] = await db.query(
            `
            ${biaSelectQuery}
            WHERE b.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Business Impact Analysis berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createBia error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'BIA untuk layanan prioritas tersebut sudah tersedia.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan BIA.'
        });
    }
};


// =====================================================
// UPDATE BIA
// PUT /api/keberlangsungan/bia/:id
// =====================================================

exports.updateBia = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID BIA tidak valid.'
        });
    }

    // Relasi layanan_prioritas_id tidak diubah dari endpoint update.
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'layanan_prioritas_id'
        )
    ) {
        return res.status(400).json({
            message:
                'layanan_prioritas_id tidak dapat diubah melalui pembaruan BIA.'
        });
    }

    const validation = validateBiaInput(
        req.body
    );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_bia
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data BIA tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        const dampakOperasionalBaru =
            req.body.dampak_operasional !== undefined
                ? normalizeOptionalText(
                    req.body.dampak_operasional
                )
                : existing.dampak_operasional;

        const ketergantunganPenggunaBaru =
            req.body.ketergantungan_pengguna !== undefined
                ? normalizeOptionalText(
                    req.body.ketergantungan_pengguna
                )
                : existing.ketergantungan_pengguna;

        const solusiAlternatifBaru =
            req.body.solusi_alternatif !== undefined
                ? normalizeOptionalText(
                    req.body.solusi_alternatif
                )
                : existing.solusi_alternatif;

        const ketergantunganAntarSistemBaru =
            req.body.ketergantungan_antar_sistem !== undefined
                ? normalizeOptionalText(
                    req.body.ketergantungan_antar_sistem
                )
                : existing.ketergantungan_antar_sistem;

        const tingkatKritikalitasBaru =
            req.body.tingkat_kritikalitas !== undefined
                ? normalizeOptionalText(
                    req.body.tingkat_kritikalitas
                )
                : existing.tingkat_kritikalitas;

        const mekanismeBaru =
            req.body.mekanisme_keberlangsungan !== undefined
                ? (
                    req.body.mekanisme_keberlangsungan === '' ||
                    req.body.mekanisme_keberlangsungan === null
                        ? null
                        : req.body.mekanisme_keberlangsungan
                )
                : existing.mekanisme_keberlangsungan;

        const mtpdBaru =
            req.body.mtpd !== undefined
                ? (
                    req.body.mtpd === '' ||
                    req.body.mtpd === null
                        ? null
                        : Number(req.body.mtpd)
                )
                : existing.mtpd;

        const rtoBaru =
            req.body.rto !== undefined
                ? (
                    req.body.rto === '' ||
                    req.body.rto === null
                        ? null
                        : Number(req.body.rto)
                )
                : existing.rto;

        const rpoBaru =
            req.body.rpo !== undefined
                ? (
                    req.body.rpo === '' ||
                    req.body.rpo === null
                        ? null
                        : Number(req.body.rpo)
                )
                : existing.rpo;

        const mbcoBaru =
            req.body.mbco !== undefined
                ? normalizeOptionalText(
                    req.body.mbco
                )
                : existing.mbco;

        await db.query(
            `
            UPDATE mkb_bia
            SET
                dampak_operasional = ?,
                ketergantungan_pengguna = ?,
                solusi_alternatif = ?,
                ketergantungan_antar_sistem = ?,
                tingkat_kritikalitas = ?,
                mekanisme_keberlangsungan = ?,
                mtpd = ?,
                rto = ?,
                rpo = ?,
                mbco = ?
            WHERE id = ?
            `,
            [
                dampakOperasionalBaru,
                ketergantunganPenggunaBaru,
                solusiAlternatifBaru,
                ketergantunganAntarSistemBaru,
                tingkatKritikalitasBaru,
                mekanismeBaru,
                mtpdBaru,
                rtoBaru,
                rpoBaru,
                mbcoBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${biaSelectQuery}
            WHERE b.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Business Impact Analysis berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateBia error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui BIA.'
        });
    }
};


// =====================================================
// DELETE BIA
// DELETE /api/keberlangsungan/bia/:id
// =====================================================

exports.deleteBia = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID BIA tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_bia
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data BIA tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Business Impact Analysis berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteBia error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus BIA.'
        });
    }
};

// =====================================================
// PROSES 2 - BIA
// FORM 10 - DAFTAR INSIDEN / GANGGUAN POTENSIAL
// =====================================================

const insidenSelectQuery = `
    SELECT
        i.id,
        i.bia_id,
        i.nama_insiden,
        i.jenis_kejadian,
        i.kategori_dampak,
        i.deskripsi,
        i.created_at,
        i.updated_at,

        b.layanan_prioritas_id,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan

    FROM mkb_insiden i

    JOIN mkb_bia b
        ON b.id = i.bia_id

    JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;


const validateInsidenInput = (
    body,
    {
        requireNamaInsiden = false
    } = {}
) => {
    const {
        nama_insiden,
        jenis_kejadian,
        kategori_dampak,
        deskripsi
    } = body;

    if (
        requireNamaInsiden &&
        (
            typeof nama_insiden !== 'string' ||
            nama_insiden.trim() === ''
        )
    ) {
        return {
            valid: false,
            message:
                'nama_insiden wajib diisi.'
        };
    }

    if (
        nama_insiden !== undefined &&
        nama_insiden !== null &&
        typeof nama_insiden !== 'string'
    ) {
        return {
            valid: false,
            message:
                'nama_insiden harus berupa teks.'
        };
    }

    if (
        typeof nama_insiden === 'string' &&
        nama_insiden.trim().length > 200
    ) {
        return {
            valid: false,
            message:
                'nama_insiden maksimal 200 karakter.'
        };
    }

    if (
        jenis_kejadian !== undefined &&
        jenis_kejadian !== null &&
        typeof jenis_kejadian !== 'string'
    ) {
        return {
            valid: false,
            message:
                'jenis_kejadian harus berupa teks.'
        };
    }

    if (
        typeof jenis_kejadian === 'string' &&
        jenis_kejadian.trim().length > 100
    ) {
        return {
            valid: false,
            message:
                'jenis_kejadian maksimal 100 karakter.'
        };
    }

    if (
        kategori_dampak !== undefined &&
        kategori_dampak !== null &&
        kategori_dampak !== '' &&
        ![
            'Tinggi',
            'Menengah',
            'Rendah'
        ].includes(kategori_dampak)
    ) {
        return {
            valid: false,
            message:
                'kategori_dampak harus Tinggi, Menengah, atau Rendah.'
        };
    }

    if (
        deskripsi !== undefined &&
        deskripsi !== null &&
        typeof deskripsi !== 'string'
    ) {
        return {
            valid: false,
            message:
                'deskripsi harus berupa teks.'
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET INSIDEN BERDASARKAN BIA
// GET /api/bcp/bia/:id/insiden
// =====================================================

exports.getInsidenByBia = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID BIA tidak valid.'
        });
    }

    try {
        const [biaRows] = await db.query(
            `
            SELECT id
            FROM mkb_bia
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (biaRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data BIA tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${insidenSelectQuery}
            WHERE i.bia_id = ?
            ORDER BY i.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getInsidenByBia error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data insiden.'
        });
    }
};


// =====================================================
// GET DETAIL INSIDEN
// GET /api/bcp/insiden/:id
// =====================================================

exports.getInsidenById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${insidenSelectQuery}
            WHERE i.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getInsidenById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail insiden.'
        });
    }
};


// =====================================================
// CREATE INSIDEN
// POST /api/bcp/bia/:id/insiden
// =====================================================

exports.createInsiden = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID BIA tidak valid.'
        });
    }

    const validation =
        validateInsidenInput(
            req.body,
            {
                requireNamaInsiden: true
            }
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const {
        nama_insiden,
        jenis_kejadian,
        kategori_dampak,
        deskripsi
    } = req.body;

    try {
        const [biaRows] = await db.query(
            `
            SELECT id
            FROM mkb_bia
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (biaRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data BIA tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mkb_insiden (
                bia_id,
                nama_insiden,
                jenis_kejadian,
                kategori_dampak,
                deskripsi
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                nama_insiden.trim(),
                normalizeOptionalText(
                    jenis_kejadian
                ),
                kategori_dampak === ''
                    ? null
                    : kategori_dampak ?? null,
                normalizeOptionalText(
                    deskripsi
                )
            ]
        );

        const [rows] = await db.query(
            `
            ${insidenSelectQuery}
            WHERE i.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Insiden/gangguan potensial berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan insiden.'
        });
    }
};


// =====================================================
// UPDATE INSIDEN
// PUT /api/bcp/insiden/:id
// =====================================================

exports.updateInsiden = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'bia_id'
        )
    ) {
        return res.status(400).json({
            message:
                'bia_id tidak dapat diubah melalui pembaruan insiden.'
        });
    }

    const validation =
        validateInsidenInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        const namaInsidenBaru =
            req.body.nama_insiden !== undefined
                ? req.body.nama_insiden.trim()
                : existing.nama_insiden;

        if (namaInsidenBaru === '') {
            return res.status(400).json({
                message:
                    'nama_insiden tidak boleh kosong.'
            });
        }

        const jenisKejadianBaru =
            req.body.jenis_kejadian !== undefined
                ? normalizeOptionalText(
                    req.body.jenis_kejadian
                )
                : existing.jenis_kejadian;

        const kategoriDampakBaru =
            req.body.kategori_dampak !== undefined
                ? (
                    req.body.kategori_dampak === '' ||
                    req.body.kategori_dampak === null
                        ? null
                        : req.body.kategori_dampak
                )
                : existing.kategori_dampak;

        const deskripsiBaru =
            req.body.deskripsi !== undefined
                ? normalizeOptionalText(
                    req.body.deskripsi
                )
                : existing.deskripsi;

        await db.query(
            `
            UPDATE mkb_insiden
            SET
                nama_insiden = ?,
                jenis_kejadian = ?,
                kategori_dampak = ?,
                deskripsi = ?
            WHERE id = ?
            `,
            [
                namaInsidenBaru,
                jenisKejadianBaru,
                kategoriDampakBaru,
                deskripsiBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${insidenSelectQuery}
            WHERE i.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Insiden/gangguan potensial berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui insiden.'
        });
    }
};


// =====================================================
// DELETE INSIDEN
// DELETE /api/bcp/insiden/:id
// =====================================================

exports.deleteInsiden = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_insiden
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Insiden/gangguan potensial berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus insiden.'
        });
    }
};

// =====================================================
// PROSES 2 - BIA
// FORM 10 - MODUL TERKAIT
// =====================================================

const insidenModulSelectQuery = `
    SELECT
        im.id,
        im.insiden_id,
        im.module_id,
        im.keterangan_dampak,
        im.created_at,

        i.nama_insiden,
        i.jenis_kejadian,
        i.kategori_dampak,

        m.kode_modul,
        m.nama_modul,
        m.deskripsi AS deskripsi_modul,
        m.aktif AS modul_aktif

    FROM mkb_insiden_modul im

    JOIN mkb_insiden i
        ON i.id = im.insiden_id

    JOIN modules m
        ON m.id = im.module_id
`;


// =====================================================
// GET MODUL TERKAIT BERDASARKAN INSIDEN
// GET /api/bcp/insiden/:id/modul
// =====================================================

exports.getModulByInsiden = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID insiden tidak valid.'
        });
    }

    try {
        const [insidenRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (insidenRows.length === 0) {
            return res.status(404).json({
                message: 'Data insiden tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${insidenModulSelectQuery}
            WHERE im.insiden_id = ?
            ORDER BY im.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getModulByInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil modul terkait.'
        });
    }
};


// =====================================================
// GET DETAIL MODUL TERKAIT
// GET /api/bcp/insiden-modul/:id
// =====================================================

exports.getInsidenModulById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID modul terkait tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${insidenModulSelectQuery}
            WHERE im.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data modul terkait tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getInsidenModulById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail modul terkait.'
        });
    }
};


// =====================================================
// CREATE MODUL TERKAIT
// POST /api/bcp/insiden/:id/modul
// =====================================================

exports.createModulInsiden = async (req, res) => {
    const { id } = req.params;
    const {
        module_id,
        keterangan_dampak
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }

    if (!isPositiveInteger(module_id)) {
        return res.status(400).json({
            message:
                'module_id wajib berupa ID yang valid.'
        });
    }

    if (
        keterangan_dampak !== undefined &&
        keterangan_dampak !== null &&
        typeof keterangan_dampak !== 'string'
    ) {
        return res.status(400).json({
            message:
                'keterangan_dampak harus berupa teks.'
        });
    }

    try {
        const [insidenRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (insidenRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        const [moduleRows] = await db.query(
            `
            SELECT
                id,
                kode_modul,
                nama_modul,
                aktif
            FROM modules
            WHERE id = ?
            LIMIT 1
            `,
            [Number(module_id)]
        );

        if (moduleRows.length === 0) {
            return res.status(404).json({
                message:
                    'Modul tidak ditemukan.'
            });
        }

        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden_modul
            WHERE insiden_id = ?
              AND module_id = ?
            LIMIT 1
            `,
            [
                Number(id),
                Number(module_id)
            ]
        );

        if (existingRows.length > 0) {
            return res.status(409).json({
                message:
                    'Modul tersebut sudah terdaftar pada insiden ini.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mkb_insiden_modul (
                insiden_id,
                module_id,
                keterangan_dampak
            )
            VALUES (?, ?, ?)
            `,
            [
                Number(id),
                Number(module_id),
                normalizeOptionalText(
                    keterangan_dampak
                )
            ]
        );

        const [rows] = await db.query(
            `
            ${insidenModulSelectQuery}
            WHERE im.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Modul terkait berhasil ditambahkan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createModulInsiden error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Modul tersebut sudah terdaftar pada insiden ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menambahkan modul terkait.'
        });
    }
};


// =====================================================
// UPDATE MODUL TERKAIT
// PUT /api/bcp/insiden-modul/:id
// =====================================================

exports.updateModulInsiden = async (req, res) => {
    const { id } = req.params;
    const {
        module_id,
        keterangan_dampak
    } = req.body;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID modul terkait tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'insiden_id'
        )
    ) {
        return res.status(400).json({
            message:
                'insiden_id tidak dapat diubah melalui pembaruan modul terkait.'
        });
    }

    if (
        module_id !== undefined &&
        !isPositiveInteger(module_id)
    ) {
        return res.status(400).json({
            message:
                'module_id harus berupa ID yang valid.'
        });
    }

    if (
        keterangan_dampak !== undefined &&
        keterangan_dampak !== null &&
        typeof keterangan_dampak !== 'string'
    ) {
        return res.status(400).json({
            message:
                'keterangan_dampak harus berupa teks.'
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_insiden_modul
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data modul terkait tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        const moduleIdBaru =
            module_id !== undefined
                ? Number(module_id)
                : existing.module_id;

        if (module_id !== undefined) {
            const [moduleRows] = await db.query(
                `
                SELECT id
                FROM modules
                WHERE id = ?
                LIMIT 1
                `,
                [moduleIdBaru]
            );

            if (moduleRows.length === 0) {
                return res.status(404).json({
                    message:
                        'Modul tidak ditemukan.'
                });
            }
        }

        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden_modul
            WHERE insiden_id = ?
              AND module_id = ?
              AND id <> ?
            LIMIT 1
            `,
            [
                existing.insiden_id,
                moduleIdBaru,
                Number(id)
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message:
                    'Modul tersebut sudah terdaftar pada insiden ini.'
            });
        }

        const keteranganBaru =
            keterangan_dampak !== undefined
                ? normalizeOptionalText(
                    keterangan_dampak
                )
                : existing.keterangan_dampak;

        await db.query(
            `
            UPDATE mkb_insiden_modul
            SET
                module_id = ?,
                keterangan_dampak = ?
            WHERE id = ?
            `,
            [
                moduleIdBaru,
                keteranganBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${insidenModulSelectQuery}
            WHERE im.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Modul terkait berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateModulInsiden error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Modul tersebut sudah terdaftar pada insiden ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui modul terkait.'
        });
    }
};


// =====================================================
// DELETE MODUL TERKAIT
// DELETE /api/bcp/insiden-modul/:id
// =====================================================

exports.deleteModulInsiden = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID modul terkait tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_insiden_modul
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data modul terkait tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Modul terkait berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteModulInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus modul terkait.'
        });
    }
};

// =====================================================
// PROSES 2 - BIA
// FORM 10 - PETA KETERGANTUNGAN
// =====================================================

const ketergantunganSelectQuery = `
    SELECT
        k.id,
        k.bia_id,
        k.jenis_ketergantungan,
        k.nama_ketergantungan,
        k.deskripsi,
        k.tingkat_ketergantungan,
        k.created_at,
        k.updated_at,

        b.layanan_prioritas_id,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan

    FROM mkb_ketergantungan k

    JOIN mkb_bia b
        ON b.id = k.bia_id

    JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;


const validateKetergantunganInput = (
    body,
    {
        requireJenis = false,
        requireNama = false
    } = {}
) => {
    const {
        jenis_ketergantungan,
        nama_ketergantungan,
        deskripsi,
        tingkat_ketergantungan
    } = body;

    if (
        requireJenis &&
        (
            typeof jenis_ketergantungan !== 'string' ||
            jenis_ketergantungan.trim() === ''
        )
    ) {
        return {
            valid: false,
            message: 'jenis_ketergantungan wajib diisi.'
        };
    }

    if (
        requireNama &&
        (
            typeof nama_ketergantungan !== 'string' ||
            nama_ketergantungan.trim() === ''
        )
    ) {
        return {
            valid: false,
            message: 'nama_ketergantungan wajib diisi.'
        };
    }

    if (
        jenis_ketergantungan !== undefined &&
        jenis_ketergantungan !== null &&
        typeof jenis_ketergantungan !== 'string'
    ) {
        return {
            valid: false,
            message:
                'jenis_ketergantungan harus berupa teks.'
        };
    }

    if (
        typeof jenis_ketergantungan === 'string' &&
        jenis_ketergantungan.trim().length > 100
    ) {
        return {
            valid: false,
            message:
                'jenis_ketergantungan maksimal 100 karakter.'
        };
    }

    if (
        nama_ketergantungan !== undefined &&
        nama_ketergantungan !== null &&
        typeof nama_ketergantungan !== 'string'
    ) {
        return {
            valid: false,
            message:
                'nama_ketergantungan harus berupa teks.'
        };
    }

    if (
        typeof nama_ketergantungan === 'string' &&
        nama_ketergantungan.trim().length > 200
    ) {
        return {
            valid: false,
            message:
                'nama_ketergantungan maksimal 200 karakter.'
        };
    }

    if (
        deskripsi !== undefined &&
        deskripsi !== null &&
        typeof deskripsi !== 'string'
    ) {
        return {
            valid: false,
            message:
                'deskripsi harus berupa teks.'
        };
    }

    if (
        tingkat_ketergantungan !== undefined &&
        tingkat_ketergantungan !== null &&
        tingkat_ketergantungan !== '' &&
        ![
            'Tinggi',
            'Menengah',
            'Rendah'
        ].includes(tingkat_ketergantungan)
    ) {
        return {
            valid: false,
            message:
                'tingkat_ketergantungan harus Tinggi, Menengah, atau Rendah.'
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET KETERGANTUNGAN BERDASARKAN BIA
// GET /api/bcp/bia/:id/ketergantungan
// =====================================================

exports.getKetergantunganByBia = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID BIA tidak valid.'
        });
    }

    try {
        const [biaRows] = await db.query(
            `
            SELECT id
            FROM mkb_bia
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (biaRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data BIA tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${ketergantunganSelectQuery}
            WHERE k.bia_id = ?
            ORDER BY k.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getKetergantunganByBia error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data ketergantungan.'
        });
    }
};


// =====================================================
// GET DETAIL KETERGANTUNGAN
// GET /api/bcp/ketergantungan/:id
// =====================================================

exports.getKetergantunganById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID ketergantungan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${ketergantunganSelectQuery}
            WHERE k.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data ketergantungan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getKetergantunganById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail ketergantungan.'
        });
    }
};


// =====================================================
// CREATE KETERGANTUNGAN
// POST /api/bcp/bia/:id/ketergantungan
// =====================================================

exports.createKetergantungan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID BIA tidak valid.'
        });
    }

    const validation =
        validateKetergantunganInput(
            req.body,
            {
                requireJenis: true,
                requireNama: true
            }
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const {
        jenis_ketergantungan,
        nama_ketergantungan,
        deskripsi,
        tingkat_ketergantungan
    } = req.body;

    try {
        const [biaRows] = await db.query(
            `
            SELECT id
            FROM mkb_bia
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (biaRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data BIA tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mkb_ketergantungan (
                bia_id,
                jenis_ketergantungan,
                nama_ketergantungan,
                deskripsi,
                tingkat_ketergantungan
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                jenis_ketergantungan.trim(),
                nama_ketergantungan.trim(),
                normalizeOptionalText(
                    deskripsi
                ),
                tingkat_ketergantungan === ''
                    ? null
                    : tingkat_ketergantungan ?? null
            ]
        );

        const [rows] = await db.query(
            `
            ${ketergantunganSelectQuery}
            WHERE k.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Data ketergantungan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createKetergantungan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data ketergantungan.'
        });
    }
};


// =====================================================
// UPDATE KETERGANTUNGAN
// PUT /api/bcp/ketergantungan/:id
// =====================================================

exports.updateKetergantungan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID ketergantungan tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'bia_id'
        )
    ) {
        return res.status(400).json({
            message:
                'bia_id tidak dapat diubah melalui pembaruan ketergantungan.'
        });
    }

    const validation =
        validateKetergantunganInput(
            req.body
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_ketergantungan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data ketergantungan tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        const jenisBaru =
            req.body.jenis_ketergantungan !== undefined
                ? req.body.jenis_ketergantungan.trim()
                : existing.jenis_ketergantungan;

        const namaBaru =
            req.body.nama_ketergantungan !== undefined
                ? req.body.nama_ketergantungan.trim()
                : existing.nama_ketergantungan;

        if (jenisBaru === '') {
            return res.status(400).json({
                message:
                    'jenis_ketergantungan tidak boleh kosong.'
            });
        }

        if (namaBaru === '') {
            return res.status(400).json({
                message:
                    'nama_ketergantungan tidak boleh kosong.'
            });
        }

        const deskripsiBaru =
            req.body.deskripsi !== undefined
                ? normalizeOptionalText(
                    req.body.deskripsi
                )
                : existing.deskripsi;

        const tingkatBaru =
            req.body.tingkat_ketergantungan !== undefined
                ? (
                    req.body.tingkat_ketergantungan === '' ||
                    req.body.tingkat_ketergantungan === null
                        ? null
                        : req.body.tingkat_ketergantungan
                )
                : existing.tingkat_ketergantungan;

        await db.query(
            `
            UPDATE mkb_ketergantungan
            SET
                jenis_ketergantungan = ?,
                nama_ketergantungan = ?,
                deskripsi = ?,
                tingkat_ketergantungan = ?
            WHERE id = ?
            `,
            [
                jenisBaru,
                namaBaru,
                deskripsiBaru,
                tingkatBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${ketergantunganSelectQuery}
            WHERE k.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Data ketergantungan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateKetergantungan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data ketergantungan.'
        });
    }
};


// =====================================================
// DELETE KETERGANTUNGAN
// DELETE /api/bcp/ketergantungan/:id
// =====================================================

exports.deleteKetergantungan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID ketergantungan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_ketergantungan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data ketergantungan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Data ketergantungan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteKetergantungan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus data ketergantungan.'
        });
    }
};

// =====================================================
// PROSES 3 - STRATEGI KEBERLANGSUNGAN BISNIS (BCS)
// FORM 11 - STRATEGI / SKENARIO PEMULIHAN
// =====================================================

const strategiPemulihanSelectQuery = `
    SELECT
        s.id,
        s.insiden_id,
        s.nomor_skenario,
        s.kategori,
        s.metode_pemulihan,
        s.deskripsi_strategi,
        s.created_at,
        s.updated_at,

        i.bia_id,
        i.nama_insiden,
        i.jenis_kejadian,
        i.kategori_dampak,

        b.layanan_prioritas_id,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan

    FROM mkb_strategi_pemulihan s

    JOIN mkb_insiden i
        ON i.id = s.insiden_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;


const validateStrategiPemulihanInput = (
    body,
    {
        requireNomorSkenario = false,
        requireKategori = false,
        requireMetode = false
    } = {}
) => {
    const {
        nomor_skenario,
        kategori,
        metode_pemulihan,
        deskripsi_strategi
    } = body;

    if (
        requireNomorSkenario &&
        ![1, 2, 3].includes(Number(nomor_skenario))
    ) {
        return {
            valid: false,
            message:
                'nomor_skenario wajib bernilai 1, 2, atau 3.'
        };
    }

    if (
        nomor_skenario !== undefined &&
        ![1, 2, 3].includes(Number(nomor_skenario))
    ) {
        return {
            valid: false,
            message:
                'nomor_skenario harus bernilai 1, 2, atau 3.'
        };
    }

    if (
        requireKategori &&
        !['BCP', 'DRP'].includes(kategori)
    ) {
        return {
            valid: false,
            message:
                'kategori wajib berupa BCP atau DRP.'
        };
    }

    if (
        kategori !== undefined &&
        !['BCP', 'DRP'].includes(kategori)
    ) {
        return {
            valid: false,
            message:
                'kategori harus berupa BCP atau DRP.'
        };
    }

    if (
        requireMetode &&
        (
            typeof metode_pemulihan !== 'string' ||
            metode_pemulihan.trim() === ''
        )
    ) {
        return {
            valid: false,
            message:
                'metode_pemulihan wajib diisi.'
        };
    }

    if (
        metode_pemulihan !== undefined &&
        metode_pemulihan !== null &&
        typeof metode_pemulihan !== 'string'
    ) {
        return {
            valid: false,
            message:
                'metode_pemulihan harus berupa teks.'
        };
    }

    if (
        typeof metode_pemulihan === 'string' &&
        metode_pemulihan.trim().length > 100
    ) {
        return {
            valid: false,
            message:
                'metode_pemulihan maksimal 100 karakter.'
        };
    }

    if (
        deskripsi_strategi !== undefined &&
        deskripsi_strategi !== null &&
        typeof deskripsi_strategi !== 'string'
    ) {
        return {
            valid: false,
            message:
                'deskripsi_strategi harus berupa teks.'
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET STRATEGI BERDASARKAN INSIDEN
// GET /api/bcp/insiden/:id/strategi
// =====================================================

exports.getStrategiByInsiden = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message: 'ID insiden tidak valid.'
        });
    }

    try {
        const [insidenRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (insidenRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${strategiPemulihanSelectQuery}
            WHERE s.insiden_id = ?
            ORDER BY s.nomor_skenario ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getStrategiByInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil strategi pemulihan.'
        });
    }
};


// =====================================================
// GET DETAIL STRATEGI
// GET /api/bcp/strategi/:id
// =====================================================

exports.getStrategiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID strategi tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${strategiPemulihanSelectQuery}
            WHERE s.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data strategi pemulihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getStrategiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail strategi pemulihan.'
        });
    }
};


// =====================================================
// CREATE STRATEGI
// POST /api/bcp/insiden/:id/strategi
// =====================================================

exports.createStrategiPemulihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }

    const validation =
        validateStrategiPemulihanInput(
            req.body,
            {
                requireNomorSkenario: true,
                requireKategori: true,
                requireMetode: true
            }
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const {
        nomor_skenario,
        kategori,
        metode_pemulihan,
        deskripsi_strategi
    } = req.body;

    try {
        const [insidenRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (insidenRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        const [existingRows] = await db.query(
            `
            SELECT id
            FROM mkb_strategi_pemulihan
            WHERE insiden_id = ?
              AND nomor_skenario = ?
            LIMIT 1
            `,
            [
                Number(id),
                Number(nomor_skenario)
            ]
        );

        if (existingRows.length > 0) {
            return res.status(409).json({
                message:
                    `Skenario ${Number(nomor_skenario)} sudah tersedia untuk insiden ini.`
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mkb_strategi_pemulihan (
                insiden_id,
                nomor_skenario,
                kategori,
                metode_pemulihan,
                deskripsi_strategi
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                Number(nomor_skenario),
                kategori,
                metode_pemulihan.trim(),
                normalizeOptionalText(
                    deskripsi_strategi
                )
            ]
        );

        const [rows] = await db.query(
            `
            ${strategiPemulihanSelectQuery}
            WHERE s.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Strategi pemulihan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createStrategiPemulihan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Nomor skenario tersebut sudah tersedia untuk insiden ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan strategi pemulihan.'
        });
    }
};


// =====================================================
// UPDATE STRATEGI
// PUT /api/bcp/strategi/:id
// =====================================================

exports.updateStrategiPemulihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID strategi tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'insiden_id'
        )
    ) {
        return res.status(400).json({
            message:
                'insiden_id tidak dapat diubah melalui pembaruan strategi.'
        });
    }

    const validation =
        validateStrategiPemulihanInput(
            req.body
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_strategi_pemulihan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data strategi pemulihan tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        const nomorSkenarioBaru =
            req.body.nomor_skenario !== undefined
                ? Number(req.body.nomor_skenario)
                : existing.nomor_skenario;

        const kategoriBaru =
            req.body.kategori !== undefined
                ? req.body.kategori
                : existing.kategori;

        const metodeBaru =
            req.body.metode_pemulihan !== undefined
                ? req.body.metode_pemulihan.trim()
                : existing.metode_pemulihan;

        if (metodeBaru === '') {
            return res.status(400).json({
                message:
                    'metode_pemulihan tidak boleh kosong.'
            });
        }

        const deskripsiBaru =
            req.body.deskripsi_strategi !== undefined
                ? normalizeOptionalText(
                    req.body.deskripsi_strategi
                )
                : existing.deskripsi_strategi;

        const [duplicateRows] = await db.query(
            `
            SELECT id
            FROM mkb_strategi_pemulihan
            WHERE insiden_id = ?
              AND nomor_skenario = ?
              AND id <> ?
            LIMIT 1
            `,
            [
                existing.insiden_id,
                nomorSkenarioBaru,
                Number(id)
            ]
        );

        if (duplicateRows.length > 0) {
            return res.status(409).json({
                message:
                    `Skenario ${nomorSkenarioBaru} sudah tersedia untuk insiden ini.`
            });
        }

        await db.query(
            `
            UPDATE mkb_strategi_pemulihan
            SET
                nomor_skenario = ?,
                kategori = ?,
                metode_pemulihan = ?,
                deskripsi_strategi = ?
            WHERE id = ?
            `,
            [
                nomorSkenarioBaru,
                kategoriBaru,
                metodeBaru,
                deskripsiBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${strategiPemulihanSelectQuery}
            WHERE s.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Strategi pemulihan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateStrategiPemulihan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Nomor skenario tersebut sudah tersedia untuk insiden ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui strategi pemulihan.'
        });
    }
};


// =====================================================
// DELETE STRATEGI
// DELETE /api/bcp/strategi/:id
// =====================================================

exports.deleteStrategiPemulihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID strategi tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_strategi_pemulihan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data strategi pemulihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Strategi pemulihan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteStrategiPemulihan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus strategi pemulihan.'
        });
    }
};

// =====================================================
// PROSES 3 - STRATEGI KEBERLANGSUNGAN BISNIS (BCS)
// FORM 11 - LANGKAH PEMULIHAN
// =====================================================

const langkahPemulihanSelectQuery = `
    SELECT
        l.id,
        l.strategi_id,
        l.urutan,
        l.nama_langkah,
        l.deskripsi,
        l.created_at,
        l.updated_at,

        s.insiden_id,
        s.nomor_skenario,
        s.kategori,
        s.metode_pemulihan,

        i.bia_id,
        i.nama_insiden,
        i.jenis_kejadian,

        b.layanan_prioritas_id,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan

    FROM mkb_langkah_pemulihan l

    JOIN mkb_strategi_pemulihan s
        ON s.id = l.strategi_id

    JOIN mkb_insiden i
        ON i.id = s.insiden_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;


const validateLangkahPemulihanInput = (
    body,
    {
        requireUrutan = false,
        requireNamaLangkah = false
    } = {}
) => {
    const {
        urutan,
        nama_langkah,
        deskripsi
    } = body;

    // -----------------------------
    // VALIDASI URUTAN
    // -----------------------------
    if (
        requireUrutan &&
        (
            urutan === undefined ||
            urutan === null ||
            urutan === '' ||
            !Number.isInteger(Number(urutan)) ||
            Number(urutan) <= 0
        )
    ) {
        return {
            valid: false,
            message:
                'urutan wajib berupa bilangan bulat lebih dari 0.'
        };
    }

    if (
        urutan !== undefined &&
        (
            urutan === null ||
            urutan === '' ||
            !Number.isInteger(Number(urutan)) ||
            Number(urutan) <= 0
        )
    ) {
        return {
            valid: false,
            message:
                'urutan harus berupa bilangan bulat lebih dari 0.'
        };
    }

    // -----------------------------
    // VALIDASI NAMA LANGKAH
    // -----------------------------
    if (
        requireNamaLangkah &&
        (
            typeof nama_langkah !== 'string' ||
            nama_langkah.trim() === ''
        )
    ) {
        return {
            valid: false,
            message:
                'nama_langkah wajib diisi.'
        };
    }

    if (
        nama_langkah !== undefined &&
        (
            typeof nama_langkah !== 'string' ||
            nama_langkah.trim() === ''
        )
    ) {
        return {
            valid: false,
            message:
                'nama_langkah tidak boleh kosong.'
        };
    }

    if (
        typeof nama_langkah === 'string' &&
        nama_langkah.trim().length > 200
    ) {
        return {
            valid: false,
            message:
                'nama_langkah maksimal 200 karakter.'
        };
    }

    // -----------------------------
    // VALIDASI DESKRIPSI
    // -----------------------------
    if (
        deskripsi !== undefined &&
        deskripsi !== null &&
        typeof deskripsi !== 'string'
    ) {
        return {
            valid: false,
            message:
                'deskripsi harus berupa teks.'
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET LANGKAH BERDASARKAN STRATEGI
// GET /api/bcp/strategi/:id/langkah
// =====================================================

exports.getLangkahByStrategi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID strategi tidak valid.'
        });
    }

    try {
        const [strategiRows] = await db.query(
            `
            SELECT id
            FROM mkb_strategi_pemulihan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (strategiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data strategi pemulihan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${langkahPemulihanSelectQuery}
            WHERE l.strategi_id = ?
            ORDER BY l.urutan ASC, l.id ASC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getLangkahByStrategi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil langkah pemulihan.'
        });
    }
};


// =====================================================
// GET DETAIL LANGKAH PEMULIHAN
// GET /api/bcp/langkah-pemulihan/:id
// =====================================================

exports.getLangkahPemulihanById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID langkah pemulihan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${langkahPemulihanSelectQuery}
            WHERE l.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data langkah pemulihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getLangkahPemulihanById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail langkah pemulihan.'
        });
    }
};


// =====================================================
// CREATE LANGKAH PEMULIHAN
// POST /api/bcp/strategi/:id/langkah
// =====================================================

exports.createLangkahPemulihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID strategi tidak valid.'
        });
    }

    const validation =
        validateLangkahPemulihanInput(
            req.body,
            {
                requireUrutan: true,
                requireNamaLangkah: true
            }
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const {
        urutan,
        nama_langkah,
        deskripsi
    } = req.body;

    try {
        // Pastikan parent strategi tersedia
        const [strategiRows] = await db.query(
            `
            SELECT id
            FROM mkb_strategi_pemulihan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (strategiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data strategi pemulihan tidak ditemukan.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mkb_langkah_pemulihan (
                strategi_id,
                urutan,
                nama_langkah,
                deskripsi
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                Number(id),
                Number(urutan),
                nama_langkah.trim(),
                normalizeOptionalText(deskripsi)
            ]
        );

        const [rows] = await db.query(
            `
            ${langkahPemulihanSelectQuery}
            WHERE l.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Langkah pemulihan berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createLangkahPemulihan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan langkah pemulihan.'
        });
    }
};


// =====================================================
// UPDATE LANGKAH PEMULIHAN
// PUT /api/bcp/langkah-pemulihan/:id
// =====================================================

exports.updateLangkahPemulihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID langkah pemulihan tidak valid.'
        });
    }

    // Parent tidak boleh dipindahkan lewat update
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'strategi_id'
        )
    ) {
        return res.status(400).json({
            message:
                'strategi_id tidak dapat diubah melalui pembaruan langkah pemulihan.'
        });
    }

    const validation =
        validateLangkahPemulihanInput(
            req.body
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_langkah_pemulihan
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data langkah pemulihan tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        const urutanBaru =
            req.body.urutan !== undefined
                ? Number(req.body.urutan)
                : existing.urutan;

        const namaLangkahBaru =
            req.body.nama_langkah !== undefined
                ? req.body.nama_langkah.trim()
                : existing.nama_langkah;

        const deskripsiBaru =
            req.body.deskripsi !== undefined
                ? normalizeOptionalText(
                    req.body.deskripsi
                )
                : existing.deskripsi;

        await db.query(
            `
            UPDATE mkb_langkah_pemulihan
            SET
                urutan = ?,
                nama_langkah = ?,
                deskripsi = ?
            WHERE id = ?
            `,
            [
                urutanBaru,
                namaLangkahBaru,
                deskripsiBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${langkahPemulihanSelectQuery}
            WHERE l.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Langkah pemulihan berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateLangkahPemulihan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui langkah pemulihan.'
        });
    }
};


// =====================================================
// DELETE LANGKAH PEMULIHAN
// DELETE /api/bcp/langkah-pemulihan/:id
// =====================================================

exports.deleteLangkahPemulihan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID langkah pemulihan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_langkah_pemulihan
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data langkah pemulihan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Langkah pemulihan berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteLangkahPemulihan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus langkah pemulihan.'
        });
    }
};

// =====================================================
// PROSES 4 - UJI COBA & EVALUASI
// FORM 12 - UJI COBA KEBERLANGSUNGAN
// =====================================================

const ujiSelectQuery = `
    SELECT
        u.id,
        u.insiden_id,
        u.strategi_id,
        u.jenis_kejadian,
        u.tujuan_uji,
        u.jenis_uji,
        u.tanggal_uji,
        u.kriteria_keberhasilan,
        u.judul_skenario,
        u.target_rto,
        u.created_by,
        u.created_at,
        u.updated_at,

        i.bia_id,
        i.nama_insiden,
        i.kategori_dampak,

        s.nomor_skenario,
        s.kategori AS kategori_strategi,
        s.metode_pemulihan,

        b.layanan_prioritas_id,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan

    FROM mkb_uji u

    JOIN mkb_insiden i
        ON i.id = u.insiden_id

    LEFT JOIN mkb_strategi_pemulihan s
        ON s.id = u.strategi_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;


const isValidDateString = (value) => {
    if (typeof value !== 'string') {
        return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] =
        value.split('-').map(Number);

    const date = new Date(
        Date.UTC(year, month - 1, day)
    );

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
};


const validateUjiInput = (
    body,
    {
        requireJudul = false
    } = {}
) => {
    const {
        strategi_id,
        jenis_kejadian,
        tujuan_uji,
        jenis_uji,
        tanggal_uji,
        kriteria_keberhasilan,
        judul_skenario,
        target_rto
    } = body;

    // strategi_id boleh null karena DB memang nullable
    if (
        strategi_id !== undefined &&
        strategi_id !== null &&
        strategi_id !== '' &&
        !isPositiveInteger(strategi_id)
    ) {
        return {
            valid: false,
            message:
                'strategi_id harus berupa ID yang valid atau null.'
        };
    }

    if (
        jenis_kejadian !== undefined &&
        jenis_kejadian !== null &&
        typeof jenis_kejadian !== 'string'
    ) {
        return {
            valid: false,
            message:
                'jenis_kejadian harus berupa teks.'
        };
    }

    if (
        typeof jenis_kejadian === 'string' &&
        jenis_kejadian.trim().length > 100
    ) {
        return {
            valid: false,
            message:
                'jenis_kejadian maksimal 100 karakter.'
        };
    }

    if (
        tujuan_uji !== undefined &&
        tujuan_uji !== null &&
        typeof tujuan_uji !== 'string'
    ) {
        return {
            valid: false,
            message:
                'tujuan_uji harus berupa teks.'
        };
    }

    if (
        jenis_uji !== undefined &&
        jenis_uji !== null &&
        typeof jenis_uji !== 'string'
    ) {
        return {
            valid: false,
            message:
                'jenis_uji harus berupa teks.'
        };
    }

    if (
        typeof jenis_uji === 'string' &&
        jenis_uji.trim().length > 100
    ) {
        return {
            valid: false,
            message:
                'jenis_uji maksimal 100 karakter.'
        };
    }

    if (
        tanggal_uji !== undefined &&
        tanggal_uji !== null &&
        tanggal_uji !== '' &&
        !isValidDateString(tanggal_uji)
    ) {
        return {
            valid: false,
            message:
                'tanggal_uji harus menggunakan format YYYY-MM-DD yang valid.'
        };
    }

    if (
        kriteria_keberhasilan !== undefined &&
        kriteria_keberhasilan !== null &&
        typeof kriteria_keberhasilan !== 'string'
    ) {
        return {
            valid: false,
            message:
                'kriteria_keberhasilan harus berupa teks.'
        };
    }

    if (
        requireJudul &&
        (
            typeof judul_skenario !== 'string' ||
            judul_skenario.trim() === ''
        )
    ) {
        return {
            valid: false,
            message:
                'judul_skenario wajib diisi.'
        };
    }

    if (
        judul_skenario !== undefined &&
        (
            typeof judul_skenario !== 'string' ||
            judul_skenario.trim() === ''
        )
    ) {
        return {
            valid: false,
            message:
                'judul_skenario tidak boleh kosong.'
        };
    }

    if (
        typeof judul_skenario === 'string' &&
        judul_skenario.trim().length > 200
    ) {
        return {
            valid: false,
            message:
                'judul_skenario maksimal 200 karakter.'
        };
    }

    if (
        target_rto !== undefined &&
        target_rto !== null &&
        target_rto !== '' &&
        !isNonNegativeIntegerOrNull(target_rto)
    ) {
        return {
            valid: false,
            message:
                'target_rto harus berupa bilangan bulat 0 atau lebih.'
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET UJI BERDASARKAN INSIDEN
// GET /api/bcp/insiden/:id/uji
// =====================================================

exports.getUjiByInsiden = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }

    try {
        const [insidenRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (insidenRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${ujiSelectQuery}
            WHERE u.insiden_id = ?
            ORDER BY u.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getUjiByInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data uji.'
        });
    }
};


// =====================================================
// GET DETAIL UJI
// GET /api/bcp/uji/:id
// =====================================================

exports.getUjiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID uji tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${ujiSelectQuery}
            WHERE u.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data uji tidak ditemukan.'
            });
        }

        return res.status(200).json({
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'getUjiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil detail uji.'
        });
    }
};


// =====================================================
// CREATE UJI
// POST /api/bcp/insiden/:id/uji
// =====================================================

exports.createUji = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }

    // created_by tidak boleh berasal dari frontend
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim melalui request body.'
        });
    }

    const validation =
        validateUjiInput(
            req.body,
            {
                requireJudul: true
            }
        );

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const {
        strategi_id,
        jenis_kejadian,
        tujuan_uji,
        jenis_uji,
        tanggal_uji,
        kriteria_keberhasilan,
        judul_skenario,
        target_rto
    } = req.body;

    try {
        // Pastikan insiden tersedia
        const [insidenRows] = await db.query(
            `
            SELECT id
            FROM mkb_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (insidenRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data insiden tidak ditemukan.'
            });
        }

        let strategiIdValue = null;

        if (
            strategi_id !== undefined &&
            strategi_id !== null &&
            strategi_id !== ''
        ) {
            strategiIdValue =
                Number(strategi_id);

            // Strategi harus milik insiden yang sama
            const [strategiRows] =
                await db.query(
                    `
                    SELECT id
                    FROM mkb_strategi_pemulihan
                    WHERE id = ?
                      AND insiden_id = ?
                    LIMIT 1
                    `,
                    [
                        strategiIdValue,
                        Number(id)
                    ]
                );

            if (strategiRows.length === 0) {
                return res.status(400).json({
                    message:
                        'strategi_id tidak ditemukan atau tidak terkait dengan insiden ini.'
                });
            }
        }

        const createdBy = req.user.id;

        const [result] = await db.query(
            `
            INSERT INTO mkb_uji (
                insiden_id,
                strategi_id,
                jenis_kejadian,
                tujuan_uji,
                jenis_uji,
                tanggal_uji,
                kriteria_keberhasilan,
                judul_skenario,
                target_rto,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                strategiIdValue,
                normalizeOptionalText(
                    jenis_kejadian
                ),
                normalizeOptionalText(
                    tujuan_uji
                ),
                normalizeOptionalText(
                    jenis_uji
                ),
                tanggal_uji || null,
                normalizeOptionalText(
                    kriteria_keberhasilan
                ),
                judul_skenario.trim(),
                target_rto === undefined ||
                target_rto === null ||
                target_rto === ''
                    ? null
                    : Number(target_rto),
                createdBy
            ]
        );

        const [rows] = await db.query(
            `
            ${ujiSelectQuery}
            WHERE u.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Data uji coba berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createUji error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data uji coba.'
        });
    }
};


// =====================================================
// UPDATE UJI
// PUT /api/bcp/uji/:id
// =====================================================

exports.updateUji = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID uji tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'insiden_id'
        )
    ) {
        return res.status(400).json({
            message:
                'insiden_id tidak dapat diubah melalui pembaruan uji.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak dapat diubah melalui pembaruan uji.'
        });
    }

    const validation =
        validateUjiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_uji
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data uji tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        let strategiBaru =
            existing.strategi_id;

        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                'strategi_id'
            )
        ) {
            if (
                req.body.strategi_id === null ||
                req.body.strategi_id === ''
            ) {
                strategiBaru = null;
            } else {
                strategiBaru =
                    Number(req.body.strategi_id);

                const [strategiRows] =
                    await db.query(
                        `
                        SELECT id
                        FROM mkb_strategi_pemulihan
                        WHERE id = ?
                          AND insiden_id = ?
                        LIMIT 1
                        `,
                        [
                            strategiBaru,
                            existing.insiden_id
                        ]
                    );

                if (
                    strategiRows.length === 0
                ) {
                    return res.status(400).json({
                        message:
                            'strategi_id tidak ditemukan atau tidak terkait dengan insiden uji ini.'
                    });
                }
            }
        }

        const jenisKejadianBaru =
            req.body.jenis_kejadian !== undefined
                ? normalizeOptionalText(
                    req.body.jenis_kejadian
                )
                : existing.jenis_kejadian;

        const tujuanUjiBaru =
            req.body.tujuan_uji !== undefined
                ? normalizeOptionalText(
                    req.body.tujuan_uji
                )
                : existing.tujuan_uji;

        const jenisUjiBaru =
            req.body.jenis_uji !== undefined
                ? normalizeOptionalText(
                    req.body.jenis_uji
                )
                : existing.jenis_uji;

        const tanggalUjiBaru =
            req.body.tanggal_uji !== undefined
                ? (
                    req.body.tanggal_uji === ''
                        ? null
                        : req.body.tanggal_uji
                )
                : existing.tanggal_uji;

        const kriteriaBaru =
            req.body.kriteria_keberhasilan !== undefined
                ? normalizeOptionalText(
                    req.body.kriteria_keberhasilan
                )
                : existing.kriteria_keberhasilan;

        const judulBaru =
            req.body.judul_skenario !== undefined
                ? req.body.judul_skenario.trim()
                : existing.judul_skenario;

        const targetRtoBaru =
            req.body.target_rto !== undefined
                ? (
                    req.body.target_rto === null ||
                    req.body.target_rto === ''
                        ? null
                        : Number(
                            req.body.target_rto
                        )
                )
                : existing.target_rto;

        await db.query(
            `
            UPDATE mkb_uji
            SET
                strategi_id = ?,
                jenis_kejadian = ?,
                tujuan_uji = ?,
                jenis_uji = ?,
                tanggal_uji = ?,
                kriteria_keberhasilan = ?,
                judul_skenario = ?,
                target_rto = ?
            WHERE id = ?
            `,
            [
                strategiBaru,
                jenisKejadianBaru,
                tujuanUjiBaru,
                jenisUjiBaru,
                tanggalUjiBaru,
                kriteriaBaru,
                judulBaru,
                targetRtoBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${ujiSelectQuery}
            WHERE u.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Data uji coba berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateUji error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data uji coba.'
        });
    }
};


// =====================================================
// DELETE UJI
// DELETE /api/bcp/uji/:id
// =====================================================

exports.deleteUji = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID uji tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_uji
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data uji tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Data uji coba berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteUji error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus data uji coba.'
        });
    }
};

// =====================================================
// PROSES 4 - UJI COBA & EVALUASI
// FORM 13 - EVALUASI & PEMBELAJARAN
// =====================================================

const evaluasiSelectQuery = `
    SELECT
        e.id,
        e.uji_id,
        e.hasil_uji,
        e.pembelajaran,
        e.kendala,
        e.rekomendasi_perbaikan,
        e.jenis_perbaikan,
        e.penanggung_jawab_id,
        e.target_waktu,
        e.status,
        e.catatan,
        e.created_at,
        e.updated_at,

        u.insiden_id,
        u.strategi_id,
        u.jenis_uji,
        u.tanggal_uji,
        u.judul_skenario,
        u.target_rto,

        i.bia_id,
        i.nama_insiden,

        b.layanan_prioritas_id,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan

    FROM mkb_evaluasi e

    JOIN mkb_uji u
        ON u.id = e.uji_id

    JOIN mkb_insiden i
        ON i.id = u.insiden_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
`;


const validateEvaluasiInput = (body) => {
    const {
        hasil_uji,
        pembelajaran,
        kendala,
        rekomendasi_perbaikan,
        jenis_perbaikan,
        penanggung_jawab_id,
        target_waktu,
        status,
        catatan
    } = body;

    const textFields = [
        ['hasil_uji', hasil_uji],
        ['pembelajaran', pembelajaran],
        ['kendala', kendala],
        ['rekomendasi_perbaikan', rekomendasi_perbaikan],
        ['catatan', catatan]
    ];

    for (const [field, value] of textFields) {
        if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'string'
        ) {
            return {
                valid: false,
                message: `${field} harus berupa teks.`
            };
        }
    }

    if (
        jenis_perbaikan !== undefined &&
        jenis_perbaikan !== null &&
        typeof jenis_perbaikan !== 'string'
    ) {
        return {
            valid: false,
            message:
                'jenis_perbaikan harus berupa teks.'
        };
    }

    if (
        typeof jenis_perbaikan === 'string' &&
        jenis_perbaikan.trim().length > 100
    ) {
        return {
            valid: false,
            message:
                'jenis_perbaikan maksimal 100 karakter.'
        };
    }

    if (
        penanggung_jawab_id !== undefined &&
        penanggung_jawab_id !== null &&
        penanggung_jawab_id !== '' &&
        !isPositiveInteger(penanggung_jawab_id)
    ) {
        return {
            valid: false,
            message:
                'penanggung_jawab_id harus berupa ID yang valid atau null.'
        };
    }

    if (
        target_waktu !== undefined &&
        target_waktu !== null &&
        target_waktu !== '' &&
        !isValidDateString(target_waktu)
    ) {
        return {
            valid: false,
            message:
                'target_waktu harus menggunakan format YYYY-MM-DD yang valid.'
        };
    }

    const allowedStatus = [
        'Belum Dimulai',
        'Dalam Proses',
        'Selesai',
        'Ditunda'
    ];

    if (
        status !== undefined &&
        status !== null &&
        !allowedStatus.includes(status)
    ) {
        return {
            valid: false,
            message:
                'status harus berupa Belum Dimulai, Dalam Proses, Selesai, atau Ditunda.'
        };
    }

    return {
        valid: true
    };
};


// =====================================================
// GET EVALUASI BERDASARKAN UJI
// GET /api/bcp/uji/:id/evaluasi
// =====================================================

exports.getEvaluasiByUji = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID uji tidak valid.'
        });
    }

    try {
        const [ujiRows] = await db.query(
            `
            SELECT id
            FROM mkb_uji
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (ujiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data uji tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE e.uji_id = ?
            ORDER BY e.id DESC
            `,
            [Number(id)]
        );

        return res.status(200).json({
            data: rows
        });
    } catch (error) {
        console.error(
            'getEvaluasiByUji error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data evaluasi.'
        });
    }
};


// =====================================================
// GET DETAIL EVALUASI
// GET /api/bcp/evaluasi/:id
// =====================================================

exports.getEvaluasiById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE e.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Data evaluasi tidak ditemukan.'
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
                'Terjadi kesalahan saat mengambil detail evaluasi.'
        });
    }
};


// =====================================================
// CREATE EVALUASI
// POST /api/bcp/uji/:id/evaluasi
// =====================================================

exports.createEvaluasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID uji tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'uji_id'
        )
    ) {
        return res.status(400).json({
            message:
                'uji_id tidak perlu dikirim melalui request body.'
        });
    }

    const validation =
        validateEvaluasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    const {
        hasil_uji,
        pembelajaran,
        kendala,
        rekomendasi_perbaikan,
        jenis_perbaikan,
        penanggung_jawab_id,
        target_waktu,
        status,
        catatan
    } = req.body;

    try {
        const [ujiRows] = await db.query(
            `
            SELECT id
            FROM mkb_uji
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (ujiRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data uji tidak ditemukan.'
            });
        }

        let penanggungJawabId = null;

        if (
            penanggung_jawab_id !== undefined &&
            penanggung_jawab_id !== null &&
            penanggung_jawab_id !== ''
        ) {
            penanggungJawabId =
                Number(penanggung_jawab_id);

            const [userRows] = await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [penanggungJawabId]
            );

            if (userRows.length === 0) {
                return res.status(400).json({
                    message:
                        'penanggung_jawab_id tidak ditemukan.'
                });
            }
        }

        const [result] = await db.query(
            `
            INSERT INTO mkb_evaluasi (
                uji_id,
                hasil_uji,
                pembelajaran,
                kendala,
                rekomendasi_perbaikan,
                jenis_perbaikan,
                penanggung_jawab_id,
                target_waktu,
                status,
                catatan
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(id),
                normalizeOptionalText(hasil_uji),
                normalizeOptionalText(pembelajaran),
                normalizeOptionalText(kendala),
                normalizeOptionalText(
                    rekomendasi_perbaikan
                ),
                normalizeOptionalText(
                    jenis_perbaikan
                ),
                penanggungJawabId,
                target_waktu || null,
                status || 'Belum Dimulai',
                normalizeOptionalText(catatan)
            ]
        );

        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE e.id = ?
            LIMIT 1
            `,
            [result.insertId]
        );

        return res.status(201).json({
            message:
                'Data evaluasi berhasil disimpan.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'createEvaluasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menyimpan data evaluasi.'
        });
    }
};


// =====================================================
// UPDATE EVALUASI
// PUT /api/bcp/evaluasi/:id
// =====================================================

exports.updateEvaluasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'uji_id'
        )
    ) {
        return res.status(400).json({
            message:
                'uji_id tidak dapat diubah melalui pembaruan evaluasi.'
        });
    }

    const validation =
        validateEvaluasiInput(req.body);

    if (!validation.valid) {
        return res.status(400).json({
            message: validation.message
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mkb_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Data evaluasi tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        let penanggungJawabBaru =
            existing.penanggung_jawab_id;

        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                'penanggung_jawab_id'
            )
        ) {
            if (
                req.body.penanggung_jawab_id === null ||
                req.body.penanggung_jawab_id === ''
            ) {
                penanggungJawabBaru = null;
            } else {
                penanggungJawabBaru =
                    Number(
                        req.body.penanggung_jawab_id
                    );

                const [userRows] = await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [penanggungJawabBaru]
                );

                if (userRows.length === 0) {
                    return res.status(400).json({
                        message:
                            'penanggung_jawab_id tidak ditemukan.'
                    });
                }
            }
        }

        const hasilUjiBaru =
            req.body.hasil_uji !== undefined
                ? normalizeOptionalText(
                    req.body.hasil_uji
                )
                : existing.hasil_uji;

        const pembelajaranBaru =
            req.body.pembelajaran !== undefined
                ? normalizeOptionalText(
                    req.body.pembelajaran
                )
                : existing.pembelajaran;

        const kendalaBaru =
            req.body.kendala !== undefined
                ? normalizeOptionalText(
                    req.body.kendala
                )
                : existing.kendala;

        const rekomendasiBaru =
            req.body.rekomendasi_perbaikan !== undefined
                ? normalizeOptionalText(
                    req.body.rekomendasi_perbaikan
                )
                : existing.rekomendasi_perbaikan;

        const jenisPerbaikanBaru =
            req.body.jenis_perbaikan !== undefined
                ? normalizeOptionalText(
                    req.body.jenis_perbaikan
                )
                : existing.jenis_perbaikan;

        const targetWaktuBaru =
            req.body.target_waktu !== undefined
                ? (
                    req.body.target_waktu === null ||
                    req.body.target_waktu === ''
                        ? null
                        : req.body.target_waktu
                )
                : existing.target_waktu;

        const statusBaru =
            req.body.status !== undefined
                ? req.body.status
                : existing.status;

        const catatanBaru =
            req.body.catatan !== undefined
                ? normalizeOptionalText(
                    req.body.catatan
                )
                : existing.catatan;

        await db.query(
            `
            UPDATE mkb_evaluasi
            SET
                hasil_uji = ?,
                pembelajaran = ?,
                kendala = ?,
                rekomendasi_perbaikan = ?,
                jenis_perbaikan = ?,
                penanggung_jawab_id = ?,
                target_waktu = ?,
                status = ?,
                catatan = ?
            WHERE id = ?
            `,
            [
                hasilUjiBaru,
                pembelajaranBaru,
                kendalaBaru,
                rekomendasiBaru,
                jenisPerbaikanBaru,
                penanggungJawabBaru,
                targetWaktuBaru,
                statusBaru,
                catatanBaru,
                Number(id)
            ]
        );

        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}
            WHERE e.id = ?
            LIMIT 1
            `,
            [Number(id)]
        );

        return res.status(200).json({
            message:
                'Data evaluasi berhasil diperbarui.',
            data: rows[0]
        });
    } catch (error) {
        console.error(
            'updateEvaluasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui data evaluasi.'
        });
    }
};


// =====================================================
// DELETE EVALUASI
// DELETE /api/bcp/evaluasi/:id
// =====================================================

exports.deleteEvaluasi = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mkb_evaluasi
            WHERE id = ?
            `,
            [Number(id)]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Data evaluasi tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Data evaluasi berhasil dihapus.'
        });
    } catch (error) {
        console.error(
            'deleteEvaluasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus data evaluasi.'
        });
    }
};