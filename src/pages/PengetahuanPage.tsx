import React, { useState, useEffect } from 'react';

interface PengetahuanItem {
  id?: number;
  judul: string;
  kategori: string;
  deskripsi: string;
  penulis: string;
}

export default function PengetahuanPage() {
  const [dataPengetahuan, setDataPengetahuan] = useState<PengetahuanItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/pengetahuan')
      .then((res) => res.json())
      .then((data: PengetahuanItem[]) => {
        setDataPengetahuan(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching pengetahuan:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase">
            Manajemen Pengetahuan
          </h2>
          <p className="text-sm text-gray-500">
            Repositori SOP, pedoman teknis, dan dokumen pengetahuan SPBE
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
        <div className="text-center py-8 text-gray-500">Memuat data pengetahuan...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dataPengetahuan.length > 0 ? (
            dataPengetahuan.map((item, index) => (
              <div
                key={item.id || index}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded">
                    {item.kategori}
                  </span>
                  <span className="text-xs text-gray-400">
                    Penulis: {item.penulis}
                  </span>
                </div>
                <h3 className="font-bold text-gray-800 text-lg mb-1">{item.judul}</h3>
                <p className="text-sm text-gray-600 mb-4">{item.deskripsi}</p>
                <button className="text-xs bg-blue-600 text-white font-medium px-3 py-1.5 rounded hover:bg-blue-700 transition">
                  Lihat / Unduh Dokumen
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-8 text-gray-400">
              Belum ada dokumen pengetahuan.
            </div>
          )}
        </div>
      )}
    </div>
  );
}