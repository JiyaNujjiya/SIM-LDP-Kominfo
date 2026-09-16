import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type BiaItem = {
  id: number;
  layanan_prioritas_id: number;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
};

type InsidenItem = {
  id: number;
  bia_id: number;
  nama_insiden: string;
  jenis_kejadian: string | null;
  kategori_dampak: string | null;
  deskripsi: string | null;
  kode_prioritas?: string;
  nama_layanan?: string;
};

type StrategiItem = {
  id: number;
  insiden_id: number;
  nomor_skenario: number;
  kategori: 'BCP' | 'DRP';
  metode_pemulihan: string;
  deskripsi_strategi: string | null;
  bia_id: number;
  nama_insiden: string;
  jenis_kejadian: string | null;
  kategori_dampak: string | null;
  layanan_prioritas_id: number;
  kode_prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
};

type LangkahItem = {
  id: number;
  strategi_id: number;
  urutan: number;
  nama_langkah: string;
  deskripsi: string | null;
  insiden_id: number;
  nomor_skenario: number;
  kategori: 'BCP' | 'DRP';
  metode_pemulihan: string;
  bia_id: number;
  nama_insiden: string;
  jenis_kejadian: string | null;
  layanan_prioritas_id: number;
  kode_prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
};

type StrategiForm = {
  insiden_id: string;
  nomor_skenario: string;
  kategori: string;
  metode_pemulihan: string;
  deskripsi_strategi: string;
};

type LangkahForm = {
  strategi_id: string;
  urutan: string;
  nama_langkah: string;
  deskripsi: string;
};

const emptyStrategiForm: StrategiForm = {
  insiden_id: '',
  nomor_skenario: '',
  kategori: '',
  metode_pemulihan: '',
  deskripsi_strategi: '',
};

const emptyLangkahForm: LangkahForm = {
  strategi_id: '',
  urutan: '',
  nama_langkah: '',
  deskripsi: '',
};

const processSteps = [
  {
    number: 1,
    label: 'Penetapan Konteks',
    route: '/keberlangsungan/penetapan-konteks',
  },
  {
    number: 2,
    label: 'Analisis Dampak Bisnis',
    route: '/keberlangsungan/analisis-dampak-bisnis',
  },
  {
    number: 3,
    label: 'Strategi Keberlangsungan',
    route: '/keberlangsungan/strategi',
  },
  {
    number: 4,
    label: 'Ujicoba & Evaluasi',
    route: '/keberlangsungan/uji-evaluasi',
  },
];

const StrategiKeberlangsunganPage = () => {
  const navigate = useNavigate();

  const [bia, setBia] = useState<BiaItem[]>([]);
  const [insiden, setInsiden] = useState<InsidenItem[]>([]);
  const [strategi, setStrategi] = useState<StrategiItem[]>([]);
  const [langkah, setLangkah] = useState<LangkahItem[]>([]);

  const [searchStrategi, setSearchStrategi] = useState('');
  const [searchLangkah, setSearchLangkah] = useState('');

  const [strategiForm, setStrategiForm] = useState<StrategiForm>(emptyStrategiForm);
  const [langkahForm, setLangkahForm] = useState<LangkahForm>(emptyLangkahForm);

  const [editingStrategiId, setEditingStrategiId] = useState<number | null>(null);
  const [editingLangkahId, setEditingLangkahId] = useState<number | null>(null);

  const [showStrategiForm, setShowStrategiForm] = useState(false);
  const [showLangkahForm, setShowLangkahForm] = useState(false);

  const [selectedStrategi, setSelectedStrategi] = useState<StrategiItem | null>(null);
  const [showStrategiDetail, setShowStrategiDetail] = useState(false);

  const [loading, setLoading] = useState(true);
  const [savingStrategi, setSavingStrategi] = useState(false);
  const [savingLangkah, setSavingLangkah] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500';
  const labelClass = 'text-sm font-medium text-slate-700';

  const getToken = () => sessionStorage.getItem('token');

  const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Terjadi kesalahan saat memproses data.');
    }

    return result;
  };

  const fetchBia = async () => {
    const result = await request('http://localhost:5000/api/bcp/bia');
    const rows = Array.isArray(result.data) ? result.data : [];
    setBia(rows);
    return rows as BiaItem[];
  };

  const fetchInsiden = async (biaRows?: BiaItem[]) => {
    const source = biaRows || bia;

    if (source.length === 0) {
      setInsiden([]);
      return [];
    }

    const results = await Promise.all(
      source.map(async (item) => {
        try {
          const result = await request(`http://localhost:5000/api/bcp/bia/${item.id}/insiden`);
          const rows = Array.isArray(result.data) ? result.data : [];

          return rows.map((row: InsidenItem) => ({
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
    return rows;
  };

  const fetchStrategi = async (insidenRows?: InsidenItem[]) => {
    const source = insidenRows || insiden;

    if (source.length === 0) {
      setStrategi([]);
      return [];
    }

    const results = await Promise.all(
      source.map(async (item) => {
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

  const fetchLangkah = async (strategiRows?: StrategiItem[]) => {
    const source = strategiRows || strategi;

    if (source.length === 0) {
      setLangkah([]);
      return [];
    }

    const results = await Promise.all(
      source.map(async (item) => {
        try {
          const result = await request(`http://localhost:5000/api/bcp/strategi/${item.id}/langkah`);
          return Array.isArray(result.data) ? result.data : [];
        } catch {
          return [];
        }
      })
    );

    const rows = results.flat();
    setLangkah(rows);
    return rows as LangkahItem[];
  };

  const refreshAll = async () => {
    try {
      setLoading(true);
      setError('');
      const biaRows = await fetchBia();
      const insidenRows = await fetchInsiden(biaRows);
      const strategiRows = await fetchStrategi(insidenRows);
      await fetchLangkah(strategiRows);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data Strategi Keberlangsungan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshAll();
  }, []);

  const filteredStrategi = useMemo(() => {
    const keyword = searchStrategi.trim().toLowerCase();

    if (!keyword) return strategi;

    return strategi.filter((item) =>
      [
        item.kode_prioritas,
        item.nama_layanan,
        item.nama_insiden,
        item.jenis_kejadian,
        item.nomor_skenario,
        item.kategori,
        item.metode_pemulihan,
        item.deskripsi_strategi,
      ].some((value) => value?.toString().toLowerCase().includes(keyword))
    );
  }, [strategi, searchStrategi]);

  const filteredLangkah = useMemo(() => {
    const keyword = searchLangkah.trim().toLowerCase();

    if (!keyword) return langkah;

    return langkah.filter((item) =>
      [
        item.kode_prioritas,
        item.nama_layanan,
        item.nama_insiden,
        item.nomor_skenario,
        item.kategori,
        item.urutan,
        item.nama_langkah,
        item.deskripsi,
      ].some((value) => value?.toString().toLowerCase().includes(keyword))
    );
  }, [langkah, searchLangkah]);

  const availableScenarioNumbers = useMemo(() => {
    if (!strategiForm.insiden_id) return [1, 2, 3];

    return [1, 2, 3].filter((number) => {
      return !strategi.some((item) => item.insiden_id === Number(strategiForm.insiden_id) && item.nomor_skenario === number && item.id !== editingStrategiId);
    });
  }, [strategi, strategiForm.insiden_id, editingStrategiId]);

  const handleTambahStrategi = () => {
    setEditingStrategiId(null);
    setStrategiForm(emptyStrategiForm);
    setMessage('');
    setError('');
    setShowStrategiForm(true);
  };

  const handleEditStrategi = (item: StrategiItem) => {
    setEditingStrategiId(item.id);
    setStrategiForm({
      insiden_id: String(item.insiden_id),
      nomor_skenario: String(item.nomor_skenario),
      kategori: item.kategori,
      metode_pemulihan: item.metode_pemulihan,
      deskripsi_strategi: item.deskripsi_strategi || '',
    });
    setMessage('');
    setError('');
    setShowStrategiForm(true);
  };

  const handleDetailStrategi = (item: StrategiItem) => {
    setSelectedStrategi(item);
    setShowStrategiDetail(true);
  };

  const resetStrategiForm = () => {
    setEditingStrategiId(null);
    setStrategiForm(emptyStrategiForm);
    setShowStrategiForm(false);
  };

  const handleSubmitStrategi = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingStrategiId && !strategiForm.insiden_id) {
      setError('Insiden / gangguan wajib dipilih.');
      return;
    }

    if (!strategiForm.nomor_skenario || !strategiForm.kategori || !strategiForm.metode_pemulihan.trim()) {
      setError('Skenario, kategori, dan metode pemulihan wajib diisi.');
      return;
    }

    try {
      setSavingStrategi(true);
      setMessage('');
      setError('');

      const payload = {
        nomor_skenario: Number(strategiForm.nomor_skenario),
        kategori: strategiForm.kategori,
        metode_pemulihan: strategiForm.metode_pemulihan.trim(),
        deskripsi_strategi: strategiForm.deskripsi_strategi.trim() || null,
      };

      const result = await request(
        editingStrategiId
          ? `http://localhost:5000/api/bcp/strategi/${editingStrategiId}`
          : `http://localhost:5000/api/bcp/insiden/${strategiForm.insiden_id}/strategi`,
        {
          method: editingStrategiId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Strategi pemulihan berhasil disimpan.');
      resetStrategiForm();
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan strategi pemulihan.');
    } finally {
      setSavingStrategi(false);
    }
  };

  const handleDeleteStrategi = async (item: StrategiItem) => {
    if (!window.confirm(`Hapus Skenario ${item.nomor_skenario} untuk insiden "${item.nama_insiden}"?`)) return;

    try {
      setMessage('');
      setError('');
      const result = await request(`http://localhost:5000/api/bcp/strategi/${item.id}`, { method: 'DELETE' });
      setMessage(result.message || 'Strategi pemulihan berhasil dihapus.');
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus strategi pemulihan.');
    }
  };

  const handleTambahLangkah = () => {
    setEditingLangkahId(null);
    setLangkahForm(emptyLangkahForm);
    setMessage('');
    setError('');
    setShowLangkahForm(true);
  };

  const handleEditLangkah = (item: LangkahItem) => {
    setEditingLangkahId(item.id);
    setLangkahForm({
      strategi_id: String(item.strategi_id),
      urutan: String(item.urutan),
      nama_langkah: item.nama_langkah,
      deskripsi: item.deskripsi || '',
    });
    setMessage('');
    setError('');
    setShowLangkahForm(true);
  };

  const resetLangkahForm = () => {
    setEditingLangkahId(null);
    setLangkahForm(emptyLangkahForm);
    setShowLangkahForm(false);
  };

  const handleSubmitLangkah = async (event: FormEvent) => {
    event.preventDefault();

    if (!editingLangkahId && !langkahForm.strategi_id) {
      setError('Strategi / skenario wajib dipilih.');
      return;
    }

    if (!langkahForm.urutan || Number(langkahForm.urutan) <= 0 || !langkahForm.nama_langkah.trim()) {
      setError('Urutan dan nama langkah wajib diisi.');
      return;
    }

    try {
      setSavingLangkah(true);
      setMessage('');
      setError('');

      const payload = {
        urutan: Number(langkahForm.urutan),
        nama_langkah: langkahForm.nama_langkah.trim(),
        deskripsi: langkahForm.deskripsi.trim() || null,
      };

      const result = await request(
        editingLangkahId
          ? `http://localhost:5000/api/bcp/langkah-pemulihan/${editingLangkahId}`
          : `http://localhost:5000/api/bcp/strategi/${langkahForm.strategi_id}/langkah`,
        {
          method: editingLangkahId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Langkah pemulihan berhasil disimpan.');
      resetLangkahForm();
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan langkah pemulihan.');
    } finally {
      setSavingLangkah(false);
    }
  };

  const handleDeleteLangkah = async (item: LangkahItem) => {
    if (!window.confirm(`Hapus langkah "${item.nama_langkah}"?`)) return;

    try {
      setMessage('');
      setError('');
      const result = await request(`http://localhost:5000/api/bcp/langkah-pemulihan/${item.id}`, { method: 'DELETE' });
      setMessage(result.message || 'Langkah pemulihan berhasil dihapus.');
      await refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus langkah pemulihan.');
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Keberlangsungan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 3 - Strategi Keberlangsungan Bisnis
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 3;

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

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Formulir 11 - Strategi / Langkah Pemulihan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Penyusunan skenario dan langkah pemulihan untuk insiden atau gangguan potensial.
          </p>
        </div>


          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  Daftar Strategi / Skenario Pemulihan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Setiap insiden dapat memiliki Skenario 1, Skenario 2, dan Skenario 3.
                </p>
              </div>

              <button type="button" onClick={handleTambahStrategi} disabled={insiden.length === 0} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                Tambah Strategi
              </button>
            </div>

            <div className="border-b border-slate-200 p-5">
              <input type="text" value={searchStrategi} onChange={(event) => setSearchStrategi(event.target.value)} placeholder="Cari layanan, insiden, skenario, kategori, atau metode..." className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
            </div>

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1300px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">No</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Layanan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Insiden</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Jenis Kejadian</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Skenario</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Kategori</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Metode Pemulihan</th>
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
                  ) : filteredStrategi.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-sm text-slate-500">
                        Belum ada strategi pemulihan.
                      </td>
                    </tr>
                  ) : (
                    filteredStrategi.map((item, index) => (
                      <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm text-slate-600">{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div className="font-medium">{item.kode_prioritas}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.nama_layanan}</div>
                        </td>
                        <td className="max-w-[260px] px-4 py-3 text-sm text-slate-700">{item.nama_insiden}</td>
                        <td className="px-4 py-3 text-sm text-slate-600">{item.jenis_kejadian || '-'}</td>
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">Skenario {item.nomor_skenario}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <span className="rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold">
                            {item.kategori}
                          </span>
                        </td>
                        <td className="max-w-[260px] px-4 py-3 text-sm text-slate-600">{item.metode_pemulihan}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => handleDetailStrategi(item)} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50">
                              Detail
                            </button>

                            <button type="button" onClick={() => handleEditStrategi(item)} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                              Edit
                            </button>

                            <button type="button" onClick={() => handleDeleteStrategi(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
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

          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  Langkah Pemulihan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Langkah pelaksanaan pemulihan untuk masing-masing skenario.
                </p>
              </div>

              <button type="button" onClick={handleTambahLangkah} disabled={strategi.length === 0} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                Tambah Langkah
              </button>
            </div>

            <div className="border-b border-slate-200 p-5">
              <input type="text" value={searchLangkah} onChange={(event) => setSearchLangkah(event.target.value)} placeholder="Cari layanan, insiden, skenario, atau langkah..." className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500" />
            </div>

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1200px] w-full">
                <thead className="bg-slate-50">
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Urutan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Layanan</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Insiden</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Skenario</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Nama Langkah</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">Deskripsi</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredLangkah.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                        Belum ada langkah pemulihan.
                      </td>
                    </tr>
                  ) : (
                    filteredLangkah.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                        <td className="px-4 py-3 text-sm font-semibold text-slate-700">{item.urutan}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          <div className="font-medium">{item.kode_prioritas}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.nama_layanan}</div>
                        </td>
                        <td className="max-w-[240px] px-4 py-3 text-sm text-slate-700">{item.nama_insiden}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          Skenario {item.nomor_skenario} - {item.kategori}
                        </td>
                        <td className="max-w-[260px] px-4 py-3 text-sm font-medium text-slate-700">{item.nama_langkah}</td>
                        <td className="max-w-[300px] px-4 py-3 text-sm text-slate-600">{item.deskripsi || '-'}</td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button type="button" onClick={() => handleEditLangkah(item)} className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100">
                              Edit
                            </button>

                            <button type="button" onClick={() => handleDeleteLangkah(item)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
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
      </div>

      {showStrategiForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingStrategiId ? 'Edit Strategi Pemulihan' : 'Tambah Strategi Pemulihan'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 11 Strategi Keberlangsungan Bisnis
                </p>
              </div>

              <button type="button" onClick={resetStrategiForm} className="text-xl text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitStrategi} className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Insiden / Gangguan Potensial
                  </label>

                  <select
                    required={!editingStrategiId}
                    disabled={editingStrategiId !== null}
                    value={strategiForm.insiden_id}
                    onChange={(event) =>
                      setStrategiForm((prev) => ({
                        ...prev,
                        insiden_id: event.target.value,
                        nomor_skenario: '',
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option value="">
                      Pilih insiden / gangguan
                    </option>

                    {editingStrategiId && (
                      <option value={strategiForm.insiden_id}>
                        {insiden.find((item) => item.id === Number(strategiForm.insiden_id))?.nama_insiden || strategiForm.insiden_id}
                      </option>
                    )}

                    {!editingStrategiId &&
                      insiden.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.kode_prioritas ? `${item.kode_prioritas} - ` : ''}
                          {item.nama_insiden}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Nomor Skenario
                  </label>

                  <select
                    required
                    value={strategiForm.nomor_skenario}
                    onChange={(event) =>
                      setStrategiForm((prev) => ({
                        ...prev,
                        nomor_skenario: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Pilih skenario
                    </option>

                    {availableScenarioNumbers.map((number) => (
                      <option key={number} value={number}>
                          Skenario {number}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Kategori
                  </label>

                  <select
                    required
                    value={strategiForm.kategori}
                    onChange={(event) =>
                      setStrategiForm((prev) => ({
                        ...prev,
                        kategori: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Pilih kategori
                    </option>
                    <option value="BCP">
                      BCP - Business Continuity Plan
                    </option>
                    <option value="DRP">
                      DRP - Disaster Recovery Plan
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Metode Pemulihan
                  </label>

                  <input
                    type="text"
                    required
                    maxLength={100}
                    value={strategiForm.metode_pemulihan}
                    onChange={(event) =>
                      setStrategiForm((prev) => ({
                        ...prev,
                        metode_pemulihan: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Failover ke server cadangan dan restore backup"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Deskripsi Strategi
                  </label>

                  <textarea
                    rows={4}
                    value={strategiForm.deskripsi_strategi}
                    onChange={(event) =>
                      setStrategiForm((prev) => ({
                        ...prev,
                        deskripsi_strategi: event.target.value,
                      }))
                    }
                    placeholder="Jelaskan strategi pemulihan pada skenario ini."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={resetStrategiForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Batal
                </button>

                <button type="submit" disabled={savingStrategi} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {savingStrategi ? 'Menyimpan...' : editingStrategiId ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showLangkahForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingLangkahId ? 'Edit Langkah Pemulihan' : 'Tambah Langkah Pemulihan'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 11 Strategi Keberlangsungan Bisnis
                </p>
              </div>

              <button type="button" onClick={resetLangkahForm} className="text-xl text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <form onSubmit={handleSubmitLangkah} className="p-6">
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Strategi / Skenario
                  </label>

                  <select
                    required={!editingLangkahId}
                    disabled={editingLangkahId !== null}
                    value={langkahForm.strategi_id}
                    onChange={(event) =>
                      setLangkahForm((prev) => ({
                        ...prev,
                        strategi_id: event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option value="">
                      Pilih strategi / skenario
                    </option>

                    {editingLangkahId && (
                      <option value={langkahForm.strategi_id}>
                        {(() => {
                          const item = strategi.find((row) => row.id === Number(langkahForm.strategi_id));
                          return item ? `${item.nama_insiden} - Skenario ${item.nomor_skenario} - ${item.kategori}` : langkahForm.strategi_id;
                        })()}
                      </option>
                    )}

                    {!editingLangkahId &&
                      strategi.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.kode_prioritas} - {item.nama_insiden} - Skenario {item.nomor_skenario} - {item.kategori}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Urutan
                  </label>

                  <input
                    type="number"
                    min="1"
                    step="1"
                    required
                    value={langkahForm.urutan}
                    onChange={(event) =>
                      setLangkahForm((prev) => ({
                        ...prev,
                        urutan: event.target.value,
                      }))
                    }
                    placeholder="Contoh: 1"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Nama Langkah
                  </label>

                  <input
                    type="text"
                    required
                    maxLength={200}
                    value={langkahForm.nama_langkah}
                    onChange={(event) =>
                      setLangkahForm((prev) => ({
                        ...prev,
                        nama_langkah: event.target.value,
                      }))
                    }
                    placeholder="Contoh: Aktivasi server cadangan"
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Deskripsi
                  </label>

                  <textarea
                    rows={4}
                    value={langkahForm.deskripsi}
                    onChange={(event) =>
                      setLangkahForm((prev) => ({
                        ...prev,
                        deskripsi: event.target.value,
                      }))
                    }
                    placeholder="Jelaskan proses pelaksanaan langkah pemulihan."
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button type="button" onClick={resetLangkahForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Batal
                </button>

                <button type="submit" disabled={savingLangkah} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                  {savingLangkah ? 'Menyimpan...' : editingLangkahId ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showStrategiDetail && selectedStrategi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Detail Strategi Pemulihan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedStrategi.kode_prioritas} - {selectedStrategi.nama_layanan}
                </p>
              </div>

              <button type="button" onClick={() => setShowStrategiDetail(false)} className="text-xl text-slate-400 hover:text-slate-600">
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <DetailField label="Insiden / Gangguan" value={selectedStrategi.nama_insiden} full />
              <DetailField label="Jenis Kejadian" value={selectedStrategi.jenis_kejadian} />
              <DetailField label="Kategori Dampak" value={selectedStrategi.kategori_dampak} />
              <DetailField label="Skenario" value={`Skenario ${selectedStrategi.nomor_skenario}`} />
              <DetailField label="Kategori" value={selectedStrategi.kategori} />
              <DetailField label="Metode Pemulihan" value={selectedStrategi.metode_pemulihan} full />
              <DetailField label="Deskripsi Strategi" value={selectedStrategi.deskripsi_strategi} full />
            </div>

            <div className="border-t border-slate-200 px-6 py-4">
              <h3 className="mb-3 text-sm font-semibold text-slate-800">
                Langkah Pemulihan
              </h3>

              {langkah.filter((item) => item.strategi_id === selectedStrategi.id).length === 0 ? (
                <div className="rounded-md bg-slate-50 px-4 py-4 text-center text-sm text-slate-500">
                  Belum ada langkah pemulihan untuk skenario ini.
                </div>
              ) : (
                <div className="space-y-3">
                  {langkah
                    .filter((item) => item.strategi_id === selectedStrategi.id)
                    .sort((a, b) => a.urutan - b.urutan)
                    .map((item) => (
                      <div key={item.id} className="rounded-lg border border-slate-200 p-4">
                        <div className="flex items-start gap-3">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
                            {item.urutan}
                          </div>

                          <div>
                            <p className="text-sm font-semibold text-slate-800">
                              {item.nama_langkah}
                            </p>

                            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">
                              {item.deskripsi || '-'}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button type="button" onClick={() => setShowStrategiDetail(false)} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700">
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

type DetailFieldProps = {
  label: string;
  value: string | number | null | undefined;
  full?: boolean;
};

const DetailField = ({ label, value, full = false }: DetailFieldProps) => {
  return (
    <div className={full ? 'md:col-span-2' : ''}>
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
        {value === null || value === undefined || value === '' ? '-' : value}
      </div>
    </div>
  );
};

export default StrategiKeberlangsunganPage;