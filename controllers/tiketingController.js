const db = require('../config/db');

exports.createTiket = async (req, res) => {
    const { kode_tiket, tipe, deskripsi, is_recurring, id_perubahan } = req.body;
    const pelapor_id = req.user.id;
    try {
        await db.query(
            'INSERT INTO mrp_tiketing (kode_tiket, pelapor_id, tipe, deskripsi, is_recurring, id_perubahan) VALUES (?, ?, ?, ?, ?, ?)',
            [kode_tiket, pelapor_id, tipe || 'Insiden', deskripsi, is_recurring || false, id_perubahan || null]
        );
        res.status(201).json({ message: 'Tiket berhasil dibuat!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllTiket = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT t.*, u.nama AS pelapor 
            FROM mrp_tiketing t 
            LEFT JOIN users u ON t.pelapor_id = u.id
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};