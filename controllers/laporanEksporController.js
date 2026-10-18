const db = require('../config/db');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const MODULES = {
    risiko: { name: 'Manajemen Risiko', permission: 'risk.view', prefixes: ['mr_'], extras: ['layanan_digital', 'layanan_prioritas'] },
    perubahan: { name: 'Manajemen Perubahan', permission: 'change.view', prefixes: ['mpr_'] },
    pengetahuan: { name: 'Manajemen Pengetahuan', permission: 'knowledge.view', prefixes: ['mpn_'] },
    keberlangsungan: { name: 'Manajemen Keberlangsungan', permission: 'continuity.view', prefixes: ['mkb_'] },
    'relasi-pengguna': { name: 'Manajemen Relasi Pengguna', permission: 'user_relation.view', prefixes: ['mrp_'] }
};

const ORDER = {
    risiko: ['mr_konteks', 'mr_risiko', 'mr_risiko_ippd', 'mr_form2_prioritas', 'mr_monitoring', 'mr_monitoring_dokumen'],
    perubahan: ['mpr_perencanaan', 'mpr_analisis_prioritas', 'mpr_perubahan', 'mpr_dampak_teknis', 'mpr_analisis_organisasi', 'mpr_dampak_organisasi', 'mpr_dampak_organisasi_indikator', 'mpr_indikator_dampak_organisasi', 'mpr_persetujuan', 'mpr_implementasi', 'mpr_strategi_implementasi', 'mpr_anggaran', 'mpr_sumber_daya', 'mpr_stakeholder', 'mpr_pelatihan', 'mpr_komunikasi', 'mpr_media_komunikasi', 'mpr_indikator_keberhasilan', 'mpr_evaluasi', 'mpr_log_perubahan', 'mpr_bukti_pelaksanaan'],
    pengetahuan: ['mpn_perencanaan', 'mpn_indikator_perencanaan', 'mpn_pengetahuan', 'mpn_rencana_dokumentasi', 'mpn_rencana_tipe_dokumentasi', 'mpn_pengumpulan_pengolahan', 'mpn_dokumentasi', 'mpn_pemanfaatan', 'mpn_alih_pengetahuan', 'mpn_metode_alih', 'mpn_evaluasi'],
    keberlangsungan: ['mkb_layanan_prioritas', 'mkb_ruang_lingkup', 'mkb_struktur_tim', 'mkb_bia', 'mkb_ketergantungan', 'mkb_insiden', 'mkb_insiden_modul', 'mkb_strategi_pemulihan', 'mkb_langkah_pemulihan', 'mkb_uji', 'mkb_evaluasi'],
    'relasi-pengguna': ['mrp_katalog_layanan', 'mrp_katalog_layanan_terkait', 'mrp_standar_layanan', 'mrp_sla_layanan', 'mrp_ola_layanan', 'mrp_indikator_tambahan_standar', 'mrp_target_kueri_insiden', 'mrp_rencana_komunikasi', 'mrp_media_komunikasi', 'mrp_permintaan_layanan', 'mrp_tanggapan_permintaan', 'mrp_evaluasi_permintaan', 'mrp_evaluasi_permintaan_indikator', 'mrp_kueri', 'mrp_tanggapan_kueri', 'mrp_insiden', 'mrp_penanganan_insiden', 'mrp_masalah', 'mrp_masalah_insiden', 'mrp_masalah_pengetahuan', 'mrp_evaluasi', 'mrp_evaluasi_layanan', 'mrp_evaluasi_layanan_indikator', 'mrp_evaluasi_kueri_insiden', 'mrp_evaluasi_kueri_insiden_indikator', 'mrp_rencana_perbaikan']
};

const MAX_ROWS_PER_TABLE = 3000;
const ident = (name) => `\`${String(name).replace(/`/g, '``')}\``;
const label = (value) => String(value).replace(/^(mrp|mpr|mpn|mkb|mr)_/, '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
const str = (value) => value === null || value === undefined ? '-' : value instanceof Date ? value.toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) : typeof value === 'object' ? JSON.stringify(value) : String(value);
const spreadsheetSafe = (value) => /^[=+@\-\t\r]/.test(value) ? `'${value}` : value;
const number = (value) => Number(value || 0);

let schemaCache = null;

async function getSchema() {
    if (schemaCache) return schemaCache;
    const [columns] = await db.query(`
        SELECT TABLE_NAME, COLUMN_NAME, ORDINAL_POSITION
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        ORDER BY TABLE_NAME, ORDINAL_POSITION
    `);
    const [foreignKeys] = await db.query(`
        SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
        WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
    `);
    const tables = {};
    for (const col of columns) {
        if (!tables[col.TABLE_NAME]) tables[col.TABLE_NAME] = { columns: [], fks: [] };
        tables[col.TABLE_NAME].columns.push(col.COLUMN_NAME);
    }
    for (const fk of foreignKeys) {
        if (tables[fk.TABLE_NAME]) tables[fk.TABLE_NAME].fks.push({
            column: fk.COLUMN_NAME,
            parent: fk.REFERENCED_TABLE_NAME,
            parentColumn: fk.REFERENCED_COLUMN_NAME
        });
    }
    schemaCache = tables;
    return tables;
}

function tableList(schema, moduleKey) {
    const config = MODULES[moduleKey];
    const list = Object.keys(schema).filter((t) => config.prefixes.some((p) => t.startsWith(p)) || (config.extras || []).includes(t));
    const order = ORDER[moduleKey] || [];
    return list.sort((a, b) => {
        const x = order.indexOf(a);
        const y = order.indexOf(b);
        if (x !== -1 || y !== -1) return (x === -1 ? 999 : x) - (y === -1 ? 999 : y);
        return a.localeCompare(b);
    });
}

function buildScopeSQL(table, schema, seen = new Set(), alias = 't', depth = 0) {
    const cfg = schema[table];
    if (!cfg || seen.has(table)) return null;
    const nextSeen = new Set([...seen, table]);
    const columns = new Set(cfg.columns);

    if (table === 'mpr_indikator_dampak_organisasi') {
        const childAlias = `s${depth + 1}`;
        const junction = buildScopeSQL('mpr_dampak_organisasi_indikator', schema, nextSeen, childAlias, depth + 1);
        if (!junction) return null;
        return `EXISTS (SELECT 1 FROM ${ident('mpr_dampak_organisasi_indikator')} ${childAlias} WHERE ${childAlias}.indikator_id = ${alias}.id AND ${junction})`;
    }

    if (table !== 'mr_risiko_ippd' && columns.has('instansi_id')) return `${alias}.instansi_id = :instansi:`;
    if (columns.has('pemilik_instansi_id')) {
        const fallback = columns.has('created_by')
            ? `EXISTS (SELECT 1 FROM users u${depth} WHERE u${depth}.id = ${alias}.created_by AND u${depth}.instansi_id = :instansi:)`
            : 'FALSE';
        return `(${alias}.pemilik_instansi_id = :instansi: OR (${alias}.pemilik_instansi_id IS NULL AND ${fallback}))`;
    }

    const parentRefs = cfg.fks.filter((fk) => fk.parent !== 'users' && fk.parent !== 'pegawai' && fk.parent !== 'modules' && fk.parent !== 'instansi' && fk.parent !== 'unit_kerja' && fk.parent !== 'mpr_indikator_dampak_organisasi');
    const parentClauses = [];
    for (const fk of parentRefs) {
        const parentAlias = `p${depth + 1}`;
        const parentExpr = buildScopeSQL(fk.parent, schema, nextSeen, parentAlias, depth + 1);
        if (!parentExpr) continue;
        parentClauses.push({
            key: fk.column,
            condition: `EXISTS (SELECT 1 FROM ${ident(fk.parent)} ${parentAlias} WHERE ${parentAlias}.${ident(fk.parentColumn)} = ${alias}.${ident(fk.column)} AND ${parentExpr})`
        });
    }

    if (parentClauses.length) {
        const conditions = parentClauses.map((x) => `(${alias}.${ident(x.key)} IS NULL OR ${x.condition})`);
        const atLeastOneRef = parentClauses.map((x) => `${alias}.${ident(x.key)} IS NOT NULL`).join(' OR ');
        const linked = `(${conditions.join(' AND ')} AND (${atLeastOneRef}))`;
        if (columns.has('created_by')) {
            const creator = `EXISTS (SELECT 1 FROM users u${depth} WHERE u${depth}.id = ${alias}.created_by AND u${depth}.instansi_id = :instansi:)`;
            const noParent = parentClauses.map((x) => `${alias}.${ident(x.key)} IS NULL`).join(' AND ');
            return `(${linked} OR ((${noParent}) AND ${creator}))`;
        }
        return linked;
    }

    if (columns.has('created_by')) {
        return `EXISTS (SELECT 1 FROM users u${depth} WHERE u${depth}.id = ${alias}.created_by AND u${depth}.instansi_id = :instansi:)`;
    }
    return null;
}

async function getScope(req) {
    const userId = Number(req.user?.id);
    if (!Number.isInteger(userId) || userId < 1) return { status: 401, message: 'Sesi tidak valid.' };
    const [[users], [perms]] = await Promise.all([
        db.query('SELECT id, role_id, role, instansi_id, nama_instansi FROM users WHERE id = ? LIMIT 1', [userId]),
        db.query(`SELECT p.kode_permission FROM role_permissions rp JOIN permissions p ON p.id = rp.permission_id JOIN users u ON u.role_id = rp.role_id WHERE u.id = ?`, [userId])
    ]);
    if (!users.length) return { status: 401, message: 'Akun tidak ditemukan.' };
    const user = users[0];
    const isAdmin = number(user.role_id) === 1 || String(user.role).toLowerCase() === 'admin';
    if (!isAdmin && !Number.isInteger(number(user.instansi_id))) return { status: 403, message: 'Instansi belum valid.' };
    if (!isAdmin && number(user.instansi_id) < 1) return { status: 403, message: 'Instansi belum ditentukan.' };
    return {
        isAdmin,
        instansiId: number(user.instansi_id),
        instansi: isAdmin ? 'Seluruh Instansi' : user.nama_instansi || `Instansi ${user.instansi_id}`,
        permissions: new Set(perms.map((p) => p.kode_permission))
    };
}

async function readReport(schema, moduleKeys, scope, jenis) {
    const result = [];
    for (const moduleKey of moduleKeys) {
        const sections = [];
        for (const table of tableList(schema, moduleKey)) {
            const predicate = scope.isAdmin ? '1=1' : buildScopeSQL(table, schema);
            if (!predicate) {
                throw Object.assign(new Error(`Relasi instansi tabel ${table} tidak dapat diverifikasi.`), { status: 422 });
            }
            const where = predicate.replace(/:instansi:/g, '?');
            const args = Array((where.match(/\?/g) || []).length).fill(scope.instansiId);
            const sql = `FROM ${ident(table)} t WHERE ${where}`;
            let rows;
            let total;
            if (jenis === 'rekap') {
                const [list] = await db.query(`SELECT COUNT(*) AS total ${sql}`, args);
                total = Number(list[0].total);
                rows = [];
            } else {
                const columns = schema[table].columns.filter((c) => !['file_path', 'reset_password_token', 'password', 'reset_password_expires'].includes(c));
                const [list] = await db.query(`SELECT ${columns.map((c) => `t.${ident(c)}`).join(', ')} ${sql} LIMIT ${MAX_ROWS_PER_TABLE + 1}`, args);
                if (list.length > MAX_ROWS_PER_TABLE) {
                    throw Object.assign(new Error(`Tabel ${table} memiliki lebih dari ${MAX_ROWS_PER_TABLE} data. Ekspor dibatalkan agar tidak ada data yang terpotong.`), { status: 413 });
                }
                rows = list;
                total = rows.length;
            }
            sections.push({ table, name: label(table), columns: schema[table].columns, rows, total });
        }
        result.push({ key: moduleKey, name: MODULES[moduleKey].name, sections });
    }
    return result;
}

async function writeExcel(res, report, scope, jenis) {
    const wb = new ExcelJS.Workbook();
    wb.creator = 'SIM-LDP';
    const info = wb.addWorksheet('Informasi');
    [['LAPORAN SIM-LDP'], ['Instansi', scope.instansi], ['Jenis', jenis === 'rekap' ? 'Rekapitulasi' : 'Detail Seluruh Tabel'], ['Dibuat', new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })]].forEach((r) => info.addRow(r));
    info.getColumn(1).width = 28;
    info.getColumn(2).width = 68;
    info.getRow(1).font = { bold: true, size: 16 };
    let index = 1;
    for (const mod of report) {
        if (jenis === 'rekap') {
            const ws = wb.addWorksheet(`${String(index++).padStart(2, '0')} ${mod.key}`.slice(0, 31));
            ws.addRow([mod.name]);
            ws.addRow(['Tabel Formulir', 'Jumlah Data']);
            mod.sections.forEach((s) => ws.addRow([s.name, s.total]));
            ws.columns = [{ width: 43 }, { width: 18 }];
            ws.getRow(2).font = { bold: true };
            continue;
        }
        for (const section of mod.sections) {
            const name = `${String(index++).padStart(2, '0')}_${section.table}`.slice(0, 31);
            const ws = wb.addWorksheet(name);
            ws.addRow([mod.name]);
            ws.addRow([section.name]);
            ws.addRow([`Tabel: ${section.table}`, `Jumlah: ${section.total}`]);
            const headers = section.columns.filter((c) => !['file_path', 'password', 'reset_password_token', 'reset_password_expires'].includes(c));
            ws.addRow(headers.map(label));
            for (const row of section.rows) {
                ws.addRow(headers.map((c) => spreadsheetSafe(str(row[c]))));
            }
            ws.columns.forEach((col) => { col.width = 26; });
            ws.getRow(4).font = { bold: true, color: { argb: 'FFFFFFFF' } };
            ws.getRow(4).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1B2A4A' } };
            ws.views = [{ state: 'frozen', ySplit: 4 }];
            ws.autoFilter = { from: { row: 4, column: 1 }, to: { row: 4, column: headers.length } };
        }
    }
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan-sim-ldp-lengkap.xlsx"');
    return res.send(Buffer.from(buffer));
}

async function writePDF(res, report, scope, jenis) {
    const doc = new PDFDocument({ size: 'A4', margin: 42, bufferPages: false });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="laporan-sim-ldp-lengkap.pdf"');
    doc.pipe(res);
    const addHeading = (txt, size = 12) => {
        if (doc.y > 735) doc.addPage();
        doc.font('Helvetica-Bold').fontSize(size).fillColor('#1B2A4A').text(txt, { width: 510 });
        doc.moveDown(0.35);
    };
    doc.font('Helvetica-Bold').fontSize(19).text('LAPORAN SIM-LDP', { align: 'center' });
    doc.moveDown(0.5);
    doc.font('Helvetica').fontSize(10).fillColor('#333333')
        .text(`Instansi: ${scope.instansi}`)
        .text(`Jenis laporan: ${jenis === 'rekap' ? 'Rekapitulasi' : 'Detail Seluruh Tabel'}`)
        .text(`Dibuat: ${new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}`);
    doc.moveDown(1);
    for (const mod of report) {
        addHeading(mod.name, 15);
        for (const section of mod.sections) {
            if (doc.y > 710) doc.addPage();
            addHeading(`${section.name} (${section.total} data)`, 10);
            if (jenis === 'detail') {
                if (!section.rows.length) {
                    doc.font('Helvetica').fontSize(8).fillColor('#777777').text('Belum ada data.');
                }
                for (const [i, row] of section.rows.entries()) {
                    if (doc.y > 700) doc.addPage();
                    doc.font('Helvetica-Bold').fontSize(9).fillColor('#333333').text(`Data ${i + 1}`);
                    for (const [column, value] of Object.entries(row)) {
                        if (doc.y > 725) doc.addPage();
                        const valueText = str(value);
                        doc.font('Helvetica').fontSize(8).fillColor('#333333')
                            .text(`${label(column)}: ${valueText}`, { width: 510 });
                    }
                    doc.moveDown(0.6);
                }
            }
            doc.moveDown(0.45);
        }
        doc.moveDown(0.8);
    }
    doc.end();
}

exports.exportLaporan = async (req, res) => {
    try {
        const modul = String(req.query.modul || 'semua');
        const jenis = String(req.query.jenis || 'rekap');
        const format = String(req.query.format || 'pdf');
        if (modul !== 'semua' && !MODULES[modul]) return res.status(400).json({ message: 'Modul tidak valid.' });
        if (!['rekap', 'detail'].includes(jenis)) return res.status(400).json({ message: 'Jenis laporan tidak valid.' });
        if (!['pdf', 'excel'].includes(format)) return res.status(400).json({ message: 'Format laporan tidak valid.' });
        const scope = await getScope(req);
        if (scope.status) return res.status(scope.status).json({ message: scope.message });
        const keys = (modul === 'semua' ? Object.keys(MODULES) : [modul]).filter((key) => scope.isAdmin || scope.permissions.has(MODULES[key].permission));
        if (!keys.length || (modul !== 'semua' && keys[0] !== modul)) return res.status(403).json({ message: 'Anda tidak memiliki izin untuk laporan ini.' });
        const schema = await getSchema();
        const report = await readReport(schema, keys, scope, jenis);
        if (format === 'excel') return await writeExcel(res, report, scope, jenis);
        return await writePDF(res, report, scope, jenis);
    } catch (error) {
        console.error('Laporan ekspor error:', error);
        if (res.headersSent) return res.end();
        return res.status(error.status || 500).json({ message: error.status ? error.message : 'Gagal membuat laporan. Periksa log backend.' });
    }
};
