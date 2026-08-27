const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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