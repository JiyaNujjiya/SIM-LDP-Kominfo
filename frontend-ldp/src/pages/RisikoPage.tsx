import React, { useState, useEffect } from 'react';

interface RisikoItem {
  id?: number;
  kategori?: string;
  peristiwa_risiko?: string;
  peristiwa?: string;
  dampak: string;
  tingkat_risiko?: string;
  mitigasi?: string;
  rencana_mitigasi?: string;
}

export default function RisikoPage() {
  const [dataRisiko, setDataRisiko] = useState<RisikoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/risiko')
      .then((res) => res.json())
      .then((data: RisikoItem[]) => {
        setDataRisiko(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching risiko:', err);
        setLoading(false);
      });
  }, []);

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
        <div className="text-right">
          <span className="text-sm text-gray-600 block font-medium">Operator LDP</span>
          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
            Operator
          </span>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data risiko...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm font-semibold">
                <th className="p-3">Kategori</th>
                <th className="p-3">Peristiwa Risiko</th>
                <th className="p-3">Dampak</th>
                <th className="p-3">Tingkat Risiko</th>
                <th className="p-3">Rencana Mitigasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {dataRisiko.length > 0 ? (
                dataRisiko.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{item.kategori || 'Teknis'}</td>
                    <td className="p-3">{item.peristiwa_risiko || item.peristiwa}</td>
                    <td className="p-3">{item.dampak}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.tingkat_risiko === 'Tinggi'
                            ? 'bg-red-100 text-red-700'
                            : item.tingkat_risiko === 'Sedang'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-green-100 text-green-700'
                        }`}
                      >
                        {item.tingkat_risiko || 'Sedang'}
                      </span>
                    </td>
                    <td className="p-3">{item.mitigasi || item.rencana_mitigasi}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
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