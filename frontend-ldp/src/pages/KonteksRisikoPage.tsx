import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type KonteksItem = {
  id: number;
  nama_instansi?: string | null;
  nama_upr?: string | null;
  tugas_upr?: string | null;
  fungsi_upr?: string | null;
  tahun_pelaksanaan?: number | string | null;
  sasaran_upr?: string | null;
  indikator_kinerja?: string | null;
  target_kinerja?: string | null;
  sasaran_pembangunan_nasional?: string | null;
  pemilik_risiko?: string | null;
  koordinator_risiko?: string | null;
  pengelola_risiko?: string | null;
  besaran_selera_risiko?: number | null;
};

type FormState = {
  nama_instansi: string;
  nama_upr: string;
  tugas_upr: string;
  fungsi_upr: string;
  tahun_pelaksanaan: string;
  sasaran_upr: string;
  indikator_kinerja: string;
  target_kinerja: string;
  sasaran_pembangunan_nasional: string;
  pemilik_risiko: string;
  koordinator_risiko: string;
  pengelola_risiko: string;
  besaran_selera_risiko: string;
};

const createEmptyForm = (): FormState => ({
  nama_instansi: '',
  nama_upr: '',
  tugas_upr: '',
  fungsi_upr: '',
  tahun_pelaksanaan: new Date().getFullYear().toString(),
  sasaran_upr: '',
  indikator_kinerja: '',
  target_kinerja: '',
  sasaran_pembangunan_nasional: '',
  pemilik_risiko: '',
  koordinator_risiko: '',
  pengelola_risiko: '',
  besaran_selera_risiko: '',
});

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

export default function KonteksRisikoPage() {
  const navigate = useNavigate();

  const savedUser = sessionStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes('risk.create');
  const canUpdate = permissions.includes('risk.update');
  const canDelete = permissions.includes('risk.delete');
    const [formData, setFormData] = useState<FormState>(
      createEmptyForm()
    );

  const [loading, setLoading] = useState(false);
  const [konteksList, setKonteksList] = useState<KonteksItem[]>([]);
  const [selectedKonteks, setSelectedKonteks] =
    useState<KonteksItem | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500';

  const labelClass =
    'text-sm font-medium text-slate-700';

  const resetForm = () => {
    setFormData(createEmptyForm());
    setEditId(null);
    setShowForm(false);
  };

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchKonteks = async () => {
    try {
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/risiko/konteks',
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            'Gagal mengambil data konteks.'
        );
      }

      setKonteksList(
        Array.isArray(result)
          ? result
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data konteks.'
      );
    }
  };

  const fetchDetailKonteks = async (id: number) => {
    try {
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/konteks/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            'Gagal mengambil detail konteks.'
        );
      }

      setSelectedKonteks(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil detail konteks.'
      );
    }
  };

  const handleTambah = () => {
    setFormData(createEmptyForm());
    setEditId(null);
    setSelectedKonteks(null);
    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleEdit = (item: KonteksItem) => {
    setEditId(item.id);
    setSelectedKonteks(null);
    setMessage('');
    setError('');

    setFormData({
      nama_instansi: item.nama_instansi || '',
      nama_upr: item.nama_upr || '',
      tugas_upr: item.tugas_upr || '',
      fungsi_upr: item.fungsi_upr || '',
      tahun_pelaksanaan:
        item.tahun_pelaksanaan === null ||
        item.tahun_pelaksanaan === undefined
          ? ''
          : String(item.tahun_pelaksanaan),
      sasaran_upr: item.sasaran_upr || '',
      indikator_kinerja: item.indikator_kinerja || '',
      target_kinerja: item.target_kinerja || '',
      sasaran_pembangunan_nasional:
        item.sasaran_pembangunan_nasional || '',
      pemilik_risiko: item.pemilik_risiko || '',
      koordinator_risiko: item.koordinator_risiko || '',
      pengelola_risiko: item.pengelola_risiko || '',
      besaran_selera_risiko:
        item.besaran_selera_risiko === null ||
        item.besaran_selera_risiko === undefined
          ? ''
          : String(item.besaran_selera_risiko),
    });

    setShowForm(true);
  };

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();

    try {
      setLoading(true);
      setMessage('');
      setError('');

      const token = sessionStorage.getItem('token');
      const isEdit = editId !== null;

      const response = await fetch(
        isEdit
          ? `http://localhost:5000/api/risiko/konteks/${editId}`
          : 'http://localhost:5000/api/risiko/konteks',
        {
          method: isEdit ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            tahun_pelaksanaan:
              Number(formData.tahun_pelaksanaan),
            besaran_selera_risiko:
              formData.besaran_selera_risiko === ''
                ? null
                : Number(formData.besaran_selera_risiko),
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            (isEdit
              ? 'Gagal memperbarui konteks.'
              : 'Gagal menyimpan konteks.')
        );
      }

      setMessage(
        isEdit
          ? 'Konteks risiko berhasil diperbarui.'
          : 'Konteks risiko berhasil disimpan.'
      );

      resetForm();
      await fetchKonteks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menyimpan konteks.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (item: KonteksItem) => {
    const confirmed = window.confirm(
      `Hapus penetapan konteks ${item.nama_upr || ''}?`
    );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/risiko/konteks/${item.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            result.message ||
            'Gagal menghapus konteks.'
        );
      }

      setMessage('Konteks risiko berhasil dihapus.');

      if (selectedKonteks?.id === item.id) {
        setSelectedKonteks(null);
      }

      if (editId === item.id) {
        resetForm();
      }

      await fetchKonteks();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus konteks.'
      );
    }
  };

  useEffect(() => {
    fetchKonteks();
  }, []);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Risiko
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 1 - Penetapan Konteks
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 1;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <button
                  type="button"
                  onClick={() => navigate(step.route)}
                  className="flex min-w-[120px] flex-col items-center text-center"
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
                    className={`mt-2 text-xs ${
                      active
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </button>

                {index < processSteps.length - 1 && (
                  <div className="mt-[18px] h-px flex-1 bg-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {message && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 0.0 - Penetapan Konteks
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Informasi dasar, struktur pelaksana, sasaran, dan selera risiko.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleTambah}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Tambah Data
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                {[
                  'No',
                  'Nama Instansi',
                  'Nama UPR',
                  'Tahun',
                  'Pemilik Risiko',
                  'Selera Risiko',
                  'Aksi',
                ].map((head) => (
                  <th
                    key={head}
                    className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {konteksList.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Belum ada data penetapan konteks.
                  </td>
                </tr>
              ) : (
                konteksList.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      {item.nama_instansi || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      {item.nama_upr || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.tahun_pelaksanaan || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      {item.pemilik_risiko || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.besaran_selera_risiko ?? '-'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            fetchDetailKonteks(item.id)
                          }
                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Detail
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => handleEdit(item)}
                            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editId
                    ? 'Edit Penetapan Konteks'
                    : 'Tambah Penetapan Konteks'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 0.0 Manajemen Risiko.
                </p>
              </div>

              <button
                type="button"
                onClick={resetForm}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-slate-800">
                  Informasi Umum
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Nama Instansi
                    </label>

                    <input
                      type="text"
                      name="nama_instansi"
                      value={formData.nama_instansi}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Nama UPR
                    </label>

                    <input
                      type="text"
                      name="nama_upr"
                      value={formData.nama_upr}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Tugas UPR
                    </label>

                    <textarea
                      name="tugas_upr"
                      value={formData.tugas_upr}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Fungsi UPR
                    </label>

                    <textarea
                      name="fungsi_upr"
                      value={formData.fungsi_upr}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Tahun Pelaksanaan
                    </label>

                    <input
                      type="number"
                      name="tahun_pelaksanaan"
                      value={formData.tahun_pelaksanaan}
                      onChange={handleChange}
                      required
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Sasaran Pembangunan Nasional dan Sasaran UPR
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Sasaran UPR
                    </label>

                    <textarea
                      name="sasaran_upr"
                      value={formData.sasaran_upr}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Indikator Kinerja
                    </label>

                    <textarea
                      name="indikator_kinerja"
                      value={formData.indikator_kinerja}
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Target Kinerja
                    </label>

                    <input
                      type="text"
                      name="target_kinerja"
                      value={formData.target_kinerja}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Sasaran Pembangunan Nasional
                    </label>

                    <textarea
                      name="sasaran_pembangunan_nasional"
                      value={
                        formData.sasaran_pembangunan_nasional
                      }
                      onChange={handleChange}
                      rows={3}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Struktur Pelaksana Manajemen Risiko
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Pemilik Risiko
                    </label>

                    <input
                      type="text"
                      name="pemilik_risiko"
                      value={formData.pemilik_risiko}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Koordinator Risiko
                    </label>

                    <input
                      type="text"
                      name="koordinator_risiko"
                      value={formData.koordinator_risiko}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Pengelola Risiko
                    </label>

                    <input
                      type="text"
                      name="pengelola_risiko"
                      value={formData.pengelola_risiko}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 pt-5">
                <h3 className="text-sm font-semibold text-slate-800">
                  Selera Risiko
                </h3>

                <div className="mt-4 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      Besaran Selera Risiko
                    </label>

                    <input
                      type="number"
                      name="besaran_selera_risiko"
                      value={formData.besaran_selera_risiko}
                      onChange={handleChange}
                      className={inputClass}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={loading}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading
                    ? 'Menyimpan...'
                    : editId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKonteks && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Detail Penetapan Konteks
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {selectedKonteks.nama_upr || '-'} -{' '}
                  {selectedKonteks.tahun_pelaksanaan || '-'}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedKonteks(null)
                }
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
              <DetailField
                label="Nama Instansi"
                value={selectedKonteks.nama_instansi}
              />

              <DetailField
                label="Nama UPR"
                value={selectedKonteks.nama_upr}
              />

              <DetailField
                label="Tahun Pelaksanaan"
                value={selectedKonteks.tahun_pelaksanaan}
              />

              <DetailField
                label="Tugas UPR"
                value={selectedKonteks.tugas_upr}
                full
              />

              <DetailField
                label="Fungsi UPR"
                value={selectedKonteks.fungsi_upr}
                full
              />

              <DetailField
                label="Sasaran UPR"
                value={selectedKonteks.sasaran_upr}
                full
              />

              <DetailField
                label="Indikator Kinerja"
                value={selectedKonteks.indikator_kinerja}
              />

              <DetailField
                label="Target Kinerja"
                value={selectedKonteks.target_kinerja}
              />

              <DetailField
                label="Sasaran Pembangunan Nasional"
                value={selectedKonteks.sasaran_pembangunan_nasional}
                full
              />

              <DetailField
                label="Pemilik Risiko"
                value={selectedKonteks.pemilik_risiko}
              />

              <DetailField
                label="Koordinator Risiko"
                value={selectedKonteks.koordinator_risiko}
              />

              <DetailField
                label="Pengelola Risiko"
                value={selectedKonteks.pengelola_risiko}
              />

              <DetailField
                label="Besaran Selera Risiko"
                value={selectedKonteks.besaran_selera_risiko}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type DetailFieldProps = {
  label: string;
  value:
    | string
    | number
    | null
    | undefined;
  full?: boolean;
};

const DetailField = ({
  label,
  value,
  full = false,
}: DetailFieldProps) => {
  return (
    <div
      className={
        full
          ? 'md:col-span-2'
          : ''
      }
    >
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </div>

      <div className="mt-1 whitespace-pre-wrap text-sm text-slate-800">
        {value === null ||
        value === undefined ||
        value === ''
          ? '-'
          : value}
      </div>
    </div>
  );
};
