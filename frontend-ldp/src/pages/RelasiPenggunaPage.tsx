import React, { useState, useEffect } from 'react';

interface TiketItem {
  id?: number;
  pelapor: string;
  nama_layanan?: string;
  deskripsi_masalah: string;
  prioritas: 'Rendah' | 'Sedang' | 'Tinggi' | string;
  status_tiket: 'Open' | 'In Progress' | 'Resolved' | string;
}

export default function RelasiPenggunaPage() {
  const [dataTiket, setDataTiket] = useState<TiketItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/relasi-pengguna')
      .then((res) => res.json())
      .then((data: TiketItem[]) => {
        setDataTiket(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching relasi pengguna:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase">
            Manajemen Relasi Pengguna (Helpdesk)
          </h2>
          <p className="text-sm text-gray-500">
            Daftar laporan insiden, kendala, dan masukan dari pengguna layanan
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
        <div className="text-center py-8 text-gray-500">Memuat tiket insiden...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm font-semibold">
                <th className="p-3">Pelapor</th>
                <th className="p-3">Layanan Terkait</th>
                <th className="p-3">Deskripsi Masalah</th>
                <th className="p-3">Prioritas</th>
                <th className="p-3">Status Tiket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {dataTiket.length > 0 ? (
                dataTiket.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">{item.pelapor}</td>
                    <td className="p-3">{item.nama_layanan || 'Layanan Umum'}</td>
                    <td className="p-3">{item.deskripsi_masalah}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          item.prioritas === 'Tinggi'
                            ? 'bg-red-100 text-red-700'
                            : item.prioritas === 'Sedang'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {item.prioritas}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status_tiket === 'Resolved'
                            ? 'bg-green-100 text-green-700'
                            : item.status_tiket === 'In Progress'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-yellow-100 text-yellow-700'
                        }`}
                      >
                        {item.status_tiket}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-gray-400">
                    Belum ada tiket insiden masuk.
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