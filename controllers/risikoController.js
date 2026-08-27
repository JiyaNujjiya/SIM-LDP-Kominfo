const db = require('../config/db');

// 1. Tambah Data Risiko (Form 1.0)
exports.createRisiko = async (req, res) => {
    const { 
        kode_risiko,
        kategori_risiko, 
        peristiwa_risiko, 
        penyebab, 
        dampak, 
        kemungkinan, 
        nilai_dampak, 
        keputusan_perlakuan,  
    } = req.body;
    
    const created_by = req.user ? req.user.id : null; 

    try {
        const query = `
            INSERT INTO mr_risiko 
            (
            kode_risiko, 
            kategori_risiko,
            peristiwa_risiko, 
            penyebab, 
            dampak, 
            kemungkinan, 
            nilai_dampak, 
            keputusan_perlakuan, 
            created_by) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await db.query(query, [
            kode_risiko ||  
            peristiwa_risiko || null, 
            penyebab || null, 
            dampak || null, 
            kemungkinan || null, 
            nilai_dampak || null, 
            keputusan_perlakuan || null,  
            created_by
        ]);

        res.status(201).json({ 
            message: 'Data Risiko berhasil ditambahkan!' 
        });

    } catch (error) {
        console.error('ERROR DATABASE:', error); 
        
        res.status(500).json({ 
            error: error.message });
    }
};

// 2. Ambil Semua Data Risiko
exports.getAllRisiko = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT r.*, u.nama AS pembuat 
            FROM mr_risiko r 
            LEFT JOIN users u ON r.created_by = u.id 
            ORDER BY r.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        console.error('ERROR DATABASE:', error);
        res.status(500).json({ error: error.message });
    }
};