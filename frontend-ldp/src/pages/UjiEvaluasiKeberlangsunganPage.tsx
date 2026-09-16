import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type BiaItem = {
  id: number;
  kode_prioritas: string;
  nama_layanan: string;
};

type InsidenItem = {
  id: number;
  bia_id: number;
  nama_insiden: string;
  jenis_kejadian: string | null;
  kategori_dampak: string | null;
  kode_prioritas?: string;
  nama_layanan?: string;
};

type StrategiItem = {
  id: number;
  insiden_id: number;
  nomor_skenario: number;
  kategori: string;
  metode_pemulihan: string;
  nama_insiden: string;
};

type UjiItem = {
  id: number;
  insiden_id: number;
  strategi_id: number | null;
  jenis_kejadian: string | null;
  tujuan_uji: string | null;
  jenis_uji: string | null;
  tanggal_uji: string | null;
  kriteria_keberhasilan: string | null;
  judul_skenario: string;
  target_rto: number | null;
  nama_insiden: string;
  kategori_dampak: string | null;
  nomor_skenario: number | null;
  kategori_strategi: string | null;
  metode_pemulihan: string | null;
  kode_prioritas: string;
  nama_layanan: string;
};

type EvaluasiItem = {
  id: number;
  uji_id: number;
  hasil_uji: string | null;
  pembelajaran: string | null;
  kendala: string | null;
  rekomendasi_perbaikan: string | null;
  jenis_perbaikan: string | null;
  penanggung_jawab_id: number | null;
  target_waktu: string | null;
  status: string | null;
  catatan: string | null;
  insiden_id: number;
  strategi_id: number | null;
  jenis_uji: string | null;
  tanggal_uji: string | null;
  judul_skenario: string;
  target_rto: number | null;
  nama_insiden: string;
  kode_prioritas: string;
  nama_layanan: string;
};

type UserOption = {
  id: number;
  nama: string;
  email: string;
  role: string;
  pegawai_id: number | null;
  nip: string | null;
  jabatan: string | null;
};

type UjiForm = {
  insiden_id: string;
  strategi_id: string;
  jenis_kejadian: string;
  tujuan_uji: string;
  jenis_uji: string;
  tanggal_uji: string;
  kriteria_keberhasilan: string;
  judul_skenario: string;
  target_rto: string;
};

type EvaluasiForm = {
  uji_id: string;
  hasil_uji: string;
  pembelajaran: string;
  kendala: string;
  rekomendasi_perbaikan: string;
  jenis_perbaikan: string;
  penanggung_jawab_id: string;
  target_waktu: string;
  status: string;
  catatan: string;
};

const emptyUjiForm: UjiForm = {
  insiden_id: '',
  strategi_id: '',
  jenis_kejadian: '',
  tujuan_uji: '',
  jenis_uji: '',
  tanggal_uji: '',
  kriteria_keberhasilan: '',
  judul_skenario: '',
  target_rto: '',
};

const emptyEvaluasiForm: EvaluasiForm = {
  uji_id: '',
  hasil_uji: '',
  pembelajaran: '',
  kendala: '',
  rekomendasi_perbaikan: '',
  jenis_perbaikan: '',
  penanggung_jawab_id: '',
  target_waktu: '',
  status: 'Belum Dimulai',
  catatan: '',
};

const processSteps = [
  { number: 1, label: 'Penetapan Konteks', route: '/keberlangsungan/penetapan-konteks' },
  { number: 2, label: 'Analisis Dampak Bisnis', route: '/keberlangsungan/analisis-dampak-bisnis' },
  { number: 3, label: 'Strategi Keberlangsungan', route: '/keberlangsungan/strategi' },
  { number: 4, label: 'Ujicoba & Evaluasi', route: '/keberlangsungan/uji-evaluasi' },
];

const UjiEvaluasiKeberlangsunganPage = () => {
  const navigate = useNavigate();

  const [bia, setBia] = useState<BiaItem[]>([]);
  const [insiden, setInsiden] = useState<InsidenItem[]>([]);
  const [strategi, setStrategi] = useState<StrategiItem[]>([]);
  const [uji, setUji] = useState<UjiItem[]>([]);
  const [evaluasi, setEvaluasi] = useState<EvaluasiItem[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  const [ujiForm, setUjiForm] = useState<UjiForm>(emptyUjiForm);
  const [evaluasiForm, setEvaluasiForm] = useState<EvaluasiForm>(emptyEvaluasiForm);

  const [editingUjiId, setEditingUjiId] = useState<number | null>(null);
  const [editingEvaluasiId, setEditingEvaluasiId] = useState<number | null>(null);
  const [showUjiForm, setShowUjiForm] = useState(false);
  const [showEvaluasiForm, setShowEvaluasiForm] = useState(false);

  const [searchUji, setSearchUji] = useState('');
  const [searchEvaluasi, setSearchEvaluasi] = useState('');
  const [loading, setLoading] = useState(true);
  const [savingUji, setSavingUji] = useState(false);
  const [savingEvaluasi, setSavingEvaluasi] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500';
  const labelClass = 'text-sm font-medium text-slate-700';

  const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Terjadi kesalahan saat memproses data.');

    return result;
  };

  const fetchBia = async () => {
    const result = await request('http://localhost:5000/api/bcp/bia');
    const rows = Array.isArray(result.data) ? result.data : [];
    setBia(rows);
    return rows as BiaItem[];
  };

  const fetchInsiden = async (biaRows: BiaItem[]) => {
    const results = await Promise.all(
      biaRows.map(async (item) => {
        try {
          const result = await request(`http://localhost:5000/api/bcp/bia/${item.id}/insiden`);

          return (Array.isArray(result.data) ? result.data : []).map((row: InsidenItem) => ({
            ...row,
            kode_prioritas: item.kode_prioritas,
            nama_layanan: item.nama_layanan,
          }));
        } catch {
          return [];
        }
      })
    );

    const rows = results.flat();
    setInsiden(rows);
    return rows as InsidenItem[];
  };

  const fetchStrategi = async (insidenRows: InsidenItem[]) => {
    const results = await Promise.all(
      insidenRows.map(async (item) => {
        try {
          const result = await request(`http://localhost:5000/api/bcp/insiden/${item.id}/strategi`);
          return Array.isArray(result.data) ? result.data : [];
        } catch {
          return [];
        }
      })
    );

    const rows = results.flat();
    setStrategi(rows);
    return rows as StrategiItem[];
  };

  const fetchUji = async (insidenRows: InsidenItem[]) => {
    const results = await Promise.all(
      insidenRows.map(async (item) => {
        try {
          const result = await request(`http://localhost:5000/api/bcp/insiden/${item.id}/uji`);
          return Array.isArray(result.data) ? result.data : [];
        } catch {
          return [];
        }
      })
    );

    const rows = results.flat();
    setUji(rows);
    return rows as UjiItem[];
  };

  const fetchEvaluasi = async (ujiRows: UjiItem[]) => {
    const results = await Promise.all(
      ujiRows.map(async (item) => {
        try {
          const result = await request(`http://localhost:5000/api/bcp/uji/${item.id}/evaluasi`);
          return Array.isArray(result.data) ? result.data : [];
        } catch {
          return [];
        }
      })
    );

    setEvaluasi(results.flat());
  };

  const fetchUserOptions = async () => {
    const result = await request('http://localhost:5000/api/bcp/user-options');
    setUserOptions(Array.isArray(result.data) ? result.data : []);
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      setError('');

      const biaRows = await fetchBia();
      const insidenRows = await fetchInsiden(biaRows);
      await fetchStrategi(insidenRows);
      const ujiRows = await fetchUji(insidenRows);
      await fetchEvaluasi(ujiRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data uji coba dan evaluasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
    fetchUserOptions().catch((err) => setError(err instanceof Error ? err.message : 'Gagal mengambil daftar pengguna.'));
  }, []);

  const filteredUji = useMemo(() => {
    const keyword = searchUji.trim().toLowerCase();

    if (!keyword) return uji;

    return uji.filter((item) =>
      [
        item.kode_prioritas,
        item.nama_layanan,
        item.nama_insiden,
        item.judul_skenario,
        item.jenis_kejadian,
        item.jenis_uji,
        item.tanggal_uji,
      ].some((value) => value?.toString().toLowerCase().includes(keyword))
    );
  }, [uji, searchUji]);

  const filteredEvaluasi = useMemo(() => {
    const keyword = searchEvaluasi.trim().toLowerCase();

    if (!keyword) return evaluasi;

    return evaluasi.filter((item) =>
      [
        item.kode_prioritas,
        item.nama_layanan,
        item.nama_insiden,
        item.judul_skenario,
        item.hasil_uji,
        item.jenis_perbaikan,
        item.status,
      ].some((value) => value?.toString().toLowerCase().includes(keyword))
    );
  }, [evaluasi, searchEvaluasi]);

  const strategiUntukInsiden = useMemo(() => {
    if (!ujiForm.insiden_id) return [];
    return strategi.filter((item) => item.insiden_id === Number(ujiForm.insiden_id));
  }, [strategi, ujiForm.insiden_id]);

  const handleTambahUji = () => {
    setEditingUjiId(null);
    setUjiForm(emptyUjiForm);
    setMessage('');
    setError('');
    setShowUjiForm(true);
  };

  const handleEditUji = (item: UjiItem) => {
    setEditingUjiId(item.id);
    setUjiForm({
      insiden_id: String(item.insiden_id),
      strategi_id: item.strategi_id ? String(item.strategi_id) : '',
      jenis_kejadian: item.jenis_kejadian || '',
      tujuan_uji: item.tujuan_uji || '',
      jenis_uji: item.jenis_uji || '',
      tanggal_uji: item.tanggal_uji?.slice(0, 10) || '',
      kriteria_keberhasilan: item.kriteria_keberhasilan || '',
      judul_skenario: item.judul_skenario,
      target_rto: item.target_rto === null ? '' : String(item.target_rto),
    });
    setError('');
    setMessage('');
    setShowUjiForm(true);
  };

  const resetUjiForm = () => {
    setEditingUjiId(null);
    setUjiForm(emptyUjiForm);
    setShowUjiForm(false);
  };

  const handleSubmitUji = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingUjiId && !ujiForm.insiden_id) {
      setError('Insiden / gangguan wajib dipilih.');
      return;
    }

    if (!ujiForm.judul_skenario.trim()) {
      setError('Judul skenario wajib diisi.');
      return;
    }

    if (ujiForm.target_rto !== '' && (!Number.isInteger(Number(ujiForm.target_rto)) || Number(ujiForm.target_rto) < 0)) {
      setError('Target RTO harus berupa bilangan bulat 0 atau lebih.');
      return;
    }

    try {
      setSavingUji(true);
      setMessage('');
      setError('');

      const payload = {
        strategi_id: ujiForm.strategi_id ? Number(ujiForm.strategi_id) : null,
        jenis_kejadian: ujiForm.jenis_kejadian.trim() || null,
        tujuan_uji: ujiForm.tujuan_uji.trim() || null,
        jenis_uji: ujiForm.jenis_uji.trim() || null,
        tanggal_uji: ujiForm.tanggal_uji || null,
        kriteria_keberhasilan: ujiForm.kriteria_keberhasilan.trim() || null,
        judul_skenario: ujiForm.judul_skenario.trim(),
        target_rto: ujiForm.target_rto === '' ? null : Number(ujiForm.target_rto),
      };

      const result = await request(
        editingUjiId
          ? `http://localhost:5000/api/bcp/uji/${editingUjiId}`
          : `http://localhost:5000/api/bcp/insiden/${ujiForm.insiden_id}/uji`,
        {
          method: editingUjiId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Data uji coba berhasil disimpan.');
      resetUjiForm();
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data uji coba.');
    } finally {
      setSavingUji(false);
    }
  };

  const handleDeleteUji = async (item: UjiItem) => {
    if (!window.confirm(`Hapus uji coba "${item.judul_skenario}"?`)) return;

    try {
      setError('');
      setMessage('');
      const result = await request(`http://localhost:5000/api/bcp/uji/${item.id}`, { method: 'DELETE' });
      setMessage(result.message || 'Data uji coba berhasil dihapus.');
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data uji coba.');
    }
  };

  const handleTambahEvaluasi = () => {
    setEditingEvaluasiId(null);
    setEvaluasiForm(emptyEvaluasiForm);
    setError('');
    setMessage('');
    setShowEvaluasiForm(true);
  };

  const handleEditEvaluasi = (item: EvaluasiItem) => {
    setEditingEvaluasiId(item.id);
    setEvaluasiForm({
      uji_id: String(item.uji_id),
      hasil_uji: item.hasil_uji || '',
      pembelajaran: item.pembelajaran || '',
      kendala: item.kendala || '',
      rekomendasi_perbaikan: item.rekomendasi_perbaikan || '',
      jenis_perbaikan: item.jenis_perbaikan || '',
      penanggung_jawab_id: item.penanggung_jawab_id ? String(item.penanggung_jawab_id) : '',
      target_waktu: item.target_waktu?.slice(0, 10) || '',
      status: item.status || 'Belum Dimulai',
      catatan: item.catatan || '',
    });
    setError('');
    setMessage('');
    setShowEvaluasiForm(true);
  };

  const resetEvaluasiForm = () => {
    setEditingEvaluasiId(null);
    setEvaluasiForm(emptyEvaluasiForm);
    setShowEvaluasiForm(false);
  };

  const handleSubmitEvaluasi = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingEvaluasiId && !evaluasiForm.uji_id) {
      setError('Skenario uji wajib dipilih.');
      return;
    }

    try {
      setSavingEvaluasi(true);
      setMessage('');
      setError('');

      const payload = {
        hasil_uji: evaluasiForm.hasil_uji.trim() || null,
        pembelajaran: evaluasiForm.pembelajaran.trim() || null,
        kendala: evaluasiForm.kendala.trim() || null,
        rekomendasi_perbaikan: evaluasiForm.rekomendasi_perbaikan.trim() || null,
        jenis_perbaikan: evaluasiForm.jenis_perbaikan.trim() || null,
        penanggung_jawab_id: evaluasiForm.penanggung_jawab_id ? Number(evaluasiForm.penanggung_jawab_id) : null,
        target_waktu: evaluasiForm.target_waktu || null,
        status: evaluasiForm.status,
        catatan: evaluasiForm.catatan.trim() || null,
      };

      const result = await request(
        editingEvaluasiId
          ? `http://localhost:5000/api/bcp/evaluasi/${editingEvaluasiId}`
          : `http://localhost:5000/api/bcp/uji/${evaluasiForm.uji_id}/evaluasi`,
        {
          method: editingEvaluasiId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Data evaluasi berhasil disimpan.');
      resetEvaluasiForm();
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data evaluasi.');
    } finally {
      setSavingEvaluasi(false);
    }
  };

  const handleDeleteEvaluasi = async (item: EvaluasiItem) => {
    if (!window.confirm(`Hapus evaluasi untuk "${item.judul_skenario}"?`)) return;

    try {
      setError('');
      setMessage('');
      const result = await request(`http://localhost:5000/api/bcp/evaluasi/${item.id}`, { method: 'DELETE' });
      setMessage(result.message || 'Data evaluasi berhasil dihapus.');
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data evaluasi.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Keberlangsungan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 4 - Ujicoba & Evaluasi
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 4;

            return (
              <div key={step.number} className="flex flex-1 items-start">
                <button type="button" onClick={() => navigate(step.route)} className="flex min-w-[120px] flex-col items-center text-center">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${active ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-300 bg-white text-slate-500'}`}>
                    {step.number}
                  </div>

                  <span className={`mt-2 text-xs ${active ? 'font-semibold text-slate-800' : 'text-slate-500'}`}>
                    {step.label}
                  </span>
                </button>

                {index < processSteps.length - 1 && <div className="mt-[18px] h-px flex-1 bg-slate-200" />}
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 12 - Uji Coba Manajemen Keberlangsungan Bisnis
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pelaksanaan simulasi atau pengujian skenario pemulihan layanan.
            </p>
          </div>

          <button type="button" onClick={handleTambahUji} disabled={insiden.length === 0} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            Tambah Uji Coba
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <input type="text" value={searchUji} onChange={(event) => setSearchUji(event.target.value)} placeholder="Cari layanan, insiden, skenario, atau jenis uji..." className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
        </div>

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1300px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">No</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Layanan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Insiden</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Judul Skenario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Jenis Uji</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Tanggal</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Target RTO</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredUji.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    Belum ada data uji coba.
                  </td>
                </tr>
              ) : (
                filteredUji.map((item, index) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="font-medium">{item.kode_prioritas}</div>
                      <div className="mt-1 text-xs text-slate-500">{item.nama_layanan}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{item.nama_insiden}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{item.judul_skenario}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.jenis_uji || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.tanggal_uji?.slice(0, 10) || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{item.target_rto === null ? '-' : item.target_rto}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button type="button" onClick={() => handleEditUji(item)} className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
                          Edit
                        </button>

                        <button type="button" onClick={() => handleDeleteUji(item)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 13 - Pembelajaran yang Didapat
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Evaluasi hasil uji coba, pembelajaran, kendala, dan tindak lanjut perbaikan.
            </p>
          </div>

          <button type="button" onClick={handleTambahEvaluasi} disabled={uji.length === 0} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
            Tambah Evaluasi
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <input type="text" value={searchEvaluasi} onChange={(event) => setSearchEvaluasi(event.target.value)} placeholder="Cari layanan, skenario uji, hasil, atau status..." className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
        </div>

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1400px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Layanan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Skenario Uji</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Hasil Uji</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Jenis Perbaikan</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Penanggung Jawab</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Target</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Status</th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">Aksi</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredEvaluasi.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                    Belum ada data evaluasi.
                  </td>
                </tr>
              ) : (
                filteredEvaluasi.map((item) => {
                  const user = userOptions.find((row) => row.id === item.penanggung_jawab_id);

                  return (
                    <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium">{item.kode_prioritas}</div>
                        <div className="mt-1 text-xs text-slate-500">{item.nama_layanan}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{item.judul_skenario}</td>
                      <td className="max-w-[300px] px-4 py-3 text-sm text-slate-600">{item.hasil_uji || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.jenis_perbaikan || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{user?.nama || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.target_waktu?.slice(0, 10) || '-'}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{item.status || '-'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button type="button" onClick={() => handleEditEvaluasi(item)} className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50">
                            Edit
                          </button>

                          <button type="button" onClick={() => handleDeleteEvaluasi(item)} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50">
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showUjiForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingUjiId ? 'Edit Uji Coba' : 'Tambah Uji Coba'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 12 Manajemen Keberlangsungan Bisnis
                </p>
              </div>

              <button type="button" onClick={resetUjiForm} className="text-xl text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitUji} className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Insiden / Gangguan Potensial</label>
                  <select required={!editingUjiId} disabled={editingUjiId !== null} value={ujiForm.insiden_id} onChange={(event) => {
                    const selected = insiden.find((item) => item.id === Number(event.target.value));

                    setUjiForm((prev) => ({
                      ...prev,
                      insiden_id: event.target.value,
                      strategi_id: '',
                      jenis_kejadian: selected?.jenis_kejadian || '',
                    }));
                  }} className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}>
                    <option value="">Pilih insiden / gangguan</option>
                    {insiden.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.kode_prioritas} - {item.nama_insiden}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Strategi / Skenario Pemulihan</label>
                  <select value={ujiForm.strategi_id} onChange={(event) => setUjiForm((prev) => ({ ...prev, strategi_id: event.target.value }))} className={inputClass}>
                    <option value="">Tanpa strategi terkait</option>
                    {strategiUntukInsiden.map((item) => (
                      <option key={item.id} value={item.id}>
                        Skenario {item.nomor_skenario} - {item.kategori} - {item.metode_pemulihan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Jenis Kejadian</label>
                  <input type="text" maxLength={100} value={ujiForm.jenis_kejadian} onChange={(event) => setUjiForm((prev) => ({ ...prev, jenis_kejadian: event.target.value }))} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Jenis Uji</label>
                  <select value={ujiForm.jenis_uji} onChange={(event) => setUjiForm((prev) => ({ ...prev, jenis_uji: event.target.value }))} className={inputClass}>
                    <option value="">Pilih jenis uji</option>
                    <option value="Tabletop">Tabletop</option>
                    <option value="Simulasi">Simulasi</option>
                    <option value="Full Test">Full Test</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Tujuan Uji</label>
                  <textarea rows={3} value={ujiForm.tujuan_uji} onChange={(event) => setUjiForm((prev) => ({ ...prev, tujuan_uji: event.target.value }))} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Tanggal Uji</label>
                  <input type="date" value={ujiForm.tanggal_uji} onChange={(event) => setUjiForm((prev) => ({ ...prev, tanggal_uji: event.target.value }))} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Target RTO</label>
                  <input type="number" min="0" step="1" value={ujiForm.target_rto} onChange={(event) => setUjiForm((prev) => ({ ...prev, target_rto: event.target.value }))} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Judul Skenario</label>
                  <input type="text" maxLength={200} required value={ujiForm.judul_skenario} onChange={(event) => setUjiForm((prev) => ({ ...prev, judul_skenario: event.target.value }))} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Kriteria Keberhasilan</label>
                  <textarea rows={3} value={ujiForm.kriteria_keberhasilan} onChange={(event) => setUjiForm((prev) => ({ ...prev, kriteria_keberhasilan: event.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={resetUjiForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Batal
                </button>

                <button type="submit" disabled={savingUji} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                  {savingUji ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEvaluasiForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingEvaluasiId ? 'Edit Evaluasi' : 'Tambah Evaluasi'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 13 Pembelajaran yang Didapat
                </p>
              </div>

              <button type="button" onClick={resetEvaluasiForm} className="text-xl text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitEvaluasi} className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>Kode Referensi / Skenario Uji</label>
                  <select required={!editingEvaluasiId} disabled={editingEvaluasiId !== null} value={evaluasiForm.uji_id} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, uji_id: event.target.value }))} className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}>
                    <option value="">Pilih skenario uji</option>
                    {uji.map((item) => (
                      <option key={item.id} value={item.id}>
                        UJI-{String(item.id).padStart(3, '0')} - {item.judul_skenario}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Hasil Uji / Ringkasan</label>
                  <textarea rows={3} value={evaluasiForm.hasil_uji} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, hasil_uji: event.target.value }))} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Pembelajaran yang Didapat</label>
                  <textarea rows={3} value={evaluasiForm.pembelajaran} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, pembelajaran: event.target.value }))} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Kendala / Hambatan Selama Uji Coba</label>
                  <textarea rows={3} value={evaluasiForm.kendala} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, kendala: event.target.value }))} className={inputClass} />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Rekomendasi Perbaikan</label>
                  <textarea rows={3} value={evaluasiForm.rekomendasi_perbaikan} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, rekomendasi_perbaikan: event.target.value }))} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Jenis Perbaikan</label>
                  <select value={evaluasiForm.jenis_perbaikan} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, jenis_perbaikan: event.target.value }))} className={inputClass}>
                    <option value="">Pilih jenis perbaikan</option>
                    <option value="Prosedur">Prosedur</option>
                    <option value="Teknologi">Teknologi</option>
                    <option value="Sumber Daya Manusia">Sumber Daya Manusia</option>
                    <option value="Sarana dan Prasarana">Sarana dan Prasarana</option>
                    <option value="Koordinasi">Koordinasi</option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Penanggung Jawab</label>
                  <select value={evaluasiForm.penanggung_jawab_id} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, penanggung_jawab_id: event.target.value }))} className={inputClass}>
                    <option value="">Pilih penanggung jawab</option>
                    {userOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nama}{item.jabatan ? ` - ${item.jabatan}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Target Waktu</label>
                  <input type="date" value={evaluasiForm.target_waktu} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, target_waktu: event.target.value }))} className={inputClass} />
                </div>

                <div>
                  <label className={labelClass}>Status</label>
                  <select value={evaluasiForm.status} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, status: event.target.value }))} className={inputClass}>
                    <option value="Belum Dimulai">Belum Dimulai</option>
                    <option value="Dalam Proses">Dalam Proses</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Ditunda">Ditunda</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>Catatan</label>
                  <textarea rows={3} value={evaluasiForm.catatan} onChange={(event) => setEvaluasiForm((prev) => ({ ...prev, catatan: event.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={resetEvaluasiForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Batal
                </button>

                <button type="submit" disabled={savingEvaluasi} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50">
                  {savingEvaluasi ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UjiEvaluasiKeberlangsunganPage;