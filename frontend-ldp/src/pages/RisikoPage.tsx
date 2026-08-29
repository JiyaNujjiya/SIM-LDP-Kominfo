import React, { useEffect, useState } from 'react';

interface RisikoItem {
  id: number;
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
  prioritas_risiko?: string | null;

  deskripsi_detail_perlakuan?: string | null;
  waktu_rencana_perlakuan?: string | null;

  pembuat?: string | null;
}

export default function RisikoPage() {
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
    layanan_id: '',
    layanan_prioritas_id: '',
    pemilik_layanan: '',
    strategis_operasional: '',
    lintas_sektor: false,
    membutuhkan_perubahan: false,
  });

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const permissions: string[] = user?.permissions || [];
  const canCreate = permissions.includes('risk.create');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (currentStep !== 5) {
      return;
    }

    const token = localStorage.getItem('token');

    try {
      setSaving(true);
      setMessage('');

      const response = await fetch(
        'http://localhost:5000/api/risiko',
        {
          method: 'POST',
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
            layanan_id: formData.layanan_id ? Number(formData.layanan_id) : null,
            layanan_prioritas_id: formData.layanan_prioritas_id ? Number(formData.layanan_prioritas_id) : null,
            pemilik_layanan: formData.pemilik_layanan,
            strategis_operasional: formData.strategis_operasional,
            lintas_sektor: formData.lintas_sektor,
            membutuhkan_perubahan: formData.membutuhkan_perubahan,
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
        layanan_id: '',
        layanan_prioritas_id: '',
        pemilik_layanan: '',
        strategis_operasional: '',
        lintas_sektor: false,
        membutuhkan_perubahan: false,
      });

      setCurrentStep(1);
      setShowForm(false);

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
              Operator LDP
            </span>

            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Operator
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
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                  >
                    <option value="">
                      Data pengguna belum dimuat
                    </option>
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
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                  >
                    <option value="">
                      Data layanan belum dimuat
                    </option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Layanan Prioritas
                  </label>

                  <select
                    value={formData.layanan_prioritas_id}
                    disabled
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500"
                  >
                    <option value="">
                      Data layanan prioritas belum dimuat
                    </option>
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

                  <div className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-100 text-gray-500">
                    Relasi IPPD belum dimuat
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
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