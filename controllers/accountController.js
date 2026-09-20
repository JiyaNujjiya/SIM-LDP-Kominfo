const db = require('../config/db');
const bcrypt = require('bcryptjs');

exports.getAccounts = async (req, res) => {
  try {
    const [rows] = await db.query(`
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
    `);

    return res.json({
      data: rows
    });
  } catch (error) {
    console.error(
      'GET ACCOUNTS ERROR:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal mengambil daftar akun.',
      error:
        error.message
    });
  }
};

exports.getRoles = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT
        id,
        nama_role,
        deskripsi
      FROM roles
      ORDER BY id ASC
    `);

    return res.json({
      data: rows
    });
  } catch (error) {
    console.error(
      'GET ROLES ERROR:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal mengambil daftar role.',
      error:
        error.message
    });
  }
};

exports.createAccount = async (req, res) => {
  const {
    nama,
    email,
    password,
    role_id,
    upr_instansi
  } = req.body;

  if (
    !nama ||
    !email ||
    !password ||
    !role_id
  ) {
    return res.status(400).json({
      message:
        'Nama, email, password, dan role wajib diisi.'
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      message:
        'Password minimal 8 karakter.'
    });
  }

  try {
    const [existingUsers] =
      await db.query(
        `
          SELECT id
          FROM users
          WHERE email = ?
          LIMIT 1
        `,
        [email]
      );

    if (existingUsers.length > 0) {
      return res.status(400).json({
        message:
          'Email sudah digunakan.'
      });
    }

    const [roles] =
      await db.query(
        `
          SELECT
            id,
            nama_role
          FROM roles
          WHERE id = ?
          LIMIT 1
        `,
        [role_id]
      );

    if (roles.length === 0) {
      return res.status(400).json({
        message:
          'Role tidak valid.'
      });
    }

    const role = roles[0];

    const roleEnum =
      String(role.nama_role)
        .trim()
        .toLowerCase();

    const allowedRoles = [
      'admin',
      'pengelola',
      'pimpinan',
      'auditor'
    ];

    if (
      !allowedRoles.includes(
        roleEnum
      )
    ) {
      return res.status(400).json({
        message:
          'Role tidak didukung.'
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    const [result] =
      await db.query(
        `
          INSERT INTO users (
            nama,
            email,
            password,
            role,
            role_id,
            upr_instansi
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `,
        [
          nama.trim(),
          email.trim().toLowerCase(),
          hashedPassword,
          roleEnum,
          role.id,
          upr_instansi?.trim() || null
        ]
      );

    return res.status(201).json({
      message:
        'Akun berhasil dibuat.',
      id:
        result.insertId
    });
  } catch (error) {
    console.error(
      'CREATE ACCOUNT ERROR:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal membuat akun.',
      error:
        error.message
    });
  }
};

exports.updateAccount = async (req, res) => {
  const accountId =
    Number(req.params.id);

  const {
    nama,
    email,
    role_id,
    upr_instansi
  } = req.body;

  if (
    !Number.isInteger(accountId) ||
    accountId <= 0
  ) {
    return res.status(400).json({
      message:
        'ID akun tidak valid.'
    });
  }

  if (
    !nama ||
    !email ||
    !role_id
  ) {
    return res.status(400).json({
      message:
        'Nama, email, dan role wajib diisi.'
    });
  }

  try {
    const [accounts] =
      await db.query(
        `
          SELECT id, role_id
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [accountId]
      );

    if (accounts.length === 0) {
      return res.status(404).json({
        message:
          'Akun tidak ditemukan.'
      });
    }

    if (
      accountId ===
        Number(req.user.id) &&
      Number(role_id) !==
        Number(accounts[0].role_id)
    ) {
      return res.status(400).json({
        message:
          'Administrator tidak dapat mengubah role akun yang sedang digunakan.'
      });
    }

    const [emailRows] =
      await db.query(
        `
          SELECT id
          FROM users
          WHERE email = ?
            AND id <> ?
          LIMIT 1
        `,
        [
          email.trim().toLowerCase(),
          accountId
        ]
      );

    if (emailRows.length > 0) {
      return res.status(400).json({
        message:
          'Email sudah digunakan akun lain.'
      });
    }

    const [roles] =
      await db.query(
        `
          SELECT
            id,
            nama_role
          FROM roles
          WHERE id = ?
          LIMIT 1
        `,
        [role_id]
      );

    if (roles.length === 0) {
      return res.status(400).json({
        message:
          'Role tidak valid.'
      });
    }

    const roleEnum =
      String(
        roles[0].nama_role
      )
        .trim()
        .toLowerCase();

    await db.query(
      `
        UPDATE users

        SET
          nama = ?,
          email = ?,
          role = ?,
          role_id = ?,
          upr_instansi = ?

        WHERE id = ?
      `,
      [
        nama.trim(),
        email.trim().toLowerCase(),
        roleEnum,
        roles[0].id,
        upr_instansi?.trim() || null,
        accountId
      ]
    );

    return res.json({
      message:
        'Akun berhasil diperbarui.'
    });
  } catch (error) {
    console.error(
      'UPDATE ACCOUNT ERROR:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal memperbarui akun.',
      error:
        error.message
    });
  }
};

exports.resetAccountPassword = async (req, res) => {
  const accountId =
    Number(req.params.id);

  const {
    password,
    confirmPassword
  } = req.body;

  if (
    !Number.isInteger(accountId) ||
    accountId <= 0
  ) {
    return res.status(400).json({
      message:
        'ID akun tidak valid.'
    });
  }

  if (
    !password ||
    !confirmPassword
  ) {
    return res.status(400).json({
      message:
        'Password dan konfirmasi password wajib diisi.'
    });
  }

  if (
    password !==
    confirmPassword
  ) {
    return res.status(400).json({
      message:
        'Konfirmasi password tidak sesuai.'
    });
  }

  if (
    password.length < 8
  ) {
    return res.status(400).json({
      message:
        'Password minimal 8 karakter.'
    });
  }

  try {
    const [accounts] =
      await db.query(
        `
          SELECT id
          FROM users
          WHERE id = ?
          LIMIT 1
        `,
        [accountId]
      );

    if (accounts.length === 0) {
      return res.status(404).json({
        message:
          'Akun tidak ditemukan.'
      });
    }

    const hashedPassword =
      await bcrypt.hash(
        password,
        10
      );

    await db.query(
      `
        UPDATE users
        SET password = ?
        WHERE id = ?
      `,
      [
        hashedPassword,
        accountId
      ]
    );

    return res.json({
      message:
        'Password akun berhasil direset.'
    });
  } catch (error) {
    console.error(
      'RESET ACCOUNT PASSWORD ERROR:',
      error
    );

    return res.status(500).json({
      message:
        'Gagal mereset password akun.',
      error:
        error.message
    });
  }
};