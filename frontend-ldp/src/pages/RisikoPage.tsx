import React, { useState, useEffect } from 'react';

interface RisikoItem {
  id: number;
  layanan_id?: number | null;
  layanan_prioritas_id?: number | null;
  pemilik_layanan?: string | null;

  kode_risiko?: string | null;
  peristiwa_risiko?: string | null;
  penyebab?: string | null;
  dampak?: string | null;

  kemungkinan?: number | null;
  nilai_dampak?: number | null;
  besaran_risiko?: number | null;

  keputusan_perlakuan?: string | null;
  kategori_risiko?: string | null;
  prioritas_risiko?: string | null;

  deskripsi_detail_perlakuan?: string | null;
  waktu_rencana_perlakuan?: string | null;

  pembuat?: string | null;
}

export default function RisikoPage() {
  const [dataRisiko, setDataRisiko] = useState<RisikoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showForm, setShowForm] = useState(false);

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;

  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes('risk.create');

  useEffect(() => {
  const token = localStorage.getItem('token');

  fetch('http://localhost:5000/api/risiko', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  })
    .then(async (res) => {
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Gagal mengambil data risiko');
      }

      return res.json();
    })
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
        
        <div className="flex items-center gap-4">
          {canCreate && (
            <button
              onClick={() => setShowForm(true)} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg"
            >
              + Tambah Risiko
            </button>
          )}

          <div className="text-right">
            <span className="text-sm text-gray-600 block font-medium">
            Operator LDP
            </span>

          <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
            Operator
          </span>
        </div>
      </div>
    </div>
      
  {showForm && (
    <div className="mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">
          Tambah Risiko
        </h3>

        <button
          onClick={() => setShowForm(false)}
          className="text-gray-500 hover:text-gray-800 font-semibold"
        >
          Tutup
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kode Risiko
          </label>

          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Contoh: RSK-002"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Kategori Risiko
          </label>

          <input
            type="text"
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Masukkan kategori risiko"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Peristiwa Risiko
          </label>

          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Masukkan peristiwa risiko"
          />
        </div>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dampak
          </label>

          <textarea
            className="w-full border border-gray-300 rounded-lg px-3 py-2"
            placeholder="Masukkan dampak"
          />
        </div>
      </div>
    </div>
  )}

      {loading ? (
        <div className="text-center py-8 text-gray-500">Memuat data risiko...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm font-semibold">
                <th className="p-3">Kode Risiko</th>
                <th className="p-3">Kategori</th>
                <th className="p-3">Peristiwa Risiko</th>
                <th className="p-3">Dampak</th>
                <th className="p-3">Besaran Risiko</th>
                <th className="p-3">Keputusan Perlakuan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {dataRisiko.length > 0 ? (
                dataRisiko.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="p-3 font-semibold">
                      {item.kode_risiko || '-'}
                    </td>

                    <td className="p-3">
                      {item.kategori_risiko || '-'}
                    </td>

                    <td className="p-3">
                      {item.peristiwa_risiko || '-'}                   
                    </td>

                    <td className="p-3">
                      {item.dampak || '-'}
                    </td>

                    <td className="p-3">
                      {item.besaran_risiko ?? '-'}
                    </td>

                    <td className="p-3">
                      {item.keputusan_perlakuan || '-'}
                    </td>
                  </tr>       
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="p-4 text-center text-gray-400">
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