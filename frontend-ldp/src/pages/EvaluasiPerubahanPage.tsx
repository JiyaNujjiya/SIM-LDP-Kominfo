import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type PerubahanItem = {
  id: number;
  kode_perubahan: string;
  detail_perubahan: string;
  klasifikasi: string;
  lingkup: string;
  status: string;
  nama_layanan?: string;
  nama_unit_pemohon?: string;
};

type ImplementasiItem = {
  id: number;
  perubahan_id: number;
  kode_perubahan?: string;
  detail_perubahan?: string;
  klasifikasi?: string;
  lingkup?: string;
  status?: string;
  tanggal_rencana_pelaksanaan?: string;
  jangka_waktu_pelaksanaan?: string;
  unit_pelaksana_id?: number;
  nama_unit_pelaksana?: string;
  pic_implementasi_id?: number;
  nama_pic_implementasi?: string;
};

type EvaluasiItem = {
  id: number;
  implementasi_id: number;
  perubahan_id: number;
  kode_perubahan: string;
  detail_perubahan: string;
  klasifikasi: string;
  lingkup: string;
  status: string;
  tanggal_evaluasi: string;
  ringkasan_tinjauan: string;
  isu_perbaikan?: string | null;
  pembelajaran: string;
  created_by: number;
  dibuat_oleh?: string;
  created_at?: string;
  updated_at?: string;
};

type EvaluasiForm = {
  tanggal_evaluasi: string;
  ringkasan_tinjauan: string;
  isu_perbaikan: string;
  pembelajaran: string;
};

const API = 'http://localhost:5000/api';

const initialForm: EvaluasiForm = {
  tanggal_evaluasi: '',
  ringkasan_tinjauan: '',
  isu_perbaikan: '',
  pembelajaran: '',
};

export default function EvaluasiPerubahanPage() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes('change.create');
  const canUpdate = permissions.includes('change.update');
  const canDelete = permissions.includes('change.delete');

  const [dataPerubahan, setDataPerubahan] = useState<PerubahanItem[]>([]);
  const [selectedPerubahan, setSelectedPerubahan] =
    useState<PerubahanItem | null>(null);

  const [implementasi, setImplementasi] =
    useState<ImplementasiItem | null>(null);

  const [evaluasi, setEvaluasi] = useState<EvaluasiItem[]>([]);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingEvaluasi, setEditingEvaluasi] =
    useState<EvaluasiItem | null>(null);

  const [form, setForm] = useState<EvaluasiForm>(initialForm);

  const request = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token = localStorage.getItem('token');

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || 'Terjadi kesalahan pada server.'
      );
    }

    return result;
  };

  const clearNotification = () => {
    setMessage('');
    setError('');
  };

  const fetchPerubahan = async () => {
    try {
      setLoading(true);
      setError('');

      const result = await request(`${API}/perubahan`);

      const rows = Array.isArray(result.data)
        ? result.data
        : [];

      setDataPerubahan(
        rows.filter(
            (item: PerubahanItem) =>
            item.status === 'Evaluasi' ||
            item.status === 'Selesai'
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil daftar perubahan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchImplementasi = async (
    perubahanId: number
  ): Promise<ImplementasiItem | null> => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/implementasi`
    );

    const item = result.data || null;

    setImplementasi(item);

    return item;
  };

  const fetchEvaluasi = async (implementasiId: number) => {
    const result = await request(
      `${API}/perubahan/implementasi/${implementasiId}/evaluasi`
    );

    setEvaluasi(
      Array.isArray(result.data) ? result.data : []
    );
  };

  const openDetail = async (item: PerubahanItem) => {
    try {
      clearNotification();
      setLoadingDetail(true);
      setSelectedPerubahan(item);
      setImplementasi(null);
      setEvaluasi([]);

      const dataImplementasi =
        await fetchImplementasi(item.id);

      if (dataImplementasi) {
        await fetchEvaluasi(dataImplementasi.id);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data evaluasi perubahan.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPerubahan();
  }, []);

  const filteredPerubahan = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return dataPerubahan;
    }

    return dataPerubahan.filter((item) => {
      return (
        item.kode_perubahan
          ?.toLowerCase()
          .includes(keyword) ||
        item.nama_layanan
          ?.toLowerCase()
          .includes(keyword) ||
        item.detail_perubahan
          ?.toLowerCase()
          .includes(keyword) ||
        item.klasifikasi
          ?.toLowerCase()
          .includes(keyword) ||
        item.lingkup
          ?.toLowerCase()
          .includes(keyword) ||
        item.status
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [dataPerubahan, search]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingEvaluasi(null);
  };

  const openTambahForm = () => {
    clearNotification();
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (item: EvaluasiItem) => {
    clearNotification();

    setEditingEvaluasi(item);

    setForm({
      tanggal_evaluasi:
        item.tanggal_evaluasi?.slice(0, 10) || '',
      ringkasan_tinjauan:
        item.ringkasan_tinjauan || '',
      isu_perbaikan:
        item.isu_perbaikan || '',
      pembelajaran:
        item.pembelajaran || '',
    });

    setShowForm(true);
  };

  const handleSave = async () => {
    if (!implementasi) {
      setError('Data implementasi belum tersedia.');
      return;
    }

    if (!form.tanggal_evaluasi) {
      setError('Tanggal evaluasi wajib diisi.');
      return;
    }

    if (!form.ringkasan_tinjauan.trim()) {
      setError('Ringkasan tinjauan wajib diisi.');
      return;
    }

    if (!form.pembelajaran.trim()) {
      setError(
        'Pembelajaran / lesson learned wajib diisi.'
      );
      return;
    }

    try {
      clearNotification();
      setSaving(true);

      const payload = {
        tanggal_evaluasi: form.tanggal_evaluasi,
        ringkasan_tinjauan:
          form.ringkasan_tinjauan.trim(),
        isu_perbaikan:
          form.isu_perbaikan.trim() || null,
        pembelajaran:
          form.pembelajaran.trim(),
      };

      const url = editingEvaluasi
        ? `${API}/perubahan/evaluasi/${editingEvaluasi.id}`
        : `${API}/perubahan/implementasi/${implementasi.id}/evaluasi`;

      const result = await request(url, {
        method: editingEvaluasi ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message ||
          'Evaluasi perubahan berhasil disimpan.'
      );

      setShowForm(false);
      resetForm();

      await fetchEvaluasi(implementasi.id);
      await fetchPerubahan();

      if (selectedPerubahan) {
        const refreshed = await request(
          `${API}/perubahan/${selectedPerubahan.id}`
        );

        if (refreshed.data) {
          setSelectedPerubahan(refreshed.data);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan evaluasi perubahan.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item: EvaluasiItem) => {
    if (!implementasi) return;

    const confirmed = window.confirm(
      `Hapus evaluasi tanggal ${formatDate(
        item.tanggal_evaluasi
      )}?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/evaluasi/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result.message ||
          'Evaluasi perubahan berhasil dihapus.'
      );

      await fetchEvaluasi(implementasi.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus evaluasi perubahan.'
      );
    }
  };

  const formatDate = (value?: string | null) => {
    if (!value) return '-';

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(date);
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Selesai') {
      return 'bg-green-100 text-green-700';
    }

    if (status === 'Evaluasi') {
      return 'bg-purple-100 text-purple-700';
    }

    if (status === 'Implementasi') {
      return 'bg-blue-100 text-blue-700';
    }

    return 'bg-gray-100 text-gray-700';
  };

  const processSteps = [
    {
      number: 1,
      label: 'Perencanaan',
      route: '/perubahan/perencanaan',
    },
    {
      number: 2,
      label: 'Analisis',
      route: '/perubahan/analisis',
    },
    {
      number: 3,
      label: 'Implementasi',
      route: '/perubahan/implementasi',
    },
    {
      number: 4,
      label: 'Evaluasi',
      route: '/perubahan/evaluasi',
    },
    {
      number: 5,
      label: 'Pencatatan / Logbook',
      route: '/perubahan/logbook',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Evaluasi Perubahan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Evaluasi pasca implementasi perubahan dan
          pencatatan pembelajaran untuk perbaikan
          berkelanjutan.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 4;
            const available = step.number <= 4;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-[110px] flex-col items-center text-center">
                  <button
                    type="button"
                    disabled={!available}
                    onClick={() => {
                      if (available) {
                        navigate(step.route);
                      }
                    }}
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                      active
                        ? 'border-slate-800 bg-slate-800 text-white'
                        : available
                          ? 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                          : 'cursor-default border-slate-200 bg-white text-slate-400'
                    }`}
                  >
                    {step.number}
                  </button>

                  <span
                    className={`mt-2 text-xs ${
                      active
                        ? 'font-semibold text-slate-800'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>

                {index <
                  processSteps.length - 1 && (
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

      {!selectedPerubahan ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Daftar Perubahan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pilih perubahan yang akan dilakukan
                evaluasi pasca implementasi.
              </p>
            </div>

            <input
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari perubahan..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:w-72"
            />
          </div>

          {loading ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Memuat data perubahan...
            </div>
          ) : filteredPerubahan.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              Tidak ada perubahan yang dapat
              dievaluasi.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="w-[17%] px-4 py-3 font-semibold">
                      ID Perubahan
                    </th>
                    <th className="w-[20%] px-4 py-3 font-semibold">
                      Layanan
                    </th>
                    <th className="w-[29%] px-4 py-3 font-semibold">
                      Detail Perubahan
                    </th>
                    <th className="w-[13%] px-4 py-3 font-semibold">
                      Klasifikasi
                    </th>
                    <th className="w-[11%] px-4 py-3 font-semibold">
                      Status
                    </th>
                    <th className="w-[10%] px-4 py-3 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredPerubahan.map((item) => (
                    <tr
                      key={item.id}
                      className="align-top hover:bg-slate-50"
                    >
                      <td className="break-words px-4 py-4 font-medium text-slate-800">
                        {item.kode_perubahan}
                      </td>

                      <td className="break-words px-4 py-4 text-slate-600">
                        {item.nama_layanan || '-'}
                      </td>

                      <td className="break-words px-4 py-4 text-slate-600">
                        {item.detail_perubahan}
                      </td>

                      <td className="px-4 py-4 text-slate-600">
                        {item.klasifikasi}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>

                      <td className="px-4 py-4 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            openDetail(item)
                          }
                          className="rounded-md bg-slate-800 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-700"
                        >
                          Buka
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={() => {
                clearNotification();
                setSelectedPerubahan(null);
                setImplementasi(null);
                setEvaluasi([]);
              }}
              className="w-fit rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>

            {canCreate && implementasi && (
              <button
                type="button"
                onClick={openTambahForm}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tambah Evaluasi
              </button>
            )}
          </div>

          <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  ID Perubahan
                </p>

                <h2 className="mt-1 text-xl font-bold text-slate-800">
                  {selectedPerubahan.kode_perubahan}
                </h2>

                <p className="mt-2 max-w-4xl text-sm leading-6 text-slate-600">
                  {selectedPerubahan.detail_perubahan}
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-3 py-1 text-xs font-semibold ${getStatusStyle(
                  selectedPerubahan.status
                )}`}
              >
                {selectedPerubahan.status}
              </span>
            </div>

            <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-slate-500">
                  Layanan
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.nama_layanan ||
                    '-'}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Klasifikasi
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.klasifikasi}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Lingkup
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.lingkup}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Unit Pemohon
                </p>
                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerubahan.nama_unit_pemohon ||
                    '-'}
                </p>
              </div>
            </div>
          </div>

          {loadingDetail ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Memuat evaluasi perubahan...
            </div>
          ) : !implementasi ? (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-sm text-amber-700">
              Data implementasi perubahan belum
              tersedia.
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800">
                  Informasi Implementasi
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Tanggal Pelaksanaan
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formatDate(
                        implementasi.tanggal_rencana_pelaksanaan
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Jangka Waktu
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {implementasi.jangka_waktu_pelaksanaan ||
                        '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Unit Pelaksana
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {implementasi.nama_unit_pelaksana ||
                        '-'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      PIC Implementasi
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {implementasi.nama_pic_implementasi ||
                        '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Evaluasi Pasca Implementasi
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Catat hasil tinjauan, isu
                    perbaikan, dan pembelajaran dari
                    pelaksanaan perubahan.
                  </p>
                </div>

                {evaluasi.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-500">
                      Belum ada evaluasi untuk
                      perubahan ini.
                    </p>

                    {canCreate && (
                      <button
                        type="button"
                        onClick={openTambahForm}
                        className="mt-4 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        Tambah Evaluasi
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {evaluasi.map((item, index) => (
                      <div
                        key={item.id}
                        className="p-5"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Evaluasi {index + 1}
                            </p>

                            <h4 className="mt-1 text-base font-semibold text-slate-800">
                              {formatDate(
                                item.tanggal_evaluasi
                              )}
                            </h4>

                            {item.dibuat_oleh && (
                              <p className="mt-1 text-xs text-slate-500">
                                Dibuat oleh{' '}
                                {item.dibuat_oleh}
                              </p>
                            )}
                          </div>

                          {(canUpdate ||
                            canDelete) && (
                            <div className="flex gap-2">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openEditForm(
                                      item
                                    )
                                  }
                                  className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Edit
                                </button>
                              )}

                              {canDelete && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleDelete(
                                      item
                                    )
                                  }
                                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-5 grid gap-5 lg:grid-cols-2">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Ringkasan Tinjauan
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {item.ringkasan_tinjauan}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Isu Perbaikan
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {item.isu_perbaikan ||
                                'Tidak ada isu perbaikan yang dicatat.'}
                            </p>
                          </div>

                          <div className="lg:col-span-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                              Pembelajaran / Lesson
                              Learned
                            </p>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                              {item.pembelajaran}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingEvaluasi
                  ? 'Edit Evaluasi'
                  : 'Tambah Evaluasi'}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Evaluasi pasca implementasi perubahan.
              </p>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tanggal Evaluasi
                </label>

                <input
                  type="date"
                  value={form.tanggal_evaluasi}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      tanggal_evaluasi:
                        event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Ringkasan Tinjauan
                </label>

                <textarea
                  rows={5}
                  value={form.ringkasan_tinjauan}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      ringkasan_tinjauan:
                        event.target.value,
                    }))
                  }
                  placeholder="Tuliskan ringkasan hasil tinjauan terhadap pelaksanaan perubahan..."
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Isu Perbaikan
                </label>

                <textarea
                  rows={4}
                  value={form.isu_perbaikan}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      isu_perbaikan:
                        event.target.value,
                    }))
                  }
                  placeholder="Tuliskan isu atau bagian yang masih perlu diperbaiki, jika ada..."
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />

                <p className="mt-1 text-xs text-slate-400">
                  Opsional.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Pembelajaran / Lesson Learned
                </label>

                <textarea
                  rows={5}
                  value={form.pembelajaran}
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      pembelajaran:
                        event.target.value,
                    }))
                  }
                  placeholder="Tuliskan pembelajaran yang dapat digunakan untuk perubahan berikutnya..."
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSave}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}