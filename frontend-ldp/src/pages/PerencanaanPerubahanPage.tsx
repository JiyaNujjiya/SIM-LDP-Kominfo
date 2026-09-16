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
};

type UnitOption = {
  id: number;
  instansi_id: number;
  kode_unit: string;
  nama_unit: string;
  status?: string;
  kode_instansi?: string;
  nama_instansi?: string;
};

type LayananOption = {
  id: number;
  instansi_id: number;
  unit_kerja_id?: number | null;
  kode_layanan: string;
  nama_layanan: string;
  jenis_layanan?: string | null;
  status?: string;
  kode_instansi?: string;
  nama_instansi?: string;
  kode_unit?: string | null;
  nama_unit?: string | null;
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

  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [layananOptions, setLayananOptions] = useState<LayananOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const fetchUnitOptions = async () => {
    const result = await request(`${API}/perubahan/unit-options`);

    setUnitOptions(
      Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : []
    );
  };

  const fetchLayananOptions = async () => {
    const result = await request(`${API}/perubahan/layanan-options`);

    setLayananOptions(
      Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : []
    );
  };

  const fetchLayananPrioritasOptions = async () => {
    const result = await request(
      `${API}/perubahan/layanan-prioritas-options`
    );

    setLayananPrioritasOptions(
      Array.isArray(result.data)
        ? result.data
        : Array.isArray(result)
        ? result
        : []
    );
  };

  const fetchAllOptions = async () => {
    try {
      setLoadingOptions(true);

      await Promise.all([
        fetchUnitOptions(),
        fetchLayananOptions(),
        fetchLayananPrioritasOptions(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data pilihan.'
      );
    } finally {
      setLoadingOptions(false);
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
        (item) =>
          Number(item.perencanaan_id) === Number(perencanaanId)
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
    fetchAllOptions();
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

      if (!perencanaanForm.unit_terkait_id) {
        setError('OPD / Unit Terkait wajib dipilih.');
        return;
      }

      if (!perencanaanForm.periode_perencanaan.trim()) {
        setError('Periode perencanaan wajib diisi.');
        return;
      }

      setSaving(true);

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
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePerencanaan = async (
    item: PerencanaanItem
  ) => {
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

    const nextPriority =
      analisisPrioritas.length > 0
        ? Math.max(
            ...analisisPrioritas.map(
              (item) => Number(item.urutan_prioritas) || 0
            )
          ) + 1
        : 1;

    setAnalisisForm((prev) => ({
      ...prev,
      urutan_prioritas: String(nextPriority),
    }));

    setShowAnalisisForm(true);
  };

  const handleEditAnalisis = (
    item: AnalisisPrioritasItem
  ) => {
    clearNotification();

    setEditingAnalisis(item);

    setAnalisisForm({
      layanan_prioritas_id: String(
        item.layanan_prioritas_id
      ),
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

      if (!analisisForm.layanan_prioritas_id) {
        setError('Layanan prioritas wajib dipilih.');
        return;
      }

      if (!analisisForm.komponen_perubahan.trim()) {
        setError(
          'Kondisi / komponen yang perlu mengalami perubahan wajib diisi.'
        );
        return;
      }

      if (!analisisForm.aspek_pemdi.trim()) {
        setError('Aspek PemDi wajib diisi.');
        return;
      }

      if (!analisisForm.indikator_pemdi.trim()) {
        setError('Indikator PemDi wajib diisi.');
        return;
      }

      if (!analisisForm.kondisi_saat_ini.trim()) {
        setError('As-Is wajib diisi.');
        return;
      }

      if (!analisisForm.kondisi_diharapkan.trim()) {
        setError('To-Be wajib diisi.');
        return;
      }

      if (
        !analisisForm.urutan_prioritas ||
        Number(analisisForm.urutan_prioritas) < 1
      ) {
        setError('Prioritas wajib berupa angka lebih dari 0.');
        return;
      }

      setSaving(true);

      const payload = {
        layanan_prioritas_id: Number(
          analisisForm.layanan_prioritas_id
        ),
        komponen_perubahan:
          analisisForm.komponen_perubahan.trim(),
        aspek_pemdi: analisisForm.aspek_pemdi.trim(),
        indikator_pemdi:
          analisisForm.indikator_pemdi.trim(),
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

      await fetchAnalisisPrioritas(
        selectedPerencanaan.id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan analisis prioritas.'
      );
    } finally {
      setSaving(false);
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

      await fetchAnalisisPrioritas(
        selectedPerencanaan.id
      );
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

    if (selectedPerencanaan) {
      setPerubahanForm((prev) => ({
        ...prev,
        unit_pemohon_id: String(
          selectedPerencanaan.unit_terkait_id
        ),
      }));
    }

    setShowPerubahanForm(true);
  };

  const handleEditPerubahan = (
    item: PerubahanItem
  ) => {
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

      if (!perubahanForm.kode_perubahan.trim()) {
        setError('ID Perubahan wajib diisi.');
        return;
      }

      if (!perubahanForm.layanan_id) {
        setError(
          'Layanan Digital yang diusulkan perubahan wajib dipilih.'
        );
        return;
      }

      if (!perubahanForm.detail_perubahan.trim()) {
        setError('Detail perubahan wajib diisi.');
        return;
      }

      if (!perubahanForm.unit_pemohon_id) {
        setError('Unit pemohon perubahan wajib dipilih.');
        return;
      }

      setSaving(true);

      const payload = {
        perencanaan_id: selectedPerencanaan.id,
        kode_perubahan:
          perubahanForm.kode_perubahan.trim(),
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
        result.message ||
          'Data perubahan berhasil disimpan.'
      );

      setShowPerubahanForm(false);
      resetPerubahanForm();

      await fetchPerubahan(
        selectedPerencanaan.id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data perubahan.'
      );
    } finally {
      setSaving(false);
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
        result.message ||
          'Data perubahan berhasil dihapus.'
      );

      await fetchPerubahan(
        selectedPerencanaan.id
      );
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

  const getPrioritasLabel = (
    item: AnalisisPrioritasItem
  ) => {
    if (item.nama_layanan) {
      return item.kode_prioritas
        ? `${item.kode_prioritas} - ${item.nama_layanan}`
        : item.nama_layanan;
    }

    const option = layananPrioritasOptions.find(
      (entry) =>
        Number(
          entry.layanan_prioritas_id ?? entry.id
        ) === Number(item.layanan_prioritas_id)
    );

    if (!option) {
      return '-';
    }

    return [
      option.kode_prioritas,
      option.nama_layanan,
    ]
      .filter(Boolean)
      .join(' - ');
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
          Perencanaan dan identifikasi kebutuhan perubahan
          Layanan Digital Pemerintah.
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
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                      active
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {step.number}
                  </div>

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
                Formulir 1.1 Nama Instansi dan Unit Terkait.
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
                onChange={(e) =>
                  setSearch(e.target.value)
                }
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
                      Nama OPD Terkait
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
                    filteredPerencanaan.map(
                      (item, index) => (
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
                                onClick={() =>
                                  openDetail(item)
                                }
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Detail
                              </button>

                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditPerencanaan(
                                      item
                                    )
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
                                    handleDeletePerencanaan(
                                      item
                                    )
                                  }
                                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    )
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
                  Formulir 1.1 - Nama Instansi dan Unit
                  Terkait
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Informasi identitas perencanaan perubahan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPerencanaan(null);
                  setAnalisisPrioritas([]);
                  setDataPerubahan([]);
                  clearNotification();
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
                  Analisis kondisi As-Is dan To-Be pada
                  Layanan Digital Pemerintah prioritas.
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
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="w-[7%] px-3 py-3">
                      Prioritas
                    </th>

                    <th className="w-[16%] px-3 py-3">
                      Nama Layanan Prioritas
                    </th>

                    <th className="w-[20%] px-3 py-3">
                      Kondisi / Komponen yang Perlu Mengalami Perubahan
                    </th>

                    <th className="w-[11%] px-3 py-3">
                      Aspek PemDi
                    </th>

                    <th className="w-[12%] px-3 py-3">
                      Indikator PemDi
                    </th>

                    <th className="w-[13%] px-3 py-3">
                      As-Is
                    </th>

                    <th className="w-[13%] px-3 py-3">
                      To-Be
                    </th>

                    <th className="w-[8%] px-3 py-3 text-center">
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
                    [...analisisPrioritas]
                      .sort(
                        (a, b) =>
                          Number(a.urutan_prioritas) -
                          Number(b.urutan_prioritas)
                      )
                      .map((item) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 align-top"
                        >
                          <td className="break-words px-3 py-3 font-semibold">
                            {item.urutan_prioritas}
                          </td>

                          <td className="break-words px-3 py-3">
                            {getPrioritasLabel(item)}
                          </td>

                          <td className="whitespace-normal break-words px-3 py-3">
                            {item.komponen_perubahan}
                          </td>

                          <td className="whitespace-normal break-words px-3 py-3">
                            {item.aspek_pemdi}
                          </td>

                          <td className="whitespace-normal break-words px-3 py-3">
                            {item.indikator_pemdi}
                          </td>

                          <td className="whitespace-normal break-words px-3 py-3">
                            {item.kondisi_saat_ini}
                          </td>

                          <td className="whitespace-normal break-words px-3 py-3">
                            {item.kondisi_diharapkan}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col items-center justify-center gap-2">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditAnalisis(item)
                                  }
                                  className="w-full rounded-md border border-blue-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
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
                                  className="w-full rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
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
                  Daftar perubahan yang direncanakan pada
                  Layanan Digital Pemerintah.
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
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="w-[14%] px-3 py-3">
                      ID Perubahan
                    </th>

                    <th className="w-[17%] px-3 py-3">
                      Layanan Digital Diusulkan Perubahan
                    </th>

                    <th className="w-[20%] px-3 py-3">
                      Detail Perubahan
                    </th>

                    <th className="w-[14%] px-3 py-3">
                      Unit Pemohon Perubahan
                    </th>

                    <th className="w-[9%] px-3 py-3">
                      Klasifikasi
                    </th>

                    <th className="w-[8%] px-3 py-3">
                      Lingkup
                    </th>

                    <th className="w-[9%] px-3 py-3">
                      Status
                    </th>

                    <th className="w-[9%] px-3 py-3 text-center">
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
                        <td className="px-3 py-3 align-top font-semibold text-slate-800">
                          <span className="break-normal">
                            {item.kode_perubahan}
                          </span>
                        </td>

                        <td className="whitespace-normal break-words px-3 py-3">
                          <div className="font-medium text-slate-800">
                            {item.nama_layanan || '-'}
                          </div>

                          {item.kode_layanan && (
                            <div className="mt-1 text-xs text-slate-400">
                              {item.kode_layanan}
                            </div>
                          )}
                        </td>

                        <td className="whitespace-normal break-words px-3 py-3">
                          {item.detail_perubahan}
                        </td>

                        <td className="whitespace-normal break-words px-3 py-3">
                          {item.nama_unit_pemohon || '-'}
                        </td>

                        <td className="whitespace-normal break-words px-3 py-3">
                          {item.klasifikasi}
                        </td>

                        <td className="whitespace-normal break-words px-3 py-3">
                          {item.lingkup}
                        </td>

                        <td className="px-3 py-3 align-top">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-3 py-3 align-top">
                          <div className="flex flex-col items-center gap-2">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEditPerubahan(item)
                                }
                                className="w-[72px] rounded-md border border-blue-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
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
                                className="w-[72px] rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
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

              <p className="mt-1 text-sm text-slate-500">
                Lengkapi Nama Instansi, OPD terkait, dan periode perencanaan.
              </p>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Nama Instansi dan OPD Terkait
                </label>

                <select
                  value={perencanaanForm.unit_terkait_id}
                  onChange={(e) =>
                    setPerencanaanForm({
                      ...perencanaanForm,
                      unit_terkait_id: e.target.value,
                    })
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingOptions
                      ? 'Memuat daftar unit...'
                      : 'Pilih OPD / Unit Terkait'}
                  </option>

                  {unitOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {[
                        option.nama_instansi,
                        option.kode_unit
                          ? `${option.kode_unit} - ${option.nama_unit}`
                          : option.nama_unit,
                      ]
                        .filter(Boolean)
                        .join(' | ')}
                    </option>
                  ))}
                </select>

                {unitOptions.length === 0 &&
                  !loadingOptions && (
                    <p className="mt-1 text-xs text-amber-600">
                      Belum ada unit kerja aktif yang dapat dipilih.
                    </p>
                  )}
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
                      periode_perencanaan:
                        e.target.value,
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
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePerencanaan}
                disabled={saving || loadingOptions}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
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
                  ? 'Edit Analisis Prioritas Perubahan'
                  : 'Tambah Analisis Prioritas Perubahan'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Lengkapi analisis kondisi As-Is dan To-Be pada layanan prioritas.
              </p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Nama Layanan Prioritas
                </label>

                <select
                  value={
                    analisisForm.layanan_prioritas_id
                  }
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      layanan_prioritas_id:
                        e.target.value,
                    })
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingOptions
                      ? 'Memuat layanan prioritas...'
                      : 'Pilih layanan prioritas'}
                  </option>

                  {layananPrioritasOptions.map(
                    (option, index) => {
                      const id =
                        option.layanan_prioritas_id ??
                        option.id;

                      const label = [
                        option.kode_prioritas,
                        option.kode_layanan,
                        option.nama_layanan,
                      ]
                        .filter(Boolean)
                        .join(' - ');

                      return (
                        <option
                          key={id ?? index}
                          value={id ?? ''}
                        >
                          {label ||
                            `Layanan Prioritas ${id}`}
                        </option>
                      );
                    }
                  )}
                </select>

                {layananPrioritasOptions.length ===
                  0 &&
                  !loadingOptions && (
                    <p className="mt-1 text-xs text-amber-600">
                      Belum ada layanan prioritas yang dapat dipilih.
                    </p>
                  )}
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Prioritas
                </label>

                <input
                  type="number"
                  min="1"
                  value={analisisForm.urutan_prioritas}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      urutan_prioritas:
                        e.target.value,
                    })
                  }
                  placeholder="Contoh: 1"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Aspek PemDi
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
                  placeholder="Masukkan aspek PemDi"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Kondisi / Komponen yang Perlu Mengalami Perubahan
                </label>

                <textarea
                  rows={3}
                  value={
                    analisisForm.komponen_perubahan
                  }
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      komponen_perubahan:
                        e.target.value,
                    })
                  }
                  placeholder="Jelaskan kondisi atau komponen yang perlu mengalami perubahan"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Indikator PemDi
                </label>

                <input
                  type="text"
                  maxLength={200}
                  value={analisisForm.indikator_pemdi}
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      indikator_pemdi:
                        e.target.value,
                    })
                  }
                  placeholder="Masukkan indikator PemDi"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  As-Is
                </label>

                <textarea
                  rows={5}
                  value={
                    analisisForm.kondisi_saat_ini
                  }
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      kondisi_saat_ini:
                        e.target.value,
                    })
                  }
                  placeholder="Jelaskan kondisi saat ini"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  To-Be
                </label>

                <textarea
                  rows={5}
                  value={
                    analisisForm.kondisi_diharapkan
                  }
                  onChange={(e) =>
                    setAnalisisForm({
                      ...analisisForm,
                      kondisi_diharapkan:
                        e.target.value,
                    })
                  }
                  placeholder="Jelaskan kondisi yang diharapkan"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
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
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveAnalisis}
                disabled={saving || loadingOptions}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
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

              <p className="mt-1 text-sm text-slate-500">
                Lengkapi detail perubahan yang akan direncanakan.
              </p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  ID Perubahan
                </label>

                <input
                  type="text"
                  maxLength={50}
                  value={
                    perubahanForm.kode_perubahan
                  }
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      kode_perubahan: e.target.value,
                    })
                  }
                  placeholder="Contoh: CHG-001"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Layanan Digital Diusulkan Perubahan
                </label>

                <select
                  value={perubahanForm.layanan_id}
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      layanan_id: e.target.value,
                    })
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingOptions
                      ? 'Memuat layanan digital...'
                      : 'Pilih layanan digital'}
                  </option>

                  {layananOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {[
                        option.kode_layanan,
                        option.nama_layanan,
                      ]
                        .filter(Boolean)
                        .join(' - ')}
                    </option>
                  ))}
                </select>

                {layananOptions.length === 0 &&
                  !loadingOptions && (
                    <p className="mt-1 text-xs text-amber-600">
                      Belum ada layanan digital aktif yang dapat dipilih.
                    </p>
                  )}
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Detail Perubahan
                </label>

                <textarea
                  rows={4}
                  value={
                    perubahanForm.detail_perubahan
                  }
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      detail_perubahan:
                        e.target.value,
                    })
                  }
                  placeholder="Jelaskan perubahan yang akan dilakukan"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Unit Pemohon Perubahan
                </label>

                <select
                  value={
                    perubahanForm.unit_pemohon_id
                  }
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      unit_pemohon_id:
                        e.target.value,
                    })
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:bg-slate-100"
                >
                  <option value="">
                    {loadingOptions
                      ? 'Memuat daftar unit...'
                      : 'Pilih unit pemohon'}
                  </option>

                  {unitOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                    >
                      {[
                        option.kode_unit,
                        option.nama_unit,
                      ]
                        .filter(Boolean)
                        .join(' - ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Klasifikasi Perubahan
                </label>

                <select
                  value={
                    perubahanForm.klasifikasi
                  }
                  onChange={(e) =>
                    setPerubahanForm({
                      ...perubahanForm,
                      klasifikasi: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="Normal">
                    Normal
                  </option>
                  <option value="Standard">
                    Standard
                  </option>
                  <option value="Emergency">
                    Emergency
                  </option>
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
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="Teknis">
                    Teknis
                  </option>
                  <option value="Organisasi">
                    Organisasi
                  </option>
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
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePerubahan}
                disabled={saving || loadingOptions}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}