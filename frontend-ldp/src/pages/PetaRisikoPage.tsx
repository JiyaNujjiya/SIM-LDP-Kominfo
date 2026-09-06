import { useNavigate } from 'react-router-dom';
import React from 'react';

interface RisikoPetaItem {
  id: number;
  kode_risiko: string;
  peristiwa_risiko: string;
  kemungkinan: number;
  nilai_dampak: number;
  besaran_risiko: number;
  status_risiko: string | null;
}

const PetaRisikoPage: React.FC = () => {
  const navigate =useNavigate();
  const [risikoData, setRisikoData] = React.useState<RisikoPetaItem[]>([]);

  const kemungkinan = [
    { level: 5, label: 'Hampir Pasti' },
    { level: 4, label: 'Kemungkinan Besar' },
    { level: 3, label: 'Kemungkinan Kecil' },
    { level: 2, label: 'Sangat Jarang' },
    { level: 1, label: 'Hampir Tidak Terjadi' },
  ];

  const dampak = [
    { level: 1, label: 'Tidak Signifikan' },
    { level: 2, label: 'Kurang Signifikan' },
    { level: 3, label: 'Sedang' },
    { level: 4, label: 'Signifikan' },
    { level: 5, label: 'Sangat Signifikan' },
  ];

  const getRiskColor = (
    kemungkinanLevel: number,
    dampakLevel: number
  ) => {
    const matrix: Record<number, Record<number, string>> = {
      5: {
        1: '#00B050',
        2: '#FFFF00',
        3: '#F28B82',
        4: '#FF0000',
        5: '#FF0000',
      },
      4: {
        1: '#00B050',
        2: '#FFFF00',
        3: '#F28B82',
        4: '#F28B82',
        5: '#FF0000',
      },
      3: {
        1: '#C6E0B4',
        2: '#00B050',
        3: '#FFFF00',
        4: '#F28B82',
        5: '#FF0000',
      },
      2: {
        1: '#C6E0B4',
        2: '#00B050',
        3: '#FFFF00',
        4: '#FFFF00',
        5: '#FF0000',
      },
      1: {
        1: '#C6E0B4',
        2: '#C6E0B4',
        3: '#C6E0B4',
        4: '#00B050',
        5: '#F28B82',
      },
    };

    return matrix[kemungkinanLevel][dampakLevel];
  };

  React.useEffect(() => {
    const fetchPetaRisiko = async () => {
      try {
        const token = localStorage.getItem('token');

        const response = await fetch(
          'http://localhost:5000/api/risiko/peta-risiko',
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Gagal mengambil data peta risiko');
        }

        const result = await response.json();

        setRisikoData(result);
      } catch (error) {
        console.error('ERROR FETCH PETA RISIKO:', error);
      }
    };

    fetchPetaRisiko();
  }, []);

  const totalRisiko = risikoData.length;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-900">
          Peta Risiko
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Matriks analisis risiko berdasarkan tingkat kemungkinan dan
          dampak/konsekuensi.
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
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1B2A4A] text-xs font-semibold text-white">
              4
            </div>

            <span className="text-xs font-semibold text-slate-900">
              Peta Risiko
            </span>
          </div>

          <div className="mx-4 h-px flex-1 bg-slate-300" />
          <div className="flex min-w-fit items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full border border-slate-300 text-xs text-slate-500">
              5
            </div>

            <span className="text-xs text-slate-500">
              Pemantauan dan Pelaporan
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Total Risiko
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-900">
            {totalRisiko}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full min-w-[1050px] border-collapse text-sm">
          <thead>
            <tr>
              <th
                colSpan={3}
                rowSpan={3}
                className="border-b border-r border-slate-300 bg-slate-50 px-4 py-5 text-center text-base font-bold text-slate-900"
              >
                Matrik Analisis Risiko
              </th>

              <th
                colSpan={5}
                className="border-b border-slate-300 bg-slate-50 px-4 py-3 text-center text-base font-bold text-slate-900"
              >
                Dampak/Konsekuensi
              </th>
            </tr>

            <tr>
              {dampak.map((item) => (
                <th
                  key={`label-${item.level}`}
                  className="border-b border-l border-slate-300 bg-slate-50 px-3 py-3 text-center text-sm font-semibold text-slate-700"
                >
                  {item.label}
                </th>
              ))}
            </tr>

            <tr>
              {dampak.map((item) => (
                <th
                  key={`level-${item.level}`}
                  className="border-b border-l border-slate-300 bg-slate-50 px-3 py-2 text-center text-sm font-bold text-slate-900"
                >
                  {item.level}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {kemungkinan.map((item, index) => (
              <tr key={item.level}>
                {index === 0 && (
                  <th
                    rowSpan={5}
                    className="w-[150px] border-b border-r border-slate-300 bg-slate-50 px-4 py-4 text-center font-bold text-slate-900"
                  >
                    <div className="leading-relaxed">
                      Kemungkinan
                      <br />
                      Terjadinya
                      <br />
                      Risiko
                    </div>
                  </th>
                )}

                <th className="w-[180px] border-b border-r border-slate-300 bg-white px-4 py-4 text-center font-semibold text-slate-700">
                  {item.label}
                </th>

                <th className="w-[80px] border-b border-r border-slate-300 bg-white px-4 py-4 text-center text-base font-bold text-slate-900">
                  {item.level}
                </th>

                {dampak.map((d) => {
                  const risikoDalamCell = risikoData.filter(
                    (r) =>
                      r.kemungkinan === item.level &&
                      r.nilai_dampak === d.level
                  );

                  return (
                    <td
                      key={`${item.level}-${d.level}`}
                      className="h-[90px] min-w-[140px] border-b border-r border-slate-300 p-2 align-top"
                      style={{
                        backgroundColor: getRiskColor(
                          item.level,
                          d.level
                        ),
                      }}
                    >
                      <div className="flex flex-wrap justify-center gap-1.5">
                        {risikoDalamCell.map((r) => (
                          <span
                            key={r.id}
                            title={r.peristiwa_risiko}
                            className="inline-flex cursor-default rounded-md border border-slate-300 bg-white/95 px-2.5 py-1 text-xs font-bold text-slate-800 shadow-sm"
                          >
                            {r.kode_risiko}
                          </span>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* KETERANGAN */}
      <div className="mt-4 text-xs text-slate-500">
        Posisi setiap risiko ditentukan berdasarkan kombinasi tingkat kemungkinan
        dan nilai dampak.
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={() => navigate('/risiko/layanan-prioritas')}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Kembali ke Layanan Digital Prioritas
        </button>

        <button
          type="button"
          onClick={() => navigate('/risiko/monitoring/semester-1')}
          className="rounded-lg bg-[#1B2A4A] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#24375f]"
        >
          Lanjut ke Monitoring Semester I
          <span className="ml-2" aria-hidden="true">
            →
          </span>
        </button>
      </div>
    </div>
  );
};

export default PetaRisikoPage;