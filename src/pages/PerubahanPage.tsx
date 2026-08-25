import React, { useState, useEffect } from 'react';

interface PerubahanItem {
  id?: number;
  nama_perubahan: string;
  pemohon: string;
  deskripsi_dampak: string;
  status: 'Pending' | 'Disetujui' | 'Ditolak' | 'Selesai' | string;
}

export default function PerubahanPage() {
  const [dataPerubahan, setDataPerubahan] = useState<PerubahanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/perubahan')
      .then((res) => res.json())
      .then((data: PerubahanItem[]) => {
        setDataPerubahan(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching perubahan:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase">
            Manajemen Perubahan (RFC)
          </h2>
          <p className="text-sm text-gray-500">
            Daftar pengajuan perubahan sistem, fitur, dan pembaruan infrastruktur
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
        <div className="text-center py-8 text-gray-500">Memuat data perubahan...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm font-semibold">
                <th className="p-3">Nama Perubahan</th>
                <th className="p-3">Pemohon</th>
                <th className="p-3">Deskripsi Dampak</th>
                <th className="p-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {dataPerubahan.length > 0 ? (
                dataPerubahan.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">
                      {item.nama_perubahan}
                    </td>
                    <td className="p-3">{item.pemohon}</td>
                    <td className="p-3">{item.deskripsi_dampak}</td>
                    <td className="p-3">
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          item.status === 'Disetujui' || item.status === 'Selesai'
                            ? 'bg-green-100 text-green-700'
                            : item.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="p-4 text-center text-gray-400">
                    Belum ada pengajuan perubahan.
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