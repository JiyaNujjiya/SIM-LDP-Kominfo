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

const ruangLingkupSelectQuery = `
    SELECT
        rl.id,
        rl.layanan_prioritas_id,

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

        i.id AS instansi_id,
        i.kode_instansi,
        i.nama_instansi,
        i.jenis_instansi,

        rl.scope_layanan,
        rl.kategori_layanan,
        rl.pengguna_utama,
        rl.jumlah_pengguna,
        rl.target_ola,
        rl.terkait_ekosistem,
        rl.ekosistem_pemerintah_digital,
        rl.deskripsi_ekosistem,
        rl.created_by,
        rl.created_at,
        rl.updated_at,

        u.nama AS dibuat_oleh

    FROM mkb_ruang_lingkup rl

    JOIN layanan_prioritas lp
        ON lp.id = rl.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id

    JOIN instansi i
        ON i.id = ld.instansi_id

    LEFT JOIN users u
        ON u.id = rl.created_by
`;

const validateRuangLingkupInput = (
  body,
  {
    requireLayananPrioritas = false
  } = {}
) => {
  const {
    layanan_prioritas_id,
    scope_layanan,
    kategori_layanan,
    pengguna_utama,
    jumlah_pengguna,
    target_ola,
    terkait_ekosistem,
    ekosistem_pemerintah_digital,
    deskripsi_ekosistem
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
    ['scope_layanan', scope_layanan],
    ['kategori_layanan', kategori_layanan],
    ['pengguna_utama', pengguna_utama],
    ['target_ola', target_ola],
    [
      'ekosistem_pemerintah_digital',
      ekosistem_pemerintah_digital
    ],
    ['deskripsi_ekosistem', deskripsi_ekosistem]
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
    typeof kategori_layanan === 'string' &&
    kategori_layanan.trim().length > 100
  ) {
    return {
      valid: false,
      message:
        'kategori_layanan maksimal 100 karakter.'
    };
  }

  if (
    typeof pengguna_utama === 'string' &&
    pengguna_utama.trim().length > 150
  ) {
    return {
      valid: false,
      message:
        'pengguna_utama maksimal 150 karakter.'
    };
  }

  if (
    typeof target_ola === 'string' &&
    target_ola.trim().length > 200
  ) {
    return {
      valid: false,
      message:
        'target_ola maksimal 200 karakter.'
    };
  }

  if (
    typeof ekosistem_pemerintah_digital === 'string' &&
    ekosistem_pemerintah_digital.trim().length > 200
  ) {
    return {
      valid: false,
      message:
        'ekosistem_pemerintah_digital maksimal 200 karakter.'
    };
  }

  if (
    jumlah_pengguna !== undefined &&
    jumlah_pengguna !== null &&
    jumlah_pengguna !== '' &&
    (
      !Number.isInteger(Number(jumlah_pengguna)) ||
      Number(jumlah_pengguna) < 0
    )
  ) {
    return {
      valid: false,
      message:
        'jumlah_pengguna harus berupa bilangan bulat 0 atau lebih.'
    };
  }

  if (
    terkait_ekosistem !== undefined &&
    terkait_ekosistem !== null &&
    terkait_ekosistem !== '' &&
    ![
      true,
      false,
      1,
      0,
      '1',
      '0'
    ].includes(terkait_ekosistem)
  ) {
    return {
      valid: false,
      message:
        'terkait_ekosistem harus bernilai true/false atau 1/0.'
    };
  }

  return {
    valid: true
  };
};

exports.getAllRuangLingkup = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
            ${ruangLingkupSelectQuery}
            ORDER BY rl.id DESC
            `
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getAllRuangLingkup error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil data ruang lingkup.'
    });
  }
};

exports.getRuangLingkupById = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID ruang lingkup tidak valid.'
    });
  }

  try {
    const [rows] = await db.query(
      `
            ${ruangLingkupSelectQuery}
            WHERE rl.id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          'Data ruang lingkup tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'getRuangLingkupById error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil detail ruang lingkup.'
    });
  }
};

exports.getRuangLingkupByLayananPrioritas = async (
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
            ${ruangLingkupSelectQuery}
            WHERE rl.layanan_prioritas_id = ?
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
      'getRuangLingkupByLayananPrioritas error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil ruang lingkup layanan prioritas.'
    });
  }
};

exports.createRuangLingkup = async (req, res) => {
  const {
    layanan_prioritas_id,
    scope_layanan,
    kategori_layanan,
    pengguna_utama,
    jumlah_pengguna,
    target_ola,
    terkait_ekosistem,
    ekosistem_pemerintah_digital,
    deskripsi_ekosistem
  } = req.body;

  const validation =
    validateRuangLingkupInput(
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
      return res.status(404).json({
        message:
          'Layanan prioritas tidak ditemukan.'
      });
    }

    const [existingRows] = await db.query(
      `
            SELECT id
            FROM mkb_ruang_lingkup
            WHERE layanan_prioritas_id = ?
            LIMIT 1
            `,
      [Number(layanan_prioritas_id)]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        message:
          'Ruang lingkup untuk layanan prioritas tersebut sudah tersedia.'
      });
    }

    const terkaitEkosistemValue =
      terkait_ekosistem === true ||
        terkait_ekosistem === 1 ||
        terkait_ekosistem === '1'
        ? 1
        : 0;

    const ekosistemValue =
      terkaitEkosistemValue === 1
        ? normalizeOptionalText(
          ekosistem_pemerintah_digital
        )
        : null;

    const deskripsiEkosistemValue =
      terkaitEkosistemValue === 1
        ? normalizeOptionalText(
          deskripsi_ekosistem
        )
        : null;

    const [result] = await db.query(
      `
            INSERT INTO mkb_ruang_lingkup (
                layanan_prioritas_id,
                scope_layanan,
                kategori_layanan,
                pengguna_utama,
                jumlah_pengguna,
                target_ola,
                terkait_ekosistem,
                ekosistem_pemerintah_digital,
                deskripsi_ekosistem,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `,
      [
        Number(layanan_prioritas_id),
        normalizeOptionalText(
          scope_layanan
        ),
        normalizeOptionalText(
          kategori_layanan
        ),
        normalizeOptionalText(
          pengguna_utama
        ),
        jumlah_pengguna === undefined ||
          jumlah_pengguna === null ||
          jumlah_pengguna === ''
          ? null
          : Number(jumlah_pengguna),
        normalizeOptionalText(
          target_ola
        ),
        terkaitEkosistemValue,
        ekosistemValue,
        deskripsiEkosistemValue,
        req.user.id
      ]
    );

    const [rows] = await db.query(
      `
            ${ruangLingkupSelectQuery}
            WHERE rl.id = ?
            LIMIT 1
            `,
      [result.insertId]
    );

    return res.status(201).json({
      message:
        'Ruang lingkup berhasil disimpan.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'createRuangLingkup error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Ruang lingkup untuk layanan prioritas tersebut sudah tersedia.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menyimpan ruang lingkup.'
    });
  }
};

exports.updateRuangLingkup = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID ruang lingkup tidak valid.'
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(
      req.body,
      'layanan_prioritas_id'
    )
  ) {
    return res.status(400).json({
      message:
        'layanan_prioritas_id tidak dapat diubah melalui pembaruan ruang lingkup.'
    });
  }

  const validation =
    validateRuangLingkupInput(
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
            FROM mkb_ruang_lingkup
            WHERE id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message:
          'Data ruang lingkup tidak ditemukan.'
      });
    }

    const existing = existingRows[0];

    const scopeBaru =
      req.body.scope_layanan !== undefined
        ? normalizeOptionalText(
          req.body.scope_layanan
        )
        : existing.scope_layanan;

    const kategoriBaru =
      req.body.kategori_layanan !== undefined
        ? normalizeOptionalText(
          req.body.kategori_layanan
        )
        : existing.kategori_layanan;

    const penggunaBaru =
      req.body.pengguna_utama !== undefined
        ? normalizeOptionalText(
          req.body.pengguna_utama
        )
        : existing.pengguna_utama;

    const jumlahPenggunaBaru =
      req.body.jumlah_pengguna !== undefined
        ? (
          req.body.jumlah_pengguna === null ||
            req.body.jumlah_pengguna === ''
            ? null
            : Number(
              req.body.jumlah_pengguna
            )
        )
        : existing.jumlah_pengguna;

    const targetOlaBaru =
      req.body.target_ola !== undefined
        ? normalizeOptionalText(
          req.body.target_ola
        )
        : existing.target_ola;

    let terkaitEkosistemBaru =
      existing.terkait_ekosistem;

    if (
      req.body.terkait_ekosistem !== undefined
    ) {
      terkaitEkosistemBaru =
        req.body.terkait_ekosistem === true ||
          req.body.terkait_ekosistem === 1 ||
          req.body.terkait_ekosistem === '1'
          ? 1
          : 0;
    }

    let ekosistemBaru =
      req.body.ekosistem_pemerintah_digital !==
        undefined
        ? normalizeOptionalText(
          req.body
            .ekosistem_pemerintah_digital
        )
        : existing
          .ekosistem_pemerintah_digital;

    let deskripsiEkosistemBaru =
      req.body.deskripsi_ekosistem !== undefined
        ? normalizeOptionalText(
          req.body.deskripsi_ekosistem
        )
        : existing.deskripsi_ekosistem;

    if (terkaitEkosistemBaru === 0) {
      ekosistemBaru = null;
      deskripsiEkosistemBaru = null;
    }

    await db.query(
      `
            UPDATE mkb_ruang_lingkup
            SET
                scope_layanan = ?,
                kategori_layanan = ?,
                pengguna_utama = ?,
                jumlah_pengguna = ?,
                target_ola = ?,
                terkait_ekosistem = ?,
                ekosistem_pemerintah_digital = ?,
                deskripsi_ekosistem = ?
            WHERE id = ?
            `,
      [
        scopeBaru,
        kategoriBaru,
        penggunaBaru,
        jumlahPenggunaBaru,
        targetOlaBaru,
        terkaitEkosistemBaru,
        ekosistemBaru,
        deskripsiEkosistemBaru,
        Number(id)
      ]
    );

    const [rows] = await db.query(
      `
            ${ruangLingkupSelectQuery}
            WHERE rl.id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    return res.status(200).json({
      message:
        'Ruang lingkup berhasil diperbarui.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'updateRuangLingkup error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat memperbarui ruang lingkup.'
    });
  }
};

exports.deleteRuangLingkup = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID ruang lingkup tidak valid.'
    });
  }

  try {
    const [result] = await db.query(
      `
            DELETE FROM mkb_ruang_lingkup
            WHERE id = ?
            `,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          'Data ruang lingkup tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message:
        'Ruang lingkup berhasil dihapus.'
    });
  } catch (error) {
    console.error(
      'deleteRuangLingkup error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menghapus ruang lingkup.'
    });
  }
};

exports.getDetailLayananPrioritas = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID layanan prioritas tidak valid.'
    });
  }

  try {
    const [rows] = await db.query(
      `
            SELECT
                lp.id,
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

                i.id AS instansi_id,
                i.kode_instansi,
                i.nama_instansi,
                i.jenis_instansi

            FROM layanan_prioritas lp

            JOIN layanan_digital ld
                ON ld.id = lp.layanan_id

            JOIN instansi i
                ON i.id = ld.instansi_id

            WHERE lp.id = ?

            LIMIT 1
            `,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Layanan prioritas tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'getDetailLayananPrioritas error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil detail layanan prioritas.'
    });
  }
};

const timManajemenSelectQuery = `
    SELECT
        tm.id,
        tm.layanan_prioritas_id,
        tm.pegawai_id,
        tm.peran_mkb,
        tm.tanggung_jawab,
        tm.urutan,
        tm.created_by,
        tm.created_at,
        tm.updated_at,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        p.nip,
        p.nama AS nama_pegawai,
        p.email AS email_pegawai,
        p.jabatan,

        uk.id AS unit_kerja_id,
        uk.kode_unit,
        uk.nama_unit,

        i.id AS instansi_id,
        i.kode_instansi,
        i.nama_instansi,

        u.nama AS dibuat_oleh

    FROM mkb_tim_manajemen tm

    JOIN layanan_prioritas lp
        ON lp.id = tm.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id

    JOIN pegawai p
        ON p.id = tm.pegawai_id

    JOIN unit_kerja uk
        ON uk.id = p.unit_kerja_id

    JOIN instansi i
        ON i.id = uk.instansi_id

    LEFT JOIN users u
        ON u.id = tm.created_by
`;

const validateTimManajemenInput = (
  body,
  {
    requireLayananPrioritas = false,
    requirePegawai = false,
    requirePeran = false
  } = {}
) => {
  const {
    layanan_prioritas_id,
    pegawai_id,
    peran_mkb,
    tanggung_jawab,
    urutan
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

  if (
    requirePegawai &&
    !isPositiveInteger(pegawai_id)
  ) {
    return {
      valid: false,
      message:
        'pegawai_id wajib berupa ID yang valid.'
    };
  }

  if (
    requirePeran &&
    (
      typeof peran_mkb !== 'string' ||
      !peran_mkb.trim()
    )
  ) {
    return {
      valid: false,
      message:
        'peran_mkb wajib diisi.'
    };
  }

  if (
    peran_mkb !== undefined &&
    peran_mkb !== null &&
    typeof peran_mkb !== 'string'
  ) {
    return {
      valid: false,
      message:
        'peran_mkb harus berupa teks.'
    };
  }

  if (
    typeof peran_mkb === 'string' &&
    peran_mkb.trim().length > 150
  ) {
    return {
      valid: false,
      message:
        'peran_mkb maksimal 150 karakter.'
    };
  }

  if (
    tanggung_jawab !== undefined &&
    tanggung_jawab !== null &&
    typeof tanggung_jawab !== 'string'
  ) {
    return {
      valid: false,
      message:
        'tanggung_jawab harus berupa teks.'
    };
  }

  if (
    urutan !== undefined &&
    urutan !== null &&
    urutan !== '' &&
    (
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

  return {
    valid: true
  };
};

exports.getAllTimManajemen = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
            ${timManajemenSelectQuery}
            ORDER BY
                tm.layanan_prioritas_id ASC,
                tm.urutan IS NULL,
                tm.urutan ASC,
                tm.id ASC
            `
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getAllTimManajemen error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil data struktur tim manajemen.'
    });
  }
};

exports.getTimManajemenByLayananPrioritas = async (
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
            ${timManajemenSelectQuery}
            WHERE tm.layanan_prioritas_id = ?
            ORDER BY
                tm.urutan IS NULL,
                tm.urutan ASC,
                tm.id ASC
            `,
      [Number(id)]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getTimManajemenByLayananPrioritas error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil struktur tim manajemen.'
    });
  }
};

exports.getTimManajemenById = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID struktur tim manajemen tidak valid.'
    });
  }

  try {
    const [rows] = await db.query(
      `
            ${timManajemenSelectQuery}
            WHERE tm.id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          'Data struktur tim manajemen tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'getTimManajemenById error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil detail struktur tim manajemen.'
    });
  }
};

exports.createTimManajemen = async (req, res) => {
  const {
    layanan_prioritas_id,
    pegawai_id,
    peran_mkb,
    tanggung_jawab,
    urutan
  } = req.body;

  const validation =
    validateTimManajemenInput(
      req.body,
      {
        requireLayananPrioritas: true,
        requirePegawai: true,
        requirePeran: true
      }
    );

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message
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
      [Number(layanan_prioritas_id)]
    );

    if (layananRows.length === 0) {
      return res.status(404).json({
        message:
          'Layanan prioritas tidak ditemukan.'
      });
    }

    const [pegawaiRows] = await db.query(
      `
            SELECT id
            FROM pegawai
            WHERE id = ?
            LIMIT 1
            `,
      [Number(pegawai_id)]
    );

    if (pegawaiRows.length === 0) {
      return res.status(404).json({
        message:
          'Pegawai tidak ditemukan.'
      });
    }

    const [existingRows] = await db.query(
      `
            SELECT id
            FROM mkb_tim_manajemen
            WHERE layanan_prioritas_id = ?
              AND pegawai_id = ?
              AND peran_mkb = ?
            LIMIT 1
            `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_mkb.trim()
      ]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar pada tim manajemen layanan ini.'
      });
    }

    const [result] = await db.query(
      `
            INSERT INTO mkb_tim_manajemen (
                layanan_prioritas_id,
                pegawai_id,
                peran_mkb,
                tanggung_jawab,
                urutan,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_mkb.trim(),
        normalizeOptionalText(
          tanggung_jawab
        ),
        urutan === undefined ||
          urutan === null ||
          urutan === ''
          ? null
          : Number(urutan),
        req.user.id
      ]
    );

    const [rows] = await db.query(
      `
            ${timManajemenSelectQuery}
            WHERE tm.id = ?
            LIMIT 1
            `,
      [result.insertId]
    );

    return res.status(201).json({
      message:
        'Struktur tim manajemen berhasil disimpan.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'createTimManajemen error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar pada tim manajemen layanan ini.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menyimpan struktur tim manajemen.'
    });
  }
};

exports.updateTimManajemen = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID struktur tim manajemen tidak valid.'
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(
      req.body,
      'layanan_prioritas_id'
    )
  ) {
    return res.status(400).json({
      message:
        'layanan_prioritas_id tidak dapat diubah.'
    });
  }

  const validation =
    validateTimManajemenInput(
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
            FROM mkb_tim_manajemen
            WHERE id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message:
          'Data struktur tim manajemen tidak ditemukan.'
      });
    }

    const existing = existingRows[0];

    const pegawaiBaru =
      req.body.pegawai_id !== undefined
        ? Number(req.body.pegawai_id)
        : existing.pegawai_id;

    if (
      !isPositiveInteger(
        pegawaiBaru
      )
    ) {
      return res.status(400).json({
        message:
          'pegawai_id harus berupa ID yang valid.'
      });
    }

    const [pegawaiRows] = await db.query(
      `
            SELECT id
            FROM pegawai
            WHERE id = ?
            LIMIT 1
            `,
      [pegawaiBaru]
    );

    if (pegawaiRows.length === 0) {
      return res.status(404).json({
        message:
          'Pegawai tidak ditemukan.'
      });
    }

    const peranBaru =
      req.body.peran_mkb !== undefined
        ? (
          typeof req.body.peran_mkb === 'string'
            ? req.body.peran_mkb.trim()
            : ''
        )
        : existing.peran_mkb;

    if (!peranBaru) {
      return res.status(400).json({
        message:
          'peran_mkb wajib diisi.'
      });
    }

    const tanggungJawabBaru =
      req.body.tanggung_jawab !== undefined
        ? normalizeOptionalText(
          req.body.tanggung_jawab
        )
        : existing.tanggung_jawab;

    const urutanBaru =
      req.body.urutan !== undefined
        ? (
          req.body.urutan === null ||
            req.body.urutan === ''
            ? null
            : Number(req.body.urutan)
        )
        : existing.urutan;

    const [duplicateRows] = await db.query(
      `
            SELECT id
            FROM mkb_tim_manajemen
            WHERE layanan_prioritas_id = ?
              AND pegawai_id = ?
              AND peran_mkb = ?
              AND id <> ?
            LIMIT 1
            `,
      [
        existing.layanan_prioritas_id,
        pegawaiBaru,
        peranBaru,
        Number(id)
      ]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar pada tim manajemen layanan ini.'
      });
    }

    await db.query(
      `
            UPDATE mkb_tim_manajemen
            SET
                pegawai_id = ?,
                peran_mkb = ?,
                tanggung_jawab = ?,
                urutan = ?
            WHERE id = ?
            `,
      [
        pegawaiBaru,
        peranBaru,
        tanggungJawabBaru,
        urutanBaru,
        Number(id)
      ]
    );

    const [rows] = await db.query(
      `
            ${timManajemenSelectQuery}
            WHERE tm.id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    return res.status(200).json({
      message:
        'Struktur tim manajemen berhasil diperbarui.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'updateTimManajemen error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar pada tim manajemen layanan ini.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat memperbarui struktur tim manajemen.'
    });
  }
};

exports.deleteTimManajemen = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID struktur tim manajemen tidak valid.'
    });
  }

  try {
    const [result] = await db.query(
      `
            DELETE FROM mkb_tim_manajemen
            WHERE id = ?
            `,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          'Data struktur tim manajemen tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message:
        'Struktur tim manajemen berhasil dihapus.'
    });
  } catch (error) {
    console.error(
      'deleteTimManajemen error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menghapus struktur tim manajemen.'
    });
  }
};

exports.getPegawaiOptions = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
            SELECT
                p.id,
                p.nip,
                p.nama,
                p.email,
                p.jabatan,
                p.unit_kerja_id,
                uk.kode_unit,
                uk.nama_unit,
                i.id AS instansi_id,
                i.kode_instansi,
                i.nama_instansi
            FROM pegawai p
            JOIN unit_kerja uk
                ON uk.id = p.unit_kerja_id
            JOIN instansi i
                ON i.id = uk.instansi_id
            WHERE p.status = 'Aktif'
            ORDER BY p.nama ASC
            `
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getPegawaiOptions error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil daftar pegawai.'
    });
  }
};

const timTanggapInsidenSelectQuery = `
    SELECT
        ti.id,
        ti.layanan_prioritas_id,
        ti.pegawai_id,
        ti.peran_tanggap_insiden,
        ti.tanggung_jawab,
        ti.urutan,
        ti.created_by,
        ti.created_at,
        ti.updated_at,

        lp.kode_prioritas,

        ld.id AS layanan_id,
        ld.kode_layanan,
        ld.nama_layanan,

        p.nip,
        p.nama AS nama_pegawai,
        p.email AS email_pegawai,
        p.jabatan,

        uk.id AS unit_kerja_id,
        uk.kode_unit,
        uk.nama_unit,

        i.id AS instansi_id,
        i.kode_instansi,
        i.nama_instansi,

        u.nama AS dibuat_oleh

    FROM mkb_tim_tanggap_insiden ti

    JOIN layanan_prioritas lp
        ON lp.id = ti.layanan_prioritas_id

    JOIN layanan_digital ld
        ON ld.id = lp.layanan_id

    JOIN pegawai p
        ON p.id = ti.pegawai_id

    JOIN unit_kerja uk
        ON uk.id = p.unit_kerja_id

    JOIN instansi i
        ON i.id = uk.instansi_id

    LEFT JOIN users u
        ON u.id = ti.created_by
`;

const validateTimTanggapInsidenInput = (
  body,
  {
    requireLayananPrioritas = false,
    requirePegawai = false,
    requirePeran = false
  } = {}
) => {
  const {
    layanan_prioritas_id,
    pegawai_id,
    peran_tanggap_insiden,
    tanggung_jawab,
    urutan
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

  if (
    requirePegawai &&
    !isPositiveInteger(pegawai_id)
  ) {
    return {
      valid: false,
      message:
        'pegawai_id wajib berupa ID yang valid.'
    };
  }

  if (
    requirePeran &&
    (
      typeof peran_tanggap_insiden !== 'string' ||
      !peran_tanggap_insiden.trim()
    )
  ) {
    return {
      valid: false,
      message:
        'peran_tanggap_insiden wajib diisi.'
    };
  }

  if (
    peran_tanggap_insiden !== undefined &&
    peran_tanggap_insiden !== null &&
    typeof peran_tanggap_insiden !== 'string'
  ) {
    return {
      valid: false,
      message:
        'peran_tanggap_insiden harus berupa teks.'
    };
  }

  if (
    typeof peran_tanggap_insiden === 'string' &&
    peran_tanggap_insiden.trim().length > 150
  ) {
    return {
      valid: false,
      message:
        'peran_tanggap_insiden maksimal 150 karakter.'
    };
  }

  if (
    tanggung_jawab !== undefined &&
    tanggung_jawab !== null &&
    typeof tanggung_jawab !== 'string'
  ) {
    return {
      valid: false,
      message:
        'tanggung_jawab harus berupa teks.'
    };
  }

  if (
    urutan !== undefined &&
    urutan !== null &&
    urutan !== '' &&
    (
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

  return {
    valid: true
  };
};

exports.getAllTimTanggapInsiden = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
            ${timTanggapInsidenSelectQuery}
            ORDER BY
                ti.layanan_prioritas_id ASC,
                ti.urutan IS NULL,
                ti.urutan ASC,
                ti.id ASC
            `
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getAllTimTanggapInsiden error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil data pelaksana tanggap insiden.'
    });
  }
};

exports.getTimTanggapInsidenByLayananPrioritas = async (
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
            ${timTanggapInsidenSelectQuery}
            WHERE ti.layanan_prioritas_id = ?
            ORDER BY
                ti.urutan IS NULL,
                ti.urutan ASC,
                ti.id ASC
            `,
      [Number(id)]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getTimTanggapInsidenByLayananPrioritas error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil pelaksana tanggap insiden.'
    });
  }
};

exports.getTimTanggapInsidenById = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID pelaksana tanggap insiden tidak valid.'
    });
  }

  try {
    const [rows] = await db.query(
      `
            ${timTanggapInsidenSelectQuery}
            WHERE ti.id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana tanggap insiden tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'getTimTanggapInsidenById error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil detail pelaksana tanggap insiden.'
    });
  }
};

exports.createTimTanggapInsiden = async (req, res) => {
  const {
    layanan_prioritas_id,
    pegawai_id,
    peran_tanggap_insiden,
    tanggung_jawab,
    urutan
  } = req.body;

  const validation =
    validateTimTanggapInsidenInput(
      req.body,
      {
        requireLayananPrioritas: true,
        requirePegawai: true,
        requirePeran: true
      }
    );

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message
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
      [Number(layanan_prioritas_id)]
    );

    if (layananRows.length === 0) {
      return res.status(404).json({
        message:
          'Layanan prioritas tidak ditemukan.'
      });
    }

    const [pegawaiRows] = await db.query(
      `
            SELECT id
            FROM pegawai
            WHERE id = ?
            LIMIT 1
            `,
      [Number(pegawai_id)]
    );

    if (pegawaiRows.length === 0) {
      return res.status(404).json({
        message:
          'Pegawai tidak ditemukan.'
      });
    }

    const [existingRows] = await db.query(
      `
            SELECT id
            FROM mkb_tim_tanggap_insiden
            WHERE layanan_prioritas_id = ?
              AND pegawai_id = ?
              AND peran_tanggap_insiden = ?
            LIMIT 1
            `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_tanggap_insiden.trim()
      ]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana tanggap insiden.'
      });
    }

    const [result] = await db.query(
      `
            INSERT INTO mkb_tim_tanggap_insiden (
                layanan_prioritas_id,
                pegawai_id,
                peran_tanggap_insiden,
                tanggung_jawab,
                urutan,
                created_by
            )
            VALUES (?, ?, ?, ?, ?, ?)
            `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_tanggap_insiden.trim(),
        normalizeOptionalText(
          tanggung_jawab
        ),
        urutan === undefined ||
          urutan === null ||
          urutan === ''
          ? null
          : Number(urutan),
        req.user.id
      ]
    );

    const [rows] = await db.query(
      `
            ${timTanggapInsidenSelectQuery}
            WHERE ti.id = ?
            LIMIT 1
            `,
      [result.insertId]
    );

    return res.status(201).json({
      message:
        'Pelaksana tanggap insiden berhasil disimpan.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'createTimTanggapInsiden error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana tanggap insiden.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menyimpan pelaksana tanggap insiden.'
    });
  }
};

exports.updateTimTanggapInsiden = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID pelaksana tanggap insiden tidak valid.'
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(
      req.body,
      'layanan_prioritas_id'
    )
  ) {
    return res.status(400).json({
      message:
        'layanan_prioritas_id tidak dapat diubah.'
    });
  }

  const validation =
    validateTimTanggapInsidenInput(
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
            FROM mkb_tim_tanggap_insiden
            WHERE id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana tanggap insiden tidak ditemukan.'
      });
    }

    const existing = existingRows[0];

    const pegawaiBaru =
      req.body.pegawai_id !== undefined
        ? Number(req.body.pegawai_id)
        : existing.pegawai_id;

    if (!isPositiveInteger(pegawaiBaru)) {
      return res.status(400).json({
        message:
          'pegawai_id harus berupa ID yang valid.'
      });
    }

    const [pegawaiRows] = await db.query(
      `
            SELECT id
            FROM pegawai
            WHERE id = ?
            LIMIT 1
            `,
      [pegawaiBaru]
    );

    if (pegawaiRows.length === 0) {
      return res.status(404).json({
        message:
          'Pegawai tidak ditemukan.'
      });
    }

    const peranBaru =
      req.body.peran_tanggap_insiden !== undefined
        ? (
          typeof req.body.peran_tanggap_insiden === 'string'
            ? req.body.peran_tanggap_insiden.trim()
            : ''
        )
        : existing.peran_tanggap_insiden;

    if (!peranBaru) {
      return res.status(400).json({
        message:
          'peran_tanggap_insiden wajib diisi.'
      });
    }

    const tanggungJawabBaru =
      req.body.tanggung_jawab !== undefined
        ? normalizeOptionalText(
          req.body.tanggung_jawab
        )
        : existing.tanggung_jawab;

    const urutanBaru =
      req.body.urutan !== undefined
        ? (
          req.body.urutan === null ||
            req.body.urutan === ''
            ? null
            : Number(req.body.urutan)
        )
        : existing.urutan;

    const [duplicateRows] = await db.query(
      `
            SELECT id
            FROM mkb_tim_tanggap_insiden
            WHERE layanan_prioritas_id = ?
              AND pegawai_id = ?
              AND peran_tanggap_insiden = ?
              AND id <> ?
            LIMIT 1
            `,
      [
        existing.layanan_prioritas_id,
        pegawaiBaru,
        peranBaru,
        Number(id)
      ]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana tanggap insiden.'
      });
    }

    await db.query(
      `
            UPDATE mkb_tim_tanggap_insiden
            SET
                pegawai_id = ?,
                peran_tanggap_insiden = ?,
                tanggung_jawab = ?,
                urutan = ?
            WHERE id = ?
            `,
      [
        pegawaiBaru,
        peranBaru,
        tanggungJawabBaru,
        urutanBaru,
        Number(id)
      ]
    );

    const [rows] = await db.query(
      `
            ${timTanggapInsidenSelectQuery}
            WHERE ti.id = ?
            LIMIT 1
            `,
      [Number(id)]
    );

    return res.status(200).json({
      message:
        'Pelaksana tanggap insiden berhasil diperbarui.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'updateTimTanggapInsiden error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana tanggap insiden.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat memperbarui pelaksana tanggap insiden.'
    });
  }
};

exports.deleteTimTanggapInsiden = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message:
        'ID pelaksana tanggap insiden tidak valid.'
    });
  }

  try {
    const [result] = await db.query(
      `
            DELETE FROM mkb_tim_tanggap_insiden
            WHERE id = ?
            `,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana tanggap insiden tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message:
        'Pelaksana tanggap insiden berhasil dihapus.'
    });
  } catch (error) {
    console.error(
      'deleteTimTanggapInsiden error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menghapus pelaksana tanggap insiden.'
    });
  }
};

const timPemulihanLayananSelectQuery = `
  SELECT
    tp.id,
    tp.layanan_prioritas_id,
    tp.pegawai_id,
    tp.peran_pemulihan,
    tp.tanggung_jawab,
    tp.urutan,
    tp.created_by,
    tp.created_at,
    tp.updated_at,

    lp.kode_prioritas,

    ld.id AS layanan_id,
    ld.kode_layanan,
    ld.nama_layanan,

    p.nip,
    p.nama AS nama_pegawai,
    p.email AS email_pegawai,
    p.jabatan,

    uk.id AS unit_kerja_id,
    uk.kode_unit,
    uk.nama_unit,

    i.id AS instansi_id,
    i.kode_instansi,
    i.nama_instansi,

    u.nama AS dibuat_oleh

  FROM mkb_tim_pemulihan_layanan tp

  JOIN layanan_prioritas lp
    ON lp.id = tp.layanan_prioritas_id

  JOIN layanan_digital ld
    ON ld.id = lp.layanan_id

  JOIN pegawai p
    ON p.id = tp.pegawai_id

  JOIN unit_kerja uk
    ON uk.id = p.unit_kerja_id

  JOIN instansi i
    ON i.id = uk.instansi_id

  LEFT JOIN users u
    ON u.id = tp.created_by
`;

const validateTimPemulihanLayananInput = (
  body,
  {
    requireLayananPrioritas = false,
    requirePegawai = false,
    requirePeran = false
  } = {}
) => {
  const {
    layanan_prioritas_id,
    pegawai_id,
    peran_pemulihan,
    tanggung_jawab,
    urutan
  } = body;

  if (
    requireLayananPrioritas &&
    !isPositiveInteger(layanan_prioritas_id)
  ) {
    return {
      valid: false,
      message: 'layanan_prioritas_id wajib berupa ID yang valid.'
    };
  }

  if (
    requirePegawai &&
    !isPositiveInteger(pegawai_id)
  ) {
    return {
      valid: false,
      message: 'pegawai_id wajib berupa ID yang valid.'
    };
  }

  if (
    requirePeran &&
    (
      typeof peran_pemulihan !== 'string' ||
      !peran_pemulihan.trim()
    )
  ) {
    return {
      valid: false,
      message: 'peran_pemulihan wajib diisi.'
    };
  }

  if (
    peran_pemulihan !== undefined &&
    peran_pemulihan !== null &&
    typeof peran_pemulihan !== 'string'
  ) {
    return {
      valid: false,
      message: 'peran_pemulihan harus berupa teks.'
    };
  }

  if (
    typeof peran_pemulihan === 'string' &&
    peran_pemulihan.trim().length > 150
  ) {
    return {
      valid: false,
      message: 'peran_pemulihan maksimal 150 karakter.'
    };
  }

  if (
    tanggung_jawab !== undefined &&
    tanggung_jawab !== null &&
    typeof tanggung_jawab !== 'string'
  ) {
    return {
      valid: false,
      message: 'tanggung_jawab harus berupa teks.'
    };
  }

  if (
    urutan !== undefined &&
    urutan !== null &&
    urutan !== '' &&
    (
      !Number.isInteger(Number(urutan)) ||
      Number(urutan) <= 0
    )
  ) {
    return {
      valid: false,
      message: 'urutan harus berupa bilangan bulat lebih dari 0.'
    };
  }

  return {
    valid: true
  };
};

exports.getAllTimPemulihanLayanan = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      ${timPemulihanLayananSelectQuery}
      ORDER BY
        tp.layanan_prioritas_id ASC,
        tp.urutan IS NULL,
        tp.urutan ASC,
        tp.id ASC
      `
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getAllTimPemulihanLayanan error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil data pelaksana pemulihan layanan.'
    });
  }
};

exports.getTimPemulihanLayananByLayananPrioritas = async (
  req,
  res
) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID layanan prioritas tidak valid.'
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
        message: 'Layanan prioritas tidak ditemukan.'
      });
    }

    const [rows] = await db.query(
      `
      ${timPemulihanLayananSelectQuery}
      WHERE tp.layanan_prioritas_id = ?
      ORDER BY
        tp.urutan IS NULL,
        tp.urutan ASC,
        tp.id ASC
      `,
      [Number(id)]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getTimPemulihanLayananByLayananPrioritas error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil pelaksana pemulihan layanan.'
    });
  }
};

exports.getTimPemulihanLayananById = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID pelaksana pemulihan layanan tidak valid.'
    });
  }

  try {
    const [rows] = await db.query(
      `
      ${timPemulihanLayananSelectQuery}
      WHERE tp.id = ?
      LIMIT 1
      `,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana pemulihan layanan tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'getTimPemulihanLayananById error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil detail pelaksana pemulihan layanan.'
    });
  }
};

exports.createTimPemulihanLayanan = async (req, res) => {
  const {
    layanan_prioritas_id,
    pegawai_id,
    peran_pemulihan,
    tanggung_jawab,
    urutan
  } = req.body;

  const validation = validateTimPemulihanLayananInput(
    req.body,
    {
      requireLayananPrioritas: true,
      requirePegawai: true,
      requirePeran: true
    }
  );

  if (!validation.valid) {
    return res.status(400).json({
      message: validation.message
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
      [Number(layanan_prioritas_id)]
    );

    if (layananRows.length === 0) {
      return res.status(404).json({
        message: 'Layanan prioritas tidak ditemukan.'
      });
    }

    const [pegawaiRows] = await db.query(
      `
      SELECT id
      FROM pegawai
      WHERE id = ?
      LIMIT 1
      `,
      [Number(pegawai_id)]
    );

    if (pegawaiRows.length === 0) {
      return res.status(404).json({
        message: 'Pegawai tidak ditemukan.'
      });
    }

    const [existingRows] = await db.query(
      `
      SELECT id
      FROM mkb_tim_pemulihan_layanan
      WHERE layanan_prioritas_id = ?
        AND pegawai_id = ?
        AND peran_pemulihan = ?
      LIMIT 1
      `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_pemulihan.trim()
      ]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana pemulihan layanan.'
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO mkb_tim_pemulihan_layanan (
        layanan_prioritas_id,
        pegawai_id,
        peran_pemulihan,
        tanggung_jawab,
        urutan,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_pemulihan.trim(),
        normalizeOptionalText(tanggung_jawab),
        urutan === undefined ||
          urutan === null ||
          urutan === ''
          ? null
          : Number(urutan),
        req.user.id
      ]
    );

    const [rows] = await db.query(
      `
      ${timPemulihanLayananSelectQuery}
      WHERE tp.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      message:
        'Pelaksana pemulihan layanan berhasil disimpan.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'createTimPemulihanLayanan error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana pemulihan layanan.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menyimpan pelaksana pemulihan layanan.'
    });
  }
};

exports.updateTimPemulihanLayanan = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID pelaksana pemulihan layanan tidak valid.'
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(
      req.body,
      'layanan_prioritas_id'
    )
  ) {
    return res.status(400).json({
      message:
        'layanan_prioritas_id tidak dapat diubah.'
    });
  }

  const validation = validateTimPemulihanLayananInput(
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
      FROM mkb_tim_pemulihan_layanan
      WHERE id = ?
      LIMIT 1
      `,
      [Number(id)]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana pemulihan layanan tidak ditemukan.'
      });
    }

    const existing = existingRows[0];

    const pegawaiBaru =
      req.body.pegawai_id !== undefined
        ? Number(req.body.pegawai_id)
        : existing.pegawai_id;

    if (!isPositiveInteger(pegawaiBaru)) {
      return res.status(400).json({
        message:
          'pegawai_id harus berupa ID yang valid.'
      });
    }

    const [pegawaiRows] = await db.query(
      `
      SELECT id
      FROM pegawai
      WHERE id = ?
      LIMIT 1
      `,
      [pegawaiBaru]
    );

    if (pegawaiRows.length === 0) {
      return res.status(404).json({
        message: 'Pegawai tidak ditemukan.'
      });
    }

    const peranBaru =
      req.body.peran_pemulihan !== undefined
        ? (
          typeof req.body.peran_pemulihan === 'string'
            ? req.body.peran_pemulihan.trim()
            : ''
        )
        : existing.peran_pemulihan;

    if (!peranBaru) {
      return res.status(400).json({
        message: 'peran_pemulihan wajib diisi.'
      });
    }

    const tanggungJawabBaru =
      req.body.tanggung_jawab !== undefined
        ? normalizeOptionalText(
          req.body.tanggung_jawab
        )
        : existing.tanggung_jawab;

    const urutanBaru =
      req.body.urutan !== undefined
        ? (
          req.body.urutan === null ||
            req.body.urutan === ''
            ? null
            : Number(req.body.urutan)
        )
        : existing.urutan;

    const [duplicateRows] = await db.query(
      `
      SELECT id
      FROM mkb_tim_pemulihan_layanan
      WHERE layanan_prioritas_id = ?
        AND pegawai_id = ?
        AND peran_pemulihan = ?
        AND id <> ?
      LIMIT 1
      `,
      [
        existing.layanan_prioritas_id,
        pegawaiBaru,
        peranBaru,
        Number(id)
      ]
    );

    if (duplicateRows.length > 0) {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana pemulihan layanan.'
      });
    }

    await db.query(
      `
      UPDATE mkb_tim_pemulihan_layanan
      SET
        pegawai_id = ?,
        peran_pemulihan = ?,
        tanggung_jawab = ?,
        urutan = ?
      WHERE id = ?
      `,
      [
        pegawaiBaru,
        peranBaru,
        tanggungJawabBaru,
        urutanBaru,
        Number(id)
      ]
    );

    const [rows] = await db.query(
      `
      ${timPemulihanLayananSelectQuery}
      WHERE tp.id = ?
      LIMIT 1
      `,
      [Number(id)]
    );

    return res.status(200).json({
      message:
        'Pelaksana pemulihan layanan berhasil diperbarui.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'updateTimPemulihanLayanan error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana pemulihan layanan.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat memperbarui pelaksana pemulihan layanan.'
    });
  }
};

exports.deleteTimPemulihanLayanan = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID pelaksana pemulihan layanan tidak valid.'
    });
  }

  try {
    const [result] = await db.query(
      `
      DELETE FROM mkb_tim_pemulihan_layanan
      WHERE id = ?
      `,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana pemulihan layanan tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message:
        'Pelaksana pemulihan layanan berhasil dihapus.'
    });
  } catch (error) {
    console.error(
      'deleteTimPemulihanLayanan error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menghapus pelaksana pemulihan layanan.'
    });
  }
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