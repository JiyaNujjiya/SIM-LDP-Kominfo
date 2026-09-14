const db = require('../config/db');


// =====================================================
// HELPERS
// =====================================================

const isNonNegativeNumber = (value) => {
    const number = Number(value);

    return (
        Number.isFinite(number) &&
        number >= 0
    );
};

const isNonNegativeInteger = (value) => {
    const number = Number(value);

    return (
        Number.isInteger(number) &&
        number >= 0
    );
};


const isValidPercentage = (value) => {
    const number = Number(value);

    return (
        Number.isFinite(number) &&
        number >= 0 &&
        number <= 100
    );
};

const isPositiveInteger = (value) => {
    const number = Number(value);

    return (
        Number.isInteger(number) &&
        number > 0
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


const isValidDateString = (value) => {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }

    const date = new Date(
        `${value}T00:00:00Z`
    );

    return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
    );
};

exports.getLayananOptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        kode_layanan,
        nama_layanan,
        jenis_layanan,
        deskripsi
      FROM layanan_digital
      ORDER BY nama_layanan ASC
    `);

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getLayananOptions error:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan saat mengambil daftar layanan.'
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
        role
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

// =====================================================
// COMPATIBILITY / OVERVIEW HELPDESK
// GET /api/relasi-pengguna
// =====================================================

exports.getAllRelasiPengguna = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT
                i.id,
                COALESCE(
                    u.nama,
                    'Pengguna Tidak Diketahui'
                ) AS pelapor,
                l.nama_layanan,
                i.deskripsi_insiden AS deskripsi_masalah,
                i.prioritas,
                i.status AS status_tiket
            FROM mrp_insiden i
            LEFT JOIN users u
                ON u.id = i.pelapor_id
            JOIN layanan_digital l
                ON l.id = i.layanan_id
            ORDER BY
                i.waktu_terdeteksi DESC,
                i.id DESC
        `);

        // Array langsung untuk kompatibilitas
        // dengan RelasiPenggunaPage.tsx existing
        return res
            .status(200)
            .json(rows);

    } catch (error) {
        console.error(
            'getAllRelasiPengguna error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data relasi pengguna.'
        });
    }
};


// =====================================================
// MRP 1A - KATALOG LAYANAN
// =====================================================

const katalogLayananSelectQuery = `
    SELECT
        k.id,
        k.layanan_id,
        l.kode_layanan,
        l.nama_layanan,
        l.deskripsi AS deskripsi_layanan,
        l.jenis_layanan,

        k.kategori_layanan,
        k.tipe_layanan,
        k.target_cakupan_pengguna,

        k.service_owner_id,
        so.nama AS service_owner,

        k.kanal_layanan,
        k.tautan_layanan,
        k.ruang_lingkup_layanan,
        k.stakeholder_terkait,

        k.status,

        k.created_by,
        cb.nama AS dibuat_oleh,

        k.created_at,
        k.updated_at

    FROM mrp_katalog_layanan k

    JOIN layanan_digital l
        ON l.id = k.layanan_id

    LEFT JOIN users so
        ON so.id = k.service_owner_id

    JOIN users cb
        ON cb.id = k.created_by
`;


// =====================================================
// VALIDASI KATALOG LAYANAN
// =====================================================

const validateKatalogLayananInput = (
    body,
    isCreate = true
) => {
    const {
        layanan_id,
        kategori_layanan,
        tipe_layanan,
        target_cakupan_pengguna,
        service_owner_id,
        kanal_layanan,
        tautan_layanan,
        ruang_lingkup_layanan,
        stakeholder_terkait,
        status
    } = body;


    // layanan_id
    if (
        isCreate &&
        !isPositiveInteger(layanan_id)
    ) {
        return (
            'layanan_id wajib berupa ID yang valid.'
        );
    }


    // kategori_layanan
    if (
        kategori_layanan !== undefined &&
        kategori_layanan !== null &&
        typeof kategori_layanan !== 'string'
    ) {
        return (
            'kategori_layanan harus berupa teks.'
        );
    }

    if (
        typeof kategori_layanan === 'string' &&
        kategori_layanan.trim().length > 100
    ) {
        return (
            'kategori_layanan maksimal 100 karakter.'
        );
    }


    // tipe_layanan
    if (
        tipe_layanan !== undefined &&
        tipe_layanan !== null &&
        typeof tipe_layanan !== 'string'
    ) {
        return (
            'tipe_layanan harus berupa teks.'
        );
    }

    if (
        typeof tipe_layanan === 'string' &&
        tipe_layanan.trim().length > 100
    ) {
        return (
            'tipe_layanan maksimal 100 karakter.'
        );
    }


    // target_cakupan_pengguna
    if (
        target_cakupan_pengguna !== undefined &&
        target_cakupan_pengguna !== null &&
        typeof target_cakupan_pengguna !== 'string'
    ) {
        return (
            'target_cakupan_pengguna harus berupa teks.'
        );
    }


    // service_owner_id
    if (
        service_owner_id !== undefined &&
        service_owner_id !== null &&
        service_owner_id !== '' &&
        !isPositiveInteger(service_owner_id)
    ) {
        return (
            'service_owner_id harus berupa ID yang valid.'
        );
    }


    // kanal_layanan
    if (
        kanal_layanan !== undefined &&
        kanal_layanan !== null &&
        typeof kanal_layanan !== 'string'
    ) {
        return (
            'kanal_layanan harus berupa teks.'
        );
    }

    if (
        typeof kanal_layanan === 'string' &&
        kanal_layanan.trim().length > 150
    ) {
        return (
            'kanal_layanan maksimal 150 karakter.'
        );
    }


    // tautan_layanan
    if (
        tautan_layanan !== undefined &&
        tautan_layanan !== null &&
        typeof tautan_layanan !== 'string'
    ) {
        return (
            'tautan_layanan harus berupa teks.'
        );
    }

    if (
        typeof tautan_layanan === 'string' &&
        tautan_layanan.trim().length > 255
    ) {
        return (
            'tautan_layanan maksimal 255 karakter.'
        );
    }


    // ruang_lingkup_layanan
    if (
        ruang_lingkup_layanan !== undefined &&
        ruang_lingkup_layanan !== null &&
        typeof ruang_lingkup_layanan !== 'string'
    ) {
        return (
            'ruang_lingkup_layanan harus berupa teks.'
        );
    }


    // stakeholder_terkait
    if (
        stakeholder_terkait !== undefined &&
        stakeholder_terkait !== null &&
        typeof stakeholder_terkait !== 'string'
    ) {
        return (
            'stakeholder_terkait harus berupa teks.'
        );
    }


    // status
    if (
        status !== undefined &&
        ![
            'Draft',
            'Aktif',
            'Tidak Aktif'
        ].includes(status)
    ) {
        return (
            'status harus Draft, Aktif, atau Tidak Aktif.'
        );
    }


    return null;
};


// =====================================================
// GET ALL KATALOG
// GET /api/relasi-pengguna/katalog-layanan
// =====================================================

exports.getAllKatalogLayanan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${katalogLayananSelectQuery}

            ORDER BY k.id DESC
        `);

        return res
            .status(200)
            .json(rows);

    } catch (error) {
        console.error(
            'getAllKatalogLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil katalog layanan.'
        });
    }
};


// =====================================================
// GET DETAIL KATALOG
// GET /api/relasi-pengguna/katalog-layanan/:id
// =====================================================

exports.getKatalogLayananById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID katalog layanan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${katalogLayananSelectQuery}

            WHERE k.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Katalog layanan tidak ditemukan.'
            });
        }

        return res
            .status(200)
            .json(rows[0]);

    } catch (error) {
        console.error(
            'getKatalogLayananById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil katalog layanan.'
        });
    }
};


// =====================================================
// GET KATALOG BERDASARKAN LAYANAN
// GET /api/relasi-pengguna/layanan/:id/katalog
// =====================================================

exports.getKatalogByLayanan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${katalogLayananSelectQuery}

            WHERE k.layanan_id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Katalog untuk layanan tersebut tidak ditemukan.'
            });
        }

        return res
            .status(200)
            .json(rows[0]);

    } catch (error) {
        console.error(
            'getKatalogByLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil katalog layanan.'
        });
    }
};


// =====================================================
// CREATE KATALOG
// POST /api/relasi-pengguna/katalog-layanan
// =====================================================

exports.createKatalogLayanan = async (
    req,
    res
) => {
    // created_by tidak boleh berasal dari frontend
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validateKatalogLayananInput(
            req.body,
            true
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        layanan_id,
        kategori_layanan,
        tipe_layanan,
        target_cakupan_pengguna,
        service_owner_id,
        kanal_layanan,
        tautan_layanan,
        ruang_lingkup_layanan,
        stakeholder_terkait,
        status
    } = req.body;


    const createdBy = req.user.id;


    try {
        // =============================================
        // CEK LAYANAN
        // =============================================

        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [layanan_id]
        );

        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK SERVICE OWNER
        // =============================================

        if (
            service_owner_id !== undefined &&
            service_owner_id !== null &&
            service_owner_id !== ''
        ) {
            const [owner] = await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [service_owner_id]
            );

            if (owner.length === 0) {
                return res.status(400).json({
                    message:
                        'service_owner_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // CEK DUPLIKAT KATALOG PER LAYANAN
        // =============================================

        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_katalog_layanan
            WHERE layanan_id = ?
            LIMIT 1
            `,
            [layanan_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Layanan tersebut sudah memiliki katalog layanan.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_katalog_layanan (
                layanan_id,
                kategori_layanan,
                tipe_layanan,
                target_cakupan_pengguna,
                service_owner_id,
                kanal_layanan,
                tautan_layanan,
                ruang_lingkup_layanan,
                stakeholder_terkait,
                status,
                created_by
            )
            VALUES (
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?,
                ?
            )
            `,
            [
                Number(layanan_id),

                normalizeOptionalText(
                    kategori_layanan
                ),

                normalizeOptionalText(
                    tipe_layanan
                ),

                normalizeOptionalText(
                    target_cakupan_pengguna
                ),

                (
                    service_owner_id === undefined ||
                    service_owner_id === null ||
                    service_owner_id === ''
                )
                    ? null
                    : Number(service_owner_id),

                normalizeOptionalText(
                    kanal_layanan
                ),

                normalizeOptionalText(
                    tautan_layanan
                ),

                normalizeOptionalText(
                    ruang_lingkup_layanan
                ),

                normalizeOptionalText(
                    stakeholder_terkait
                ),

                status || 'Draft',

                createdBy
            ]
        );


        return res.status(201).json({
            message:
                'Katalog layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createKatalogLayanan error:',
            error
        );


        if (
            error.code === 'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Layanan tersebut sudah memiliki katalog layanan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat katalog layanan.'
        });
    }
};


// =====================================================
// UPDATE KATALOG
// PUT /api/relasi-pengguna/katalog-layanan/:id
// =====================================================

exports.updateKatalogLayanan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID katalog layanan tidak valid.'
        });
    }


    // layanan_id dan created_by tidak boleh diubah
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        ) ||
        Object.prototype.hasOwnProperty.call(
            req.body,
            'layanan_id'
        )
    ) {
        return res.status(400).json({
            message:
                'layanan_id dan created_by tidak boleh diubah.'
        });
    }


    const validationError =
        validateKatalogLayananInput(
            req.body,
            false
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        // =============================================
        // CEK EXISTING
        // =============================================

        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mrp_katalog_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Katalog layanan tidak ditemukan.'
            });
        }


        const existing =
            existingRows[0];


        // =============================================
        // SERVICE OWNER
        // =============================================

        const serviceOwnerId =
            req.body.service_owner_id !== undefined
                ? (
                    req.body.service_owner_id === null ||
                    req.body.service_owner_id === ''
                        ? null
                        : Number(
                            req.body.service_owner_id
                        )
                )
                : existing.service_owner_id;


        if (serviceOwnerId !== null) {
            const [owner] = await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [serviceOwnerId]
            );


            if (owner.length === 0) {
                return res.status(400).json({
                    message:
                        'service_owner_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // HELPER NILAI UPDATE
        // =============================================

        const value = (field) => {
            if (
                req.body[field] !== undefined
            ) {
                return normalizeOptionalText(
                    req.body[field]
                );
            }

            return existing[field];
        };


        // =============================================
        // UPDATE
        // =============================================

        await db.query(
            `
            UPDATE mrp_katalog_layanan
            SET
                kategori_layanan = ?,
                tipe_layanan = ?,
                target_cakupan_pengguna = ?,
                service_owner_id = ?,
                kanal_layanan = ?,
                tautan_layanan = ?,
                ruang_lingkup_layanan = ?,
                stakeholder_terkait = ?,
                status = ?
            WHERE id = ?
            `,
            [
                value(
                    'kategori_layanan'
                ),

                value(
                    'tipe_layanan'
                ),

                value(
                    'target_cakupan_pengguna'
                ),

                serviceOwnerId,

                value(
                    'kanal_layanan'
                ),

                value(
                    'tautan_layanan'
                ),

                value(
                    'ruang_lingkup_layanan'
                ),

                value(
                    'stakeholder_terkait'
                ),

                req.body.status !== undefined
                    ? req.body.status
                    : existing.status,

                id
            ]
        );


        return res.status(200).json({
            message:
                'Katalog layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateKatalogLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui katalog layanan.'
        });
    }
};


// =====================================================
// DELETE KATALOG
// DELETE /api/relasi-pengguna/katalog-layanan/:id
// =====================================================

exports.deleteKatalogLayanan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID katalog layanan tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_katalog_layanan
            WHERE id = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Katalog layanan tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Katalog layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteKatalogLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus katalog layanan.'
        });
    }
};

// =====================================================
// MRP 1A - STANDAR LAYANAN
// =====================================================

const standarLayananSelectQuery = `
    SELECT
        s.id,
        s.katalog_layanan_id,
        s.versi,
        s.berlaku_mulai,
        s.berlaku_sampai,
        s.status,
        s.catatan,
        s.created_by,
        u.nama AS dibuat_oleh,
        s.created_at,
        s.updated_at,

        k.layanan_id,
        l.kode_layanan,
        l.nama_layanan

    FROM mrp_standar_layanan s

    JOIN mrp_katalog_layanan k
        ON k.id = s.katalog_layanan_id

    JOIN layanan_digital l
        ON l.id = k.layanan_id

    JOIN users u
        ON u.id = s.created_by
`;


// GET /api/relasi-pengguna/standar-layanan
exports.getAllStandarLayanan = async (req, res) => {
    try {
        const [rows] = await db.query(`
            ${standarLayananSelectQuery}
            ORDER BY
                s.katalog_layanan_id ASC,
                s.versi DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllStandarLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil standar layanan.'
        });
    }
};


// GET /api/relasi-pengguna/standar-layanan/:id
exports.getStandarLayananById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID standar layanan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${standarLayananSelectQuery}
            WHERE s.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Standar layanan tidak ditemukan.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getStandarLayananById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil standar layanan.'
        });
    }
};


// GET /api/relasi-pengguna/katalog-layanan/:id/standar
exports.getStandarByKatalog = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID katalog layanan tidak valid.'
        });
    }

    try {
        const [katalog] = await db.query(
            `
            SELECT id
            FROM mrp_katalog_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (katalog.length === 0) {
            return res.status(404).json({
                message:
                    'Katalog layanan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${standarLayananSelectQuery}
            WHERE s.katalog_layanan_id = ?
            ORDER BY s.versi DESC
            `,
            [id]
        );

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getStandarByKatalog error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil standar layanan.'
        });
    }
};


// POST /api/relasi-pengguna/standar-layanan
exports.createStandarLayanan = async (req, res) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim dari request.'
        });
    }

    const {
        katalog_layanan_id,
        versi,
        berlaku_mulai,
        berlaku_sampai,
        status,
        catatan
    } = req.body;

    if (!isPositiveInteger(katalog_layanan_id)) {
        return res.status(400).json({
            message:
                'katalog_layanan_id wajib berupa ID yang valid.'
        });
    }

    const versiFinal =
        versi === undefined ? 1 : Number(versi);

    if (!isPositiveInteger(versiFinal)) {
        return res.status(400).json({
            message:
                'versi harus berupa bilangan bulat positif.'
        });
    }

    if (!isValidDateString(berlaku_mulai)) {
        return res.status(400).json({
            message:
                'berlaku_mulai wajib menggunakan format YYYY-MM-DD yang valid.'
        });
    }

    if (
        berlaku_sampai !== undefined &&
        berlaku_sampai !== null &&
        berlaku_sampai !== ''
    ) {
        if (!isValidDateString(berlaku_sampai)) {
            return res.status(400).json({
                message:
                    'berlaku_sampai harus menggunakan format YYYY-MM-DD yang valid.'
            });
        }

        if (berlaku_sampai < berlaku_mulai) {
            return res.status(400).json({
                message:
                    'berlaku_sampai tidak boleh lebih awal dari berlaku_mulai.'
            });
        }
    }

    if (
        status !== undefined &&
        ![
            'Draft',
            'Aktif',
            'Berakhir'
        ].includes(status)
    ) {
        return res.status(400).json({
            message:
                'status harus Draft, Aktif, atau Berakhir.'
        });
    }

    if (
        catatan !== undefined &&
        catatan !== null &&
        typeof catatan !== 'string'
    ) {
        return res.status(400).json({
            message:
                'catatan harus berupa teks.'
        });
    }

    try {
        const [katalog] = await db.query(
            `
            SELECT id
            FROM mrp_katalog_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [katalog_layanan_id]
        );

        if (katalog.length === 0) {
            return res.status(400).json({
                message:
                    'katalog_layanan_id tidak ditemukan.'
            });
        }

        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE
                katalog_layanan_id = ?
                AND versi = ?
            LIMIT 1
            `,
            [
                katalog_layanan_id,
                versiFinal
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Versi standar tersebut sudah tersedia untuk katalog layanan ini.'
            });
        }

        const [result] = await db.query(
            `
            INSERT INTO mrp_standar_layanan (
                katalog_layanan_id,
                versi,
                berlaku_mulai,
                berlaku_sampai,
                status,
                catatan,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(katalog_layanan_id),
                versiFinal,
                berlaku_mulai,
                (
                    berlaku_sampai === undefined ||
                    berlaku_sampai === null ||
                    berlaku_sampai === ''
                )
                    ? null
                    : berlaku_sampai,
                status || 'Draft',
                normalizeOptionalText(catatan),
                req.user.id
            ]
        );

        return res.status(201).json({
            message:
                'Standar layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createStandarLayanan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Versi standar tersebut sudah tersedia untuk katalog layanan ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat standar layanan.'
        });
    }
};


// PUT /api/relasi-pengguna/standar-layanan/:id
exports.updateStandarLayanan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID standar layanan tidak valid.'
        });
    }

    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        ) ||
        Object.prototype.hasOwnProperty.call(
            req.body,
            'katalog_layanan_id'
        ) ||
        Object.prototype.hasOwnProperty.call(
            req.body,
            'versi'
        )
    ) {
        return res.status(400).json({
            message:
                'katalog_layanan_id, versi, dan created_by tidak boleh diubah.'
        });
    }

    const {
        berlaku_mulai,
        berlaku_sampai,
        status,
        catatan
    } = req.body;

    if (
        berlaku_mulai !== undefined &&
        !isValidDateString(berlaku_mulai)
    ) {
        return res.status(400).json({
            message:
                'berlaku_mulai harus menggunakan format YYYY-MM-DD yang valid.'
        });
    }

    if (
        berlaku_sampai !== undefined &&
        berlaku_sampai !== null &&
        berlaku_sampai !== '' &&
        !isValidDateString(berlaku_sampai)
    ) {
        return res.status(400).json({
            message:
                'berlaku_sampai harus menggunakan format YYYY-MM-DD yang valid.'
        });
    }

    if (
        status !== undefined &&
        ![
            'Draft',
            'Aktif',
            'Berakhir'
        ].includes(status)
    ) {
        return res.status(400).json({
            message:
                'status harus Draft, Aktif, atau Berakhir.'
        });
    }

    if (
        catatan !== undefined &&
        catatan !== null &&
        typeof catatan !== 'string'
    ) {
        return res.status(400).json({
            message:
                'catatan harus berupa teks.'
        });
    }

    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Standar layanan tidak ditemukan.'
            });
        }

        const existing = existingRows[0];

        const mulaiFinal =
            berlaku_mulai !== undefined
                ? berlaku_mulai
                : existing.berlaku_mulai;

        let selesaiFinal;

        if (berlaku_sampai !== undefined) {
            selesaiFinal =
                berlaku_sampai === '' ||
                berlaku_sampai === null
                    ? null
                    : berlaku_sampai;
        } else {
            selesaiFinal =
                existing.berlaku_sampai;
        }

        const mulaiDate =
            typeof mulaiFinal === 'string'
                ? mulaiFinal.slice(0, 10)
                : new Date(mulaiFinal)
                    .toISOString()
                    .slice(0, 10);

        const selesaiDate =
            selesaiFinal === null
                ? null
                : (
                    typeof selesaiFinal === 'string'
                        ? selesaiFinal.slice(0, 10)
                        : new Date(selesaiFinal)
                            .toISOString()
                            .slice(0, 10)
                );

        if (
            selesaiDate !== null &&
            selesaiDate < mulaiDate
        ) {
            return res.status(400).json({
                message:
                    'berlaku_sampai tidak boleh lebih awal dari berlaku_mulai.'
            });
        }

        await db.query(
            `
            UPDATE mrp_standar_layanan
            SET
                berlaku_mulai = ?,
                berlaku_sampai = ?,
                status = ?,
                catatan = ?
            WHERE id = ?
            `,
            [
                mulaiDate,
                selesaiDate,
                status !== undefined
                    ? status
                    : existing.status,
                catatan !== undefined
                    ? normalizeOptionalText(catatan)
                    : existing.catatan,
                id
            ]
        );

        return res.status(200).json({
            message:
                'Standar layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateStandarLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui standar layanan.'
        });
    }
};


// DELETE /api/relasi-pengguna/standar-layanan/:id
exports.deleteStandarLayanan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID standar layanan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_standar_layanan
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Standar layanan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Standar layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteStandarLayanan error:',
            error
        );

        if (
            error.code ===
            'ER_ROW_IS_REFERENCED_2'
        ) {
            return res.status(409).json({
                message:
                    'Standar layanan masih digunakan oleh data lain dan tidak dapat dihapus.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus standar layanan.'
        });
    }
};

// =====================================================
// MRP 1A - SLA LAYANAN
// =====================================================

const slaLayananSelectQuery = `
    SELECT
        sla.id,
        sla.standar_layanan_id,
        sla.jam_layanan,
        sla.jam_service_desk,
        sla.target_waktu_respon_menit,
        sla.target_waktu_penyelesaian_menit,
        sla.target_ketersediaan_persen,
        sla.created_at,
        sla.updated_at,

        s.katalog_layanan_id,
        s.versi AS versi_standar,
        s.status AS status_standar,

        k.layanan_id,
        l.kode_layanan,
        l.nama_layanan

    FROM mrp_sla_layanan sla

    JOIN mrp_standar_layanan s
        ON s.id = sla.standar_layanan_id

    JOIN mrp_katalog_layanan k
        ON k.id = s.katalog_layanan_id

    JOIN layanan_digital l
        ON l.id = k.layanan_id
`;


// =====================================================
// VALIDASI SLA
// =====================================================

const validateSlaLayananInput = (
    body,
    isCreate = true
) => {
    const {
        standar_layanan_id,
        jam_layanan,
        jam_service_desk,
        target_waktu_respon_menit,
        target_waktu_penyelesaian_menit,
        target_ketersediaan_persen
    } = body;


    if (
        isCreate &&
        !isPositiveInteger(standar_layanan_id)
    ) {
        return (
            'standar_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        jam_layanan !== undefined &&
        jam_layanan !== null &&
        typeof jam_layanan !== 'string'
    ) {
        return 'jam_layanan harus berupa teks.';
    }

    if (
        typeof jam_layanan === 'string' &&
        jam_layanan.trim().length > 100
    ) {
        return 'jam_layanan maksimal 100 karakter.';
    }


    if (
        jam_service_desk !== undefined &&
        jam_service_desk !== null &&
        typeof jam_service_desk !== 'string'
    ) {
        return 'jam_service_desk harus berupa teks.';
    }

    if (
        typeof jam_service_desk === 'string' &&
        jam_service_desk.trim().length > 100
    ) {
        return (
            'jam_service_desk maksimal 100 karakter.'
        );
    }


    if (
        target_waktu_respon_menit !== undefined &&
        target_waktu_respon_menit !== null &&
        target_waktu_respon_menit !== '' &&
        !isNonNegativeInteger(
            target_waktu_respon_menit
        )
    ) {
        return (
            'target_waktu_respon_menit harus berupa bilangan bulat 0 atau lebih.'
        );
    }


    if (
        target_waktu_penyelesaian_menit !== undefined &&
        target_waktu_penyelesaian_menit !== null &&
        target_waktu_penyelesaian_menit !== '' &&
        !isNonNegativeInteger(
            target_waktu_penyelesaian_menit
        )
    ) {
        return (
            'target_waktu_penyelesaian_menit harus berupa bilangan bulat 0 atau lebih.'
        );
    }


    if (
        target_ketersediaan_persen !== undefined &&
        target_ketersediaan_persen !== null &&
        target_ketersediaan_persen !== '' &&
        !isValidPercentage(
            target_ketersediaan_persen
        )
    ) {
        return (
            'target_ketersediaan_persen harus berada pada rentang 0 sampai 100.'
        );
    }


    return null;
};


// =====================================================
// GET ALL SLA
// GET /api/relasi-pengguna/sla-layanan
// =====================================================

exports.getAllSlaLayanan = async (req, res) => {
    try {
        const [rows] = await db.query(`
            ${slaLayananSelectQuery}
            ORDER BY sla.id DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllSlaLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil SLA layanan.'
        });
    }
};


// =====================================================
// GET DETAIL SLA
// GET /api/relasi-pengguna/sla-layanan/:id
// =====================================================

exports.getSlaLayananById = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID SLA layanan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${slaLayananSelectQuery}
            WHERE sla.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'SLA layanan tidak ditemukan.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getSlaLayananById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil SLA layanan.'
        });
    }
};


// =====================================================
// GET SLA BERDASARKAN STANDAR
// GET /api/relasi-pengguna/standar-layanan/:id/sla
// =====================================================

exports.getSlaByStandar = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID standar layanan tidak valid.'
        });
    }

    try {
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (standar.length === 0) {
            return res.status(404).json({
                message:
                    'Standar layanan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${slaLayananSelectQuery}
            WHERE sla.standar_layanan_id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'SLA untuk standar layanan tersebut belum tersedia.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getSlaByStandar error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil SLA layanan.'
        });
    }
};


// =====================================================
// CREATE SLA
// POST /api/relasi-pengguna/sla-layanan
// =====================================================

exports.createSlaLayanan = async (req, res) => {
    const validationError =
        validateSlaLayananInput(
            req.body,
            true
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        standar_layanan_id,
        jam_layanan,
        jam_service_desk,
        target_waktu_respon_menit,
        target_waktu_penyelesaian_menit,
        target_ketersediaan_persen
    } = req.body;


    try {
        // CEK STANDAR
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [standar_layanan_id]
        );

        if (standar.length === 0) {
            return res.status(400).json({
                message:
                    'standar_layanan_id tidak ditemukan.'
            });
        }


        // SATU STANDAR = SATU SLA
        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_sla_layanan
            WHERE standar_layanan_id = ?
            LIMIT 1
            `,
            [standar_layanan_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Standar layanan tersebut sudah memiliki SLA.'
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO mrp_sla_layanan (
                standar_layanan_id,
                jam_layanan,
                jam_service_desk,
                target_waktu_respon_menit,
                target_waktu_penyelesaian_menit,
                target_ketersediaan_persen
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(standar_layanan_id),

                normalizeOptionalText(
                    jam_layanan
                ),

                normalizeOptionalText(
                    jam_service_desk
                ),

                (
                    target_waktu_respon_menit === undefined ||
                    target_waktu_respon_menit === null ||
                    target_waktu_respon_menit === ''
                )
                    ? null
                    : Number(
                        target_waktu_respon_menit
                    ),

                (
                    target_waktu_penyelesaian_menit === undefined ||
                    target_waktu_penyelesaian_menit === null ||
                    target_waktu_penyelesaian_menit === ''
                )
                    ? null
                    : Number(
                        target_waktu_penyelesaian_menit
                    ),

                (
                    target_ketersediaan_persen === undefined ||
                    target_ketersediaan_persen === null ||
                    target_ketersediaan_persen === ''
                )
                    ? null
                    : Number(
                        target_ketersediaan_persen
                    )
            ]
        );


        return res.status(201).json({
            message:
                'SLA layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createSlaLayanan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Standar layanan tersebut sudah memiliki SLA.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat SLA layanan.'
        });
    }
};


// =====================================================
// UPDATE SLA
// PUT /api/relasi-pengguna/sla-layanan/:id
// =====================================================

exports.updateSlaLayanan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID SLA layanan tidak valid.'
        });
    }


    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'standar_layanan_id'
        )
    ) {
        return res.status(400).json({
            message:
                'standar_layanan_id tidak boleh diubah.'
        });
    }


    const validationError =
        validateSlaLayananInput(
            req.body,
            false
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mrp_sla_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'SLA layanan tidak ditemukan.'
            });
        }

        const existing =
            existingRows[0];


        const textValue = (field) => {
            if (
                req.body[field] !== undefined
            ) {
                return normalizeOptionalText(
                    req.body[field]
                );
            }

            return existing[field];
        };


        const numberValue = (field) => {
            if (
                req.body[field] === undefined
            ) {
                return existing[field];
            }

            if (
                req.body[field] === null ||
                req.body[field] === ''
            ) {
                return null;
            }

            return Number(
                req.body[field]
            );
        };


        await db.query(
            `
            UPDATE mrp_sla_layanan
            SET
                jam_layanan = ?,
                jam_service_desk = ?,
                target_waktu_respon_menit = ?,
                target_waktu_penyelesaian_menit = ?,
                target_ketersediaan_persen = ?
            WHERE id = ?
            `,
            [
                textValue(
                    'jam_layanan'
                ),

                textValue(
                    'jam_service_desk'
                ),

                numberValue(
                    'target_waktu_respon_menit'
                ),

                numberValue(
                    'target_waktu_penyelesaian_menit'
                ),

                numberValue(
                    'target_ketersediaan_persen'
                ),

                id
            ]
        );


        return res.status(200).json({
            message:
                'SLA layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateSlaLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui SLA layanan.'
        });
    }
};


// =====================================================
// DELETE SLA
// DELETE /api/relasi-pengguna/sla-layanan/:id
// =====================================================

exports.deleteSlaLayanan = async (req, res) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID SLA layanan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_sla_layanan
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'SLA layanan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'SLA layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteSlaLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus SLA layanan.'
        });
    }
};

// =====================================================
// MRP 1A - OLA LAYANAN
// =====================================================

const olaLayananSelectQuery = `
    SELECT
        ola.id,
        ola.standar_layanan_id,

        ola.target_kecepatan,
        ola.satuan_kecepatan,

        ola.target_kapasitas,
        ola.satuan_kapasitas,

        ola.target_ketersediaan_persen,
        ola.target_rto_menit,
        ola.target_rpo_menit,
        ola.target_waktu_respon_menit,
        ola.target_waktu_penyelesaian_menit,

        ola.created_at,
        ola.updated_at,

        s.katalog_layanan_id,
        s.versi AS versi_standar,
        s.status AS status_standar,

        k.layanan_id,
        l.kode_layanan,
        l.nama_layanan

    FROM mrp_ola_layanan ola

    JOIN mrp_standar_layanan s
        ON s.id = ola.standar_layanan_id

    JOIN mrp_katalog_layanan k
        ON k.id = s.katalog_layanan_id

    JOIN layanan_digital l
        ON l.id = k.layanan_id
`;


// =====================================================
// VALIDASI OLA
// =====================================================

const validateOlaLayananInput = (
    body,
    isCreate = true
) => {
    const {
        standar_layanan_id,
        target_kecepatan,
        satuan_kecepatan,
        target_kapasitas,
        satuan_kapasitas,
        target_ketersediaan_persen,
        target_rto_menit,
        target_rpo_menit,
        target_waktu_respon_menit,
        target_waktu_penyelesaian_menit
    } = body;


    if (
        isCreate &&
        !isPositiveInteger(standar_layanan_id)
    ) {
        return (
            'standar_layanan_id wajib berupa ID yang valid.'
        );
    }


    // TARGET KECEPATAN
    if (
        target_kecepatan !== undefined &&
        target_kecepatan !== null &&
        target_kecepatan !== '' &&
        !isNonNegativeNumber(target_kecepatan)
    ) {
        return (
            'target_kecepatan harus berupa angka 0 atau lebih.'
        );
    }


    // SATUAN KECEPATAN
    if (
        satuan_kecepatan !== undefined &&
        satuan_kecepatan !== null &&
        typeof satuan_kecepatan !== 'string'
    ) {
        return (
            'satuan_kecepatan harus berupa teks.'
        );
    }

    if (
        typeof satuan_kecepatan === 'string' &&
        satuan_kecepatan.trim().length > 50
    ) {
        return (
            'satuan_kecepatan maksimal 50 karakter.'
        );
    }


    // TARGET KAPASITAS
    if (
        target_kapasitas !== undefined &&
        target_kapasitas !== null &&
        target_kapasitas !== '' &&
        !isNonNegativeNumber(target_kapasitas)
    ) {
        return (
            'target_kapasitas harus berupa angka 0 atau lebih.'
        );
    }


    // SATUAN KAPASITAS
    if (
        satuan_kapasitas !== undefined &&
        satuan_kapasitas !== null &&
        typeof satuan_kapasitas !== 'string'
    ) {
        return (
            'satuan_kapasitas harus berupa teks.'
        );
    }

    if (
        typeof satuan_kapasitas === 'string' &&
        satuan_kapasitas.trim().length > 50
    ) {
        return (
            'satuan_kapasitas maksimal 50 karakter.'
        );
    }


    // KETERSEDIAAN
    if (
        target_ketersediaan_persen !== undefined &&
        target_ketersediaan_persen !== null &&
        target_ketersediaan_persen !== '' &&
        !isValidPercentage(
            target_ketersediaan_persen
        )
    ) {
        return (
            'target_ketersediaan_persen harus berada pada rentang 0 sampai 100.'
        );
    }


    // RTO
    if (
        target_rto_menit !== undefined &&
        target_rto_menit !== null &&
        target_rto_menit !== '' &&
        !isNonNegativeInteger(
            target_rto_menit
        )
    ) {
        return (
            'target_rto_menit harus berupa bilangan bulat 0 atau lebih.'
        );
    }


    // RPO
    if (
        target_rpo_menit !== undefined &&
        target_rpo_menit !== null &&
        target_rpo_menit !== '' &&
        !isNonNegativeInteger(
            target_rpo_menit
        )
    ) {
        return (
            'target_rpo_menit harus berupa bilangan bulat 0 atau lebih.'
        );
    }


    // WAKTU RESPON
    if (
        target_waktu_respon_menit !== undefined &&
        target_waktu_respon_menit !== null &&
        target_waktu_respon_menit !== '' &&
        !isNonNegativeInteger(
            target_waktu_respon_menit
        )
    ) {
        return (
            'target_waktu_respon_menit harus berupa bilangan bulat 0 atau lebih.'
        );
    }


    // WAKTU PENYELESAIAN
    if (
        target_waktu_penyelesaian_menit !== undefined &&
        target_waktu_penyelesaian_menit !== null &&
        target_waktu_penyelesaian_menit !== '' &&
        !isNonNegativeInteger(
            target_waktu_penyelesaian_menit
        )
    ) {
        return (
            'target_waktu_penyelesaian_menit harus berupa bilangan bulat 0 atau lebih.'
        );
    }


    return null;
};


// =====================================================
// GET ALL OLA
// GET /api/relasi-pengguna/ola-layanan
// =====================================================

exports.getAllOlaLayanan = async (req, res) => {
    try {
        const [rows] = await db.query(`
            ${olaLayananSelectQuery}

            ORDER BY ola.id DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllOlaLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil OLA layanan.'
        });
    }
};


// =====================================================
// GET DETAIL OLA
// GET /api/relasi-pengguna/ola-layanan/:id
// =====================================================

exports.getOlaLayananById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID OLA layanan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${olaLayananSelectQuery}

            WHERE ola.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'OLA layanan tidak ditemukan.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getOlaLayananById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil OLA layanan.'
        });
    }
};


// =====================================================
// GET OLA BERDASARKAN STANDAR
// GET /api/relasi-pengguna/standar-layanan/:id/ola
// =====================================================

exports.getOlaByStandar = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID standar layanan tidak valid.'
        });
    }

    try {
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (standar.length === 0) {
            return res.status(404).json({
                message:
                    'Standar layanan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${olaLayananSelectQuery}

            WHERE ola.standar_layanan_id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'OLA untuk standar layanan tersebut belum tersedia.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getOlaByStandar error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil OLA layanan.'
        });
    }
};


// =====================================================
// CREATE OLA
// POST /api/relasi-pengguna/ola-layanan
// =====================================================

exports.createOlaLayanan = async (
    req,
    res
) => {
    const validationError =
        validateOlaLayananInput(
            req.body,
            true
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        standar_layanan_id,
        target_kecepatan,
        satuan_kecepatan,
        target_kapasitas,
        satuan_kapasitas,
        target_ketersediaan_persen,
        target_rto_menit,
        target_rpo_menit,
        target_waktu_respon_menit,
        target_waktu_penyelesaian_menit
    } = req.body;


    try {
        // CEK STANDAR
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [standar_layanan_id]
        );

        if (standar.length === 0) {
            return res.status(400).json({
                message:
                    'standar_layanan_id tidak ditemukan.'
            });
        }


        // SATU STANDAR = SATU OLA
        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_ola_layanan
            WHERE standar_layanan_id = ?
            LIMIT 1
            `,
            [standar_layanan_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Standar layanan tersebut sudah memiliki OLA.'
            });
        }


        const numberOrNull = (value) => {
            if (
                value === undefined ||
                value === null ||
                value === ''
            ) {
                return null;
            }

            return Number(value);
        };


        const [result] = await db.query(
            `
            INSERT INTO mrp_ola_layanan (
                standar_layanan_id,
                target_kecepatan,
                satuan_kecepatan,
                target_kapasitas,
                satuan_kapasitas,
                target_ketersediaan_persen,
                target_rto_menit,
                target_rpo_menit,
                target_waktu_respon_menit,
                target_waktu_penyelesaian_menit
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(standar_layanan_id),

                numberOrNull(
                    target_kecepatan
                ),

                normalizeOptionalText(
                    satuan_kecepatan
                ),

                numberOrNull(
                    target_kapasitas
                ),

                normalizeOptionalText(
                    satuan_kapasitas
                ),

                numberOrNull(
                    target_ketersediaan_persen
                ),

                numberOrNull(
                    target_rto_menit
                ),

                numberOrNull(
                    target_rpo_menit
                ),

                numberOrNull(
                    target_waktu_respon_menit
                ),

                numberOrNull(
                    target_waktu_penyelesaian_menit
                )
            ]
        );


        return res.status(201).json({
            message:
                'OLA layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createOlaLayanan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Standar layanan tersebut sudah memiliki OLA.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat OLA layanan.'
        });
    }
};


// =====================================================
// UPDATE OLA
// PUT /api/relasi-pengguna/ola-layanan/:id
// =====================================================

exports.updateOlaLayanan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID OLA layanan tidak valid.'
        });
    }


    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'standar_layanan_id'
        )
    ) {
        return res.status(400).json({
            message:
                'standar_layanan_id tidak boleh diubah.'
        });
    }


    const validationError =
        validateOlaLayananInput(
            req.body,
            false
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mrp_ola_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'OLA layanan tidak ditemukan.'
            });
        }

        const existing =
            existingRows[0];


        const textValue = (field) => {
            if (
                req.body[field] !== undefined
            ) {
                return normalizeOptionalText(
                    req.body[field]
                );
            }

            return existing[field];
        };


        const numberValue = (field) => {
            if (
                req.body[field] === undefined
            ) {
                return existing[field];
            }

            if (
                req.body[field] === null ||
                req.body[field] === ''
            ) {
                return null;
            }

            return Number(
                req.body[field]
            );
        };


        await db.query(
            `
            UPDATE mrp_ola_layanan
            SET
                target_kecepatan = ?,
                satuan_kecepatan = ?,
                target_kapasitas = ?,
                satuan_kapasitas = ?,
                target_ketersediaan_persen = ?,
                target_rto_menit = ?,
                target_rpo_menit = ?,
                target_waktu_respon_menit = ?,
                target_waktu_penyelesaian_menit = ?
            WHERE id = ?
            `,
            [
                numberValue(
                    'target_kecepatan'
                ),

                textValue(
                    'satuan_kecepatan'
                ),

                numberValue(
                    'target_kapasitas'
                ),

                textValue(
                    'satuan_kapasitas'
                ),

                numberValue(
                    'target_ketersediaan_persen'
                ),

                numberValue(
                    'target_rto_menit'
                ),

                numberValue(
                    'target_rpo_menit'
                ),

                numberValue(
                    'target_waktu_respon_menit'
                ),

                numberValue(
                    'target_waktu_penyelesaian_menit'
                ),

                id
            ]
        );


        return res.status(200).json({
            message:
                'OLA layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateOlaLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui OLA layanan.'
        });
    }
};


// =====================================================
// DELETE OLA
// DELETE /api/relasi-pengguna/ola-layanan/:id
// =====================================================

exports.deleteOlaLayanan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID OLA layanan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_ola_layanan
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'OLA layanan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'OLA layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteOlaLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus OLA layanan.'
        });
    }
};

// =====================================================
// MRP 1A - INDIKATOR TAMBAHAN STANDAR
// =====================================================

const indikatorTambahanSelectQuery = `
    SELECT
        i.id,
        i.standar_layanan_id,
        i.objek,
        i.jenis_standar,
        i.prioritas,
        i.nama_indikator,
        i.target_nilai,
        i.satuan,
        i.arah_target,
        i.created_at,
        i.updated_at,

        s.katalog_layanan_id,
        s.versi AS versi_standar,
        s.status AS status_standar,

        k.layanan_id,
        l.kode_layanan,
        l.nama_layanan

    FROM mrp_indikator_tambahan_standar i

    JOIN mrp_standar_layanan s
        ON s.id = i.standar_layanan_id

    JOIN mrp_katalog_layanan k
        ON k.id = s.katalog_layanan_id

    JOIN layanan_digital l
        ON l.id = k.layanan_id
`;


// =====================================================
// VALIDASI INDIKATOR TAMBAHAN
// =====================================================

const validateIndikatorTambahan = (data) => {
    const {
        standar_layanan_id,
        objek,
        jenis_standar,
        prioritas,
        nama_indikator,
        target_nilai,
        satuan,
        arah_target
    } = data;


    if (!isPositiveInteger(standar_layanan_id)) {
        return (
            'standar_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        ![
            'Layanan',
            'Kueri',
            'Insiden'
        ].includes(objek)
    ) {
        return (
            'objek harus Layanan, Kueri, atau Insiden.'
        );
    }


    if (
        ![
            'SLA',
            'OLA'
        ].includes(jenis_standar)
    ) {
        return (
            'jenis_standar harus SLA atau OLA.'
        );
    }


    // Insiden tidak boleh menggunakan SLA
    if (
        objek === 'Insiden' &&
        jenis_standar === 'SLA'
    ) {
        return (
            'Objek Insiden tidak dapat menggunakan jenis_standar SLA.'
        );
    }


    // Layanan harus Tidak Berlaku
    if (
        objek === 'Layanan' &&
        prioritas !== 'Tidak Berlaku'
    ) {
        return (
            'Prioritas untuk objek Layanan harus Tidak Berlaku.'
        );
    }


    // Kueri / Insiden harus punya prioritas
    if (
        ['Kueri', 'Insiden'].includes(objek) &&
        ![
            'Rendah',
            'Sedang',
            'Tinggi'
        ].includes(prioritas)
    ) {
        return (
            'Prioritas untuk objek Kueri atau Insiden harus Rendah, Sedang, atau Tinggi.'
        );
    }


    if (
        typeof nama_indikator !== 'string' ||
        nama_indikator.trim() === ''
    ) {
        return (
            'nama_indikator wajib diisi.'
        );
    }

    if (
        nama_indikator.trim().length > 150
    ) {
        return (
            'nama_indikator maksimal 150 karakter.'
        );
    }


    if (
        target_nilai === undefined ||
        target_nilai === null ||
        target_nilai === '' ||
        !isNonNegativeNumber(target_nilai)
    ) {
        return (
            'target_nilai wajib berupa angka 0 atau lebih.'
        );
    }


    if (
        typeof satuan !== 'string' ||
        satuan.trim() === ''
    ) {
        return (
            'satuan wajib diisi.'
        );
    }

    if (
        satuan.trim().length > 50
    ) {
        return (
            'satuan maksimal 50 karakter.'
        );
    }


    if (
        ![
            'Minimal',
            'Maksimal',
            'Tepat'
        ].includes(arah_target)
    ) {
        return (
            'arah_target harus Minimal, Maksimal, atau Tepat.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/indikator-tambahan-standar
// =====================================================

exports.getAllIndikatorTambahan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${indikatorTambahanSelectQuery}

            ORDER BY i.id DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllIndikatorTambahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator tambahan standar.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/indikator-tambahan-standar/:id
// =====================================================

exports.getIndikatorTambahanById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator tambahan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${indikatorTambahanSelectQuery}

            WHERE i.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator tambahan standar tidak ditemukan.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getIndikatorTambahanById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator tambahan standar.'
        });
    }
};


// =====================================================
// GET BERDASARKAN STANDAR
// GET /api/relasi-pengguna/standar-layanan/:id/indikator-tambahan
// =====================================================

exports.getIndikatorTambahanByStandar = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID standar layanan tidak valid.'
        });
    }

    try {
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (standar.length === 0) {
            return res.status(404).json({
                message:
                    'Standar layanan tidak ditemukan.'
            });
        }

        const [rows] = await db.query(
            `
            ${indikatorTambahanSelectQuery}

            WHERE i.standar_layanan_id = ?

            ORDER BY
                i.objek ASC,
                i.jenis_standar ASC,
                i.prioritas ASC,
                i.id ASC
            `,
            [id]
        );

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getIndikatorTambahanByStandar error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator tambahan standar.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/indikator-tambahan-standar
// =====================================================

exports.createIndikatorTambahan = async (
    req,
    res
) => {
    const {
        standar_layanan_id,
        objek,
        jenis_standar,
        prioritas,
        nama_indikator,
        target_nilai,
        satuan,
        arah_target
    } = req.body;


    const prioritasFinal =
        objek === 'Layanan' &&
        prioritas === undefined
            ? 'Tidak Berlaku'
            : prioritas;


    const arahTargetFinal =
        arah_target === undefined
            ? 'Minimal'
            : arah_target;


    const data = {
        standar_layanan_id,
        objek,
        jenis_standar,
        prioritas: prioritasFinal,
        nama_indikator,
        target_nilai,
        satuan,
        arah_target: arahTargetFinal
    };


    const validationError =
        validateIndikatorTambahan(data);

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [standar_layanan_id]
        );

        if (standar.length === 0) {
            return res.status(400).json({
                message:
                    'standar_layanan_id tidak ditemukan.'
            });
        }


        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_indikator_tambahan_standar
            WHERE
                standar_layanan_id = ?
                AND objek = ?
                AND jenis_standar = ?
                AND prioritas = ?
                AND nama_indikator = ?
            LIMIT 1
            `,
            [
                standar_layanan_id,
                objek,
                jenis_standar,
                prioritasFinal,
                nama_indikator.trim()
            ]
        );


        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tambahan tersebut sudah tersedia pada standar layanan ini.'
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO mrp_indikator_tambahan_standar (
                standar_layanan_id,
                objek,
                jenis_standar,
                prioritas,
                nama_indikator,
                target_nilai,
                satuan,
                arah_target
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(standar_layanan_id),
                objek,
                jenis_standar,
                prioritasFinal,
                nama_indikator.trim(),
                Number(target_nilai),
                satuan.trim(),
                arahTargetFinal
            ]
        );


        return res.status(201).json({
            message:
                'Indikator tambahan standar berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createIndikatorTambahan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Indikator tambahan tersebut sudah tersedia pada standar layanan ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat indikator tambahan standar.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/indikator-tambahan-standar/:id
// =====================================================

exports.updateIndikatorTambahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator tambahan tidak valid.'
        });
    }


    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'standar_layanan_id'
        )
    ) {
        return res.status(400).json({
            message:
                'standar_layanan_id tidak boleh diubah.'
        });
    }


    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mrp_indikator_tambahan_standar
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator tambahan standar tidak ditemukan.'
            });
        }


        const existing =
            existingRows[0];


        const objekFinal =
            req.body.objek !== undefined
                ? req.body.objek
                : existing.objek;

        const jenisFinal =
            req.body.jenis_standar !== undefined
                ? req.body.jenis_standar
                : existing.jenis_standar;


        let prioritasFinal;

        if (req.body.prioritas !== undefined) {
            prioritasFinal =
                req.body.prioritas;
        } else if (
            req.body.objek !== undefined &&
            objekFinal === 'Layanan'
        ) {
            prioritasFinal =
                'Tidak Berlaku';
        } else {
            prioritasFinal =
                existing.prioritas;
        }


        const namaFinal =
            req.body.nama_indikator !== undefined
                ? req.body.nama_indikator
                : existing.nama_indikator;

        const targetFinal =
            req.body.target_nilai !== undefined
                ? req.body.target_nilai
                : existing.target_nilai;

        const satuanFinal =
            req.body.satuan !== undefined
                ? req.body.satuan
                : existing.satuan;

        const arahFinal =
            req.body.arah_target !== undefined
                ? req.body.arah_target
                : existing.arah_target;


        const data = {
            standar_layanan_id:
                existing.standar_layanan_id,
            objek: objekFinal,
            jenis_standar: jenisFinal,
            prioritas: prioritasFinal,
            nama_indikator: namaFinal,
            target_nilai: targetFinal,
            satuan: satuanFinal,
            arah_target: arahFinal
        };


        const validationError =
            validateIndikatorTambahan(data);

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }


        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_indikator_tambahan_standar
            WHERE
                standar_layanan_id = ?
                AND objek = ?
                AND jenis_standar = ?
                AND prioritas = ?
                AND nama_indikator = ?
                AND id <> ?
            LIMIT 1
            `,
            [
                existing.standar_layanan_id,
                objekFinal,
                jenisFinal,
                prioritasFinal,
                namaFinal.trim(),
                id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tambahan tersebut sudah tersedia pada standar layanan ini.'
            });
        }


        await db.query(
            `
            UPDATE mrp_indikator_tambahan_standar
            SET
                objek = ?,
                jenis_standar = ?,
                prioritas = ?,
                nama_indikator = ?,
                target_nilai = ?,
                satuan = ?,
                arah_target = ?
            WHERE id = ?
            `,
            [
                objekFinal,
                jenisFinal,
                prioritasFinal,
                namaFinal.trim(),
                Number(targetFinal),
                satuanFinal.trim(),
                arahFinal,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Indikator tambahan standar berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateIndikatorTambahan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Indikator tambahan tersebut sudah tersedia pada standar layanan ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui indikator tambahan standar.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/indikator-tambahan-standar/:id
// =====================================================

exports.deleteIndikatorTambahan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator tambahan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_indikator_tambahan_standar
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Indikator tambahan standar tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Indikator tambahan standar berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteIndikatorTambahan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus indikator tambahan standar.'
        });
    }
};

// =====================================================
// MRP 1A - TARGET KUERI & INSIDEN
// =====================================================

const targetKueriInsidenSelectQuery = `
    SELECT
        t.id,
        t.standar_layanan_id,
        t.jenis,
        t.prioritas,

        t.sla_jam_layanan,
        t.sla_jam_service_desk,
        t.sla_waktu_respon_menit,
        t.sla_waktu_penyelesaian_menit,

        t.ola_waktu_respon_menit,
        t.ola_waktu_penyelesaian_menit,

        t.created_at,
        t.updated_at,

        s.katalog_layanan_id,
        s.versi AS versi_standar,
        s.status AS status_standar,

        k.layanan_id,
        l.kode_layanan,
        l.nama_layanan

    FROM mrp_target_kueri_insiden t

    JOIN mrp_standar_layanan s
        ON s.id = t.standar_layanan_id

    JOIN mrp_katalog_layanan k
        ON k.id = s.katalog_layanan_id

    JOIN layanan_digital l
        ON l.id = k.layanan_id
`;


// =====================================================
// VALIDASI TARGET KUERI & INSIDEN
// =====================================================

const validateTargetKueriInsiden = (
    data,
    isCreate = true
) => {
    const {
        standar_layanan_id,
        jenis,
        prioritas,
        sla_jam_layanan,
        sla_jam_service_desk,
        sla_waktu_respon_menit,
        sla_waktu_penyelesaian_menit,
        ola_waktu_respon_menit,
        ola_waktu_penyelesaian_menit
    } = data;


    if (
        isCreate &&
        !isPositiveInteger(standar_layanan_id)
    ) {
        return (
            'standar_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        ![
            'Kueri',
            'Insiden'
        ].includes(jenis)
    ) {
        return (
            'jenis harus Kueri atau Insiden.'
        );
    }


    if (
        ![
            'Rendah',
            'Sedang',
            'Tinggi'
        ].includes(prioritas)
    ) {
        return (
            'prioritas harus Rendah, Sedang, atau Tinggi.'
        );
    }


    if (
        sla_jam_layanan !== undefined &&
        sla_jam_layanan !== null &&
        typeof sla_jam_layanan !== 'string'
    ) {
        return (
            'sla_jam_layanan harus berupa teks.'
        );
    }

    if (
        typeof sla_jam_layanan === 'string' &&
        sla_jam_layanan.trim().length > 100
    ) {
        return (
            'sla_jam_layanan maksimal 100 karakter.'
        );
    }


    if (
        sla_jam_service_desk !== undefined &&
        sla_jam_service_desk !== null &&
        typeof sla_jam_service_desk !== 'string'
    ) {
        return (
            'sla_jam_service_desk harus berupa teks.'
        );
    }

    if (
        typeof sla_jam_service_desk === 'string' &&
        sla_jam_service_desk.trim().length > 100
    ) {
        return (
            'sla_jam_service_desk maksimal 100 karakter.'
        );
    }


    const minuteFields = [
        [
            'sla_waktu_respon_menit',
            sla_waktu_respon_menit
        ],
        [
            'sla_waktu_penyelesaian_menit',
            sla_waktu_penyelesaian_menit
        ],
        [
            'ola_waktu_respon_menit',
            ola_waktu_respon_menit
        ],
        [
            'ola_waktu_penyelesaian_menit',
            ola_waktu_penyelesaian_menit
        ]
    ];


    for (const [field, value] of minuteFields) {
        if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            !isNonNegativeInteger(value)
        ) {
            return (
                `${field} harus berupa bilangan bulat 0 atau lebih.`
            );
        }
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/target-kueri-insiden
// =====================================================

exports.getAllTargetKueriInsiden = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${targetKueriInsidenSelectQuery}

            ORDER BY
                t.standar_layanan_id ASC,
                t.jenis ASC,
                FIELD(
                    t.prioritas,
                    'Tinggi',
                    'Sedang',
                    'Rendah'
                )
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllTargetKueriInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil target kueri dan insiden.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/target-kueri-insiden/:id
// =====================================================

exports.getTargetKueriInsidenById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID target kueri dan insiden tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${targetKueriInsidenSelectQuery}

            WHERE t.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Target kueri dan insiden tidak ditemukan.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getTargetKueriInsidenById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil target kueri dan insiden.'
        });
    }
};


// =====================================================
// GET BERDASARKAN STANDAR
// GET /api/relasi-pengguna/standar-layanan/:id/target-kueri-insiden
// =====================================================

exports.getTargetKueriInsidenByStandar = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID standar layanan tidak valid.'
        });
    }

    try {
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (standar.length === 0) {
            return res.status(404).json({
                message:
                    'Standar layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${targetKueriInsidenSelectQuery}

            WHERE t.standar_layanan_id = ?

            ORDER BY
                t.jenis ASC,
                FIELD(
                    t.prioritas,
                    'Tinggi',
                    'Sedang',
                    'Rendah'
                )
            `,
            [id]
        );

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getTargetKueriInsidenByStandar error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil target kueri dan insiden.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/target-kueri-insiden
// =====================================================

exports.createTargetKueriInsiden = async (
    req,
    res
) => {
    const validationError =
        validateTargetKueriInsiden(
            req.body,
            true
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        standar_layanan_id,
        jenis,
        prioritas,
        sla_jam_layanan,
        sla_jam_service_desk,
        sla_waktu_respon_menit,
        sla_waktu_penyelesaian_menit,
        ola_waktu_respon_menit,
        ola_waktu_penyelesaian_menit
    } = req.body;


    const numberOrNull = (value) => {
        if (
            value === undefined ||
            value === null ||
            value === ''
        ) {
            return null;
        }

        return Number(value);
    };


    try {
        const [standar] = await db.query(
            `
            SELECT id
            FROM mrp_standar_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [standar_layanan_id]
        );

        if (standar.length === 0) {
            return res.status(400).json({
                message:
                    'standar_layanan_id tidak ditemukan.'
            });
        }


        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_target_kueri_insiden
            WHERE
                standar_layanan_id = ?
                AND jenis = ?
                AND prioritas = ?
            LIMIT 1
            `,
            [
                standar_layanan_id,
                jenis,
                prioritas
            ]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Target untuk jenis dan prioritas tersebut sudah tersedia pada standar layanan ini.'
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO mrp_target_kueri_insiden (
                standar_layanan_id,
                jenis,
                prioritas,
                sla_jam_layanan,
                sla_jam_service_desk,
                sla_waktu_respon_menit,
                sla_waktu_penyelesaian_menit,
                ola_waktu_respon_menit,
                ola_waktu_penyelesaian_menit
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(standar_layanan_id),
                jenis,
                prioritas,

                normalizeOptionalText(
                    sla_jam_layanan
                ),

                normalizeOptionalText(
                    sla_jam_service_desk
                ),

                numberOrNull(
                    sla_waktu_respon_menit
                ),

                numberOrNull(
                    sla_waktu_penyelesaian_menit
                ),

                numberOrNull(
                    ola_waktu_respon_menit
                ),

                numberOrNull(
                    ola_waktu_penyelesaian_menit
                )
            ]
        );


        return res.status(201).json({
            message:
                'Target kueri dan insiden berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createTargetKueriInsiden error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Target untuk jenis dan prioritas tersebut sudah tersedia pada standar layanan ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat target kueri dan insiden.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/target-kueri-insiden/:id
// =====================================================

exports.updateTargetKueriInsiden = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID target kueri dan insiden tidak valid.'
        });
    }


    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'standar_layanan_id'
        )
    ) {
        return res.status(400).json({
            message:
                'standar_layanan_id tidak boleh diubah.'
        });
    }


    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mrp_target_kueri_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Target kueri dan insiden tidak ditemukan.'
            });
        }


        const existing =
            existingRows[0];


        const value = (field) => {
            return req.body[field] !== undefined
                ? req.body[field]
                : existing[field];
        };


        const data = {
            standar_layanan_id:
                existing.standar_layanan_id,

            jenis:
                value('jenis'),

            prioritas:
                value('prioritas'),

            sla_jam_layanan:
                value('sla_jam_layanan'),

            sla_jam_service_desk:
                value('sla_jam_service_desk'),

            sla_waktu_respon_menit:
                value('sla_waktu_respon_menit'),

            sla_waktu_penyelesaian_menit:
                value(
                    'sla_waktu_penyelesaian_menit'
                ),

            ola_waktu_respon_menit:
                value('ola_waktu_respon_menit'),

            ola_waktu_penyelesaian_menit:
                value(
                    'ola_waktu_penyelesaian_menit'
                )
        };


        const validationError =
            validateTargetKueriInsiden(
                data,
                false
            );

        if (validationError) {
            return res.status(400).json({
                message: validationError
            });
        }


        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_target_kueri_insiden
            WHERE
                standar_layanan_id = ?
                AND jenis = ?
                AND prioritas = ?
                AND id <> ?
            LIMIT 1
            `,
            [
                existing.standar_layanan_id,
                data.jenis,
                data.prioritas,
                id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Target untuk jenis dan prioritas tersebut sudah tersedia pada standar layanan ini.'
            });
        }


        const numberValue = (field) => {
            if (
                req.body[field] === undefined
            ) {
                return existing[field];
            }

            if (
                req.body[field] === null ||
                req.body[field] === ''
            ) {
                return null;
            }

            return Number(
                req.body[field]
            );
        };


        const textValue = (field) => {
            if (
                req.body[field] === undefined
            ) {
                return existing[field];
            }

            return normalizeOptionalText(
                req.body[field]
            );
        };


        await db.query(
            `
            UPDATE mrp_target_kueri_insiden
            SET
                jenis = ?,
                prioritas = ?,
                sla_jam_layanan = ?,
                sla_jam_service_desk = ?,
                sla_waktu_respon_menit = ?,
                sla_waktu_penyelesaian_menit = ?,
                ola_waktu_respon_menit = ?,
                ola_waktu_penyelesaian_menit = ?
            WHERE id = ?
            `,
            [
                data.jenis,
                data.prioritas,

                textValue(
                    'sla_jam_layanan'
                ),

                textValue(
                    'sla_jam_service_desk'
                ),

                numberValue(
                    'sla_waktu_respon_menit'
                ),

                numberValue(
                    'sla_waktu_penyelesaian_menit'
                ),

                numberValue(
                    'ola_waktu_respon_menit'
                ),

                numberValue(
                    'ola_waktu_penyelesaian_menit'
                ),

                id
            ]
        );


        return res.status(200).json({
            message:
                'Target kueri dan insiden berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateTargetKueriInsiden error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Target untuk jenis dan prioritas tersebut sudah tersedia pada standar layanan ini.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui target kueri dan insiden.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/target-kueri-insiden/:id
// =====================================================

exports.deleteTargetKueriInsiden = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID target kueri dan insiden tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_target_kueri_insiden
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Target kueri dan insiden tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Target kueri dan insiden berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteTargetKueriInsiden error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus target kueri dan insiden.'
        });
    }
};

// =====================================================
// MRP 1B - RENCANA KOMUNIKASI PENGGUNA
// =====================================================

const rencanaKomunikasiSelectQuery = `
    SELECT
        r.id,
        r.layanan_id,

        l.kode_layanan,
        l.nama_layanan,

        r.informasi,
        r.manajemen_terkait,

        r.pembuat_informasi_id,
        pi.nama AS pembuat_informasi,

        r.target_audiens,
        r.periode_komunikasi,
        r.status,

        r.created_by,
        cb.nama AS dibuat_oleh,

        r.created_at,
        r.updated_at

    FROM mrp_rencana_komunikasi r

    JOIN layanan_digital l
        ON l.id = r.layanan_id

    LEFT JOIN users pi
        ON pi.id = r.pembuat_informasi_id

    JOIN users cb
        ON cb.id = r.created_by
`;


// =====================================================
// VALIDASI RENCANA KOMUNIKASI
// =====================================================

const validateRencanaKomunikasi = (
    body,
    isCreate = true
) => {
    const {
        layanan_id,
        informasi,
        manajemen_terkait,
        pembuat_informasi_id,
        target_audiens,
        periode_komunikasi,
        status
    } = body;


    if (
        isCreate &&
        !isPositiveInteger(layanan_id)
    ) {
        return (
            'layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        informasi !== undefined &&
        (
            typeof informasi !== 'string' ||
            informasi.trim() === ''
        )
    ) {
        return (
            'informasi wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        informasi === undefined
    ) {
        return 'informasi wajib diisi.';
    }


    if (
        manajemen_terkait !== undefined &&
        manajemen_terkait !== null &&
        typeof manajemen_terkait !== 'string'
    ) {
        return (
            'manajemen_terkait harus berupa teks.'
        );
    }

    if (
        typeof manajemen_terkait === 'string' &&
        manajemen_terkait.trim().length > 100
    ) {
        return (
            'manajemen_terkait maksimal 100 karakter.'
        );
    }


    if (
        pembuat_informasi_id !== undefined &&
        pembuat_informasi_id !== null &&
        pembuat_informasi_id !== '' &&
        !isPositiveInteger(pembuat_informasi_id)
    ) {
        return (
            'pembuat_informasi_id harus berupa ID yang valid.'
        );
    }


    if (
        target_audiens !== undefined &&
        (
            typeof target_audiens !== 'string' ||
            target_audiens.trim() === ''
        )
    ) {
        return (
            'target_audiens wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        target_audiens === undefined
    ) {
        return 'target_audiens wajib diisi.';
    }


    if (
        periode_komunikasi !== undefined &&
        (
            typeof periode_komunikasi !== 'string' ||
            periode_komunikasi.trim() === ''
        )
    ) {
        return (
            'periode_komunikasi wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        periode_komunikasi === undefined
    ) {
        return (
            'periode_komunikasi wajib diisi.'
        );
    }

    if (
        typeof periode_komunikasi === 'string' &&
        periode_komunikasi.trim().length > 100
    ) {
        return (
            'periode_komunikasi maksimal 100 karakter.'
        );
    }


    if (
        status !== undefined &&
        ![
            'Draft',
            'Aktif',
            'Selesai',
            'Dibatalkan'
        ].includes(status)
    ) {
        return (
            'status harus Draft, Aktif, Selesai, atau Dibatalkan.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/rencana-komunikasi
// =====================================================

exports.getAllRencanaKomunikasi = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${rencanaKomunikasiSelectQuery}

            ORDER BY r.id DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllRencanaKomunikasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil rencana komunikasi.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/rencana-komunikasi/:id
// =====================================================

exports.getRencanaKomunikasiById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID rencana komunikasi tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${rencanaKomunikasiSelectQuery}

            WHERE r.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Rencana komunikasi tidak ditemukan.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getRencanaKomunikasiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil rencana komunikasi.'
        });
    }
};


// =====================================================
// GET BERDASARKAN LAYANAN
// GET /api/relasi-pengguna/layanan/:id/rencana-komunikasi
// =====================================================

exports.getRencanaKomunikasiByLayanan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan tidak valid.'
        });
    }

    try {
        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (layanan.length === 0) {
            return res.status(404).json({
                message:
                    'Layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${rencanaKomunikasiSelectQuery}

            WHERE r.layanan_id = ?

            ORDER BY r.id DESC
            `,
            [id]
        );

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getRencanaKomunikasiByLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil rencana komunikasi.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/rencana-komunikasi
// =====================================================

exports.createRencanaKomunikasi = async (
    req,
    res
) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validateRencanaKomunikasi(
            req.body,
            true
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        layanan_id,
        informasi,
        manajemen_terkait,
        pembuat_informasi_id,
        target_audiens,
        periode_komunikasi,
        status
    } = req.body;


    try {
        // =============================================
        // CEK LAYANAN
        // =============================================

        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [layanan_id]
        );

        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK PEMBUAT INFORMASI
        // =============================================

        if (
            pembuat_informasi_id !== undefined &&
            pembuat_informasi_id !== null &&
            pembuat_informasi_id !== ''
        ) {
            const [pembuat] = await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [pembuat_informasi_id]
            );

            if (pembuat.length === 0) {
                return res.status(400).json({
                    message:
                        'pembuat_informasi_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_rencana_komunikasi (
                layanan_id,
                informasi,
                manajemen_terkait,
                pembuat_informasi_id,
                target_audiens,
                periode_komunikasi,
                status,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(layanan_id),

                informasi.trim(),

                normalizeOptionalText(
                    manajemen_terkait
                ),

                (
                    pembuat_informasi_id === undefined ||
                    pembuat_informasi_id === null ||
                    pembuat_informasi_id === ''
                )
                    ? null
                    : Number(
                        pembuat_informasi_id
                    ),

                target_audiens.trim(),

                periode_komunikasi.trim(),

                status || 'Draft',

                req.user.id
            ]
        );


        return res.status(201).json({
            message:
                'Rencana komunikasi berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createRencanaKomunikasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat rencana komunikasi.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/rencana-komunikasi/:id
// =====================================================

exports.updateRencanaKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID rencana komunikasi tidak valid.'
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
                'created_by tidak boleh diubah.'
        });
    }


    const validationError =
        validateRencanaKomunikasi(
            req.body,
            false
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [existingRows] = await db.query(
            `
            SELECT *
            FROM mrp_rencana_komunikasi
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Rencana komunikasi tidak ditemukan.'
            });
        }


        const existing =
            existingRows[0];


        // =============================================
        // LAYANAN
        // =============================================

        const layananId =
            req.body.layanan_id !== undefined
                ? Number(req.body.layanan_id)
                : existing.layanan_id;


        if (!isPositiveInteger(layananId)) {
            return res.status(400).json({
                message:
                    'layanan_id harus berupa ID yang valid.'
            });
        }


        if (
            req.body.layanan_id !== undefined
        ) {
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
                    message:
                        'layanan_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // PEMBUAT INFORMASI
        // =============================================

        let pembuatInformasiId;

        if (
            req.body.pembuat_informasi_id !==
            undefined
        ) {
            if (
                req.body.pembuat_informasi_id ===
                    null ||
                req.body.pembuat_informasi_id === ''
            ) {
                pembuatInformasiId = null;

            } else {
                pembuatInformasiId =
                    Number(
                        req.body
                            .pembuat_informasi_id
                    );
            }

        } else {
            pembuatInformasiId =
                existing.pembuat_informasi_id;
        }


        if (pembuatInformasiId !== null) {
            const [pembuat] = await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [pembuatInformasiId]
            );

            if (pembuat.length === 0) {
                return res.status(400).json({
                    message:
                        'pembuat_informasi_id tidak ditemukan.'
                });
            }
        }


        const informasiFinal =
            req.body.informasi !== undefined
                ? req.body.informasi.trim()
                : existing.informasi;


        const targetAudiensFinal =
            req.body.target_audiens !== undefined
                ? req.body.target_audiens.trim()
                : existing.target_audiens;


        const periodeFinal =
            req.body.periode_komunikasi !==
            undefined
                ? req.body
                    .periode_komunikasi
                    .trim()
                : existing.periode_komunikasi;


        const manajemenFinal =
            req.body.manajemen_terkait !==
            undefined
                ? normalizeOptionalText(
                    req.body.manajemen_terkait
                )
                : existing.manajemen_terkait;


        const statusFinal =
            req.body.status !== undefined
                ? req.body.status
                : existing.status;


        await db.query(
            `
            UPDATE mrp_rencana_komunikasi
            SET
                layanan_id = ?,
                informasi = ?,
                manajemen_terkait = ?,
                pembuat_informasi_id = ?,
                target_audiens = ?,
                periode_komunikasi = ?,
                status = ?
            WHERE id = ?
            `,
            [
                layananId,
                informasiFinal,
                manajemenFinal,
                pembuatInformasiId,
                targetAudiensFinal,
                periodeFinal,
                statusFinal,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Rencana komunikasi berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateRencanaKomunikasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui rencana komunikasi.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/rencana-komunikasi/:id
// =====================================================

exports.deleteRencanaKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID rencana komunikasi tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_rencana_komunikasi
            WHERE id = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Rencana komunikasi tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Rencana komunikasi berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteRencanaKomunikasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus rencana komunikasi.'
        });
    }
};

// =====================================================
// MRP 1B - MEDIA KOMUNIKASI
// =====================================================

const mediaKomunikasiSelectQuery = `
    SELECT
        m.id,
        m.rencana_komunikasi_id,
        m.bentuk_media,
        m.kanal_komunikasi,
        m.keterangan,
        m.created_at,

        r.layanan_id,
        r.informasi,
        r.target_audiens,
        r.periode_komunikasi,
        r.status AS status_rencana,

        l.kode_layanan,
        l.nama_layanan

    FROM mrp_media_komunikasi m

    JOIN mrp_rencana_komunikasi r
        ON r.id = m.rencana_komunikasi_id

    JOIN layanan_digital l
        ON l.id = r.layanan_id
`;


// =====================================================
// VALIDASI MEDIA KOMUNIKASI
// =====================================================

const validateMediaKomunikasi = (
    body,
    isCreate = true
) => {
    const {
        rencana_komunikasi_id,
        bentuk_media,
        kanal_komunikasi,
        keterangan
    } = body;


    if (
        isCreate &&
        !isPositiveInteger(
            rencana_komunikasi_id
        )
    ) {
        return (
            'rencana_komunikasi_id wajib berupa ID yang valid.'
        );
    }


    if (
        bentuk_media !== undefined &&
        (
            typeof bentuk_media !== 'string' ||
            bentuk_media.trim() === ''
        )
    ) {
        return (
            'bentuk_media wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        bentuk_media === undefined
    ) {
        return 'bentuk_media wajib diisi.';
    }

    if (
        typeof bentuk_media === 'string' &&
        bentuk_media.trim().length > 100
    ) {
        return (
            'bentuk_media maksimal 100 karakter.'
        );
    }


    if (
        kanal_komunikasi !== undefined &&
        (
            typeof kanal_komunikasi !== 'string' ||
            kanal_komunikasi.trim() === ''
        )
    ) {
        return (
            'kanal_komunikasi wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        kanal_komunikasi === undefined
    ) {
        return (
            'kanal_komunikasi wajib diisi.'
        );
    }

    if (
        typeof kanal_komunikasi === 'string' &&
        kanal_komunikasi.trim().length > 100
    ) {
        return (
            'kanal_komunikasi maksimal 100 karakter.'
        );
    }


    if (
        keterangan !== undefined &&
        keterangan !== null &&
        typeof keterangan !== 'string'
    ) {
        return (
            'keterangan harus berupa teks.'
        );
    }

    if (
        typeof keterangan === 'string' &&
        keterangan.trim().length > 255
    ) {
        return (
            'keterangan maksimal 255 karakter.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/media-komunikasi
// =====================================================

exports.getAllMediaKomunikasi = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${mediaKomunikasiSelectQuery}

            ORDER BY m.id DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllMediaKomunikasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil media komunikasi.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/media-komunikasi/:id
// =====================================================

exports.getMediaKomunikasiById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID media komunikasi tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${mediaKomunikasiSelectQuery}

            WHERE m.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Media komunikasi tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getMediaKomunikasiById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil media komunikasi.'
        });
    }
};


// =====================================================
// GET BERDASARKAN RENCANA KOMUNIKASI
// GET /api/relasi-pengguna/rencana-komunikasi/:id/media
// =====================================================

exports.getMediaByRencanaKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID rencana komunikasi tidak valid.'
        });
    }


    try {
        const [rencana] = await db.query(
            `
            SELECT id
            FROM mrp_rencana_komunikasi
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rencana.length === 0) {
            return res.status(404).json({
                message:
                    'Rencana komunikasi tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${mediaKomunikasiSelectQuery}

            WHERE m.rencana_komunikasi_id = ?

            ORDER BY m.id DESC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getMediaByRencanaKomunikasi error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil media komunikasi.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/media-komunikasi
// =====================================================

exports.createMediaKomunikasi = async (
    req,
    res
) => {
    const validationError =
        validateMediaKomunikasi(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        rencana_komunikasi_id,
        bentuk_media,
        kanal_komunikasi,
        keterangan
    } = req.body;


    try {
        // =============================================
        // CEK RENCANA KOMUNIKASI
        // =============================================

        const [rencana] = await db.query(
            `
            SELECT id
            FROM mrp_rencana_komunikasi
            WHERE id = ?
            LIMIT 1
            `,
            [rencana_komunikasi_id]
        );


        if (rencana.length === 0) {
            return res.status(400).json({
                message:
                    'rencana_komunikasi_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_media_komunikasi
            WHERE
                rencana_komunikasi_id = ?
                AND bentuk_media = ?
                AND kanal_komunikasi = ?
            LIMIT 1
            `,
            [
                rencana_komunikasi_id,
                bentuk_media.trim(),
                kanal_komunikasi.trim()
            ]
        );


        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Media dengan bentuk dan kanal tersebut sudah tersedia pada rencana komunikasi ini.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_media_komunikasi (
                rencana_komunikasi_id,
                bentuk_media,
                kanal_komunikasi,
                keterangan
            )
            VALUES (?, ?, ?, ?)
            `,
            [
                Number(
                    rencana_komunikasi_id
                ),

                bentuk_media.trim(),

                kanal_komunikasi.trim(),

                normalizeOptionalText(
                    keterangan
                )
            ]
        );


        return res.status(201).json({
            message:
                'Media komunikasi berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createMediaKomunikasi error:',
            error
        );


        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Media dengan bentuk dan kanal tersebut sudah tersedia pada rencana komunikasi ini.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat media komunikasi.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/media-komunikasi/:id
// =====================================================

exports.updateMediaKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID media komunikasi tidak valid.'
        });
    }


    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'rencana_komunikasi_id'
        )
    ) {
        return res.status(400).json({
            message:
                'rencana_komunikasi_id tidak boleh diubah.'
        });
    }


    const validationError =
        validateMediaKomunikasi(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [existingRows] =
            await db.query(
                `
                SELECT *
                FROM mrp_media_komunikasi
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );


        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Media komunikasi tidak ditemukan.'
            });
        }


        const existing =
            existingRows[0];


        const bentukMedia =
            req.body.bentuk_media !==
            undefined
                ? req.body.bentuk_media.trim()
                : existing.bentuk_media;


        const kanalKomunikasi =
            req.body.kanal_komunikasi !==
            undefined
                ? req.body
                    .kanal_komunikasi
                    .trim()
                : existing.kanal_komunikasi;


        const keteranganFinal =
            req.body.keterangan !== undefined
                ? normalizeOptionalText(
                    req.body.keterangan
                )
                : existing.keterangan;


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_media_komunikasi
                WHERE
                    rencana_komunikasi_id = ?
                    AND bentuk_media = ?
                    AND kanal_komunikasi = ?
                    AND id <> ?
                LIMIT 1
                `,
                [
                    existing
                        .rencana_komunikasi_id,
                    bentukMedia,
                    kanalKomunikasi,
                    id
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Media dengan bentuk dan kanal tersebut sudah tersedia pada rencana komunikasi ini.'
            });
        }


        await db.query(
            `
            UPDATE mrp_media_komunikasi
            SET
                bentuk_media = ?,
                kanal_komunikasi = ?,
                keterangan = ?
            WHERE id = ?
            `,
            [
                bentukMedia,
                kanalKomunikasi,
                keteranganFinal,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Media komunikasi berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateMediaKomunikasi error:',
            error
        );


        if (
            error.code === 'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Media dengan bentuk dan kanal tersebut sudah tersedia pada rencana komunikasi ini.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui media komunikasi.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/media-komunikasi/:id
// =====================================================

exports.deleteMediaKomunikasi = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID media komunikasi tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_media_komunikasi
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Media komunikasi tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Media komunikasi berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteMediaKomunikasi error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus media komunikasi.'
        });
    }
};

// =====================================================
// MRP 1A - KATALOG LAYANAN TERKAIT
// =====================================================

const katalogLayananTerkaitSelectQuery = `
    SELECT
        kt.id,
        kt.katalog_layanan_id,
        kt.layanan_terkait_id,
        kt.keterangan,
        kt.created_at,

        k.layanan_id AS layanan_utama_id,

        lu.kode_layanan AS kode_layanan_utama,
        lu.nama_layanan AS nama_layanan_utama,

        lt.kode_layanan AS kode_layanan_terkait,
        lt.nama_layanan AS nama_layanan_terkait

    FROM mrp_katalog_layanan_terkait kt

    JOIN mrp_katalog_layanan k
        ON k.id = kt.katalog_layanan_id

    JOIN layanan_digital lu
        ON lu.id = k.layanan_id

    JOIN layanan_digital lt
        ON lt.id = kt.layanan_terkait_id
`;


// =====================================================
// VALIDASI KATALOG LAYANAN TERKAIT
// =====================================================

const validateKatalogLayananTerkait = (
    body,
    isCreate = true
) => {
    const {
        katalog_layanan_id,
        layanan_terkait_id,
        keterangan
    } = body;


    if (
        isCreate &&
        !isPositiveInteger(
            katalog_layanan_id
        )
    ) {
        return (
            'katalog_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        layanan_terkait_id !== undefined &&
        !isPositiveInteger(
            layanan_terkait_id
        )
    ) {
        return (
            'layanan_terkait_id harus berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        layanan_terkait_id === undefined
    ) {
        return (
            'layanan_terkait_id wajib diisi.'
        );
    }


    if (
        keterangan !== undefined &&
        keterangan !== null &&
        typeof keterangan !== 'string'
    ) {
        return (
            'keterangan harus berupa teks.'
        );
    }


    if (
        typeof keterangan === 'string' &&
        keterangan.trim().length > 255
    ) {
        return (
            'keterangan maksimal 255 karakter.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/katalog-layanan-terkait
// =====================================================

exports.getAllKatalogLayananTerkait = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${katalogLayananTerkaitSelectQuery}

            ORDER BY kt.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllKatalogLayananTerkait error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil layanan terkait.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/katalog-layanan-terkait/:id
// =====================================================

exports.getKatalogLayananTerkaitById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan terkait tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${katalogLayananTerkaitSelectQuery}

            WHERE kt.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Layanan terkait tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getKatalogLayananTerkaitById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil layanan terkait.'
        });
    }
};


// =====================================================
// GET BERDASARKAN KATALOG
// GET /api/relasi-pengguna/katalog-layanan/:id/layanan-terkait
// =====================================================

exports.getLayananTerkaitByKatalog = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID katalog layanan tidak valid.'
        });
    }


    try {
        const [katalog] = await db.query(
            `
            SELECT id
            FROM mrp_katalog_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (katalog.length === 0) {
            return res.status(404).json({
                message:
                    'Katalog layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${katalogLayananTerkaitSelectQuery}

            WHERE kt.katalog_layanan_id = ?

            ORDER BY kt.id DESC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getLayananTerkaitByKatalog error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil layanan terkait.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/katalog-layanan-terkait
// =====================================================

exports.createKatalogLayananTerkait = async (
    req,
    res
) => {
    const validationError =
        validateKatalogLayananTerkait(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        katalog_layanan_id,
        layanan_terkait_id,
        keterangan
    } = req.body;


    try {
        // =============================================
        // CEK KATALOG
        // =============================================

        const [katalog] = await db.query(
            `
            SELECT id
            FROM mrp_katalog_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [katalog_layanan_id]
        );


        if (katalog.length === 0) {
            return res.status(400).json({
                message:
                    'katalog_layanan_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK LAYANAN TERKAIT
        // =============================================

        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [layanan_terkait_id]
        );


        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_terkait_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_katalog_layanan_terkait
            WHERE
                katalog_layanan_id = ?
                AND layanan_terkait_id = ?
            LIMIT 1
            `,
            [
                katalog_layanan_id,
                layanan_terkait_id
            ]
        );


        if (existing.length > 0) {
            return res.status(409).json({
                message:
                    'Layanan tersebut sudah terdaftar sebagai layanan terkait pada katalog ini.'
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO mrp_katalog_layanan_terkait (
                katalog_layanan_id,
                layanan_terkait_id,
                keterangan
            )
            VALUES (?, ?, ?)
            `,
            [
                Number(
                    katalog_layanan_id
                ),

                Number(
                    layanan_terkait_id
                ),

                normalizeOptionalText(
                    keterangan
                )
            ]
        );


        return res.status(201).json({
            message:
                'Layanan terkait berhasil ditambahkan.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createKatalogLayananTerkait error:',
            error
        );


        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Layanan tersebut sudah terdaftar sebagai layanan terkait pada katalog ini.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menambahkan layanan terkait.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/katalog-layanan-terkait/:id
// =====================================================

exports.updateKatalogLayananTerkait = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan terkait tidak valid.'
        });
    }


    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'katalog_layanan_id'
        )
    ) {
        return res.status(400).json({
            message:
                'katalog_layanan_id tidak boleh diubah.'
        });
    }


    const validationError =
        validateKatalogLayananTerkait(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [existingRows] =
            await db.query(
                `
                SELECT *
                FROM mrp_katalog_layanan_terkait
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );


        if (
            existingRows.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Layanan terkait tidak ditemukan.'
            });
        }


        const existing =
            existingRows[0];


        const layananTerkaitId =
            req.body.layanan_terkait_id !==
            undefined
                ? Number(
                    req.body
                        .layanan_terkait_id
                )
                : existing
                    .layanan_terkait_id;


        if (
            req.body.layanan_terkait_id !==
            undefined
        ) {
            const [layanan] =
                await db.query(
                    `
                    SELECT id
                    FROM layanan_digital
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [layananTerkaitId]
                );


            if (layanan.length === 0) {
                return res.status(400).json({
                    message:
                        'layanan_terkait_id tidak ditemukan.'
                });
            }
        }


        const keteranganFinal =
            req.body.keterangan !== undefined
                ? normalizeOptionalText(
                    req.body.keterangan
                )
                : existing.keterangan;


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_katalog_layanan_terkait
                WHERE
                    katalog_layanan_id = ?
                    AND layanan_terkait_id = ?
                    AND id <> ?
                LIMIT 1
                `,
                [
                    existing
                        .katalog_layanan_id,
                    layananTerkaitId,
                    id
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Layanan tersebut sudah terdaftar sebagai layanan terkait pada katalog ini.'
            });
        }


        await db.query(
            `
            UPDATE mrp_katalog_layanan_terkait
            SET
                layanan_terkait_id = ?,
                keterangan = ?
            WHERE id = ?
            `,
            [
                layananTerkaitId,
                keteranganFinal,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Layanan terkait berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateKatalogLayananTerkait error:',
            error
        );


        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'Layanan tersebut sudah terdaftar sebagai layanan terkait pada katalog ini.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui layanan terkait.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/katalog-layanan-terkait/:id
// =====================================================

exports.deleteKatalogLayananTerkait = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan terkait tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_katalog_layanan_terkait
            WHERE id = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Layanan terkait tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Layanan terkait berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteKatalogLayananTerkait error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus layanan terkait.'
        });
    }
};

// =====================================================
// MRP 2 - PERMINTAAN LAYANAN / SERVICE REQUEST
// =====================================================

const permintaanLayananSelectQuery = `
    SELECT
        p.id,
        p.kode_request,

        p.pengguna_id,
        u.nama AS nama_pengguna,

        p.layanan_id,
        l.kode_layanan,
        l.nama_layanan,

        p.standar_layanan_id,
        s.versi AS versi_standar,
        s.status AS status_standar,

        p.waktu_masuk,
        p.cakupan_layanan_terkait,
        p.email_pelapor,
        p.nomor_hp_pelapor,
        p.kanal_masuk,
        p.url_persyaratan_bukti,
        p.deskripsi_permintaan,
        p.urgensi,
        p.status,

        p.created_by,
        cb.nama AS dibuat_oleh,

        p.created_at,
        p.updated_at

    FROM mrp_permintaan_layanan p

    LEFT JOIN users u
        ON u.id = p.pengguna_id

    JOIN layanan_digital l
        ON l.id = p.layanan_id

    LEFT JOIN mrp_standar_layanan s
        ON s.id = p.standar_layanan_id

    JOIN users cb
        ON cb.id = p.created_by
`;


// =====================================================
// VALIDASI PERMINTAAN LAYANAN
// =====================================================

const validatePermintaanLayanan = (
    body,
    isCreate = true
) => {
    const {
        kode_request,
        pengguna_id,
        layanan_id,
        standar_layanan_id,
        waktu_masuk,
        cakupan_layanan_terkait,
        email_pelapor,
        nomor_hp_pelapor,
        kanal_masuk,
        url_persyaratan_bukti,
        deskripsi_permintaan,
        urgensi,
        status
    } = body;


    if (
        kode_request !== undefined &&
        (
            typeof kode_request !== 'string' ||
            kode_request.trim() === ''
        )
    ) {
        return (
            'kode_request wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        kode_request === undefined
    ) {
        return 'kode_request wajib diisi.';
    }

    if (
        typeof kode_request === 'string' &&
        kode_request.trim().length > 50
    ) {
        return (
            'kode_request maksimal 50 karakter.'
        );
    }


    if (
        pengguna_id !== undefined &&
        pengguna_id !== null &&
        pengguna_id !== '' &&
        !isPositiveInteger(pengguna_id)
    ) {
        return (
            'pengguna_id harus berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        !isPositiveInteger(layanan_id)
    ) {
        return (
            'layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        standar_layanan_id !== undefined &&
        standar_layanan_id !== null &&
        standar_layanan_id !== '' &&
        !isPositiveInteger(
            standar_layanan_id
        )
    ) {
        return (
            'standar_layanan_id harus berupa ID yang valid.'
        );
    }


    if (
        waktu_masuk !== undefined &&
        (
            typeof waktu_masuk !== 'string' ||
            waktu_masuk.trim() === ''
        )
    ) {
        return (
            'waktu_masuk wajib berupa tanggal dan waktu.'
        );
    }

    if (
        isCreate &&
        waktu_masuk === undefined
    ) {
        return 'waktu_masuk wajib diisi.';
    }


    if (
        cakupan_layanan_terkait !== undefined &&
        cakupan_layanan_terkait !== null &&
        typeof cakupan_layanan_terkait !==
            'string'
    ) {
        return (
            'cakupan_layanan_terkait harus berupa teks.'
        );
    }

    if (
        typeof cakupan_layanan_terkait ===
            'string' &&
        cakupan_layanan_terkait.trim().length >
            255
    ) {
        return (
            'cakupan_layanan_terkait maksimal 255 karakter.'
        );
    }


    if (
        email_pelapor !== undefined &&
        email_pelapor !== null &&
        typeof email_pelapor !== 'string'
    ) {
        return (
            'email_pelapor harus berupa teks.'
        );
    }

    if (
        typeof email_pelapor === 'string' &&
        email_pelapor.trim().length > 100
    ) {
        return (
            'email_pelapor maksimal 100 karakter.'
        );
    }


    if (
        nomor_hp_pelapor !== undefined &&
        nomor_hp_pelapor !== null &&
        typeof nomor_hp_pelapor !== 'string'
    ) {
        return (
            'nomor_hp_pelapor harus berupa teks.'
        );
    }

    if (
        typeof nomor_hp_pelapor === 'string' &&
        nomor_hp_pelapor.trim().length > 30
    ) {
        return (
            'nomor_hp_pelapor maksimal 30 karakter.'
        );
    }


    if (
        kanal_masuk !== undefined &&
        (
            typeof kanal_masuk !== 'string' ||
            kanal_masuk.trim() === ''
        )
    ) {
        return (
            'kanal_masuk wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        kanal_masuk === undefined
    ) {
        return 'kanal_masuk wajib diisi.';
    }

    if (
        typeof kanal_masuk === 'string' &&
        kanal_masuk.trim().length > 100
    ) {
        return (
            'kanal_masuk maksimal 100 karakter.'
        );
    }


    if (
        url_persyaratan_bukti !== undefined &&
        url_persyaratan_bukti !== null &&
        typeof url_persyaratan_bukti !==
            'string'
    ) {
        return (
            'url_persyaratan_bukti harus berupa teks.'
        );
    }

    if (
        typeof url_persyaratan_bukti ===
            'string' &&
        url_persyaratan_bukti.trim().length >
            255
    ) {
        return (
            'url_persyaratan_bukti maksimal 255 karakter.'
        );
    }


    if (
        deskripsi_permintaan !== undefined &&
        (
            typeof deskripsi_permintaan !==
                'string' ||
            deskripsi_permintaan.trim() === ''
        )
    ) {
        return (
            'deskripsi_permintaan wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        deskripsi_permintaan === undefined
    ) {
        return (
            'deskripsi_permintaan wajib diisi.'
        );
    }


    if (
        urgensi !== undefined &&
        ![
            'Rendah',
            'Sedang',
            'Tinggi'
        ].includes(urgensi)
    ) {
        return (
            'urgensi harus Rendah, Sedang, atau Tinggi.'
        );
    }


    if (
        status !== undefined &&
        ![
            'Diajukan',
            'Diverifikasi',
            'Ditugaskan',
            'Diproses',
            'Selesai',
            'Ditolak',
            'Dibatalkan'
        ].includes(status)
    ) {
        return (
            'status permintaan layanan tidak valid.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// =====================================================

exports.getAllPermintaanLayanan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${permintaanLayananSelectQuery}
            ORDER BY p.waktu_masuk DESC, p.id DESC
        `);

        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllPermintaanLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil permintaan layanan.'
        });
    }
};


// =====================================================
// GET DETAIL
// =====================================================

exports.getPermintaanLayananById = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID permintaan layanan tidak valid.'
        });
    }

    try {
        const [rows] = await db.query(
            `
            ${permintaanLayananSelectQuery}
            WHERE p.id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Permintaan layanan tidak ditemukan.'
            });
        }

        return res.status(200).json(rows[0]);

    } catch (error) {
        console.error(
            'getPermintaanLayananById error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil permintaan layanan.'
        });
    }
};


// =====================================================
// CREATE
// =====================================================

exports.createPermintaanLayanan = async (
    req,
    res
) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validatePermintaanLayanan(
            req.body,
            true
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        kode_request,
        pengguna_id,
        layanan_id,
        standar_layanan_id,
        waktu_masuk,
        cakupan_layanan_terkait,
        email_pelapor,
        nomor_hp_pelapor,
        kanal_masuk,
        url_persyaratan_bukti,
        deskripsi_permintaan,
        urgensi,
        status
    } = req.body;


    try {
        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [layanan_id]
        );

        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        if (
            pengguna_id !== undefined &&
            pengguna_id !== null &&
            pengguna_id !== ''
        ) {
            const [pengguna] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [pengguna_id]
                );

            if (
                pengguna.length === 0
            ) {
                return res.status(400).json({
                    message:
                        'pengguna_id tidak ditemukan.'
                });
            }
        }


        if (
            standar_layanan_id !==
                undefined &&
            standar_layanan_id !== null &&
            standar_layanan_id !== ''
        ) {
            const [standar] =
                await db.query(
                    `
                    SELECT id, katalog_layanan_id
                    FROM mrp_standar_layanan
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [standar_layanan_id]
                );

            if (
                standar.length === 0
            ) {
                return res.status(400).json({
                    message:
                        'standar_layanan_id tidak ditemukan.'
                });
            }
        }


        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_permintaan_layanan
                WHERE kode_request = ?
                LIMIT 1
                `,
                [kode_request.trim()]
            );

        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'kode_request sudah digunakan.'
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO mrp_permintaan_layanan (
                kode_request,
                pengguna_id,
                layanan_id,
                standar_layanan_id,
                waktu_masuk,
                cakupan_layanan_terkait,
                email_pelapor,
                nomor_hp_pelapor,
                kanal_masuk,
                url_persyaratan_bukti,
                deskripsi_permintaan,
                urgensi,
                status,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                kode_request.trim(),

                (
                    pengguna_id === undefined ||
                    pengguna_id === null ||
                    pengguna_id === ''
                )
                    ? null
                    : Number(pengguna_id),

                Number(layanan_id),

                (
                    standar_layanan_id ===
                        undefined ||
                    standar_layanan_id === null ||
                    standar_layanan_id === ''
                )
                    ? null
                    : Number(
                        standar_layanan_id
                    ),

                waktu_masuk.trim(),

                normalizeOptionalText(
                    cakupan_layanan_terkait
                ),

                normalizeOptionalText(
                    email_pelapor
                ),

                normalizeOptionalText(
                    nomor_hp_pelapor
                ),

                kanal_masuk.trim(),

                normalizeOptionalText(
                    url_persyaratan_bukti
                ),

                deskripsi_permintaan.trim(),

                urgensi || 'Rendah',

                status || 'Diajukan',

                req.user.id
            ]
        );


        return res.status(201).json({
            message:
                'Permintaan layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createPermintaanLayanan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'kode_request sudah digunakan.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat permintaan layanan.'
        });
    }
};


// =====================================================
// UPDATE
// =====================================================

exports.updatePermintaanLayanan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID permintaan layanan tidak valid.'
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
                'created_by tidak boleh diubah.'
        });
    }


    const validationError =
        validatePermintaanLayanan(
            req.body,
            false
        );

    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_permintaan_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );

        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Permintaan layanan tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            kode_request:
                req.body.kode_request !== undefined
                    ? req.body.kode_request.trim()
                    : existing.kode_request,

            pengguna_id:
                req.body.pengguna_id !== undefined
                    ? (
                        req.body.pengguna_id === null ||
                        req.body.pengguna_id === ''
                            ? null
                            : Number(
                                req.body.pengguna_id
                            )
                    )
                    : existing.pengguna_id,

            layanan_id:
                req.body.layanan_id !== undefined
                    ? Number(
                        req.body.layanan_id
                    )
                    : existing.layanan_id,

            standar_layanan_id:
                req.body.standar_layanan_id !==
                undefined
                    ? (
                        req.body
                            .standar_layanan_id ===
                            null ||
                        req.body
                            .standar_layanan_id === ''
                            ? null
                            : Number(
                                req.body
                                    .standar_layanan_id
                            )
                    )
                    : existing
                        .standar_layanan_id,

            waktu_masuk:
                req.body.waktu_masuk !== undefined
                    ? req.body.waktu_masuk.trim()
                    : existing.waktu_masuk,

            cakupan_layanan_terkait:
                req.body
                    .cakupan_layanan_terkait !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .cakupan_layanan_terkait
                    )
                    : existing
                        .cakupan_layanan_terkait,

            email_pelapor:
                req.body.email_pelapor !== undefined
                    ? normalizeOptionalText(
                        req.body.email_pelapor
                    )
                    : existing.email_pelapor,

            nomor_hp_pelapor:
                req.body.nomor_hp_pelapor !==
                undefined
                    ? normalizeOptionalText(
                        req.body.nomor_hp_pelapor
                    )
                    : existing.nomor_hp_pelapor,

            kanal_masuk:
                req.body.kanal_masuk !== undefined
                    ? req.body.kanal_masuk.trim()
                    : existing.kanal_masuk,

            url_persyaratan_bukti:
                req.body.url_persyaratan_bukti !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .url_persyaratan_bukti
                    )
                    : existing
                        .url_persyaratan_bukti,

            deskripsi_permintaan:
                req.body.deskripsi_permintaan !==
                undefined
                    ? req.body
                        .deskripsi_permintaan
                        .trim()
                    : existing
                        .deskripsi_permintaan,

            urgensi:
                req.body.urgensi !== undefined
                    ? req.body.urgensi
                    : existing.urgensi,

            status:
                req.body.status !== undefined
                    ? req.body.status
                    : existing.status
        };


        if (!isPositiveInteger(final.layanan_id)) {
            return res.status(400).json({
                message:
                    'layanan_id harus berupa ID yang valid.'
            });
        }


        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [final.layanan_id]
        );

        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        if (final.pengguna_id !== null) {
            const [pengguna] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [final.pengguna_id]
                );

            if (
                pengguna.length === 0
            ) {
                return res.status(400).json({
                    message:
                        'pengguna_id tidak ditemukan.'
                });
            }
        }


        if (
            final.standar_layanan_id !== null
        ) {
            const [standar] =
                await db.query(
                    `
                    SELECT id
                    FROM mrp_standar_layanan
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        final
                            .standar_layanan_id
                    ]
                );

            if (
                standar.length === 0
            ) {
                return res.status(400).json({
                    message:
                        'standar_layanan_id tidak ditemukan.'
                });
            }
        }


        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_permintaan_layanan
                WHERE kode_request = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    final.kode_request,
                    id
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'kode_request sudah digunakan.'
            });
        }


        await db.query(
            `
            UPDATE mrp_permintaan_layanan
            SET
                kode_request = ?,
                pengguna_id = ?,
                layanan_id = ?,
                standar_layanan_id = ?,
                waktu_masuk = ?,
                cakupan_layanan_terkait = ?,
                email_pelapor = ?,
                nomor_hp_pelapor = ?,
                kanal_masuk = ?,
                url_persyaratan_bukti = ?,
                deskripsi_permintaan = ?,
                urgensi = ?,
                status = ?
            WHERE id = ?
            `,
            [
                final.kode_request,
                final.pengguna_id,
                final.layanan_id,
                final.standar_layanan_id,
                final.waktu_masuk,
                final.cakupan_layanan_terkait,
                final.email_pelapor,
                final.nomor_hp_pelapor,
                final.kanal_masuk,
                final.url_persyaratan_bukti,
                final.deskripsi_permintaan,
                final.urgensi,
                final.status,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Permintaan layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updatePermintaanLayanan error:',
            error
        );

        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'kode_request sudah digunakan.'
            });
        }

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui permintaan layanan.'
        });
    }
};


// =====================================================
// DELETE
// =====================================================

exports.deletePermintaanLayanan = async (
    req,
    res
) => {
    const { id } = req.params;

    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID permintaan layanan tidak valid.'
        });
    }

    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_permintaan_layanan
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Permintaan layanan tidak ditemukan.'
            });
        }

        return res.status(200).json({
            message:
                'Permintaan layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deletePermintaanLayanan error:',
            error
        );

        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus permintaan layanan.'
        });
    }
};

// =====================================================
// MRP 2 - TANGGAPAN PERMINTAAN LAYANAN
// =====================================================

const tanggapanPermintaanSelectQuery = `
    SELECT
        t.id,
        t.permintaan_layanan_id,

        p.kode_request,
        p.layanan_id,
        l.kode_layanan,
        l.nama_layanan,
        p.status AS status_permintaan,

        t.pic_id,
        pic.nama AS nama_pic,

        t.jenis_tindakan,
        t.tindakan,
        t.status_setelah,
        t.waktu_update,
        t.catatan,

        t.dicatat_oleh,
        pencatat.nama AS nama_pencatat,

        t.created_at

    FROM mrp_tanggapan_permintaan t

    JOIN mrp_permintaan_layanan p
        ON p.id = t.permintaan_layanan_id

    JOIN layanan_digital l
        ON l.id = p.layanan_id

    JOIN users pic
        ON pic.id = t.pic_id

    JOIN users pencatat
        ON pencatat.id = t.dicatat_oleh
`;


// =====================================================
// VALIDASI TANGGAPAN PERMINTAAN
// =====================================================

const validateTanggapanPermintaan = (
    body
) => {
    const {
        permintaan_layanan_id,
        pic_id,
        jenis_tindakan,
        tindakan,
        status_setelah,
        catatan
    } = body;


    if (
        !isPositiveInteger(
            permintaan_layanan_id
        )
    ) {
        return (
            'permintaan_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (!isPositiveInteger(pic_id)) {
        return (
            'pic_id wajib berupa ID yang valid.'
        );
    }


    if (
        ![
            'Verifikasi',
            'Penugasan',
            'Respons',
            'Proses',
            'Penyelesaian',
            'Penolakan',
            'Pembatalan',
            'Lainnya'
        ].includes(jenis_tindakan)
    ) {
        return (
            'jenis_tindakan tidak valid.'
        );
    }


    if (
        typeof tindakan !== 'string' ||
        tindakan.trim() === ''
    ) {
        return (
            'tindakan wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        ![
            'Diajukan',
            'Diverifikasi',
            'Ditugaskan',
            'Diproses',
            'Selesai',
            'Ditolak',
            'Dibatalkan'
        ].includes(status_setelah)
    ) {
        return (
            'status_setelah tidak valid.'
        );
    }


    if (
        catatan !== undefined &&
        catatan !== null &&
        typeof catatan !== 'string'
    ) {
        return (
            'catatan harus berupa teks.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/tanggapan-permintaan
// =====================================================

exports.getAllTanggapanPermintaan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${tanggapanPermintaanSelectQuery}

            ORDER BY
                t.waktu_update DESC,
                t.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllTanggapanPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil tanggapan permintaan.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/tanggapan-permintaan/:id
// =====================================================

exports.getTanggapanPermintaanById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID tanggapan permintaan tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${tanggapanPermintaanSelectQuery}

            WHERE t.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Tanggapan permintaan tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getTanggapanPermintaanById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil tanggapan permintaan.'
        });
    }
};


// =====================================================
// GET BERDASARKAN PERMINTAAN LAYANAN
// GET /api/relasi-pengguna/permintaan-layanan/:id/tanggapan
// =====================================================

exports.getTanggapanByPermintaan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID permintaan layanan tidak valid.'
        });
    }


    try {
        const [permintaan] =
            await db.query(
                `
                SELECT id
                FROM mrp_permintaan_layanan
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );


        if (
            permintaan.length === 0
        ) {
            return res.status(404).json({
                message:
                    'Permintaan layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${tanggapanPermintaanSelectQuery}

            WHERE
                t.permintaan_layanan_id = ?

            ORDER BY
                t.waktu_update ASC,
                t.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getTanggapanByPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil riwayat tanggapan permintaan.'
        });
    }
};


// =====================================================
// CREATE TANGGAPAN
// POST /api/relasi-pengguna/tanggapan-permintaan
// =====================================================

exports.createTanggapanPermintaan = async (
    req,
    res
) => {
    // Field audit tidak boleh dikendalikan frontend.
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'dicatat_oleh'
        ) ||
        Object.prototype.hasOwnProperty.call(
            req.body,
            'waktu_update'
        )
    ) {
        return res.status(400).json({
            message:
                'dicatat_oleh dan waktu_update tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validateTanggapanPermintaan(
            req.body
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        permintaan_layanan_id,
        pic_id,
        jenis_tindakan,
        tindakan,
        status_setelah,
        catatan
    } = req.body;


    let connection = null;
    let transactionStarted = false;


    try {
        // Mendukung db berbentuk mysql2 pool maupun connection.
        if (
            typeof db.getConnection ===
            'function'
        ) {
            connection =
                await db.getConnection();
        } else {
            connection = db;
        }


        if (
            typeof connection
                .beginTransaction ===
            'function'
        ) {
            await connection
                .beginTransaction();

            transactionStarted = true;
        }


        // =============================================
        // CEK PERMINTAAN LAYANAN
        // =============================================

        const [permintaan] =
            await connection.query(
                `
                SELECT
                    id,
                    status
                FROM mrp_permintaan_layanan
                WHERE id = ?
                LIMIT 1
                `,
                [permintaan_layanan_id]
            );


        if (
            permintaan.length === 0
        ) {
            if (transactionStarted) {
                await connection.rollback();
                transactionStarted = false;
            }

            return res.status(400).json({
                message:
                    'permintaan_layanan_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK PIC
        // =============================================

        const [pic] =
            await connection.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [pic_id]
            );


        if (pic.length === 0) {
            if (transactionStarted) {
                await connection.rollback();
                transactionStarted = false;
            }

            return res.status(400).json({
                message:
                    'pic_id tidak ditemukan.'
            });
        }


        // =============================================
        // INSERT RIWAYAT TANGGAPAN
        // =============================================

        const [result] =
            await connection.query(
                `
                INSERT INTO
                    mrp_tanggapan_permintaan (
                        permintaan_layanan_id,
                        pic_id,
                        jenis_tindakan,
                        tindakan,
                        status_setelah,
                        waktu_update,
                        catatan,
                        dicatat_oleh
                    )
                VALUES (
                    ?, ?, ?, ?, ?,
                    CURRENT_TIMESTAMP,
                    ?, ?
                )
                `,
                [
                    Number(
                        permintaan_layanan_id
                    ),

                    Number(pic_id),

                    jenis_tindakan,

                    tindakan.trim(),

                    status_setelah,

                    normalizeOptionalText(
                        catatan
                    ),

                    req.user.id
                ]
            );


        // =============================================
        // SINKRONKAN STATUS SERVICE REQUEST
        // =============================================

        await connection.query(
            `
            UPDATE mrp_permintaan_layanan
            SET status = ?
            WHERE id = ?
            `,
            [
                status_setelah,
                permintaan_layanan_id
            ]
        );


        if (transactionStarted) {
            await connection.commit();
            transactionStarted = false;
        }


        return res.status(201).json({
            message:
                'Tanggapan permintaan berhasil dicatat.',
            id: result.insertId,
            status_permintaan:
                status_setelah
        });

    } catch (error) {
        if (
            connection &&
            transactionStarted
        ) {
            try {
                await connection.rollback();
            } catch (
                rollbackError
            ) {
                console.error(
                    'rollback createTanggapanPermintaan error:',
                    rollbackError
                );
            }
        }


        console.error(
            'createTanggapanPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mencatat tanggapan permintaan.'
        });

    } finally {
        if (
            connection &&
            connection !== db &&
            typeof connection.release ===
                'function'
        ) {
            connection.release();
        }
    }
};

// =====================================================
// MRP 3A - MANAJEMEN KUERI
// =====================================================

const kueriSelectQuery = `
    SELECT
        q.id,
        q.kode_kueri,
        q.waktu_masuk,

        q.layanan_id,
        l.kode_layanan,
        l.nama_layanan,

        q.target_kueri_id,
        tk.prioritas AS prioritas_target,
        tk.sla_waktu_respon_menit,
        tk.sla_waktu_penyelesaian_menit,
        tk.ola_waktu_respon_menit,
        tk.ola_waktu_penyelesaian_menit,

        q.cakupan_layanan_terkait,

        q.pengguna_id,
        u.nama AS nama_pengguna,

        q.email_pelapor,
        q.nomor_hp_pelapor,
        q.kanal_masuk,

        q.judul,
        q.jenis,
        q.deskripsi,
        q.bukti_tambahan,
        q.url_bukti,

        q.urgensi,
        q.status,

        q.created_by,
        cb.nama AS dibuat_oleh,

        q.created_at,
        q.updated_at

    FROM mrp_kueri q

    JOIN layanan_digital l
        ON l.id = q.layanan_id

    LEFT JOIN mrp_target_kueri_insiden tk
        ON tk.id = q.target_kueri_id

    LEFT JOIN users u
        ON u.id = q.pengguna_id

    JOIN users cb
        ON cb.id = q.created_by
`;


// =====================================================
// VALIDASI KUERI
// =====================================================

const validateKueri = (
    body,
    isCreate = true
) => {
    const {
        kode_kueri,
        waktu_masuk,
        layanan_id,
        target_kueri_id,
        cakupan_layanan_terkait,
        pengguna_id,
        email_pelapor,
        nomor_hp_pelapor,
        kanal_masuk,
        judul,
        jenis,
        deskripsi,
        bukti_tambahan,
        url_bukti,
        urgensi,
        status
    } = body;


    if (
        kode_kueri !== undefined &&
        (
            typeof kode_kueri !== 'string' ||
            kode_kueri.trim() === ''
        )
    ) {
        return (
            'kode_kueri wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        kode_kueri === undefined
    ) {
        return 'kode_kueri wajib diisi.';
    }

    if (
        typeof kode_kueri === 'string' &&
        kode_kueri.trim().length > 50
    ) {
        return (
            'kode_kueri maksimal 50 karakter.'
        );
    }


    if (
        waktu_masuk !== undefined &&
        (
            typeof waktu_masuk !== 'string' ||
            waktu_masuk.trim() === ''
        )
    ) {
        return (
            'waktu_masuk wajib berupa tanggal dan waktu.'
        );
    }

    if (
        isCreate &&
        waktu_masuk === undefined
    ) {
        return 'waktu_masuk wajib diisi.';
    }


    if (
        isCreate &&
        !isPositiveInteger(layanan_id)
    ) {
        return (
            'layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        target_kueri_id !== undefined &&
        target_kueri_id !== null &&
        target_kueri_id !== '' &&
        !isPositiveInteger(target_kueri_id)
    ) {
        return (
            'target_kueri_id harus berupa ID yang valid.'
        );
    }


    if (
        pengguna_id !== undefined &&
        pengguna_id !== null &&
        pengguna_id !== '' &&
        !isPositiveInteger(pengguna_id)
    ) {
        return (
            'pengguna_id harus berupa ID yang valid.'
        );
    }


    const optionalLengths = [
        [
            'cakupan_layanan_terkait',
            cakupan_layanan_terkait,
            255
        ],
        [
            'email_pelapor',
            email_pelapor,
            100
        ],
        [
            'nomor_hp_pelapor',
            nomor_hp_pelapor,
            30
        ],
        [
            'url_bukti',
            url_bukti,
            255
        ]
    ];


    for (
        const [
            field,
            value,
            max
        ] of optionalLengths
    ) {
        if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'string'
        ) {
            return `${field} harus berupa teks.`;
        }

        if (
            typeof value === 'string' &&
            value.trim().length > max
        ) {
            return (
                `${field} maksimal ${max} karakter.`
            );
        }
    }


    if (
        kanal_masuk !== undefined &&
        (
            typeof kanal_masuk !== 'string' ||
            kanal_masuk.trim() === ''
        )
    ) {
        return (
            'kanal_masuk wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        kanal_masuk === undefined
    ) {
        return 'kanal_masuk wajib diisi.';
    }

    if (
        typeof kanal_masuk === 'string' &&
        kanal_masuk.trim().length > 100
    ) {
        return (
            'kanal_masuk maksimal 100 karakter.'
        );
    }


    if (
        judul !== undefined &&
        (
            typeof judul !== 'string' ||
            judul.trim() === ''
        )
    ) {
        return (
            'judul wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        judul === undefined
    ) {
        return 'judul wajib diisi.';
    }

    if (
        typeof judul === 'string' &&
        judul.trim().length > 200
    ) {
        return (
            'judul maksimal 200 karakter.'
        );
    }


    if (
        jenis !== undefined &&
        ![
            'Pertanyaan',
            'Pelaporan',
            'Masukan',
            'Keluhan'
        ].includes(jenis)
    ) {
        return (
            'jenis harus Pertanyaan, Pelaporan, Masukan, atau Keluhan.'
        );
    }

    if (
        isCreate &&
        jenis === undefined
    ) {
        return 'jenis wajib diisi.';
    }


    if (
        deskripsi !== undefined &&
        (
            typeof deskripsi !== 'string' ||
            deskripsi.trim() === ''
        )
    ) {
        return (
            'deskripsi wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        deskripsi === undefined
    ) {
        return 'deskripsi wajib diisi.';
    }


    if (
        bukti_tambahan !== undefined &&
        bukti_tambahan !== null &&
        typeof bukti_tambahan !== 'string'
    ) {
        return (
            'bukti_tambahan harus berupa teks.'
        );
    }


    if (
        urgensi !== undefined &&
        ![
            'Rendah',
            'Sedang',
            'Tinggi'
        ].includes(urgensi)
    ) {
        return (
            'urgensi harus Rendah, Sedang, atau Tinggi.'
        );
    }


    if (
        status !== undefined &&
        ![
            'Diterima',
            'Ditugaskan',
            'Diproses',
            'Dieskalasi',
            'Selesai',
            'Ditutup',
            'Dibatalkan'
        ].includes(status)
    ) {
        return (
            'status kueri tidak valid.'
        );
    }


    return null;
};


// =====================================================
// VALIDASI TARGET KUERI TERHADAP LAYANAN
// =====================================================

const checkTargetKueriForLayanan = async (
    connection,
    targetKueriId,
    layananId
) => {
    if (targetKueriId === null) {
        return null;
    }


    const [rows] = await connection.query(
        `
        SELECT
            t.id,
            t.jenis,
            k.layanan_id

        FROM mrp_target_kueri_insiden t

        JOIN mrp_standar_layanan s
            ON s.id = t.standar_layanan_id

        JOIN mrp_katalog_layanan k
            ON k.id = s.katalog_layanan_id

        WHERE t.id = ?
        LIMIT 1
        `,
        [targetKueriId]
    );


    if (rows.length === 0) {
        return (
            'target_kueri_id tidak ditemukan.'
        );
    }


    if (rows[0].jenis !== 'Kueri') {
        return (
            'target_kueri_id harus menggunakan target berjenis Kueri.'
        );
    }


    if (
        Number(rows[0].layanan_id) !==
        Number(layananId)
    ) {
        return (
            'target_kueri_id tidak sesuai dengan layanan yang dipilih.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/kueri
// =====================================================

exports.getAllKueri = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${kueriSelectQuery}

            ORDER BY
                q.waktu_masuk DESC,
                q.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllKueri error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data kueri.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/kueri/:id
// =====================================================

exports.getKueriById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID kueri tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${kueriSelectQuery}

            WHERE q.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Kueri tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getKueriById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data kueri.'
        });
    }
};


// =====================================================
// GET BERDASARKAN LAYANAN
// GET /api/relasi-pengguna/layanan/:id/kueri
// =====================================================

exports.getKueriByLayanan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan tidak valid.'
        });
    }


    try {
        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (layanan.length === 0) {
            return res.status(404).json({
                message:
                    'Layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${kueriSelectQuery}

            WHERE q.layanan_id = ?

            ORDER BY
                q.waktu_masuk DESC,
                q.id DESC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getKueriByLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data kueri.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/kueri
// =====================================================

exports.createKueri = async (
    req,
    res
) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validateKueri(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        kode_kueri,
        waktu_masuk,
        layanan_id,
        target_kueri_id,
        cakupan_layanan_terkait,
        pengguna_id,
        email_pelapor,
        nomor_hp_pelapor,
        kanal_masuk,
        judul,
        jenis,
        deskripsi,
        bukti_tambahan,
        url_bukti,
        urgensi,
        status
    } = req.body;


    try {
        // =============================================
        // CEK LAYANAN
        // =============================================

        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [layanan_id]
        );


        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK PENGGUNA
        // =============================================

        if (
            pengguna_id !== undefined &&
            pengguna_id !== null &&
            pengguna_id !== ''
        ) {
            const [pengguna] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [pengguna_id]
                );


            if (pengguna.length === 0) {
                return res.status(400).json({
                    message:
                        'pengguna_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // CEK TARGET KUERI
        // =============================================

        const targetKueriId =
            (
                target_kueri_id === undefined ||
                target_kueri_id === null ||
                target_kueri_id === ''
            )
                ? null
                : Number(target_kueri_id);


        const targetError =
            await checkTargetKueriForLayanan(
                db,
                targetKueriId,
                layanan_id
            );


        if (targetError) {
            return res.status(400).json({
                message: targetError
            });
        }


        // =============================================
        // CEK KODE DUPLIKAT
        // =============================================

        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_kueri
                WHERE kode_kueri = ?
                LIMIT 1
                `,
                [kode_kueri.trim()]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'kode_kueri sudah digunakan.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_kueri (
                kode_kueri,
                waktu_masuk,
                layanan_id,
                target_kueri_id,
                cakupan_layanan_terkait,
                pengguna_id,
                email_pelapor,
                nomor_hp_pelapor,
                kanal_masuk,
                judul,
                jenis,
                deskripsi,
                bukti_tambahan,
                url_bukti,
                urgensi,
                status,
                created_by
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?, ?
            )
            `,
            [
                kode_kueri.trim(),

                waktu_masuk.trim(),

                Number(layanan_id),

                targetKueriId,

                normalizeOptionalText(
                    cakupan_layanan_terkait
                ),

                (
                    pengguna_id === undefined ||
                    pengguna_id === null ||
                    pengguna_id === ''
                )
                    ? null
                    : Number(pengguna_id),

                normalizeOptionalText(
                    email_pelapor
                ),

                normalizeOptionalText(
                    nomor_hp_pelapor
                ),

                kanal_masuk.trim(),

                judul.trim(),

                jenis,

                deskripsi.trim(),

                normalizeOptionalText(
                    bukti_tambahan
                ),

                normalizeOptionalText(
                    url_bukti
                ),

                urgensi || 'Rendah',

                status || 'Diterima',

                req.user.id
            ]
        );


        return res.status(201).json({
            message:
                'Kueri berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createKueri error:',
            error
        );


        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'kode_kueri sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat kueri.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/kueri/:id
// =====================================================

exports.updateKueri = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID kueri tidak valid.'
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
                'created_by tidak boleh diubah.'
        });
    }


    const validationError =
        validateKueri(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [existingRows] =
            await db.query(
                `
                SELECT *
                FROM mrp_kueri
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );


        if (existingRows.length === 0) {
            return res.status(404).json({
                message:
                    'Kueri tidak ditemukan.'
            });
        }


        const existing =
            existingRows[0];


        const final = {
            kode_kueri:
                req.body.kode_kueri !== undefined
                    ? req.body.kode_kueri.trim()
                    : existing.kode_kueri,

            waktu_masuk:
                req.body.waktu_masuk !== undefined
                    ? req.body.waktu_masuk.trim()
                    : existing.waktu_masuk,

            layanan_id:
                req.body.layanan_id !== undefined
                    ? Number(req.body.layanan_id)
                    : existing.layanan_id,

            target_kueri_id:
                req.body.target_kueri_id !==
                undefined
                    ? (
                        req.body.target_kueri_id ===
                            null ||
                        req.body.target_kueri_id === ''
                            ? null
                            : Number(
                                req.body
                                    .target_kueri_id
                            )
                    )
                    : existing.target_kueri_id,

            cakupan_layanan_terkait:
                req.body
                    .cakupan_layanan_terkait !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .cakupan_layanan_terkait
                    )
                    : existing
                        .cakupan_layanan_terkait,

            pengguna_id:
                req.body.pengguna_id !== undefined
                    ? (
                        req.body.pengguna_id === null ||
                        req.body.pengguna_id === ''
                            ? null
                            : Number(
                                req.body.pengguna_id
                            )
                    )
                    : existing.pengguna_id,

            email_pelapor:
                req.body.email_pelapor !== undefined
                    ? normalizeOptionalText(
                        req.body.email_pelapor
                    )
                    : existing.email_pelapor,

            nomor_hp_pelapor:
                req.body.nomor_hp_pelapor !==
                undefined
                    ? normalizeOptionalText(
                        req.body.nomor_hp_pelapor
                    )
                    : existing.nomor_hp_pelapor,

            kanal_masuk:
                req.body.kanal_masuk !== undefined
                    ? req.body.kanal_masuk.trim()
                    : existing.kanal_masuk,

            judul:
                req.body.judul !== undefined
                    ? req.body.judul.trim()
                    : existing.judul,

            jenis:
                req.body.jenis !== undefined
                    ? req.body.jenis
                    : existing.jenis,

            deskripsi:
                req.body.deskripsi !== undefined
                    ? req.body.deskripsi.trim()
                    : existing.deskripsi,

            bukti_tambahan:
                req.body.bukti_tambahan !==
                undefined
                    ? normalizeOptionalText(
                        req.body.bukti_tambahan
                    )
                    : existing.bukti_tambahan,

            url_bukti:
                req.body.url_bukti !== undefined
                    ? normalizeOptionalText(
                        req.body.url_bukti
                    )
                    : existing.url_bukti,

            urgensi:
                req.body.urgensi !== undefined
                    ? req.body.urgensi
                    : existing.urgensi,

            status:
                req.body.status !== undefined
                    ? req.body.status
                    : existing.status
        };


        if (
            !isPositiveInteger(
                final.layanan_id
            )
        ) {
            return res.status(400).json({
                message:
                    'layanan_id harus berupa ID yang valid.'
            });
        }


        // =============================================
        // CEK LAYANAN
        // =============================================

        const [layanan] = await db.query(
            `
            SELECT id
            FROM layanan_digital
            WHERE id = ?
            LIMIT 1
            `,
            [final.layanan_id]
        );


        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK PENGGUNA
        // =============================================

        if (final.pengguna_id !== null) {
            const [pengguna] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [final.pengguna_id]
                );


            if (pengguna.length === 0) {
                return res.status(400).json({
                    message:
                        'pengguna_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // CEK TARGET KUERI
        // =============================================

        const targetError =
            await checkTargetKueriForLayanan(
                db,
                final.target_kueri_id,
                final.layanan_id
            );


        if (targetError) {
            return res.status(400).json({
                message: targetError
            });
        }


        // =============================================
        // CEK DUPLIKAT KODE
        // =============================================

        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_kueri
                WHERE kode_kueri = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    final.kode_kueri,
                    id
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'kode_kueri sudah digunakan.'
            });
        }


        await db.query(
            `
            UPDATE mrp_kueri
            SET
                kode_kueri = ?,
                waktu_masuk = ?,
                layanan_id = ?,
                target_kueri_id = ?,
                cakupan_layanan_terkait = ?,
                pengguna_id = ?,
                email_pelapor = ?,
                nomor_hp_pelapor = ?,
                kanal_masuk = ?,
                judul = ?,
                jenis = ?,
                deskripsi = ?,
                bukti_tambahan = ?,
                url_bukti = ?,
                urgensi = ?,
                status = ?
            WHERE id = ?
            `,
            [
                final.kode_kueri,
                final.waktu_masuk,
                final.layanan_id,
                final.target_kueri_id,
                final.cakupan_layanan_terkait,
                final.pengguna_id,
                final.email_pelapor,
                final.nomor_hp_pelapor,
                final.kanal_masuk,
                final.judul,
                final.jenis,
                final.deskripsi,
                final.bukti_tambahan,
                final.url_bukti,
                final.urgensi,
                final.status,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Kueri berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateKueri error:',
            error
        );


        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({
                message:
                    'kode_kueri sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui kueri.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/kueri/:id
// =====================================================

exports.deleteKueri = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID kueri tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_kueri
            WHERE id = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Kueri tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Kueri berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteKueri error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus kueri.'
        });
    }
};

// =====================================================
// MRP 3A - TANGGAPAN KUERI
// =====================================================

const tanggapanKueriSelectQuery = `
    SELECT
        t.id,
        t.kueri_id,

        q.kode_kueri,
        q.judul,
        q.layanan_id,
        l.kode_layanan,
        l.nama_layanan,
        q.status AS status_kueri,

        t.pic_id,
        pic.nama AS nama_pic,

        t.jenis_tindakan,
        t.respon,
        t.status_setelah,

        t.waktu_update,
        t.waktu_selesai,
        t.realisasi_waktu_penyelesaian_menit,

        t.dicatat_oleh,
        pencatat.nama AS nama_pencatat,

        t.created_at

    FROM mrp_tanggapan_kueri t

    JOIN mrp_kueri q
        ON q.id = t.kueri_id

    JOIN layanan_digital l
        ON l.id = q.layanan_id

    JOIN users pic
        ON pic.id = t.pic_id

    JOIN users pencatat
        ON pencatat.id = t.dicatat_oleh
`;


// =====================================================
// VALIDASI TANGGAPAN KUERI
// =====================================================

const validateTanggapanKueri = (body) => {
    const {
        kueri_id,
        pic_id,
        jenis_tindakan,
        respon,
        status_setelah
    } = body;


    if (!isPositiveInteger(kueri_id)) {
        return (
            'kueri_id wajib berupa ID yang valid.'
        );
    }


    if (!isPositiveInteger(pic_id)) {
        return (
            'pic_id wajib berupa ID yang valid.'
        );
    }


    if (
        ![
            'Respons',
            'Penugasan',
            'Pembaruan',
            'Eskalasi',
            'Penyelesaian',
            'Penutupan',
            'Lainnya'
        ].includes(jenis_tindakan)
    ) {
        return (
            'jenis_tindakan tidak valid.'
        );
    }


    if (
        typeof respon !== 'string' ||
        respon.trim() === ''
    ) {
        return (
            'respon wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        ![
            'Diterima',
            'Ditugaskan',
            'Diproses',
            'Dieskalasi',
            'Selesai',
            'Ditutup',
            'Dibatalkan'
        ].includes(status_setelah)
    ) {
        return (
            'status_setelah tidak valid.'
        );
    }


    return null;
};


// =====================================================
// GET ALL TANGGAPAN KUERI
// GET /api/relasi-pengguna/tanggapan-kueri
// =====================================================

exports.getAllTanggapanKueri = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${tanggapanKueriSelectQuery}

            ORDER BY
                t.waktu_update DESC,
                t.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllTanggapanKueri error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil tanggapan kueri.'
        });
    }
};


// =====================================================
// GET DETAIL TANGGAPAN KUERI
// GET /api/relasi-pengguna/tanggapan-kueri/:id
// =====================================================

exports.getTanggapanKueriById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID tanggapan kueri tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${tanggapanKueriSelectQuery}

            WHERE t.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Tanggapan kueri tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getTanggapanKueriById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil tanggapan kueri.'
        });
    }
};


// =====================================================
// GET RIWAYAT BERDASARKAN KUERI
// GET /api/relasi-pengguna/kueri/:id/tanggapan
// =====================================================

exports.getTanggapanByKueri = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID kueri tidak valid.'
        });
    }


    try {
        const [kueri] = await db.query(
            `
            SELECT id
            FROM mrp_kueri
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (kueri.length === 0) {
            return res.status(404).json({
                message:
                    'Kueri tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${tanggapanKueriSelectQuery}

            WHERE t.kueri_id = ?

            ORDER BY
                t.waktu_update ASC,
                t.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getTanggapanByKueri error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil riwayat tanggapan kueri.'
        });
    }
};


// =====================================================
// CREATE TANGGAPAN KUERI
// POST /api/relasi-pengguna/tanggapan-kueri
// =====================================================

exports.createTanggapanKueri = async (
    req,
    res
) => {
    // Field audit dan perhitungan tidak boleh
    // dikendalikan oleh frontend.
    const forbiddenFields = [
        'dicatat_oleh',
        'waktu_update',
        'waktu_selesai',
        'realisasi_waktu_penyelesaian_menit'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh dikirim dari request.`
            });
        }
    }


    const validationError =
        validateTanggapanKueri(
            req.body
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        kueri_id,
        pic_id,
        jenis_tindakan,
        respon,
        status_setelah
    } = req.body;


    let connection = null;
    let transactionStarted = false;


    try {
        if (
            typeof db.getConnection ===
            'function'
        ) {
            connection =
                await db.getConnection();
        } else {
            connection = db;
        }


        if (
            typeof connection
                .beginTransaction ===
            'function'
        ) {
            await connection
                .beginTransaction();

            transactionStarted = true;
        }


        // =============================================
        // CEK KUERI
        // =============================================

        const [kueri] =
            await connection.query(
                `
                SELECT
                    id,
                    waktu_masuk,
                    status
                FROM mrp_kueri
                WHERE id = ?
                LIMIT 1
                `,
                [kueri_id]
            );


        if (kueri.length === 0) {
            if (transactionStarted) {
                await connection.rollback();
                transactionStarted = false;
            }


            return res.status(400).json({
                message:
                    'kueri_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK PIC
        // =============================================

        const [pic] =
            await connection.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [pic_id]
            );


        if (pic.length === 0) {
            if (transactionStarted) {
                await connection.rollback();
                transactionStarted = false;
            }


            return res.status(400).json({
                message:
                    'pic_id tidak ditemukan.'
            });
        }


        const isSelesai =
            jenis_tindakan ===
                'Penyelesaian' ||
            jenis_tindakan ===
                'Penutupan';


        // =============================================
        // INSERT TANGGAPAN
        // =============================================

        const [result] =
            await connection.query(
                `
                INSERT INTO mrp_tanggapan_kueri (
                    kueri_id,
                    pic_id,
                    jenis_tindakan,
                    respon,
                    status_setelah,
                    waktu_update,
                    waktu_selesai,
                    realisasi_waktu_penyelesaian_menit,
                    dicatat_oleh
                )
                VALUES (
                    ?, ?, ?, ?, ?,
                    CURRENT_TIMESTAMP,

                    CASE
                        WHEN ? = 1
                        THEN CURRENT_TIMESTAMP
                        ELSE NULL
                    END,

                    CASE
                        WHEN ? = 1
                        THEN TIMESTAMPDIFF(
                            MINUTE,
                            ?,
                            CURRENT_TIMESTAMP
                        )
                        ELSE NULL
                    END,

                    ?
                )
                `,
                [
                    Number(kueri_id),

                    Number(pic_id),

                    jenis_tindakan,

                    respon.trim(),

                    status_setelah,

                    isSelesai ? 1 : 0,

                    isSelesai ? 1 : 0,

                    kueri[0].waktu_masuk,

                    req.user.id
                ]
            );


        // =============================================
        // SINKRONKAN STATUS KUERI
        // =============================================

        await connection.query(
            `
            UPDATE mrp_kueri
            SET status = ?
            WHERE id = ?
            `,
            [
                status_setelah,
                kueri_id
            ]
        );


        if (transactionStarted) {
            await connection.commit();
            transactionStarted = false;
        }


        return res.status(201).json({
            message:
                'Tanggapan kueri berhasil dicatat.',
            id: result.insertId,
            status_kueri:
                status_setelah
        });

    } catch (error) {
        if (
            connection &&
            transactionStarted
        ) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'rollback createTanggapanKueri error:',
                    rollbackError
                );
            }
        }


        console.error(
            'createTanggapanKueri error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mencatat tanggapan kueri.'
        });

    } finally {
        if (
            connection &&
            connection !== db &&
            typeof connection.release ===
                'function'
        ) {
            connection.release();
        }
    }
};

// =====================================================
// MRP 3B - MANAJEMEN INSIDEN
// =====================================================

const insidenSelectQuery = `
    SELECT
        i.id,
        i.kode_insiden,

        i.kueri_asal_id,
        q.kode_kueri AS kode_kueri_asal,
        q.judul AS judul_kueri_asal,

        i.kanal_masuk,

        i.pelapor_id,
        pelapor.nama AS nama_pelapor,

        i.waktu_terdeteksi,

        i.layanan_id,
        l.kode_layanan,
        l.nama_layanan,

        i.target_insiden_id,
        ti.prioritas AS prioritas_target,
        ti.sla_waktu_respon_menit,
        ti.sla_waktu_penyelesaian_menit,
        ti.ola_waktu_respon_menit,
        ti.ola_waktu_penyelesaian_menit,

        i.deskripsi_insiden,
        i.prioritas,
        i.diagnosa_awal,
        i.target_waktu_selesai,
        i.status,

        i.waktu_selesai,
        i.realisasi_waktu_penyelesaian_menit,

        i.apakah_berulang,

        i.created_by,
        pembuat.nama AS dibuat_oleh,

        i.created_at,
        i.updated_at

    FROM mrp_insiden i

    LEFT JOIN mrp_kueri q
        ON q.id = i.kueri_asal_id

    LEFT JOIN users pelapor
        ON pelapor.id = i.pelapor_id

    JOIN layanan_digital l
        ON l.id = i.layanan_id

    LEFT JOIN mrp_target_kueri_insiden ti
        ON ti.id = i.target_insiden_id

    JOIN users pembuat
        ON pembuat.id = i.created_by
`;


// =====================================================
// VALIDASI INSIDEN
// =====================================================

const validateInsiden = (
    body,
    isCreate = true
) => {
    const {
        kode_insiden,
        kueri_asal_id,
        kanal_masuk,
        pelapor_id,
        waktu_terdeteksi,
        layanan_id,
        target_insiden_id,
        deskripsi_insiden,
        prioritas,
        diagnosa_awal,
        target_waktu_selesai,
        status,
        apakah_berulang
    } = body;


    if (
        kode_insiden !== undefined &&
        (
            typeof kode_insiden !== 'string' ||
            kode_insiden.trim() === ''
        )
    ) {
        return (
            'kode_insiden wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        kode_insiden === undefined
    ) {
        return 'kode_insiden wajib diisi.';
    }

    if (
        typeof kode_insiden === 'string' &&
        kode_insiden.trim().length > 50
    ) {
        return (
            'kode_insiden maksimal 50 karakter.'
        );
    }


    if (
        kueri_asal_id !== undefined &&
        kueri_asal_id !== null &&
        kueri_asal_id !== '' &&
        !isPositiveInteger(kueri_asal_id)
    ) {
        return (
            'kueri_asal_id harus berupa ID yang valid.'
        );
    }


    if (
        kanal_masuk !== undefined &&
        (
            typeof kanal_masuk !== 'string' ||
            kanal_masuk.trim() === ''
        )
    ) {
        return (
            'kanal_masuk wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        kanal_masuk === undefined
    ) {
        return 'kanal_masuk wajib diisi.';
    }

    if (
        typeof kanal_masuk === 'string' &&
        kanal_masuk.trim().length > 100
    ) {
        return (
            'kanal_masuk maksimal 100 karakter.'
        );
    }


    if (
        pelapor_id !== undefined &&
        pelapor_id !== null &&
        pelapor_id !== '' &&
        !isPositiveInteger(pelapor_id)
    ) {
        return (
            'pelapor_id harus berupa ID yang valid.'
        );
    }


    if (
        waktu_terdeteksi !== undefined &&
        (
            typeof waktu_terdeteksi !== 'string' ||
            waktu_terdeteksi.trim() === ''
        )
    ) {
        return (
            'waktu_terdeteksi wajib berupa tanggal dan waktu.'
        );
    }

    if (
        isCreate &&
        waktu_terdeteksi === undefined
    ) {
        return (
            'waktu_terdeteksi wajib diisi.'
        );
    }


    if (
        isCreate &&
        !isPositiveInteger(layanan_id)
    ) {
        return (
            'layanan_id wajib berupa ID yang valid.'
        );
    }

    if (
        layanan_id !== undefined &&
        !isPositiveInteger(layanan_id)
    ) {
        return (
            'layanan_id harus berupa ID yang valid.'
        );
    }


    if (
        target_insiden_id !== undefined &&
        target_insiden_id !== null &&
        target_insiden_id !== '' &&
        !isPositiveInteger(target_insiden_id)
    ) {
        return (
            'target_insiden_id harus berupa ID yang valid.'
        );
    }


    if (
        deskripsi_insiden !== undefined &&
        (
            typeof deskripsi_insiden !==
                'string' ||
            deskripsi_insiden.trim() === ''
        )
    ) {
        return (
            'deskripsi_insiden wajib berupa teks dan tidak boleh kosong.'
        );
    }

    if (
        isCreate &&
        deskripsi_insiden === undefined
    ) {
        return (
            'deskripsi_insiden wajib diisi.'
        );
    }


    if (
        prioritas !== undefined &&
        ![
            'Rendah',
            'Sedang',
            'Tinggi'
        ].includes(prioritas)
    ) {
        return (
            'prioritas harus Rendah, Sedang, atau Tinggi.'
        );
    }

    if (
        isCreate &&
        prioritas === undefined
    ) {
        return 'prioritas wajib diisi.';
    }


    if (
        diagnosa_awal !== undefined &&
        diagnosa_awal !== null &&
        typeof diagnosa_awal !== 'string'
    ) {
        return (
            'diagnosa_awal harus berupa teks.'
        );
    }


    if (
        target_waktu_selesai !== undefined &&
        target_waktu_selesai !== null &&
        target_waktu_selesai !== '' &&
        typeof target_waktu_selesai !==
            'string'
    ) {
        return (
            'target_waktu_selesai harus berupa tanggal dan waktu.'
        );
    }


    if (
        status !== undefined &&
        ![
            'Terdeteksi',
            'Tercatat',
            'Didiagnosis',
            'Dieskalasi',
            'Ditangani',
            'Dipulihkan',
            'Ditutup'
        ].includes(status)
    ) {
        return (
            'status insiden tidak valid.'
        );
    }


    if (
        apakah_berulang !== undefined &&
        ![
            0,
            1,
            '0',
            '1'
        ].includes(apakah_berulang)
    ) {
        return (
            'apakah_berulang harus bernilai 0 atau 1.'
        );
    }


    return null;
};


// =====================================================
// CEK TARGET INSIDEN
// Target harus:
// - jenis Insiden
// - layanan sama
// - prioritas sama
// =====================================================

const checkTargetInsidenForLayanan =
    async (
        connection,
        targetInsidenId,
        layananId,
        prioritas
    ) => {
        if (targetInsidenId === null) {
            return null;
        }


        const [rows] =
            await connection.query(
                `
                SELECT
                    t.id,
                    t.jenis,
                    t.prioritas,
                    k.layanan_id

                FROM mrp_target_kueri_insiden t

                JOIN mrp_standar_layanan s
                    ON s.id =
                        t.standar_layanan_id

                JOIN mrp_katalog_layanan k
                    ON k.id =
                        s.katalog_layanan_id

                WHERE t.id = ?
                LIMIT 1
                `,
                [targetInsidenId]
            );


        if (rows.length === 0) {
            return (
                'target_insiden_id tidak ditemukan.'
            );
        }


        if (
            rows[0].jenis !== 'Insiden'
        ) {
            return (
                'target_insiden_id harus menggunakan target berjenis Insiden.'
            );
        }


        if (
            Number(rows[0].layanan_id) !==
            Number(layananId)
        ) {
            return (
                'target_insiden_id tidak sesuai dengan layanan yang dipilih.'
            );
        }


        if (
            rows[0].prioritas !== prioritas
        ) {
            return (
                'Prioritas target insiden harus sama dengan prioritas insiden.'
            );
        }


        return null;
    };


// =====================================================
// CEK KUERI ASAL
// =====================================================

const checkKueriAsalForInsiden =
    async (
        connection,
        kueriId,
        layananId,
        currentIncidentId = null
    ) => {
        if (kueriId === null) {
            return null;
        }


        const [kueri] =
            await connection.query(
                `
                SELECT
                    id,
                    layanan_id
                FROM mrp_kueri
                WHERE id = ?
                LIMIT 1
                `,
                [kueriId]
            );


        if (kueri.length === 0) {
            return (
                'kueri_asal_id tidak ditemukan.'
            );
        }


        if (
            Number(kueri[0].layanan_id) !==
            Number(layananId)
        ) {
            return (
                'Kueri asal tidak berasal dari layanan yang sama dengan insiden.'
            );
        }


        let query = `
            SELECT id
            FROM mrp_insiden
            WHERE kueri_asal_id = ?
        `;

        const params = [kueriId];


        if (currentIncidentId !== null) {
            query += `
                AND id <> ?
            `;

            params.push(
                currentIncidentId
            );
        }


        query += `
            LIMIT 1
        `;


        const [duplicate] =
            await connection.query(
                query,
                params
            );


        if (duplicate.length > 0) {
            return (
                'Kueri tersebut sudah terhubung dengan insiden lain.'
            );
        }


        return null;
    };


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/insiden
// =====================================================

exports.getAllInsiden = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${insidenSelectQuery}

            ORDER BY
                i.waktu_terdeteksi DESC,
                i.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data insiden.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/insiden/:id
// =====================================================

exports.getInsidenById = async (
    req,
    res
) => {
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
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Insiden tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getInsidenById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data insiden.'
        });
    }
};


// =====================================================
// GET BERDASARKAN LAYANAN
// GET /api/relasi-pengguna/layanan/:id/insiden
// =====================================================

exports.getInsidenByLayanan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID layanan tidak valid.'
        });
    }


    try {
        const [layanan] =
            await db.query(
                `
                SELECT id
                FROM layanan_digital
                WHERE id = ?
                LIMIT 1
                `,
                [id]
            );


        if (layanan.length === 0) {
            return res.status(404).json({
                message:
                    'Layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${insidenSelectQuery}

            WHERE i.layanan_id = ?

            ORDER BY
                i.waktu_terdeteksi DESC,
                i.id DESC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getInsidenByLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data insiden.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/insiden
// =====================================================

exports.createInsiden = async (
    req,
    res
) => {
    const forbiddenFields = [
        'created_by',
        'waktu_selesai',
        'realisasi_waktu_penyelesaian_menit'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh dikirim dari request.`
            });
        }
    }


    const validationError =
        validateInsiden(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        kode_insiden,
        kueri_asal_id,
        kanal_masuk,
        pelapor_id,
        waktu_terdeteksi,
        layanan_id,
        target_insiden_id,
        deskripsi_insiden,
        prioritas,
        diagnosa_awal,
        target_waktu_selesai,
        status,
        apakah_berulang
    } = req.body;


    try {
        const [layanan] =
            await db.query(
                `
                SELECT id
                FROM layanan_digital
                WHERE id = ?
                LIMIT 1
                `,
                [layanan_id]
            );


        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        if (
            pelapor_id !== undefined &&
            pelapor_id !== null &&
            pelapor_id !== ''
        ) {
            const [pelapor] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [pelapor_id]
                );


            if (pelapor.length === 0) {
                return res.status(400).json({
                    message:
                        'pelapor_id tidak ditemukan.'
                });
            }
        }


        const kueriAsalId =
            (
                kueri_asal_id ===
                    undefined ||
                kueri_asal_id === null ||
                kueri_asal_id === ''
            )
                ? null
                : Number(
                    kueri_asal_id
                );


        const kueriError =
            await checkKueriAsalForInsiden(
                db,
                kueriAsalId,
                layanan_id
            );


        if (kueriError) {
            return res.status(400).json({
                message: kueriError
            });
        }


        const targetInsidenId =
            (
                target_insiden_id ===
                    undefined ||
                target_insiden_id === null ||
                target_insiden_id === ''
            )
                ? null
                : Number(
                    target_insiden_id
                );


        const targetError =
            await checkTargetInsidenForLayanan(
                db,
                targetInsidenId,
                layanan_id,
                prioritas
            );


        if (targetError) {
            return res.status(400).json({
                message: targetError
            });
        }


        const [duplicateKode] =
            await db.query(
                `
                SELECT id
                FROM mrp_insiden
                WHERE kode_insiden = ?
                LIMIT 1
                `,
                [kode_insiden.trim()]
            );


        if (
            duplicateKode.length > 0
        ) {
            return res.status(409).json({
                message:
                    'kode_insiden sudah digunakan.'
            });
        }


        const [result] = await db.query(
            `
            INSERT INTO mrp_insiden (
                kode_insiden,
                kueri_asal_id,
                kanal_masuk,
                pelapor_id,
                waktu_terdeteksi,
                layanan_id,
                target_insiden_id,
                deskripsi_insiden,
                prioritas,
                diagnosa_awal,
                target_waktu_selesai,
                status,
                apakah_berulang,
                created_by
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?
            )
            `,
            [
                kode_insiden.trim(),

                kueriAsalId,

                kanal_masuk.trim(),

                (
                    pelapor_id ===
                        undefined ||
                    pelapor_id === null ||
                    pelapor_id === ''
                )
                    ? null
                    : Number(
                        pelapor_id
                    ),

                waktu_terdeteksi.trim(),

                Number(layanan_id),

                targetInsidenId,

                deskripsi_insiden.trim(),

                prioritas,

                normalizeOptionalText(
                    diagnosa_awal
                ),

                normalizeOptionalText(
                    target_waktu_selesai
                ),

                status || 'Terdeteksi',

                Number(
                    apakah_berulang || 0
                ),

                req.user.id
            ]
        );


        return res.status(201).json({
            message:
                'Insiden berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createInsiden error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Kode insiden atau kueri asal sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat insiden.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/insiden/:id
// =====================================================

exports.updateInsiden = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }


    const forbiddenFields = [
        'created_by',
        'waktu_selesai',
        'realisasi_waktu_penyelesaian_menit'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah melalui endpoint ini.`
            });
        }
    }


    const validationError =
        validateInsiden(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Insiden tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            kode_insiden:
                req.body.kode_insiden !==
                undefined
                    ? req.body
                        .kode_insiden
                        .trim()
                    : existing
                        .kode_insiden,

            kueri_asal_id:
                req.body.kueri_asal_id !==
                undefined
                    ? (
                        req.body
                            .kueri_asal_id ===
                            null ||
                        req.body
                            .kueri_asal_id === ''
                            ? null
                            : Number(
                                req.body
                                    .kueri_asal_id
                            )
                    )
                    : existing
                        .kueri_asal_id,

            kanal_masuk:
                req.body.kanal_masuk !==
                undefined
                    ? req.body
                        .kanal_masuk
                        .trim()
                    : existing
                        .kanal_masuk,

            pelapor_id:
                req.body.pelapor_id !==
                undefined
                    ? (
                        req.body
                            .pelapor_id ===
                            null ||
                        req.body
                            .pelapor_id === ''
                            ? null
                            : Number(
                                req.body
                                    .pelapor_id
                            )
                    )
                    : existing
                        .pelapor_id,

            waktu_terdeteksi:
                req.body
                    .waktu_terdeteksi !==
                undefined
                    ? req.body
                        .waktu_terdeteksi
                        .trim()
                    : existing
                        .waktu_terdeteksi,

            layanan_id:
                req.body.layanan_id !==
                undefined
                    ? Number(
                        req.body
                            .layanan_id
                    )
                    : existing
                        .layanan_id,

            target_insiden_id:
                req.body
                    .target_insiden_id !==
                undefined
                    ? (
                        req.body
                            .target_insiden_id ===
                            null ||
                        req.body
                            .target_insiden_id === ''
                            ? null
                            : Number(
                                req.body
                                    .target_insiden_id
                            )
                    )
                    : existing
                        .target_insiden_id,

            deskripsi_insiden:
                req.body
                    .deskripsi_insiden !==
                undefined
                    ? req.body
                        .deskripsi_insiden
                        .trim()
                    : existing
                        .deskripsi_insiden,

            prioritas:
                req.body.prioritas !==
                undefined
                    ? req.body.prioritas
                    : existing.prioritas,

            diagnosa_awal:
                req.body.diagnosa_awal !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .diagnosa_awal
                    )
                    : existing
                        .diagnosa_awal,

            target_waktu_selesai:
                req.body
                    .target_waktu_selesai !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .target_waktu_selesai
                    )
                    : existing
                        .target_waktu_selesai,

            status:
                req.body.status !== undefined
                    ? req.body.status
                    : existing.status,

            apakah_berulang:
                req.body
                    .apakah_berulang !==
                undefined
                    ? Number(
                        req.body
                            .apakah_berulang
                    )
                    : existing
                        .apakah_berulang
        };


        const [layanan] =
            await db.query(
                `
                SELECT id
                FROM layanan_digital
                WHERE id = ?
                LIMIT 1
                `,
                [final.layanan_id]
            );


        if (layanan.length === 0) {
            return res.status(400).json({
                message:
                    'layanan_id tidak ditemukan.'
            });
        }


        if (
            final.pelapor_id !== null
        ) {
            const [pelapor] =
                await db.query(
                    `
                    SELECT id
                    FROM users
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [final.pelapor_id]
                );


            if (pelapor.length === 0) {
                return res.status(400).json({
                    message:
                        'pelapor_id tidak ditemukan.'
                });
            }
        }


        const kueriError =
            await checkKueriAsalForInsiden(
                db,
                final.kueri_asal_id,
                final.layanan_id,
                Number(id)
            );


        if (kueriError) {
            return res.status(400).json({
                message: kueriError
            });
        }


        const targetError =
            await checkTargetInsidenForLayanan(
                db,
                final.target_insiden_id,
                final.layanan_id,
                final.prioritas
            );


        if (targetError) {
            return res.status(400).json({
                message: targetError
            });
        }


        const [duplicateKode] =
            await db.query(
                `
                SELECT id
                FROM mrp_insiden
                WHERE kode_insiden = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    final.kode_insiden,
                    id
                ]
            );


        if (
            duplicateKode.length > 0
        ) {
            return res.status(409).json({
                message:
                    'kode_insiden sudah digunakan.'
            });
        }


        await db.query(
            `
            UPDATE mrp_insiden
            SET
                kode_insiden = ?,
                kueri_asal_id = ?,
                kanal_masuk = ?,
                pelapor_id = ?,
                waktu_terdeteksi = ?,
                layanan_id = ?,
                target_insiden_id = ?,
                deskripsi_insiden = ?,
                prioritas = ?,
                diagnosa_awal = ?,
                target_waktu_selesai = ?,
                status = ?,
                apakah_berulang = ?
            WHERE id = ?
            `,
            [
                final.kode_insiden,
                final.kueri_asal_id,
                final.kanal_masuk,
                final.pelapor_id,
                final.waktu_terdeteksi,
                final.layanan_id,
                final.target_insiden_id,
                final.deskripsi_insiden,
                final.prioritas,
                final.diagnosa_awal,
                final.target_waktu_selesai,
                final.status,
                final.apakah_berulang,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Insiden berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateInsiden error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Kode insiden atau kueri asal sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui insiden.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/insiden/:id
// =====================================================

exports.deleteInsiden = async (
    req,
    res
) => {
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
            DELETE FROM mrp_insiden
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Insiden tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Insiden berhasil dihapus.'
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
// MRP 3B - PENANGANAN INSIDEN
// =====================================================

const penangananInsidenSelectQuery = `
    SELECT
        p.id,
        p.insiden_id,

        i.kode_insiden,
        i.layanan_id,
        l.kode_layanan,
        l.nama_layanan,
        i.prioritas,
        i.status AS status_insiden,

        p.pic_id,
        pic.nama AS nama_pic,

        p.jenis_penanganan,
        p.eskalasi_kepada,
        p.tindakan,
        p.status_setelah,
        p.waktu_tindakan,

        p.dicatat_oleh,
        pencatat.nama AS nama_pencatat,

        p.created_at

    FROM mrp_penanganan_insiden p

    JOIN mrp_insiden i
        ON i.id = p.insiden_id

    JOIN layanan_digital l
        ON l.id = i.layanan_id

    JOIN users pic
        ON pic.id = p.pic_id

    JOIN users pencatat
        ON pencatat.id = p.dicatat_oleh
`;


// =====================================================
// VALIDASI PENANGANAN INSIDEN
// =====================================================

const validatePenangananInsiden = (body) => {
    const {
        insiden_id,
        pic_id,
        jenis_penanganan,
        eskalasi_kepada,
        tindakan,
        status_setelah
    } = body;


    if (!isPositiveInteger(insiden_id)) {
        return (
            'insiden_id wajib berupa ID yang valid.'
        );
    }


    if (!isPositiveInteger(pic_id)) {
        return (
            'pic_id wajib berupa ID yang valid.'
        );
    }


    if (
        ![
            'Diagnosis',
            'Eskalasi',
            'Tindakan',
            'Pemulihan',
            'Penutupan',
            'Pembaruan'
        ].includes(jenis_penanganan)
    ) {
        return (
            'jenis_penanganan tidak valid.'
        );
    }


    if (
        eskalasi_kepada !== undefined &&
        eskalasi_kepada !== null &&
        typeof eskalasi_kepada !== 'string'
    ) {
        return (
            'eskalasi_kepada harus berupa teks.'
        );
    }


    if (
        typeof eskalasi_kepada === 'string' &&
        eskalasi_kepada.trim().length > 150
    ) {
        return (
            'eskalasi_kepada maksimal 150 karakter.'
        );
    }


    // Database mewajibkan tujuan eskalasi
    // jika jenis penanganan = Eskalasi.
    if (
        jenis_penanganan === 'Eskalasi' &&
        (
            typeof eskalasi_kepada !== 'string' ||
            eskalasi_kepada.trim() === ''
        )
    ) {
        return (
            'eskalasi_kepada wajib diisi untuk penanganan Eskalasi.'
        );
    }


    if (
        typeof tindakan !== 'string' ||
        tindakan.trim() === ''
    ) {
        return (
            'tindakan wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        ![
            'Terdeteksi',
            'Tercatat',
            'Didiagnosis',
            'Dieskalasi',
            'Ditangani',
            'Dipulihkan',
            'Ditutup'
        ].includes(status_setelah)
    ) {
        return (
            'status_setelah tidak valid.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/penanganan-insiden
// =====================================================

exports.getAllPenangananInsiden = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${penangananInsidenSelectQuery}

            ORDER BY
                p.waktu_tindakan DESC,
                p.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllPenangananInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data penanganan insiden.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/penanganan-insiden/:id
// =====================================================

exports.getPenangananInsidenById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID penanganan insiden tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${penangananInsidenSelectQuery}

            WHERE p.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Penanganan insiden tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getPenangananInsidenById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil penanganan insiden.'
        });
    }
};


// =====================================================
// GET RIWAYAT BERDASARKAN INSIDEN
// GET /api/relasi-pengguna/insiden/:id/penanganan
// =====================================================

exports.getPenangananByInsiden = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID insiden tidak valid.'
        });
    }


    try {
        const [insiden] = await db.query(
            `
            SELECT id
            FROM mrp_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (insiden.length === 0) {
            return res.status(404).json({
                message:
                    'Insiden tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${penangananInsidenSelectQuery}

            WHERE p.insiden_id = ?

            ORDER BY
                p.waktu_tindakan ASC,
                p.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getPenangananByInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil riwayat penanganan insiden.'
        });
    }
};


// =====================================================
// CREATE PENANGANAN INSIDEN
// POST /api/relasi-pengguna/penanganan-insiden
// =====================================================

exports.createPenangananInsiden = async (
    req,
    res
) => {
    const forbiddenFields = [
        'dicatat_oleh',
        'waktu_tindakan'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh dikirim dari request.`
            });
        }
    }


    const validationError =
        validatePenangananInsiden(
            req.body
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        insiden_id,
        pic_id,
        jenis_penanganan,
        eskalasi_kepada,
        tindakan,
        status_setelah
    } = req.body;


    let connection = null;
    let transactionStarted = false;


    try {
        if (
            typeof db.getConnection ===
            'function'
        ) {
            connection =
                await db.getConnection();
        } else {
            connection = db;
        }


        if (
            typeof connection
                .beginTransaction ===
            'function'
        ) {
            await connection
                .beginTransaction();

            transactionStarted = true;
        }


        // =============================================
        // CEK INSIDEN
        // =============================================

        const [insiden] =
            await connection.query(
                `
                SELECT
                    id,
                    waktu_terdeteksi,
                    waktu_selesai,
                    realisasi_waktu_penyelesaian_menit,
                    status
                FROM mrp_insiden
                WHERE id = ?
                LIMIT 1
                FOR UPDATE
                `,
                [insiden_id]
            );


        if (insiden.length === 0) {
            if (transactionStarted) {
                await connection.rollback();
                transactionStarted = false;
            }


            return res.status(400).json({
                message:
                    'insiden_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK PIC
        // =============================================

        const [pic] =
            await connection.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [pic_id]
            );


        if (pic.length === 0) {
            if (transactionStarted) {
                await connection.rollback();
                transactionStarted = false;
            }


            return res.status(400).json({
                message:
                    'pic_id tidak ditemukan.'
            });
        }


        // =============================================
        // INSERT RIWAYAT PENANGANAN
        // =============================================

        const [result] =
            await connection.query(
                `
                INSERT INTO mrp_penanganan_insiden (
                    insiden_id,
                    pic_id,
                    jenis_penanganan,
                    eskalasi_kepada,
                    tindakan,
                    status_setelah,
                    waktu_tindakan,
                    dicatat_oleh
                )
                VALUES (
                    ?, ?, ?, ?, ?, ?,
                    CURRENT_TIMESTAMP,
                    ?
                )
                `,
                [
                    Number(insiden_id),

                    Number(pic_id),

                    jenis_penanganan,

                    normalizeOptionalText(
                        eskalasi_kepada
                    ),

                    tindakan.trim(),

                    status_setelah,

                    req.user.id
                ]
            );


        // =============================================
        // SINKRONKAN STATUS INSIDEN
        //
        // Saat pertama kali Dipulihkan / Ditutup,
        // catat waktu selesai dan realisasi.
        // =============================================

        const isCompleted =
            status_setelah ===
                'Dipulihkan' ||
            status_setelah ===
                'Ditutup';


        if (
            isCompleted &&
            insiden[0].waktu_selesai === null
        ) {
            await connection.query(
                `
                UPDATE mrp_insiden
                SET
                    status = ?,
                    waktu_selesai =
                        CURRENT_TIMESTAMP,
                    realisasi_waktu_penyelesaian_menit =
                        TIMESTAMPDIFF(
                            MINUTE,
                            waktu_terdeteksi,
                            CURRENT_TIMESTAMP
                        )
                WHERE id = ?
                `,
                [
                    status_setelah,
                    insiden_id
                ]
            );

        } else {
            await connection.query(
                `
                UPDATE mrp_insiden
                SET status = ?
                WHERE id = ?
                `,
                [
                    status_setelah,
                    insiden_id
                ]
            );
        }


        if (transactionStarted) {
            await connection.commit();
            transactionStarted = false;
        }


        return res.status(201).json({
            message:
                'Penanganan insiden berhasil dicatat.',
            id: result.insertId,
            status_insiden:
                status_setelah
        });

    } catch (error) {
        if (
            connection &&
            transactionStarted
        ) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error(
                    'rollback createPenangananInsiden error:',
                    rollbackError
                );
            }
        }


        console.error(
            'createPenangananInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mencatat penanganan insiden.'
        });

    } finally {
        if (
            connection &&
            connection !== db &&
            typeof connection.release ===
                'function'
        ) {
            connection.release();
        }
    }
};

// =====================================================
// MRP 3C - MANAJEMEN MASALAH / RCA
// =====================================================

const masalahSelectQuery = `
    SELECT
        m.id,
        m.kode_masalah,
        m.diagnosa_akar_masalah,
        m.deskripsi_akar_masalah,
        m.prioritas,

        m.solusi_sementara,
        m.solusi_permanen,

        m.target_waktu_selesai,
        m.status,

        m.memerlukan_perubahan,
        m.deskripsi_singkat_perubahan,

        m.perubahan_id,
        pr.kode_perubahan,

        m.created_by,
        u.nama AS dibuat_oleh,

        m.created_at,
        m.updated_at

    FROM mrp_masalah m

    LEFT JOIN mpr_perubahan pr
        ON pr.id = m.perubahan_id

    JOIN users u
        ON u.id = m.created_by
`;


// =====================================================
// VALIDASI MASALAH
// =====================================================

const validateMasalah = (
    body,
    isCreate = true
) => {
    const {
        kode_masalah,
        diagnosa_akar_masalah,
        deskripsi_akar_masalah,
        prioritas,
        solusi_sementara,
        solusi_permanen,
        target_waktu_selesai,
        status,
        memerlukan_perubahan,
        deskripsi_singkat_perubahan,
        perubahan_id
    } = body;


    // =============================================
    // KODE MASALAH
    // =============================================

    if (
        kode_masalah !== undefined &&
        (
            typeof kode_masalah !== 'string' ||
            kode_masalah.trim() === ''
        )
    ) {
        return (
            'kode_masalah wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        isCreate &&
        kode_masalah === undefined
    ) {
        return (
            'kode_masalah wajib diisi.'
        );
    }


    if (
        typeof kode_masalah === 'string' &&
        kode_masalah.trim().length > 50
    ) {
        return (
            'kode_masalah maksimal 50 karakter.'
        );
    }


    // =============================================
    // DIAGNOSA AKAR MASALAH
    // =============================================

    if (
        diagnosa_akar_masalah !== undefined &&
        (
            typeof diagnosa_akar_masalah !==
                'string' ||
            diagnosa_akar_masalah.trim() === ''
        )
    ) {
        return (
            'diagnosa_akar_masalah wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        isCreate &&
        diagnosa_akar_masalah === undefined
    ) {
        return (
            'diagnosa_akar_masalah wajib diisi.'
        );
    }


    if (
        typeof diagnosa_akar_masalah ===
            'string' &&
        diagnosa_akar_masalah
            .trim()
            .length > 255
    ) {
        return (
            'diagnosa_akar_masalah maksimal 255 karakter.'
        );
    }


    // =============================================
    // DESKRIPSI AKAR MASALAH
    // =============================================

    if (
        deskripsi_akar_masalah !== undefined &&
        (
            typeof deskripsi_akar_masalah !==
                'string' ||
            deskripsi_akar_masalah.trim() === ''
        )
    ) {
        return (
            'deskripsi_akar_masalah wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        isCreate &&
        deskripsi_akar_masalah === undefined
    ) {
        return (
            'deskripsi_akar_masalah wajib diisi.'
        );
    }


    // =============================================
    // PRIORITAS
    // =============================================

    if (
        prioritas !== undefined &&
        ![
            'Rendah',
            'Sedang',
            'Tinggi'
        ].includes(prioritas)
    ) {
        return (
            'prioritas harus Rendah, Sedang, atau Tinggi.'
        );
    }


    if (
        isCreate &&
        prioritas === undefined
    ) {
        return (
            'prioritas wajib diisi.'
        );
    }


    // =============================================
    // SOLUSI
    // =============================================

    if (
        solusi_sementara !== undefined &&
        solusi_sementara !== null &&
        typeof solusi_sementara !== 'string'
    ) {
        return (
            'solusi_sementara harus berupa teks.'
        );
    }


    if (
        solusi_permanen !== undefined &&
        solusi_permanen !== null &&
        typeof solusi_permanen !== 'string'
    ) {
        return (
            'solusi_permanen harus berupa teks.'
        );
    }


    // =============================================
    // TARGET SELESAI
    // =============================================

    if (
        target_waktu_selesai !== undefined &&
        target_waktu_selesai !== null &&
        target_waktu_selesai !== '' &&
        typeof target_waktu_selesai !==
            'string'
    ) {
        return (
            'target_waktu_selesai harus berupa tanggal dan waktu.'
        );
    }


    // =============================================
    // STATUS
    // =============================================

    if (
        status !== undefined &&
        ![
            'Teridentifikasi',
            'Dianalisis',
            'Solusi Sementara',
            'Solusi Permanen',
            'Selesai',
            'Ditutup'
        ].includes(status)
    ) {
        return (
            'status masalah tidak valid.'
        );
    }


    // =============================================
    // MEMERLUKAN PERUBAHAN
    // =============================================

    if (
        memerlukan_perubahan !== undefined &&
        ![
            0,
            1,
            '0',
            '1'
        ].includes(memerlukan_perubahan)
    ) {
        return (
            'memerlukan_perubahan harus bernilai 0 atau 1.'
        );
    }


    if (
        deskripsi_singkat_perubahan !==
            undefined &&
        deskripsi_singkat_perubahan !== null &&
        typeof deskripsi_singkat_perubahan !==
            'string'
    ) {
        return (
            'deskripsi_singkat_perubahan harus berupa teks.'
        );
    }


    if (
        perubahan_id !== undefined &&
        perubahan_id !== null &&
        perubahan_id !== '' &&
        !isPositiveInteger(perubahan_id)
    ) {
        return (
            'perubahan_id harus berupa ID yang valid.'
        );
    }


    return null;
};


// =====================================================
// GET ALL MASALAH
// GET /api/relasi-pengguna/masalah
// =====================================================

exports.getAllMasalah = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${masalahSelectQuery}

            ORDER BY
                m.created_at DESC,
                m.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllMasalah error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data masalah.'
        });
    }
};


// =====================================================
// GET DETAIL MASALAH
// GET /api/relasi-pengguna/masalah/:id
// =====================================================

exports.getMasalahById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID masalah tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${masalahSelectQuery}

            WHERE m.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Masalah tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getMasalahById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data masalah.'
        });
    }
};


// =====================================================
// CREATE MASALAH
// POST /api/relasi-pengguna/masalah
// =====================================================

exports.createMasalah = async (
    req,
    res
) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validateMasalah(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        kode_masalah,
        diagnosa_akar_masalah,
        deskripsi_akar_masalah,
        prioritas,
        solusi_sementara,
        solusi_permanen,
        target_waktu_selesai,
        status,
        memerlukan_perubahan,
        deskripsi_singkat_perubahan,
        perubahan_id
    } = req.body;


    const finalMemerlukanPerubahan =
        Number(
            memerlukan_perubahan || 0
        );


    // CHECK database:
    // jika memerlukan_perubahan = 1,
    // deskripsi perubahan wajib tersedia.
    if (
        finalMemerlukanPerubahan === 1 &&
        (
            typeof
                deskripsi_singkat_perubahan !==
                'string' ||
            deskripsi_singkat_perubahan
                .trim() === ''
        )
    ) {
        return res.status(400).json({
            message:
                'deskripsi_singkat_perubahan wajib diisi jika masalah memerlukan perubahan.'
        });
    }


    const perubahanId =
        (
            perubahan_id === undefined ||
            perubahan_id === null ||
            perubahan_id === ''
        )
            ? null
            : Number(perubahan_id);


    try {
        // =============================================
        // CEK DUPLIKAT KODE
        // =============================================

        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_masalah
                WHERE kode_masalah = ?
                LIMIT 1
                `,
                [
                    kode_masalah.trim()
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'kode_masalah sudah digunakan.'
            });
        }


        // =============================================
        // CEK PERUBAHAN JIKA DIISI
        // =============================================

        if (perubahanId !== null) {
            const [perubahan] =
                await db.query(
                    `
                    SELECT id
                    FROM mpr_perubahan
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [perubahanId]
                );


            if (
                perubahan.length === 0
            ) {
                return res.status(400).json({
                    message:
                        'perubahan_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_masalah (
                kode_masalah,
                diagnosa_akar_masalah,
                deskripsi_akar_masalah,
                prioritas,
                solusi_sementara,
                solusi_permanen,
                target_waktu_selesai,
                status,
                memerlukan_perubahan,
                deskripsi_singkat_perubahan,
                perubahan_id,
                created_by
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?
            )
            `,
            [
                kode_masalah.trim(),

                diagnosa_akar_masalah
                    .trim(),

                deskripsi_akar_masalah
                    .trim(),

                prioritas,

                normalizeOptionalText(
                    solusi_sementara
                ),

                normalizeOptionalText(
                    solusi_permanen
                ),

                normalizeOptionalText(
                    target_waktu_selesai
                ),

                status ||
                    'Teridentifikasi',

                finalMemerlukanPerubahan,

                normalizeOptionalText(
                    deskripsi_singkat_perubahan
                ),

                perubahanId,

                req.user.id
            ]
        );


        return res.status(201).json({
            message:
                'Masalah berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createMasalah error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'kode_masalah sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat masalah.'
        });
    }
};


// =====================================================
// UPDATE MASALAH
// PUT /api/relasi-pengguna/masalah/:id
// =====================================================

exports.updateMasalah = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID masalah tidak valid.'
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
                'created_by tidak boleh diubah.'
        });
    }


    const validationError =
        validateMasalah(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_masalah
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Masalah tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            kode_masalah:
                req.body.kode_masalah !==
                undefined
                    ? req.body
                        .kode_masalah
                        .trim()
                    : existing
                        .kode_masalah,

            diagnosa_akar_masalah:
                req.body
                    .diagnosa_akar_masalah !==
                undefined
                    ? req.body
                        .diagnosa_akar_masalah
                        .trim()
                    : existing
                        .diagnosa_akar_masalah,

            deskripsi_akar_masalah:
                req.body
                    .deskripsi_akar_masalah !==
                undefined
                    ? req.body
                        .deskripsi_akar_masalah
                        .trim()
                    : existing
                        .deskripsi_akar_masalah,

            prioritas:
                req.body.prioritas !==
                undefined
                    ? req.body.prioritas
                    : existing.prioritas,

            solusi_sementara:
                req.body.solusi_sementara !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .solusi_sementara
                    )
                    : existing
                        .solusi_sementara,

            solusi_permanen:
                req.body.solusi_permanen !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .solusi_permanen
                    )
                    : existing
                        .solusi_permanen,

            target_waktu_selesai:
                req.body
                    .target_waktu_selesai !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .target_waktu_selesai
                    )
                    : existing
                        .target_waktu_selesai,

            status:
                req.body.status !==
                undefined
                    ? req.body.status
                    : existing.status,

            memerlukan_perubahan:
                req.body
                    .memerlukan_perubahan !==
                undefined
                    ? Number(
                        req.body
                            .memerlukan_perubahan
                    )
                    : Number(
                        existing
                            .memerlukan_perubahan
                    ),

            deskripsi_singkat_perubahan:
                req.body
                    .deskripsi_singkat_perubahan !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .deskripsi_singkat_perubahan
                    )
                    : existing
                        .deskripsi_singkat_perubahan,

            perubahan_id:
                req.body.perubahan_id !==
                undefined
                    ? (
                        req.body.perubahan_id ===
                            null ||
                        req.body.perubahan_id === ''
                            ? null
                            : Number(
                                req.body
                                    .perubahan_id
                            )
                    )
                    : existing
                        .perubahan_id
        };


        // =============================================
        // VALIDASI CHECK DATABASE
        // =============================================

        if (
            final.memerlukan_perubahan === 1 &&
            (
                typeof
                    final
                        .deskripsi_singkat_perubahan !==
                    'string' ||
                final
                    .deskripsi_singkat_perubahan
                    .trim() === ''
            )
        ) {
            return res.status(400).json({
                message:
                    'deskripsi_singkat_perubahan wajib diisi jika masalah memerlukan perubahan.'
            });
        }


        // =============================================
        // CEK PERUBAHAN
        // =============================================

        if (
            final.perubahan_id !== null
        ) {
            const [perubahan] =
                await db.query(
                    `
                    SELECT id
                    FROM mpr_perubahan
                    WHERE id = ?
                    LIMIT 1
                    `,
                    [
                        final.perubahan_id
                    ]
                );


            if (
                perubahan.length === 0
            ) {
                return res.status(400).json({
                    message:
                        'perubahan_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // CEK DUPLIKAT KODE
        // =============================================

        const [duplicate] =
            await db.query(
                `
                SELECT id
                FROM mrp_masalah
                WHERE kode_masalah = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    final.kode_masalah,
                    id
                ]
            );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'kode_masalah sudah digunakan.'
            });
        }


        // =============================================
        // UPDATE
        // =============================================

        await db.query(
            `
            UPDATE mrp_masalah
            SET
                kode_masalah = ?,
                diagnosa_akar_masalah = ?,
                deskripsi_akar_masalah = ?,
                prioritas = ?,
                solusi_sementara = ?,
                solusi_permanen = ?,
                target_waktu_selesai = ?,
                status = ?,
                memerlukan_perubahan = ?,
                deskripsi_singkat_perubahan = ?,
                perubahan_id = ?
            WHERE id = ?
            `,
            [
                final.kode_masalah,
                final.diagnosa_akar_masalah,
                final.deskripsi_akar_masalah,
                final.prioritas,
                final.solusi_sementara,
                final.solusi_permanen,
                final.target_waktu_selesai,
                final.status,
                final.memerlukan_perubahan,
                final.deskripsi_singkat_perubahan,
                final.perubahan_id,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Masalah berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateMasalah error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'kode_masalah sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui masalah.'
        });
    }
};


// =====================================================
// DELETE MASALAH
// DELETE /api/relasi-pengguna/masalah/:id
// =====================================================

exports.deleteMasalah = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID masalah tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_masalah
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Masalah tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Masalah berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteMasalah error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus masalah.'
        });
    }
};

// =====================================================
// MRP 3C - RELASI MASALAH DAN INSIDEN
// =====================================================

const masalahInsidenSelectQuery = `
    SELECT
        mi.id,
        mi.masalah_id,
        m.kode_masalah,
        m.prioritas AS prioritas_masalah,
        m.status AS status_masalah,

        mi.insiden_id,
        i.kode_insiden,
        i.prioritas AS prioritas_insiden,
        i.status AS status_insiden,
        i.apakah_berulang,

        i.layanan_id,
        l.kode_layanan,
        l.nama_layanan,

        mi.keterangan,
        mi.created_at

    FROM mrp_masalah_insiden mi

    JOIN mrp_masalah m
        ON m.id = mi.masalah_id

    JOIN mrp_insiden i
        ON i.id = mi.insiden_id

    JOIN layanan_digital l
        ON l.id = i.layanan_id
`;


// =====================================================
// VALIDASI RELASI MASALAH - INSIDEN
// =====================================================

const validateMasalahInsiden = (
    body,
    isCreate = true
) => {
    const {
        masalah_id,
        insiden_id,
        keterangan
    } = body;


    if (
        masalah_id !== undefined &&
        !isPositiveInteger(masalah_id)
    ) {
        return (
            'masalah_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        masalah_id === undefined
    ) {
        return (
            'masalah_id wajib diisi.'
        );
    }


    if (
        insiden_id !== undefined &&
        !isPositiveInteger(insiden_id)
    ) {
        return (
            'insiden_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        insiden_id === undefined
    ) {
        return (
            'insiden_id wajib diisi.'
        );
    }


    if (
        keterangan !== undefined &&
        keterangan !== null &&
        typeof keterangan !== 'string'
    ) {
        return (
            'keterangan harus berupa teks.'
        );
    }


    if (
        typeof keterangan === 'string' &&
        keterangan.trim().length > 255
    ) {
        return (
            'keterangan maksimal 255 karakter.'
        );
    }


    return null;
};


// =====================================================
// GET ALL RELASI
// GET /api/relasi-pengguna/masalah-insiden
// =====================================================

exports.getAllMasalahInsiden = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${masalahInsidenSelectQuery}

            ORDER BY
                mi.created_at DESC,
                mi.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllMasalahInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil relasi masalah dan insiden.'
        });
    }
};


// =====================================================
// GET DETAIL RELASI
// GET /api/relasi-pengguna/masalah-insiden/:id
// =====================================================

exports.getMasalahInsidenById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID relasi masalah dan insiden tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${masalahInsidenSelectQuery}

            WHERE mi.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Relasi masalah dan insiden tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getMasalahInsidenById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil relasi masalah dan insiden.'
        });
    }
};


// =====================================================
// GET INSIDEN BERDASARKAN MASALAH
// GET /api/relasi-pengguna/masalah/:id/insiden
// =====================================================

exports.getInsidenByMasalah = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID masalah tidak valid.'
        });
    }


    try {
        const [masalah] = await db.query(
            `
            SELECT id
            FROM mrp_masalah
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (masalah.length === 0) {
            return res.status(404).json({
                message:
                    'Masalah tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${masalahInsidenSelectQuery}

            WHERE mi.masalah_id = ?

            ORDER BY
                mi.created_at ASC,
                mi.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getInsidenByMasalah error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil insiden terkait masalah.'
        });
    }
};


// =====================================================
// CREATE RELASI MASALAH - INSIDEN
// POST /api/relasi-pengguna/masalah-insiden
// =====================================================

exports.createMasalahInsiden = async (
    req,
    res
) => {
    const validationError =
        validateMasalahInsiden(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        masalah_id,
        insiden_id,
        keterangan
    } = req.body;


    try {
        // =============================================
        // CEK MASALAH
        // =============================================

        const [masalah] = await db.query(
            `
            SELECT id
            FROM mrp_masalah
            WHERE id = ?
            LIMIT 1
            `,
            [masalah_id]
        );


        if (masalah.length === 0) {
            return res.status(400).json({
                message:
                    'masalah_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK INSIDEN
        // =============================================

        const [insiden] = await db.query(
            `
            SELECT
                id,
                apakah_berulang
            FROM mrp_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [insiden_id]
        );


        if (insiden.length === 0) {
            return res.status(400).json({
                message:
                    'insiden_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT RELASI
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_masalah_insiden
            WHERE masalah_id = ?
              AND insiden_id = ?
            LIMIT 1
            `,
            [
                masalah_id,
                insiden_id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Insiden sudah terhubung dengan masalah tersebut.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_masalah_insiden (
                masalah_id,
                insiden_id,
                keterangan
            )
            VALUES (?, ?, ?)
            `,
            [
                Number(masalah_id),
                Number(insiden_id),
                normalizeOptionalText(
                    keterangan
                )
            ]
        );


        return res.status(201).json({
            message:
                'Insiden berhasil dihubungkan dengan masalah.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createMasalahInsiden error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Insiden sudah terhubung dengan masalah tersebut.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghubungkan masalah dan insiden.'
        });
    }
};


// =====================================================
// UPDATE KETERANGAN RELASI
// PUT /api/relasi-pengguna/masalah-insiden/:id
// =====================================================

exports.updateMasalahInsiden = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID relasi masalah dan insiden tidak valid.'
        });
    }


    const { keterangan } = req.body;


    if (
        keterangan !== undefined &&
        keterangan !== null &&
        typeof keterangan !== 'string'
    ) {
        return res.status(400).json({
            message:
                'keterangan harus berupa teks.'
        });
    }


    if (
        typeof keterangan === 'string' &&
        keterangan.trim().length > 255
    ) {
        return res.status(400).json({
            message:
                'keterangan maksimal 255 karakter.'
        });
    }


    try {
        const [existing] = await db.query(
            `
            SELECT id
            FROM mrp_masalah_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (existing.length === 0) {
            return res.status(404).json({
                message:
                    'Relasi masalah dan insiden tidak ditemukan.'
            });
        }


        await db.query(
            `
            UPDATE mrp_masalah_insiden
            SET keterangan = ?
            WHERE id = ?
            `,
            [
                normalizeOptionalText(
                    keterangan
                ),
                id
            ]
        );


        return res.status(200).json({
            message:
                'Relasi masalah dan insiden berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateMasalahInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui relasi masalah dan insiden.'
        });
    }
};


// =====================================================
// DELETE RELASI
// DELETE /api/relasi-pengguna/masalah-insiden/:id
// =====================================================

exports.deleteMasalahInsiden = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID relasi masalah dan insiden tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_masalah_insiden
            WHERE id = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Relasi masalah dan insiden tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Relasi masalah dan insiden berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteMasalahInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus relasi masalah dan insiden.'
        });
    }
};

// =====================================================
// MRP 3C - RELASI MASALAH DAN PENGETAHUAN
// =====================================================

const masalahPengetahuanSelectQuery = `
    SELECT
        mp.id,

        mp.masalah_id,
        m.kode_masalah,
        m.diagnosa_akar_masalah,
        m.prioritas AS prioritas_masalah,
        m.status AS status_masalah,

        mp.pengetahuan_id,
        p.kode_pengetahuan,
        p.nama_pengetahuan,
        p.jenis_pengetahuan,
        p.layanan_id,

        l.kode_layanan,
        l.nama_layanan,

        mp.jenis_hubungan,
        mp.keterangan,

        mp.created_by,
        u.nama AS dibuat_oleh,

        mp.created_at

    FROM mrp_masalah_pengetahuan mp

    JOIN mrp_masalah m
        ON m.id = mp.masalah_id

    JOIN mpn_pengetahuan p
        ON p.id = mp.pengetahuan_id

    JOIN layanan_digital l
        ON l.id = p.layanan_id

    JOIN users u
        ON u.id = mp.created_by
`;


// =====================================================
// VALIDASI RELASI MASALAH - PENGETAHUAN
// =====================================================

const validateMasalahPengetahuan = (
    body,
    isCreate = true
) => {
    const {
        masalah_id,
        pengetahuan_id,
        jenis_hubungan,
        keterangan
    } = body;


    if (
        masalah_id !== undefined &&
        !isPositiveInteger(masalah_id)
    ) {
        return (
            'masalah_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        masalah_id === undefined
    ) {
        return (
            'masalah_id wajib diisi.'
        );
    }


    if (
        pengetahuan_id !== undefined &&
        !isPositiveInteger(pengetahuan_id)
    ) {
        return (
            'pengetahuan_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        pengetahuan_id === undefined
    ) {
        return (
            'pengetahuan_id wajib diisi.'
        );
    }


    if (
        jenis_hubungan !== undefined &&
        ![
            'Referensi',
            'Solusi Sementara',
            'Solusi Permanen',
            'Lesson Learned'
        ].includes(jenis_hubungan)
    ) {
        return (
            'jenis_hubungan tidak valid.'
        );
    }


    if (
        keterangan !== undefined &&
        keterangan !== null &&
        typeof keterangan !== 'string'
    ) {
        return (
            'keterangan harus berupa teks.'
        );
    }


    if (
        typeof keterangan === 'string' &&
        keterangan.trim().length > 255
    ) {
        return (
            'keterangan maksimal 255 karakter.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/masalah-pengetahuan
// =====================================================

exports.getAllMasalahPengetahuan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${masalahPengetahuanSelectQuery}

            ORDER BY
                mp.created_at DESC,
                mp.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllMasalahPengetahuan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil relasi masalah dan pengetahuan.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/masalah-pengetahuan/:id
// =====================================================

exports.getMasalahPengetahuanById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID relasi masalah dan pengetahuan tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${masalahPengetahuanSelectQuery}

            WHERE mp.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Relasi masalah dan pengetahuan tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getMasalahPengetahuanById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil relasi masalah dan pengetahuan.'
        });
    }
};


// =====================================================
// GET PENGETAHUAN BERDASARKAN MASALAH
// GET /api/relasi-pengguna/masalah/:id/pengetahuan
// =====================================================

exports.getPengetahuanByMasalah = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID masalah tidak valid.'
        });
    }


    try {
        const [masalah] = await db.query(
            `
            SELECT id
            FROM mrp_masalah
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (masalah.length === 0) {
            return res.status(404).json({
                message:
                    'Masalah tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${masalahPengetahuanSelectQuery}

            WHERE mp.masalah_id = ?

            ORDER BY
                mp.created_at ASC,
                mp.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getPengetahuanByMasalah error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil pengetahuan terkait masalah.'
        });
    }
};


// =====================================================
// CREATE RELASI
// POST /api/relasi-pengguna/masalah-pengetahuan
// =====================================================

exports.createMasalahPengetahuan = async (
    req,
    res
) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validateMasalahPengetahuan(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        masalah_id,
        pengetahuan_id,
        jenis_hubungan,
        keterangan
    } = req.body;


    try {
        // =============================================
        // CEK MASALAH
        // =============================================

        const [masalah] = await db.query(
            `
            SELECT id
            FROM mrp_masalah
            WHERE id = ?
            LIMIT 1
            `,
            [masalah_id]
        );


        if (masalah.length === 0) {
            return res.status(400).json({
                message:
                    'masalah_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK PENGETAHUAN
        // =============================================

        const [pengetahuan] = await db.query(
            `
            SELECT id
            FROM mpn_pengetahuan
            WHERE id = ?
            LIMIT 1
            `,
            [pengetahuan_id]
        );


        if (pengetahuan.length === 0) {
            return res.status(400).json({
                message:
                    'pengetahuan_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_masalah_pengetahuan
            WHERE masalah_id = ?
              AND pengetahuan_id = ?
            LIMIT 1
            `,
            [
                masalah_id,
                pengetahuan_id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Pengetahuan sudah terhubung dengan masalah tersebut.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_masalah_pengetahuan (
                masalah_id,
                pengetahuan_id,
                jenis_hubungan,
                keterangan,
                created_by
            )
            VALUES (?, ?, ?, ?, ?)
            `,
            [
                Number(masalah_id),

                Number(pengetahuan_id),

                jenis_hubungan ||
                    'Referensi',

                normalizeOptionalText(
                    keterangan
                ),

                req.user.id
            ]
        );


        return res.status(201).json({
            message:
                'Pengetahuan berhasil dihubungkan dengan masalah.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createMasalahPengetahuan error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Pengetahuan sudah terhubung dengan masalah tersebut.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghubungkan masalah dan pengetahuan.'
        });
    }
};


// =====================================================
// UPDATE RELASI
// PUT /api/relasi-pengguna/masalah-pengetahuan/:id
// =====================================================

exports.updateMasalahPengetahuan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID relasi masalah dan pengetahuan tidak valid.'
        });
    }


    // Identitas relasi dan audit tidak boleh diganti.
    const forbiddenFields = [
        'masalah_id',
        'pengetahuan_id',
        'created_by'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah.`
            });
        }
    }


    if (
        req.body.jenis_hubungan ===
            undefined &&
        req.body.keterangan === undefined
    ) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    const validationError =
        validateMasalahPengetahuan(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_masalah_pengetahuan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Relasi masalah dan pengetahuan tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const finalJenisHubungan =
            req.body.jenis_hubungan !==
            undefined
                ? req.body.jenis_hubungan
                : existing.jenis_hubungan;


        const finalKeterangan =
            req.body.keterangan !==
            undefined
                ? normalizeOptionalText(
                    req.body.keterangan
                )
                : existing.keterangan;


        await db.query(
            `
            UPDATE mrp_masalah_pengetahuan
            SET
                jenis_hubungan = ?,
                keterangan = ?
            WHERE id = ?
            `,
            [
                finalJenisHubungan,
                finalKeterangan,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Relasi masalah dan pengetahuan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateMasalahPengetahuan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui relasi masalah dan pengetahuan.'
        });
    }
};


// =====================================================
// DELETE RELASI
// DELETE /api/relasi-pengguna/masalah-pengetahuan/:id
// =====================================================

exports.deleteMasalahPengetahuan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID relasi masalah dan pengetahuan tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_masalah_pengetahuan
            WHERE id = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Relasi masalah dan pengetahuan tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Relasi masalah dan pengetahuan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteMasalahPengetahuan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus relasi masalah dan pengetahuan.'
        });
    }
};

// =====================================================
// MRP 4 - EVALUASI
// DATA INDUK EVALUASI
// =====================================================

const evaluasiSelectQuery = `
    SELECT
        e.id,
        e.kode_evaluasi,

        e.instansi_id,
        i.kode_instansi,
        i.nama_instansi,

        DATE_FORMAT(
            e.periode_mulai,
            '%Y-%m-%d'
        ) AS periode_mulai,

        DATE_FORMAT(
            e.periode_selesai,
            '%Y-%m-%d'
        ) AS periode_selesai,

        DATE_FORMAT(
            e.tanggal_evaluasi,
            '%Y-%m-%d'
        ) AS tanggal_evaluasi,

        e.status,

        e.dievaluasi_oleh,
        u.nama AS nama_evaluator,

        e.catatan,

        e.created_at,
        e.updated_at

    FROM mrp_evaluasi e

    JOIN instansi i
        ON i.id = e.instansi_id

    JOIN users u
        ON u.id = e.dievaluasi_oleh
`;


// =====================================================
// VALIDASI FORMAT DATE YYYY-MM-DD
// =====================================================

const isValidDateOnlyValue = (value) => {
    if (
        typeof value !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(value)
    ) {
        return false;
    }


    const [
        year,
        month,
        day
    ] = value
        .split('-')
        .map(Number);


    const date = new Date(
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


// =====================================================
// VALIDASI EVALUASI
// =====================================================

const validateEvaluasi = (
    body,
    isCreate = true
) => {
    const {
        kode_evaluasi,
        instansi_id,
        periode_mulai,
        periode_selesai,
        tanggal_evaluasi,
        status,
        catatan
    } = body;


    // KODE
    if (
        kode_evaluasi !== undefined &&
        (
            typeof kode_evaluasi !== 'string' ||
            kode_evaluasi.trim() === ''
        )
    ) {
        return (
            'kode_evaluasi wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        isCreate &&
        kode_evaluasi === undefined
    ) {
        return (
            'kode_evaluasi wajib diisi.'
        );
    }


    if (
        typeof kode_evaluasi === 'string' &&
        kode_evaluasi.trim().length > 50
    ) {
        return (
            'kode_evaluasi maksimal 50 karakter.'
        );
    }


    // INSTANSI
    if (
        instansi_id !== undefined &&
        !isPositiveInteger(instansi_id)
    ) {
        return (
            'instansi_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        instansi_id === undefined
    ) {
        return (
            'instansi_id wajib diisi.'
        );
    }


    // PERIODE MULAI
    if (
        periode_mulai !== undefined &&
        !isValidDateOnlyValue(
            periode_mulai
        )
    ) {
        return (
            'periode_mulai harus menggunakan format YYYY-MM-DD yang valid.'
        );
    }


    if (
        isCreate &&
        periode_mulai === undefined
    ) {
        return (
            'periode_mulai wajib diisi.'
        );
    }


    // PERIODE SELESAI
    if (
        periode_selesai !== undefined &&
        !isValidDateOnlyValue(
            periode_selesai
        )
    ) {
        return (
            'periode_selesai harus menggunakan format YYYY-MM-DD yang valid.'
        );
    }


    if (
        isCreate &&
        periode_selesai === undefined
    ) {
        return (
            'periode_selesai wajib diisi.'
        );
    }


    // TANGGAL EVALUASI
    if (
        tanggal_evaluasi !== undefined &&
        !isValidDateOnlyValue(
            tanggal_evaluasi
        )
    ) {
        return (
            'tanggal_evaluasi harus menggunakan format YYYY-MM-DD yang valid.'
        );
    }


    if (
        isCreate &&
        tanggal_evaluasi === undefined
    ) {
        return (
            'tanggal_evaluasi wajib diisi.'
        );
    }


    // STATUS
    if (
        status !== undefined &&
        ![
            'Draft',
            'Final'
        ].includes(status)
    ) {
        return (
            'status harus Draft atau Final.'
        );
    }


    // CATATAN
    if (
        catatan !== undefined &&
        catatan !== null &&
        typeof catatan !== 'string'
    ) {
        return (
            'catatan harus berupa teks.'
        );
    }


    return null;
};


// =====================================================
// VALIDASI PERIODE EVALUASI
// =====================================================

const validatePeriodeEvaluasi = ({
    periode_mulai,
    periode_selesai,
    tanggal_evaluasi
}) => {
    if (
        periode_selesai <
        periode_mulai
    ) {
        return (
            'periode_selesai tidak boleh sebelum periode_mulai.'
        );
    }


    if (
        tanggal_evaluasi <
        periode_mulai
    ) {
        return (
            'tanggal_evaluasi tidak boleh sebelum periode_mulai.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/evaluasi
// =====================================================

exports.getAllEvaluasi = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${evaluasiSelectQuery}

            ORDER BY
                e.tanggal_evaluasi DESC,
                e.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllEvaluasi error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data evaluasi.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/evaluasi/:id
// =====================================================

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
        const [rows] = await db.query(
            `
            ${evaluasiSelectQuery}

            WHERE e.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil data evaluasi.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/evaluasi
// =====================================================

exports.createEvaluasi = async (
    req,
    res
) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'dievaluasi_oleh'
        )
    ) {
        return res.status(400).json({
            message:
                'dievaluasi_oleh tidak boleh dikirim dari request.'
        });
    }


    const validationError =
        validateEvaluasi(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        kode_evaluasi,
        instansi_id,
        periode_mulai,
        periode_selesai,
        tanggal_evaluasi,
        status,
        catatan
    } = req.body;


    const periodeError =
        validatePeriodeEvaluasi({
            periode_mulai,
            periode_selesai,
            tanggal_evaluasi
        });


    if (periodeError) {
        return res.status(400).json({
            message: periodeError
        });
    }


    try {
        // =============================================
        // CEK INSTANSI
        // =============================================

        const [instansi] = await db.query(
            `
            SELECT id
            FROM instansi
            WHERE id = ?
            LIMIT 1
            `,
            [instansi_id]
        );


        if (instansi.length === 0) {
            return res.status(400).json({
                message:
                    'instansi_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT KODE
        // =============================================

        const [duplicateKode] =
            await db.query(
                `
                SELECT id
                FROM mrp_evaluasi
                WHERE kode_evaluasi = ?
                LIMIT 1
                `,
                [
                    kode_evaluasi.trim()
                ]
            );


        if (
            duplicateKode.length > 0
        ) {
            return res.status(409).json({
                message:
                    'kode_evaluasi sudah digunakan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT INSTANSI + PERIODE
        // =============================================

        const [duplicatePeriode] =
            await db.query(
                `
                SELECT id
                FROM mrp_evaluasi
                WHERE instansi_id = ?
                  AND periode_mulai = ?
                  AND periode_selesai = ?
                LIMIT 1
                `,
                [
                    instansi_id,
                    periode_mulai,
                    periode_selesai
                ]
            );


        if (
            duplicatePeriode.length > 0
        ) {
            return res.status(409).json({
                message:
                    'Evaluasi untuk instansi dan periode tersebut sudah tersedia.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_evaluasi (
                kode_evaluasi,
                instansi_id,
                periode_mulai,
                periode_selesai,
                tanggal_evaluasi,
                status,
                dievaluasi_oleh,
                catatan
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `,
            [
                kode_evaluasi.trim(),
                Number(instansi_id),
                periode_mulai,
                periode_selesai,
                tanggal_evaluasi,
                status || 'Draft',
                req.user.id,
                normalizeOptionalText(
                    catatan
                )
            ]
        );


        return res.status(201).json({
            message:
                'Evaluasi berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createEvaluasi error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Kode atau periode evaluasi sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat evaluasi.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/evaluasi/:id
// =====================================================

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


    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'dievaluasi_oleh'
        )
    ) {
        return res.status(400).json({
            message:
                'dievaluasi_oleh tidak boleh diubah.'
        });
    }


    const validationError =
        validateEvaluasi(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            kode_evaluasi:
                req.body.kode_evaluasi !==
                undefined
                    ? req.body
                        .kode_evaluasi
                        .trim()
                    : existing
                        .kode_evaluasi,

            instansi_id:
                req.body.instansi_id !==
                undefined
                    ? Number(
                        req.body
                            .instansi_id
                    )
                    : existing
                        .instansi_id,

            periode_mulai:
                req.body.periode_mulai !==
                undefined
                    ? req.body
                        .periode_mulai
                    : existing
                        .periode_mulai,

            periode_selesai:
                req.body.periode_selesai !==
                undefined
                    ? req.body
                        .periode_selesai
                    : existing
                        .periode_selesai,

            tanggal_evaluasi:
                req.body.tanggal_evaluasi !==
                undefined
                    ? req.body
                        .tanggal_evaluasi
                    : existing
                        .tanggal_evaluasi,

            status:
                req.body.status !==
                undefined
                    ? req.body.status
                    : existing.status,

            catatan:
                req.body.catatan !==
                undefined
                    ? normalizeOptionalText(
                        req.body.catatan
                    )
                    : existing.catatan
        };


        const periodeError =
            validatePeriodeEvaluasi({
                periode_mulai:
                    final.periode_mulai,
                periode_selesai:
                    final.periode_selesai,
                tanggal_evaluasi:
                    final.tanggal_evaluasi
            });


        if (periodeError) {
            return res.status(400).json({
                message: periodeError
            });
        }


        // =============================================
        // CEK INSTANSI
        // =============================================

        const [instansi] = await db.query(
            `
            SELECT id
            FROM instansi
            WHERE id = ?
            LIMIT 1
            `,
            [final.instansi_id]
        );


        if (instansi.length === 0) {
            return res.status(400).json({
                message:
                    'instansi_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT KODE
        // =============================================

        const [duplicateKode] =
            await db.query(
                `
                SELECT id
                FROM mrp_evaluasi
                WHERE kode_evaluasi = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    final.kode_evaluasi,
                    id
                ]
            );


        if (
            duplicateKode.length > 0
        ) {
            return res.status(409).json({
                message:
                    'kode_evaluasi sudah digunakan.'
            });
        }


        // =============================================
        // CEK DUPLIKAT PERIODE
        // =============================================

        const [duplicatePeriode] =
            await db.query(
                `
                SELECT id
                FROM mrp_evaluasi
                WHERE instansi_id = ?
                  AND periode_mulai = ?
                  AND periode_selesai = ?
                  AND id <> ?
                LIMIT 1
                `,
                [
                    final.instansi_id,
                    final.periode_mulai,
                    final.periode_selesai,
                    id
                ]
            );


        if (
            duplicatePeriode.length > 0
        ) {
            return res.status(409).json({
                message:
                    'Evaluasi untuk instansi dan periode tersebut sudah tersedia.'
            });
        }


        // =============================================
        // UPDATE
        // =============================================

        await db.query(
            `
            UPDATE mrp_evaluasi
            SET
                kode_evaluasi = ?,
                instansi_id = ?,
                periode_mulai = ?,
                periode_selesai = ?,
                tanggal_evaluasi = ?,
                status = ?,
                catatan = ?
            WHERE id = ?
            `,
            [
                final.kode_evaluasi,
                final.instansi_id,
                final.periode_mulai,
                final.periode_selesai,
                final.tanggal_evaluasi,
                final.status,
                final.catatan,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Evaluasi berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateEvaluasi error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Kode atau periode evaluasi sudah digunakan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui evaluasi.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/evaluasi/:id
// =====================================================

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
        const [result] = await db.query(
            `
            DELETE FROM mrp_evaluasi
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Evaluasi tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Evaluasi berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteEvaluasi error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus evaluasi.'
        });
    }
};

// =====================================================
// MRP 4 BAGIAN 1 - EVALUASI LAYANAN
// =====================================================

const evaluasiLayananSelectQuery = `
    SELECT
        el.id,

        el.evaluasi_id,
        e.kode_evaluasi,
        e.instansi_id,

        el.standar_layanan_id,
        sl.versi AS versi_standar,
        sl.status AS status_standar,

        kl.id AS katalog_layanan_id,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        el.cakupan_layanan_snapshot,
        el.kesenjangan,
        el.lesson_learned,
        el.kesimpulan,

        el.created_at,
        el.updated_at

    FROM mrp_evaluasi_layanan el

    JOIN mrp_evaluasi e
        ON e.id = el.evaluasi_id

    JOIN mrp_standar_layanan sl
        ON sl.id = el.standar_layanan_id

    JOIN mrp_katalog_layanan kl
        ON kl.id = sl.katalog_layanan_id

    JOIN layanan_digital ld
        ON ld.id = kl.layanan_id
`;


// =====================================================
// VALIDASI EVALUASI LAYANAN
// =====================================================

const validateEvaluasiLayanan = (
    body,
    isCreate = true
) => {
    const {
        evaluasi_id,
        standar_layanan_id,
        cakupan_layanan_snapshot,
        kesenjangan,
        lesson_learned,
        kesimpulan
    } = body;


    if (
        evaluasi_id !== undefined &&
        !isPositiveInteger(evaluasi_id)
    ) {
        return (
            'evaluasi_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        evaluasi_id === undefined
    ) {
        return (
            'evaluasi_id wajib diisi.'
        );
    }


    if (
        standar_layanan_id !== undefined &&
        !isPositiveInteger(
            standar_layanan_id
        )
    ) {
        return (
            'standar_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        standar_layanan_id === undefined
    ) {
        return (
            'standar_layanan_id wajib diisi.'
        );
    }


    const textFields = [
        [
            'cakupan_layanan_snapshot',
            cakupan_layanan_snapshot
        ],
        [
            'kesenjangan',
            kesenjangan
        ],
        [
            'lesson_learned',
            lesson_learned
        ],
        [
            'kesimpulan',
            kesimpulan
        ]
    ];


    for (const [field, value] of textFields) {
        if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'string'
        ) {
            return (
                `${field} harus berupa teks.`
            );
        }
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/evaluasi-layanan
// =====================================================

exports.getAllEvaluasiLayanan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${evaluasiLayananSelectQuery}

            ORDER BY
                el.created_at DESC,
                el.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllEvaluasiLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi layanan.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/evaluasi-layanan/:id
// =====================================================

exports.getEvaluasiLayananById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi layanan tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${evaluasiLayananSelectQuery}

            WHERE el.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi layanan tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiLayananById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi layanan.'
        });
    }
};


// =====================================================
// GET BERDASARKAN EVALUASI
// GET /api/relasi-pengguna/evaluasi/:id/layanan
// =====================================================

exports.getLayananByEvaluasi = async (
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
        const [evaluasi] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (evaluasi.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${evaluasiLayananSelectQuery}

            WHERE el.evaluasi_id = ?

            ORDER BY
                ld.nama_layanan ASC,
                el.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getLayananByEvaluasi error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil layanan pada evaluasi.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/evaluasi-layanan
// =====================================================

exports.createEvaluasiLayanan = async (
    req,
    res
) => {
    const validationError =
        validateEvaluasiLayanan(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        evaluasi_id,
        standar_layanan_id,
        cakupan_layanan_snapshot,
        kesenjangan,
        lesson_learned,
        kesimpulan
    } = req.body;


    try {
        // =============================================
        // CEK EVALUASI
        // =============================================

        const [evaluasi] = await db.query(
            `
            SELECT
                id,
                instansi_id
            FROM mrp_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [evaluasi_id]
        );


        if (evaluasi.length === 0) {
            return res.status(400).json({
                message:
                    'evaluasi_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK STANDAR + LAYANAN + INSTANSI
        // =============================================

        const [standar] = await db.query(
            `
            SELECT
                sl.id,
                kl.ruang_lingkup_layanan,
                kl.target_cakupan_pengguna,
                ld.instansi_id AS layanan_instansi_id

            FROM mrp_standar_layanan sl

            JOIN mrp_katalog_layanan kl
                ON kl.id =
                    sl.katalog_layanan_id

            JOIN layanan_digital ld
                ON ld.id =
                    kl.layanan_id

            WHERE sl.id = ?
            LIMIT 1
            `,
            [standar_layanan_id]
        );


        if (standar.length === 0) {
            return res.status(400).json({
                message:
                    'standar_layanan_id tidak ditemukan.'
            });
        }


        // Evaluasi dan layanan harus berasal
        // dari instansi yang sama.
        if (
            Number(
                evaluasi[0].instansi_id
            ) !==
            Number(
                standar[0]
                    .layanan_instansi_id
            )
        ) {
            return res.status(400).json({
                message:
                    'Standar layanan tidak berasal dari instansi yang sama dengan evaluasi.'
            });
        }


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_layanan
            WHERE evaluasi_id = ?
              AND standar_layanan_id = ?
            LIMIT 1
            `,
            [
                evaluasi_id,
                standar_layanan_id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Standar layanan sudah terdaftar pada evaluasi tersebut.'
            });
        }


        // =============================================
        // SNAPSHOT CAKUPAN
        //
        // Jika tidak dikirim, ambil kondisi
        // cakupan dari katalog saat evaluasi dibuat.
        // =============================================

        let finalCakupan;


        if (
            cakupan_layanan_snapshot !==
            undefined
        ) {
            finalCakupan =
                normalizeOptionalText(
                    cakupan_layanan_snapshot
                );

        } else {
            finalCakupan =
                standar[0]
                    .ruang_lingkup_layanan ||
                standar[0]
                    .target_cakupan_pengguna ||
                null;
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_evaluasi_layanan (
                evaluasi_id,
                standar_layanan_id,
                cakupan_layanan_snapshot,
                kesenjangan,
                lesson_learned,
                kesimpulan
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
            [
                Number(evaluasi_id),

                Number(
                    standar_layanan_id
                ),

                finalCakupan,

                normalizeOptionalText(
                    kesenjangan
                ),

                normalizeOptionalText(
                    lesson_learned
                ),

                normalizeOptionalText(
                    kesimpulan
                )
            ]
        );


        return res.status(201).json({
            message:
                'Evaluasi layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createEvaluasiLayanan error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Standar layanan sudah terdaftar pada evaluasi tersebut.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat evaluasi layanan.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/evaluasi-layanan/:id
//
// Identitas evaluasi + standar tidak diubah.
// =====================================================

exports.updateEvaluasiLayanan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi layanan tidak valid.'
        });
    }


    const forbiddenFields = [
        'evaluasi_id',
        'standar_layanan_id'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah.`
            });
        }
    }


    const validationError =
        validateEvaluasiLayanan(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const allowedFields = [
        'cakupan_layanan_snapshot',
        'kesenjangan',
        'lesson_learned',
        'kesimpulan'
    ];


    const hasUpdate =
        allowedFields.some(
            (field) =>
                Object.prototype
                    .hasOwnProperty
                    .call(
                        req.body,
                        field
                    )
        );


    if (!hasUpdate) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_evaluasi_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi layanan tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            cakupan_layanan_snapshot:
                req.body
                    .cakupan_layanan_snapshot !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .cakupan_layanan_snapshot
                    )
                    : existing
                        .cakupan_layanan_snapshot,

            kesenjangan:
                req.body.kesenjangan !==
                undefined
                    ? normalizeOptionalText(
                        req.body.kesenjangan
                    )
                    : existing.kesenjangan,

            lesson_learned:
                req.body.lesson_learned !==
                undefined
                    ? normalizeOptionalText(
                        req.body
                            .lesson_learned
                    )
                    : existing
                        .lesson_learned,

            kesimpulan:
                req.body.kesimpulan !==
                undefined
                    ? normalizeOptionalText(
                        req.body.kesimpulan
                    )
                    : existing.kesimpulan
        };


        await db.query(
            `
            UPDATE mrp_evaluasi_layanan
            SET
                cakupan_layanan_snapshot = ?,
                kesenjangan = ?,
                lesson_learned = ?,
                kesimpulan = ?
            WHERE id = ?
            `,
            [
                final
                    .cakupan_layanan_snapshot,
                final.kesenjangan,
                final.lesson_learned,
                final.kesimpulan,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Evaluasi layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateEvaluasiLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui evaluasi layanan.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/evaluasi-layanan/:id
// =====================================================

exports.deleteEvaluasiLayanan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi layanan tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_evaluasi_layanan
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Evaluasi layanan tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Evaluasi layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteEvaluasiLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus evaluasi layanan.'
        });
    }
};

// =====================================================
// MRP 4 BAGIAN 1
// INDIKATOR EVALUASI LAYANAN
// =====================================================

const evaluasiLayananIndikatorSelectQuery = `
    SELECT
        eli.id,

        eli.evaluasi_layanan_id,

        el.evaluasi_id,
        e.kode_evaluasi,

        el.standar_layanan_id,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        eli.indikator_standar_id,

        mts.objek AS objek_indikator_standar,
        mts.prioritas AS prioritas_indikator_standar,

        eli.jenis_standar,
        eli.nama_indikator,
        eli.target_nilai,
        eli.rata_rata_realisasi,
        eli.pencapaian_persen,
        eli.satuan,
        eli.arah_target,

        eli.created_at,
        eli.updated_at

    FROM mrp_evaluasi_layanan_indikator eli

    JOIN mrp_evaluasi_layanan el
        ON el.id = eli.evaluasi_layanan_id

    JOIN mrp_evaluasi e
        ON e.id = el.evaluasi_id

    JOIN mrp_standar_layanan sl
        ON sl.id = el.standar_layanan_id

    JOIN mrp_katalog_layanan kl
        ON kl.id = sl.katalog_layanan_id

    JOIN layanan_digital ld
        ON ld.id = kl.layanan_id

    LEFT JOIN mrp_indikator_tambahan_standar mts
        ON mts.id = eli.indikator_standar_id
`;


// =====================================================
// HELPER NUMBER >= 0
// =====================================================

const isNonNegativeNumberValue = (value) => {
    if (
        value === null ||
        value === undefined ||
        value === ''
    ) {
        return false;
    }


    const number = Number(value);


    return (
        Number.isFinite(number) &&
        number >= 0
    );
};


// =====================================================
// VALIDASI INDIKATOR EVALUASI LAYANAN
// =====================================================

const validateEvaluasiLayananIndikator = (
    body,
    isCreate = true
) => {
    const {
        evaluasi_layanan_id,
        indikator_standar_id,
        jenis_standar,
        nama_indikator,
        target_nilai,
        rata_rata_realisasi,
        pencapaian_persen,
        satuan,
        arah_target
    } = body;


    if (
        evaluasi_layanan_id !== undefined &&
        !isPositiveInteger(
            evaluasi_layanan_id
        )
    ) {
        return (
            'evaluasi_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        evaluasi_layanan_id === undefined
    ) {
        return (
            'evaluasi_layanan_id wajib diisi.'
        );
    }


    if (
        indikator_standar_id !== undefined &&
        indikator_standar_id !== null &&
        indikator_standar_id !== '' &&
        !isPositiveInteger(
            indikator_standar_id
        )
    ) {
        return (
            'indikator_standar_id harus berupa ID yang valid.'
        );
    }


    if (
        jenis_standar !== undefined &&
        ![
            'SLA',
            'OLA'
        ].includes(jenis_standar)
    ) {
        return (
            'jenis_standar harus SLA atau OLA.'
        );
    }


    if (
        nama_indikator !== undefined &&
        (
            typeof nama_indikator !==
                'string' ||
            nama_indikator.trim() === ''
        )
    ) {
        return (
            'nama_indikator wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        typeof nama_indikator ===
            'string' &&
        nama_indikator.trim().length > 150
    ) {
        return (
            'nama_indikator maksimal 150 karakter.'
        );
    }


    if (
        target_nilai !== undefined &&
        !isNonNegativeNumberValue(
            target_nilai
        )
    ) {
        return (
            'target_nilai harus berupa angka 0 atau lebih.'
        );
    }


    if (
        rata_rata_realisasi !== undefined &&
        rata_rata_realisasi !== null &&
        rata_rata_realisasi !== '' &&
        !isNonNegativeNumberValue(
            rata_rata_realisasi
        )
    ) {
        return (
            'rata_rata_realisasi harus berupa angka 0 atau lebih.'
        );
    }


    if (
        pencapaian_persen !== undefined &&
        pencapaian_persen !== null &&
        pencapaian_persen !== '' &&
        !isNonNegativeNumberValue(
            pencapaian_persen
        )
    ) {
        return (
            'pencapaian_persen harus berupa angka 0 atau lebih.'
        );
    }


    if (
        satuan !== undefined &&
        (
            typeof satuan !== 'string' ||
            satuan.trim() === ''
        )
    ) {
        return (
            'satuan wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        typeof satuan === 'string' &&
        satuan.trim().length > 50
    ) {
        return (
            'satuan maksimal 50 karakter.'
        );
    }


    if (
        arah_target !== undefined &&
        ![
            'Minimal',
            'Maksimal',
            'Tepat'
        ].includes(arah_target)
    ) {
        return (
            'arah_target harus Minimal, Maksimal, atau Tepat.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/evaluasi-layanan-indikator
// =====================================================

exports.getAllEvaluasiLayananIndikator = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${evaluasiLayananIndikatorSelectQuery}

            ORDER BY
                eli.created_at DESC,
                eli.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllEvaluasiLayananIndikator error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi layanan.'
        });
    }
};


// =====================================================
// GET DETAIL
// GET /api/relasi-pengguna/evaluasi-layanan-indikator/:id
// =====================================================

exports.getEvaluasiLayananIndikatorById =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi layanan tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${evaluasiLayananIndikatorSelectQuery}

            WHERE eli.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi layanan tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiLayananIndikatorById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi layanan.'
        });
    }
};


// =====================================================
// GET BERDASARKAN EVALUASI LAYANAN
// GET /api/relasi-pengguna/evaluasi-layanan/:id/indikator
// =====================================================

exports.getIndikatorByEvaluasiLayanan =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi layanan tidak valid.'
        });
    }


    try {
        const [parent] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (parent.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${evaluasiLayananIndikatorSelectQuery}

            WHERE eli.evaluasi_layanan_id = ?

            ORDER BY
                eli.jenis_standar ASC,
                eli.nama_indikator ASC,
                eli.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getIndikatorByEvaluasiLayanan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi layanan.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/evaluasi-layanan-indikator
// =====================================================

exports.createEvaluasiLayananIndikator =
async (
    req,
    res
) => {
    const validationError =
        validateEvaluasiLayananIndikator(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        evaluasi_layanan_id,
        indikator_standar_id,
        jenis_standar,
        nama_indikator,
        target_nilai,
        rata_rata_realisasi,
        pencapaian_persen,
        satuan,
        arah_target
    } = req.body;


    try {
        // =============================================
        // CEK PARENT EVALUASI LAYANAN
        // =============================================

        const [parent] = await db.query(
            `
            SELECT
                el.id,
                el.standar_layanan_id

            FROM mrp_evaluasi_layanan el

            WHERE el.id = ?
            LIMIT 1
            `,
            [evaluasi_layanan_id]
        );


        if (parent.length === 0) {
            return res.status(400).json({
                message:
                    'evaluasi_layanan_id tidak ditemukan.'
            });
        }


        let finalIndikatorStandarId = null;
        let finalJenisStandar;
        let finalNamaIndikator;
        let finalTargetNilai;
        let finalSatuan;
        let finalArahTarget;


        // =============================================
        // JIKA MENGGUNAKAN MASTER INDIKATOR
        //
        // Snapshot target diambil dari master,
        // bukan dipercaya dari frontend.
        // =============================================

        if (
            indikator_standar_id !==
                undefined &&
            indikator_standar_id !== null &&
            indikator_standar_id !== ''
        ) {
            const [master] = await db.query(
                `
                SELECT
                    id,
                    standar_layanan_id,
                    objek,
                    jenis_standar,
                    nama_indikator,
                    target_nilai,
                    satuan,
                    arah_target

                FROM mrp_indikator_tambahan_standar

                WHERE id = ?
                LIMIT 1
                `,
                [
                    indikator_standar_id
                ]
            );


            if (master.length === 0) {
                return res.status(400).json({
                    message:
                        'indikator_standar_id tidak ditemukan.'
                });
            }


            if (
                master[0].objek !==
                'Layanan'
            ) {
                return res.status(400).json({
                    message:
                        'Indikator standar harus berobjek Layanan untuk evaluasi layanan.'
                });
            }


            if (
                Number(
                    master[0]
                        .standar_layanan_id
                ) !==
                Number(
                    parent[0]
                        .standar_layanan_id
                )
            ) {
                return res.status(400).json({
                    message:
                        'Indikator standar tidak berasal dari standar layanan yang sama.'
                });
            }


            finalIndikatorStandarId =
                Number(
                    indikator_standar_id
                );

            finalJenisStandar =
                master[0].jenis_standar;

            finalNamaIndikator =
                master[0].nama_indikator;

            finalTargetNilai =
                Number(
                    master[0].target_nilai
                );

            finalSatuan =
                master[0].satuan;

            finalArahTarget =
                master[0].arah_target;

        } else {
            // =========================================
            // INDIKATOR SNAPSHOT TANPA MASTER
            // =========================================

            if (
                jenis_standar ===
                    undefined ||
                nama_indikator ===
                    undefined ||
                target_nilai ===
                    undefined ||
                satuan === undefined ||
                arah_target ===
                    undefined
            ) {
                return res.status(400).json({
                    message:
                        'jenis_standar, nama_indikator, target_nilai, satuan, dan arah_target wajib diisi jika indikator_standar_id tidak digunakan.'
                });
            }


            finalJenisStandar =
                jenis_standar;

            finalNamaIndikator =
                nama_indikator.trim();

            finalTargetNilai =
                Number(target_nilai);

            finalSatuan =
                satuan.trim();

            finalArahTarget =
                arah_target;
        }


        // =============================================
        // CEK DUPLIKAT SNAPSHOT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_layanan_indikator

            WHERE evaluasi_layanan_id = ?
              AND jenis_standar = ?
              AND nama_indikator = ?

            LIMIT 1
            `,
            [
                evaluasi_layanan_id,
                finalJenisStandar,
                finalNamaIndikator
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi layanan.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_evaluasi_layanan_indikator (
                evaluasi_layanan_id,
                indikator_standar_id,
                jenis_standar,
                nama_indikator,
                target_nilai,
                rata_rata_realisasi,
                pencapaian_persen,
                satuan,
                arah_target
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
            `,
            [
                Number(
                    evaluasi_layanan_id
                ),

                finalIndikatorStandarId,

                finalJenisStandar,

                finalNamaIndikator,

                finalTargetNilai,

                (
                    rata_rata_realisasi ===
                        undefined ||
                    rata_rata_realisasi ===
                        null ||
                    rata_rata_realisasi === ''
                )
                    ? null
                    : Number(
                        rata_rata_realisasi
                    ),

                (
                    pencapaian_persen ===
                        undefined ||
                    pencapaian_persen ===
                        null ||
                    pencapaian_persen === ''
                )
                    ? null
                    : Number(
                        pencapaian_persen
                    ),

                finalSatuan,

                finalArahTarget
            ]
        );


        return res.status(201).json({
            message:
                'Indikator evaluasi layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createEvaluasiLayananIndikator error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi layanan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat indikator evaluasi layanan.'
        });
    }
};


// =====================================================
// UPDATE HASIL EVALUASI INDIKATOR
// PUT /api/relasi-pengguna/evaluasi-layanan-indikator/:id
// =====================================================

exports.updateEvaluasiLayananIndikator =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi layanan tidak valid.'
        });
    }


    const forbiddenFields = [
        'evaluasi_layanan_id',
        'indikator_standar_id'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah.`
            });
        }
    }


    const validationError =
        validateEvaluasiLayananIndikator(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const allowedFields = [
        'jenis_standar',
        'nama_indikator',
        'target_nilai',
        'rata_rata_realisasi',
        'pencapaian_persen',
        'satuan',
        'arah_target'
    ];


    const hasUpdate =
        allowedFields.some(
            (field) =>
                Object.prototype
                    .hasOwnProperty
                    .call(
                        req.body,
                        field
                    )
        );


    if (!hasUpdate) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_evaluasi_layanan_indikator
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi layanan tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            jenis_standar:
                req.body.jenis_standar !==
                undefined
                    ? req.body.jenis_standar
                    : existing
                        .jenis_standar,

            nama_indikator:
                req.body.nama_indikator !==
                undefined
                    ? req.body
                        .nama_indikator
                        .trim()
                    : existing
                        .nama_indikator,

            target_nilai:
                req.body.target_nilai !==
                undefined
                    ? Number(
                        req.body.target_nilai
                    )
                    : Number(
                        existing.target_nilai
                    ),

            rata_rata_realisasi:
                req.body
                    .rata_rata_realisasi !==
                undefined
                    ? (
                        req.body
                            .rata_rata_realisasi ===
                            null ||
                        req.body
                            .rata_rata_realisasi ===
                            ''
                            ? null
                            : Number(
                                req.body
                                    .rata_rata_realisasi
                            )
                    )
                    : existing
                        .rata_rata_realisasi,

            pencapaian_persen:
                req.body
                    .pencapaian_persen !==
                undefined
                    ? (
                        req.body
                            .pencapaian_persen ===
                            null ||
                        req.body
                            .pencapaian_persen ===
                            ''
                            ? null
                            : Number(
                                req.body
                                    .pencapaian_persen
                            )
                    )
                    : existing
                        .pencapaian_persen,

            satuan:
                req.body.satuan !==
                undefined
                    ? req.body.satuan.trim()
                    : existing.satuan,

            arah_target:
                req.body.arah_target !==
                undefined
                    ? req.body.arah_target
                    : existing.arah_target
        };


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_layanan_indikator

            WHERE evaluasi_layanan_id = ?
              AND jenis_standar = ?
              AND nama_indikator = ?
              AND id <> ?

            LIMIT 1
            `,
            [
                existing
                    .evaluasi_layanan_id,
                final.jenis_standar,
                final.nama_indikator,
                id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi layanan.'
            });
        }


        await db.query(
            `
            UPDATE mrp_evaluasi_layanan_indikator

            SET
                jenis_standar = ?,
                nama_indikator = ?,
                target_nilai = ?,
                rata_rata_realisasi = ?,
                pencapaian_persen = ?,
                satuan = ?,
                arah_target = ?

            WHERE id = ?
            `,
            [
                final.jenis_standar,
                final.nama_indikator,
                final.target_nilai,
                final.rata_rata_realisasi,
                final.pencapaian_persen,
                final.satuan,
                final.arah_target,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Indikator evaluasi layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateEvaluasiLayananIndikator error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi layanan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui indikator evaluasi layanan.'
        });
    }
};


// =====================================================
// DELETE
// DELETE /api/relasi-pengguna/evaluasi-layanan-indikator/:id
// =====================================================

exports.deleteEvaluasiLayananIndikator =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi layanan tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE
            FROM mrp_evaluasi_layanan_indikator
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi layanan tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Indikator evaluasi layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteEvaluasiLayananIndikator error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus indikator evaluasi layanan.'
        });
    }
};

// =====================================================
// MRP 4 BAGIAN 2
// EVALUASI KUERI & INSIDEN
// =====================================================

const evaluasiKueriInsidenSelectQuery = `
    SELECT
        eki.id,

        eki.evaluasi_id,
        e.kode_evaluasi,
        e.instansi_id,
        e.periode_mulai,
        e.periode_selesai,

        eki.target_kueri_insiden_id,

        tki.standar_layanan_id,
        tki.jenis,
        tki.prioritas,

        tki.sla_waktu_respon_menit,
        tki.sla_waktu_penyelesaian_menit,
        tki.ola_waktu_respon_menit,
        tki.ola_waktu_penyelesaian_menit,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        eki.target_waktu_respon_menit,
        eki.rata_rata_waktu_respon_menit,
        eki.pencapaian_respon_persen,

        eki.target_waktu_penyelesaian_menit,
        eki.rata_rata_waktu_penyelesaian_menit,
        eki.pencapaian_penyelesaian_persen,

        eki.kesenjangan,
        eki.lesson_learned,

        eki.created_at,
        eki.updated_at

    FROM mrp_evaluasi_kueri_insiden eki

    JOIN mrp_evaluasi e
        ON e.id = eki.evaluasi_id

    JOIN mrp_target_kueri_insiden tki
        ON tki.id = eki.target_kueri_insiden_id

    JOIN mrp_standar_layanan sl
        ON sl.id = tki.standar_layanan_id

    JOIN mrp_katalog_layanan kl
        ON kl.id = sl.katalog_layanan_id

    JOIN layanan_digital ld
        ON ld.id = kl.layanan_id
`;


// =====================================================
// VALIDASI
// =====================================================

const validateEvaluasiKueriInsiden = (
    body,
    isCreate = true
) => {
    const {
        evaluasi_id,
        target_kueri_insiden_id,
        rata_rata_waktu_respon_menit,
        pencapaian_respon_persen,
        rata_rata_waktu_penyelesaian_menit,
        pencapaian_penyelesaian_persen,
        kesenjangan,
        lesson_learned
    } = body;


    if (
        evaluasi_id !== undefined &&
        !isPositiveInteger(evaluasi_id)
    ) {
        return 'evaluasi_id wajib berupa ID yang valid.';
    }


    if (
        isCreate &&
        evaluasi_id === undefined
    ) {
        return 'evaluasi_id wajib diisi.';
    }


    if (
        target_kueri_insiden_id !== undefined &&
        !isPositiveInteger(
            target_kueri_insiden_id
        )
    ) {
        return (
            'target_kueri_insiden_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        target_kueri_insiden_id === undefined
    ) {
        return (
            'target_kueri_insiden_id wajib diisi.'
        );
    }


    const numberFields = [
        [
            'rata_rata_waktu_respon_menit',
            rata_rata_waktu_respon_menit
        ],
        [
            'pencapaian_respon_persen',
            pencapaian_respon_persen
        ],
        [
            'rata_rata_waktu_penyelesaian_menit',
            rata_rata_waktu_penyelesaian_menit
        ],
        [
            'pencapaian_penyelesaian_persen',
            pencapaian_penyelesaian_persen
        ]
    ];


    for (const [field, value] of numberFields) {
        if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            !isNonNegativeNumberValue(value)
        ) {
            return (
                `${field} harus berupa angka 0 atau lebih.`
            );
        }
    }


    const textFields = [
        [
            'kesenjangan',
            kesenjangan
        ],
        [
            'lesson_learned',
            lesson_learned
        ]
    ];


    for (const [field, value] of textFields) {
        if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'string'
        ) {
            return `${field} harus berupa teks.`;
        }
    }


    return null;
};


// =====================================================
// GET ALL
// =====================================================

exports.getAllEvaluasiKueriInsiden = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${evaluasiKueriInsidenSelectQuery}

            ORDER BY
                eki.created_at DESC,
                eki.id DESC
        `);


        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllEvaluasiKueriInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// GET DETAIL
// =====================================================

exports.getEvaluasiKueriInsidenById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi kueri dan insiden tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${evaluasiKueriInsidenSelectQuery}

            WHERE eki.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi kueri dan insiden tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiKueriInsidenById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// GET BERDASARKAN EVALUASI
// GET /evaluasi/:id/kueri-insiden
// =====================================================

exports.getKueriInsidenByEvaluasi = async (
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
        const [evaluasi] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (evaluasi.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${evaluasiKueriInsidenSelectQuery}

            WHERE eki.evaluasi_id = ?

            ORDER BY
                ld.nama_layanan ASC,
                tki.jenis ASC,
                tki.prioritas ASC,
                eki.id ASC
            `,
            [id]
        );


        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getKueriInsidenByEvaluasi error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// CREATE
// =====================================================

exports.createEvaluasiKueriInsiden = async (
    req,
    res
) => {
    const validationError =
        validateEvaluasiKueriInsiden(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        evaluasi_id,
        target_kueri_insiden_id,
        rata_rata_waktu_respon_menit,
        pencapaian_respon_persen,
        rata_rata_waktu_penyelesaian_menit,
        pencapaian_penyelesaian_persen,
        kesenjangan,
        lesson_learned
    } = req.body;


    try {
        // =============================================
        // CEK EVALUASI
        // =============================================

        const [evaluasi] = await db.query(
            `
            SELECT
                id,
                instansi_id
            FROM mrp_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [evaluasi_id]
        );


        if (evaluasi.length === 0) {
            return res.status(400).json({
                message:
                    'evaluasi_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK TARGET + STANDAR + LAYANAN
        // =============================================

        const [target] = await db.query(
            `
            SELECT
                tki.id,
                tki.jenis,
                tki.prioritas,

                tki.sla_waktu_respon_menit,
                tki.sla_waktu_penyelesaian_menit,

                tki.ola_waktu_respon_menit,
                tki.ola_waktu_penyelesaian_menit,

                ld.instansi_id AS layanan_instansi_id

            FROM mrp_target_kueri_insiden tki

            JOIN mrp_standar_layanan sl
                ON sl.id =
                    tki.standar_layanan_id

            JOIN mrp_katalog_layanan kl
                ON kl.id =
                    sl.katalog_layanan_id

            JOIN layanan_digital ld
                ON ld.id =
                    kl.layanan_id

            WHERE tki.id = ?
            LIMIT 1
            `,
            [target_kueri_insiden_id]
        );


        if (target.length === 0) {
            return res.status(400).json({
                message:
                    'target_kueri_insiden_id tidak ditemukan.'
            });
        }


        if (
            Number(evaluasi[0].instansi_id) !==
            Number(
                target[0].layanan_instansi_id
            )
        ) {
            return res.status(400).json({
                message:
                    'Target kueri/insiden tidak berasal dari instansi yang sama dengan evaluasi.'
            });
        }


        // =============================================
        // SNAPSHOT TARGET
        //
        // Kueri   -> SLA
        // Insiden -> OLA
        // =============================================

        let targetWaktuRespon = null;
        let targetWaktuPenyelesaian = null;


        if (target[0].jenis === 'Kueri') {
            targetWaktuRespon =
                target[0]
                    .sla_waktu_respon_menit;

            targetWaktuPenyelesaian =
                target[0]
                    .sla_waktu_penyelesaian_menit;

        } else {
            targetWaktuRespon =
                target[0]
                    .ola_waktu_respon_menit;

            targetWaktuPenyelesaian =
                target[0]
                    .ola_waktu_penyelesaian_menit;
        }


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_kueri_insiden

            WHERE evaluasi_id = ?
              AND target_kueri_insiden_id = ?

            LIMIT 1
            `,
            [
                evaluasi_id,
                target_kueri_insiden_id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Target kueri/insiden sudah dievaluasi pada periode tersebut.'
            });
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_evaluasi_kueri_insiden (
                evaluasi_id,
                target_kueri_insiden_id,

                target_waktu_respon_menit,
                rata_rata_waktu_respon_menit,
                pencapaian_respon_persen,

                target_waktu_penyelesaian_menit,
                rata_rata_waktu_penyelesaian_menit,
                pencapaian_penyelesaian_persen,

                kesenjangan,
                lesson_learned
            )
            VALUES (
                ?, ?,
                ?, ?, ?,
                ?, ?, ?,
                ?, ?
            )
            `,
            [
                Number(evaluasi_id),

                Number(
                    target_kueri_insiden_id
                ),

                targetWaktuRespon,

                (
                    rata_rata_waktu_respon_menit ===
                        undefined ||
                    rata_rata_waktu_respon_menit ===
                        null ||
                    rata_rata_waktu_respon_menit === ''
                )
                    ? null
                    : Number(
                        rata_rata_waktu_respon_menit
                    ),

                (
                    pencapaian_respon_persen ===
                        undefined ||
                    pencapaian_respon_persen ===
                        null ||
                    pencapaian_respon_persen === ''
                )
                    ? null
                    : Number(
                        pencapaian_respon_persen
                    ),

                targetWaktuPenyelesaian,

                (
                    rata_rata_waktu_penyelesaian_menit ===
                        undefined ||
                    rata_rata_waktu_penyelesaian_menit ===
                        null ||
                    rata_rata_waktu_penyelesaian_menit === ''
                )
                    ? null
                    : Number(
                        rata_rata_waktu_penyelesaian_menit
                    ),

                (
                    pencapaian_penyelesaian_persen ===
                        undefined ||
                    pencapaian_penyelesaian_persen ===
                        null ||
                    pencapaian_penyelesaian_persen === ''
                )
                    ? null
                    : Number(
                        pencapaian_penyelesaian_persen
                    ),

                normalizeOptionalText(
                    kesenjangan
                ),

                normalizeOptionalText(
                    lesson_learned
                )
            ]
        );


        return res.status(201).json({
            message:
                'Evaluasi kueri dan insiden berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createEvaluasiKueriInsiden error:',
            error
        );


        if (
            error.code === 'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Target kueri/insiden sudah dievaluasi pada periode tersebut.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// UPDATE HASIL EVALUASI
//
// Target snapshot dan relasi tidak boleh diubah.
// =====================================================

exports.updateEvaluasiKueriInsiden = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi kueri dan insiden tidak valid.'
        });
    }


    const forbiddenFields = [
        'evaluasi_id',
        'target_kueri_insiden_id',
        'target_waktu_respon_menit',
        'target_waktu_penyelesaian_menit'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah.`
            });
        }
    }


    const validationError =
        validateEvaluasiKueriInsiden(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const allowedFields = [
        'rata_rata_waktu_respon_menit',
        'pencapaian_respon_persen',
        'rata_rata_waktu_penyelesaian_menit',
        'pencapaian_penyelesaian_persen',
        'kesenjangan',
        'lesson_learned'
    ];


    const hasUpdate =
        allowedFields.some(
            (field) =>
                Object.prototype
                    .hasOwnProperty
                    .call(
                        req.body,
                        field
                    )
        );


    if (!hasUpdate) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_evaluasi_kueri_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi kueri dan insiden tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const numericValue = (
            requestValue,
            existingValue
        ) => {
            if (requestValue === undefined) {
                return existingValue;
            }


            if (
                requestValue === null ||
                requestValue === ''
            ) {
                return null;
            }


            return Number(requestValue);
        };


        const final = {
            rata_rata_waktu_respon_menit:
                numericValue(
                    req.body
                        .rata_rata_waktu_respon_menit,
                    existing
                        .rata_rata_waktu_respon_menit
                ),

            pencapaian_respon_persen:
                numericValue(
                    req.body
                        .pencapaian_respon_persen,
                    existing
                        .pencapaian_respon_persen
                ),

            rata_rata_waktu_penyelesaian_menit:
                numericValue(
                    req.body
                        .rata_rata_waktu_penyelesaian_menit,
                    existing
                        .rata_rata_waktu_penyelesaian_menit
                ),

            pencapaian_penyelesaian_persen:
                numericValue(
                    req.body
                        .pencapaian_penyelesaian_persen,
                    existing
                        .pencapaian_penyelesaian_persen
                ),

            kesenjangan:
                req.body.kesenjangan !== undefined
                    ? normalizeOptionalText(
                        req.body.kesenjangan
                    )
                    : existing.kesenjangan,

            lesson_learned:
                req.body.lesson_learned !==
                undefined
                    ? normalizeOptionalText(
                        req.body.lesson_learned
                    )
                    : existing.lesson_learned
        };


        await db.query(
            `
            UPDATE mrp_evaluasi_kueri_insiden

            SET
                rata_rata_waktu_respon_menit = ?,
                pencapaian_respon_persen = ?,
                rata_rata_waktu_penyelesaian_menit = ?,
                pencapaian_penyelesaian_persen = ?,
                kesenjangan = ?,
                lesson_learned = ?

            WHERE id = ?
            `,
            [
                final
                    .rata_rata_waktu_respon_menit,

                final
                    .pencapaian_respon_persen,

                final
                    .rata_rata_waktu_penyelesaian_menit,

                final
                    .pencapaian_penyelesaian_persen,

                final.kesenjangan,
                final.lesson_learned,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Evaluasi kueri dan insiden berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateEvaluasiKueriInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// DELETE
// =====================================================

exports.deleteEvaluasiKueriInsiden = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi kueri dan insiden tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE
            FROM mrp_evaluasi_kueri_insiden
            WHERE id = ?
            `,
            [id]
        );


        if (result.affectedRows === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi kueri dan insiden tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Evaluasi kueri dan insiden berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteEvaluasiKueriInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus evaluasi kueri dan insiden.'
        });
    }
};

// =====================================================
// MRP 4 BAGIAN 2
// INDIKATOR EVALUASI KUERI & INSIDEN
// =====================================================

const evaluasiKueriInsidenIndikatorSelectQuery = `
    SELECT
        ekii.id,

        ekii.evaluasi_kueri_insiden_id,

        eki.evaluasi_id,
        e.kode_evaluasi,

        eki.target_kueri_insiden_id,

        tki.standar_layanan_id,
        tki.jenis,
        tki.prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        ekii.indikator_standar_id,

        mts.objek AS objek_indikator_standar,
        mts.jenis_standar,
        mts.prioritas AS prioritas_indikator_standar,

        ekii.nama_indikator,
        ekii.target_nilai,
        ekii.rata_rata_realisasi,
        ekii.pencapaian_persen,
        ekii.satuan,
        ekii.arah_target,

        ekii.created_at,
        ekii.updated_at

    FROM mrp_evaluasi_kueri_insiden_indikator ekii

    JOIN mrp_evaluasi_kueri_insiden eki
        ON eki.id =
            ekii.evaluasi_kueri_insiden_id

    JOIN mrp_evaluasi e
        ON e.id = eki.evaluasi_id

    JOIN mrp_target_kueri_insiden tki
        ON tki.id =
            eki.target_kueri_insiden_id

    JOIN mrp_standar_layanan sl
        ON sl.id =
            tki.standar_layanan_id

    JOIN mrp_katalog_layanan kl
        ON kl.id =
            sl.katalog_layanan_id

    JOIN layanan_digital ld
        ON ld.id =
            kl.layanan_id

    LEFT JOIN mrp_indikator_tambahan_standar mts
        ON mts.id =
            ekii.indikator_standar_id
`;


// =====================================================
// VALIDASI
// =====================================================

const validateEvaluasiKueriInsidenIndikator = (
    body,
    isCreate = true
) => {
    const {
        evaluasi_kueri_insiden_id,
        indikator_standar_id,
        nama_indikator,
        target_nilai,
        rata_rata_realisasi,
        pencapaian_persen,
        satuan,
        arah_target
    } = body;


    if (
        evaluasi_kueri_insiden_id !== undefined &&
        !isPositiveInteger(
            evaluasi_kueri_insiden_id
        )
    ) {
        return (
            'evaluasi_kueri_insiden_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        evaluasi_kueri_insiden_id === undefined
    ) {
        return (
            'evaluasi_kueri_insiden_id wajib diisi.'
        );
    }


    if (
        indikator_standar_id !== undefined &&
        indikator_standar_id !== null &&
        indikator_standar_id !== '' &&
        !isPositiveInteger(
            indikator_standar_id
        )
    ) {
        return (
            'indikator_standar_id harus berupa ID yang valid.'
        );
    }


    if (
        nama_indikator !== undefined &&
        (
            typeof nama_indikator !==
                'string' ||
            nama_indikator.trim() === ''
        )
    ) {
        return (
            'nama_indikator wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        typeof nama_indikator === 'string' &&
        nama_indikator.trim().length > 150
    ) {
        return (
            'nama_indikator maksimal 150 karakter.'
        );
    }


    if (
        target_nilai !== undefined &&
        !isNonNegativeNumberValue(
            target_nilai
        )
    ) {
        return (
            'target_nilai harus berupa angka 0 atau lebih.'
        );
    }


    if (
        rata_rata_realisasi !== undefined &&
        rata_rata_realisasi !== null &&
        rata_rata_realisasi !== '' &&
        !isNonNegativeNumberValue(
            rata_rata_realisasi
        )
    ) {
        return (
            'rata_rata_realisasi harus berupa angka 0 atau lebih.'
        );
    }


    if (
        pencapaian_persen !== undefined &&
        pencapaian_persen !== null &&
        pencapaian_persen !== '' &&
        !isNonNegativeNumberValue(
            pencapaian_persen
        )
    ) {
        return (
            'pencapaian_persen harus berupa angka 0 atau lebih.'
        );
    }


    if (
        satuan !== undefined &&
        (
            typeof satuan !== 'string' ||
            satuan.trim() === ''
        )
    ) {
        return (
            'satuan wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        typeof satuan === 'string' &&
        satuan.trim().length > 50
    ) {
        return (
            'satuan maksimal 50 karakter.'
        );
    }


    if (
        arah_target !== undefined &&
        ![
            'Minimal',
            'Maksimal',
            'Tepat'
        ].includes(arah_target)
    ) {
        return (
            'arah_target harus Minimal, Maksimal, atau Tepat.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// =====================================================

exports.getAllEvaluasiKueriInsidenIndikator =
async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${evaluasiKueriInsidenIndikatorSelectQuery}

            ORDER BY
                ekii.created_at DESC,
                ekii.id DESC
        `);


        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllEvaluasiKueriInsidenIndikator error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// GET DETAIL
// =====================================================

exports.getEvaluasiKueriInsidenIndikatorById =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi kueri dan insiden tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${evaluasiKueriInsidenIndikatorSelectQuery}

            WHERE ekii.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi kueri dan insiden tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiKueriInsidenIndikatorById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// GET BERDASARKAN PARENT
// GET /evaluasi-kueri-insiden/:id/indikator
// =====================================================

exports.getIndikatorByEvaluasiKueriInsiden =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi kueri dan insiden tidak valid.'
        });
    }


    try {
        const [parent] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_kueri_insiden
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (parent.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi kueri dan insiden tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${evaluasiKueriInsidenIndikatorSelectQuery}

            WHERE
                ekii.evaluasi_kueri_insiden_id = ?

            ORDER BY
                ekii.nama_indikator ASC,
                ekii.id ASC
            `,
            [id]
        );


        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getIndikatorByEvaluasiKueriInsiden error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// CREATE
// =====================================================

exports.createEvaluasiKueriInsidenIndikator =
async (
    req,
    res
) => {
    const validationError =
        validateEvaluasiKueriInsidenIndikator(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        evaluasi_kueri_insiden_id,
        indikator_standar_id,
        nama_indikator,
        target_nilai,
        rata_rata_realisasi,
        pencapaian_persen,
        satuan,
        arah_target
    } = req.body;


    try {
        // =============================================
        // CEK PARENT + TARGET
        // =============================================

        const [parent] = await db.query(
            `
            SELECT
                eki.id,
                tki.standar_layanan_id,
                tki.jenis,
                tki.prioritas

            FROM mrp_evaluasi_kueri_insiden eki

            JOIN mrp_target_kueri_insiden tki
                ON tki.id =
                    eki.target_kueri_insiden_id

            WHERE eki.id = ?
            LIMIT 1
            `,
            [evaluasi_kueri_insiden_id]
        );


        if (parent.length === 0) {
            return res.status(400).json({
                message:
                    'evaluasi_kueri_insiden_id tidak ditemukan.'
            });
        }


        let finalIndikatorStandarId = null;
        let finalNamaIndikator;
        let finalTargetNilai;
        let finalSatuan;
        let finalArahTarget;


        // =============================================
        // MENGGUNAKAN MASTER INDIKATOR
        // =============================================

        if (
            indikator_standar_id !== undefined &&
            indikator_standar_id !== null &&
            indikator_standar_id !== ''
        ) {
            const [master] = await db.query(
                `
                SELECT
                    id,
                    standar_layanan_id,
                    objek,
                    jenis_standar,
                    prioritas,
                    nama_indikator,
                    target_nilai,
                    satuan,
                    arah_target

                FROM mrp_indikator_tambahan_standar

                WHERE id = ?
                LIMIT 1
                `,
                [indikator_standar_id]
            );


            if (master.length === 0) {
                return res.status(400).json({
                    message:
                        'indikator_standar_id tidak ditemukan.'
                });
            }


            if (
                Number(
                    master[0]
                        .standar_layanan_id
                ) !==
                Number(
                    parent[0]
                        .standar_layanan_id
                )
            ) {
                return res.status(400).json({
                    message:
                        'Indikator standar tidak berasal dari standar layanan yang sama.'
                });
            }


            if (
                master[0].objek !==
                parent[0].jenis
            ) {
                return res.status(400).json({
                    message:
                        `Indikator standar harus berobjek ${parent[0].jenis}.`
                });
            }


            if (
                master[0].prioritas !==
                parent[0].prioritas
            ) {
                return res.status(400).json({
                    message:
                        'Prioritas indikator standar tidak sesuai dengan prioritas target yang dievaluasi.'
                });
            }


            finalIndikatorStandarId =
                Number(
                    indikator_standar_id
                );

            finalNamaIndikator =
                master[0].nama_indikator;

            finalTargetNilai =
                Number(
                    master[0].target_nilai
                );

            finalSatuan =
                master[0].satuan;

            finalArahTarget =
                master[0].arah_target;

        } else {
            // =========================================
            // SNAPSHOT INDIKATOR TANPA MASTER
            // =========================================

            if (
                nama_indikator === undefined ||
                target_nilai === undefined ||
                satuan === undefined ||
                arah_target === undefined
            ) {
                return res.status(400).json({
                    message:
                        'nama_indikator, target_nilai, satuan, dan arah_target wajib diisi jika indikator_standar_id tidak digunakan.'
                });
            }


            finalNamaIndikator =
                nama_indikator.trim();

            finalTargetNilai =
                Number(target_nilai);

            finalSatuan =
                satuan.trim();

            finalArahTarget =
                arah_target;
        }


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_kueri_insiden_indikator

            WHERE
                evaluasi_kueri_insiden_id = ?
                AND nama_indikator = ?

            LIMIT 1
            `,
            [
                evaluasi_kueri_insiden_id,
                finalNamaIndikator
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi kueri dan insiden.'
            });
        }


        const finalRealisasi =
            (
                rata_rata_realisasi ===
                    undefined ||
                rata_rata_realisasi ===
                    null ||
                rata_rata_realisasi === ''
            )
                ? null
                : Number(
                    rata_rata_realisasi
                );


        const finalPencapaian =
            (
                pencapaian_persen ===
                    undefined ||
                pencapaian_persen ===
                    null ||
                pencapaian_persen === ''
            )
                ? null
                : Number(
                    pencapaian_persen
                );


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO
                mrp_evaluasi_kueri_insiden_indikator
            (
                evaluasi_kueri_insiden_id,
                indikator_standar_id,
                nama_indikator,
                target_nilai,
                rata_rata_realisasi,
                pencapaian_persen,
                satuan,
                arah_target
            )
            VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?
            )
            `,
            [
                Number(
                    evaluasi_kueri_insiden_id
                ),
                finalIndikatorStandarId,
                finalNamaIndikator,
                finalTargetNilai,
                finalRealisasi,
                finalPencapaian,
                finalSatuan,
                finalArahTarget
            ]
        );


        return res.status(201).json({
            message:
                'Indikator evaluasi kueri dan insiden berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createEvaluasiKueriInsidenIndikator error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi kueri dan insiden.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat indikator evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// UPDATE
//
// Parent dan referensi master tidak boleh diubah.
// =====================================================

exports.updateEvaluasiKueriInsidenIndikator =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi kueri dan insiden tidak valid.'
        });
    }


    const forbiddenFields = [
        'evaluasi_kueri_insiden_id',
        'indikator_standar_id'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah.`
            });
        }
    }


    const validationError =
        validateEvaluasiKueriInsidenIndikator(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const allowedFields = [
        'nama_indikator',
        'target_nilai',
        'rata_rata_realisasi',
        'pencapaian_persen',
        'satuan',
        'arah_target'
    ];


    const hasUpdate =
        allowedFields.some(
            (field) =>
                Object.prototype
                    .hasOwnProperty
                    .call(
                        req.body,
                        field
                    )
        );


    if (!hasUpdate) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_evaluasi_kueri_insiden_indikator
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi kueri dan insiden tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            nama_indikator:
                req.body.nama_indikator !==
                undefined
                    ? req.body
                        .nama_indikator
                        .trim()
                    : existing
                        .nama_indikator,

            target_nilai:
                req.body.target_nilai !==
                undefined
                    ? Number(
                        req.body.target_nilai
                    )
                    : Number(
                        existing.target_nilai
                    ),

            rata_rata_realisasi:
                req.body
                    .rata_rata_realisasi !==
                undefined
                    ? (
                        req.body
                            .rata_rata_realisasi ===
                            null ||
                        req.body
                            .rata_rata_realisasi ===
                            ''
                            ? null
                            : Number(
                                req.body
                                    .rata_rata_realisasi
                            )
                    )
                    : existing
                        .rata_rata_realisasi,

            pencapaian_persen:
                req.body
                    .pencapaian_persen !==
                undefined
                    ? (
                        req.body
                            .pencapaian_persen ===
                            null ||
                        req.body
                            .pencapaian_persen ===
                            ''
                            ? null
                            : Number(
                                req.body
                                    .pencapaian_persen
                            )
                    )
                    : existing
                        .pencapaian_persen,

            satuan:
                req.body.satuan !==
                undefined
                    ? req.body.satuan.trim()
                    : existing.satuan,

            arah_target:
                req.body.arah_target !==
                undefined
                    ? req.body.arah_target
                    : existing.arah_target
        };


        // =============================================
        // CEK DUPLIKAT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_kueri_insiden_indikator

            WHERE
                evaluasi_kueri_insiden_id = ?
                AND nama_indikator = ?
                AND id <> ?

            LIMIT 1
            `,
            [
                existing
                    .evaluasi_kueri_insiden_id,
                final.nama_indikator,
                id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi kueri dan insiden.'
            });
        }


        await db.query(
            `
            UPDATE
                mrp_evaluasi_kueri_insiden_indikator

            SET
                nama_indikator = ?,
                target_nilai = ?,
                rata_rata_realisasi = ?,
                pencapaian_persen = ?,
                satuan = ?,
                arah_target = ?

            WHERE id = ?
            `,
            [
                final.nama_indikator,
                final.target_nilai,
                final.rata_rata_realisasi,
                final.pencapaian_persen,
                final.satuan,
                final.arah_target,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Indikator evaluasi kueri dan insiden berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateEvaluasiKueriInsidenIndikator error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi kueri dan insiden.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui indikator evaluasi kueri dan insiden.'
        });
    }
};


// =====================================================
// DELETE
// =====================================================

exports.deleteEvaluasiKueriInsidenIndikator =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi kueri dan insiden tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM
                mrp_evaluasi_kueri_insiden_indikator
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi kueri dan insiden tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Indikator evaluasi kueri dan insiden berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteEvaluasiKueriInsidenIndikator error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus indikator evaluasi kueri dan insiden.'
        });
    }
};

// =====================================================
// MRP 4 - EVALUASI SERVICE REQUEST
// =====================================================

const evaluasiPermintaanSelectQuery = `
    SELECT
        ep.id,

        ep.permintaan_layanan_id,

        pl.kode_request,
        pl.layanan_id,
        pl.standar_layanan_id,
        pl.waktu_masuk,
        pl.urgensi,
        pl.status AS status_permintaan,

        ld.kode_layanan,
        ld.nama_layanan,

        ep.target_waktu_respon_menit,
        ep.realisasi_waktu_respon_menit,
        ep.pencapaian_respon_persen,

        ep.target_waktu_penyelesaian_menit,
        ep.realisasi_waktu_penyelesaian_menit,
        ep.pencapaian_penyelesaian_persen,

        ep.keterangan_ketepatan,

        ep.dievaluasi_oleh,
        u.nama AS nama_evaluator,

        ep.tanggal_evaluasi,
        ep.catatan,

        ep.created_at,
        ep.updated_at

    FROM mrp_evaluasi_permintaan ep

    JOIN mrp_permintaan_layanan pl
        ON pl.id = ep.permintaan_layanan_id

    JOIN layanan_digital ld
        ON ld.id = pl.layanan_id

    JOIN users u
        ON u.id = ep.dievaluasi_oleh
`;


// =====================================================
// VALIDASI
// =====================================================

const validateEvaluasiPermintaan = (
    body,
    isCreate = true
) => {
    const {
        permintaan_layanan_id,
        realisasi_waktu_respon_menit,
        pencapaian_respon_persen,
        realisasi_waktu_penyelesaian_menit,
        pencapaian_penyelesaian_persen,
        catatan
    } = body;


    if (
        permintaan_layanan_id !== undefined &&
        !isPositiveInteger(
            permintaan_layanan_id
        )
    ) {
        return (
            'permintaan_layanan_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        permintaan_layanan_id === undefined
    ) {
        return (
            'permintaan_layanan_id wajib diisi.'
        );
    }


    const numberFields = [
        [
            'realisasi_waktu_respon_menit',
            realisasi_waktu_respon_menit
        ],
        [
            'pencapaian_respon_persen',
            pencapaian_respon_persen
        ],
        [
            'realisasi_waktu_penyelesaian_menit',
            realisasi_waktu_penyelesaian_menit
        ],
        [
            'pencapaian_penyelesaian_persen',
            pencapaian_penyelesaian_persen
        ]
    ];


    for (const [field, value] of numberFields) {
        if (
            value !== undefined &&
            value !== null &&
            value !== '' &&
            !isNonNegativeNumberValue(value)
        ) {
            return (
                `${field} harus berupa angka 0 atau lebih.`
            );
        }
    }


    if (
        catatan !== undefined &&
        catatan !== null &&
        typeof catatan !== 'string'
    ) {
        return 'catatan harus berupa teks.';
    }


    return null;
};


// =====================================================
// HELPER NILAI OPSIONAL
// =====================================================

const evaluasiPermintaanNumber = (value) => {
    if (
        value === undefined ||
        value === null ||
        value === ''
    ) {
        return null;
    }


    return Number(value);
};


// =====================================================
// HELPER KETEPATAN
//
// Hanya dapat dinilai jika request sudah Selesai
// serta target dan realisasi penyelesaian tersedia.
// =====================================================

const getKeteranganKetepatanPermintaan = (
    statusPermintaan,
    targetPenyelesaian,
    realisasiPenyelesaian
) => {
    if (
        statusPermintaan !== 'Selesai' ||
        targetPenyelesaian === null ||
        targetPenyelesaian === undefined ||
        realisasiPenyelesaian === null ||
        realisasiPenyelesaian === undefined
    ) {
        return 'Belum Dapat Dinilai';
    }


    return (
        Number(realisasiPenyelesaian) <=
        Number(targetPenyelesaian)
    )
        ? 'Tepat Waktu'
        : 'Terlambat';
};


// =====================================================
// GET ALL
// GET /api/relasi-pengguna/evaluasi-permintaan
// =====================================================

exports.getAllEvaluasiPermintaan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${evaluasiPermintaanSelectQuery}

            ORDER BY
                ep.tanggal_evaluasi DESC,
                ep.id DESC
        `);


        return res.status(200).json(rows);

    } catch (error) {
        console.error(
            'getAllEvaluasiPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// GET DETAIL
// =====================================================

exports.getEvaluasiPermintaanById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi permintaan tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${evaluasiPermintaanSelectQuery}

            WHERE ep.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi permintaan layanan tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiPermintaanById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// GET BERDASARKAN SERVICE REQUEST
// GET /permintaan-layanan/:id/evaluasi
// =====================================================

exports.getEvaluasiByPermintaan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID permintaan layanan tidak valid.'
        });
    }


    try {
        const [requestRows] = await db.query(
            `
            SELECT id
            FROM mrp_permintaan_layanan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (requestRows.length === 0) {
            return res.status(404).json({
                message:
                    'Permintaan layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${evaluasiPermintaanSelectQuery}

            WHERE ep.permintaan_layanan_id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(200).json(null);
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiByPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// CREATE
// POST /api/relasi-pengguna/evaluasi-permintaan
// =====================================================

exports.createEvaluasiPermintaan = async (
    req,
    res
) => {
    const forbiddenFields = [
        'target_waktu_respon_menit',
        'target_waktu_penyelesaian_menit',
        'keterangan_ketepatan',
        'dievaluasi_oleh',
        'tanggal_evaluasi'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh ditentukan secara manual.`
            });
        }
    }


    const validationError =
        validateEvaluasiPermintaan(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        permintaan_layanan_id,
        realisasi_waktu_respon_menit,
        pencapaian_respon_persen,
        realisasi_waktu_penyelesaian_menit,
        pencapaian_penyelesaian_persen,
        catatan
    } = req.body;


    try {
        // =============================================
        // CEK SERVICE REQUEST + SNAPSHOT SLA
        // =============================================

        const [requests] = await db.query(
            `
            SELECT
                pl.id,
                pl.status,
                pl.standar_layanan_id,

                sla.target_waktu_respon_menit,
                sla.target_waktu_penyelesaian_menit

            FROM mrp_permintaan_layanan pl

            LEFT JOIN mrp_sla_layanan sla
                ON sla.standar_layanan_id =
                    pl.standar_layanan_id

            WHERE pl.id = ?
            LIMIT 1
            `,
            [permintaan_layanan_id]
        );


        if (requests.length === 0) {
            return res.status(400).json({
                message:
                    'permintaan_layanan_id tidak ditemukan.'
            });
        }


        // =============================================
        // SATU REQUEST HANYA SATU EVALUASI
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_permintaan
            WHERE permintaan_layanan_id = ?
            LIMIT 1
            `,
            [permintaan_layanan_id]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Permintaan layanan tersebut sudah memiliki evaluasi.'
            });
        }


        const requestData = requests[0];

        const targetRespon =
            requestData
                .target_waktu_respon_menit;

        const targetPenyelesaian =
            requestData
                .target_waktu_penyelesaian_menit;

        const realisasiRespon =
            evaluasiPermintaanNumber(
                realisasi_waktu_respon_menit
            );

        const realisasiPenyelesaian =
            evaluasiPermintaanNumber(
                realisasi_waktu_penyelesaian_menit
            );


        const ketepatan =
            getKeteranganKetepatanPermintaan(
                requestData.status,
                targetPenyelesaian,
                realisasiPenyelesaian
            );


        // =============================================
        // INSERT
        // Evaluator selalu user login.
        // Tanggal evaluasi memakai CURRENT_TIMESTAMP DB.
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_evaluasi_permintaan (
                permintaan_layanan_id,

                target_waktu_respon_menit,
                realisasi_waktu_respon_menit,
                pencapaian_respon_persen,

                target_waktu_penyelesaian_menit,
                realisasi_waktu_penyelesaian_menit,
                pencapaian_penyelesaian_persen,

                keterangan_ketepatan,

                dievaluasi_oleh,
                catatan
            )
            VALUES (
                ?,
                ?, ?, ?,
                ?, ?, ?,
                ?,
                ?,
                ?
            )
            `,
            [
                Number(
                    permintaan_layanan_id
                ),

                targetRespon,
                realisasiRespon,
                evaluasiPermintaanNumber(
                    pencapaian_respon_persen
                ),

                targetPenyelesaian,
                realisasiPenyelesaian,
                evaluasiPermintaanNumber(
                    pencapaian_penyelesaian_persen
                ),

                ketepatan,

                req.user.id,

                normalizeOptionalText(
                    catatan
                )
            ]
        );


        return res.status(201).json({
            message:
                'Evaluasi permintaan layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createEvaluasiPermintaan error:',
            error
        );


        if (
            error.code ===
            'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Permintaan layanan tersebut sudah memiliki evaluasi.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// UPDATE
// PUT /api/relasi-pengguna/evaluasi-permintaan/:id
// =====================================================

exports.updateEvaluasiPermintaan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi permintaan tidak valid.'
        });
    }


    const forbiddenFields = [
        'permintaan_layanan_id',
        'target_waktu_respon_menit',
        'target_waktu_penyelesaian_menit',
        'keterangan_ketepatan',
        'dievaluasi_oleh',
        'tanggal_evaluasi'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah secara manual.`
            });
        }
    }


    const validationError =
        validateEvaluasiPermintaan(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const allowedFields = [
        'realisasi_waktu_respon_menit',
        'pencapaian_respon_persen',
        'realisasi_waktu_penyelesaian_menit',
        'pencapaian_penyelesaian_persen',
        'catatan'
    ];


    const hasUpdate =
        allowedFields.some(
            (field) =>
                Object.prototype
                    .hasOwnProperty
                    .call(
                        req.body,
                        field
                    )
        );


    if (!hasUpdate) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT
                ep.*,
                pl.status AS status_permintaan

            FROM mrp_evaluasi_permintaan ep

            JOIN mrp_permintaan_layanan pl
                ON pl.id =
                    ep.permintaan_layanan_id

            WHERE ep.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi permintaan layanan tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const getFinalNumber = (
            field,
            existingValue
        ) => {
            if (
                !Object.prototype
                    .hasOwnProperty
                    .call(req.body, field)
            ) {
                return existingValue;
            }


            return evaluasiPermintaanNumber(
                req.body[field]
            );
        };


        const finalRealisasiRespon =
            getFinalNumber(
                'realisasi_waktu_respon_menit',
                existing
                    .realisasi_waktu_respon_menit
            );


        const finalPencapaianRespon =
            getFinalNumber(
                'pencapaian_respon_persen',
                existing
                    .pencapaian_respon_persen
            );


        const finalRealisasiPenyelesaian =
            getFinalNumber(
                'realisasi_waktu_penyelesaian_menit',
                existing
                    .realisasi_waktu_penyelesaian_menit
            );


        const finalPencapaianPenyelesaian =
            getFinalNumber(
                'pencapaian_penyelesaian_persen',
                existing
                    .pencapaian_penyelesaian_persen
            );


        const finalCatatan =
            Object.prototype
                .hasOwnProperty
                .call(
                    req.body,
                    'catatan'
                )
                ? normalizeOptionalText(
                    req.body.catatan
                )
                : existing.catatan;


        const ketepatan =
            getKeteranganKetepatanPermintaan(
                existing.status_permintaan,
                existing
                    .target_waktu_penyelesaian_menit,
                finalRealisasiPenyelesaian
            );


        await db.query(
            `
            UPDATE mrp_evaluasi_permintaan

            SET
                realisasi_waktu_respon_menit = ?,
                pencapaian_respon_persen = ?,

                realisasi_waktu_penyelesaian_menit = ?,
                pencapaian_penyelesaian_persen = ?,

                keterangan_ketepatan = ?,
                catatan = ?

            WHERE id = ?
            `,
            [
                finalRealisasiRespon,
                finalPencapaianRespon,

                finalRealisasiPenyelesaian,
                finalPencapaianPenyelesaian,

                ketepatan,
                finalCatatan,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Evaluasi permintaan layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateEvaluasiPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// DELETE
// =====================================================

exports.deleteEvaluasiPermintaan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi permintaan tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_evaluasi_permintaan
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Evaluasi permintaan layanan tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Evaluasi permintaan layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteEvaluasiPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus evaluasi permintaan layanan.'
        });
    }
};

// =====================================================
// MRP 4
// INDIKATOR EVALUASI SERVICE REQUEST
// =====================================================

const evaluasiPermintaanIndikatorSelectQuery = `
    SELECT
        epi.id,

        epi.evaluasi_permintaan_id,

        ep.permintaan_layanan_id,

        pl.kode_request,
        pl.layanan_id,
        pl.standar_layanan_id,

        ld.kode_layanan,
        ld.nama_layanan,

        epi.indikator_standar_id,

        its.objek AS objek_indikator_standar,
        its.jenis_standar,
        its.prioritas AS prioritas_indikator_standar,
        its.arah_target,

        epi.nama_indikator,
        epi.target_nilai,
        epi.realisasi_nilai,
        epi.satuan,
        epi.pencapaian_persen,

        epi.created_at,
        epi.updated_at

    FROM mrp_evaluasi_permintaan_indikator epi

    JOIN mrp_evaluasi_permintaan ep
        ON ep.id =
            epi.evaluasi_permintaan_id

    JOIN mrp_permintaan_layanan pl
        ON pl.id =
            ep.permintaan_layanan_id

    JOIN layanan_digital ld
        ON ld.id =
            pl.layanan_id

    LEFT JOIN mrp_indikator_tambahan_standar its
        ON its.id =
            epi.indikator_standar_id
`;


// =====================================================
// VALIDASI
// =====================================================

const validateEvaluasiPermintaanIndikator = (
    body,
    isCreate = true
) => {
    const {
        evaluasi_permintaan_id,
        indikator_standar_id,
        nama_indikator,
        target_nilai,
        realisasi_nilai,
        satuan,
        pencapaian_persen
    } = body;


    if (
        evaluasi_permintaan_id !== undefined &&
        !isPositiveInteger(
            evaluasi_permintaan_id
        )
    ) {
        return (
            'evaluasi_permintaan_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        evaluasi_permintaan_id === undefined
    ) {
        return (
            'evaluasi_permintaan_id wajib diisi.'
        );
    }


    if (
        indikator_standar_id !== undefined &&
        indikator_standar_id !== null &&
        indikator_standar_id !== '' &&
        !isPositiveInteger(
            indikator_standar_id
        )
    ) {
        return (
            'indikator_standar_id harus berupa ID yang valid.'
        );
    }


    if (
        nama_indikator !== undefined &&
        (
            typeof nama_indikator !== 'string' ||
            nama_indikator.trim() === ''
        )
    ) {
        return (
            'nama_indikator wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        typeof nama_indikator === 'string' &&
        nama_indikator.trim().length > 150
    ) {
        return (
            'nama_indikator maksimal 150 karakter.'
        );
    }


    if (
        target_nilai !== undefined &&
        !isNonNegativeNumberValue(
            target_nilai
        )
    ) {
        return (
            'target_nilai harus berupa angka 0 atau lebih.'
        );
    }


    if (
        realisasi_nilai !== undefined &&
        realisasi_nilai !== null &&
        realisasi_nilai !== '' &&
        !isNonNegativeNumberValue(
            realisasi_nilai
        )
    ) {
        return (
            'realisasi_nilai harus berupa angka 0 atau lebih.'
        );
    }


    if (
        pencapaian_persen !== undefined &&
        pencapaian_persen !== null &&
        pencapaian_persen !== '' &&
        !isNonNegativeNumberValue(
            pencapaian_persen
        )
    ) {
        return (
            'pencapaian_persen harus berupa angka 0 atau lebih.'
        );
    }


    if (
        satuan !== undefined &&
        (
            typeof satuan !== 'string' ||
            satuan.trim() === ''
        )
    ) {
        return (
            'satuan wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        typeof satuan === 'string' &&
        satuan.trim().length > 50
    ) {
        return (
            'satuan maksimal 50 karakter.'
        );
    }


    return null;
};


// =====================================================
// GET ALL
// =====================================================

exports.getAllEvaluasiPermintaanIndikator =
async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${evaluasiPermintaanIndikatorSelectQuery}

            ORDER BY
                epi.created_at DESC,
                epi.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllEvaluasiPermintaanIndikator error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// GET DETAIL
// =====================================================

exports.getEvaluasiPermintaanIndikatorById =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi permintaan tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${evaluasiPermintaanIndikatorSelectQuery}

            WHERE epi.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi permintaan layanan tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getEvaluasiPermintaanIndikatorById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// GET BY PARENT
// GET /evaluasi-permintaan/:id/indikator
// =====================================================

exports.getIndikatorByEvaluasiPermintaan =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID evaluasi permintaan tidak valid.'
        });
    }


    try {
        const [parent] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_permintaan
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (parent.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi permintaan layanan tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${evaluasiPermintaanIndikatorSelectQuery}

            WHERE epi.evaluasi_permintaan_id = ?

            ORDER BY
                epi.nama_indikator ASC,
                epi.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getIndikatorByEvaluasiPermintaan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil indikator evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// CREATE
// =====================================================

exports.createEvaluasiPermintaanIndikator =
async (
    req,
    res
) => {
    const validationError =
        validateEvaluasiPermintaanIndikator(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        evaluasi_permintaan_id,
        indikator_standar_id,
        nama_indikator,
        target_nilai,
        realisasi_nilai,
        satuan,
        pencapaian_persen
    } = req.body;


    try {
        // =============================================
        // CEK PARENT + STANDAR SERVICE REQUEST
        // =============================================

        const [parent] = await db.query(
    `
            SELECT
                ep.id,
                ep.permintaan_layanan_id,
                pl.standar_layanan_id

            FROM mrp_evaluasi_permintaan ep

            JOIN mrp_permintaan_layanan pl
                ON pl.id =
                    ep.permintaan_layanan_id

            WHERE ep.id = ?
            LIMIT 1
            `,
            [evaluasi_permintaan_id]
        );


        if (parent.length === 0) {
            return res.status(400).json({
                message:
                    'evaluasi_permintaan_id tidak ditemukan.'
            });
        }


        let finalIndikatorStandarId = null;
        let finalNamaIndikator;
        let finalTargetNilai;
        let finalSatuan;


        // =============================================
        // PAKAI MASTER INDIKATOR
        // =============================================

        if (
            indikator_standar_id !== undefined &&
            indikator_standar_id !== null &&
            indikator_standar_id !== ''
        ) {
            const [master] = await db.query(
                `
                SELECT
                    id,
                    standar_layanan_id,
                    objek,
                    nama_indikator,
                    target_nilai,
                    satuan

                FROM mrp_indikator_tambahan_standar

                WHERE id = ?
                LIMIT 1
                `,
                [indikator_standar_id]
            );


            if (master.length === 0) {
                return res.status(400).json({
                    message:
                        'indikator_standar_id tidak ditemukan.'
                });
            }


            // Master tidak punya objek Permintaan.
            // Service Request memakai indikator level Layanan.
            if (
                master[0].objek !== 'Layanan'
            ) {
                return res.status(400).json({
                    message:
                        'Indikator standar untuk evaluasi permintaan layanan harus berobjek Layanan.'
                });
            }


            if (
                parent[0].standar_layanan_id === null ||
                Number(
                    master[0]
                        .standar_layanan_id
                ) !==
                Number(
                    parent[0]
                        .standar_layanan_id
                )
            ) {
                return res.status(400).json({
                    message:
                        'Indikator standar tidak berasal dari standar layanan yang sama dengan permintaan.'
                });
            }


            finalIndikatorStandarId =
                Number(indikator_standar_id);

            finalNamaIndikator =
                master[0].nama_indikator;

            finalTargetNilai =
                Number(
                    master[0].target_nilai
                );

            finalSatuan =
                master[0].satuan;

        } else {
            // =========================================
            // SNAPSHOT MANUAL
            // =========================================

            if (
                nama_indikator === undefined ||
                target_nilai === undefined ||
                satuan === undefined
            ) {
                return res.status(400).json({
                    message:
                        'nama_indikator, target_nilai, dan satuan wajib diisi jika indikator_standar_id tidak digunakan.'
                });
            }


            finalNamaIndikator =
                nama_indikator.trim();

            finalTargetNilai =
                Number(target_nilai);

            finalSatuan =
                satuan.trim();
        }


        // =============================================
        // DUPLIKAT
        // =============================================

        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_permintaan_indikator

            WHERE evaluasi_permintaan_id = ?
              AND nama_indikator = ?

            LIMIT 1
            `,
            [
                evaluasi_permintaan_id,
                finalNamaIndikator
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi permintaan layanan.'
            });
        }


        const finalRealisasi =
            (
                realisasi_nilai === undefined ||
                realisasi_nilai === null ||
                realisasi_nilai === ''
            )
                ? null
                : Number(realisasi_nilai);


        const finalPencapaian =
            (
                pencapaian_persen === undefined ||
                pencapaian_persen === null ||
                pencapaian_persen === ''
            )
                ? null
                : Number(
                    pencapaian_persen
                );


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO
                mrp_evaluasi_permintaan_indikator
            (
                evaluasi_permintaan_id,
                indikator_standar_id,
                nama_indikator,
                target_nilai,
                realisasi_nilai,
                satuan,
                pencapaian_persen
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            `,
            [
                Number(
                    evaluasi_permintaan_id
                ),
                finalIndikatorStandarId,
                finalNamaIndikator,
                finalTargetNilai,
                finalRealisasi,
                finalSatuan,
                finalPencapaian
            ]
        );


        return res.status(201).json({
            message:
                'Indikator evaluasi permintaan layanan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createEvaluasiPermintaanIndikator error:',
            error
        );


        if (
            error.code === 'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi permintaan layanan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat indikator evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// UPDATE
// =====================================================

exports.updateEvaluasiPermintaanIndikator =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi permintaan tidak valid.'
        });
    }


    const forbiddenFields = [
        'evaluasi_permintaan_id',
        'indikator_standar_id'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah.`
            });
        }
    }


    const validationError =
        validateEvaluasiPermintaanIndikator(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const allowedFields = [
        'nama_indikator',
        'target_nilai',
        'realisasi_nilai',
        'satuan',
        'pencapaian_persen'
    ];


    const hasUpdate =
        allowedFields.some(
            (field) =>
                Object.prototype
                    .hasOwnProperty
                    .call(req.body, field)
        );


    if (!hasUpdate) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT *
            FROM mrp_evaluasi_permintaan_indikator
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi permintaan layanan tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            nama_indikator:
                req.body.nama_indikator !==
                undefined
                    ? req.body
                        .nama_indikator
                        .trim()
                    : existing
                        .nama_indikator,

            target_nilai:
                req.body.target_nilai !==
                undefined
                    ? Number(
                        req.body.target_nilai
                    )
                    : Number(
                        existing.target_nilai
                    ),

            realisasi_nilai:
                req.body.realisasi_nilai !==
                undefined
                    ? (
                        req.body
                            .realisasi_nilai ===
                            null ||
                        req.body
                            .realisasi_nilai === ''
                            ? null
                            : Number(
                                req.body
                                    .realisasi_nilai
                            )
                    )
                    : existing
                        .realisasi_nilai,

            satuan:
                req.body.satuan !== undefined
                    ? req.body.satuan.trim()
                    : existing.satuan,

            pencapaian_persen:
                req.body.pencapaian_persen !==
                undefined
                    ? (
                        req.body
                            .pencapaian_persen ===
                            null ||
                        req.body
                            .pencapaian_persen === ''
                            ? null
                            : Number(
                                req.body
                                    .pencapaian_persen
                            )
                    )
                    : existing
                        .pencapaian_persen
        };


        const [duplicate] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi_permintaan_indikator

            WHERE evaluasi_permintaan_id = ?
              AND nama_indikator = ?
              AND id <> ?

            LIMIT 1
            `,
            [
                existing
                    .evaluasi_permintaan_id,
                final.nama_indikator,
                id
            ]
        );


        if (duplicate.length > 0) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi permintaan layanan.'
            });
        }


        await db.query(
            `
            UPDATE
                mrp_evaluasi_permintaan_indikator

            SET
                nama_indikator = ?,
                target_nilai = ?,
                realisasi_nilai = ?,
                satuan = ?,
                pencapaian_persen = ?

            WHERE id = ?
            `,
            [
                final.nama_indikator,
                final.target_nilai,
                final.realisasi_nilai,
                final.satuan,
                final.pencapaian_persen,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Indikator evaluasi permintaan layanan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateEvaluasiPermintaanIndikator error:',
            error
        );


        if (
            error.code === 'ER_DUP_ENTRY'
        ) {
            return res.status(409).json({
                message:
                    'Indikator tersebut sudah tersedia pada evaluasi permintaan layanan.'
            });
        }


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui indikator evaluasi permintaan layanan.'
        });
    }
};


// =====================================================
// DELETE
// =====================================================

exports.deleteEvaluasiPermintaanIndikator =
async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID indikator evaluasi permintaan tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM
                mrp_evaluasi_permintaan_indikator
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Indikator evaluasi permintaan layanan tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Indikator evaluasi permintaan layanan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteEvaluasiPermintaanIndikator error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus indikator evaluasi permintaan layanan.'
        });
    }
};

// =====================================================
// MRP 4 - RENCANA PERBAIKAN
// =====================================================

const rencanaPerbaikanSelectQuery = `
    SELECT
        rp.id,

        rp.evaluasi_id,
        e.kode_evaluasi,

        rp.evaluasi_layanan_id,
        el.standar_layanan_id,

        ld_layanan.id AS layanan_evaluasi_id,
        ld_layanan.kode_layanan
            AS kode_layanan_evaluasi,
        ld_layanan.nama_layanan
            AS nama_layanan_evaluasi,

        rp.evaluasi_kueri_insiden_id,

        tki.jenis
            AS jenis_evaluasi_kueri_insiden,
        tki.prioritas
            AS prioritas_evaluasi_kueri_insiden,

        ld_ki.id AS layanan_ki_id,
        ld_ki.kode_layanan
            AS kode_layanan_ki,
        ld_ki.nama_layanan
            AS nama_layanan_ki,

        rp.uraian_kesenjangan,
        rp.rencana_perbaikan,
        rp.prioritas,

        rp.pic_id,
        pic.nama AS nama_pic,

        DATE_FORMAT(
            rp.target_selesai,
            '%Y-%m-%d'
        ) AS target_selesai,

        rp.status,

        rp.memerlukan_perubahan,
        rp.perubahan_id,

        rp.catatan,

        rp.created_by,
        pembuat.nama AS nama_pembuat,

        rp.created_at,
        rp.updated_at

    FROM mrp_rencana_perbaikan rp

    JOIN mrp_evaluasi e
        ON e.id = rp.evaluasi_id

    LEFT JOIN mrp_evaluasi_layanan el
        ON el.id =
            rp.evaluasi_layanan_id

    LEFT JOIN mrp_standar_layanan sl_layanan
        ON sl_layanan.id =
            el.standar_layanan_id

    LEFT JOIN mrp_katalog_layanan kl_layanan
        ON kl_layanan.id =
            sl_layanan.katalog_layanan_id

    LEFT JOIN layanan_digital ld_layanan
        ON ld_layanan.id =
            kl_layanan.layanan_id

    LEFT JOIN mrp_evaluasi_kueri_insiden eki
        ON eki.id =
            rp.evaluasi_kueri_insiden_id

    LEFT JOIN mrp_target_kueri_insiden tki
        ON tki.id =
            eki.target_kueri_insiden_id

    LEFT JOIN mrp_standar_layanan sl_ki
        ON sl_ki.id =
            tki.standar_layanan_id

    LEFT JOIN mrp_katalog_layanan kl_ki
        ON kl_ki.id =
            sl_ki.katalog_layanan_id

    LEFT JOIN layanan_digital ld_ki
        ON ld_ki.id =
            kl_ki.layanan_id

    JOIN users pic
        ON pic.id = rp.pic_id

    JOIN users pembuat
        ON pembuat.id = rp.created_by
`;


// =====================================================
// HELPER BOOLEAN 0 / 1
// =====================================================

const normalizeRencanaPerbaikanBoolean = (
    value
) => {
    if (
        value === true ||
        value === 1 ||
        value === '1'
    ) {
        return 1;
    }


    if (
        value === false ||
        value === 0 ||
        value === '0'
    ) {
        return 0;
    }


    return null;
};


// =====================================================
// VALIDASI
// =====================================================

const validateRencanaPerbaikan = (
    body,
    isCreate = true
) => {
    const {
        evaluasi_id,
        evaluasi_layanan_id,
        evaluasi_kueri_insiden_id,
        uraian_kesenjangan,
        rencana_perbaikan,
        prioritas,
        pic_id,
        target_selesai,
        status,
        memerlukan_perubahan,
        perubahan_id,
        catatan
    } = body;


    if (
        evaluasi_id !== undefined &&
        !isPositiveInteger(evaluasi_id)
    ) {
        return (
            'evaluasi_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        evaluasi_id === undefined
    ) {
        return 'evaluasi_id wajib diisi.';
    }


    if (
        evaluasi_layanan_id !== undefined &&
        evaluasi_layanan_id !== null &&
        evaluasi_layanan_id !== '' &&
        !isPositiveInteger(
            evaluasi_layanan_id
        )
    ) {
        return (
            'evaluasi_layanan_id harus berupa ID yang valid.'
        );
    }


    if (
        evaluasi_kueri_insiden_id !==
            undefined &&
        evaluasi_kueri_insiden_id !== null &&
        evaluasi_kueri_insiden_id !== '' &&
        !isPositiveInteger(
            evaluasi_kueri_insiden_id
        )
    ) {
        return (
            'evaluasi_kueri_insiden_id harus berupa ID yang valid.'
        );
    }


    if (
        uraian_kesenjangan !== undefined &&
        (
            typeof uraian_kesenjangan !==
                'string' ||
            uraian_kesenjangan.trim() === ''
        )
    ) {
        return (
            'uraian_kesenjangan wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        isCreate &&
        uraian_kesenjangan === undefined
    ) {
        return (
            'uraian_kesenjangan wajib diisi.'
        );
    }


    if (
        rencana_perbaikan !== undefined &&
        (
            typeof rencana_perbaikan !==
                'string' ||
            rencana_perbaikan.trim() === ''
        )
    ) {
        return (
            'rencana_perbaikan wajib berupa teks dan tidak boleh kosong.'
        );
    }


    if (
        isCreate &&
        rencana_perbaikan === undefined
    ) {
        return (
            'rencana_perbaikan wajib diisi.'
        );
    }


    if (
        prioritas !== undefined &&
        ![
            'Rendah',
            'Sedang',
            'Tinggi'
        ].includes(prioritas)
    ) {
        return (
            'prioritas harus Rendah, Sedang, atau Tinggi.'
        );
    }


    if (
        isCreate &&
        prioritas === undefined
    ) {
        return 'prioritas wajib diisi.';
    }


    if (
        pic_id !== undefined &&
        !isPositiveInteger(pic_id)
    ) {
        return (
            'pic_id wajib berupa ID yang valid.'
        );
    }


    if (
        isCreate &&
        pic_id === undefined
    ) {
        return 'pic_id wajib diisi.';
    }


    if (
        target_selesai !== undefined &&
        !isValidDateOnlyValue(
            target_selesai
        )
    ) {
        return (
            'target_selesai harus menggunakan format YYYY-MM-DD.'
        );
    }


    if (
        isCreate &&
        target_selesai === undefined
    ) {
        return (
            'target_selesai wajib diisi.'
        );
    }


    if (
        status !== undefined &&
        ![
            'Direncanakan',
            'Diproses',
            'Selesai',
            'Dibatalkan'
        ].includes(status)
    ) {
        return (
            'status harus Direncanakan, Diproses, Selesai, atau Dibatalkan.'
        );
    }


    if (
        memerlukan_perubahan !== undefined &&
        normalizeRencanaPerbaikanBoolean(
            memerlukan_perubahan
        ) === null
    ) {
        return (
            'memerlukan_perubahan harus bernilai 0/1 atau true/false.'
        );
    }


    if (
        perubahan_id !== undefined &&
        perubahan_id !== null &&
        perubahan_id !== '' &&
        !isPositiveInteger(perubahan_id)
    ) {
        return (
            'perubahan_id harus berupa ID yang valid.'
        );
    }


    if (
        catatan !== undefined &&
        catatan !== null &&
        typeof catatan !== 'string'
    ) {
        return 'catatan harus berupa teks.';
    }


    return null;
};


// =====================================================
// GET ALL
// =====================================================

exports.getAllRencanaPerbaikan = async (
    req,
    res
) => {
    try {
        const [rows] = await db.query(`
            ${rencanaPerbaikanSelectQuery}

            ORDER BY
                rp.target_selesai ASC,
                rp.id DESC
        `);


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getAllRencanaPerbaikan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil rencana perbaikan.'
        });
    }
};


// =====================================================
// GET DETAIL
// =====================================================

exports.getRencanaPerbaikanById = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID rencana perbaikan tidak valid.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            ${rencanaPerbaikanSelectQuery}

            WHERE rp.id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Rencana perbaikan tidak ditemukan.'
            });
        }


        return res.status(200).json(
            rows[0]
        );

    } catch (error) {
        console.error(
            'getRencanaPerbaikanById error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil rencana perbaikan.'
        });
    }
};


// =====================================================
// GET BERDASARKAN EVALUASI
// GET /evaluasi/:id/rencana-perbaikan
// =====================================================

exports.getRencanaPerbaikanByEvaluasi =
async (
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
        const [evaluasi] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (evaluasi.length === 0) {
            return res.status(404).json({
                message:
                    'Evaluasi tidak ditemukan.'
            });
        }


        const [rows] = await db.query(
            `
            ${rencanaPerbaikanSelectQuery}

            WHERE rp.evaluasi_id = ?

            ORDER BY
                rp.target_selesai ASC,
                rp.id ASC
            `,
            [id]
        );


        return res.status(200).json(
            rows
        );

    } catch (error) {
        console.error(
            'getRencanaPerbaikanByEvaluasi error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat mengambil rencana perbaikan evaluasi.'
        });
    }
};


// =====================================================
// CREATE
// =====================================================

exports.createRencanaPerbaikan = async (
    req,
    res
) => {
    if (
        Object.prototype.hasOwnProperty.call(
            req.body,
            'created_by'
        )
    ) {
        return res.status(400).json({
            message:
                'created_by tidak boleh ditentukan secara manual.'
        });
    }


    const validationError =
        validateRencanaPerbaikan(
            req.body,
            true
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const {
        evaluasi_id,
        evaluasi_layanan_id,
        evaluasi_kueri_insiden_id,
        uraian_kesenjangan,
        rencana_perbaikan,
        prioritas,
        pic_id,
        target_selesai,
        status,
        memerlukan_perubahan,
        perubahan_id,
        catatan
    } = req.body;


    try {
        // =============================================
        // CEK EVALUASI
        // =============================================

        const [evaluasi] = await db.query(
            `
            SELECT id
            FROM mrp_evaluasi
            WHERE id = ?
            LIMIT 1
            `,
            [evaluasi_id]
        );


        if (evaluasi.length === 0) {
            return res.status(400).json({
                message:
                    'evaluasi_id tidak ditemukan.'
            });
        }


        // =============================================
        // CEK EVALUASI LAYANAN
        // HARUS MILIK EVALUASI YANG SAMA
        // =============================================

        let finalEvaluasiLayananId = null;


        if (
            evaluasi_layanan_id !==
                undefined &&
            evaluasi_layanan_id !== null &&
            evaluasi_layanan_id !== ''
        ) {
            const [layanan] = await db.query(
                `
                SELECT
                    id,
                    evaluasi_id
                FROM mrp_evaluasi_layanan
                WHERE id = ?
                LIMIT 1
                `,
                [evaluasi_layanan_id]
            );


            if (layanan.length === 0) {
                return res.status(400).json({
                    message:
                        'evaluasi_layanan_id tidak ditemukan.'
                });
            }


            if (
                Number(
                    layanan[0].evaluasi_id
                ) !==
                Number(evaluasi_id)
            ) {
                return res.status(400).json({
                    message:
                        'evaluasi_layanan_id tidak berasal dari evaluasi yang sama.'
                });
            }


            finalEvaluasiLayananId =
                Number(
                    evaluasi_layanan_id
                );
        }


        // =============================================
        // CEK EVALUASI KUERI / INSIDEN
        // HARUS MILIK EVALUASI YANG SAMA
        // =============================================

        let finalEvaluasiKueriInsidenId =
            null;


        if (
            evaluasi_kueri_insiden_id !==
                undefined &&
            evaluasi_kueri_insiden_id !==
                null &&
            evaluasi_kueri_insiden_id !== ''
        ) {
            const [ki] = await db.query(
                `
                SELECT
                    id,
                    evaluasi_id
                FROM mrp_evaluasi_kueri_insiden
                WHERE id = ?
                LIMIT 1
                `,
                [
                    evaluasi_kueri_insiden_id
                ]
            );


            if (ki.length === 0) {
                return res.status(400).json({
                    message:
                        'evaluasi_kueri_insiden_id tidak ditemukan.'
                });
            }


            if (
                Number(
                    ki[0].evaluasi_id
                ) !==
                Number(evaluasi_id)
            ) {
                return res.status(400).json({
                    message:
                        'evaluasi_kueri_insiden_id tidak berasal dari evaluasi yang sama.'
                });
            }


            finalEvaluasiKueriInsidenId =
                Number(
                    evaluasi_kueri_insiden_id
                );
        }


        // =============================================
        // CEK PIC
        // =============================================

        const [pic] = await db.query(
            `
            SELECT id
            FROM users
            WHERE id = ?
            LIMIT 1
            `,
            [pic_id]
        );


        if (pic.length === 0) {
            return res.status(400).json({
                message:
                    'pic_id tidak ditemukan.'
            });
        }


        // =============================================
        // PERUBAHAN
        // =============================================

        const finalMemerlukanPerubahan =
            memerlukan_perubahan ===
                undefined
                ? 0
                : normalizeRencanaPerbaikanBoolean(
                    memerlukan_perubahan
                );


        let finalPerubahanId = null;


        if (
            perubahan_id !== undefined &&
            perubahan_id !== null &&
            perubahan_id !== ''
        ) {
            if (
                finalMemerlukanPerubahan !== 1
            ) {
                return res.status(400).json({
                    message:
                        'perubahan_id hanya dapat diisi jika memerlukan_perubahan bernilai 1.'
                });
            }


            const [perubahan] = await db.query(
                `
                SELECT id
                FROM mpr_perubahan
                WHERE id = ?
                LIMIT 1
                `,
                [perubahan_id]
            );


            if (perubahan.length === 0) {
                return res.status(400).json({
                    message:
                        'perubahan_id tidak ditemukan.'
                });
            }


            finalPerubahanId =
                Number(perubahan_id);
        }


        // =============================================
        // INSERT
        // =============================================

        const [result] = await db.query(
            `
            INSERT INTO mrp_rencana_perbaikan (
                evaluasi_id,
                evaluasi_layanan_id,
                evaluasi_kueri_insiden_id,

                uraian_kesenjangan,
                rencana_perbaikan,
                prioritas,
                pic_id,
                target_selesai,
                status,

                memerlukan_perubahan,
                perubahan_id,

                catatan,
                created_by
            )
            VALUES (
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?, ?,
                ?, ?
            )
            `,
            [
                Number(evaluasi_id),

                finalEvaluasiLayananId,
                finalEvaluasiKueriInsidenId,

                uraian_kesenjangan.trim(),
                rencana_perbaikan.trim(),
                prioritas,
                Number(pic_id),
                target_selesai,

                status || 'Direncanakan',

                finalMemerlukanPerubahan,
                finalPerubahanId,

                normalizeOptionalText(
                    catatan
                ),

                req.user.id
            ]
        );


        return res.status(201).json({
            message:
                'Rencana perbaikan berhasil dibuat.',
            id: result.insertId
        });

    } catch (error) {
        console.error(
            'createRencanaPerbaikan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat membuat rencana perbaikan.'
        });
    }
};


// =====================================================
// UPDATE
// =====================================================

exports.updateRencanaPerbaikan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID rencana perbaikan tidak valid.'
        });
    }


    const forbiddenFields = [
        'evaluasi_id',
        'evaluasi_layanan_id',
        'evaluasi_kueri_insiden_id',
        'created_by'
    ];


    for (const field of forbiddenFields) {
        if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                field
            )
        ) {
            return res.status(400).json({
                message:
                    `${field} tidak boleh diubah.`
            });
        }
    }


    const validationError =
        validateRencanaPerbaikan(
            req.body,
            false
        );


    if (validationError) {
        return res.status(400).json({
            message: validationError
        });
    }


    const allowedFields = [
        'uraian_kesenjangan',
        'rencana_perbaikan',
        'prioritas',
        'pic_id',
        'target_selesai',
        'status',
        'memerlukan_perubahan',
        'perubahan_id',
        'catatan'
    ];


    const hasUpdate =
        allowedFields.some(
            (field) =>
                Object.prototype
                    .hasOwnProperty
                    .call(
                        req.body,
                        field
                    )
        );


    if (!hasUpdate) {
        return res.status(400).json({
            message:
                'Tidak ada data yang diperbarui.'
        });
    }


    try {
        const [rows] = await db.query(
            `
            SELECT
                id,
                uraian_kesenjangan,
                rencana_perbaikan,
                prioritas,
                pic_id,

                DATE_FORMAT(
                    target_selesai,
                    '%Y-%m-%d'
                ) AS target_selesai,

                status,
                memerlukan_perubahan,
                perubahan_id,
                catatan

            FROM mrp_rencana_perbaikan

            WHERE id = ?
            LIMIT 1
            `,
            [id]
        );


        if (rows.length === 0) {
            return res.status(404).json({
                message:
                    'Rencana perbaikan tidak ditemukan.'
            });
        }


        const existing = rows[0];


        const final = {
            uraian_kesenjangan:
                req.body
                    .uraian_kesenjangan !==
                undefined
                    ? req.body
                        .uraian_kesenjangan
                        .trim()
                    : existing
                        .uraian_kesenjangan,

            rencana_perbaikan:
                req.body
                    .rencana_perbaikan !==
                undefined
                    ? req.body
                        .rencana_perbaikan
                        .trim()
                    : existing
                        .rencana_perbaikan,

            prioritas:
                req.body.prioritas !==
                undefined
                    ? req.body.prioritas
                    : existing.prioritas,

            pic_id:
                req.body.pic_id !==
                undefined
                    ? Number(
                        req.body.pic_id
                    )
                    : Number(
                        existing.pic_id
                    ),

            target_selesai:
                req.body.target_selesai !==
                undefined
                    ? req.body
                        .target_selesai
                    : existing
                        .target_selesai,

            status:
                req.body.status !==
                undefined
                    ? req.body.status
                    : existing.status,

            memerlukan_perubahan:
                req.body
                    .memerlukan_perubahan !==
                undefined
                    ? normalizeRencanaPerbaikanBoolean(
                        req.body
                            .memerlukan_perubahan
                    )
                    : Number(
                        existing
                            .memerlukan_perubahan
                    ),

            catatan:
                req.body.catatan !== undefined
                    ? normalizeOptionalText(
                        req.body.catatan
                    )
                    : existing.catatan
        };


        // =============================================
        // CEK PIC JIKA BERUBAH
        // =============================================

        if (
            req.body.pic_id !== undefined
        ) {
            const [pic] = await db.query(
                `
                SELECT id
                FROM users
                WHERE id = ?
                LIMIT 1
                `,
                [final.pic_id]
            );


            if (pic.length === 0) {
                return res.status(400).json({
                    message:
                        'pic_id tidak ditemukan.'
                });
            }
        }


        // =============================================
        // TENTUKAN PERUBAHAN_ID
        // =============================================

        let finalPerubahanId =
            existing.perubahan_id;


        if (
            final.memerlukan_perubahan === 0
        ) {
            finalPerubahanId = null;

        } else if (
            Object.prototype.hasOwnProperty.call(
                req.body,
                'perubahan_id'
            )
        ) {
            if (
                req.body.perubahan_id ===
                    null ||
                req.body.perubahan_id === ''
            ) {
                finalPerubahanId = null;

            } else {
                const [perubahan] =
                    await db.query(
                        `
                        SELECT id
                        FROM mpr_perubahan
                        WHERE id = ?
                        LIMIT 1
                        `,
                        [
                            req.body
                                .perubahan_id
                        ]
                    );


                if (
                    perubahan.length === 0
                ) {
                    return res
                        .status(400)
                        .json({
                            message:
                                'perubahan_id tidak ditemukan.'
                        });
                }


                finalPerubahanId =
                    Number(
                        req.body
                            .perubahan_id
                    );
            }
        }


        if (
            final.memerlukan_perubahan !== 1 &&
            finalPerubahanId !== null
        ) {
            return res.status(400).json({
                message:
                    'perubahan_id hanya dapat diisi jika memerlukan_perubahan bernilai 1.'
            });
        }


        // =============================================
        // UPDATE
        // =============================================

        await db.query(
            `
            UPDATE mrp_rencana_perbaikan

            SET
                uraian_kesenjangan = ?,
                rencana_perbaikan = ?,
                prioritas = ?,
                pic_id = ?,
                target_selesai = ?,
                status = ?,
                memerlukan_perubahan = ?,
                perubahan_id = ?,
                catatan = ?

            WHERE id = ?
            `,
            [
                final.uraian_kesenjangan,
                final.rencana_perbaikan,
                final.prioritas,
                final.pic_id,
                final.target_selesai,
                final.status,

                final.memerlukan_perubahan,
                finalPerubahanId,

                final.catatan,
                id
            ]
        );


        return res.status(200).json({
            message:
                'Rencana perbaikan berhasil diperbarui.'
        });

    } catch (error) {
        console.error(
            'updateRencanaPerbaikan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat memperbarui rencana perbaikan.'
        });
    }
};


// =====================================================
// DELETE
// =====================================================

exports.deleteRencanaPerbaikan = async (
    req,
    res
) => {
    const { id } = req.params;


    if (!isPositiveInteger(id)) {
        return res.status(400).json({
            message:
                'ID rencana perbaikan tidak valid.'
        });
    }


    try {
        const [result] = await db.query(
            `
            DELETE FROM mrp_rencana_perbaikan
            WHERE id = ?
            `,
            [id]
        );


        if (
            result.affectedRows === 0
        ) {
            return res.status(404).json({
                message:
                    'Rencana perbaikan tidak ditemukan.'
            });
        }


        return res.status(200).json({
            message:
                'Rencana perbaikan berhasil dihapus.'
        });

    } catch (error) {
        console.error(
            'deleteRencanaPerbaikan error:',
            error
        );


        return res.status(500).json({
            message:
                'Terjadi kesalahan saat menghapus rencana perbaikan.'
        });
    }
};