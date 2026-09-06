import { useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

function KonteksRisikoPage() {
  const navigate =useNavigate();

  const [formData, setFormData] = useState({
    nama_instansi: '',
    nama_upr: '',
    tugas_upr: '',
    fungsi_upr: '',
    tahun_pelaksanaan: new Date().getFullYear().toString(),

    sasaran_upr: '',
    indikator_kinerja: '',
    target_kinerja: '',
    sasaran_pembangunan_nasional: '',

    pemilik_risiko: '',
    koordinator_risiko: '',
    pengelola_risiko: '',

    besaran_selera_risiko: '',
  });

  const [loading, setLoading] = useState(false);
  const [konteksList, setKonteksList] = useState<any[]>([]);
  const [selectedKonteks, setSelectedKonteks] = useState<any | null>(null);
  const [editId, setEditId] = useState<number |null>(null);
  const [showForm, setShowForm] = useState(false);
  const detailRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);

      const token = localStorage.getItem('token');

      const isEdit = editId !== null;

      const url = isEdit
      ? `http://localhost:5000/api/risiko/konteks/${editId}`
      : 'http://localhost:5000/api/risiko/konteks';

      const response = await fetch( url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          tahun_pelaksanaan: Number(formData.tahun_pelaksanaan),
          besaran_selera_risiko:
            formData.besaran_selera_risiko === ''
              ? null
              : Number(formData.besaran_selera_risiko),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || 
            data.message || 
            (isEdit 
              ? 'Gagal memperbaharui konteks' 
              : 'Gagal menyimpan konteks')
        );
      }
      alert(
        isEdit ? 'Konteks risiko berhasil diperbaharui' : 'Konteks risiko berhasil disimpan'
      );

      setEditId(null);
      setSelectedKonteks(null);

      setFormData({
        nama_instansi: '',
        nama_upr: '',
        tugas_upr: '',
        fungsi_upr: '',
        tahun_pelaksanaan: new Date()
          .getFullYear()
          .toString(),

        sasaran_upr: '',
        indikator_kinerja: '',
        target_kinerja: '',
        sasaran_pembangunan_nasional: '',

        pemilik_risiko: '',
        koordinator_risiko: '',
        pengelola_risiko: '',

        besaran_selera_risiko: '',
      });

      setShowForm(false);
    
      await fetchKonteks();
    } catch (error) {
      console.error(
        'ERROR SIMPAN?UPDATE KONTEKS:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menyimpan konteks.'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nama_instansi: '',
      nama_upr: '',
      tugas_upr: '',
      fungsi_upr: '',
      tahun_pelaksanaan: new Date().getFullYear().toString(),

      sasaran_upr: '',
      indikator_kinerja: '',
      target_kinerja: '',
      sasaran_pembangunan_nasional: '',

      pemilik_risiko: '',
      koordinator_risiko: '',
      pengelola_risiko: '',

      besaran_selera_risiko: '',
    });

    setEditId(null);
    setSelectedKonteks(null);
  };

  const handleTambah = () => {
    resetForm();
    setShowForm(true);

    setTimeout(() => {
      formRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const handleBatal = () => {
    resetForm();
    setShowForm(false);

    setTimeout(() => {
      listRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 100);
  };

  const fetchKonteks = async () => {
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

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Gagal mengambil data konteks.'
        );
      }

      setKonteksList(data);
    } catch (error) {
      console.error('ERROR GET KONTEKS:', error);
    }
  };

  const fetchDetailKonteks = async (id: number) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/konteks/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Gagal mengambil detail konteks.'
        );
      }

      setSelectedKonteks(data);

      setTimeout(() => {
        detailRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      }, 100);

    } catch (error) {
      console.error('ERROR DETAIL KONTEKS:', error);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);

    setShowForm(true);
    setSelectedKonteks(null);

    setFormData({
      nama_instansi: item.nama_instansi || '',
      nama_upr: item.nama_upr || '',
      tugas_upr: item.tugas_upr || '',
      fungsi_upr: item.fungsi_upr || '',
      tahun_pelaksanaan: String(item.tahun_pelaksanaan || ''),

      sasaran_upr: item.sasaran_upr || '',
      indikator_kinerja: item.indikator_kinerja || '',
      target_kinerja: item.target_kinerja || '',
      sasaran_pembangunan_nasional:
        item.sasaran_pembangunan_nasional || '',

      pemilik_risiko: item.pemilik_risiko || '',
      koordinator_risiko: item.koordinator_risiko || '',
      pengelola_risiko: item.pengelola_risiko || '',

      besaran_selera_risiko:
        item.besaran_selera_risiko !== null &&
        item.besaran_selera_risiko !== undefined
          ? String(item.besaran_selera_risiko)
          : '',
    });

    setTimeout(() => {
    formRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }, 100);
  };

  const handleDelete = async (id: number) => {
    const konfirmasi = window.confirm(
      'Yakin ingin menghapus konteks risiko ini?'
    );

    if (!konfirmasi) return;

    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/konteks/${id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error || data.message || 'Gagal menghapus konteks.'
        );
      }

      alert('Konteks risiko berhasil dihapus.');

      if (selectedKonteks?.id === id) {
        setSelectedKonteks(null);
      }

      if (editId === id) {
        setEditId(null);
      }

      await fetchKonteks();
    } catch (error) {
      console.error('ERROR DELETE KONTEKS:', error);

      alert(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menghapus konteks.'
      );
    }
  };

  useEffect(() => {
    fetchKonteks();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Penetapan Konteks
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Menetapkan informasi dasar, struktur pelaksana, selera risiko,
          dan sasaran manajemen risiko.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl px-6 py-4 mb-6">
        <div className="flex items-center">
          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-6 h-6 rounded-full bg-[#1B2A4A] text-white text-xs font-semibold flex items-center justify-center">
              1
            </div>
            <span className="text-xs font-semibold text-gray-800">
              Penetapan Konteks
            </span>
          </div>

          <div className="h-px bg-gray-300 flex-1 mx-4" />

          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 text-xs flex items-center justify-center">
              2
            </div>
            <span className="text-xs text-gray-500">
              Profil & Penilaian Risiko
            </span>
          </div>

          <div className="h-px bg-gray-300 flex-1 mx-4" />

          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 text-xs flex items-center justify-center">
              3
            </div>
            <span className="text-xs text-gray-500">
              Layanan Digital Prioritas
            </span>
          </div>

          <div className="h-px bg-gray-300 flex-1 mx-4" />

          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 text-xs flex items-center justify-center">
              4
            </div>
            <span className="text-xs text-gray-500">
              Peta Risiko
            </span>
          </div>

          <div className="h-px bg-gray-300 flex-1 mx-4" />

          <div className="flex items-center gap-2 min-w-fit">
            <div className="w-6 h-6 rounded-full border border-gray-300 text-gray-500 text-xs flex items-center justify-center">
              5
            </div>
            <span className="text-xs text-gray-500">
              Pemantauan & Pelaporan
            </span>
          </div>
        </div>
      </div>

    {showForm && (
      <div ref={formRef} className="scroll-mt-24">
      <form onSubmit={handleSubmit}>
        {/* BAGIAN 1 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            1. Informasi Umum
          </h2>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama Instansi
              </label>

              <input
                type="text"
                name="nama_instansi"
                value={formData.nama_instansi}
                onChange={handleChange}
                required
                className="w-full h-12 border border-gray-300 rounded-lg px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nama UPR
              </label>

              <input
                type="text"
                name="nama_upr"
                value={formData.nama_upr}
                onChange={handleChange}
                required
                className="w-full h-12 border border-gray-300 rounded-lg px-3"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tugas UPR
              </label>

              <textarea
                name="tugas_upr"
                value={formData.tugas_upr}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fungsi UPR
              </label>

              <textarea
                name="fungsi_upr"
                value={formData.fungsi_upr}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tahun Pelaksanaan
              </label>

              <input
                type="number"
                name="tahun_pelaksanaan"
                value={formData.tahun_pelaksanaan}
                onChange={handleChange}
                required
                className="w-full h-12 border border-gray-300 rounded-lg px-3"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 2 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            2. Sasaran Pembangunan Nasional dan Sasaran UPR
          </h2>

          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sasaran UPR
              </label>

              <textarea
                name="sasaran_upr"
                value={formData.sasaran_upr}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Indikator Kinerja
              </label>

              <textarea
                name="indikator_kinerja"
                value={formData.indikator_kinerja}
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Kinerja
              </label>

              <input
                type="text"
                name="target_kinerja"
                value={formData.target_kinerja}
                onChange={handleChange}
                className="w-full h-12 border border-gray-300 rounded-lg px-3"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sasaran Pembangunan Nasional
              </label>

              <textarea
                name="sasaran_pembangunan_nasional"
                value={
                  formData.sasaran_pembangunan_nasional
                }
                onChange={handleChange}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-3"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 3 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            3. Struktur Pelaksana Manajemen Risiko
          </h2>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pemilik Risiko
              </label>

              <input
                type="text"
                name="pemilik_risiko"
                value={formData.pemilik_risiko}
                onChange={handleChange}
                className="w-full h-12 border border-gray-300 rounded-lg px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Koordinator Risiko
              </label>

              <input
                type="text"
                name="koordinator_risiko"
                value={formData.koordinator_risiko}
                onChange={handleChange}
                className="w-full h-12 border border-gray-300 rounded-lg px-3"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pengelola Risiko
              </label>

              <input
                type="text"
                name="pengelola_risiko"
                value={formData.pengelola_risiko}
                onChange={handleChange}
                className="w-full h-12 border border-gray-300 rounded-lg px-3"
              />
            </div>
          </div>
        </div>

        {/* BAGIAN 4 */}
        <div className="bg-white border border-gray-200 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-bold text-gray-800 mb-5">
            4. Selera Risiko
          </h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Besaran Selera Risiko
            </label>

            <input
              type="number"
              name="besaran_selera_risiko"
              value={
                formData.besaran_selera_risiko
              }
              onChange={handleChange}
              className="w-full h-12 border border-gray-300 rounded-lg px-3"
            />
          </div>
        </div>

        {/* TOMBOL SIMPAN */}
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={handleBatal}
            disabled={loading}
            className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Menyimpan...'
              : editId !== null
                ? 'Simpan Perubahan'
                : 'Simpan Data'}
          </button>
        </div>
      </form>
    </div>
  )}
    
    {!showForm && (
      <div 
        ref={listRef}
        className="bg-white border border-gray-200 rounded-xl p-6 mt-6"
      >
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Daftar Penetapan Konteks
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Daftar data Form 0.0 yang telah tersimpan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTambah}
            className="shrink-0 rounded-lg bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#24385f]"
          >
            Tambah Data
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  No
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Nama Instansi
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Nama UPR
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Tahun
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Pemilik Risiko
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Selera Risiko
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {konteksList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="border border-gray-200 px-4 py-8 text-center text-gray-500"
                  >
                    Belum ada data penetapan konteks.
                  </td>
                </tr>
              ) : (
                konteksList.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="border border-gray-200 px-4 py-4 text-center text-gray-700">
                      {index + 1}
                    </td>

                    <td className="border border-gray-200 px-4 py-4 text-gray-800">
                      {item.nama_instansi || '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-4 text-gray-800">
                      {item.nama_upr || '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-4 text-center text-gray-700">
                      {item.tahun_pelaksanaan || '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-4 text-gray-800">
                      {item.pemilik_risiko || '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-4 text-center">
                      {item.besaran_selera_risiko ?? '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fetchDetailKonteks(item.id)}
                          className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                          Detail
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEdit(item)}
                          className="px-3 py-2 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          className="px-3 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50"
                        >
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
        <div className="flex justify-end mt-6 pt-5 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/risiko')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B2A4A] text-white text-sm font-semibold rounded-lg hover:bg-[#24385f] transition-colors"
          >
            Lanjut ke 1.0 Profil dan Penilaian Risiko
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    )}

      {selectedKonteks && (
        <div 
        ref={detailRef}
        className="mt-6 bg-white border border-gray-200 rounded-xl p-6 scroll-mt-24"
        >
          <div className="flex items-start justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Detail Penetapan Konteks
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Informasi lengkap Form 0.0 Penetapan Konteks.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setSelectedKonteks(null)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Tutup
            </button>
          </div>

          <div className="space-y-6">
            <div className="border-t border-gray-200 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                1. Informasi Umum
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Nama Instansi</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.nama_instansi || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">Nama UPR</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.nama_upr || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">Tahun Pelaksanaan</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.tahun_pelaksanaan || '-'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">Tugas UPR</p>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedKonteks.tugas_upr || '-'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">Fungsi UPR</p>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedKonteks.fungsi_upr || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                2. Struktur Pelaksana Manajemen Risiko
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
                <div>
                  <p className="text-gray-500 mb-1">Pemilik Risiko</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.pemilik_risiko || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">Koordinator Risiko</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.koordinator_risiko || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">Pengelola Risiko</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.pengelola_risiko || '-'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                3. Selera Risiko
              </h4>

              <div className="text-sm">
                <p className="text-gray-500 mb-1">Besaran Selera Risiko</p>
                <p className="font-medium text-gray-800">
                  {selectedKonteks.besaran_selera_risiko ?? '-'}
                </p>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-5">
              <h4 className="text-sm font-semibold text-gray-800 mb-4">
                4. Sasaran Pembangunan Nasional dan Sasaran UPR
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">Sasaran UPR</p>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedKonteks.sasaran_upr || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">Indikator Kinerja</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.indikator_kinerja || '-'}
                  </p>
                </div>

                <div>
                  <p className="text-gray-500 mb-1">Target Kinerja</p>
                  <p className="font-medium text-gray-800">
                    {selectedKonteks.target_kinerja || '-'}
                  </p>
                </div>

                <div className="md:col-span-2">
                  <p className="text-gray-500 mb-1">
                    Sasaran Pembangunan Nasional
                  </p>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedKonteks.sasaran_pembangunan_nasional || '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KonteksRisikoPage;