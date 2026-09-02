import React from 'react';

interface MonitoringDokumen {
  id: number;
  monitoring_id: number;
  nama_file: string;
  path_file: string;
  tipe_file: string | null;
  ukuran_file: number | null;
  uploaded_at: string;
}

interface MonitoringSemester1Item {
  risiko_id: number;
  kode_risiko: string;
  peristiwa_risiko: string;
  besaran_risiko: number;

  monitoring_id: number | null;
  tahun: number | null;
  periode: string | null;
  risiko_saat_ini: number | null;
  proyeksi_risiko: number | null;
  perlakuan_risiko: string | null;
  rencana_penanganan: string | null;
  penanggung_jawab_id: number | null;
  nama_penanggung_jawab: string | null;
  waktu_pelaksanaan: string | null;
  hasil_pelaksanaan: string | null;

  dokumen?: MonitoringDokumen[];
}

interface PicOption {
  id: number;
  nama: string;
}

const MonitoringSemester1Page: React.FC = () => {
  const [data, setData] = React.useState<MonitoringSemester1Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  const [editingItem, setEditingItem] =
    React.useState<MonitoringSemester1Item | null>(null);

  const [formData, setFormData] = React.useState({
    risiko_saat_ini: '',
    proyeksi_risiko: '',
    perlakuan_risiko: '',
    rencana_penanganan: '',
    penanggung_jawab_id: '',
    waktu_pelaksanaan: '',
    hasil_pelaksanaan: '',
  });

  const [picOptions, setPicOptions] = React.useState<PicOption[]>([]);
  const [saving, setSaving] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const tahunSekarang = new Date().getFullYear();

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      setMessage('');

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/monitoring/semester-1?tahun=${tahunSekarang}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Gagal mengambil data monitoring Semester I'
        );
      }

      setData(result);
    } catch (error) {
      const err = error as Error;

      console.error(
        'ERROR FETCH MONITORING SEMESTER I:',
        err
      );

      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMonitoring();
  }, [tahunSekarang]);

  React.useEffect(() => {
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

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error ||
              'Gagal mengambil pilihan PIC'
          );
        }

        setPicOptions(result);
      } catch (error) {
        console.error('ERROR FETCH PIC:', error);
      }
    };

    fetchPicOptions();
  }, []);

  const handleEdit = (item: MonitoringSemester1Item) => {
    setEditingItem(item);

    setSelectedFile(null);

    setFormData({
      risiko_saat_ini:
        item.risiko_saat_ini?.toString() ??
        item.besaran_risiko?.toString() ??
        '',

      proyeksi_risiko:
        item.proyeksi_risiko?.toString() ?? '',

      perlakuan_risiko:
        item.perlakuan_risiko ?? '',

      rencana_penanganan:
        item.rencana_penanganan ?? '',

      penanggung_jawab_id:
        item.penanggung_jawab_id?.toString() ?? '',

      waktu_pelaksanaan:
        item.waktu_pelaksanaan
          ? item.waktu_pelaksanaan.slice(0, 10)
          : '',

      hasil_pelaksanaan:
        item.hasil_pelaksanaan ?? '',
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingItem) return;

    try {
      setSaving(true);
      setMessage('');

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/monitoring/semester-1/${editingItem.risiko_id}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tahun: tahunSekarang,

            risiko_saat_ini: formData.risiko_saat_ini
              ? Number(formData.risiko_saat_ini)
              : null,

            proyeksi_risiko: formData.proyeksi_risiko
              ? Number(formData.proyeksi_risiko)
              : null,

            perlakuan_risiko:
              formData.perlakuan_risiko || null,

            rencana_penanganan:
              formData.rencana_penanganan || null,

            penanggung_jawab_id:
              formData.penanggung_jawab_id
                ? Number(formData.penanggung_jawab_id)
                : null,

            waktu_pelaksanaan:
              formData.waktu_pelaksanaan || null,

            hasil_pelaksanaan:
              formData.hasil_pelaksanaan || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            result.error ||
            'Gagal menyimpan monitoring Semester I'
        );
      }

      const refreshedResponse = await fetch(
      `http://localhost:5000/api/risiko/monitoring/semester-1?tahun=${tahunSekarang}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const refreshedData: MonitoringSemester1Item[] =
      await refreshedResponse.json();

    const updatedItem = refreshedData.find(
      (item) => item.risiko_id === editingItem.risiko_id
    );

    if (
      selectedFile &&
      updatedItem?.monitoring_id
    ) {
      const uploadData = new FormData();

      uploadData.append('file', selectedFile);

      const uploadResponse = await fetch(
        `http://localhost:5000/api/risiko/monitoring/${updatedItem.monitoring_id}/dokumen`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadData,
        }
      );

      const uploadResult =
        await uploadResponse.json();

      if (!uploadResponse.ok) {
        throw new Error(
          uploadResult.message ||
            uploadResult.error ||
            'Monitoring berhasil disimpan, tetapi Data Dukung gagal diunggah.'
        );
      }
    }

    setMessage(
      selectedFile
        ? 'Monitoring Semester I dan Data Dukung berhasil disimpan.'
        : 'Monitoring Semester I berhasil disimpan.'
    );

    setSelectedFile(null);
    setEditingItem(null);

    await fetchMonitoring();
        } catch (error) {
          const err = error as Error;

          console.error(
            'ERROR SAVE MONITORING SEMESTER I:',
            err
          );

          setMessage(err.message);
        } finally {
          setSaving(false);
      }
    };


  const handleCancel = () => {
    setEditingItem(null);

    setFormData({
      risiko_saat_ini: '',
      proyeksi_risiko: '',
      perlakuan_risiko: '',
      rencana_penanganan: '',
      penanggung_jawab_id: '',
      waktu_pelaksanaan: '',
      hasil_pelaksanaan: '',
    });
  };

  const handleDownloadDokumen = async (
    dokumenId: number,
    namaFile: string
  ) => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/monitoring/dokumen/${dokumenId}/download`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const result = await response.json();

        throw new Error(
          result.message ||
            result.error ||
            'Gagal mengunduh Data Dukung'
        );
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');

      link.href = url;
      link.download = namaFile;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      const err = error as Error;

      console.error(
        'ERROR DOWNLOAD DATA DUKUNG:',
        err
      );

      setMessage(err.message);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Monitoring Risiko Semester I
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Form 3.0 Peta Risiko dan Monitoring
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
          {message}
        </div>
      )}

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-[1600px] w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="border border-gray-300 px-3 py-3">
                  ID Risiko
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Risiko
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Besaran/Level Risiko Saat Ini
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Proyeksi Risiko
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Perlakuan Risiko
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Rencana Penanganan
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Penanggung Jawab
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Waktu Pelaksanaan
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Hasil Pelaksanaan
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Data Dukung
                </th>

                <th className="border border-gray-300 px-3 py-3">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={11}
                    className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={11}
                    className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                  >
                    Belum ada data risiko.
                  </td>
                </tr>
              ) : (
                data.map((item) => (
                  <tr
                    key={item.risiko_id}
                    className="hover:bg-gray-50"
                  >
                    <td className="border border-gray-300 px-3 py-3 font-semibold">
                      {item.kode_risiko}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 min-w-[240px]">
                      {item.peristiwa_risiko}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 text-center">
                      {item.risiko_saat_ini ??
                        item.besaran_risiko ??
                        '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 text-center">
                      {item.proyeksi_risiko ?? '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3">
                      {item.perlakuan_risiko ?? '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 min-w-[220px]">
                      {item.rencana_penanganan ?? '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3">
                      {item.nama_penanggung_jawab ?? '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3">
                      {item.waktu_pelaksanaan
                        ? new Date(
                            item.waktu_pelaksanaan
                          ).toLocaleDateString('id-ID')
                        : '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 min-w-[220px]">
                      {item.hasil_pelaksanaan ?? '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 min-w-[200px]">
                      {item.dokumen && item.dokumen.length > 0 ? (
                        <div className="flex flex-col gap-1">
                          {item.dokumen.map((dokumen) => (
                            <button
                              key={dokumen.id}
                              type="button"
                              onClick={() =>
                                handleDownloadDokumen(
                                  dokumen.id,
                                  dokumen.nama_file
                                )
                              }
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline text-left"
                            >
                              {dokumen.nama_file}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleEdit(item)}
                        className="px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700"
                      >
                        {item.monitoring_id
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

      {editingItem && (
        <div className="mt-6 bg-white border border-gray-200 rounded-xl p-6">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-gray-800">
              {editingItem.monitoring_id
                ? 'Edit Monitoring Semester I'
                : 'Lengkapi Monitoring Semester I'}
            </h2>

            <p className="text-sm text-gray-500 mt-1">
              {editingItem.kode_risiko} -{' '}
              {editingItem.peristiwa_risiko}
            </p>
          </div>

          <form
            onSubmit={handleSave}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-medium mb-1">
                Besaran/Level Risiko Saat Ini
              </label>

              <input
                type="number"
                min={1}
                max={25}
                value={formData.risiko_saat_ini}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    risiko_saat_ini: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Proyeksi Risiko
              </label>

              <input
                type="number"
                min={1}
                max={25}
                value={formData.proyeksi_risiko}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    proyeksi_risiko: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Perlakuan Risiko
              </label>

              <textarea
                rows={3}
                value={formData.perlakuan_risiko}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    perlakuan_risiko: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
                Rencana Penanganan
              </label>

              <textarea
                rows={3}
                value={formData.rencana_penanganan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rencana_penanganan: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">
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
                <option value="">
                  Pilih Penanggung Jawab
                </option>

                {picOptions.map((pic) => (
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
              <label className="block text-sm font-medium mb-1">
                Waktu Pelaksanaan
              </label>

              <input
                type="date"
                value={formData.waktu_pelaksanaan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    waktu_pelaksanaan: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Hasil Pelaksanaan
              </label>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-1">
                Data Dukung
              </label>

              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />

              <p className="text-xs text-gray-500 mt-1">
                Format: PDF, JPG, PNG, DOC, DOCX. Maksimal 10 MB.
              </p>
            </div>

              <textarea
                rows={3}
                value={formData.hasil_pelaksanaan}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hasil_pelaksanaan: e.target.value,
                  })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-3 mt-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-50"
              >
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default MonitoringSemester1Page;