const jwt = require('jsonwebtoken');
const db = require('../config/db');

module.exports = async (
    req,
    res,
    next
) => {
    const authHeader =
        req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({
            message:
                'Akses ditolak! Token tidak ditemukan.'
        });
    }

    const token =
        authHeader.startsWith('Bearer ')
            ? authHeader.substring(7)
            : authHeader;

    try {
        const verified = jwt.verify(
            token.trim(),
            process.env.JWT_SECRET
        );

        const [users] = await db.query(
            `
            SELECT
                u.id,
                u.nama,
                u.email,
                u.role,
                u.role_id,
                u.nama_instansi,
                u.nama_unit,
                u.jabatan,
                r.nama_role
            FROM users u
            LEFT JOIN roles r
                ON r.id = u.role_id
            WHERE u.id = ?
            LIMIT 1
            `,
            [verified.id]
        );

        if (users.length === 0) {
            return res.status(401).json({
                message:
                    'Akun pengguna tidak ditemukan.'
            });
        }

        const user = users[0];

        const roleName = String(
            user.nama_role ||
            user.role ||
            ''
        )
            .trim()
            .toLowerCase();

        const allowedRoles = [
            'admin',
            'pengelola',
            'pimpinan'
        ];

        if (!allowedRoles.includes(roleName)) {
            return res.status(403).json({
                message:
                    'Role akun tidak diizinkan mengakses sistem.'
            });
        }

        if (
            roleName !== 'admin' &&
            !user.nama_instansi?.trim()
        ) {
            return res.status(403).json({
                message:
                    'Akun belum memiliki instansi. Hubungi administrator.'
            });
        }

        req.user = {
            id: user.id,
            nama: user.nama,
            email: user.email,
            role_id: user.role_id,
            role: roleName,

            nama_instansi:
                user.nama_instansi
                    ? user.nama_instansi.trim()
                    : null,

            nama_unit:
                user.nama_unit
                    ? user.nama_unit.trim()
                    : null,

            jabatan:
                user.jabatan
                    ? user.jabatan.trim()
                    : null,

            isAdmin:
                roleName === 'admin'
        };

        next();
    } catch (error) {
        console.error(
            'AUTH MIDDLEWARE ERROR:',
            error
        );

        return res.status(401).json({
            message:
                'Token tidak valid atau sudah kedaluwarsa.'
        });
    }
};