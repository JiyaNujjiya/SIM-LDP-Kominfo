const db = require('../config/db');

exports.createPerubahan = async (req, res) => {
    const { kode_perubahan, judul, kategori, dampak_teknis, dampak_org, status } = req.body;
    try {
        await db.query(
            'INSERT INTO mpr_perubahan (kode_perubahan, judul, kategori, dampak_teknis, dampak_org, status) VALUES (?, ?, ?, ?, ?, ?)',
            [kode_perubahan, judul, kategori || 'Normal', dampak_teknis, dampak_org, status || 'Perencanaan']
        );
        res.status(201).json({ message: 'Pengajuan Perubahan (RFC) berhasil disimpan!' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAllPerubahan = async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM mpr_perubahan ORDER BY created_at DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};