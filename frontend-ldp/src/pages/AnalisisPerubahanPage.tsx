import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type PerubahanItem = {
  id: number;
  kode_perubahan: string;
  layanan_id: number;
  kode_layanan?: string;
  nama_layanan?: string;
  detail_perubahan: string;
  nama_unit_pemohon?: string;
  klasifikasi: string;
  lingkup: string;
  status: string;
  periode_perencanaan?: string;
};

type RisikoItem = {
  id: number;
  kode_risiko: string;
  peristiwa_risiko: string;
  penyebab?: string | null;
  dampak?: string | null;
  kemungkinan?: number | null;
  nilai_dampak?: number | null;
  besaran_risiko?: number | null;
  keputusan_perlakuan?: string | null;
  prioritas_risiko?: string | null;
};

type DampakTeknisItem = {
  id: number;
  perubahan_id: number;
  kode_perubahan: string;
  perubahan_layanan_id: number;
  kode_layanan?: string;
  nama_layanan?: string;
  risiko_id: number;
  kode_risiko: string;
  peristiwa_risiko: string;
  penyebab?: string | null;
  dampak?: string | null;
  kemungkinan?: number | null;
  nilai_dampak?: number | null;
  besaran_risiko?: number | null;
  keputusan_perlakuan?: string | null;
  prioritas_risiko?: string | null;
  mkb_insiden_id?: number | null;
  nama_insiden?: string | null;
  jenis_kejadian?: string | null;
  kategori_dampak_insiden?: string | null;
  dibuat_oleh?: string;
  created_at?: string;
};

type PersetujuanItem = {
  id: number;
  perubahan_id?: number;
  tahap?: string;
  keputusan?: string;
  diputuskan_oleh?: number;
  nama_pemutus?: string;
  diputuskan_at?: string;
  catatan_keputusan?: string | null;
};

type IndikatorItem = {
  id: number;
  area_dampak: string;
  indikator: string;
  urutan: number;
};

type IndikatorGroup = {
  area_dampak: string;
  indikator: IndikatorItem[];
};

type DampakOrganisasiItem = {
  id?: number;
  area_dampak: string;
  ukuran_perubahan: string;
  indikator?: IndikatorItem[];
};

type AnalisisOrganisasi = {
  id: number;
  perubahan_id: number;
  kode_perubahan?: string;
  detail_perubahan?: string;
  lingkup?: string;
  klasifikasi?: string;
  kesimpulan: string;
  rekomendasi?: string | null;
  dibuat_oleh?: string;
  created_at?: string;
  updated_at?: string;
  dampak_organisasi: DampakOrganisasiItem[];
};

type OrganisasiFormItem = {
  area_dampak: string;
  ukuran_perubahan: string;
  indikator_ids: number[];
};

const API = 'http://localhost:5000/api';

const AREA_ORGANISASI = [
  'Hubungan Pekerjaan',
  'Konten Pekerjaan',
  'Keterampilan dan Kompetensi',
  'Lingkungan Kerja',
];

const UKURAN_ORGANISASI = [
  'Tidak Ada',
  'Rendah',
  'Sedang',
  'Tinggi',
];

const createDefaultOrganisasi = (): OrganisasiFormItem[] =>
  AREA_ORGANISASI.map((area) => ({
    area_dampak: area,
    ukuran_perubahan: 'Tidak Ada',
    indikator_ids: [],
  }));

export default function AnalisisPerubahanPage() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes('change.create');
  const canUpdate = permissions.includes('change.update');
  const canDelete = permissions.includes('change.delete');
  const canApprove = permissions.includes('change.approve');
  const canReject = permissions.includes('change.reject');

  const [dataPerubahan, setDataPerubahan] = useState<PerubahanItem[]>([]);
  const [selectedPerubahan, setSelectedPerubahan] =
    useState<PerubahanItem | null>(null);

  const [risikoOptions, setRisikoOptions] = useState<RisikoItem[]>([]);
  const [dampakTeknis, setDampakTeknis] = useState<DampakTeknisItem[]>([]);
  const [analisisOrganisasi, setAnalisisOrganisasi] =
    useState<AnalisisOrganisasi | null>(null);

  const [persetujuanTeknis, setPersetujuanTeknis] = useState<
    PersetujuanItem[]
  >([]);

  const [persetujuanOrganisasi, setPersetujuanOrganisasi] = useState<
    PersetujuanItem[]
  >([]);

  const [indikatorGroups, setIndikatorGroups] = useState<IndikatorGroup[]>([]);

  const [activeTab, setActiveTab] = useState<'teknis' | 'organisasi'>(
    'teknis'
  );

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showTeknisForm, setShowTeknisForm] = useState(false);
  const [editingTeknis, setEditingTeknis] =
    useState<DampakTeknisItem | null>(null);

  const [teknisForm, setTeknisForm] = useState({
    risiko_id: '',
  });

  const [showOrganisasiForm, setShowOrganisasiForm] = useState(false);

  const [organisasiForm, setOrganisasiForm] = useState({
    kesimpulan: 'Tidak Ada',
    rekomendasi: '',
    dampak_organisasi: createDefaultOrganisasi(),
  });

  const [showApproval, setShowApproval] = useState<
    'teknis' | 'organisasi' | null
  >(null);

  const [approvalAction, setApprovalAction] = useState<
    'approve' | 'reject' | null
  >(null);

  const [catatanKeputusan, setCatatanKeputusan] = useState('');

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

    const text = await response.text();

    let result: any = {};

    if (text) {
      try {
        result = JSON.parse(text);
      } catch {
        result = {};
      }
    }

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

  const fetchPerubahan = async () => {
    try {
      setLoading(true);

      const result = await request(`${API}/perubahan`);

      setDataPerubahan(
        Array.isArray(result.data) ? result.data : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil daftar perubahan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchRisikoOptions = async () => {
    try {
      const result = await request(`${API}/risiko`);

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
        ? result.data
        : [];

      setRisikoOptions(data);
    } catch {
      setRisikoOptions([]);
    }
  };

  const fetchIndikatorOrganisasi = async () => {
    try {
      const result = await request(
        `${API}/perubahan/indikator-dampak-organisasi`
      );

      setIndikatorGroups(
        Array.isArray(result.data) ? result.data : []
      );
    } catch {
      setIndikatorGroups([]);
    }
  };

  const fetchDampakTeknis = async (perubahanId: number) => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/dampak-teknis`
    );

    setDampakTeknis(
      Array.isArray(result.data) ? result.data : []
    );
  };

  const fetchAnalisisOrganisasi = async (perubahanId: number) => {
    try {
        const result = await request(
        `${API}/perubahan/${perubahanId}/analisis-organisasi`
        );

        setAnalisisOrganisasi(result.data || null);
    } catch (err) {
        if (
        err instanceof Error &&
        err.message ===
            'Analisis dampak organisasi belum tersedia.'
        ) {
        setAnalisisOrganisasi(null);
        return;
        }

        throw err;
    }
  };

  const fetchPersetujuanTeknis = async (perubahanId: number) => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/persetujuan/analisis-teknis`
    );

    setPersetujuanTeknis(
      Array.isArray(result.data) ? result.data : []
    );
  };

  const fetchPersetujuanOrganisasi = async (perubahanId: number) => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/persetujuan/analisis-organisasi`
    );

    setPersetujuanOrganisasi(
      Array.isArray(result.data) ? result.data : []
    );
  };

  const usesTeknis = (item: PerubahanItem) =>
    item.lingkup === 'Teknis' ||
    item.lingkup === 'Teknis & Organisasi';

  const usesOrganisasi = (item: PerubahanItem) =>
    item.lingkup === 'Organisasi' ||
    item.lingkup === 'Teknis & Organisasi';

  const refreshDetail = async (item: PerubahanItem) => {
    const jobs: Promise<any>[] = [];

    if (usesTeknis(item)) {
      jobs.push(fetchDampakTeknis(item.id));
      jobs.push(fetchPersetujuanTeknis(item.id));
    } else {
      setDampakTeknis([]);
      setPersetujuanTeknis([]);
    }

    if (usesOrganisasi(item)) {
      jobs.push(fetchAnalisisOrganisasi(item.id));
      jobs.push(fetchPersetujuanOrganisasi(item.id));
    } else {
      setAnalisisOrganisasi(null);
      setPersetujuanOrganisasi([]);
    }

    await Promise.all(jobs);
  };

  const openDetail = async (item: PerubahanItem) => {
    try {
      clearNotification();
      setLoadingDetail(true);
      setSelectedPerubahan(item);

      if (usesTeknis(item)) {
        setActiveTab('teknis');
      } else {
        setActiveTab('organisasi');
      }

      await refreshDetail(item);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil detail analisis dampak.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPerubahan();
    fetchRisikoOptions();
    fetchIndikatorOrganisasi();
  }, []);

  const filteredPerubahan = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return dataPerubahan;
    }

    return dataPerubahan.filter((item) => {
      return (
        item.kode_perubahan?.toLowerCase().includes(keyword) ||
        item.nama_layanan?.toLowerCase().includes(keyword) ||
        item.detail_perubahan?.toLowerCase().includes(keyword) ||
        item.lingkup?.toLowerCase().includes(keyword) ||
        item.status?.toLowerCase().includes(keyword)
      );
    });
  }, [dataPerubahan, search]);

  const handleTambahTeknis = () => {
    clearNotification();
    setEditingTeknis(null);
    setTeknisForm({
      risiko_id: '',
    });
    setShowTeknisForm(true);
  };

  const handleEditTeknis = (item: DampakTeknisItem) => {
    clearNotification();
    setEditingTeknis(item);
    setTeknisForm({
      risiko_id: String(item.risiko_id),
    });
    setShowTeknisForm(true);
  };

  const handleSaveTeknis = async () => {
    if (!selectedPerubahan) return;

    if (!teknisForm.risiko_id) {
      setError('Risiko wajib dipilih.');
      return;
    }

    try {
      clearNotification();
      setSaving(true);

      const payload = {
        risiko_id: Number(teknisForm.risiko_id),
        mkb_insiden_id: null,
      };

      const url = editingTeknis
        ? `${API}/perubahan/dampak-teknis/${editingTeknis.id}`
        : `${API}/perubahan/${selectedPerubahan.id}/dampak-teknis`;

      const result = await request(url, {
        method: editingTeknis ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message ||
          'Analisis dampak teknis berhasil disimpan.'
      );

      setShowTeknisForm(false);
      setEditingTeknis(null);
      setTeknisForm({
        risiko_id: '',
      });

      await fetchDampakTeknis(selectedPerubahan.id);
      await fetchPerubahan();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan analisis dampak teknis.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeknis = async (item: DampakTeknisItem) => {
    if (!selectedPerubahan) return;

    const confirmed = window.confirm(
      `Hapus risiko "${item.kode_risiko}" dari analisis teknis?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/dampak-teknis/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result.message ||
          'Analisis dampak teknis berhasil dihapus.'
      );

      await fetchDampakTeknis(selectedPerubahan.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus analisis dampak teknis.'
      );
    }
  };

  const openOrganisasiForm = () => {
    clearNotification();

    if (analisisOrganisasi) {
      setOrganisasiForm({
        kesimpulan: analisisOrganisasi.kesimpulan,
        rekomendasi: analisisOrganisasi.rekomendasi || '',
        dampak_organisasi: AREA_ORGANISASI.map((area) => {
          const existing =
            analisisOrganisasi.dampak_organisasi?.find(
              (item) => item.area_dampak === area
            );

          return {
            area_dampak: area,
            ukuran_perubahan:
              existing?.ukuran_perubahan || 'Tidak Ada',
            indikator_ids:
              existing?.indikator?.map((item) => item.id) || [],
          };
        }),
      });
    } else {
      setOrganisasiForm({
        kesimpulan: 'Tidak Ada',
        rekomendasi: '',
        dampak_organisasi: createDefaultOrganisasi(),
      });
    }

    setShowOrganisasiForm(true);
  };

  const updateUkuranOrganisasi = (
    area: string,
    value: string
  ) => {
    setOrganisasiForm((prev) => ({
      ...prev,
      dampak_organisasi: prev.dampak_organisasi.map(
        (item) =>
          item.area_dampak === area
            ? {
                ...item,
                ukuran_perubahan: value,
              }
            : item
      ),
    }));
  };

  const toggleIndikatorOrganisasi = (
    area: string,
    indikatorId: number
  ) => {
    setOrganisasiForm((prev) => ({
      ...prev,
      dampak_organisasi: prev.dampak_organisasi.map(
        (item) => {
          if (item.area_dampak !== area) {
            return item;
          }

          const selected =
            item.indikator_ids.includes(indikatorId);

          return {
            ...item,
            indikator_ids: selected
              ? item.indikator_ids.filter(
                  (id) => id !== indikatorId
                )
              : [...item.indikator_ids, indikatorId],
          };
        }
      ),
    }));
  };

  const handleSaveOrganisasi = async () => {
    if (!selectedPerubahan) return;

    try {
      clearNotification();
      setSaving(true);

      const payload = {
        kesimpulan: organisasiForm.kesimpulan,
        rekomendasi:
          organisasiForm.rekomendasi.trim() || null,
        dampak_organisasi:
          organisasiForm.dampak_organisasi.map(
            (item) => ({
              area_dampak: item.area_dampak,
              ukuran_perubahan: item.ukuran_perubahan,
              indikator_ids: item.indikator_ids,
            })
          ),
      };

      const url = analisisOrganisasi
        ? `${API}/perubahan/analisis-organisasi/${analisisOrganisasi.id}`
        : `${API}/perubahan/${selectedPerubahan.id}/analisis-organisasi`;

      const result = await request(url, {
        method: analisisOrganisasi ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message ||
          'Analisis dampak organisasi berhasil disimpan.'
      );

      setShowOrganisasiForm(false);

      await fetchAnalisisOrganisasi(selectedPerubahan.id);
      await fetchPerubahan();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan analisis dampak organisasi.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrganisasi = async () => {
    if (!selectedPerubahan || !analisisOrganisasi) return;

    const confirmed = window.confirm(
      'Hapus analisis dampak organisasi ini?'
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/analisis-organisasi/${analisisOrganisasi.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result.message ||
          'Analisis dampak organisasi berhasil dihapus.'
      );

      setAnalisisOrganisasi(null);
      await fetchPerubahan();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus analisis dampak organisasi.'
      );
    }
  };

  const openApprovalModal = (
    type: 'teknis' | 'organisasi',
    action: 'approve' | 'reject'
  ) => {
    clearNotification();
    setShowApproval(type);
    setApprovalAction(action);
    setCatatanKeputusan('');
  };

  const closeApprovalModal = () => {
    setShowApproval(null);
    setApprovalAction(null);
    setCatatanKeputusan('');
  };

  const handleSaveApproval = async () => {
    if (
      !selectedPerubahan ||
      !showApproval ||
      !approvalAction
    ) {
      return;
    }

    try {
      clearNotification();
      setSaving(true);

      const tahap =
        showApproval === 'teknis'
          ? 'analisis-teknis'
          : 'analisis-organisasi';

      const action =
        approvalAction === 'approve'
          ? 'setujui'
          : 'tolak';

      const result = await request(
        `${API}/perubahan/${selectedPerubahan.id}/persetujuan/${tahap}/${action}`,
        {
          method: 'POST',
          body: JSON.stringify({
            catatan_keputusan:
              catatanKeputusan.trim() || null,
          }),
        }
      );

      setMessage(
        result.message ||
          'Keputusan analisis berhasil disimpan.'
      );

      closeApprovalModal();

      await refreshDetail(selectedPerubahan);
      await fetchPerubahan();

      const latest = await request(
        `${API}/perubahan/${selectedPerubahan.id}`
      );

      if (latest.data) {
        setSelectedPerubahan(latest.data);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan keputusan analisis.'
      );
    } finally {
      setSaving(false);
    }
  };

  const latestTeknisApproval =
    persetujuanTeknis.length > 0
      ? persetujuanTeknis[0]
      : null;

  const latestOrganisasiApproval =
    persetujuanOrganisasi.length > 0
      ? persetujuanOrganisasi[0]
      : null;

  const getApprovalClass = (keputusan?: string) => {
    if (keputusan === 'Disetujui') {
      return 'bg-green-100 text-green-700';
    }

    if (keputusan === 'Tidak Disetujui') {
      return 'bg-red-100 text-red-700';
    }

    return 'bg-slate-100 text-slate-600';
  };

  const getStatusClass = (status: string) => {
    if (status === 'Implementasi') {
      return 'bg-blue-100 text-blue-700';
    }

    if (status === 'Analisis') {
      return 'bg-yellow-100 text-yellow-700';
    }

    if (status === 'Evaluasi') {
      return 'bg-purple-100 text-purple-700';
    }

    if (status === 'Selesai') {
      return 'bg-green-100 text-green-700';
    }

    return 'bg-slate-100 text-slate-600';
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
          MPR02 - Analisis Dampak
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Analisis dampak teknis dan organisasi terhadap
          perubahan Layanan Digital Pemerintah.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 2;
            const available =
              step.number === 1 || step.number === 2;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-[110px] flex-col items-center text-center">
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      if (available) {
                        navigate(step.route);
                      }
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                      active
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : available
                        ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                        : 'cursor-default border-slate-200 bg-white text-slate-400'
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

      {!selectedPerubahan ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-800">
              Daftar Perubahan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pilih perubahan yang akan dilakukan analisis
              dampak.
            </p>
          </div>

          <div className="p-5">
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari ID perubahan, layanan, lingkup, atau status..."
              className="mb-5 w-full max-w-lg rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
            />

            <div>
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <thead>
                  <th className="w-[16%] px-3 py-3">
                    ID Perubahan
                    </th>

                    <th className="w-[20%] px-3 py-3">
                    Layanan Digital
                    </th>

                    <th className="w-[29%] px-3 py-3">
                    Detail Perubahan
                    </th>

                    <th className="w-[10%] px-3 py-3">
                    Klasifikasi
                    </th>

                    <th className="w-[9%] px-3 py-3">
                    Lingkup
                    </th>

                    <th className="w-[9%] px-3 py-3 text-center">
                    Status
                    </th>

                    <th className="w-[7%] px-3 py-3 text-center">
                    Aksi
                  </th>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredPerubahan.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Belum ada perubahan yang dapat dianalisis.
                      </td>
                    </tr>
                  ) : (
                    filteredPerubahan.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 align-top hover:bg-slate-50"
                      >
                        <td className="px-3 py-3 align-top font-semibold text-slate-800">
                          <span className="break-words text-xs">
                            {item.kode_perubahan}
                          </span>
                        </td>

                        <td className="break-words px-4 py-3">
                          <div className="font-medium text-slate-800">
                            {item.nama_layanan || '-'}
                          </div>

                          {item.kode_layanan && (
                            <div className="mt-1 text-xs text-slate-400">
                              {item.kode_layanan}
                            </div>
                          )}
                        </td>

                        <td className="break-words px-4 py-3">
                          {item.detail_perubahan}
                        </td>

                        <td className="px-4 py-3">
                          {item.klasifikasi}
                        </td>

                        <td className="px-4 py-3">
                          {item.lingkup}
                        </td>

                        <td className="px-3 py-3 align-top text-center">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2 py-1 text-xs font-semibold ${getStatusClass(
                            item.status
                            )}`}
                           >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-3 py-3 align-top text-center">
                          <button
                            type="button"
                            onClick={() => openDetail(item)}
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Analisis
                          </button>
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
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-lg font-semibold text-slate-800">
                    {selectedPerubahan.kode_perubahan}
                  </h2>

                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClass(
                      selectedPerubahan.status
                    )}`}
                  >
                    {selectedPerubahan.status}
                  </span>
                </div>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedPerubahan.nama_layanan || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPerubahan(null);
                  setDampakTeknis([]);
                  setAnalisisOrganisasi(null);
                  setPersetujuanTeknis([]);
                  setPersetujuanOrganisasi([]);
                  clearNotification();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali ke Daftar
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Layanan Digital
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.nama_layanan || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Klasifikasi
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.klasifikasi}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Lingkup
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.lingkup}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Unit Pemohon
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.nama_unit_pemohon || '-'}
                </p>
              </div>

              <div className="md:col-span-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Detail Perubahan
                </p>

                <p className="mt-1 text-sm text-slate-800">
                  {selectedPerubahan.detail_perubahan}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex border-b border-slate-200">
              {usesTeknis(selectedPerubahan) && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('teknis')
                  }
                  className={`px-5 py-3 text-sm font-semibold ${
                    activeTab === 'teknis'
                      ? 'border-b-2 border-slate-800 text-slate-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  MPR02A - Dampak Teknis
                </button>
              )}

              {usesOrganisasi(selectedPerubahan) && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveTab('organisasi')
                  }
                  className={`px-5 py-3 text-sm font-semibold ${
                    activeTab === 'organisasi'
                      ? 'border-b-2 border-slate-800 text-slate-800'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  MPR02B - Dampak Organisasi
                </button>
              )}
            </div>

            {loadingDetail ? (
              <div className="p-10 text-center text-sm text-slate-500">
                Memuat analisis dampak...
              </div>
            ) : activeTab === 'teknis' &&
              usesTeknis(selectedPerubahan) ? (
              <div>
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Analisis Dampak Teknis
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Identifikasi risiko yang berkaitan
                      dengan perubahan.
                    </p>
                  </div>

                  {canCreate && (
                    <button
                      type="button"
                      onClick={handleTambahTeknis}
                      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                      Tambah Risiko
                    </button>
                  )}
                </div>

                <div className="p-5">
                  <div className="overflow-x-auto">
                    <table className="w-full table-fixed border-collapse text-left text-sm">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                          <th className="w-[12%] px-3 py-3">
                            Kode Risiko
                          </th>

                          <th className="w-[24%] px-3 py-3">
                            Peristiwa Risiko
                          </th>

                          <th className="w-[18%] px-3 py-3">
                            Penyebab
                          </th>

                          <th className="w-[18%] px-3 py-3">
                            Dampak
                          </th>

                          <th className="w-[9%] px-3 py-3">
                            Kemungkinan
                          </th>

                          <th className="w-[9%] px-3 py-3">
                            Nilai Dampak
                          </th>

                          <th className="w-[10%] px-3 py-3 text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {dampakTeknis.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="py-8 text-center text-slate-400"
                            >
                              Belum ada analisis dampak teknis.
                            </td>
                          </tr>
                        ) : (
                          dampakTeknis.map((item) => (
                            <tr
                              key={item.id}
                              className="border-b border-slate-100 align-top"
                            >
                              <td className="break-words px-3 py-3 font-semibold text-slate-800">
                                {item.kode_risiko}
                              </td>

                              <td className="break-words px-3 py-3">
                                {item.peristiwa_risiko}
                              </td>

                              <td className="break-words px-3 py-3">
                                {item.penyebab || '-'}
                              </td>

                              <td className="break-words px-3 py-3">
                                {item.dampak || '-'}
                              </td>

                              <td className="px-3 py-3">
                                {item.kemungkinan ?? '-'}
                              </td>

                              <td className="px-3 py-3">
                                {item.nilai_dampak ?? '-'}
                              </td>

                              <td className="px-3 py-3">
                                <div className="flex flex-col items-center gap-2">
                                  {canUpdate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleEditTeknis(
                                          item
                                        )
                                      }
                                      className="w-[70px] rounded-md border border-blue-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                                    >
                                      Edit
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteTeknis(
                                          item
                                        )
                                      }
                                      className="w-[70px] rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
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

                  <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Persetujuan Analisis Teknis
                        </p>

                        <div className="mt-2">
                          {latestTeknisApproval ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getApprovalClass(
                                latestTeknisApproval.keputusan
                              )}`}
                            >
                              {latestTeknisApproval.keputusan}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">
                              Belum ada keputusan.
                            </span>
                          )}
                        </div>
                      </div>

                      {dampakTeknis.length > 0 && !latestTeknisApproval && (
                        <div className="flex gap-2">
                          {canReject && (
                            <button
                              type="button"
                              onClick={() =>
                                openApprovalModal(
                                  'teknis',
                                  'reject'
                                )
                              }
                              className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Tolak
                            </button>
                          )}

                          {canApprove && (
                            <button
                              type="button"
                              onClick={() =>
                                openApprovalModal(
                                  'teknis',
                                  'approve'
                                )
                              }
                              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                            >
                              Setujui
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {latestTeknisApproval?.catatan_keputusan && (
                      <p className="mt-3 text-sm text-slate-600">
                        {latestTeknisApproval.catatan_keputusan}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

                        {activeTab === 'organisasi' &&
            usesOrganisasi(selectedPerubahan) ? (
              <div>
                <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800">
                      Analisis Dampak Organisasi
                    </h3>

                    <p className="mt-1 text-sm text-slate-500">
                      Penilaian dampak perubahan terhadap organisasi.
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {analisisOrganisasi && canDelete && (
                      <button
                        type="button"
                        onClick={handleDeleteOrganisasi}
                        className="rounded-md border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    )}

                    {(canCreate || canUpdate) && (
                      <button
                        type="button"
                        onClick={openOrganisasiForm}
                        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        {analisisOrganisasi
                          ? 'Edit Analisis'
                          : 'Tambah Analisis'}
                      </button>
                    )}
                  </div>
                </div>

                <div className="p-5">
                  {!analisisOrganisasi ? (
                    <div className="py-10 text-center text-sm text-slate-400">
                      Belum ada analisis dampak organisasi.
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="overflow-x-auto">
                        <table className="w-full table-fixed border-collapse text-left text-sm">
                          <thead>
                            <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                              <th className="w-[24%] px-4 py-3">
                                Area Dampak
                              </th>

                              <th className="w-[18%] px-4 py-3">
                                Ukuran Perubahan
                              </th>

                              <th className="w-[58%] px-4 py-3">
                                Indikator
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {analisisOrganisasi.dampak_organisasi.map(
                              (item) => (
                                <tr
                                  key={item.area_dampak}
                                  className="border-b border-slate-100 align-top"
                                >
                                  <td className="px-4 py-3 font-semibold text-slate-800">
                                    {item.area_dampak}
                                  </td>

                                  <td className="px-4 py-3">
                                    {item.ukuran_perubahan}
                                  </td>

                                  <td className="px-4 py-3">
                                    {item.indikator &&
                                    item.indikator.length > 0 ? (
                                      <ul className="space-y-1">
                                        {item.indikator.map(
                                          (indikator) => (
                                            <li
                                              key={indikator.id}
                                              className="text-slate-700"
                                            >
                                              {indikator.indikator}
                                            </li>
                                          )
                                        )}
                                      </ul>
                                    ) : (
                                      <span className="text-slate-400">
                                        -
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              )
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Kesimpulan
                          </p>

                          <p className="mt-2 text-sm font-semibold text-slate-800">
                            {analisisOrganisasi.kesimpulan}
                          </p>
                        </div>

                        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                          <p className="text-xs font-semibold uppercase text-slate-500">
                            Rekomendasi
                          </p>

                          <p className="mt-2 text-sm text-slate-800">
                            {analisisOrganisasi.rekomendasi ||
                              '-'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          Persetujuan Analisis Organisasi
                        </p>

                        <div className="mt-2">
                          {latestOrganisasiApproval ? (
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getApprovalClass(
                                latestOrganisasiApproval.keputusan
                              )}`}
                            >
                              {latestOrganisasiApproval.keputusan}
                            </span>
                          ) : (
                            <span className="text-sm text-slate-500">
                              Belum ada keputusan.
                            </span>
                          )}
                        </div>
                      </div>

                      {analisisOrganisasi && (
                        <div className="flex gap-2">
                          {canReject && (
                            <button
                              type="button"
                              onClick={() =>
                                openApprovalModal(
                                  'organisasi',
                                  'reject'
                                )
                              }
                              className="rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Tolak
                            </button>
                          )}

                          {canApprove && (
                            <button
                              type="button"
                              onClick={() =>
                                openApprovalModal(
                                  'organisasi',
                                  'approve'
                                )
                              }
                              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                            >
                              Setujui
                            </button>
                          )}
                        </div>
                      )}
                    </div>

                    {latestOrganisasiApproval?.catatan_keputusan && (
                      <p className="mt-3 text-sm text-slate-600">
                        {
                          latestOrganisasiApproval.catatan_keputusan
                        }
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {showTeknisForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingTeknis
                  ? 'Edit Analisis Dampak Teknis'
                  : 'Tambah Analisis Dampak Teknis'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Pilih risiko yang berkaitan dengan perubahan.
              </p>
            </div>

            <div className="p-5">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Risiko
              </label>

              <select
                value={teknisForm.risiko_id}
                onChange={(e) =>
                  setTeknisForm({
                    risiko_id: e.target.value,
                  })
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
              >
                <option value="">
                  Pilih risiko
                </option>

                {risikoOptions.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.kode_risiko} - {item.peristiwa_risiko}
                  </option>
                ))}
              </select>

              {risikoOptions.length === 0 && (
                <p className="mt-2 text-xs text-amber-600">
                  Belum ada data risiko yang dapat dipilih.
                </p>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowTeknisForm(false);
                  setEditingTeknis(null);
                  setTeknisForm({
                    risiko_id: '',
                  });
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveTeknis}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

     {showOrganisasiForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
            <div className="flex min-h-full justify-center p-4">
            <div className="my-6 w-full max-w-4xl self-start rounded-lg bg-white shadow-xl">
                <div className="sticky top-0 z-20 rounded-t-lg border-b border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-800">
                    {analisisOrganisasi
                    ? 'Edit Analisis Dampak Organisasi'
                    : 'Tambah Analisis Dampak Organisasi'}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                    Nilai dampak organisasi pada seluruh area yang diwajibkan.
                </p>
                </div>

                <div className="space-y-5 p-5">
                {organisasiForm.dampak_organisasi.map((item) => {
                    const group = indikatorGroups.find(
                    (group) =>
                        group.area_dampak === item.area_dampak
                    );

                    return (
                    <div
                        key={item.area_dampak}
                        className="rounded-lg border border-slate-200 p-4"
                    >
                        <div className="grid gap-4 md:grid-cols-[1fr_220px] md:items-start">
                        <div>
                            <h4 className="font-semibold text-slate-800">
                            {item.area_dampak}
                            </h4>

                            <p className="mt-1 text-xs text-slate-500">
                            Pilih indikator yang terdampak.
                            </p>
                        </div>

                        <div>
                            <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                            Ukuran Perubahan
                            </label>

                            <select
                            value={item.ukuran_perubahan}
                            onChange={(e) =>
                                updateUkuranOrganisasi(
                                item.area_dampak,
                                e.target.value
                                )
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                            >
                            {UKURAN_ORGANISASI.map((ukuran) => (
                                <option
                                key={ukuran}
                                value={ukuran}
                                >
                                {ukuran}
                                </option>
                            ))}
                            </select>
                        </div>
                        </div>

                        <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {group?.indikator &&
                        group.indikator.length > 0 ? (
                            group.indikator.map((indikator) => (
                            <label
                                key={indikator.id}
                                className="flex cursor-pointer items-start gap-3 rounded-md border border-slate-200 p-3 hover:bg-slate-50"
                            >
                                <input
                                type="checkbox"
                                checked={item.indikator_ids.includes(
                                    indikator.id
                                )}
                                onChange={() =>
                                    toggleIndikatorOrganisasi(
                                    item.area_dampak,
                                    indikator.id
                                    )
                                }
                                className="mt-1"
                                />

                                <span className="text-sm text-slate-700">
                                {indikator.indikator}
                                </span>
                            </label>
                            ))
                        ) : (
                            <p className="text-sm text-slate-400">
                            Belum ada indikator pada area ini.
                            </p>
                        )}
                        </div>
                    </div>
                    );
                })}

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Kesimpulan
                    </label>

                    <select
                        value={organisasiForm.kesimpulan}
                        onChange={(e) =>
                        setOrganisasiForm({
                            ...organisasiForm,
                            kesimpulan: e.target.value,
                        })
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                        {UKURAN_ORGANISASI.map((ukuran) => (
                        <option
                            key={ukuran}
                            value={ukuran}
                        >
                            {ukuran}
                        </option>
                        ))}
                    </select>
                    </div>

                    <div>
                    <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Rekomendasi
                    </label>

                    <textarea
                        rows={4}
                        value={organisasiForm.rekomendasi}
                        onChange={(e) =>
                        setOrganisasiForm({
                            ...organisasiForm,
                            rekomendasi: e.target.value,
                        })
                        }
                        placeholder="Masukkan rekomendasi"
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                    />
                    </div>
                </div>
                </div>

                <div className="sticky bottom-0 flex justify-end gap-3 rounded-b-lg border-t border-slate-200 bg-white p-5">
                <button
                    type="button"
                    onClick={() =>
                    setShowOrganisasiForm(false)
                    }
                    disabled={saving}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                    Batal
                </button>

                <button
                    type="button"
                    onClick={handleSaveOrganisasi}
                    disabled={saving}
                    className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                    {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
                </div>
            </div>
            </div>
        </div>
        )}

      {showApproval && approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 z-10 rounded-t-lg border-b border-slate-200 bg-white p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {approvalAction === 'approve'
                  ? 'Setujui Analisis'
                  : 'Tolak Analisis'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {showApproval === 'teknis'
                  ? 'Analisis Dampak Teknis'
                  : 'Analisis Dampak Organisasi'}
              </p>
            </div>

            <div className="p-5">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Catatan Keputusan
              </label>

              <textarea
                rows={4}
                value={catatanKeputusan}
                onChange={(e) =>
                  setCatatanKeputusan(e.target.value)
                }
                placeholder="Catatan keputusan dapat dikosongkan"
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={closeApprovalModal}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveApproval}
                disabled={saving}
                className={`rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
                  approvalAction === 'approve'
                    ? 'bg-slate-800 hover:bg-slate-700'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {saving
                  ? 'Menyimpan...'
                  : approvalAction === 'approve'
                  ? 'Setujui'
                  : 'Tolak'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

