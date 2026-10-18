const db = require('../config/db');

const getMkbInstansiId = async (req) => {
  const role = String(req.user?.role || '').trim().toLowerCase();

  if (role === 'admin') {
    return null;
  }

  const namaInstansi = String(
    req.user?.nama_instansi || ''
  ).trim();

  if (!namaInstansi) {
    throw new Error('INSTANSI_AKUN_KOSONG');
  }

  const [rows] = await db.query(
    `
    SELECT id
    FROM instansi
    WHERE LOWER(TRIM(nama_instansi)) = LOWER(TRIM(?))
    LIMIT 1
    `,
    [namaInstansi]
  );

  if (rows.length === 0) {
    throw new Error('INSTANSI_AKUN_TIDAK_DITEMUKAN');
  }

  return Number(rows[0].id);
};


const form10RequiredFields = {
  insiden: [
    ['nama_insiden', 'Insiden / Gangguan Potensial'],
    ['jenis_kejadian', 'Jenis Kejadian'],
    ['kategori_dampak', 'Kategori Dampak'],
    ['deskripsi', 'Deskripsi']
  ],
  modul: [
    ['nama_modul_manual', 'Modul Terkait'],
    ['keterangan_dampak', 'Keterangan Dampak']
  ],
  ketergantungan: [
    ['jenis_ketergantungan', 'Jenis Ketergantungan'],
    ['tingkat_ketergantungan', 'Tingkat Ketergantungan'],
    ['nama_ketergantungan', 'Nama Ketergantungan'],
    ['deskripsi', 'Deskripsi']
  ],
  target: [
    ['mtpd', 'MTPD'],
    ['rto', 'RTO'],
    ['rpo', 'RPO'],
    ['mbco', 'MBCO']
  ]
};

exports.validateForm10Required = (jenis) => (req, res, next) => {
  const fields = form10RequiredFields[jenis];

  if (!fields) {
    return res.status(500).json({
      message: 'Konfigurasi validasi tidak ditemukan.'
    });
  }

  if (jenis === 'target') {
    const isTargetUpdate = fields.some(([field]) =>
      Object.prototype.hasOwnProperty.call(req.body, field)
    );

    if (!isTargetUpdate) {
      return next();
    }
  }

  for (const [field, label] of fields) {
    const value = req.body[field];

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {
      return res.status(400).json({
        message: `${label} wajib diisi.`
      });
    }
  }

  next();
};

const form10AccessQueries = {
  bia: `
    SELECT ml.instansi_id
    FROM mkb_bia b
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE b.id = ?
    LIMIT 1
  `,
  insiden: `
    SELECT ml.instansi_id
    FROM mkb_insiden i
    JOIN mkb_bia b ON b.id = i.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE i.id = ?
    LIMIT 1
  `,
  modul: `
    SELECT ml.instansi_id
    FROM mkb_insiden_modul im
    JOIN mkb_insiden i ON i.id = im.insiden_id
    JOIN mkb_bia b ON b.id = i.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE im.id = ?
    LIMIT 1
  `,
  ketergantungan: `
    SELECT ml.instansi_id
    FROM mkb_ketergantungan k
    JOIN mkb_bia b ON b.id = k.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE k.id = ?
    LIMIT 1
  `
};

exports.checkForm10Instansi = (jenis) => async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID data tidak valid.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      form10AccessQueries[jenis],
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Data tidak ditemukan.'
      });
    }

    if (
      instansiId !== null &&
      Number(rows[0].instansi_id) !== instansiId
    ) {
      return res.status(403).json({
        message: 'Tidak memiliki akses ke data instansi lain.'
      });
    }

    next();
  } catch (error) {
    console.error('checkForm10Instansi error:', error);

    return res.status(
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
        ? 403
        : 500
    ).json({
      message: 'Gagal memverifikasi akses instansi.'
    });
  }
};


const form11RequiredFields = {
  strategi: [
    ['nomor_skenario', 'Nomor Skenario'],
    ['kategori', 'Kategori'],
    ['metode_pemulihan', 'Metode Pemulihan'],
    ['deskripsi_strategi', 'Deskripsi Strategi']
  ],
  langkah: [
    ['urutan', 'Urutan'],
    ['nama_langkah', 'Nama Langkah'],
    ['deskripsi', 'Deskripsi']
  ]
};

exports.validateForm11Required = (jenis) => (req, res, next) => {
  const fields = form11RequiredFields[jenis];

  if (!fields) {
    return res.status(500).json({
      message: 'Konfigurasi validasi tidak ditemukan.'
    });
  }

  for (const [field, label] of fields) {
    const value = req.body[field];

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {
      return res.status(400).json({
        message: `${label} wajib diisi.`
      });
    }
  }

  next();
};

const form11AccessQueries = {
  strategi: `
    SELECT ml.instansi_id
    FROM mkb_strategi_pemulihan s
    JOIN mkb_insiden i ON i.id = s.insiden_id
    JOIN mkb_bia b ON b.id = i.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE s.id = ?
    LIMIT 1
  `,
  langkah: `
    SELECT ml.instansi_id
    FROM mkb_langkah_pemulihan l
    JOIN mkb_strategi_pemulihan s ON s.id = l.strategi_id
    JOIN mkb_insiden i ON i.id = s.insiden_id
    JOIN mkb_bia b ON b.id = i.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE l.id = ?
    LIMIT 1
  `
};

exports.checkForm11Instansi = (jenis) => async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID tidak valid.'
      });
    }

    const instansiId = await getMkbInstansiId(req);
    const query = form11AccessQueries[jenis];

    if (!query) {
      return res.status(500).json({
        message: 'Konfigurasi akses tidak ditemukan.'
      });
    }

    const [rows] = await db.query(query, [id]);

    if (!rows.length) {
      return res.status(404).json({
        message: 'Data tidak ditemukan.'
      });
    }

    if (
      instansiId !== null &&
      Number(rows[0].instansi_id) !== instansiId
    ) {
      return res.status(403).json({
        message: 'Tidak memiliki akses ke data instansi lain.'
      });
    }

    next();
  } catch (error) {
    console.error('checkForm11Instansi error:', error);

    const invalidInstansi = [
      'INSTANSI_AKUN_KOSONG',
      'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ].includes(error.message);

    return res.status(invalidInstansi ? 403 : 500).json({
      message: 'Gagal memverifikasi akses instansi.'
    });
  }
};


const form12RequiredFields = [
  ['jenis_kejadian', 'Jenis Kejadian'],
  ['tujuan_uji', 'Tujuan Uji'],
  ['jenis_uji', 'Jenis Uji'],
  ['tanggal_uji', 'Tanggal Uji'],
  ['kriteria_keberhasilan', 'Kriteria Keberhasilan'],
  ['judul_skenario', 'Judul Skenario'],
  ['target_rto', 'Target RTO']
];

const form13RequiredFields = [
  ['hasil_uji', 'Hasil Uji / Ringkasan'],
  ['pembelajaran', 'Pembelajaran yang Didapat'],
  ['kendala', 'Kendala / Hambatan'],
  ['rekomendasi_perbaikan', 'Rekomendasi Perbaikan'],
  ['jenis_perbaikan', 'Jenis Perbaikan'],
  ['penanggung_jawab_id', 'Penanggung Jawab'],
  ['target_waktu', 'Target Waktu'],
  ['status', 'Status'],
  ['catatan', 'Catatan']
];

exports.validateForm12and13 = (jenis) => (req, res, next) => {
  const fields = jenis === 'uji'
    ? form12RequiredFields
    : jenis === 'evaluasi'
      ? form13RequiredFields
      : null;

  if (!fields) {
    return res.status(500).json({
      message: 'Konfigurasi validasi tidak ditemukan.'
    });
  }

  for (const [field, label] of fields) {
    const value = req.body[field];

    if (
      value === undefined ||
      value === null ||
      String(value).trim() === ''
    ) {
      return res.status(400).json({
        message: `${label} wajib diisi.`
      });
    }
  }

  if (jenis === 'uji') {
    const rto = Number(req.body.target_rto);

    if (!Number.isInteger(rto) || rto < 0) {
      return res.status(400).json({
        message: 'Target RTO harus berupa bilangan bulat 0 atau lebih.'
      });
    }
  }

  if (
    jenis === 'evaluasi' &&
    !isPositiveInteger(req.body.penanggung_jawab_id)
  ) {
    return res.status(400).json({
      message: 'Penanggung Jawab tidak valid.'
    });
  }

  next();
};

const form12and13AccessQueries = {
  insiden: `
    SELECT ml.instansi_id
    FROM mkb_insiden i
    JOIN mkb_bia b ON b.id = i.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE i.id = ?
    LIMIT 1
  `,
  uji: `
    SELECT ml.instansi_id
    FROM mkb_uji u
    JOIN mkb_insiden i ON i.id = u.insiden_id
    JOIN mkb_bia b ON b.id = i.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE u.id = ?
    LIMIT 1
  `,
  evaluasi: `
    SELECT ml.instansi_id
    FROM mkb_evaluasi e
    JOIN mkb_uji u ON u.id = e.uji_id
    JOIN mkb_insiden i ON i.id = u.insiden_id
    JOIN mkb_bia b ON b.id = i.bia_id
    JOIN mkb_layanan_prioritas ml
      ON ml.id = b.mkb_layanan_prioritas_id
    WHERE e.id = ?
    LIMIT 1
  `
};

exports.checkForm12and13Instansi = (jenis) => async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID data tidak valid.'
      });
    }

    const query = form12and13AccessQueries[jenis];

    if (!query) {
      return res.status(500).json({
        message: 'Konfigurasi akses tidak ditemukan.'
      });
    }

    const instansiId = await getMkbInstansiId(req);
    const [rows] = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        message: 'Data tidak ditemukan.'
      });
    }

    if (
      instansiId !== null &&
      Number(rows[0].instansi_id) !== Number(instansiId)
    ) {
      return res.status(403).json({
        message: 'Tidak memiliki akses ke data instansi lain.'
      });
    }

    next();
  } catch (error) {
    console.error('checkForm12and13Instansi error:', error);

    const invalidInstansi = [
      'INSTANSI_AKUN_KOSONG',
      'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ].includes(error.message);

    return res.status(invalidInstansi ? 403 : 500).json({
      message: 'Gagal memverifikasi akses instansi.'
    });
  }
};

exports.getBiaLayananOptions = async (req, res) => {
  try {
    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      `
        SELECT
          ml.id,
          ml.kode_layanan AS kode_prioritas,
          ml.nama_layanan,
          ml.instansi_id
        FROM mkb_layanan_prioritas ml
        WHERE (? IS NULL OR ml.instansi_id = ?)
        ORDER BY ml.kode_layanan ASC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getBiaLayananOptions error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil layanan prioritas MKB.'
    });
  }
};

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
      rl.mkb_layanan_prioritas_id,

      COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,
      lp.alasan_prioritas,
      lp.membutuhkan_mkb,
      lp.pic_id,
      lp.target_penyusunan,
      lp.status AS status_layanan_prioritas,

      ld.id AS layanan_id,
      ld.kode_layanan,

      COALESCE(
        ml.nama_layanan,
        ld.nama_layanan
      ) AS nama_layanan,

      ld.deskripsi AS deskripsi_layanan,
      COALESCE(ml.jenis_layanan, ld.jenis_layanan) AS jenis_layanan,

      COALESCE(
        ml.instansi_id,
        ld.instansi_id
      ) AS instansi_id,

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

    LEFT JOIN mkb_layanan_prioritas ml
      ON ml.id = rl.mkb_layanan_prioritas_id

    LEFT JOIN layanan_prioritas lp
      ON lp.id = rl.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
      ON ld.id = lp.layanan_id

    LEFT JOIN instansi i
      ON i.id = COALESCE(
        ml.instansi_id,
        ld.instansi_id
      )

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
    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      `
        ${ruangLingkupSelectQuery}
        WHERE (? IS NULL OR COALESCE(ml.instansi_id, ld.instansi_id) = ?)
        ORDER BY rl.id DESC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getAllRuangLingkup error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil data ruang lingkup.'
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
  let connection;

  try {
    const {
      kode_layanan,
      nama_layanan_prioritas,
      jenis_layanan,
      instansi_id,
      scope_layanan,
      kategori_layanan,
      pengguna_utama,
      jumlah_pengguna,
      target_ola,
      terkait_ekosistem,
      ekosistem_pemerintah_digital,
      deskripsi_ekosistem
    } = req.body;

    const kode = String(kode_layanan || '').trim().toUpperCase();
    const nama = String(nama_layanan_prioritas || '').trim();
    const jenis = String(jenis_layanan || '').trim();

    const instansiAkunId = await getMkbInstansiId(req);
    const instansiId = instansiAkunId === null
      ? Number(instansi_id)
      : instansiAkunId;

    if (!Number.isInteger(instansiId) || instansiId <= 0) {
      return res.status(400).json({
        message: 'Instansi wajib ditentukan.'
      });
    }

    if (!kode || !nama || !jenis) {
      return res.status(400).json({
        message: 'ID Layanan Prioritas, Nama Layanan, dan Jenis Layanan wajib diisi.'
      });
    }

    if (kode.length > 60 || nama.length > 200 || jenis.length > 100) {
      return res.status(400).json({
        message: 'Panjang ID atau informasi layanan melebihi batas.'
      });
    }

    if (
      !String(scope_layanan || '').trim() ||
      !String(kategori_layanan || '').trim() ||
      !String(pengguna_utama || '').trim() ||
      !String(target_ola || '').trim()
    ) {
      return res.status(400).json({
        message: 'Seluruh informasi ruang lingkup wajib diisi.'
      });
    }

    if (
      jumlah_pengguna === null ||
      jumlah_pengguna === undefined ||
      String(jumlah_pengguna).trim() === '' ||
      !Number.isInteger(Number(jumlah_pengguna)) ||
      Number(jumlah_pengguna) < 0
    ) {
      return res.status(400).json({
        message: 'Jumlah Pengguna harus berupa bilangan bulat positif atau nol.'
      });
    }

    const terkait = (
      terkait_ekosistem === true ||
      terkait_ekosistem === 1 ||
      terkait_ekosistem === '1'
    ) ? 1 : 0;

    if (
      terkait === 1 &&
      (
        !String(ekosistem_pemerintah_digital || '').trim() ||
        !String(deskripsi_ekosistem || '').trim()
      )
    ) {
      return res.status(400).json({
        message: 'Nama dan deskripsi ekosistem wajib diisi.'
      });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [instansiRows] = await connection.query(
      'SELECT id FROM instansi WHERE id = ? LIMIT 1',
      [instansiId]
    );

    if (instansiRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Instansi tidak ditemukan.'
      });
    }

    const [layananResult] = await connection.query(
      `
      INSERT INTO mkb_layanan_prioritas
        (
          instansi_id,
          kode_layanan,
          nama_layanan,
          jenis_layanan,
          created_by
        )
      VALUES (?, ?, ?, ?, ?)
      `,
      [
        instansiId,
        kode,
        nama,
        jenis,
        req.user.id
      ]
    );

    const [result] = await connection.query(
      `
      INSERT INTO mkb_ruang_lingkup
        (
          layanan_prioritas_id,
          mkb_layanan_prioritas_id,
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
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        layananResult.insertId,
        String(scope_layanan).trim(),
        String(kategori_layanan).trim(),
        String(pengguna_utama).trim(),
        Number(jumlah_pengguna),
        String(target_ola).trim(),
        terkait,
        terkait ? String(ekosistem_pemerintah_digital).trim() : null,
        terkait ? String(deskripsi_ekosistem).trim() : null,
        req.user.id
      ]
    );

    await connection.commit();

    return res.status(201).json({
      message: 'Ruang lingkup berhasil disimpan.',
      data: {
        id: result.insertId,
        mkb_layanan_prioritas_id: layananResult.insertId,
        kode_prioritas: kode,
        nama_layanan: nama,
        jenis_layanan: jenis,
        instansi_id: instansiId
      }
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('createRuangLingkup error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'ID Layanan Prioritas sudah digunakan. Masukkan ID lain.'
      });
    }

    if (
      error.message === 'INSTANSI_AKUN_KOSONG' ||
      error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
    ) {
      return res.status(403).json({
        message: 'Instansi akun tidak valid.'
      });
    }

    return res.status(500).json({
      message: 'Gagal menyimpan ruang lingkup.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

exports.updateRuangLingkup = async (req, res) => {
  let connection;

  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID ruang lingkup tidak valid.'
      });
    }

    const instansiAkunId = await getMkbInstansiId(req);

    connection = await db.getConnection();
    await connection.beginTransaction();

    const [rows] = await connection.query(
      `
      SELECT
        rl.*,
        COALESCE(ml.instansi_id, ld.instansi_id) AS instansi_id,
        ml.kode_layanan,
        ml.nama_layanan,
        ml.jenis_layanan
      FROM mkb_ruang_lingkup rl
      LEFT JOIN mkb_layanan_prioritas ml
        ON ml.id = rl.mkb_layanan_prioritas_id
      LEFT JOIN layanan_prioritas lp
        ON lp.id = rl.layanan_prioritas_id
      LEFT JOIN layanan_digital ld
        ON ld.id = lp.layanan_id
      WHERE rl.id = ?
      FOR UPDATE
      `,
      [id]
    );

    if (rows.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        message: 'Ruang lingkup tidak ditemukan.'
      });
    }

    const existing = rows[0];

    if (
      instansiAkunId !== null &&
      Number(existing.instansi_id) !== instansiAkunId
    ) {
      await connection.rollback();
      return res.status(403).json({
        message: 'Tidak memiliki akses ke data instansi lain.'
      });
    }

    const {
      kode_layanan,
      nama_layanan_prioritas,
      jenis_layanan,
      scope_layanan,
      kategori_layanan,
      pengguna_utama,
      jumlah_pengguna,
      target_ola,
      terkait_ekosistem,
      ekosistem_pemerintah_digital,
      deskripsi_ekosistem
    } = req.body;

    if (!existing.mkb_layanan_prioritas_id) {
      await connection.rollback();
      return res.status(409).json({
        message: 'Data lama masih memakai referensi layanan sebelumnya dan belum dapat diedit menggunakan format baru.'
      });
    }

    const kode = String(
      kode_layanan ?? existing.kode_layanan ?? ''
    ).trim().toUpperCase();

    const nama = String(
      nama_layanan_prioritas ?? existing.nama_layanan ?? ''
    ).trim();

    const jenis = String(
      jenis_layanan ?? existing.jenis_layanan ?? ''
    ).trim();

    const scope = String(
      scope_layanan ?? existing.scope_layanan ?? ''
    ).trim();

    const kategori = String(
      kategori_layanan ?? existing.kategori_layanan ?? ''
    ).trim();

    const pengguna = String(
      pengguna_utama ?? existing.pengguna_utama ?? ''
    ).trim();

    const target = String(
      target_ola ?? existing.target_ola ?? ''
    ).trim();

    const jumlah = Number(
      jumlah_pengguna ?? existing.jumlah_pengguna
    );

    const terkaitInput = terkait_ekosistem === undefined
      ? existing.terkait_ekosistem
      : terkait_ekosistem;

    const terkait = (
      terkaitInput === true ||
      terkaitInput === 1 ||
      terkaitInput === '1'
    ) ? 1 : 0;

    const ekosistem = terkait
      ? String(
          ekosistem_pemerintah_digital ??
          existing.ekosistem_pemerintah_digital ??
          ''
        ).trim()
      : null;

    const deskripsi = terkait
      ? String(
          deskripsi_ekosistem ??
          existing.deskripsi_ekosistem ??
          ''
        ).trim()
      : null;

    if (
      !kode || !nama || !jenis ||
      !scope || !kategori || !pengguna || !target
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Seluruh informasi wajib diisi.'
      });
    }

    if (
      kode.length > 60 ||
      nama.length > 200 ||
      jenis.length > 100 ||
      kategori.length > 100 ||
      pengguna.length > 150 ||
      target.length > 200
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Panjang salah satu isian melebihi batas.'
      });
    }

    if (
      !Number.isInteger(jumlah) ||
      jumlah < 0
    ) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Jumlah Pengguna tidak valid.'
      });
    }

    if (terkait && (!ekosistem || !deskripsi)) {
      await connection.rollback();
      return res.status(400).json({
        message: 'Nama dan deskripsi ekosistem wajib diisi.'
      });
    }

    await connection.query(
      `
      UPDATE mkb_layanan_prioritas
      SET
        kode_layanan = ?,
        nama_layanan = ?,
        jenis_layanan = ?
      WHERE id = ?
        AND instansi_id = ?
      `,
      [
        kode,
        nama,
        jenis,
        existing.mkb_layanan_prioritas_id,
        existing.instansi_id
      ]
    );

    await connection.query(
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
        scope,
        kategori,
        pengguna,
        jumlah,
        target,
        terkait,
        ekosistem,
        deskripsi,
        id
      ]
    );

    await connection.commit();

    return res.status(200).json({
      message: 'Ruang lingkup berhasil diperbarui.'
    });
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }

    console.error('updateRuangLingkup error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'ID Layanan Prioritas sudah digunakan.'
      });
    }

    return res.status(500).json({
      message: 'Gagal memperbarui ruang lingkup.'
    });
  } finally {
    if (connection) {
      connection.release();
    }
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

exports.getUserOptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        u.id,
        u.nama,
        u.email,
        u.role,
        u.pegawai_id,
        p.nip,
        p.jabatan
      FROM users u
      LEFT JOIN pegawai p ON p.id = u.pegawai_id
      ORDER BY u.nama ASC
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


exports.getUserOptionsForm13 = async (req, res) => {
  try {
    const userId = Number(req.user?.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(401).json({
        message: 'Sesi pengguna tidak valid.'
      });
    }

    const [akunRows] = await db.query(
      `
        SELECT id, role, instansi_id
        FROM users
        WHERE id = ?
        LIMIT 1
      `,
      [userId]
    );

    if (akunRows.length === 0) {
      return res.status(401).json({
        message: 'Akun pengguna tidak ditemukan.'
      });
    }

    const akun = akunRows[0];
    const isAdmin = akun.role === 'admin';

    if (!isAdmin && !akun.instansi_id) {
      return res.status(403).json({
        message: 'Akun belum memiliki instansi.'
      });
    }

    const params = [];
    let kondisi = '';

    if (!isAdmin) {
      kondisi = 'WHERE u.instansi_id = ?';
      params.push(akun.instansi_id);
    }

    const [rows] = await db.query(
      `
        SELECT
          u.id,
          u.nama,
          u.email,
          u.role,
          u.pegawai_id,
          u.instansi_id,
          p.nip,
          COALESCE(p.jabatan, u.jabatan) AS jabatan
        FROM users u
        LEFT JOIN pegawai p ON p.id = u.pegawai_id
        ${kondisi}
        ORDER BY u.nama ASC
      `,
      params
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getUserOptionsForm13 error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil daftar penanggung jawab.'
    });
  }
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

const timOperasionalSelectQuery = `
  SELECT
    top.id,
    top.layanan_prioritas_id,
    top.pegawai_id,
    top.peran_operasional,
    top.tanggung_jawab,
    top.urutan,
    top.created_by,
    top.created_at,
    top.updated_at,

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

  FROM mkb_tim_operasional top

  JOIN layanan_prioritas lp
    ON lp.id = top.layanan_prioritas_id

  JOIN layanan_digital ld
    ON ld.id = lp.layanan_id

  JOIN pegawai p
    ON p.id = top.pegawai_id

  JOIN unit_kerja uk
    ON uk.id = p.unit_kerja_id

  JOIN instansi i
    ON i.id = uk.instansi_id

  LEFT JOIN users u
    ON u.id = top.created_by
`;

const validateTimOperasionalInput = (
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
    peran_operasional,
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
      typeof peran_operasional !== 'string' ||
      !peran_operasional.trim()
    )
  ) {
    return {
      valid: false,
      message: 'peran_operasional wajib diisi.'
    };
  }

  if (
    peran_operasional !== undefined &&
    peran_operasional !== null &&
    typeof peran_operasional !== 'string'
  ) {
    return {
      valid: false,
      message: 'peran_operasional harus berupa teks.'
    };
  }

  if (
    typeof peran_operasional === 'string' &&
    peran_operasional.trim().length > 150
  ) {
    return {
      valid: false,
      message: 'peran_operasional maksimal 150 karakter.'
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

exports.getAllTimOperasional = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      ${timOperasionalSelectQuery}
      ORDER BY
        top.layanan_prioritas_id ASC,
        top.urutan IS NULL,
        top.urutan ASC,
        top.id ASC
      `
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getAllTimOperasional error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil data pelaksana operasional.'
    });
  }
};

exports.getTimOperasionalByLayananPrioritas = async (
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
      ${timOperasionalSelectQuery}
      WHERE top.layanan_prioritas_id = ?
      ORDER BY
        top.urutan IS NULL,
        top.urutan ASC,
        top.id ASC
      `,
      [Number(id)]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error(
      'getTimOperasionalByLayananPrioritas error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil pelaksana operasional.'
    });
  }
};

exports.getTimOperasionalById = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID pelaksana operasional tidak valid.'
    });
  }

  try {
    const [rows] = await db.query(
      `
      ${timOperasionalSelectQuery}
      WHERE top.id = ?
      LIMIT 1
      `,
      [Number(id)]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana operasional tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'getTimOperasionalById error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat mengambil detail pelaksana operasional.'
    });
  }
};

exports.createTimOperasional = async (req, res) => {
  const {
    layanan_prioritas_id,
    pegawai_id,
    peran_operasional,
    tanggung_jawab,
    urutan
  } = req.body;

  const validation = validateTimOperasionalInput(
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
      FROM mkb_tim_operasional
      WHERE layanan_prioritas_id = ?
        AND pegawai_id = ?
        AND peran_operasional = ?
      LIMIT 1
      `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_operasional.trim()
      ]
    );

    if (existingRows.length > 0) {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana operasional.'
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO mkb_tim_operasional (
        layanan_prioritas_id,
        pegawai_id,
        peran_operasional,
        tanggung_jawab,
        urutan,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        Number(layanan_prioritas_id),
        Number(pegawai_id),
        peran_operasional.trim(),
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
      ${timOperasionalSelectQuery}
      WHERE top.id = ?
      LIMIT 1
      `,
      [result.insertId]
    );

    return res.status(201).json({
      message:
        'Pelaksana operasional berhasil disimpan.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'createTimOperasional error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana operasional.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menyimpan pelaksana operasional.'
    });
  }
};

exports.updateTimOperasional = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID pelaksana operasional tidak valid.'
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

  const validation = validateTimOperasionalInput(
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
      FROM mkb_tim_operasional
      WHERE id = ?
      LIMIT 1
      `,
      [Number(id)]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana operasional tidak ditemukan.'
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
      req.body.peran_operasional !== undefined
        ? (
            typeof req.body.peran_operasional === 'string'
              ? req.body.peran_operasional.trim()
              : ''
          )
        : existing.peran_operasional;

    if (!peranBaru) {
      return res.status(400).json({
        message: 'peran_operasional wajib diisi.'
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
      FROM mkb_tim_operasional
      WHERE layanan_prioritas_id = ?
        AND pegawai_id = ?
        AND peran_operasional = ?
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
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana operasional.'
      });
    }

    await db.query(
      `
      UPDATE mkb_tim_operasional
      SET
        pegawai_id = ?,
        peran_operasional = ?,
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
      ${timOperasionalSelectQuery}
      WHERE top.id = ?
      LIMIT 1
      `,
      [Number(id)]
    );

    return res.status(200).json({
      message:
        'Pelaksana operasional berhasil diperbarui.',
      data: rows[0]
    });
  } catch (error) {
    console.error(
      'updateTimOperasional error:',
      error
    );

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message:
          'Pegawai dengan peran tersebut sudah terdaftar sebagai pelaksana operasional.'
      });
    }

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat memperbarui pelaksana operasional.'
    });
  }
};

exports.deleteTimOperasional = async (req, res) => {
  const { id } = req.params;

  if (!isPositiveInteger(id)) {
    return res.status(400).json({
      message: 'ID pelaksana operasional tidak valid.'
    });
  }

  try {
    const [result] = await db.query(
      `
      DELETE FROM mkb_tim_operasional
      WHERE id = ?
      `,
      [Number(id)]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message:
          'Data pelaksana operasional tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message:
        'Pelaksana operasional berhasil dihapus.'
    });
  } catch (error) {
    console.error(
      'deleteTimOperasional error:',
      error
    );

    return res.status(500).json({
      message:
        'Terjadi kesalahan saat menghapus pelaksana operasional.'
    });
  }
};

const rencanaKomunikasiSelectQuery = `
  SELECT
    rk.id,
    rk.layanan_prioritas_id,
    rk.mkb_layanan_prioritas_id,
    rk.informasi_disampaikan,
    rk.kategori_komunikasi,
    rk.pengirim,
    rk.penerima,
    rk.media_komunikasi,
    rk.waktu_frekuensi,
    rk.aktivitas,
    rk.tujuan,
    rk.created_by,
    rk.created_at,
    rk.updated_at,
    ml.kode_layanan AS kode_prioritas,
    ml.kode_layanan,
    ml.nama_layanan,
    ml.jenis_layanan,
    ml.instansi_id,
    i.kode_instansi,
    i.nama_instansi,
    u.nama AS dibuat_oleh
  FROM mkb_rencana_komunikasi rk
  JOIN mkb_layanan_prioritas ml
    ON ml.id = rk.mkb_layanan_prioritas_id
  JOIN instansi i
    ON i.id = ml.instansi_id
  LEFT JOIN users u
    ON u.id = rk.created_by
`;

const validasiRencanaKomunikasiMkb = (body) => {
  const data = {
    mkb_layanan_prioritas_id: Number(body.mkb_layanan_prioritas_id),
    informasi_disampaikan: String(body.informasi_disampaikan || '').trim(),
    kategori_komunikasi: String(body.kategori_komunikasi || '').trim(),
    pengirim: String(body.pengirim || '').trim(),
    penerima: String(body.penerima || '').trim(),
    media_komunikasi: String(body.media_komunikasi || '').trim(),
    waktu_frekuensi: String(body.waktu_frekuensi || '').trim() || null,
    aktivitas: String(body.aktivitas || '').trim() || null,
    tujuan: String(body.tujuan || '').trim() || null
  };

  if (
    !Number.isInteger(data.mkb_layanan_prioritas_id) ||
    data.mkb_layanan_prioritas_id <= 0
  ) {
    return { error: 'Layanan Prioritas wajib dipilih.' };
  }

  if (
    !data.informasi_disampaikan ||
    !data.kategori_komunikasi ||
    !data.pengirim ||
    !data.penerima ||
    !data.media_komunikasi
  ) {
    return {
      error: 'Informasi, Kategori Komunikasi, Pengirim, Penerima, dan Media Komunikasi wajib diisi.'
    };
  }

  if (
    data.kategori_komunikasi.length > 150 ||
    data.pengirim.length > 200 ||
    data.penerima.length > 200 ||
    data.media_komunikasi.length > 200 ||
    (data.waktu_frekuensi && data.waktu_frekuensi.length > 200)
  ) {
    return {
      error: 'Panjang salah satu isian melebihi batas.'
    };
  }

  return { data };
};

const getRencanaKomunikasiMkbAccess = async (req, id) => {
  const instansiId = await getMkbInstansiId(req);

  const [rows] = await db.query(
    `
    ${rencanaKomunikasiSelectQuery}
    WHERE rk.id = ?
      AND (? IS NULL OR ml.instansi_id = ?)
    LIMIT 1
    `,
    [id, instansiId, instansiId]
  );

  return rows[0] || null;
};

const cekLayananKomunikasiMkb = async (req, layananId) => {
  const instansiId = await getMkbInstansiId(req);

  const [rows] = await db.query(
    `
    SELECT id
    FROM mkb_layanan_prioritas
    WHERE id = ?
      AND (? IS NULL OR instansi_id = ?)
    LIMIT 1
    `,
    [layananId, instansiId, instansiId]
  );

  return rows.length > 0;
};

exports.getAllRencanaKomunikasi = async (req, res) => {
  try {
    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      `
      ${rencanaKomunikasiSelectQuery}
      WHERE (? IS NULL OR ml.instansi_id = ?)
      ORDER BY rk.id DESC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getAllRencanaKomunikasi error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil rencana komunikasi.'
    });
  }
};

exports.getRencanaKomunikasiByLayananPrioritas = async (req, res) => {
  try {
    const layananId = Number(req.params.id);

    if (!Number.isInteger(layananId) || layananId <= 0) {
      return res.status(400).json({
        message: 'ID layanan tidak valid.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      `
      ${rencanaKomunikasiSelectQuery}
      WHERE rk.mkb_layanan_prioritas_id = ?
        AND (? IS NULL OR ml.instansi_id = ?)
      ORDER BY rk.id DESC
      `,
      [layananId, instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getRencanaKomunikasiByLayananPrioritas error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil rencana komunikasi layanan.'
    });
  }
};

exports.getRencanaKomunikasiById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID rencana komunikasi tidak valid.'
      });
    }

    const data = await getRencanaKomunikasiMkbAccess(req, id);

    if (!data) {
      return res.status(404).json({
        message: 'Rencana komunikasi tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data
    });
  } catch (error) {
    console.error('getRencanaKomunikasiById error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil detail rencana komunikasi.'
    });
  }
};

exports.createRencanaKomunikasi = async (req, res) => {
  try {
    const hasil = validasiRencanaKomunikasiMkb(req.body);

    if (hasil.error) {
      return res.status(400).json({
        message: hasil.error
      });
    }

    const data = hasil.data;

    const layananValid = await cekLayananKomunikasiMkb(
      req,
      data.mkb_layanan_prioritas_id
    );

    if (!layananValid) {
      return res.status(404).json({
        message: 'Layanan Prioritas MKB tidak ditemukan pada instansi kamu.'
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO mkb_rencana_komunikasi
      (
        layanan_prioritas_id,
        mkb_layanan_prioritas_id,
        informasi_disampaikan,
        kategori_komunikasi,
        pengirim,
        penerima,
        media_komunikasi,
        waktu_frekuensi,
        aktivitas,
        tujuan,
        created_by
      )
      VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.mkb_layanan_prioritas_id,
        data.informasi_disampaikan,
        data.kategori_komunikasi,
        data.pengirim,
        data.penerima,
        data.media_komunikasi,
        data.waktu_frekuensi,
        data.aktivitas,
        data.tujuan,
        req.user.id
      ]
    );

    const created = await getRencanaKomunikasiMkbAccess(
      req,
      result.insertId
    );

    return res.status(201).json({
      message: 'Rencana komunikasi berhasil ditambahkan.',
      data: created
    });
  } catch (error) {
    console.error('createRencanaKomunikasi error:', error);

    return res.status(500).json({
      message: 'Gagal menambahkan rencana komunikasi.'
    });
  }
};

exports.updateRencanaKomunikasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID rencana komunikasi tidak valid.'
      });
    }

    const existing = await getRencanaKomunikasiMkbAccess(req, id);

    if (!existing) {
      return res.status(404).json({
        message: 'Rencana komunikasi tidak ditemukan.'
      });
    }

    const hasil = validasiRencanaKomunikasiMkb({
      mkb_layanan_prioritas_id:
        req.body.mkb_layanan_prioritas_id ??
        existing.mkb_layanan_prioritas_id,
      informasi_disampaikan:
        req.body.informasi_disampaikan ??
        existing.informasi_disampaikan,
      kategori_komunikasi:
        req.body.kategori_komunikasi ??
        existing.kategori_komunikasi,
      pengirim: req.body.pengirim ?? existing.pengirim,
      penerima: req.body.penerima ?? existing.penerima,
      media_komunikasi:
        req.body.media_komunikasi ??
        existing.media_komunikasi,
      waktu_frekuensi:
        req.body.waktu_frekuensi !== undefined
          ? req.body.waktu_frekuensi
          : existing.waktu_frekuensi,
      aktivitas:
        req.body.aktivitas !== undefined
          ? req.body.aktivitas
          : existing.aktivitas,
      tujuan:
        req.body.tujuan !== undefined
          ? req.body.tujuan
          : existing.tujuan
    });

    if (hasil.error) {
      return res.status(400).json({
        message: hasil.error
      });
    }

    const data = hasil.data;

    const layananValid = await cekLayananKomunikasiMkb(
      req,
      data.mkb_layanan_prioritas_id
    );

    if (!layananValid) {
      return res.status(404).json({
        message: 'Layanan Prioritas MKB tidak ditemukan pada instansi kamu.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [result] = await db.query(
      `
      UPDATE mkb_rencana_komunikasi rk
      JOIN mkb_layanan_prioritas ml
        ON ml.id = rk.mkb_layanan_prioritas_id
      SET
        rk.mkb_layanan_prioritas_id = ?,
        rk.informasi_disampaikan = ?,
        rk.kategori_komunikasi = ?,
        rk.pengirim = ?,
        rk.penerima = ?,
        rk.media_komunikasi = ?,
        rk.waktu_frekuensi = ?,
        rk.aktivitas = ?,
        rk.tujuan = ?
      WHERE rk.id = ?
        AND (? IS NULL OR ml.instansi_id = ?)
      `,
      [
        data.mkb_layanan_prioritas_id,
        data.informasi_disampaikan,
        data.kategori_komunikasi,
        data.pengirim,
        data.penerima,
        data.media_komunikasi,
        data.waktu_frekuensi,
        data.aktivitas,
        data.tujuan,
        id,
        instansiId,
        instansiId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Rencana komunikasi tidak ditemukan.'
      });
    }

    const updated = await getRencanaKomunikasiMkbAccess(req, id);

    return res.status(200).json({
      message: 'Rencana komunikasi berhasil diperbarui.',
      data: updated
    });
  } catch (error) {
    console.error('updateRencanaKomunikasi error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui rencana komunikasi.'
    });
  }
};

exports.deleteRencanaKomunikasi = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID rencana komunikasi tidak valid.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [result] = await db.query(
      `
      DELETE rk
      FROM mkb_rencana_komunikasi rk
      JOIN mkb_layanan_prioritas ml
        ON ml.id = rk.mkb_layanan_prioritas_id
      WHERE rk.id = ?
        AND (? IS NULL OR ml.instansi_id = ?)
      `,
      [id, instansiId, instansiId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Rencana komunikasi tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message: 'Rencana komunikasi berhasil dihapus.'
    });
  } catch (error) {
    console.error('deleteRencanaKomunikasi error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus rencana komunikasi.'
    });
  }
};

const daftarKontakSelectQuery = `
  SELECT
    dk.id,
    dk.layanan_prioritas_id,
    dk.mkb_layanan_prioritas_id,
    dk.nama,
    dk.jabatan,
    dk.organisasi,
    dk.alamat,
    dk.telepon,
    dk.email,
    dk.created_by,
    dk.created_at,
    dk.updated_at,
    ml.kode_layanan AS kode_prioritas,
    ml.kode_layanan,
    ml.nama_layanan,
    ml.jenis_layanan,
    ml.instansi_id,
    i.kode_instansi,
    i.nama_instansi,
    u.nama AS dibuat_oleh
  FROM mkb_daftar_kontak dk
  JOIN mkb_layanan_prioritas ml
    ON ml.id = dk.mkb_layanan_prioritas_id
  JOIN instansi i
    ON i.id = ml.instansi_id
  LEFT JOIN users u
    ON u.id = dk.created_by
`;

const validasiDaftarKontakMkb = (body) => {
  const data = {
    mkb_layanan_prioritas_id: Number(body.mkb_layanan_prioritas_id),
    nama: String(body.nama ?? '').trim(),
    jabatan: String(body.jabatan ?? '').trim() || null,
    organisasi: String(body.organisasi ?? '').trim() || null,
    alamat: String(body.alamat ?? '').trim() || null,
    telepon: String(body.telepon ?? '').trim() || null,
    email: String(body.email ?? '').trim() || null
  };

  if (
    !Number.isInteger(data.mkb_layanan_prioritas_id) ||
    data.mkb_layanan_prioritas_id <= 0
  ) {
    return {
      error: 'ID Layanan Prioritas wajib dipilih.'
    };
  }

  if (!data.nama) {
    return {
      error: 'Nama kontak wajib diisi.'
    };
  }

  if (data.nama.length > 200) {
    return {
      error: 'Nama kontak maksimal 200 karakter.'
    };
  }

  if (data.jabatan && data.jabatan.length > 200) {
    return {
      error: 'Jabatan maksimal 200 karakter.'
    };
  }

  if (data.organisasi && data.organisasi.length > 200) {
    return {
      error: 'Organisasi maksimal 200 karakter.'
    };
  }

  if (data.telepon && data.telepon.length > 100) {
    return {
      error: 'Nomor telepon maksimal 100 karakter.'
    };
  }

  if (data.email && data.email.length > 200) {
    return {
      error: 'Email maksimal 200 karakter.'
    };
  }

  if (
    data.email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)
  ) {
    return {
      error: 'Format email tidak valid.'
    };
  }

  return { data };
};

const getDaftarKontakMkbAccess = async (req, id) => {
  const instansiId = await getMkbInstansiId(req);

  const [rows] = await db.query(
    `
      ${daftarKontakSelectQuery}
      WHERE dk.id = ?
        AND (? IS NULL OR ml.instansi_id = ?)
      LIMIT 1
    `,
    [id, instansiId, instansiId]
  );

  return rows[0] || null;
};

const cekLayananKontakMkb = async (req, layananId) => {
  const instansiId = await getMkbInstansiId(req);

  const [rows] = await db.query(
    `
      SELECT id
      FROM mkb_layanan_prioritas
      WHERE id = ?
        AND (? IS NULL OR instansi_id = ?)
      LIMIT 1
    `,
    [layananId, instansiId, instansiId]
  );

  return rows.length > 0;
};

exports.getAllDaftarKontak = async (req, res) => {
  try {
    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      `
        ${daftarKontakSelectQuery}
        WHERE (? IS NULL OR ml.instansi_id = ?)
        ORDER BY dk.id DESC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getAllDaftarKontak error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil daftar kontak.'
    });
  }
};

exports.getDaftarKontakByLayananPrioritas = async (req, res) => {
  try {
    const layananId = Number(req.params.id);

    if (!Number.isInteger(layananId) || layananId <= 0) {
      return res.status(400).json({
        message: 'ID Layanan Prioritas tidak valid.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      `
        ${daftarKontakSelectQuery}
        WHERE dk.mkb_layanan_prioritas_id = ?
          AND (? IS NULL OR ml.instansi_id = ?)
        ORDER BY dk.nama ASC, dk.id ASC
      `,
      [layananId, instansiId, instansiId]
    );

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getDaftarKontakByLayananPrioritas error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil daftar kontak layanan.'
    });
  }
};

exports.getDaftarKontakById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID daftar kontak tidak valid.'
      });
    }

    const data = await getDaftarKontakMkbAccess(req, id);

    if (!data) {
      return res.status(404).json({
        message: 'Daftar kontak tidak ditemukan.'
      });
    }

    return res.status(200).json({
      data
    });
  } catch (error) {
    console.error('getDaftarKontakById error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil detail kontak.'
    });
  }
};

exports.createDaftarKontak = async (req, res) => {
  try {
    const hasil = validasiDaftarKontakMkb(req.body);

    if (hasil.error) {
      return res.status(400).json({
        message: hasil.error
      });
    }

    const data = hasil.data;

    const layananValid = await cekLayananKontakMkb(
      req,
      data.mkb_layanan_prioritas_id
    );

    if (!layananValid) {
      return res.status(404).json({
        message: 'Layanan Prioritas MKB tidak ditemukan pada instansi kamu.'
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO mkb_daftar_kontak
        (
          layanan_prioritas_id,
          mkb_layanan_prioritas_id,
          nama,
          jabatan,
          organisasi,
          alamat,
          telepon,
          email,
          created_by
        )
        VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.mkb_layanan_prioritas_id,
        data.nama,
        data.jabatan,
        data.organisasi,
        data.alamat,
        data.telepon,
        data.email,
        req.user.id
      ]
    );

    const created = await getDaftarKontakMkbAccess(
      req,
      result.insertId
    );

    return res.status(201).json({
      message: 'Daftar kontak berhasil ditambahkan.',
      data: created
    });
  } catch (error) {
    console.error('createDaftarKontak error:', error);

    return res.status(500).json({
      message: 'Gagal menambahkan daftar kontak.'
    });
  }
};

exports.updateDaftarKontak = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID daftar kontak tidak valid.'
      });
    }

    const existing = await getDaftarKontakMkbAccess(req, id);

    if (!existing) {
      return res.status(404).json({
        message: 'Daftar kontak tidak ditemukan.'
      });
    }

    const hasil = validasiDaftarKontakMkb({
      mkb_layanan_prioritas_id:
        req.body.mkb_layanan_prioritas_id ??
        existing.mkb_layanan_prioritas_id,
      nama: req.body.nama ?? existing.nama,
      jabatan:
        req.body.jabatan !== undefined
          ? req.body.jabatan
          : existing.jabatan,
      organisasi:
        req.body.organisasi !== undefined
          ? req.body.organisasi
          : existing.organisasi,
      alamat:
        req.body.alamat !== undefined
          ? req.body.alamat
          : existing.alamat,
      telepon:
        req.body.telepon !== undefined
          ? req.body.telepon
          : existing.telepon,
      email:
        req.body.email !== undefined
          ? req.body.email
          : existing.email
    });

    if (hasil.error) {
      return res.status(400).json({
        message: hasil.error
      });
    }

    const data = hasil.data;

    const layananValid = await cekLayananKontakMkb(
      req,
      data.mkb_layanan_prioritas_id
    );

    if (!layananValid) {
      return res.status(404).json({
        message: 'Layanan Prioritas MKB tidak ditemukan pada instansi kamu.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [result] = await db.query(
      `
        UPDATE mkb_daftar_kontak dk
        JOIN mkb_layanan_prioritas ml
          ON ml.id = dk.mkb_layanan_prioritas_id
        SET
          dk.mkb_layanan_prioritas_id = ?,
          dk.nama = ?,
          dk.jabatan = ?,
          dk.organisasi = ?,
          dk.alamat = ?,
          dk.telepon = ?,
          dk.email = ?
        WHERE dk.id = ?
          AND (? IS NULL OR ml.instansi_id = ?)
      `,
      [
        data.mkb_layanan_prioritas_id,
        data.nama,
        data.jabatan,
        data.organisasi,
        data.alamat,
        data.telepon,
        data.email,
        id,
        instansiId,
        instansiId
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Daftar kontak tidak ditemukan.'
      });
    }

    const updated = await getDaftarKontakMkbAccess(req, id);

    return res.status(200).json({
      message: 'Daftar kontak berhasil diperbarui.',
      data: updated
    });
  } catch (error) {
    console.error('updateDaftarKontak error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui daftar kontak.'
    });
  }
};

exports.deleteDaftarKontak = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID daftar kontak tidak valid.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [result] = await db.query(
      `
        DELETE dk
        FROM mkb_daftar_kontak dk
        JOIN mkb_layanan_prioritas ml
          ON ml.id = dk.mkb_layanan_prioritas_id
        WHERE dk.id = ?
          AND (? IS NULL OR ml.instansi_id = ?)
      `,
      [id, instansiId, instansiId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Daftar kontak tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message: 'Daftar kontak berhasil dihapus.'
    });
  } catch (error) {
    console.error('deleteDaftarKontak error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus daftar kontak.'
    });
  }
};


const form8Config = {
  SumberDayaManusia: {
    table: 'mkb_sumber_daya_manusia',
    alias: 'sdm',
    name: 'Sumber daya manusia',
    fields: [
      'kebutuhan_personel',
      'jumlah_minimum',
      'kompetensi',
      'sumber_penyedia_sdm',
      'personel_pengganti',
      'keterangan'
    ],
    required: ['kebutuhan_personel']
  },
  FasilitasOperasional: {
    table: 'mkb_fasilitas_operasional',
    alias: 'fo',
    name: 'Fasilitas operasional',
    fields: [
      'nama_fasilitas',
      'jenis_fasilitas',
      'jumlah_minimum',
      'lokasi',
      'fungsi',
      'alternatif',
      'keterangan'
    ],
    required: ['nama_fasilitas']
  },
  SumberDayaTik: {
    table: 'mkb_sumber_daya_tik',
    alias: 'sdt',
    name: 'Sumber daya TIK',
    fields: [
      'jenis_sumber_daya',
      'nama_sumber_daya',
      'jumlah_minimum',
      'spesifikasi',
      'lokasi',
      'sumber_cadangan',
      'keterangan'
    ],
    required: ['jenis_sumber_daya', 'nama_sumber_daya']
  },
  AksesSistemTik: {
    table: 'mkb_akses_sistem_tik',
    alias: 'ast',
    name: 'Akses sistem TIK',
    fields: [
      'nama_sistem',
      'jenis_sistem',
      'jenis_akses',
      'personel_berwenang',
      'mekanisme_akses',
      'akses_darurat',
      'keterangan'
    ],
    required: ['nama_sistem', 'jenis_akses']
  },
  SumberDayaEksternalTik: {
    table: 'mkb_sumber_daya_eksternal_tik',
    alias: 'setik',
    name: 'Sumber daya eksternal TIK',
    fields: [
      'nama_vendor_mitra',
      'jenis_sumber_daya',
      'deskripsi_sumber_daya',
      'kontak_dukungan',
      'mekanisme_aktivasi',
      'alternatif_penyedia',
      'keterangan'
    ],
    required: ['nama_vendor_mitra', 'jenis_sumber_daya']
  }
};

const form8Select = (config) => {
  const a = config.alias;

  return `
    SELECT
      ${a}.*,
      ml.kode_layanan AS kode_prioritas,
      ml.kode_layanan,
      ml.nama_layanan,
      ml.jenis_layanan,
      ml.instansi_id,
      i.kode_instansi,
      i.nama_instansi
    FROM ${config.table} ${a}
    JOIN mkb_layanan_prioritas ml
      ON ml.id = ${a}.mkb_layanan_prioritas_id
    JOIN instansi i
      ON i.id = ml.instansi_id
  `;
};

const form8Validate = (body, config) => {
  const layananId = Number(body.mkb_layanan_prioritas_id);

  if (!Number.isInteger(layananId) || layananId <= 0) {
    return { error: 'ID Layanan Prioritas wajib dipilih.' };
  }

  const values = {};

  for (const field of config.fields) {
    const value = body[field];

    if (field === 'jumlah_minimum') {
      if (value === undefined || value === null || value === '') {
        values[field] = null;
      } else {
        const number = Number(value);

        if (!Number.isInteger(number) || number < 0) {
          return {
            error: 'Jumlah Minimum harus berupa bilangan bulat minimal 0.'
          };
        }

        values[field] = number;
      }
    } else {
      if (
        value !== undefined &&
        value !== null &&
        typeof value !== 'string'
      ) {
        return { error: `${field} harus berupa teks.` };
      }

      values[field] = String(value ?? '').trim() || null;
    }
  }

  for (const field of config.required) {
    if (!values[field]) {
      return {
        error: `${field.replace(/_/g, ' ')} wajib diisi.`
      };
    }
  }

  return {
    data: {
      mkb_layanan_prioritas_id: layananId,
      ...values
    }
  };
};

const form8CheckLayanan = async (req, layananId) => {
  const instansiId = await getMkbInstansiId(req);

  const [rows] = await db.query(
    `
      SELECT id
      FROM mkb_layanan_prioritas
      WHERE id = ?
        AND (? IS NULL OR instansi_id = ?)
      LIMIT 1
    `,
    [layananId, instansiId, instansiId]
  );

  return rows.length > 0;
};

const form8Read = async (req, config, id = null, layananId = null) => {
  const instansiId = await getMkbInstansiId(req);
  const conditions = ['(? IS NULL OR ml.instansi_id = ?)'];
  const params = [instansiId, instansiId];

  if (id !== null) {
    conditions.push(`${config.alias}.id = ?`);
    params.push(id);
  }

  if (layananId !== null) {
    conditions.push(`${config.alias}.mkb_layanan_prioritas_id = ?`);
    params.push(layananId);
  }

  const [rows] = await db.query(
    `
      ${form8Select(config)}
      WHERE ${conditions.join(' AND ')}
      ORDER BY ${config.alias}.id DESC
    `,
    params
  );

  return rows;
};

const form8RespondError = (res, error, action) => {
  console.error(`Formulir 8 ${action}:`, error);

  if (
    error.message === 'INSTANSI_AKUN_KOSONG' ||
    error.message === 'INSTANSI_AKUN_TIDAK_DITEMUKAN'
  ) {
    return res.status(403).json({
      message: 'Instansi akun tidak valid.'
    });
  }

  return res.status(500).json({
    message: `Gagal ${action} data Formulir 8.`
  });
};

for (const [name, config] of Object.entries(form8Config)) {
  exports[`getAll${name}`] = async (req, res) => {
    try {
      const rows = await form8Read(req, config);
      return res.status(200).json({ data: rows });
    } catch (error) {
      return form8RespondError(res, error, 'mengambil');
    }
  };

  exports[`get${name}ById`] = async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID tidak valid.' });
    }

    try {
      const rows = await form8Read(req, config, id);

      if (!rows.length) {
        return res.status(404).json({
          message: `${config.name} tidak ditemukan.`
        });
      }

      return res.status(200).json({ data: rows[0] });
    } catch (error) {
      return form8RespondError(res, error, 'mengambil');
    }
  };

  exports[`get${name}ByLayananPrioritas`] = async (req, res) => {
    const layananId = Number(req.params.id);

    if (!Number.isInteger(layananId) || layananId <= 0) {
      return res.status(400).json({
        message: 'ID Layanan Prioritas tidak valid.'
      });
    }

    try {
      const rows = await form8Read(req, config, null, layananId);
      return res.status(200).json({ data: rows });
    } catch (error) {
      return form8RespondError(res, error, 'mengambil');
    }
  };

  exports[`create${name}`] = async (req, res) => {
    const validated = form8Validate(req.body, config);

    if (validated.error) {
      return res.status(400).json({
        message: validated.error
      });
    }

    try {
      const input = validated.data;

      if (!await form8CheckLayanan(
        req,
        input.mkb_layanan_prioritas_id
      )) {
        return res.status(404).json({
          message: 'Layanan Prioritas MKB tidak ditemukan pada instansi kamu.'
        });
      }

      const columns = [
        'layanan_prioritas_id',
        'mkb_layanan_prioritas_id',
        ...config.fields,
        'created_by'
      ];

      const values = [
        null,
        input.mkb_layanan_prioritas_id,
        ...config.fields.map((field) => input[field]),
        req.user.id
      ];

      const [result] = await db.query(
        `
          INSERT INTO ${config.table}
          (${columns.join(', ')})
          VALUES (${columns.map(() => '?').join(', ')})
        `,
        values
      );

      const rows = await form8Read(req, config, result.insertId);

      return res.status(201).json({
        message: `${config.name} berhasil ditambahkan.`,
        data: rows[0]
      });
    } catch (error) {
      return form8RespondError(res, error, 'menyimpan');
    }
  };

  exports[`update${name}`] = async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID tidak valid.' });
    }

    try {
      const existingRows = await form8Read(req, config, id);

      if (!existingRows.length) {
        return res.status(404).json({
          message: `${config.name} tidak ditemukan.`
        });
      }

      const existing = existingRows[0];

      const validated = form8Validate(
        {
          ...existing,
          ...req.body,
          mkb_layanan_prioritas_id:
            req.body.mkb_layanan_prioritas_id ??
            existing.mkb_layanan_prioritas_id
        },
        config
      );

      if (validated.error) {
        return res.status(400).json({
          message: validated.error
        });
      }

      const input = validated.data;

      if (!await form8CheckLayanan(
        req,
        input.mkb_layanan_prioritas_id
      )) {
        return res.status(404).json({
          message: 'Layanan Prioritas MKB tidak ditemukan pada instansi kamu.'
        });
      }

      const instansiId = await getMkbInstansiId(req);

      const updateFields = [
        'mkb_layanan_prioritas_id',
        ...config.fields
      ];

      const [result] = await db.query(
        `
          UPDATE ${config.table} t
          JOIN mkb_layanan_prioritas ml
            ON ml.id = t.mkb_layanan_prioritas_id
          SET ${updateFields.map(
            (field) => `t.${field} = ?`
          ).join(', ')}
          WHERE t.id = ?
            AND (? IS NULL OR ml.instansi_id = ?)
        `,
        [
          ...updateFields.map((field) => input[field]),
          id,
          instansiId,
          instansiId
        ]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          message: `${config.name} tidak ditemukan.`
        });
      }

      const rows = await form8Read(req, config, id);

      return res.status(200).json({
        message: `${config.name} berhasil diperbarui.`,
        data: rows[0]
      });
    } catch (error) {
      return form8RespondError(res, error, 'memperbarui');
    }
  };

  exports[`delete${name}`] = async (req, res) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ message: 'ID tidak valid.' });
    }

    try {
      const instansiId = await getMkbInstansiId(req);

      const [result] = await db.query(
        `
          DELETE t
          FROM ${config.table} t
          JOIN mkb_layanan_prioritas ml
            ON ml.id = t.mkb_layanan_prioritas_id
          WHERE t.id = ?
            AND (? IS NULL OR ml.instansi_id = ?)
        `,
        [id, instansiId, instansiId]
      );

      if (!result.affectedRows) {
        return res.status(404).json({
          message: `${config.name} tidak ditemukan.`
        });
      }

      return res.status(200).json({
        message: `${config.name} berhasil dihapus.`
      });
    } catch (error) {
      return form8RespondError(res, error, 'menghapus');
    }
  };
}

// =====================================================
// PROSES 2 - BUSINESS IMPACT ANALYSIS (BIA)
// =====================================================

const biaSelectQuery = `
  SELECT b.*, b.mkb_layanan_prioritas_id,
    COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,
    COALESCE(ml.kode_layanan, ld.kode_layanan) AS kode_layanan,
    COALESCE(ml.nama_layanan, ld.nama_layanan) AS nama_layanan,
    COALESCE(ml.jenis_layanan, ld.jenis_layanan) AS jenis_layanan,
    ld.id AS layanan_id,
    ld.deskripsi AS deskripsi_layanan,
    lp.alasan_prioritas, lp.membutuhkan_mkb, lp.pic_id,
    lp.target_penyusunan, lp.status AS status_layanan_prioritas,
    COALESCE(ml.instansi_id, ld.instansi_id) AS instansi_id,
    inst.nama_instansi
  FROM mkb_bia b
  LEFT JOIN mkb_layanan_prioritas ml ON ml.id = b.mkb_layanan_prioritas_id
  LEFT JOIN layanan_prioritas lp ON lp.id = b.layanan_prioritas_id
  LEFT JOIN layanan_digital ld ON ld.id = lp.layanan_id
  JOIN instansi inst ON inst.id = COALESCE(ml.instansi_id, ld.instansi_id)
`;

const biaFields = ['dampak_operasional','ketergantungan_pengguna','solusi_alternatif','ketergantungan_antar_sistem','tingkat_kritikalitas','mekanisme_keberlangsungan','mtpd','rto','rpo','mbco'];

const biaValidate = (body) => {
  const values = {};
  for (const field of biaFields) {
    const value = body[field];
    if (['mtpd','rto','rpo'].includes(field)) {
      if (value === undefined || value === null || value === '') values[field] = null;
      else if (!Number.isInteger(Number(value)) || Number(value) < 0) return { error: `${field.toUpperCase()} harus bilangan bulat minimal 0.` };
      else values[field] = Number(value);
    } else {
      if (value != null && typeof value !== 'string') return { error: `${field} harus berupa teks.` };
      values[field] = String(value ?? '').trim() || null;
    }
  }
  if (values.tingkat_kritikalitas && !['Tinggi','Menengah','Rendah'].includes(values.tingkat_kritikalitas)) return {error:'Tingkat kritikalitas tidak valid.'};
  if (values.mekanisme_keberlangsungan && !['BCP','DRP'].includes(values.mekanisme_keberlangsungan)) return {error:'Mekanisme harus BCP atau DRP.'};
  return {values};
};

const biaRead = async (req, id = null, layananId = null) => {
  const instansiId = await getMkbInstansiId(req);
  const conditions = ['(? IS NULL OR COALESCE(ml.instansi_id, ld.instansi_id) = ?)'];
  const params = [instansiId, instansiId];
  if (id !== null) { conditions.push('b.id = ?'); params.push(id); }
  if (layananId !== null) { conditions.push('b.mkb_layanan_prioritas_id = ?'); params.push(layananId); }
  const [rows] = await db.query(`${biaSelectQuery} WHERE ${conditions.join(' AND ')} ORDER BY b.id DESC`,params);
  return rows;
};

const biaFail = (res,error) => {
  console.error('BIA error:',error);
  if (['INSTANSI_AKUN_KOSONG','INSTANSI_AKUN_TIDAK_DITEMUKAN'].includes(error.message)) return res.status(403).json({message:'Instansi akun tidak valid.'});
  return res.status(500).json({message:'Gagal memproses BIA.'});
};

exports.getAllBia = async (req,res) => {
  try { return res.json({data:await biaRead(req)}); }
  catch(error){return biaFail(res,error);}
};

exports.getBiaById = async (req,res) => {
  const id=Number(req.params.id);
  if(!Number.isInteger(id)||id<=0)return res.status(400).json({message:'ID BIA tidak valid.'});
  try { const rows=await biaRead(req,id); return rows.length?res.json({data:rows[0]}):res.status(404).json({message:'Data tidak ditemukan.'}); }
  catch(error){return biaFail(res,error);}
};

exports.getBiaByLayananPrioritas = async (req,res) => {
  const id=Number(req.params.id);
  if(!Number.isInteger(id)||id<=0)return res.status(400).json({message:'ID layanan tidak valid.'});
  try { const rows=await biaRead(req,null,id); return res.json({data:rows[0]||null}); }
  catch(error){return biaFail(res,error);}
};

exports.createBia = async (req,res) => {
  const mkbId=Number(req.body.mkb_layanan_prioritas_id);
  if(!Number.isInteger(mkbId)||mkbId<=0)return res.status(400).json({message:'Pilih Layanan Prioritas MKB.'});
  const parsed=biaValidate(req.body);
  if(parsed.error)return res.status(400).json({message:parsed.error});
  try {
    const instansiId=await getMkbInstansiId(req);
    const [layanan]=await db.query('SELECT id FROM mkb_layanan_prioritas WHERE id=? AND (? IS NULL OR instansi_id=?)',[mkbId,instansiId,instansiId]);
    if(!layanan.length)return res.status(404).json({message:'Layanan MKB tidak ditemukan pada instansi kamu.'});
    const [existing]=await db.query('SELECT id FROM mkb_bia WHERE mkb_layanan_prioritas_id=? LIMIT 1',[mkbId]);
    if(existing.length)return res.status(409).json({message:'BIA layanan tersebut sudah tersedia.'});
    const columns=['layanan_prioritas_id','mkb_layanan_prioritas_id',...biaFields];
    const vals=[null,mkbId,...biaFields.map(key=>parsed.values[key])];
    const [result]=await db.query(`INSERT INTO mkb_bia (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,vals);
    const rows=await biaRead(req,result.insertId);
    return res.status(201).json({message:'Kriteria kritikalitas berhasil disimpan.',data:rows[0]});
  }catch(error){if(error.code==='ER_DUP_ENTRY')return res.status(409).json({message:'BIA layanan tersebut sudah tersedia.'});return biaFail(res,error);}
};

exports.updateBia = async (req,res) => {
  const id=Number(req.params.id);
  if(!Number.isInteger(id)||id<=0)return res.status(400).json({message:'ID BIA tidak valid.'});
  if(Object.prototype.hasOwnProperty.call(req.body,'layanan_prioritas_id')||Object.prototype.hasOwnProperty.call(req.body,'mkb_layanan_prioritas_id'))return res.status(400).json({message:'Relasi layanan tidak dapat diganti.'});
  try {
    const rows=await biaRead(req,id);
    if(!rows.length)return res.status(404).json({message:'BIA tidak ditemukan.'});
    const parsed=biaValidate({...rows[0],...req.body});
    if(parsed.error)return res.status(400).json({message:parsed.error});
    const instansiId=await getMkbInstansiId(req);
    const [result]=await db.query(`UPDATE mkb_bia b LEFT JOIN mkb_layanan_prioritas ml ON ml.id=b.mkb_layanan_prioritas_id LEFT JOIN layanan_prioritas lp ON lp.id=b.layanan_prioritas_id LEFT JOIN layanan_digital ld ON ld.id=lp.layanan_id SET ${biaFields.map(k=>`b.${k}=?`).join(',')} WHERE b.id=? AND (? IS NULL OR COALESCE(ml.instansi_id,ld.instansi_id)=?)`,[...biaFields.map(k=>parsed.values[k]),id,instansiId,instansiId]);
    if(!result.affectedRows)return res.status(404).json({message:'BIA tidak ditemukan.'});
    const updated=await biaRead(req,id);
    return res.json({message:'BIA berhasil diperbarui.',data:updated[0]});
  }catch(error){return biaFail(res,error);}
};

exports.deleteBia = async (req,res) => {
  const id=Number(req.params.id);
  if(!Number.isInteger(id)||id<=0)return res.status(400).json({message:'ID BIA tidak valid.'});
  try {
    const instansiId=await getMkbInstansiId(req);
    const [result]=await db.query(`DELETE b FROM mkb_bia b LEFT JOIN mkb_layanan_prioritas ml ON ml.id=b.mkb_layanan_prioritas_id LEFT JOIN layanan_prioritas lp ON lp.id=b.layanan_prioritas_id LEFT JOIN layanan_digital ld ON ld.id=lp.layanan_id WHERE b.id=? AND (? IS NULL OR COALESCE(ml.instansi_id,ld.instansi_id)=?)`,[id,instansiId,instansiId]);
    return result.affectedRows?res.json({message:'BIA berhasil dihapus.'}):res.status(404).json({message:'BIA tidak ditemukan.'});
  }catch(error){return biaFail(res,error);}
};

exports.getModuleOptions = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        kode_modul,
        nama_modul,
        deskripsi
      FROM modules
      WHERE aktif = 1
      ORDER BY nama_modul ASC
    `);

    return res.status(200).json({
      data: rows
    });
  } catch (error) {
    console.error('getModuleOptions error:', error);

    return res.status(500).json({
      message: 'Terjadi kesalahan saat mengambil daftar modul.'
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
        b.mkb_layanan_prioritas_id,

        COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,

        ld.id AS layanan_id,
        COALESCE(ml.kode_layanan, ld.kode_layanan) AS kode_layanan,
        COALESCE(ml.nama_layanan, ld.nama_layanan) AS nama_layanan

    FROM mkb_insiden i

    JOIN mkb_bia b
        ON b.id = i.bia_id

    LEFT JOIN mkb_layanan_prioritas ml
        ON ml.id = b.mkb_layanan_prioritas_id

    LEFT JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
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
    im.nama_modul_manual,
    im.keterangan_dampak,
    im.created_at,
    i.nama_insiden,
    i.jenis_kejadian,
    i.kategori_dampak,
    COALESCE(m.kode_modul, '-') AS kode_modul,
    COALESCE(im.nama_modul_manual, m.nama_modul) AS nama_modul,
    m.deskripsi AS deskripsi_modul,
    m.aktif AS modul_aktif
  FROM mkb_insiden_modul im
  JOIN mkb_insiden i ON i.id = im.insiden_id
  LEFT JOIN modules m ON m.id = im.module_id
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
  const insidenId = Number(req.params.id);
  const namaModul = String(req.body.nama_modul_manual ?? '').trim();
  const keterangan = String(req.body.keterangan_dampak ?? '').trim();

  if (!Number.isInteger(insidenId) || insidenId <= 0) {
    return res.status(400).json({
      message: 'ID insiden tidak valid.'
    });
  }

  if (!namaModul) {
    return res.status(400).json({
      message: 'Modul Terkait wajib diisi.'
    });
  }

  if (namaModul.length > 200) {
    return res.status(400).json({
      message: 'Nama modul maksimal 200 karakter.'
    });
  }

  if (!keterangan) {
    return res.status(400).json({
      message: 'Keterangan Dampak wajib diisi.'
    });
  }

  try {
    const [insidenRows] = await db.query(
      'SELECT id FROM mkb_insiden WHERE id = ? LIMIT 1',
      [insidenId]
    );

    if (!insidenRows.length) {
      return res.status(404).json({
        message: 'Insiden tidak ditemukan.'
      });
    }

    const [duplicateRows] = await db.query(
      `
        SELECT id
        FROM mkb_insiden_modul
        WHERE insiden_id = ?
          AND LOWER(TRIM(nama_modul_manual)) = LOWER(?)
        LIMIT 1
      `,
      [insidenId, namaModul]
    );

    if (duplicateRows.length) {
      return res.status(409).json({
        message: 'Modul tersebut sudah terdaftar pada insiden ini.'
      });
    }

    const [result] = await db.query(
      `
        INSERT INTO mkb_insiden_modul
          (insiden_id, module_id, nama_modul_manual, keterangan_dampak)
        VALUES (?, NULL, ?, ?)
      `,
      [insidenId, namaModul, keterangan]
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
      message: 'Modul terkait berhasil ditambahkan.',
      data: rows[0]
    });
  } catch (error) {
    console.error('createModulInsiden error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Modul tersebut sudah terdaftar pada insiden ini.'
      });
    }

    return res.status(500).json({
      message: 'Gagal menambahkan modul terkait.'
    });
  }
};


// =====================================================
// UPDATE MODUL TERKAIT
// PUT /api/bcp/insiden-modul/:id
// =====================================================


exports.updateModulInsiden = async (req, res) => {
  const id = Number(req.params.id);
  const namaModul = String(req.body.nama_modul_manual ?? '').trim();
  const keterangan = String(req.body.keterangan_dampak ?? '').trim();

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      message: 'ID modul terkait tidak valid.'
    });
  }

  if (Object.prototype.hasOwnProperty.call(req.body, 'insiden_id')) {
    return res.status(400).json({
      message: 'Insiden tidak dapat diubah.'
    });
  }

  if (!namaModul) {
    return res.status(400).json({
      message: 'Modul Terkait wajib diisi.'
    });
  }

  if (namaModul.length > 200) {
    return res.status(400).json({
      message: 'Nama modul maksimal 200 karakter.'
    });
  }

  if (!keterangan) {
    return res.status(400).json({
      message: 'Keterangan Dampak wajib diisi.'
    });
  }

  try {
    const [existingRows] = await db.query(
      `
        SELECT id, insiden_id
        FROM mkb_insiden_modul
        WHERE id = ?
        LIMIT 1
      `,
      [id]
    );

    if (!existingRows.length) {
      return res.status(404).json({
        message: 'Data modul terkait tidak ditemukan.'
      });
    }

    const [duplicateRows] = await db.query(
      `
        SELECT id
        FROM mkb_insiden_modul
        WHERE insiden_id = ?
          AND LOWER(TRIM(nama_modul_manual)) = LOWER(?)
          AND id <> ?
        LIMIT 1
      `,
      [existingRows[0].insiden_id, namaModul, id]
    );

    if (duplicateRows.length) {
      return res.status(409).json({
        message: 'Modul tersebut sudah terdaftar pada insiden ini.'
      });
    }

    await db.query(
      `
        UPDATE mkb_insiden_modul
        SET
          module_id = NULL,
          nama_modul_manual = ?,
          keterangan_dampak = ?
        WHERE id = ?
      `,
      [namaModul, keterangan, id]
    );

    const [rows] = await db.query(
      `
        ${insidenModulSelectQuery}
        WHERE im.id = ?
        LIMIT 1
      `,
      [id]
    );

    return res.status(200).json({
      message: 'Modul terkait berhasil diperbarui.',
      data: rows[0]
    });
  } catch (error) {
    console.error('updateModulInsiden error:', error);

    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({
        message: 'Modul tersebut sudah terdaftar pada insiden ini.'
      });
    }

    return res.status(500).json({
      message: 'Gagal memperbarui modul terkait.'
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
        b.mkb_layanan_prioritas_id,

        COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,

        ld.id AS layanan_id,
        COALESCE(ml.kode_layanan, ld.kode_layanan) AS kode_layanan,
        COALESCE(ml.nama_layanan, ld.nama_layanan) AS nama_layanan

    FROM mkb_ketergantungan k

    JOIN mkb_bia b
        ON b.id = k.bia_id

    LEFT JOIN mkb_layanan_prioritas ml
        ON ml.id = b.mkb_layanan_prioritas_id

    LEFT JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
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
        b.mkb_layanan_prioritas_id,

        COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,

        ld.id AS layanan_id,
        COALESCE(ml.kode_layanan, ld.kode_layanan) AS kode_layanan,
        COALESCE(ml.nama_layanan, ld.nama_layanan) AS nama_layanan

    FROM mkb_strategi_pemulihan s

    JOIN mkb_insiden i
        ON i.id = s.insiden_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    LEFT JOIN mkb_layanan_prioritas ml
        ON ml.id = b.mkb_layanan_prioritas_id

    LEFT JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
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
        b.mkb_layanan_prioritas_id,

        COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,

        ld.id AS layanan_id,
        COALESCE(ml.kode_layanan, ld.kode_layanan) AS kode_layanan,
        COALESCE(ml.nama_layanan, ld.nama_layanan) AS nama_layanan

    FROM mkb_langkah_pemulihan l

    JOIN mkb_strategi_pemulihan s
        ON s.id = l.strategi_id

    JOIN mkb_insiden i
        ON i.id = s.insiden_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    LEFT JOIN mkb_layanan_prioritas ml
        ON ml.id = b.mkb_layanan_prioritas_id

    LEFT JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
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
        b.mkb_layanan_prioritas_id,

        COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,

        ld.id AS layanan_id,
        COALESCE(ml.kode_layanan, ld.kode_layanan) AS kode_layanan,
        COALESCE(ml.nama_layanan, ld.nama_layanan) AS nama_layanan

    FROM mkb_uji u

    JOIN mkb_insiden i
        ON i.id = u.insiden_id

    LEFT JOIN mkb_strategi_pemulihan s
        ON s.id = u.strategi_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    LEFT JOIN mkb_layanan_prioritas ml
        ON ml.id = b.mkb_layanan_prioritas_id

    LEFT JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
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
        b.mkb_layanan_prioritas_id,

        COALESCE(ml.kode_layanan, lp.kode_prioritas) AS kode_prioritas,

        ld.id AS layanan_id,
        COALESCE(ml.kode_layanan, ld.kode_layanan) AS kode_layanan,
        COALESCE(ml.nama_layanan, ld.nama_layanan) AS nama_layanan

    FROM mkb_evaluasi e

    JOIN mkb_uji u
        ON u.id = e.uji_id

    JOIN mkb_insiden i
        ON i.id = u.insiden_id

    JOIN mkb_bia b
        ON b.id = i.bia_id

    LEFT JOIN mkb_layanan_prioritas ml
        ON ml.id = b.mkb_layanan_prioritas_id

    LEFT JOIN layanan_prioritas lp
        ON lp.id = b.layanan_prioritas_id

    LEFT JOIN layanan_digital ld
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

const strukturTimSelectQuery = `
  SELECT
    st.id,
    st.mkb_layanan_prioritas_id,
    st.jenis_tim,
    st.nama_pegawai,
    st.nip,
    st.jabatan,
    st.unit_kerja,
    st.peran_tim,
    st.tanggung_jawab,
    st.created_by,
    st.created_at,
    st.updated_at,
    ml.kode_layanan,
    ml.nama_layanan,
    ml.jenis_layanan,
    ml.instansi_id,
    i.nama_instansi,
    u.nama AS dibuat_oleh
  FROM mkb_struktur_tim st
  JOIN mkb_layanan_prioritas ml
    ON ml.id = st.mkb_layanan_prioritas_id
  JOIN instansi i
    ON i.id = ml.instansi_id
  LEFT JOIN users u
    ON u.id = st.created_by
`;

const jenisTimMkb = [
  'Tim Manajemen Keberlangsungan',
  'Tim Tanggap Insiden',
  'Tim Pemulihan Layanan Digital',
  'Tim Operasional'
];

const validasiStrukturTim = (body) => {
  const layananId = Number(body.mkb_layanan_prioritas_id);

  const data = {
    mkb_layanan_prioritas_id: layananId,
    jenis_tim: String(body.jenis_tim || '').trim(),
    nama_pegawai: String(body.nama_pegawai || '').trim(),
    nip: String(body.nip || '').trim() || null,
    jabatan: String(body.jabatan || '').trim(),
    unit_kerja: String(body.unit_kerja || '').trim(),
    peran_tim: String(body.peran_tim || '').trim(),
    tanggung_jawab: String(body.tanggung_jawab || '').trim()
  };

  if (!Number.isInteger(layananId) || layananId <= 0) {
    return { error: 'Layanan Prioritas wajib dipilih.' };
  }

  if (!jenisTimMkb.includes(data.jenis_tim)) {
    return { error: 'Jenis Tim tidak valid.' };
  }

  if (
    !data.nama_pegawai ||
    !data.jabatan ||
    !data.unit_kerja ||
    !data.peran_tim ||
    !data.tanggung_jawab
  ) {
    return {
      error: 'Nama Pegawai, Jabatan, Unit Kerja, Peran Tim, dan Tanggung Jawab wajib diisi.'
    };
  }

  if (
    data.nama_pegawai.length > 150 ||
    (data.nip && data.nip.length > 50) ||
    data.jabatan.length > 150 ||
    data.unit_kerja.length > 150 ||
    data.peran_tim.length > 150
  ) {
    return { error: 'Panjang salah satu isian melebihi batas.' };
  }

  return { data };
};

exports.getAllStrukturTim = async (req, res) => {
  try {
    const instansiId = await getMkbInstansiId(req);

    const [rows] = await db.query(
      `
      ${strukturTimSelectQuery}
      WHERE (? IS NULL OR ml.instansi_id = ?)
      ORDER BY st.id DESC
      `,
      [instansiId, instansiId]
    );

    return res.status(200).json({ data: rows });
  } catch (error) {
    console.error('getAllStrukturTim error:', error);

    return res.status(500).json({
      message: 'Gagal mengambil struktur tim MKB.'
    });
  }
};

exports.createStrukturTim = async (req, res) => {
  try {
    const hasil = validasiStrukturTim(req.body);

    if (hasil.error) {
      return res.status(400).json({
        message: hasil.error
      });
    }

    const data = hasil.data;
    const instansiId = await getMkbInstansiId(req);

    const [layanan] = await db.query(
      `
      SELECT id, instansi_id
      FROM mkb_layanan_prioritas
      WHERE id = ?
        AND (? IS NULL OR instansi_id = ?)
      LIMIT 1
      `,
      [
        data.mkb_layanan_prioritas_id,
        instansiId,
        instansiId
      ]
    );

    if (layanan.length === 0) {
      return res.status(404).json({
        message: 'Layanan Prioritas tidak ditemukan pada instansi kamu.'
      });
    }

    const [result] = await db.query(
      `
      INSERT INTO mkb_struktur_tim
      (
        mkb_layanan_prioritas_id,
        jenis_tim,
        nama_pegawai,
        nip,
        jabatan,
        unit_kerja,
        peran_tim,
        tanggung_jawab,
        created_by
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        data.mkb_layanan_prioritas_id,
        data.jenis_tim,
        data.nama_pegawai,
        data.nip,
        data.jabatan,
        data.unit_kerja,
        data.peran_tim,
        data.tanggung_jawab,
        req.user.id
      ]
    );

    return res.status(201).json({
      message: 'Anggota tim berhasil ditambahkan.',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('createStrukturTim error:', error);

    return res.status(500).json({
      message: 'Gagal menambahkan anggota tim.'
    });
  }
};

exports.updateStrukturTim = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID anggota tim tidak valid.'
      });
    }

    const hasil = validasiStrukturTim(req.body);

    if (hasil.error) {
      return res.status(400).json({
        message: hasil.error
      });
    }

    const data = hasil.data;
    const instansiId = await getMkbInstansiId(req);

    const [existing] = await db.query(
      `
      SELECT st.id
      FROM mkb_struktur_tim st
      JOIN mkb_layanan_prioritas ml
        ON ml.id = st.mkb_layanan_prioritas_id
      WHERE st.id = ?
        AND (? IS NULL OR ml.instansi_id = ?)
      LIMIT 1
      `,
      [id, instansiId, instansiId]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        message: 'Anggota tim tidak ditemukan.'
      });
    }

    const [layanan] = await db.query(
      `
      SELECT id
      FROM mkb_layanan_prioritas
      WHERE id = ?
        AND (? IS NULL OR instansi_id = ?)
      LIMIT 1
      `,
      [
        data.mkb_layanan_prioritas_id,
        instansiId,
        instansiId
      ]
    );

    if (layanan.length === 0) {
      return res.status(404).json({
        message: 'Layanan Prioritas tidak ditemukan pada instansi kamu.'
      });
    }

    await db.query(
      `
      UPDATE mkb_struktur_tim
      SET
        mkb_layanan_prioritas_id = ?,
        jenis_tim = ?,
        nama_pegawai = ?,
        nip = ?,
        jabatan = ?,
        unit_kerja = ?,
        peran_tim = ?,
        tanggung_jawab = ?
      WHERE id = ?
      `,
      [
        data.mkb_layanan_prioritas_id,
        data.jenis_tim,
        data.nama_pegawai,
        data.nip,
        data.jabatan,
        data.unit_kerja,
        data.peran_tim,
        data.tanggung_jawab,
        id
      ]
    );

    return res.status(200).json({
      message: 'Anggota tim berhasil diperbarui.'
    });
  } catch (error) {
    console.error('updateStrukturTim error:', error);

    return res.status(500).json({
      message: 'Gagal memperbarui anggota tim.'
    });
  }
};

exports.deleteStrukturTim = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        message: 'ID anggota tim tidak valid.'
      });
    }

    const instansiId = await getMkbInstansiId(req);

    const [result] = await db.query(
      `
      DELETE st
      FROM mkb_struktur_tim st
      JOIN mkb_layanan_prioritas ml
        ON ml.id = st.mkb_layanan_prioritas_id
      WHERE st.id = ?
        AND (? IS NULL OR ml.instansi_id = ?)
      `,
      [id, instansiId, instansiId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: 'Anggota tim tidak ditemukan.'
      });
    }

    return res.status(200).json({
      message: 'Anggota tim berhasil dihapus.'
    });
  } catch (error) {
    console.error('deleteStrukturTim error:', error);

    return res.status(500).json({
      message: 'Gagal menghapus anggota tim.'
    });
  }
};


exports.validatePenanggungJawabForm13 = async (req, res, next) => {
  try {
    const userId = Number(req.body.penanggung_jawab_id);
    const dataId = Number(req.params.id);
    const isUpdate = req.method === 'PUT';

    if (
      !Number.isInteger(userId) || userId <= 0 ||
      !Number.isInteger(dataId) || dataId <= 0
    ) {
      return res.status(400).json({
        message: 'Data penanggung jawab atau referensi uji tidak valid.'
      });
    }

    const [rows] = await db.query(
      `
        SELECT
          ml.instansi_id,
          pj.instansi_id AS instansi_penanggung_jawab
        FROM mkb_uji u
        JOIN mkb_insiden i ON i.id = u.insiden_id
        JOIN mkb_bia b ON b.id = i.bia_id
        JOIN mkb_layanan_prioritas ml
          ON ml.id = b.mkb_layanan_prioritas_id
        JOIN users pj ON pj.id = ?
        ${isUpdate ? 'JOIN mkb_evaluasi e ON e.uji_id = u.id' : ''}
        WHERE ${isUpdate ? 'e.id' : 'u.id'} = ?
        LIMIT 1
      `,
      [userId, dataId]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        message: 'Skenario uji atau penanggung jawab tidak ditemukan.'
      });
    }

    if (
      rows[0].instansi_penanggung_jawab === null ||
      Number(rows[0].instansi_penanggung_jawab) !==
      Number(rows[0].instansi_id)
    ) {
      return res.status(403).json({
        message: 'Penanggung jawab harus berasal dari instansi pemilik uji coba.'
      });
    }

    next();
  } catch (error) {
    console.error('validatePenanggungJawabForm13 error:', error);

    return res.status(500).json({
      message: 'Gagal memvalidasi penanggung jawab.'
    });
  }
};
