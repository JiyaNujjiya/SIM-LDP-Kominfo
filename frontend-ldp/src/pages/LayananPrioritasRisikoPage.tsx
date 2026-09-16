import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Form2Item {
  risiko_id: number;
  kode_risiko: string;
  besaran_risiko: number;
  layanan_prioritas_id: number;
  kode_prioritas: string;
  layanan_prioritas: string;
  membutuhkan_mkb: number | null;
  pic_id: number | null;
  nama_pic: string | null;
  target_penyusunan: string | null;
}

interface PicOption {
  id: number;
  nama: string;
}

const LayananPrioritasRisikoPage: React.FC = () => {
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('Semua');

  const [data, setData] = useState<Form2Item[]>([]);
  const [loading, setLoading] = useState(true);

  const [editingItem, setEditingItem] =
    useState<Form2Item | null>(null);

  const [editForm, setEditForm] = useState({
    membutuhkan_mkb: '',
    pic_id: '',
    target_penyusunan: '',
  });

  const [PicOptions, setPicOptions] = useState<PicOption[]>([]);

  const fetchForm2 = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/risiko/form2',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Gagal mengambil data Form 2.0');
      }

      const result = await response.json();

      setData(result);
    } catch (error) {
      console.error('ERROR FORM 2.0:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveForm2 = async () => {
    if (!editingItem) return;

    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/form2/${editingItem.risiko_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            membutuhkan_mkb:
              editForm.membutuhkan_mkb === ''
                ? null
                : editForm.membutuhkan_mkb === '1',

            pic_id:
              editForm.pic_id === ''
                ? null
                : Number(editForm.pic_id),

            target_penyusunan:
              editForm.target_penyusunan || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message || 'Gagal menyimpan Form 2.0'
        );
      }

      alert(
        result.message ||
          'Data Form 2.0 berhasil disimpan.'
      );

      setEditingItem(null);

      await fetchForm2();
    } catch (error) {
      console.error(
        'ERROR SAVE FORM 2.0:',
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : 'Terjadi kesalahan saat menyimpan data.'
      );
    }
  };

  const handleEdit = (item: Form2Item) => {
    setEditingItem(item);

    setEditForm({
      membutuhkan_mkb:
        item.membutuhkan_mkb === null
          ? ''
          : String(item.membutuhkan_mkb),

      pic_id:
        item.pic_id === null
          ? ''
          : String(item.pic_id),

      target_penyusunan:
        item.target_penyusunan
          ? item.target_penyusunan.slice(0, 10)
          : '',
    });
  };

  const fetchPicOptions = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/risiko/penanggung-jawab-options',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Gagal mengambil pilihan PIC');
      }

      const result = await response.json();
      setPicOptions(result);
    } catch (error) {
      console.error('ERROR PIC OPTIONS:', error);
    }
  };

  useEffect(() => {
    fetchForm2();
    fetchPicOptions();
  }, []);

  const filteredData = data
    .filter((item) => {
      const keyword = search.trim().toLowerCase();

      const isComplete =
        item.membutuhkan_mkb !== null &&
        item.pic_id !== null &&
        item.target_penyusunan !== null;

      const matchSearch =
        !keyword ||
        item.kode_risiko
          ?.toLowerCase()
          .includes(keyword) ||
        item.layanan_prioritas
          ?.toLowerCase()
          .includes(keyword) ||
        item.nama_pic
          ?.toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === 'Semua' ||
        (statusFilter === 'Lengkap' && isComplete) ||
        (statusFilter === 'Belum Lengkap' && !isComplete);

      return matchSearch && matchStatus;
    })
    .sort((a, b) =>
      (a.kode_risiko || '').localeCompare(
        b.kode_risiko || '',
        undefined,
        { numeric: true }
      )
    );

  if (loading) {
    return (
      <div className="p-6">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Daftar Layanan Digital Prioritas
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Daftar layanan digital pemerintah prioritas berdasarkan hasil penilaian risiko Form 1.0.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white px-6 py-4">
        <div className="flex items-center">
          <div className="flex min-w-fit items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/risiko/konteks')}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 hover:border-slate-400"
            >
              1
            </button>

            <button
              type="button"
              onClick={() => navigate('/risiko/konteks')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Penetapan Konteks
            </button>
          </div>

          <div className="mx-4 h-px flex-1 bg-slate-300" />
          <div className="flex min-w-fit items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/risiko')}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 hover:border-slate-400"
            >
              2
            </button>

            <button
              type="button"
              onClick={() => navigate('/risiko')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Profil & Penilaian Risiko
            </button>
          </div>

          <div className="mx-4 h-px flex-1 bg-slate-300" />
          <div className="flex min-w-fit items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-semibold text-white">
              3
            </div>

            <span className="text-xs font-semibold text-slate-900">
              Layanan Digital Prioritas
            </span>
          </div>

          <div className="mx-4 h-px flex-1 bg-slate-300" />
          <div className="flex min-w-fit items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/risiko/peta-risiko')}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 hover:border-slate-400"
            >
              4
            </button>

            <button
              type="button"
              onClick={() => navigate('/risiko/peta-risiko')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Peta Risiko
            </button>
          </div>

          <div className="mx-4 h-px flex-1 bg-slate-300" />
          <div className="flex min-w-fit items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500">
              5
            </div>

            <span className="text-xs text-slate-500">
              Pemantauan dan Pelaporan
            </span>
          </div>
        </div>
      </div>

      {!editingItem && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status Kelengkapan
              </label>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value)
                }
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-blue-500"
              >
                <option value="Semua">
                  Semua Status
                </option>

                <option value="Lengkap">
                  Lengkap
                </option>

                <option value="Belum Lengkap">
                  Belum Lengkap
                </option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Pencarian
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari kode risiko, layanan, atau PIC..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1100px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-sm font-semibold text-slate-700">
                  <th className="border-b border-r border-slate-200 px-4 py-3 text-center">
                    No
                  </th>

                  <th className="w-[240px] border-b border-r border-slate-200 px-4 py-3">
                    Layanan Prioritas
                  </th>

                  <th className="w-[120px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Kode Risiko
                  </th>

                  <th className="w-[130px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Besaran Risiko
                  </th>

                  <th className="w-[120px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Perlu MKB?
                  </th>

                  <th className="w-[180px] border-b border-r border-slate-200 px-4 py-3">
                    PIC
                  </th>

                  <th className="w-[180px] border-b border-r border-slate-200 px-4 py-3">
                    Target Penyusunan
                  </th>

                  <th className="w-[150px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Status
                  </th>

                  <th className="w-[120px] border-b border-slate-200 px-4 py-3 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm text-slate-700">
                {filteredData.length > 0 ? (
                  filteredData.map((item, index) => {
                    const isComplete =
                      item.membutuhkan_mkb !== null &&
                      item.pic_id !== null &&
                      item.target_penyusunan !== null;

                    return (
                      <tr
                        key={item.risiko_id}
                        className="hover:bg-slate-50"
                      >
                        <td className="border-b border-r border-slate-200 px-4 py-3 text-center">
                          {index + 1}
                        </td>

                        <td className="border-b border-r border-slate-200 px-4 py-3">
                          {item.layanan_prioritas || '-'}
                        </td>

                        <td className="whitespace-nowrap border-b border-r border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">
                          {item.kode_risiko || '-'}
                        </td>

                        <td className="border-b border-r border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">
                          {item.besaran_risiko ?? '-'}
                        </td>

                        <td className="border-b border-r border-slate-200 px-4 py-3 text-center">
                          {item.membutuhkan_mkb === null
                            ? '-'
                            : item.membutuhkan_mkb === 1
                              ? 'Ya'
                              : 'Tidak'}
                        </td>

                        <td className="border-b border-r border-slate-200 px-4 py-3">
                          {item.nama_pic || '-'}
                        </td>

                        <td className="border-b border-r border-slate-200 px-4 py-3">
                          {item.target_penyusunan
                            ? new Date(
                                item.target_penyusunan
                              ).toLocaleDateString('id-ID')
                            : '-'}
                        </td>

                        <td className="border-b border-r border-slate-200 px-4 py-3 text-center">
                          {isComplete ? (
                            <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                              Lengkap
                            </span>
                          ) : (
                            <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                              Belum Lengkap
                            </span>
                          )}
                        </td>

                        <td className="border-b border-slate-200 px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(item)
                            }
                            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                          >
                            {isComplete
                              ? 'Edit'
                              : 'Lengkapi'}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-sm text-slate-400"
                    >
                      Tidak ada data layanan prioritas yang sesuai.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
            <button
              type="button"
              onClick={() => navigate('/risiko')}
              className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kembali ke Profil & Penilaian Risiko
            </button>

            <button
              type="button"
              onClick={() => navigate('/risiko/peta-risiko')}
              className="rounded-lg bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#24375f]"
            >
              Lanjut ke Peta Risiko
              <span className="ml-2" aria-hidden="true">
                →
              </span>
            </button>
          </div>
        </>
      )}

      {editingItem && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem.membutuhkan_mkb !== null &&
                editingItem.pic_id !== null &&
                editingItem.target_penyusunan !== null
                  ? 'Edit Data Prioritas'
                  : 'Lengkapi Data Prioritas'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {editingItem.kode_risiko}
                {' - '}
                {editingItem.layanan_prioritas}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setEditingItem(null)
              }
              className="text-sm font-semibold text-slate-500 hover:text-slate-800"
            >
              Tutup
            </button>
          </div>

          <div className="p-6">
            <div className="mb-5">
              <h4 className="text-sm font-bold text-slate-900">
                Informasi Penyusunan
              </h4>

              <p className="mt-1 text-sm text-slate-500">
                Lengkapi informasi kebutuhan MKB, PIC, dan target waktu penyusunan.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Perlu MKB?
                </label>

                <select
                  value={
                    editForm.membutuhkan_mkb
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      membutuhkan_mkb:
                        e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    Pilih kebutuhan MKB
                  </option>

                  <option value="1">
                    Ya
                  </option>

                  <option value="0">
                    Tidak
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  PIC
                </label>

                <select
                  value={editForm.pic_id}
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      pic_id: e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
                >
                  <option value="">
                    Pilih PIC
                  </option>

                  {PicOptions.map((pic) => (
                    <option
                      key={pic.id}
                      value={pic.id}
                    >
                      {pic.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Target Waktu Penyusunan
                </label>

                <input
                  type="date"
                  value={
                    editForm.target_penyusunan
                  }
                  onChange={(e) =>
                    setEditForm({
                      ...editForm,
                      target_penyusunan:
                        e.target.value,
                    })
                  }
                  className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() =>
                  setEditingItem(null)
                }
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveForm2}
                className="rounded-lg bg-[#1B2A4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#24375f]"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayananPrioritasRisikoPage;