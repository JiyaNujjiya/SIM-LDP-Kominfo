import React, { useEffect, useState } from 'react';

interface Form2Item {
  risiko_id: number;
  kode_risiko: string;
  besaran_risiko: number;
  layanan_prioritas_id: number;
  kode_prioritas: string;
  layanan_prioritas: string;
  membutuhkan_mkb: number | null;
  pic_id: number | null;
  nama_pic: string | null;
  target_penyusunan: string | null;
}

const LayananPrioritasPage: React.FC = () => {
  const [data, setData] = useState<Form2Item[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchForm2 = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/risiko/form2',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Gagal mengambil data Form 2.0');
      }

      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('ERROR FORM 2.0:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchForm2();
  }, []);

  if (loading) {
    return <div className="p-6">Memuat data...</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800">
        Form 2.0 - Daftar Layanan Digital Prioritas
      </h1>

      <p className="text-sm text-gray-500 mt-1 mb-6">
        Daftar layanan digital pemerintah prioritas berdasarkan hasil
        penilaian risiko.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left">No</th>
              <th className="px-4 py-3 text-left">
                Layanan Prioritas
              </th>
              <th className="px-4 py-3 text-left">Kode Risiko</th>
              <th className="px-4 py-3 text-left">
                Besaran Risiko
              </th>
              <th className="px-4 py-3 text-left">Perlu MKB?</th>
              <th className="px-4 py-3 text-left">PIC</th>
              <th className="px-4 py-3 text-left">
                Target Waktu Penyusunan
              </th>
            </tr>
          </thead>

          <tbody>
            {data.map((item, index) => (
              <tr
                key={item.risiko_id}
                className="border-t border-gray-100"
              >
                <td className="px-4 py-3">
                  {index + 1}
                </td>

                <td className="px-4 py-3">
                  {item.layanan_prioritas || '-'}
                </td>

                <td className="px-4 py-3 font-medium">
                  {item.kode_risiko}
                </td>

                <td className="px-4 py-3">
                  {item.besaran_risiko}
                </td>

                <td className="px-4 py-3">
                  {item.membutuhkan_mkb === null
                    ? '-'
                    : item.membutuhkan_mkb === 1
                    ? 'Ya'
                    : 'Tidak'}
                </td>

                <td className="px-4 py-3">
                  {item.nama_pic || '-'}
                </td>

                <td className="px-4 py-3">
                  {item.target_penyusunan
                    ? new Date(
                        item.target_penyusunan
                      ).toLocaleDateString('id-ID')
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LayananPrioritasPage;