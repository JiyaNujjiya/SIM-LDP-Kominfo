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
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) return res.status(400).json({ message: 'Email atau password salah!' });

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Email atau password salah!' });

        // Buat JWT Token
        const token = jwt.sign(
            { id: user.id, role: user.role, nama: user.nama },
            process.env.JWT_SECRET,
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login berhasil!',
            token,
            user: { id: user.id, nama: user.nama, role: user.role, upr_instansi: user.upr_instansi }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};