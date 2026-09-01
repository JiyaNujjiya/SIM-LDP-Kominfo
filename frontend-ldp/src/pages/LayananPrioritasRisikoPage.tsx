import React, { useEffect, useState } from 'react';

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
      const token = localStorage.getItem('token');

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
      const token = localStorage.getItem('token');

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
      const token = localStorage.getItem('token');

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

  if (loading) {
    return (
      <div className="p-6">
        Memuat data...
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Form 2.0 - Daftar Layanan Digital Prioritas
      </h1>

      <p className="text-sm text-gray-500 mt-1 mb-6">
        Daftar layanan digital pemerintah prioritas
        berdasarkan hasil penilaian risiko.
      </p>

      {/* TABEL FORM 2.0 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  No
                </th>

                <th className="px-4 py-3 text-left">
                  Layanan Prioritas
                </th>

                <th className="px-4 py-3 text-left">
                  Kode Risiko
                </th>

                <th className="px-4 py-3 text-left">
                  Besaran Risiko
                </th>

                <th className="px-4 py-3 text-left">
                  Perlu MKB?
                </th>

                <th className="px-4 py-3 text-left">
                  PIC
                </th>

                <th className="px-4 py-3 text-left">
                  Target Waktu Penyusunan
                </th>

                <th className="px-4 py-3 text-left">
                  Status
                </th>

                <th className="px-4 py-3 text-left">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    Belum ada data Form 2.0.
                  </td>
                </tr>
              ) : (
                data.map((item, index) => (
                  <tr
                    key={item.risiko_id}
                    className="border-t border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3">
                      {item.layanan_prioritas || '-'}
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-800">
                      {item.kode_risiko}
                    </td>

                    <td className="px-4 py-3">
                      {item.besaran_risiko}
                    </td>

                    <td className="px-4 py-3">
                      {item.membutuhkan_mkb === null
                        ? '-'
                        : item.membutuhkan_mkb === 1
                          ? 'Ya'
                          : 'Tidak'}
                    </td>

                    <td className="px-4 py-3">
                      {item.nama_pic || '-'}
                    </td>

                    <td className="px-4 py-3">
                      {item.target_penyusunan
                        ? new Date(
                            item.target_penyusunan
                          ).toLocaleDateString(
                            'id-ID'
                          )
                        : '-'}
                    </td>

                    <td className="px-4 py-3">
                      {item.membutuhkan_mkb !== null &&
                      item.pic_id !== null &&
                      item.target_penyusunan !== null ? (
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Lengkap
                        </span>
                      ) : (
                        <span className="inline-flex px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-700">
                          Belum Lengkap
                        </span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)
                        }
                        className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                      >
                        {item.membutuhkan_mkb !== null &&
                         item.pic_id !== null &&
                         item.target_penyusunan !== null
                            ? 'Edit'
                            : 'Lengkapi'}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM EDIT */}
      {editingItem && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">
                Edit Form 2.0
              </h2>

              <p className="text-sm text-gray-500 mt-1">
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
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Tutup
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* PERLU MKB */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">
                  Pilih
                </option>

                <option value="1">
                  Ya
                </option>

                <option value="0">
                  Tidak
                </option>
              </select>
            </div>

            {/* PIC */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="">Pilih PIC</option>

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

            {/* TARGET */}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
          </div>

          {/* ACTION FORM */}

          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={() =>
                setEditingItem(null)
              }
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Batal
            </button>

            <button
              type="button"
              onClick={handleSaveForm2}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Simpan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayananPrioritasRisikoPage;