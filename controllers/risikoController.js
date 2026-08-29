const db = require('../config/db');

// 1. Tambah Data Risiko (Form 1.0)
exports.createRisiko = async (req, res) => {
    const { 

        // a. identifikasi risiko
        sasaran_pembangunan_nasional,
        sasaran_upr,
        indikator_kinerja,
        kode_risiko,
        peristiwa_risiko,

        // b. analisis dan evaluasi risiko
        kategori_risiko, 
        penyebab, 
        dampak, 
        area_dampak,
        kemungkinan, 
        nilai_dampak, 
        prioritas_risiko,

        // c. perlakuan risiko
        keputusan_perlakuan,
        deskripsi_detail_perlakuan,
        waktu_rencana_perlakuan,
        penanggung_jawab_id,
        
        // d. risiko residual
        level_kemungkinan_residual,
        level_dampak_residual,

        // e. kolom tambahan
        layanan_id,
        layanan_prioritas_id,
        pemilik_layanan,
        strategis_operasional,
        lintas_sektor,
        membutuhkan_perubahan,

    } = req.body;
    
    const created_by = req.user ? req.user.id : null; 

    try {
        const query = `
            INSERT INTO mr_risiko (
            sasaran_pembangunan_nasional,
            sasaran_upr,
            indikator_kinerja,
            kode_risiko,
            peristiwa_risiko,
            kategori_risiko,
            penyebab,
            dampak,
            area_dampak,
            kemungkinan,
            nilai_dampak,
            prioritas_risiko,
            keputusan_perlakuan,
            deskripsi_detail_perlakuan,
            waktu_rencana_perlakuan,
            penanggung_jawab_id,
            level_kemungkinan_residual,
            level_dampak_residual,
            layanan_id,
            layanan_prioritas_id,
            pemilik_layanan,
            strategis_operasional,
            lintas_sektor,
            membutuhkan_perubahan,

            created_by
        ) 
            VALUES (?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?,
                ?, ?, ?, ?, ?, ?,
                ?)
        `;
        
        await db.query(query, [
            // a. identifikasi risiko
            sasaran_pembangunan_nasional || null,
            sasaran_upr || null,
            indikator_kinerja || null,
            kode_risiko,
            peristiwa_risiko,

            // b. analisis dan evaluasi Risiko
            kategori_risiko || null,
            penyebab || null,
            dampak || null,
            area_dampak || null,
            kemungkinan || null,
            nilai_dampak || null,
            prioritas_risiko || null,

            // c. perlakuan risiko
            keputusan_perlakuan || null,
            deskripsi_detail_perlakuan || null,
            waktu_rencana_perlakuan || null,
            penanggung_jawab_id || null,

            // d. risiko residual
            level_kemungkinan_residual || null,
            level_dampak_residual || null,

            // e. kolom tambahan
            layanan_id || null,
            layanan_prioritas_id || null,
            pemilik_layanan || null,
            strategis_operasional || null,
            lintas_sektor ? 1 : 0,
            membutuhkan_perubahan ? 1 : 0, 
            
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