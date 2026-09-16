const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// 1. Registrasi User Baru
exports.register = async (req, res) => {
    const { nama, email, password, role, upr_instansi } = req.body;
    try {
        // Cek email apakah sudah terdaftar
        const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ message: 'Email sudah terdaftar!' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Simpan ke HeidiSQL
        await db.query(
            'INSERT INTO users (nama, email, password, role, upr_instansi) VALUES (?, ?, ?, ?, ?)',
            [nama, email, hashedPassword, role || 'operator', upr_instansi]
        );

        res.status(201).json({ message: 'User berhasil didaftarkan!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. Login User
exports.login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Ambil user sekaligus role dari tabel roles
        const [users] = await db.query(`
            SELECT
                u.id,
                u.nama,
                u.email,
                u.password,
                u.upr_instansi,
                u.role_id,
                r.nama_role
            FROM users u
            LEFT JOIN roles r ON r.id = u.role_id
            WHERE u.email = ?
            LIMIT 1
        `, [email]);

        if (users.length === 0) {
            return res.status(400).json({
                message: 'Email atau password salah!'
            });
        }

        const user = users[0];

        // Cek password
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({
                message: 'Email atau password salah!'
            });
        }

        // Ambil seluruh permission berdasarkan role user
        const [permissionRows] = await db.query(`
            SELECT
                p.kode_permission
            FROM role_permissions rp
            JOIN permissions p
                ON p.id = rp.permission_id
            WHERE rp.role_id = ?
            ORDER BY p.kode_permission
        `, [user.role_id]);

        const permissions = permissionRows.map(
            item => item.kode_permission
        );

        // Buat JWT Token
        const token = jwt.sign(
            {
                id: user.id,
                role_id: user.role_id,
                role: user.nama_role,
                nama: user.nama
            },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login berhasil!',
            token,
            user: {
                id: user.id,
                nama: user.nama,
                role_id: user.role_id,
                role: user.nama_role,
                upr_instansi: user.upr_instansi,
                permissions: permissions
            }
        });

    } catch (error) {
        console.error('Login error:', error);

        res.status(500).json({
            error: error.message
        });
    }
};

exports.forgotPassword = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            message: 'Email wajib diisi.'
        });
    }

    try {
        const [users] = await db.query(
            'SELECT id, nama, email FROM users WHERE email = ? LIMIT 1',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                message: 'Email tidak terdaftar.'
            });
        }

        const user = users[0];

        const resetToken = crypto.randomBytes(32).toString('hex');

        const hashedToken = crypto
            .createHash('sha256')
            .update(resetToken)
            .digest('hex');

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await db.query(
            `UPDATE users
             SET reset_password_token = ?,
                 reset_password_expires = ?
             WHERE id = ?`,
            [hashedToken, expiresAt, user.id]
        );

        const resetUrl =
            `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

        return res.json({
            message: 'Email berhasil diverifikasi.',
            resetUrl
        });
    } catch (error) {
        console.error('Forgot password error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat memproses reset password.'
        });
    }
};

exports.resetPassword = async (req, res) => {
    const { token, password, confirmPassword } = req.body;

    if (!token) {
        return res.status(400).json({
            message: 'Token reset password tidak ditemukan.'
        });
    }

    if (!password || !confirmPassword) {
        return res.status(400).json({
            message: 'Password baru dan konfirmasi password wajib diisi.'
        });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({
            message: 'Konfirmasi password tidak sesuai.'
        });
    }

    if (password.length < 8) {
        return res.status(400).json({
            message: 'Password minimal 8 karakter.'
        });
    }

    try {
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');

        const [users] = await db.query(
            `SELECT id
             FROM users
             WHERE reset_password_token = ?
             AND reset_password_expires > NOW()
             LIMIT 1`,
            [hashedToken]
        );

        if (users.length === 0) {
            return res.status(400).json({
                message: 'Link reset password tidak valid atau sudah kedaluwarsa.'
            });
        }

        const user = users[0];

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        await db.query(
            `UPDATE users
             SET password = ?,
                 reset_password_token = NULL,
                 reset_password_expires = NULL
             WHERE id = ?`,
            [hashedPassword, user.id]
        );

        return res.json({
            message: 'Password berhasil diperbarui. Silakan login menggunakan password baru.'
        });
    } catch (error) {
        console.error('Reset password error:', error);

        return res.status(500).json({
            message: 'Terjadi kesalahan saat mengubah password.'
        });
    }
};