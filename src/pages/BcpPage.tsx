import React, { useState, useEffect } from 'react';

interface BcpItem {
  id?: number;
  nama_layanan: string;
  rto?: number | string;
  rto_jam?: number | string;
  rpo?: number | string;
  rpo_jam?: number | string;
  strategi_pemulihan?: string;
  strategi?: string;
}

export default function BcpPage() {
  const [dataBcp, setDataBcp] = useState<BcpItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('http://localhost:5000/api/bcp')
      .then((res) => res.json())
      .then((data: BcpItem[]) => {
        setDataBcp(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching BCP:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 uppercase">
            Rencana Keberlangsungan Pelayanan (BCP)
          </h2>
          <p className="text-sm text-gray-500">
            Target waktu pemulihan dan strategi keberlangsungan layanan
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
        <div className="text-center py-8 text-gray-500">Memuat data BCP...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-gray-700 text-sm font-semibold">
                <th className="p-3">Nama Layanan</th>
                <th className="p-3">RTO (Jam)</th>
                <th className="p-3">RPO (Jam)</th>
                <th className="p-3">Strategi Pemulihan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {dataBcp.length > 0 ? (
                dataBcp.map((item, index) => (
                  <tr key={item.id || index} className="hover:bg-gray-50">
                    <td className="p-3 font-medium text-gray-900">
                      {item.nama_layanan}
                    </td>
                    <td className="p-3">{item.rto || item.rto_jam} jam</td>
                    <td className="p-3">{item.rpo || item.rpo_jam} jam</td>
                    <td className="p-3">{item.strategi_pemulihan || item.strategi}</td>
                  </tr>
                ))
              ) : (
                <tr className="hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">
                    Layanan E-Puskesmas Digital
                  </td>
                  <td className="p-3">2 jam</td>
                  <td className="p-3">1 jam</td>
                  <td className="p-3">
                    Failover otomatis ke DRC saat server utama mati
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