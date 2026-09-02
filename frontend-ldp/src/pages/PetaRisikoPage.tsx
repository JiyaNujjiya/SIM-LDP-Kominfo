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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Form 3.0 Peta Risiko
        </h1>

        <p className="text-sm text-gray-500 mt-1">
          Matriks analisis risiko berdasarkan kemungkinan dan
          dampak/konsekuensi
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 overflow-x-auto">
        <table className="border-collapse w-full min-w-[1000px] text-sm">
          <thead>
            <tr>
              <th
                colSpan={3}
                rowSpan={3}
                className="border border-gray-500 px-4 py-5 text-center text-lg font-bold"
              >
                Matrik Analisis Risiko
              </th>

              <th
                colSpan={5}
                className="border border-gray-500 px-4 py-3 text-center text-lg font-bold"
              >
                Dampak/Konsekuensi
              </th>
            </tr>

            <tr>
              {dampak.map((item) => (
                <th
                  key={`label-${item.level}`}
                  className="border border-gray-500 px-3 py-3 text-center font-bold"
                >
                  {item.label}
                </th>
              ))}
            </tr>

            <tr>
              {dampak.map((item) => (
                <th
                  key={`level-${item.level}`}
                  className="border border-gray-500 px-3 py-2 text-center text-base font-bold"
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
                    className="border border-gray-500 px-4 py-4 text-center font-bold w-[160px]"
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

                <th className="border border-gray-500 px-4 py-4 text-center font-bold w-[180px]">
                  {item.label}
                </th>

                <th className="border border-gray-500 px-4 py-4 text-center text-base font-bold w-[90px]">
                  {item.level}
                </th>

                {dampak.map((d) => (
                  <td
                    key={`${item.level}-${d.level}`}
                    className="border border-gray-500 h-[78px] min-w-[130px] p-2 align-top"
                    style={{
                      backgroundColor: getRiskColor(
                        item.level,
                        d.level
                      ),
                    }}
                  >
                    <div className="flex flex-wrap gap-1 justify-center">
                      {risikoData
                        .filter(
                          (r) =>
                            r.kemungkinan === item.level &&
                            r.nilai_dampak === d.level
                        )
                        .map((r) => (
                          <span
                            key={r.id}
                            title={r.peristiwa_risiko}
                            className="inline-flex px-2 py-1 text-xs font-bold rounded bg-white/90 text-gray-800 border border-gray-300"
                          >
                            {r.kode_risiko}
                          </span>
                        ))}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PetaRisikoPage;