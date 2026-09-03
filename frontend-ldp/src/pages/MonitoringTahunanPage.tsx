import React from 'react';

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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Monitoring Risiko Tahunan
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
            <table className="min-w-[1100px] w-full border-collapse text-sm">
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
                    Penanganan yang Telah Dilakukan
                </th>

                <th className="border border-gray-300 px-3 py-3">
                    Rekomendasi
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
                    colSpan={7}
                    className="border border-gray-300 px-4 py-8 text-center text-gray-500"
                    >
                    Memuat data...
                    </td>
                </tr>
                ) : data.length === 0 ? (
                <tr>
                    <td
                    colSpan={7}
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

                    <td className="border border-gray-300 px-3 py-3 min-w-[260px]">
                        {item.hasil_pelaksanaan ?? '-'}
                    </td>

                    <td className="border border-gray-300 px-3 py-3 min-w-[260px]">
                        {item.rekomendasi ?? '-'}
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
        <div className="bg-white border border-gray-200 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">
            {editingItem.monitoring_id
                ? 'Edit Monitoring Tahunan'
                : 'Lengkapi Monitoring Tahunan'}
            </h2>

            <div className="mb-5 p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="text-sm text-gray-500 mb-1">
                Risiko
            </div>

            <div className="font-semibold text-gray-800">
                {editingItem.kode_risiko} -{' '}
                {editingItem.peristiwa_risiko}
            </div>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Besaran/Level Risiko Saat Ini
                </label>

                <input
                    type="number"
                    min="1"
                    max="25"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    Proyeksi Risiko
                </label>

                <input
                    type="number"
                    min="1"
                    max="25"
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
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Penanganan yang Telah Dilakukan
                </label>

                <textarea
                rows={4}
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

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                Rekomendasi
                </label>

                <textarea
                rows={4}
                value={formData.rekomendasi}
                onChange={(e) =>
                    setFormData({
                    ...formData,
                    rekomendasi: e.target.value,
                    })
                }
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                Batal
                </button>

                <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                {saving ? 'Menyimpan...' : 'Simpan'}
                </button>
            </div>
            </form>
        </div>
      )}
    </div>
  );
};

export default MonitoringTahunanPage;