import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface RisikoItem {
  id: number;

  konteks_nama_upr?: string | null;
  konteks_tahun?: number | string | null;

  sasaran_pembangunan_nasional?: string | null;
  sasaran_upr?: string | null;
  indikator_kinerja?: string | null;

  pemilik_layanan?: string | null;

  kode_risiko?: string | null;
  peristiwa_risiko?: string | null;
  penyebab?: string | null;
  dampak?: string | null;

  kemungkinan?: number | null;
  nilai_dampak?: number | null;
  besaran_risiko?: number | null;

  keputusan_perlakuan?: string | null;
  kategori_risiko?: string | null;
  area_dampak?: string| null;
  prioritas_risiko?: string | null;

  deskripsi_detail_perlakuan?: string | null;
  waktu_rencana_perlakuan?: string | null;
  pembuat?: string | null;
  nama_penanggung_jawab?: string | null;

  level_kemungkinan_residual?: number | null;
  level_dampak_residual?: number | null;
  besaran_risiko_residual?: number | null;

  kode_layanan?: string | null;
  nama_layanan?: string | null;
  kode_prioritas?: string | null;

  strategis_operasional?: string | null;
  lintas_sektor?: boolean | number | null;
  membutuhkan_perubahan?: boolean | number | null;
  status_risiko?: 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak' | null;
  
  nama_layanan_pendukung?: string | null;
  nama_layanan_prioritas?: string | null;
  ippd_terkait_text?: string | null;
}

const processSteps = [
  {
    number: 1,
    label: 'Penetapan Konteks',
    route: '/risiko/konteks',
  },
  {
    number: 2,
    label: 'Profil & Penilaian Risiko',
    route: '/risiko',
  },
  {
    number: 3,
    label: 'Layanan Digital Prioritas',
    route: '/risiko/layanan-prioritas',
  },
  {
    number: 4,
    label: 'Peta Risiko',
    route: '/risiko/peta-risiko',
  },
  {
    number: 5,
    label: 'Pemantauan & Pelaporan',
    route: '/risiko/monitoring/semester-1',
  },
];

export default function RisikoPage() {
  const navigate = useNavigate();
  const [openActionId, setOpenActionId] = useState<number | null>(null);
  const [dataRisiko, setDataRisiko] = useState<RisikoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    sasaran_pembangunan_nasional: '',
    sasaran_upr: '',
    indikator_kinerja: '',
    kode_risiko: '',
    kategori_risiko: '',
    peristiwa_risiko: '',
    penyebab: '',
    dampak: '',
    kemungkinan: '1',
    nilai_dampak: '1',
    keputusan_perlakuan: 'Mengurangi Risiko',
    area_dampak: '',
    prioritas_risiko: '',
    deskripsi_detail_perlakuan: '',
    waktu_rencana_perlakuan: '',
    penanggung_jawab_id: '',
    level_kemungkinan_residual: '1',
    level_dampak_residual: '1',
    nama_layanan_pendukung: '',
    nama_layanan_prioritas: '',
    ippd_terkait_text: '',
    pemilik_layanan: '',
    strategis_operasional: '',
    lintas_sektor: false,
    membutuhkan_perubahan: false,
  });

  const savedUser = sessionStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  // permission user
  const permissions: string[] = user?.permissions || [];
  const canCreate = permissions.includes('risk.create');
  const canUpdate = permissions.includes('risk.update');
  const canDelete = permissions.includes('risk.delete');

  
  const [penanggungJawabOptions, setpenanggungJawabOptions] = useState<
  {
      id: number;
      nama: string;
      upr_instansi?: string | null;
      nama_instansi?: string | null;
      nama_unit?: string | null;
      jabatan?: string | null;
      nama_role?: string | null;

  }[]
  >([]);

  const [selectedRisiko, setSelectedRisiko] = useState<RisikoItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);


  useEffect(() => {
    const token = sessionStorage.getItem('token');

    fetch('http://localhost:5000/api/risiko/penanggung-jawab-options', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if(!res.ok) {
          const errorData = await res.json();

          throw new Error(
            errorData.message ||
              errorData.error ||
              'Gagal mengambil daftar penangungg jawab'
          ); 
        }

        return res.json();
      })
      .then((data) => {
        setpenanggungJawabOptions(data);
      })
      .catch((err) => {
        console.error('Error fetching penanggung jawab:', err);
      });
  }, []);

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    fetch('http://localhost:5000/api/risiko', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();

          throw new Error(
            errorData.message || 'Gagal mengambil data risiko'
          );
        }

        return res.json();
      })
      .then((data: RisikoItem[]) => {
        setDataRisiko(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching risiko:', err);
        setLoading(false);
      });
  }, []);

  const handleDetail = async (id: number) => {
    const token = sessionStorage.getItem('token');

    try {
      setLoadingDetail(true);
      setMessage('');

      const response = await fetch(
        `http://localhost:5000/api/risiko/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if(!response.ok) {
        throw new Error(
          result.message || 
            result.error ||
            'Gagal mengambil detail risiko'
        );
      }

      console.log('DETAIL RISIKO:', result);
      setSelectedRisiko(result);

    } catch (err) {
      const error = err as Error;
      
      console.error('Error detail risiko:', err);
      setMessage(error.message)
      
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleEdit = async (id: number) => {
    const token = sessionStorage.getItem('token');

    try {
      setLoadingDetail(true);
      setMessage('');

      const response = await fetch(
        `http://localhost:5000/api/risiko/${id}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Gagal mengambil data risiko'
        );
      }

      setEditingId(id);

      setFormData({
        sasaran_pembangunan_nasional:
          result.sasaran_pembangunan_nasional || '',
        sasaran_upr: result.sasaran_upr || '',
        indikator_kinerja: result.indikator_kinerja || '',
        kode_risiko: result.kode_risiko || '',
        kategori_risiko: result.kategori_risiko || '',
        peristiwa_risiko: result.peristiwa_risiko || '',
        penyebab: result.penyebab || '',
        dampak: result.dampak || '',
        kemungkinan: String(result.kemungkinan ?? 1),
        nilai_dampak: String(result.nilai_dampak ?? 1),
        keputusan_perlakuan:
          result.keputusan_perlakuan || 'Mengurangi Risiko',
        area_dampak: result.area_dampak || '',
        prioritas_risiko: result.prioritas_risiko || '',
        deskripsi_detail_perlakuan:
          result.deskripsi_detail_perlakuan || '',
        waktu_rencana_perlakuan:
          result.waktu_rencana_perlakuan
            ? result.waktu_rencana_perlakuan.slice(0, 10)
            : '',
        penanggung_jawab_id: result.penanggung_jawab_id
          ? String(result.penanggung_jawab_id)
          : '',
        level_kemungkinan_residual: String(
          result.level_kemungkinan_residual ?? 1
        ),
        level_dampak_residual: String(
          result.level_dampak_residual ?? 1
        ),
        nama_layanan_pendukung:
          result.nama_layanan_pendukung || '',

        nama_layanan_prioritas:
          result.nama_layanan_prioritas || '',

        ippd_terkait_text:
          result.ippd_terkait_text || '',
        pemilik_layanan: result.pemilik_layanan || '',
        strategis_operasional:
          result.strategis_operasional || '',
        lintas_sektor: Boolean(result.lintas_sektor),
        membutuhkan_perubahan: Boolean(
          result.membutuhkan_perubahan
        ),
    });

    setCurrentStep(1);
    setShowForm(true);
    setSelectedRisiko(null);

  } catch (err) {
    const error = err as Error;

    console.error('Error edit risiko:', error);
    setMessage(error.message);

  } finally {
    setLoadingDetail(false);
  }
};

  const handleDelete = async (id: number) => {
    const token = sessionStorage.getItem('token');

    const confirmDelete = window.confirm(
      'Yakin ingin menghapus data risiko ini?'
    );

    if (!confirmDelete) return;

    try {
      setMessage('');

      const response = await fetch(
        `http://localhost:5000/api/risiko/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Gagal menghapus data risiko'
        );
      }

      setMessage('Data risiko berhasil dihapus.');

      setDataRisiko((prev) =>
        prev.filter((item) => item.id !== id)
      );

      if (selectedRisiko?.id === id) {
        setSelectedRisiko(null);
      }

    } catch (err) {
      const error = err as Error;

      console.error('Error delete risiko:', error);
      setMessage(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 5) {
      return;
    }

    const token = sessionStorage.getItem('token');

    try {
      setSaving(true);
      setMessage('');

      const isEdit = editingId !== null;

      const response = await fetch(
        isEdit
          ? `http://localhost:5000/api/risiko/${editingId}`
          :  'http://localhost:5000/api/risiko',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            // a. identifikasi risiko
            sasaran_pembangunan_nasional: formData.sasaran_pembangunan_nasional,
            sasaran_upr: formData.sasaran_upr,
            indikator_kinerja: formData.indikator_kinerja,
            kode_risiko: formData.kode_risiko,
            peristiwa_risiko: formData.peristiwa_risiko,

            // b. analisis dan evaluasi risiko
            kategori_risiko: formData.kategori_risiko,
            penyebab: formData.penyebab,
            dampak: formData.dampak,
            area_dampak: formData.area_dampak,
            kemungkinan: Number(formData.kemungkinan),
            nilai_dampak: Number(formData.nilai_dampak),
            prioritas_risiko: formData.prioritas_risiko,

            // c. perlakuan risiko
            keputusan_perlakuan: formData.keputusan_perlakuan,
            deskripsi_detail_perlakuan: formData.deskripsi_detail_perlakuan,
            waktu_rencana_perlakuan: formData.waktu_rencana_perlakuan,
            penanggung_jawab_id: formData.penanggung_jawab_id ? Number(formData.penanggung_jawab_id) : null,

            // d. risiko residual
            level_kemungkinan_residual: Number(formData.level_kemungkinan_residual),
            level_dampak_residual: Number(formData.level_dampak_residual),

            // e. kolom tambahan
            nama_layanan_pendukung: formData.nama_layanan_pendukung,
            nama_layanan_prioritas: formData.nama_layanan_prioritas,
            pemilik_layanan: formData.pemilik_layanan,
            strategis_operasional: formData.strategis_operasional,
            lintas_sektor: formData.lintas_sektor,
            membutuhkan_perubahan: formData.membutuhkan_perubahan,
            ippd_terkait_text: formData.ippd_terkait_text,
          }),
        }
      );

            const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          result.error ||
          'Gagal menambahkan risiko'
        );
      }

      setMessage('Data risiko berhasil ditambahkan.');

      // Reset form HANYA jika penyimpanan berhasil
      setFormData({
        sasaran_pembangunan_nasional: '',
        sasaran_upr: '',
        indikator_kinerja: '',
        kode_risiko: '',
        kategori_risiko: '',
        peristiwa_risiko: '',
        penyebab: '',
        dampak: '',
        kemungkinan: '1',
        nilai_dampak: '1',
        keputusan_perlakuan: 'Mengurangi Risiko',
        area_dampak: '',
        prioritas_risiko: '',
        deskripsi_detail_perlakuan: '',
        waktu_rencana_perlakuan: '',
        penanggung_jawab_id: '',
        level_kemungkinan_residual: '1',
        level_dampak_residual: '1',
        nama_layanan_pendukung: '',
        nama_layanan_prioritas: '',
        pemilik_layanan: '',
        ippd_terkait_text: '',
        strategis_operasional: '',
        lintas_sektor: false,
        membutuhkan_perubahan: false, 
      });

      setCurrentStep(1);
      setShowForm(false);
      setEditingId(null);

      // Refresh daftar risiko setelah berhasil simpan
      const refreshResponse = await fetch(
        'http://localhost:5000/api/risiko',
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!refreshResponse.ok) {
        throw new Error(
          'Data berhasil disimpan, tetapi gagal memuat ulang daftar risiko!'
        );
      }

      const refreshData: RisikoItem[] =
        await refreshResponse.json();

      setDataRisiko(refreshData);

    } catch (err) {
      const error = err as Error;

      console.error('Error create risiko:', error);
      setMessage(error.message);

    } finally {
      setSaving(false);
    }
  };

  const [search, setSearch] = useState('');
  const [kategoriFilter, setKategoriFilter] = useState('Semua');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const kategoriOptions = Array.from(
      new Set(
        dataRisiko
          .map((item) => item.kategori_risiko)
          .filter(
            (item): item is string =>
              Boolean(item && item.trim())
          )
      )
    ).sort();

  const filteredRisiko = dataRisiko
    .filter((item) => {
      const keyword = search.trim().toLowerCase();

      const matchSearch =
        !keyword ||
        item.kode_risiko
          ?.toLowerCase()
          .includes(keyword) ||
        item.peristiwa_risiko
          ?.toLowerCase()
          .includes(keyword) ||
        item.kategori_risiko
          ?.toLowerCase()
          .includes(keyword);

      const matchKategori =
        kategoriFilter === 'Semua' ||
        item.kategori_risiko === kategoriFilter;

      const matchStatus =
        statusFilter === 'Semua' ||
        (item.status_risiko || 'Draft') ===
          statusFilter;

      return (
        matchSearch &&
        matchKategori &&
        matchStatus
      );
    })
    .sort((a, b) =>
      (a.kode_risiko || '').localeCompare(
        b.kode_risiko || '',
        undefined,
        { numeric: true }
      )
    );

  const getStatusClass = (
    status?: string | null
  ) => {
    switch (status) {
      case 'Disetujui':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      case 'Diajukan':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'Ditolak':
        return 'bg-red-50 text-red-700 border-red-200';

      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPrioritasClass = (
    prioritas?: string | null
  ) => {
    switch (
      prioritas?.trim().toLowerCase()
    ) {
      case 'tinggi':
        return 'bg-red-50 text-red-700 border-red-200';

      case 'sedang':
        return 'bg-amber-50 text-amber-700 border-amber-200';

      case 'rendah':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';

      default:
        return 'bg-gray-50 text-gray-600 border-gray-200';
    }
  };

  const getNextKodeRisiko = () => {
  const numbers = dataRisiko
    .map((item) => {
      const match = item.kode_risiko
        ?.trim()
        .match(/^RSK-(\d+)$/i);

      return match
        ? Number(match[1])
        : 0;
    });

  const maxNumber =
    numbers.length > 0
      ? Math.max(...numbers)
      : 0;

  return `RSK-${String(
    maxNumber + 1
  ).padStart(3, '0')}`;
};

return (
  <div className="p-6">
    <div className="mb-6">
      <h1 className="text-2xl font-bold text-slate-800">
        Manajemen Risiko
      </h1>

      <p className="mt-1 text-sm text-slate-500">
        Proses 2 - Profil dan Penilaian Risiko
      </p>
    </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start">
          {processSteps.map((step, index) => {
            const active = step.number === 2;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <button
                  type="button"
                  onClick={() => navigate(step.route)}
                  className="flex min-w-[110px] flex-col items-center text-center"
                >
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
                    className={`mt-2 max-w-[150px] text-xs leading-4 ${
                      active
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {index < processSteps.length - 1 && (
                  <div className="mx-3 mt-[18px] h-px flex-1 bg-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

    {message && (
      <div className="mb-4 text-sm text-gray-700">
        {message}
      </div>
    )}

    {showForm && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                {editingId ? 'Edit Risiko' : 'Tambah Risiko'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Lengkapi data Form 1.0 Profil dan Penilaian Risiko.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingId(null);
                setCurrentStep(1);
              }}
              className="text-xl text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>

          <div className="p-6">
            <div className="mb-6">
              <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                {[
                  { step: 1, label: 'Identifikasi Risiko' },
                  { step: 2, label: 'Analisis dan Evaluasi' },
                  { step: 3, label: 'Perlakuan Risiko' },
                  { step: 4, label: 'Risiko Residual' },
                  { step: 5, label: 'Kolom Tambahan' },
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setCurrentStep(item.step)}
                    className={`min-h-[52px] rounded-lg border px-3 py-2 text-sm font-semibold ${
                      currentStep === item.step
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.step}. {item.label}
                  </button>
                ))}
              </div>
            </div>

        <form onSubmit={handleSubmit}>
          {currentStep === 1 && (
            <div className="space-y-6">
              <section>
                <h4 className="mb-4 text-sm font-bold text-slate-900">
                  Informasi Konteks
                </h4>

                <div className="space-y-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Sasaran Pembangunan Nasional
                    </label>

                    <textarea
                      value={formData.sasaran_pembangunan_nasional}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sasaran_pembangunan_nasional: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="Masukkan sasaran pembangunan nasional"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Sasaran UPR
                    </label>

                    <textarea
                      value={formData.sasaran_upr}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          sasaran_upr: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="Masukkan sasaran UPR"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Indikator Kinerja
                    </label>

                    <textarea
                      value={formData.indikator_kinerja}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          indikator_kinerja: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="Masukkan indikator kinerja"
                    />
                  </div>
                </div>
              </section>

              <section className="border-t border-slate-200 pt-5">
                <h4 className="mb-4 text-sm font-bold text-slate-900">
                  Identifikasi Risiko
                </h4>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Kode Risiko
                    </label>

                    <input
                      type="text"
                      value={formData.kode_risiko}
                      readOnly
                      className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                      placeholder="Contoh: RSK-001"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="mb-1 block text-sm font-medium text-slate-700">
                      Peristiwa Risiko
                    </label>

                    <textarea
                      value={formData.peristiwa_risiko}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          peristiwa_risiko: e.target.value,
                        })
                      }
                      rows={2}
                      className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                      placeholder="Masukkan peristiwa risiko"
                    />
                  </div>
                </div>
              </section>
            </div>
          )}

          {currentStep === 2 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Kategori Risiko
                </label>

                <input
                  type="text"
                  value={formData.kategori_risiko}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kategori_risiko: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan kategori risiko"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Area Dampak
                </label>

                <input
                  type="text"
                  value={formData.area_dampak}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      area_dampak: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan area dampak"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Penyebab
                </label>

                <textarea
                  value={formData.penyebab}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      penyebab: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan penyebab"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Dampak
                </label>

                <textarea
                  value={formData.dampak}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      dampak: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan dampak"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Level Kemungkinan
                </label>

                <select
                  value={formData.kemungkinan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kemungkinan: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Level Dampak
                </label>

                <select
                  value={formData.nilai_dampak}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nilai_dampak: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Besaran Risiko
                </label>

                <input
                  type="text"
                  value={
                    Number(formData.kemungkinan) *
                    Number(formData.nilai_dampak)
                  }
                  readOnly
                  className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Prioritas Risiko
                </label>

                <input
                  type="text"
                  value={formData.prioritas_risiko}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      prioritas_risiko: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan prioritas risiko"
                />
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Keputusan Perlakuan Risiko
                </label>

                <select
                  value={formData.keputusan_perlakuan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      keputusan_perlakuan: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="Mengurangi Risiko">
                    Mengurangi Risiko
                  </option>
                  <option value="Membagi Risiko">
                    Membagi Risiko
                  </option>
                  <option value="Menerima Risiko">
                    Menerima Risiko
                  </option>
                  <option value="Menghindari Risiko">
                    Menghindari Risiko
                  </option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Deskripsi Detail Perlakuan Risiko
                </label>

                <textarea
                  value={formData.deskripsi_detail_perlakuan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deskripsi_detail_perlakuan: e.target.value,
                    })
                  }
                  className="min-h-[96px] w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Jelaskan rencana perlakuan risiko"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Waktu Rencana Perlakuan Risiko
                </label>

                <input
                  type="date"
                  value={formData.waktu_rencana_perlakuan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      waktu_rencana_perlakuan: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Penanggung Jawab
                </label>

                <select
                  value={formData.penanggung_jawab_id}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      penanggung_jawab_id: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">
                    Pilih Penanggung Jawab
                  </option>

                  {penanggungJawabOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                      {item.jabatan ? ` - ${item.jabatan}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Level Kemungkinan Residual
                </label>

                <select
                  value={formData.level_kemungkinan_residual}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level_kemungkinan_residual: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Level Dampak Residual
                </label>

                <select
                  value={formData.level_dampak_residual}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      level_dampak_residual: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Besaran Risiko Residual
                </label>

                <input
                  type="text"
                  value={
                    Number(formData.level_kemungkinan_residual) *
                    Number(formData.level_dampak_residual)
                  }
                  readOnly
                  className="h-11 w-full rounded-lg border border-slate-300 bg-slate-50 px-3 text-slate-700"
                />
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Layanan Pendukung
                </label>

                <input
                  type="text"
                  value={formData.nama_layanan_pendukung}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nama_layanan_pendukung: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan layanan pendukung"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Layanan Prioritas
                </label>

                <input
                  type="text"
                  value={formData.nama_layanan_prioritas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nama_layanan_prioritas: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan layanan prioritas"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Pemilik Layanan
                </label>

                <select
                  value={formData.pemilik_layanan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      pemilik_layanan: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">
                    Pilih pemilik layanan
                  </option>
                  <option value="Milik Sendiri">
                    Milik Sendiri
                  </option>
                  <option value="Instansi Lain">
                    Instansi Lain
                  </option>
                  <option value="Pusat">
                    Pusat
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Strategis / Operasional
                </label>

                <select
                  value={formData.strategis_operasional}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      strategis_operasional: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">
                    Pilih tipe risiko
                  </option>
                  <option value="Strategis">
                    Strategis
                  </option>
                  <option value="Operasional">
                    Operasional
                  </option>
                </select>
              </div>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.lintas_sektor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lintas_sektor: e.target.checked,
                    })
                  }
                />
                Lintas Sektor
              </label>

              <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.membutuhkan_perubahan}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      membutuhkan_perubahan: e.target.checked,
                    })
                  }
                />
                Membutuhkan Perubahan
              </label>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  IPPD Terkait
                </label>

                <textarea
                  value={formData.ippd_terkait_text}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      ippd_terkait_text: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
                  placeholder="Masukkan IPPD terkait"
                />
              </div>
            </div>
          )}

          <div className="mt-6 flex justify-between border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() =>
                setCurrentStep((prev) => Math.max(prev - 1, 1))
              }
              disabled={currentStep === 1}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
            >
              Kembali
            </button>

            {currentStep < 5 ? (
              <button
                key="next-button"
                type="button"
                onClick={() =>
                  setCurrentStep((prev) => Math.min(prev + 1, 5))
                }
                className="rounded-md bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                key="submit-button"
                type="submit"
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving ? 'Menyimpan...' : 'Simpan Risiko'}
              </button>
            )}
          </div>
        </form>
          </div>
        </div>
      </div>
    )}

    {selectedRisiko && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
          <div className="flex items-center justify-between px-6 py-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Detail Risiko
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {selectedRisiko.kode_risiko || '-'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRisiko(null)}
              className="text-xl text-slate-400 hover:text-slate-600"
            >
              ×
            </button>
          </div>

          <div className="p-6">
        <div className="space-y-8">
          <section className="border-t border-slate-200 pt-5">
            <h4 className="mb-4 text-sm font-bold text-slate-900">
              A. Identifikasi Risiko
            </h4>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Kode Risiko
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedRisiko.kode_risiko || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Sasaran Pembangunan Nasional
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.sasaran_pembangunan_nasional || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Sasaran UPR
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.sasaran_upr || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Indikator Kinerja
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.indikator_kinerja || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Peristiwa Risiko
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.peristiwa_risiko || '-'}
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h4 className="mb-4 text-sm font-bold text-slate-900">
              B. Analisis dan Evaluasi Risiko
            </h4>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Kategori Risiko
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.kategori_risiko || '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Area Dampak
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.area_dampak || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Penyebab
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.penyebab || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Dampak
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.dampak || '-'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:grid-cols-4">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Level Kemungkinan
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedRisiko.kemungkinan ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Level Dampak
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedRisiko.nilai_dampak ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Besaran Risiko
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {selectedRisiko.besaran_risiko ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Prioritas Risiko
                  </p>
                  <p className="text-sm text-slate-800">
                    {selectedRisiko.prioritas_risiko || '-'}
                  </p>
                </div>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h4 className="mb-4 text-sm font-bold text-slate-900">
              C. Perlakuan Risiko
            </h4>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Keputusan Perlakuan Risiko
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.keputusan_perlakuan || '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Penanggung Jawab
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.nama_penanggung_jawab || '-'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Deskripsi Detail Perlakuan Risiko
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.deskripsi_detail_perlakuan || '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Waktu Rencana Perlakuan Risiko
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.waktu_rencana_perlakuan
                    ? new Date(
                        selectedRisiko.waktu_rencana_perlakuan
                      ).toLocaleDateString('id-ID')
                    : '-'}
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h4 className="mb-4 text-sm font-bold text-slate-900">
              D. Risiko Residual
            </h4>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Level Kemungkinan Residual
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedRisiko.level_kemungkinan_residual ?? '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Level Dampak Residual
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedRisiko.level_dampak_residual ?? '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Besaran Risiko Residual
                </p>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedRisiko.besaran_risiko_residual ?? '-'}
                </p>
              </div>
            </div>
          </section>

          <section className="border-t border-slate-200 pt-5">
            <h4 className="mb-4 text-sm font-bold text-slate-900">
              E. Informasi Tambahan
            </h4>

            <div className="grid grid-cols-1 gap-x-8 gap-y-5 md:grid-cols-2">
              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Layanan Pendukung
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.nama_layanan_pendukung || '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Layanan Prioritas
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.nama_layanan_prioritas || '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Pemilik Layanan
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.pemilik_layanan || '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Strategis / Operasional
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.strategis_operasional || '-'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Lintas Sektor
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.lintas_sektor ? 'Ya' : 'Tidak'}
                </p>
              </div>

              <div>
                <p className="mb-1 text-xs font-medium text-slate-500">
                  Membutuhkan Perubahan
                </p>
                <p className="text-sm text-slate-800">
                  {selectedRisiko.membutuhkan_perubahan ? 'Ya' : 'Tidak'}
                </p>
              </div>

              <div className="md:col-span-2">
                <p className="mb-1 text-xs font-medium text-slate-500">
                  IPPD Terkait
                </p>

                <p className="text-sm text-slate-800">
                  {selectedRisiko.ippd_terkait_text || '-'}
                </p>
              </div>
            </div>
          </section>
        </div>
          </div>
        </div>
      </div>
    )}

    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">
              Daftar Profil dan Penilaian Risiko
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Daftar data Form 1.0 yang telah tersimpan.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null);
                setCurrentStep(1);
                setSelectedRisiko(null);

                setFormData({
                  sasaran_pembangunan_nasional: '',
                  sasaran_upr: '',
                  indikator_kinerja: '',
                  kode_risiko: getNextKodeRisiko(),
                  kategori_risiko: '',
                  peristiwa_risiko: '',
                  penyebab: '',
                  dampak: '',
                  kemungkinan: '1',
                  nilai_dampak: '1',
                  keputusan_perlakuan: 'Mengurangi Risiko',
                  area_dampak: '',
                  prioritas_risiko: '',
                  deskripsi_detail_perlakuan: '',
                  waktu_rencana_perlakuan: '',
                  penanggung_jawab_id: '',
                  level_kemungkinan_residual: '1',
                  level_dampak_residual: '1',
                  nama_layanan_pendukung: '',
                  nama_layanan_prioritas: '',
                  ippd_terkait_text: '',
                  pemilik_layanan: '',
                  strategis_operasional: '',
                  lintas_sektor: false,
                  membutuhkan_perubahan: false,
                });

                setShowForm(true);
              }}
              className="shrink-0 rounded-md bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
            >
              Tambah Data
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
              Kategori Risiko
            </label>

            <select
              value={kategoriFilter}
              onChange={(e) =>
                setKategoriFilter(e.target.value)
              }
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              <option value="Semua">
                Semua Kategori
              </option>

              {kategoriOptions.map((kategori) => (
                <option
                  key={kategori}
                  value={kategori}
                >
                  {kategori}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase text-slate-600">
              Pencarian
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari kode, risiko, atau kategori..."
              className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-5">
            <div className="py-10 text-center text-sm text-slate-500">
              Memuat data risiko...
            </div>
          </div>
        ) : (
          <div className="p-5">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-semibold">
                      No
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Kode Risiko
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Peristiwa Risiko
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Kategori Risiko
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                      Besaran Risiko
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                      Prioritas
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRisiko.length > 0 ? (
                    filteredRisiko.map((item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-600">
                          {index + 1}
                        </td>

                        <td className="px-4 py-3 font-medium text-slate-800">
                          {item.kode_risiko || '-'}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {item.peristiwa_risiko || '-'}
                        </td>

                        <td className="px-4 py-3 text-slate-700">
                          {item.kategori_risiko || '-'}
                        </td>

                        <td className="px-4 py-3 text-center font-semibold text-slate-800">
                          {item.besaran_risiko ?? '-'}
                        </td>

                        <td className="px-4 py-3 text-center">
                          {item.prioritas_risiko ? (
                            <span
                              className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-medium ${getPrioritasClass(
                                item.prioritas_risiko
                              )}`}
                            >
                              {item.prioritas_risiko}
                            </span>
                          ) : (
                            <span className="text-slate-400">
                              -
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDetail(item.id)}
                              disabled={loadingDetail}
                              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                            >
                              Detail
                            </button>

                            {canUpdate && item.status_risiko === 'Draft' && (
                              <button
                                type="button"
                                onClick={() => handleEdit(item.id)}
                                className="rounded-md border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-600 transition hover:bg-blue-50"
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && item.status_risiko === 'Draft' && (
                              <button
                                type="button"
                                onClick={() => handleDelete(item.id)}
                                className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-slate-500"
                      >
                        Tidak ada data risiko yang sesuai.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
  </div>
);

}