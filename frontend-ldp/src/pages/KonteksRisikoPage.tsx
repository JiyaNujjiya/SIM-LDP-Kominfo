import { useEffect, useState } from 'react';

function KonteksRisikoPage() {
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
    } catch (error) {
      console.error('ERROR DETAIL KONTEKS:', error);
    }
  };

  const handleEdit = (item: any) => {
    setEditId(item.id);

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

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
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
      <h1 className="text-2xl font-bold text-gray-800">
        Form 0.0 — Penetapan Konteks
      </h1>

      <p className="text-sm text-gray-500 mt-1 mb-6">
        Manajemen Risiko SPBE
      </p>

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
        <div className="flex justify-end mt-6">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? 'Menyimpan...'
              : 'Simpan Konteks'}
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mt-8">
        <h2 className="text-lg font-bold text-gray-800 mb-5">
          Daftar Konteks Risiko
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border px-4 py-3 text-left">
                  No
                </th>

                <th className="border px-4 py-3 text-left">
                  Nama Instansi
                </th>

                <th className="border px-4 py-3 text-left">
                  Nama UPR
                </th>

                <th className="border px-4 py-3 text-left">
                  Tahun
                </th>

                <th className="border px-4 py-3 text-left">
                  Pembuat
                </th>

                <th className="border px-4 py-3 text-left">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {konteksList.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="border px-4 py-4 text-center text-gray-500"
                  >
                    Belum ada data konteks.
                  </td>
                </tr>
              ) : (
                konteksList.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border px-4 py-3">
                      {index + 1}
                    </td>

                    <td className="border px-4 py-3">
                      {item.nama_instansi}
                    </td>

                    <td className="border px-4 py-3">
                      {item.nama_upr}
                    </td>

                    <td className="border px-4 py-3">
                      {item.tahun_pelaksanaan}
                    </td>

                    <td className="border px-4 py-3">
                      {item.pembuat || '-'}
                    </td>

                    <td className="border px-4 py-3">
                      <button
                        type="button"
                        onClick={() => fetchDetailKonteks(item.id)}
                        className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                      >
                        Detail
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="px-3 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200 ml-2"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 ml-2"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedKonteks && (
        <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-6">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-lg font-bold text-gray-800">
              Detail Konteks Risiko
            </h3>

            <button
              type="button"
              onClick={() => setSelectedKonteks(null)}
              className="px-3 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-2 gap-5 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Nama Instansi</p>
              <p>{selectedKonteks.nama_instansi || '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Nama UPR</p>
              <p>{selectedKonteks.nama_upr || '-'}</p>
            </div>

            <div className="col-span-2">
              <p className="font-semibold text-gray-700">Tugas UPR</p>
              <p>{selectedKonteks.tugas_upr || '-'}</p>
            </div>

            <div className="col-span-2">
              <p className="font-semibold text-gray-700">Fungsi UPR</p>
              <p>{selectedKonteks.fungsi_upr || '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Tahun Pelaksanaan</p>
              <p>{selectedKonteks.tahun_pelaksanaan || '-'}</p>
            </div>

            <div className="col-span-2">
              <p className="font-semibold text-gray-700">Sasaran UPR</p>
              <p>{selectedKonteks.sasaran_upr || '-'}</p>
            </div>

            <div className="col-span-2">
              <p className="font-semibold text-gray-700">Indikator Kinerja</p>
              <p>{selectedKonteks.indikator_kinerja || '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Target Kinerja</p>
              <p>{selectedKonteks.target_kinerja || '-'}</p>
            </div>

            <div className="col-span-2">
              <p className="font-semibold text-gray-700">
                Sasaran Pembangunan Nasional
              </p>
              <p>{selectedKonteks.sasaran_pembangunan_nasional || '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Pemilik Risiko</p>
              <p>{selectedKonteks.pemilik_risiko || '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Koordinator Risiko</p>
              <p>{selectedKonteks.koordinator_risiko || '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Pengelola Risiko</p>
              <p>{selectedKonteks.pengelola_risiko || '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Besaran Selera Risiko</p>
              <p>{selectedKonteks.besaran_selera_risiko ?? '-'}</p>
            </div>

            <div>
              <p className="font-semibold text-gray-700">Pembuat</p>
              <p>{selectedKonteks.pembuat || '-'}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KonteksRisikoPage;