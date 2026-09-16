import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface MonitoringDokumen {
  id: number;
  monitoring_id: number;
  nama_file: string;
  path_file: string;
  tipe_file: string | null;
  ukuran_file: number | null;
  uploaded_at: string;
}

interface MonitoringSemester2Item {
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

const MonitoringSemester2Page: React.FC = () => {
  const [data, setData] = React.useState<MonitoringSemester2Item[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  const [editingItem, setEditingItem] =
    React.useState<MonitoringSemester2Item | null>(null);

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

  const navigate = useNavigate();

  const tahunSekarang = new Date().getFullYear();

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      setMessage('');

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/monitoring/semester-2?tahun=${tahunSekarang}`,
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
            'Gagal mengambil data monitoring Semester II'
        );
      }

      setData(result);
    } catch (error) {
      const err = error as Error;

      console.error(
        'ERROR FETCH MONITORING SEMESTER II:',
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
        const token = sessionStorage.getItem('token');

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

  const handleEdit = (item: MonitoringSemester2Item) => {
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

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/monitoring/semester-2/${editingItem.risiko_id}`,
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
            'Gagal menyimpan monitoring Semester II'
        );
      }

      const refreshedResponse = await fetch(
      `http://localhost:5000/api/risiko/monitoring/semester-2?tahun=${tahunSekarang}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const refreshedData: MonitoringSemester2Item[] =
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
        ? 'Monitoring Semester II dan Data Dukung berhasil disimpan.'
        : 'Monitoring Semester II berhasil disimpan.'
    );

    setSelectedFile(null);
    setEditingItem(null);

    await fetchMonitoring();
        } catch (error) {
          const err = error as Error;

          console.error(
            'ERROR SAVE MONITORING SEMESTER II:',
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
      const token = sessionStorage.getItem('token');

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

  const [search, setSearch] = React.useState('');
  const [statusFilter, setStatusFilter] =
    React.useState('Semua');

  const filteredData = data
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
        item.nama_penanggung_jawab
          ?.toLowerCase()
          .includes(keyword);

      const matchStatus =
        statusFilter === 'Semua' ||
        (statusFilter === 'Sudah Dimonitor' &&
          item.monitoring_id !== null) ||
        (statusFilter === 'Belum Dimonitor' &&
          item.monitoring_id === null);

      return matchSearch && matchStatus;
    })
    .sort((a, b) =>
      (a.kode_risiko || '').localeCompare(
        b.kode_risiko || '',
        undefined,
        { numeric: true }
      )
    );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Monitoring Risiko Semester II
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Pemantauan pelaksanaan penanganan risiko pada Semester II tahun{' '}
          {tahunSekarang}.
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
            <button
              type="button"
              onClick={() => navigate('/risiko')}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 hover:border-slate-400"
            >
              3
            </button>

            <button
              type="button"
              onClick={() => navigate('/risiko')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Layanan Digital Prioritas
            </button>
          </div>

          <div className="mx-4 h-px flex-1 bg-slate-300" />
          <div className="flex min-w-fit items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/risiko')}
              className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500 hover:border-slate-400"
            >
              4
            </button>

            <button
              type="button"
              onClick={() => navigate('/risiko')}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Peta Risiko
            </button>
          </div>

          <div className="mx-4 h-px flex-1 bg-slate-300" />
          <div className="flex min-w-fit items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-semibold text-white">
              5
            </div>

            <span className="text-xs text-slate-500">
              Pemantauan dan Pelaporan
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="mb-5 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          {message}
        </div>
      )}

      {!editingItem && (
        <>
          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Status Monitoring
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

                <option value="Sudah Dimonitor">
                  Sudah Dimonitor
                </option>

                <option value="Belum Dimonitor">
                  Belum Dimonitor
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
                placeholder="Cari kode risiko, peristiwa risiko, atau PIC..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1650px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-sm font-semibold text-slate-700">
                  <th className="w-[120px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Kode Risiko
                  </th>

                  <th className="w-[280px] border-b border-r border-slate-200 px-4 py-3">
                    Peristiwa Risiko
                  </th>

                  <th className="w-[150px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Risiko Saat Ini
                  </th>

                  <th className="w-[140px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Proyeksi Risiko
                  </th>

                  <th className="w-[220px] border-b border-r border-slate-200 px-4 py-3">
                    Perlakuan Risiko
                  </th>

                  <th className="w-[260px] border-b border-r border-slate-200 px-4 py-3">
                    Rencana Penanganan
                  </th>

                  <th className="w-[180px] border-b border-r border-slate-200 px-4 py-3">
                    Penanggung Jawab
                  </th>

                  <th className="w-[150px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Waktu Pelaksanaan
                  </th>

                  <th className="w-[240px] border-b border-r border-slate-200 px-4 py-3">
                    Hasil Pelaksanaan
                  </th>

                  <th className="w-[220px] border-b border-r border-slate-200 px-4 py-3">
                    Data Dukung
                  </th>

                  <th className="w-[140px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Status
                  </th>

                  <th className="w-[120px] border-b border-slate-200 px-4 py-3 text-center">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="text-sm text-slate-700">
                {loading ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-10 text-center text-sm text-slate-500"
                    >
                      Memuat data monitoring...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={12}
                      className="px-4 py-10 text-center text-sm text-slate-400"
                    >
                      Tidak ada data monitoring yang sesuai.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item) => (
                    <tr
                      key={item.risiko_id}
                      className="hover:bg-slate-50"
                    >
                      <td className="whitespace-nowrap border-b border-r border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">
                        {item.kode_risiko}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        {item.peristiwa_risiko || '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3 text-center font-semibold text-slate-900">
                        {item.risiko_saat_ini ??
                          item.besaran_risiko ??
                          '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3 text-center">
                        {item.proyeksi_risiko ?? '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        {item.perlakuan_risiko || '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        {item.rencana_penanganan || '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        {item.nama_penanggung_jawab || '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3 text-center">
                        {item.waktu_pelaksanaan
                          ? new Date(
                              item.waktu_pelaksanaan
                            ).toLocaleDateString('id-ID')
                          : '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        {item.hasil_pelaksanaan || '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        {item.dokumen &&
                        item.dokumen.length > 0 ? (
                          <div className="space-y-1">
                            {item.dokumen.map(
                              (dokumen) => (
                                <button
                                  key={dokumen.id}
                                  type="button"
                                  onClick={() =>
                                    handleDownloadDokumen(
                                      dokumen.id,
                                      dokumen.nama_file
                                    )
                                  }
                                  className="block max-w-[200px] truncate text-left text-xs font-medium text-blue-700 hover:underline"
                                  title={dokumen.nama_file}
                                >
                                  {dokumen.nama_file}
                                </button>
                              )
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">
                            -
                          </span>
                        )}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3 text-center">
                        {item.monitoring_id ? (
                          <span className="inline-flex rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                            Sudah Dimonitor
                          </span>
                        ) : (
                          <span className="inline-flex rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                            Belum Dimonitor
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
        </>
      )}

      {editingItem && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="flex items-start justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h3 className="text-lg font-bold text-slate-900">
                {editingItem.monitoring_id
                  ? 'Edit Monitoring Semester II'
                  : 'Lengkapi Monitoring Semester II'}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {editingItem.kode_risiko}
                {' - '}
                {editingItem.peristiwa_risiko}
              </p>
            </div>

            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="text-sm font-semibold text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              Tutup
            </button>
          </div>

          <form
            onSubmit={handleSave}
            className="p-6"
          >
            <section>
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Kondisi Risiko
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Tentukan kondisi risiko saat ini dan proyeksi risiko.
                </p>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Besaran/Level Risiko Saat Ini
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={
                      formData.risiko_saat_ini
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        risiko_saat_ini:
                          e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Proyeksi Risiko
                  </label>

                  <input
                    type="number"
                    min={1}
                    max={25}
                    value={
                      formData.proyeksi_risiko
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        proyeksi_risiko:
                          e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <section className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Penanganan Risiko
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Perlakuan Risiko
                  </label>

                  <textarea
                    rows={3}
                    value={
                      formData.perlakuan_risiko
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        perlakuan_risiko:
                          e.target.value,
                      })
                    }
                    placeholder="Masukkan perlakuan risiko"
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Rencana Penanganan
                  </label>

                  <textarea
                    rows={3}
                    value={
                      formData.rencana_penanganan
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        rencana_penanganan:
                          e.target.value,
                      })
                    }
                    placeholder="Masukkan rencana penanganan"
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Penanggung Jawab
                  </label>

                  <select
                    value={
                      formData.penanggung_jawab_id
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        penanggung_jawab_id:
                          e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-blue-500"
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
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Waktu Pelaksanaan
                  </label>

                  <input
                    type="date"
                    value={
                      formData.waktu_pelaksanaan
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        waktu_pelaksanaan:
                          e.target.value,
                      })
                    }
                    className="h-11 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </section>

            <section className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Hasil dan Data Dukung
                </h4>
              </div>

              <div className="grid grid-cols-1 gap-5">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Hasil Pelaksanaan
                  </label>

                  <textarea
                    rows={3}
                    value={
                      formData.hasil_pelaksanaan
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        hasil_pelaksanaan:
                          e.target.value,
                      })
                    }
                    placeholder="Masukkan hasil pelaksanaan"
                    className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">
                    Data Dukung
                  </label>

                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => {
                      const file =
                        e.target.files?.[0] ??
                        null;

                      setSelectedFile(file);
                    }}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  />

                  <p className="mt-1 text-xs text-slate-500">
                    Format PDF, JPG, JPEG, PNG, DOC, atau DOCX. Maksimal 10 MB.
                  </p>

                  {selectedFile && (
                    <p className="mt-2 text-xs font-medium text-slate-700">
                      File dipilih: {selectedFile.name}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={handleCancel}
                disabled={saving}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-[#1B2A4A] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#24375f] disabled:opacity-50"
              >
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan Monitoring'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => navigate('/risiko/peta-risiko')}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Kembali ke Monitoring Semester I
        </button>

        <button
          type="button"
          onClick={() => navigate('/risiko/monitoring/semester-2')}
          className="rounded-lg bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#24375f]"
        >
          Lanjut ke Monitoring Tahunan
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  );
};

export default MonitoringSemester2Page;