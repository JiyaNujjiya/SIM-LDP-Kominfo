import React from 'react';
import { Navigate, useNavigate } from 'react-router-dom';

interface MonitoringTahunanItem {
  risiko_id: number;
  kode_risiko: string;
  peristiwa_risiko: string;
  besaran_risiko: number;

  monitoring_id: number | null;
  tahun: number | null;
  periode: string | null;
  risiko_saat_ini: number | null;
  proyeksi_risiko: number | null;
  hasil_pelaksanaan: string | null;
  rekomendasi: string | null;
}


const MonitoringTahunanPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = React.useState<MonitoringTahunanItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [message, setMessage] = React.useState('');

  const [editingItem, setEditingItem] =
    React.useState<MonitoringTahunanItem | null>(null);

  const [formData, setFormData] = React.useState({
    risiko_saat_ini: '',
    proyeksi_risiko: '',
    hasil_pelaksanaan: '',
    rekomendasi: '',
  });

  const [saving, setSaving] = React.useState(false);

  const tahunSekarang = new Date().getFullYear();

  const fetchMonitoring = async () => {
    try {
      setLoading(true);
      setMessage('');

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/monitoring/tahunan?tahun=${tahunSekarang}`,
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
            'Gagal mengambil data monitoring Tahunan'
        );
      }

      setData(result);
    } catch (error) {
      const err = error as Error;

      console.error(
        'ERROR FETCH MONITORING TAHUNAN:',
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


  const handleEdit = (item: MonitoringTahunanItem) => {
    setEditingItem(item);

    setFormData({
      risiko_saat_ini:
        item.risiko_saat_ini?.toString() ??
        item.besaran_risiko?.toString() ??
        '',

      proyeksi_risiko:
        item.proyeksi_risiko?.toString() ?? '',

      hasil_pelaksanaan:
        item.hasil_pelaksanaan ?? '',
    
      rekomendasi:
        item.rekomendasi ?? '',
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
        `http://localhost:5000/api/risiko/monitoring/tahunan/${editingItem.risiko_id}`,
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

            hasil_pelaksanaan:
                formData.hasil_pelaksanaan || null,

            rekomendasi:
                formData.rekomendasi || null,
            }),
        }
        );

        const result = await response.json();

        if (!response.ok) {
        throw new Error(
            result.message ||
            result.error ||
            'Gagal menyimpan monitoring Tahunan'
        );
        }

        setMessage(
        'Monitoring Tahunan berhasil disimpan.'
        );

        setEditingItem(null);

        await fetchMonitoring();
    } catch (error) {
        const err = error as Error;

        console.error(
        'ERROR SAVE MONITORING TAHUNAN:',
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
      hasil_pelaksanaan: '',
      rekomendasi: '',
    });
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
          Monitoring Risiko Tahunan
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Evaluasi tahunan atas pelaksanaan penanganan risiko tahun{' '}
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
                placeholder="Cari kode atau peristiwa risiko..."
                className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-slate-200">
            <table className="w-full min-w-[1200px] border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 text-sm font-semibold text-slate-700">
                  <th className="w-[120px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Kode Risiko
                  </th>

                  <th className="w-[280px] border-b border-r border-slate-200 px-4 py-3">
                    Peristiwa Risiko
                  </th>

                  <th className="w-[160px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Risiko Saat Ini
                  </th>

                  <th className="w-[150px] border-b border-r border-slate-200 px-4 py-3 text-center">
                    Proyeksi Risiko
                  </th>

                  <th className="w-[300px] border-b border-r border-slate-200 px-4 py-3">
                    Penanganan yang Telah Dilakukan
                  </th>

                  <th className="w-[300px] border-b border-r border-slate-200 px-4 py-3">
                    Rekomendasi
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
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-500"
                    >
                      Memuat data monitoring...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-10 text-center text-slate-400"
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
                        {item.hasil_pelaksanaan || '-'}
                      </td>

                      <td className="border-b border-r border-slate-200 px-4 py-3">
                        {item.rekomendasi || '-'}
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
                  ? 'Edit Monitoring Tahunan'
                  : 'Lengkapi Monitoring Tahunan'}
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
                  Tentukan kondisi risiko saat ini dan proyeksi risiko pada akhir periode.
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
                  Evaluasi Penanganan Risiko
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Catat penanganan yang telah dilaksanakan selama periode berjalan.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">
                  Penanganan yang Telah Dilakukan
                </label>

                <textarea
                  rows={4}
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
                  placeholder="Masukkan hasil atau penanganan yang telah dilakukan"
                  className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
                />
              </div>
            </section>

            <section className="mt-6 border-t border-slate-200 pt-5">
              <div className="mb-4">
                <h4 className="text-sm font-bold text-slate-900">
                  Rekomendasi
                </h4>

                <p className="mt-1 text-sm text-slate-500">
                  Berikan rekomendasi tindak lanjut berdasarkan hasil monitoring tahunan.
                </p>
              </div>

              <textarea
                rows={4}
                value={formData.rekomendasi}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    rekomendasi:
                      e.target.value,
                  })
                }
                placeholder="Masukkan rekomendasi tindak lanjut"
                className="w-full resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
              />
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
          onClick={() => navigate('/risiko/monitoring/semester-2')}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Kembali ke Monitoring Semester II
        </button>
      </div>
    </div>
  );
};

export default MonitoringTahunanPage;