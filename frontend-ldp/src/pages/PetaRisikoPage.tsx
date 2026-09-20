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

const processSteps = [
  {
    number: 1,
    label: 'Penetapan Konteks',
    route: '/risiko/konteks',
  },
  {
    number: 2,
    label: 'Profil & Penilaian Risiko',
    route: '/risiko',
  },
  {
    number: 3,
    label: 'Layanan Digital Prioritas',
    route: '/risiko/layanan-prioritas',
  },
  {
    number: 4,
    label: 'Peta Risiko',
    route: '/risiko/peta-risiko',
  },
  {
    number: 5,
    label: 'Pemantauan & Pelaporan',
    route: '/risiko/monitoring/semester-1',
  },
];

const PetaRisikoPage: React.FC = () => {
  const navigate = useNavigate();
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
        const token = sessionStorage.getItem('token');

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Risiko
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 4 - Peta Risiko
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start">
          {processSteps.map((step, index) => {
            const active = step.number === 4;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <button
                  type="button"
                  onClick={() => navigate(step.route)}
                  className="flex min-w-[110px] flex-col items-center text-center"
                >
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                      active
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : 'border-slate-300 bg-white text-slate-500'
                    }`}
                  >
                    {step.number}
                  </div>

                  <span
                    className={`mt-2 max-w-[150px] text-xs leading-4 ${
                      active
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {index < processSteps.length - 1 && (
                  <div className="mx-3 mt-[18px] h-px flex-1 bg-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Peta Risiko
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Matriks analisis risiko berdasarkan tingkat kemungkinan dan dampak/konsekuensi.
            </p>
          </div>

          <div className="rounded-md border border-slate-200 bg-slate-50 px-4 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Total Risiko
            </p>

            <p className="mt-1 text-xl font-bold text-slate-800">
              {totalRisiko}
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
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

        <div className="border-t border-slate-200 p-5 text-xs text-slate-500">
          Posisi setiap risiko ditentukan berdasarkan kombinasi tingkat kemungkinan
          dan nilai dampak.
        </div>
      </div>
    </div>
  );
};

export default PetaRisikoPage;