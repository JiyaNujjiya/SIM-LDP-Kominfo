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