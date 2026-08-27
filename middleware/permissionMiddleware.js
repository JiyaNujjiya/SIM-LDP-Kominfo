const db = require('../config/db');

const requirePermission = (kodePermission) => {
    return async (req, res, next) => {
        try {
            if (!req.user || !req.user.id) {
                return res.status(401).json({
                    message: 'User belum terautentikasi.'
                });
            }

            const userId = req.user.id;

            const [rows] = await db.query(`
                SELECT
                    p.kode_permission
                FROM users u
                JOIN role_permissions rp
                    ON rp.role_id = u.role_id
                JOIN permissions p
                    ON p.id = rp.permission_id
                WHERE u.id = ?
                  AND p.kode_permission = ?
                LIMIT 1
            `, [userId, kodePermission]);

            if (rows.length === 0) {
                return res.status(403).json({
                    message: 'Akses ditolak. Anda tidak memiliki permission yang diperlukan.'
                });
            }

            next();

        } catch (error) {
            console.error('Permission middleware error:', error);

            return res.status(500).json({
                message: 'Terjadi kesalahan saat memeriksa permission.'
            });
        }
    };
};

module.exports = requirePermission;