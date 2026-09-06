import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type PerencanaanItem = {
  id: number;
  unit_terkait_id: number;
  kode_unit: string;
  nama_unit: string;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  periode_perencanaan: string;
  created_by: number;
  dibuat_oleh: string;
  created_at: string;
  updated_at: string;
};

type AnalisisPrioritasItem = {
  id: number;
  perencanaan_id: number;
  layanan_prioritas_id: number;
  kode_prioritas?: string;
  layanan_id?: number;
  kode_layanan?: string;
  nama_layanan?: string;
  komponen_perubahan: string;
  aspek_pemdi: string;
  indikator_pemdi: string;
  kondisi_saat_ini: string;
  kondisi_diharapkan: string;
  urutan_prioritas: number;
  created_at?: string;
  updated_at?: string;
};

type PerubahanItem = {
  id: number;
  perencanaan_id: number;
  periode_perencanaan?: string;
  unit_terkait_id?: number;
  kode_unit_terkait?: string;
  nama_unit_terkait?: string;
  kode_perubahan: string;
  layanan_id: number;
  kode_layanan?: string;
  nama_layanan?: string;
  detail_perubahan: string;
  unit_pemohon_id: number;
  kode_unit_pemohon?: string;
  nama_unit_pemohon?: string;
  klasifikasi: string;
  lingkup: string;
  status: string;
  dibuat_oleh?: string;
  created_at?: string;
  updated_at?: string;
};

type LayananPrioritasOption = {
  id?: number;
  layanan_prioritas_id?: number;
  layanan_id?: number;
  kode_prioritas?: string;
  kode_layanan?: string;
  nama_layanan?: string;
  layanan_prioritas?: string;
};

const API = 'http://localhost:5000/api';

export default function PerencanaanPerubahanPage() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes('change.create');
  const canUpdate = permissions.includes('change.update');
  const canDelete = permissions.includes('change.delete');

  const [dataPerencanaan, setDataPerencanaan] = useState<PerencanaanItem[]>([]);
  const [selectedPerencanaan, setSelectedPerencanaan] =
    useState<PerencanaanItem | null>(null);

  const [analisisPrioritas, setAnalisisPrioritas] = useState<
    AnalisisPrioritasItem[]
  >([]);

  const [dataPerubahan, setDataPerubahan] = useState<PerubahanItem[]>([]);

  const [layananPrioritasOptions, setLayananPrioritasOptions] = useState<
    LayananPrioritasOption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');

  const [showPerencanaanForm, setShowPerencanaanForm] = useState(false);
  const [editingPerencanaan, setEditingPerencanaan] =
    useState<PerencanaanItem | null>(null);

  const [showAnalisisForm, setShowAnalisisForm] = useState(false);
  const [editingAnalisis, setEditingAnalisis] =
    useState<AnalisisPrioritasItem | null>(null);

  const [showPerubahanForm, setShowPerubahanForm] = useState(false);
  const [editingPerubahan, setEditingPerubahan] =
    useState<PerubahanItem | null>(null);

  const [perencanaanForm, setPerencanaanForm] = useState({
    unit_terkait_id: '',
    periode_perencanaan: '',
  });

  const [analisisForm, setAnalisisForm] = useState({
    layanan_prioritas_id: '',
    komponen_perubahan: '',
    aspek_pemdi: '',
    indikator_pemdi: '',
    kondisi_saat_ini: '',
    kondisi_diharapkan: '',
    urutan_prioritas: '',
  });

  const [perubahanForm, setPerubahanForm] = useState({
    kode_perubahan: '',
    layanan_id: '',
    detail_perubahan: '',
    unit_pemohon_id: '',
    klasifikasi: 'Normal',
    lingkup: 'Teknis',
  });

  const getToken = () => localStorage.getItem('token');

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
      throw new Error(
        result.message ||
          result.error ||
          'Terjadi kesalahan saat memproses permintaan.'
      );
    }

    return result;
  };

  const clearNotification = () => {
    setMessage('');
    setError('');
  };

  const fetchPerencanaan = async () => {
    try {
      setLoading(true);

      const result = await request(`${API}/perubahan/perencanaan`);

      setDataPerencanaan(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data perencanaan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchLayananPrioritasOptions = async () => {
    try {
      const result = await request(
        `${API}/risiko/layanan-prioritas-options`
      );

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : [];

      setLayananPrioritasOptions(data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAnalisisPrioritas = async (perencanaanId: number) => {
    const result = await request(
      `${API}/perubahan/perencanaan/${perencanaanId}/analisis-prioritas`
    );

    setAnalisisPrioritas(
      Array.isArray(result.data) ? result.data : []
    );
  };

  const fetchPerubahan = async (perencanaanId: number) => {
    const result = await request(`${API}/perubahan`);

    const allData: PerubahanItem[] = Array.isArray(result.data)
      ? result.data
      : [];

    setDataPerubahan(
      allData.filter(
        (item) => Number(item.perencanaan_id) === Number(perencanaanId)
      )
    );
  };

  const openDetail = async (item: PerencanaanItem) => {
    try {
      clearNotification();
      setLoadingDetail(true);
      setSelectedPerencanaan(item);

      await Promise.all([
        fetchAnalisisPrioritas(item.id),
        fetchPerubahan(item.id),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil detail MPR01.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPerencanaan();
    fetchLayananPrioritasOptions();
  }, []);

  const filteredPerencanaan = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) return dataPerencanaan;

    return dataPerencanaan.filter((item) => {
      return (
        item.nama_instansi?.toLowerCase().includes(keyword) ||
        item.nama_unit?.toLowerCase().includes(keyword) ||
        item.periode_perencanaan?.toLowerCase().includes(keyword) ||
        item.dibuat_oleh?.toLowerCase().includes(keyword)
      );
    });
  }, [dataPerencanaan, search]);

  const resetPerencanaanForm = () => {
    setPerencanaanForm({
      unit_terkait_id: '',
      periode_perencanaan: '',
    });

    setEditingPerencanaan(null);
  };

  const handleTambahPerencanaan = () => {
    clearNotification();
    resetPerencanaanForm();
    setShowPerencanaanForm(true);
  };

  const handleEditPerencanaan = (item: PerencanaanItem) => {
    clearNotification();

    setEditingPerencanaan(item);

    setPerencanaanForm({
      unit_terkait_id: String(item.unit_terkait_id),
      periode_perencanaan: item.periode_perencanaan,
    });

    setShowPerencanaanForm(true);
  };

  const handleSavePerencanaan = async () => {
    try {
      clearNotification();

      if (
        !perencanaanForm.unit_terkait_id ||
        !perencanaanForm.periode_perencanaan.trim()
      ) {
        setError('Unit terkait dan periode perencanaan wajib diisi.');
        return;
      }

      const payload = {
        unit_terkait_id: Number(perencanaanForm.unit_terkait_id),
        periode_perencanaan:
          perencanaanForm.periode_perencanaan.trim(),
      };

      const url = editingPerencanaan
        ? `${API}/perubahan/perencanaan/${editingPerencanaan.id}`
        : `${API}/perubahan/perencanaan`;

      const result = await request(url, {
        method: editingPerencanaan ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message ||
          (editingPerencanaan
            ? 'Perencanaan berhasil diperbarui.'
            : 'Perencanaan berhasil disimpan.')
      );

      setShowPerencanaanForm(false);
      resetPerencanaanForm();

      await fetchPerencanaan();

      if (
        selectedPerencanaan &&
        editingPerencanaan?.id === selectedPerencanaan.id
      ) {
        setSelectedPerencanaan(result.data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan perencanaan.'
      );
    }
  };

  const handleDeletePerencanaan = async (item: PerencanaanItem) => {
    const confirmed = window.confirm(
      `Hapus perencanaan periode "${item.periode_perencanaan}"?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/perencanaan/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result.message || 'Perencanaan berhasil dihapus.'
      );

      if (selectedPerencanaan?.id === item.id) {
        setSelectedPerencanaan(null);
        setAnalisisPrioritas([]);
        setDataPerubahan([]);
      }

      await fetchPerencanaan();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus perencanaan.'
      );
    }
  };

  const resetAnalisisForm = () => {
    setAnalisisForm({
      layanan_prioritas_id: '',
      komponen_perubahan: '',
      aspek_pemdi: '',
      indikator_pemdi: '',
      kondisi_saat_ini: '',
      kondisi_diharapkan: '',
      urutan_prioritas: '',
    });

    setEditingAnalisis(null);
  };

  const handleTambahAnalisis = () => {
    clearNotification();
    resetAnalisisForm();
    setShowAnalisisForm(true);
  };

  const handleEditAnalisis = (item: AnalisisPrioritasItem) => {
    clearNotification();

    setEditingAnalisis(item);

    setAnalisisForm({
      layanan_prioritas_id: String(item.layanan_prioritas_id),
      komponen_perubahan: item.komponen_perubahan,
      aspek_pemdi: item.aspek_pemdi,
      indikator_pemdi: item.indikator_pemdi,
      kondisi_saat_ini: item.kondisi_saat_ini,
      kondisi_diharapkan: item.kondisi_diharapkan,
      urutan_prioritas: String(item.urutan_prioritas),
    });

    setShowAnalisisForm(true);
  };

  const handleSaveAnalisis = async () => {
    if (!selectedPerencanaan) return;

    try {
      clearNotification();

      const payload = {
        layanan_prioritas_id: Number(
          analisisForm.layanan_prioritas_id
        ),
        komponen_perubahan:
          analisisForm.komponen_perubahan.trim(),
        aspek_pemdi: analisisForm.aspek_pemdi.trim(),
        indikator_pemdi: analisisForm.indikator_pemdi.trim(),
        kondisi_saat_ini:
          analisisForm.kondisi_saat_ini.trim(),
        kondisi_diharapkan:
          analisisForm.kondisi_diharapkan.trim(),
        urutan_prioritas: Number(
          analisisForm.urutan_prioritas
        ),
      };

      const url = editingAnalisis
        ? `${API}/perubahan/analisis-prioritas/${editingAnalisis.id}`
        : `${API}/perubahan/perencanaan/${selectedPerencanaan.id}/analisis-prioritas`;

      const result = await request(url, {
        method: editingAnalisis ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message ||
          'Analisis prioritas berhasil disimpan.'
      );

      setShowAnalisisForm(false);
      resetAnalisisForm();

      await fetchAnalisisPrioritas(selectedPerencanaan.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan analisis prioritas.'
      );
    }
  };

  const handleDeleteAnalisis = async (
    item: AnalisisPrioritasItem
  ) => {
    if (!selectedPerencanaan) return;

    const confirmed = window.confirm(
      'Hapus analisis prioritas ini?'
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/analisis-prioritas/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result.message ||
          'Analisis prioritas berhasil dihapus.'
      );

      await fetchAnalisisPrioritas(selectedPerencanaan.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus analisis prioritas.'
      );
    }
  };

  const resetPerubahanForm = () => {
    setPerubahanForm({
      kode_perubahan: '',
      layanan_id: '',
      detail_perubahan: '',
      unit_pemohon_id: '',
      klasifikasi: 'Normal',
      lingkup: 'Teknis',
    });

    setEditingPerubahan(null);
  };

  const handleTambahPerubahan = () => {
    clearNotification();
    resetPerubahanForm();
    setShowPerubahanForm(true);
  };

  const handleEditPerubahan = (item: PerubahanItem) => {
    clearNotification();

    setEditingPerubahan(item);

    setPerubahanForm({
      kode_perubahan: item.kode_perubahan,
      layanan_id: String(item.layanan_id),
      detail_perubahan: item.detail_perubahan,
      unit_pemohon_id: String(item.unit_pemohon_id),
      klasifikasi: item.klasifikasi,
      lingkup: item.lingkup,
    });

    setShowPerubahanForm(true);
  };

  const handleSavePerubahan = async () => {
    if (!selectedPerencanaan) return;

    try {
      clearNotification();

      const payload = {
        perencanaan_id: selectedPerencanaan.id,
        kode_perubahan: perubahanForm.kode_perubahan.trim(),
        layanan_id: Number(perubahanForm.layanan_id),
        detail_perubahan:
          perubahanForm.detail_perubahan.trim(),
        unit_pemohon_id: Number(
          perubahanForm.unit_pemohon_id
        ),
        klasifikasi: perubahanForm.klasifikasi,
        lingkup: perubahanForm.lingkup,
      };

      const url = editingPerubahan
        ? `${API}/perubahan/${editingPerubahan.id}`
        : `${API}/perubahan`;

      const result = await request(url, {
        method: editingPerubahan ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message || 'Data perubahan berhasil disimpan.'
      );

      setShowPerubahanForm(false);
      resetPerubahanForm();

      await fetchPerubahan(selectedPerencanaan.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data perubahan.'
      );
    }
  };

  const handleDeletePerubahan = async (
    item: PerubahanItem
  ) => {
    if (!selectedPerencanaan) return;

    const confirmed = window.confirm(
      `Hapus perubahan "${item.kode_perubahan}"?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result.message || 'Data perubahan berhasil dihapus.'
      );

      await fetchPerubahan(selectedPerencanaan.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus data perubahan.'
      );
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Selesai') {
      return 'bg-green-100 text-green-700';
    }

    if (status === 'Evaluasi') {
      return 'bg-purple-100 text-purple-700';
    }

    if (status === 'Implementasi') {
      return 'bg-blue-100 text-blue-700';
    }

    if (status === 'Analisis') {
      return 'bg-yellow-100 text-yellow-700';
    }

    return 'bg-gray-100 text-gray-700';
  };

  const processSteps = [
    {
      number: 1,
      label: 'Perencanaan',
      route: '/perubahan/perencanaan',
    },
    {
      number: 2,
      label: 'Analisis',
      route: '/perubahan/analisis',
    },
    {
      number: 3,
      label: 'Implementasi',
      route: '/perubahan/implementasi',
    },
    {
      number: 4,
      label: 'Evaluasi',
      route: '/perubahan/evaluasi',
    },
    {
      number: 5,
      label: 'Pencatatan / Logbook',
      route: '/perubahan/logbook',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          MPR01 - Perencanaan Perubahan
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Perencanaan dan identifikasi kebutuhan perubahan Layanan
          Digital Pemerintah.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 1;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-[110px] flex-col items-center text-center">
                  <button
                    type="button"
                    onClick={() => {
                      if (active) return;

                      if (step.number === 1) {
                        navigate(step.route);
                      }
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                      active
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {step.number}
                  </button>

                  <span
                    className={`mt-2 text-xs ${
                      active
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {index < processSteps.length - 1 && (
                  <div className="mt-[18px] h-px flex-1 bg-slate-200" />
                )}
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

      {!selectedPerencanaan ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Daftar Perencanaan Perubahan
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Formulir 1.1 identitas perencanaan perubahan.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={handleTambahPerencanaan}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tambah Perencanaan
              </button>
            )}
          </div>

          <div className="p-5">
            <div className="mb-5">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari instansi, unit terkait, atau periode..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-md"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-semibold">
                      No
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Nama Instansi
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      OPD / Unit Terkait
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Periode Perencanaan
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Dibuat Oleh
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredPerencanaan.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Belum ada data perencanaan perubahan.
                      </td>
                    </tr>
                  ) : (
                    filteredPerencanaan.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3">
                          {index + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {item.nama_instansi}
                        </td>
                        <td className="px-4 py-3">
                          {item.nama_unit}
                        </td>
                        <td className="px-4 py-3">
                          {item.periode_perencanaan}
                        </td>
                        <td className="px-4 py-3">
                          {item.dibuat_oleh}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => openDetail(item)}
                              className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                            >
                              Detail
                            </button>

                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditPerencanaan(item)
                                }
                                className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePerencanaan(item)
                                }
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Hapus
                              </button>
                            )}
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
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Formulir 1.1 - Identitas Perencanaan
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Informasi dasar perencanaan perubahan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPerencanaan(null);
                  setAnalisisPrioritas([]);
                  setDataPerubahan([]);
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali ke Daftar
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-3">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Nama Instansi
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerencanaan.nama_instansi}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Nama OPD Terkait
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerencanaan.nama_unit}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Periode Perencanaan
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerencanaan.periode_perencanaan}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Formulir 1.2 - Analisis Prioritas Perubahan
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Identifikasi kebutuhan dan prioritas perubahan
                  berdasarkan layanan prioritas.
                </p>
              </div>

              {canCreate && (
                <button
                  type="button"
                  onClick={handleTambahAnalisis}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Tambah Analisis
                </button>
              )}
            </div>

            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[1300px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-3 py-3">Urutan</th>
                    <th className="px-3 py-3">
                      Layanan Prioritas
                    </th>
                    <th className="px-3 py-3">
                      Komponen Perubahan
                    </th>
                    <th className="px-3 py-3">
                      Aspek Pemdi
                    </th>
                    <th className="px-3 py-3">
                      Indikator Pemdi
                    </th>
                    <th className="px-3 py-3">
                      Kondisi Saat Ini
                    </th>
                    <th className="px-3 py-3">
                      Kondisi Diharapkan
                    </th>
                    <th className="px-3 py-3 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingDetail ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-500"
                      >
                        Memuat detail...
                      </td>
                    </tr>
                  ) : analisisPrioritas.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        Belum ada analisis prioritas.
                      </td>
                    </tr>
                  ) : (
                    analisisPrioritas.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 align-top"
                      >
                        <td className="px-3 py-3 font-semibold">
                          {item.urutan_prioritas}
                        </td>
                        <td className="px-3 py-3">
                          {item.nama_layanan ||
                            item.kode_prioritas ||
                            `ID ${item.layanan_prioritas_id}`}
                        </td>
                        <td className="px-3 py-3">
                          {item.komponen_perubahan}
                        </td>
                        <td className="px-3 py-3">
                          {item.aspek_pemdi}
                        </td>
                        <td className="px-3 py-3">
                          {item.indikator_pemdi}
                        </td>
                        <td className="px-3 py-3">
                          {item.kondisi_saat_ini}
                        </td>
                        <td className="px-3 py-3">
                          {item.kondisi_diharapkan}
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-2">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditAnalisis(item)
                                }
                                className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700"
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeleteAnalisis(item)
                                }
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                              >
                                Hapus
                              </button>
                            )}
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
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Formulir 1.3 - Perencanaan Perubahan
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Daftar perubahan yang direncanakan untuk periode
                  ini.
                </p>
              </div>

              {canCreate && (
                <button
                  type="button"
                  onClick={handleTambahPerubahan}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Tambah Perubahan
                </button>
              )}
            </div>

            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-3 py-3">
                      Kode Perubahan
                    </th>
                    <th className="px-3 py-3">
                      Layanan
                    </th>
                    <th className="px-3 py-3">
                      Detail Perubahan
                    </th>
                    <th className="px-3 py-3">
                      Unit Pemohon
                    </th>
                    <th className="px-3 py-3">
                      Klasifikasi
                    </th>
                    <th className="px-3 py-3">
                      Lingkup
                    </th>
                    <th className="px-3 py-3">
                      Status
                    </th>
                    <th className="px-3 py-3 text-center">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {dataPerubahan.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="py-8 text-center text-slate-400"
                      >
                        Belum ada rencana perubahan.
                      </td>
                    </tr>
                  ) : (
                    dataPerubahan.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 align-top"
                      >
                        <td className="px-3 py-3 font-semibold text-slate-800">
                          {item.kode_perubahan}
                        </td>
                        <td className="px-3 py-3">
                          {item.nama_layanan ||
                            `ID ${item.layanan_id}`}
                        </td>
                        <td className="max-w-[280px] px-3 py-3">
                          {item.detail_perubahan}
                        </td>
                        <td className="px-3 py-3">
                          {item.nama_unit_pemohon ||
                            `ID ${item.unit_pemohon_id}`}
                        </td>
                        <td className="px-3 py-3">
                          {item.klasifikasi}
                        </td>
                        <td className="px-3 py-3">
                          {item.lingkup}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-2">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditPerubahan(item)
                                }
                                className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700"
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDeletePerubahan(item)
                                }
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600"
                              >
                                Hapus
                              </button>
                            )}
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
      )}

      {showPerencanaanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingPerencanaan
                  ? 'Edit Perencanaan'
                  : 'Tambah Perencanaan'}
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  ID OPD / Unit Terkait
                </label>
                <input
                  type="number"
                  min="1"
                  value={perencanaanForm.unit_terkait_id}
                  onChange={(e) =>
                    setPerencanaanForm({
                      ...perencanaanForm,
                      unit_terkait_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Periode Perencanaan
                </label>
                <input
                  type="text"
                  maxLength={100}
                  value={perencanaanForm.periode_perencanaan}
                  onChange={(e) =>
                    setPerencanaanForm({
                      ...perencanaanForm,
                      periode_perencanaan: e.target.value,
                    })
                  }
                  placeholder="Contoh: Tahun 2026"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowPerencanaanForm(false);
                  resetPerencanaanForm();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePerencanaan}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showAnalisisForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-6 w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingAnalisis
                  ? 'Edit Analisis Prioritas'
                  : 'Tambah Analisis Prioritas'}
              </h3>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Layanan Prioritas
                </label>

                {layananPrioritasOptions.length > 0 ? (
                  <select
                    value={analisisForm.layanan_prioritas_id}
                    onChange={(e) =>
                      setAnalisisForm({
                        ...analisisForm,
                        layanan_prioritas_id: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>

                    {layananPrioritasOptions.map(
                      (option, index) => {
                        const id =
                          option.layanan_prioritas_id ??
                          option.id;

                        return (
                          <option
                            key={id ?? index}
                            value={id ?? ''}
                          >
                            {option.nama_layanan ||
                              option.layanan_prioritas ||
                              option.kode_prioritas ||
                              `Layanan ${id}`}
                          </option>
                        );
                      }
                    )}
                  </select>
                ) : (
                  <input
                    type="number"
                    min="1"
                    value={analisisForm.layanan_prioritas_id}
                    onChange={(e) =>
                      setAnalisisForm({
                        ...analisisForm,
                        layanan_prioritas_id: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Urutan Prioritas
                </label>
                <input
                  type="number"
                  min="1"
                  value={analisisForm.urutan_prioritas}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      urutan_prioritas: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Komponen Perubahan
                </label>
                <textarea
                  rows={2}
                  value={analisisForm.komponen_perubahan}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      komponen_perubahan: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Aspek Pemdi
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={analisisForm.aspek_pemdi}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      aspek_pemdi: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Indikator Pemdi
                </label>
                <input
                  type="text"
                  maxLength={200}
                  value={analisisForm.indikator_pemdi}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      indikator_pemdi: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Kondisi Saat Ini
                </label>
                <textarea
                  rows={4}
                  value={analisisForm.kondisi_saat_ini}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      kondisi_saat_ini: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Kondisi Diharapkan
                </label>
                <textarea
                  rows={4}
                  value={analisisForm.kondisi_diharapkan}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      kondisi_diharapkan: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowAnalisisForm(false);
                  resetAnalisisForm();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveAnalisis}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showPerubahanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-6 w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingPerubahan
                  ? 'Edit Perencanaan Perubahan'
                  : 'Tambah Perencanaan Perubahan'}
              </h3>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Kode Perubahan
                </label>
                <input
                  type="text"
                  maxLength={50}
                  value={perubahanForm.kode_perubahan}
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      kode_perubahan: e.target.value,
                    })
                  }
                  placeholder="Contoh: CHG-001"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  ID Layanan Digital
                </label>
                <input
                  type="number"
                  min="1"
                  value={perubahanForm.layanan_id}
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      layanan_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Detail Perubahan
                </label>
                <textarea
                  rows={4}
                  value={perubahanForm.detail_perubahan}
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      detail_perubahan: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  ID Unit Pemohon
                </label>
                <input
                  type="number"
                  min="1"
                  value={perubahanForm.unit_pemohon_id}
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      unit_pemohon_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Klasifikasi Perubahan
                </label>
                <select
                  value={perubahanForm.klasifikasi}
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      klasifikasi: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Normal">Normal</option>
                  <option value="Standard">Standard</option>
                  <option value="Emergency">Emergency</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Lingkup Perubahan
                </label>
                <select
                  value={perubahanForm.lingkup}
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      lingkup: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                >
                  <option value="Teknis">Teknis</option>
                  <option value="Organisasi">Organisasi</option>
                  <option value="Teknis & Organisasi">
                    Teknis & Organisasi
                  </option>
                </select>
              </div>

              {editingPerubahan && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Status Workflow
                  </label>
                  <input
                    type="text"
                    value={editingPerubahan.status}
                    readOnly
                    className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-500"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowPerubahanForm(false);
                  resetPerubahanForm();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePerubahan}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}