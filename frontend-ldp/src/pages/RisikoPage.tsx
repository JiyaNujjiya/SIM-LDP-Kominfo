import React, { use, useEffect, useState } from 'react';
import { data } from 'react-router-dom';

interface RisikoItem {
  id: number;

  konteks_id?: number | null;
  konteks_nama_upr?: string | null;
  konteks_tahun?: number | string | null;

  sasaran_pembangunan_nasional?: string | null;
  sasaran_upr?: string | null;
  indikator_kinerja?: string | null;

  layanan_id?: number | null;
  layanan_prioritas_id?: number | null;
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
  
  ippd_terkait?: {
  id: number;
  kode_instansi: string;
  nama_instansi: string;
}[];
}


export default function RisikoPage() {
  const [dataRisiko, setDataRisiko] = useState<RisikoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [konteksOptions, setKonteksOptions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    konteks_id: '',
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
    layanan_id: '',
    layanan_prioritas_id: '',
    pemilik_layanan: '',
    strategis_operasional: '',
    lintas_sektor: false,
    membutuhkan_perubahan: false,
  });

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  // permission user
  const permissions: string[] = user?.permissions || [];
  const canCreate = permissions.includes('risk.create');
  const canSubmit = permissions.includes('risk.submit');
  const canApprove = permissions.includes('risk.approve');
  const canReject = permissions.includes('risk.reject');
  const canUpdate = permissions.includes('risk.update');
  const canDelete = permissions.includes('risk.delete');

  
  const [penanggungJawabOptions, setpenanggungJawabOptions] = useState<
  {
    id: number,
    nama: string,
    upr_instansi?: string | null,
    nama_role?: string | null,
  }[]
  >([]);

  const [layananOptions, setLayananOptions] = useState<
    {
      id: number,
      kode_layanan: string,
      nama_layanan: string,
    }[]
  >([]);

  const [layananPrioritasOptions, setLayananPrioritasOptions] = useState <
      {
        id: number,
        kode_prioritas: string,
        nama_layanan: string;
      }[]
  >([]); 
  
  const [ippdOptions, setIppdOptions] = useState<
      {
        id: number;
        kode_instansi: string;
        nama_instansi: string;
        jenis_instansi?: string | null;
      }[]
  >([]);

  const [selectedIppdIds, setSelectedIppdIds] = useState<number[]>([]);
  const [selectedRisiko, setSelectedRisiko] = useState<RisikoItem | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);


  useEffect(() => {
    const token = localStorage.getItem('token');

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
    const token = localStorage.getItem('token');

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

  useEffect (() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/risiko/layanan-prioritas-options', {
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
            errorData.message ||
              errorData.error ||
              'Gagal mengambil daftar layanan prioritas'
          );
        }

        return res.json();
      })
      .then((data) => {
        setLayananPrioritasOptions(data);
      })
      .catch((err) => {
        console.error('Error fetching layanan prioritas:', err);
      });
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/risiko/ippd-options', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-type': 'application/json',
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json();

          throw new Error(
            errorData.message || 
              errorData.error ||
              'Gagal mengambil daftar IPPD'
          );
        }
        
        return res.json();
      })
      .then((data) => {
        setIppdOptions(data);
      })
      .catch((err) => {
        console.error('Error fetching IPPD:', err)
      })
  }, []);

  const handleDetail = async (id: number) => {
    const token = localStorage.getItem('token');

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
    const token = localStorage.getItem('token');

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
        konteks_id:
          result.konteks_id !== null && result.konteks_id !== undefined
            ? String(result.konteks_id)
            : '',
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
        layanan_id: result.layanan_id
          ? String(result.layanan_id)
          : '',
        layanan_prioritas_id: result.layanan_prioritas_id
          ? String(result.layanan_prioritas_id)
          : '',
        pemilik_layanan: result.pemilik_layanan || '',
        strategis_operasional:
          result.strategis_operasional || '',
        lintas_sektor: Boolean(result.lintas_sektor),
        membutuhkan_perubahan: Boolean(
          result.membutuhkan_perubahan
        ),
    });

    setSelectedIppdIds(
      Array.isArray(result.ippd_terkait)
        ? result.ippd_terkait.map(
            (item: { id: number }) => item.id
          )
        : []
    );

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
    const token = localStorage.getItem('token');

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

  const handleSubmitRisiko = async (id: number) => {
    const token = localStorage.getItem('token');

    const confirmSubmit = window.confirm(
      'Yakin ingin mengajukan risiko ini? Setelah diajukan, risiko akan menunggu persetujuan.'
    );

    if (!confirmSubmit) return;

    try {
      setMessage('');

      const response = await fetch(
        `http://localhost:5000/api/risiko/${id}/submit`,
        {
          method: 'POST',
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
            'Gagal mengajukan risiko'
        );
      }

      setMessage('Risiko berhasil diajukan.');

      setDataRisiko((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status_risiko: 'Diajukan',
              }
            : item
        )
      );

    } catch (err) {
      const error = err as Error;

      console.error('Error submit risiko:', error);
      setMessage(error.message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 5) {
      return;
    }

    const token = localStorage.getItem('token');

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
            konteks_id:
              formData.konteks_id === ''
                ? null
                : Number(formData.konteks_id),

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
            layanan_id: formData.layanan_id ? Number(formData.layanan_id) : null,
            layanan_prioritas_id: formData.layanan_prioritas_id ? Number(formData.layanan_prioritas_id) : null,
            pemilik_layanan: formData.pemilik_layanan,
            strategis_operasional: formData.strategis_operasional,
            lintas_sektor: formData.lintas_sektor,
            membutuhkan_perubahan: formData.membutuhkan_perubahan,
            ippd_ids: selectedIppdIds,
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
        konteks_id: '',
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
        layanan_id: '',
        layanan_prioritas_id: '',
        pemilik_layanan: '',
        strategis_operasional: '',
        lintas_sektor: false,
        membutuhkan_perubahan: false, 
      });

      setSelectedIppdIds([]);
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

  const handleApproveRisiko = async (id: number) => {
    const token = localStorage.getItem('token');

    const confirmApprove = window.confirm(
      'Yakin ingin menyetujui risiko ini?'
    );

    if (!confirmApprove) return;

    try {
      setMessage('');

      const response = await fetch(
        `http://localhost:5000/api/risiko/${id}/approve`,
        {
          method: 'POST',
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
            'Gagal menyetujui risiko'
        );
      }

      setMessage('Risiko berhasil disetujui.');

      setDataRisiko((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status_risiko: 'Disetujui',
              }
            : item
        )
      );

    } catch (err) {
      const error = err as Error;

      console.error('Error approve risiko:', error);
      setMessage(error.message);
    }
  };

  const handleRejectRisiko = async (id: number) => {
    const token = localStorage.getItem('token');

    const confirmReject = window.confirm(
      'Yakin ingin menolak risiko ini?'
    );

    if (!confirmReject) return;

    try {
      setMessage('');

      const response = await fetch(
        `http://localhost:5000/api/risiko/${id}/reject`,
        {
          method: 'POST',
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
            'Gagal menolak risiko'
        );
      }

      setMessage('Risiko berhasil ditolak.');

      setDataRisiko((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status_risiko: 'Ditolak',
              }
            : item
        )
      );

    } catch (err) {
      const error = err as Error;

      console.error('Error reject risiko:', error);
      setMessage(error.message);
    }
  };

  const fetchKonteksOptions = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/risiko/konteks',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      
      console.log("DATA KONTEKS:", data);

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Gagal mengambil konteks.'
        );
      }

      setKonteksOptions(data);
    } catch (error) {
      console.error('ERROR GET KONTEKS OPTIONS:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');

    fetch('http://localhost:5000/api/risiko/layanan-options', {
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
            errorData.message ||
              errorData.error ||
              'Gagal mengambil daftar layanan'
          );
        }

        return res.json();
      })
      .then((data) => {
        setLayananOptions(data);
      })
      .catch((err) => {
        console.log('Error fetching layanan:', err)
      });
  }, []);

  useEffect(() => {
    fetchKonteksOptions();
  }, []);

  

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase">
            Manajemen Risiko SPBE
          </h2>

          <p className="text-sm text-gray-500">
            Daftar identifikasi, analisis, dan mitigasi risiko layanan digital
          </p>
        </div>

        <div className="flex items-center gap-4">
          {canCreate && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
            >
              + Tambah Risiko
            </button>
          )}

          <div className="text-right">
            <span className="text-sm text-gray-600 block font-medium">
              {user?.nama || '-'}
            </span>

            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              {user?.role || '-'}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-4 text-sm text-gray-700">
          {message}
        </div>
      )}

      {showForm && (
        <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Tambah Risiko
            </h3>

        <div className="mb-6">
          <div className="grid grid-cols-5 gap-2">
            {[
              { step: 1, label: 'Identifikasi Risiko' },
              { step: 2, label: 'Analisis dan Evaluasi Risiko' },
              { step: 3, label: 'Perlakuan Risiko' },
              { step: 4, label: 'Risiko Residual' },
              { step: 5, label: 'Kolom Tambahan' },
            ].map((item) =>(
              <button
                key={item.step}
                type="button"
                onClick={() => setCurrentStep(item.step)}
                className={`rounded-lg px-3 py-2 text-sm font-semibold border ${
                  currentStep === item.step
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {item.step}. {item.label}
              </button>
            ))}
          </div>
        </div>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-gray-500 hover:text-gray-800 font-semibold"
            >
              Tutup
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Konteks Risiko
            </label>

            <select
              name="konteks_id"
              value={formData.konteks_id}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  konteks_id: e.target.value,
                }))
              }
              className="w-full h-12 border border-gray-300 rounded-lg px-3"
              required
            >
              <option value="">
                Pilih Konteks Risiko
              </option>

              {konteksOptions.map((item) => (
                <option key={item.id} value={item.id} >
                  {item.nama_upr} - {item.tahun_pelaksanaan}
                </option>
              ))}
            </select>
          </div>

          {selectedRisiko && (
            <div>
              <p className="font-semibold text-gray-700">
                Konteks Risiko
              </p>

              <p>
                {selectedRisiko.konteks_nama_upr
                ? `${selectedRisiko.konteks_nama_upr} - ${selectedRisiko.konteks_tahun}`
                : '-'}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {currentStep === 1 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Masukkan sasaran pembangunan nasional"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Masukkan sasaran UPR"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Masukkan indikator kinerja"
                  />
                </div>

              <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode Risiko
                </label>

                <input
                  type="text"
                  value={formData.kode_risiko}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      kode_risiko: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Contoh: RSK-002"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Masukkan peristiwa risiko"
                />
              </div>
            </div>
          </div>  
        )}

            {currentStep === 2 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Masukkan kategori risiko"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full h12 border border-gray-300 rounded-lg px-3 py-2 resize-none"
                    placeholder="Masukkan area dampak"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  placeholder="Masukkan penyebab"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Masukkan dampak"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Besaran Risiko
                  </label>

                  <input
                    type="text"
                    value={
                      Number(formData.kemungkinan) *
                      Number(formData.nilai_dampak)
                    }
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    placeholder="Masukkan prioritas risiko"
                  />
                </div>

              </div> 
            )}

            {currentStep === 3 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
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

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full min-h-[96px] border border-gray-300 rounded-lg px-3 py-2 resize-none"
                    placeholder="Jelaskan rencana perlakuan risiko"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Pilih Penanggung Jawab</option>
                    {penanggungJawabOptions.map((item) =>(
                      <option key={item.id} value={item.id}>
                        {item.nama},
                        {item.nama_role? ` - ${item.nama_role}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {currentStep === 4 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="1">1</option>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Besaran Risiko Residual
                  </label>

                  <input
                    type="text"
                    value={
                      Number(formData.level_kemungkinan_residual) *
                      Number(formData.level_dampak_residual)
                    }
                    readOnly
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100"
                  />
                </div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layanan Pendukung
                  </label>

                  <select
                    value={formData.layanan_id}
                    onChange={(e) => 
                      setFormData({
                        ...formData,
                        layanan_id: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Pilih layanan pendukung</option>

                    {layananOptions.map((item) => (
                      <option key={item.id} value={item.id} >
                        {item.kode_layanan} - {item.nama_layanan}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layanan Prioritas
                  </label>

                  <select
                    value={formData.layanan_prioritas_id}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        layanan_prioritas_id: e.target.value,
                      })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Pilih layanan prioritas</option>
                    {layananPrioritasOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.kode_prioritas} - {item.nama_layanan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Pilih pemilik layanan</option>
                    <option value="Milik Sendiri">Milik Sendiri</option>
                    <option value="Instansi Lain">Instansi Lain</option>
                    <option value="Pusat">Pusat</option>
                  </select>
                </div>
              
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
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
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="">Pilih tipe risiko</option>
                    <option value="Strategis">Strategis</option>
                    <option value="Operasional">Operasional</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
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

                  <label className="text-sm font-medium text-gray-700">
                    Lintas Sektor
                  </label>
                </div>
                <div className="flex items-center gap-2">
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
                  <label className="text-sm font-medium text-gray-700">
                    Membutuhkan Perubahan
                  </label>
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IPPD Terkait
                  </label>

                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2">
                    {ippdOptions.length > 0 ? (
                      ippdOptions.map((item) => (
                        <label
                          key={item.id}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIppdIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIppdIds([
                                  ...selectedIppdIds,
                                  item.id,
                                ]);
                              } else {
                                setSelectedIppdIds(
                                  selectedIppdIds.filter(
                                    (id) => id !== item.id
                                  )
                                );
                              }
                            }}
                          />
                        <span className="text-sm text-gray-700">
                          {item.kode_instansi} - {item.nama_instansi}
                        </span>
                      </label>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">
                      Tidak ada data IPPD aktif
                    </span>
                  )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between mt-6">
              <button
                type="button"
                onClick={() => 
                  setCurrentStep((prev) => Math.max(prev - 1,1 ))
                }
                disabled={currentStep === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-40"
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
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  Selanjutnya
                </button>
              ) : (
                <button
                  key="submit-button"
                  type="submit"
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Risiko'}
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {selectedRisiko && (
        <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-white shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div> 
              <h3 className="text-lg font-bold text-gray-800">
                Detail Risiko
              </h3>
              <p className="text-sm text-gray-500">
                {selectedRisiko.kode_risiko}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedRisiko(null)}
              className="text-gray-500 hover:text-gray-800 font-semibold"
            >
              Tutup
            </button>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-base font-bold text-gray-800 mb-4">
              A. Identifikasi Risiko
            </h4>
          
          <div className="col-span-2 mb-4">
            <p className="text-xs text-gray-500 mb-1">
              Konteks Risiko
            </p>

            <p className="text-sm text-gray-800">
              {selectedRisiko.konteks_nama_upr
                ? `${selectedRisiko.konteks_nama_upr} - ${
                    selectedRisiko.konteks_tahun ?? '-'
                  }`
                : '-'}
            </p>
          </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                 <p className="text-xs text-gray-500 mb-1">
                  Sasaran Pembangunan Nasional
                 </p>
                 <p className="text-sm text-gray-800">
                  {selectedRisiko.sasaran_pembangunan_nasional || '-'}
                 </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">
                  Sasaran UPR
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.sasaran_upr || '-'}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">
                  Indikator Kinerja
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Kode Risiko
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedRisiko.kode_risiko || '-'}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">
                  Peristiwa Risiko
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.peristiwa_risiko || '-'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4 mt-6">
            <h4 className="text-base font-bold text-gray-800 mb-4">
              B. Analisis dan Evaluasi Risiko
            </h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Kategori Risiko
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.kategori_risiko || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Area Dampak
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.area_dampak || '-'}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">
                  Penyebab
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.penyebab || '-'}
                </p>
              </div>

              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">
                  Dampak
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.dampak || '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Level Kemungkinan
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.kemungkinan ?? '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Level Dampak
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.nilai_dampak ?? '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Besaran Risiko
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {selectedRisiko.besaran_risiko ?? '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500 mb-1">
                  Prioritas Risiko
                </p>
                <p className="text-sm text-gray-800">
                  {selectedRisiko.prioritas_risiko || '-'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4 mt-6">
              <h4 className="text-base font-bold text-gray-800 mb-4">
                C. Perlakuan Risiko
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Keputusan Perlakuan
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.keputusan_perlakuan || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Penanggung Jawab
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.nama_penanggung_jawab || '-'}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">
                    Deskripsi Detail Perlakuan
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.deskripsi_detail_perlakuan || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Waktu Rencana Perlakuan
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.waktu_rencana_perlakuan
                      ? new Date(
                          selectedRisiko.waktu_rencana_perlakuan
                        ).toLocaleDateString('id-ID')
                      : '-'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-200 pt-4 mt-6">
              <h4 className="text-base font-bold text-gray-800 mb-4">
                D. Risiko Residual
              </h4>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Level Kemungkinan Residual
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.level_kemungkinan_residual ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Level Dampak Residual
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.level_dampak_residual ?? '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Besaran Risiko Residual
                  </p>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedRisiko.besaran_risiko_residual ?? '-'}
                  </p>
                </div>
              </div>
            </div>            

            <div className="border-t border-gray-200 pt-4 mt-6">
              <h4 className="text-base font-bold text-gray-800 mb-4">
                E. Kolom Tambahan
              </h4>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Layanan Pendukung
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.kode_layanan && selectedRisiko.nama_layanan
                      ? `${selectedRisiko.kode_layanan} - ${selectedRisiko.nama_layanan}`
                      : '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Layanan Prioritas
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.kode_prioritas || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Pemilik Layanan
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.pemilik_layanan || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Strategis / Operasional
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.strategis_operasional || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Lintas Sektor
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.lintas_sektor ? 'Ya' : 'Tidak'}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-1">
                    Membutuhkan Perubahan
                  </p>
                  <p className="text-sm text-gray-800">
                    {selectedRisiko.membutuhkan_perubahan ? 'Ya' : 'Tidak'}
                  </p>
                </div>

                <div className="col-span-2">
                  <p className="text-xs text-gray-500 mb-1">
                    IPPD Terkait
                  </p>

                  {selectedRisiko.ippd_terkait &&
                    selectedRisiko.ippd_terkait.length > 0 ? (
                    <div className="space-y-1">
                      {selectedRisiko.ippd_terkait.map((item) => (
                        <p
                          key={item.id}
                          className="text-sm text-gray-800"
                        >
                          {item.kode_instansi} - {item.nama_instansi}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-800">-</p>
                  )}
                </div>
              </div>
            </div>
          </div>  
        </div>
      )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">
          Memuat data risiko...
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm font-semibold">
                <th className="p-3">Kode Risiko</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Peristiwa Risiko</th>
                <th className="p-3">Penyebab</th>
                <th className="p-3">Dampak</th>
                <th className="p-3">Kemungkinan</th>
                <th className="p-3">Nilai Dampak</th>
                <th className="p-3">Besaran Risiko</th>
                <th className="p-3">Pembuat</th>
                <th className="p-3">Keputusan Perlakuan</th>
                <th className="p-3">Status</th>
                <th className="p-3">Aksi</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {dataRisiko.length > 0 ? (
                dataRisiko.map((item, index) => (
                  <tr
                    key={item.id || index}
                    className="hover:bg-gray-50"
                  >
                    <td className="p-3 font-semibold">
                      {item.kode_risiko || '-'}
                    </td>

                    <td className="p-3">
                      {item.kategori_risiko || '-'}
                    </td>

                    <td className="p-3">
                      {item.peristiwa_risiko || '-'}
                    </td>

                    <td className="p-3">
                      {item.penyebab || '-'}
                    </td>

                    <td className="p-3">
                      {item.dampak || '-'}
                    </td>

                    <td className="p-3">
                      {item.kemungkinan || '-'}
                    </td>

                    <td className="p-3">
                      {item.nilai_dampak || '-'}
                    </td>

                    <td className="p-3">
                      {item.besaran_risiko ?? '-'}
                    </td>

                    <td className="p-3">
                      {item.pembuat || '-'}
                    </td>

                    <td className="p-3">
                      {item.keputusan_perlakuan || '-'}
                    </td>

                    <td className="p-3">
                      <span className="font-semibold">
                        {item.status_risiko || 'Draft'}
                      </span>
                    </td>

                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => handleDetail(item.id)}
                        disabled={loadingDetail}
                        className="text-blue-600 hover:text-blue-800 font-semibold"
                      >
                        Detail
                      </button>

                      {item.status_risiko === 'Draft' && (
                        <button
                          type="button"
                          onClick={() => handleEdit(item.id)}
                          className="text-amber-600 hover:text-amber-800 font-semibold"
                          >
                        Edit
                      </button>
                      )}
                      
                      {item.status_risiko === 'Draft' && (
                        <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-800 font-semibold"
                      >
                        Hapus
                      </button>
                      )}
                      
                      {canSubmit && item.status_risiko === 'Draft' && (
                          <button
                            type="button"
                            onClick={() => handleSubmitRisiko(item.id)}
                            className="text-green-600 hover:text-green-800 font-semibold"
                          >
                            Submit
                          </button>
                      )}
                      {canApprove && item.status_risiko === 'Diajukan' && (
                          <button
                            type="button"
                            onClick={() => handleApproveRisiko(item.id)}
                            className="text-purple-600 hover:text-purple-800 font-semibold"
                          >
                           Approve
                        </button>
                      )}
                      {canReject && item.status_risiko === 'Diajukan' && (
                          <button
                            type="button"
                            onClick={() => handleRejectRisiko(item.id)}
                            className="text-red-700 hover:text-red-900 font-semibold"
                          >
                            Reject
                          </button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={12}
                    className="p-4 text-center text-gray-400"
                  >
                    Belum ada data risiko.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}