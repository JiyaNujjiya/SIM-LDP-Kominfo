import { useEffect, useMemo, useState } from 'react';

type RiskItem = {
  id: number;
  kode_risiko?: string | null;
  peristiwa_risiko?: string | null;
  kategori_risiko?: string | null;
  besaran_risiko?: number | null;
  prioritas_risiko?: string | null;
  status_risiko?: 'Draft' | 'Diajukan' | 'Disetujui' | 'Ditolak' | null;
};

type MonitoringItem = {
  risiko_id: number;
  monitoring_id?: number | null;
};

type OverviewItem = RiskItem & {
  monitoring_id?: number | null;
};

function RiskOverviewPage() {
  const [data, setData] = useState<OverviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [kategori, setKategori] = useState('Semua');
  const [status, setStatus] = useState('Semua');

  const fetchOverview = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem('token');

      const [risikoResponse, monitoringResponse] = await Promise.all([
        fetch('http://localhost:5000/api/risiko', {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),

        fetch(
          'http://localhost:5000/api/risiko/monitoring/semester-1?tahun=2026',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          }
        ),
      ]);

      const risikoResult = await risikoResponse.json();
      const monitoringResult = await monitoringResponse.json();

      if (!risikoResponse.ok) {
        throw new Error(
          risikoResult.message ||
            risikoResult.error ||
            'Gagal mengambil data risiko.'
        );
      }

      if (!monitoringResponse.ok) {
        throw new Error(
          monitoringResult.message ||
            monitoringResult.error ||
            'Gagal mengambil data monitoring.'
        );
      }

      const risikoData: RiskItem[] = Array.isArray(risikoResult)
        ? risikoResult
        : [];

      const monitoringData: MonitoringItem[] = Array.isArray(
        monitoringResult
      )
        ? monitoringResult
        : [];

      const mergedData: OverviewItem[] = risikoData.map((risiko) => {
        const monitoring = monitoringData.find(
          (item) => item.risiko_id === risiko.id
        );

        return {
          ...risiko,
          monitoring_id: monitoring?.monitoring_id ?? null,
        };
      });

      setData(mergedData);
    } catch (error) {
      console.error('ERROR OVERVIEW RISIKO:', error);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  const kategoriOptions = useMemo(() => {
    const values = data
      .map((item) => item.kategori_risiko)
      .filter(
        (value): value is string =>
          Boolean(value && value.trim())
      );

    return [...new Set(values)];
  }, [data]);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return data.filter((item) => {
      const matchSearch =
        !keyword ||
        item.kode_risiko
          ?.toLowerCase()
          .includes(keyword) ||
        item.peristiwa_risiko
          ?.toLowerCase()
          .includes(keyword) ||
        item.kategori_risiko
          ?.toLowerCase()
          .includes(keyword);

      const matchKategori =
        kategori === 'Semua' ||
        item.kategori_risiko === kategori;

      const matchStatus =
        status === 'Semua' ||
        item.status_risiko === status;

      return matchSearch && matchKategori && matchStatus;
    })
    .sort((a, b) => 
      (a.kode_risiko || '').localeCompare(
        b.kode_risiko || '',
        undefined,
        {numeric: true}
      )
    );
  }, [data, search, kategori, status]);

  const totalRisiko = data.length;

  const prioritasTinggi = data.filter(
    (item) =>
      item.prioritas_risiko?.toLowerCase() === 'Tinggi'
  ).length;

  const prioritasSedang = data.filter(
    (item) =>
      item.prioritas_risiko?.toLowerCase() === 'sedang'
  ).length;

  const dalamPemantauan = data.filter(
    (item) => Boolean(item.monitoring_id)
  ).length;

  const getStatusClass = (statusRisiko?: string | null) => {
    switch (statusRisiko) {
      case 'Disetujui':
        return 'bg-emerald-50 text-emerald-700 border-emerald-300';

      case 'Diajukan':
        return 'bg-amber-50 text-amber-700 border-amber-300';

      case 'Ditolak':
        return 'bg-red-100 text-red-600 border-red-300';

      default:
        return 'bg-gray text-gray-600 border-gray-300';
    }
  };

  const getPrioritasClass = (prioritas?: string | null) => {
    const normalize = prioritas?.trim().toLowerCase();
        switch (normalize) {
            case 'tinggi':
            return 'bg-red-50 text-red-700 border-red-200';

            case 'sedang':
            return 'bg-amber-50 text-amber-700 border-amber-200';

            case 'rendah':
            return 'bg-emerald-50 text-emerald-700 border-emerald-200';

            default:
            return 'bg-gray-50 text-gray-600 border-gray-200';
        }
 };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Manajemen Risiko
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Ringkasan kondisi dan pemantauan risiko layanan
          digital pemerintah.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          <div className="px-6 py-5">
            <p className="text-sm text-gray-500">
              Total Risiko
            </p>

            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {totalRisiko}
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-gray-500">
              Prioritas Tinggi
            </p>

            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {prioritasTinggi}
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-gray-500">
              Prioritas Sedang
            </p>

            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {prioritasSedang}
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm text-gray-500">
              Dalam Pemantauan
            </p>

            <p className="text-2xl font-semibold text-gray-900 mt-2">
              {dalamPemantauan}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="mb-5">
          <h2 className="text-base font-semibold text-gray-800">
            Daftar Risiko
          </h2>

          <p className="text-sm text-gray-500 mt-1">
            Ringkasan risiko berdasarkan Form 1.0 Profil dan
            Penilaian Risiko.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Kategori Risiko
            </label>

            <select
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white"
            >
              <option value="Semua">Semua Kategori</option>

              {kategoriOptions.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Status Risiko
            </label>

            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm bg-white"
            >
              <option value="Semua">Semua Status</option>
              <option value="Draft">Draft</option>
              <option value="Diajukan">Diajukan</option>
              <option value="Disetujui">Disetujui</option>
              <option value="Ditolak">Ditolak</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Pencarian
            </label>

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID, risiko, atau kategori..."
              className="w-full h-10 border border-gray-300 rounded-lg px-3 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  No
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  ID Risiko
                </th>

                <th className="border border-gray-200 px-4 py-2.5 text-center font-semibold text-gray-700">
                  Peristiwa Risiko
                </th>

                <th className="border border-gray-200 px-4 py-2.5 text-center font-semibold text-gray-700">
                  Kategori Risiko
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Besaran Risiko
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Prioritas
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Status Risiko
                </th>

                <th className="border border-gray-200 px-4 py-3 text-center font-semibold text-gray-700">
                  Status Monitoring
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-gray-200 px-4 py-8 text-center text-gray-500"
                  >
                    Memuat data risiko...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="border border-gray-200 px-4 py-8 text-center text-gray-500"
                  >
                    Tidak ada data risiko.
                  </td>
                </tr>
              ) : (
                filteredData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50"
                  >
                    <td className="border border-gray-200 px-4 py-3 text-center">
                      {index + 1}
                    </td>

                    <td className="border border-gray-200 px-4 py-3 font-medium text-gray-800 whitespace-nowrap">
                      {item.kode_risiko || '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-3 text-gray-700 min-w-[300px]">
                      {item.peristiwa_risiko || '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-3 text-gray-700">
                      {item.kategori_risiko || '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-3 text-center font-medium">
                      {item.besaran_risiko ?? '-'}
                    </td>

                    <td className="border border-gray-200 px-4 py-3 text-center">
                      {item.prioritas_risiko ? (
                        <span
                            className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${getPrioritasClass(
                            item.prioritas_risiko
                            )}`}
                        >
                            {item.prioritas_risiko}
                        </span>
                        ) : (
                        <span className="text-gray-400">-</span>
                        )}
                    </td>

                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md border text-xs ${getStatusClass(
                          item.status_risiko
                        )}`}
                      >
                        {item.status_risiko || '-'}
                      </span>
                    </td>

                    <td className="border border-gray-200 px-4 py-3 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md border text-xs font-medium ${
                            item.monitoring_id
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-gray-50 text-gray-600 border-gray-200'
                        }`}
                      >
                        {item.monitoring_id
                            ? 'Sudah Dimonitor'
                            : 'Belum Dimonitor'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default RiskOverviewPage;