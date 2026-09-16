import { useEffect, useMemo, useState } from "react";

type PerencanaanItem = {
  id: number;
  instansi_id: number;
  nama_instansi: string;
  tahun_perencanaan: number;
  status: string;
};

type IndikatorItem = {
  id: number;
  perencanaan_id: number;
  kode_indikator:
    | "CAKUPAN_DOKUMENTASI"
    | "KESESUAIAN_PENGGUNA";
  nilai_saat_ini: number;
  nilai_target: number;
};

type EvaluasiItem = {
  id: number;
  indikator_perencanaan_id: number;
  perencanaan_id: number;
  kode_indikator:
    | "CAKUPAN_DOKUMENTASI"
    | "KESESUAIAN_PENGGUNA";
  nilai_saat_ini: number;
  nilai_target: number;
  tanggal_evaluasi: string;
  nilai_realisasi: number;
  analisis: string | null;
  tindak_lanjut: string | null;
  pelaksana_terkait: string;
  created_by: number;
  pembuat: string;
  created_at: string;
  updated_at: string;
};

const API = "http://localhost:5000/api";

const indikatorLabels: Record<
  IndikatorItem["kode_indikator"],
  string
> = {
  CAKUPAN_DOKUMENTASI:
    "Persentase layanan yang telah memiliki pengetahuan terdokumentasi",
  KESESUAIAN_PENGGUNA:
    "Kesesuaian pengetahuan dengan kebutuhan pengguna layanan",
};

export default function EvaluasiPengetahuanPage() {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes("knowledge.create");
  const canUpdate = permissions.includes("knowledge.update");
  const canDelete = permissions.includes("knowledge.delete");

  const [perencanaan, setPerencanaan] = useState<
    PerencanaanItem[]
  >([]);
  const [indikator, setIndikator] = useState<
    IndikatorItem[]
  >([]);
  const [evaluasi, setEvaluasi] = useState<
    EvaluasiItem[]
  >([]);

  const [selectedPerencanaanId, setSelectedPerencanaanId] =
    useState("");

  const [loading, setLoading] = useState(true);
  const [loadingIndikator, setLoadingIndikator] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] =
    useState<EvaluasiItem | null>(null);

  const [form, setForm] = useState({
    indikator_perencanaan_id: "",
    tanggal_evaluasi: "",
    nilai_realisasi: "",
    analisis: "",
    tindak_lanjut: "",
    pelaksana_terkait: "",
  });

  const getToken = () => sessionStorage.getItem("token");

  const request = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    });

    let result: any = null;

    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (!response.ok) {
      throw new Error(
        result?.message ||
          result?.error ||
          "Terjadi kesalahan saat memproses permintaan."
      );
    }

    return result;
  };

  const clearNotification = () => {
    setMessage("");
    setError("");
  };

  const fetchPerencanaan = async () => {
    try {
      const result = await request(
        `${API}/pengetahuan/perencanaan`
      );

      const rows = Array.isArray(result?.data)
        ? result.data
        : [];

      setPerencanaan(rows);

      if (
        rows.length > 0 &&
        !selectedPerencanaanId
      ) {
        setSelectedPerencanaanId(
          String(rows[0].id)
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data perencanaan."
      );
    }
  };

  const fetchEvaluasi = async () => {
    try {
      const result = await request(
        `${API}/pengetahuan/evaluasi`
      );

      setEvaluasi(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data evaluasi."
      );
    }
  };

  const fetchIndikator = async (
    perencanaanId: string
  ) => {
    if (!perencanaanId) {
      setIndikator([]);
      return;
    }

    try {
      setLoadingIndikator(true);

      const result = await request(
        `${API}/pengetahuan/perencanaan/${perencanaanId}/indikator`
      );

      setIndikator(
        Array.isArray(result?.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil indikator perencanaan."
      );
    } finally {
      setLoadingIndikator(false);
    }
  };

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        fetchPerencanaan(),
        fetchEvaluasi(),
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPerencanaanId) {
      fetchIndikator(selectedPerencanaanId);
    }
  }, [selectedPerencanaanId]);

  const selectedPerencanaan =
    perencanaan.find(
      (item) =>
        Number(item.id) ===
        Number(selectedPerencanaanId)
    );

  const filteredEvaluasi = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    let rows = evaluasi;

    if (selectedPerencanaanId) {
      rows = rows.filter(
        (item) =>
          Number(item.perencanaan_id) ===
          Number(selectedPerencanaanId)
      );
    }

    if (!keyword) return rows;

    return rows.filter((item) =>
      [
        indikatorLabels[item.kode_indikator],
        item.kode_indikator,
        item.tanggal_evaluasi,
        item.nilai_target,
        item.nilai_realisasi,
        item.analisis,
        item.tindak_lanjut,
        item.pelaksana_terkait,
        item.pembuat,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value)
            .toLowerCase()
            .includes(keyword)
        )
    );
  }, [
    evaluasi,
    search,
    selectedPerencanaanId,
  ]);

  const resetForm = () => {
    setEditingItem(null);

    setForm({
      indikator_perencanaan_id: "",
      tanggal_evaluasi: "",
      nilai_realisasi: "",
      analisis: "",
      tindak_lanjut: "",
      pelaksana_terkait: "",
    });
  };

  const handleTambah = () => {
    clearNotification();
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item: EvaluasiItem) => {
    clearNotification();

    setEditingItem(item);

    setForm({
      indikator_perencanaan_id: String(
        item.indikator_perencanaan_id
      ),
      tanggal_evaluasi:
        item.tanggal_evaluasi,
      nilai_realisasi: String(
        item.nilai_realisasi
      ),
      analisis: item.analisis || "",
      tindak_lanjut:
        item.tindak_lanjut || "",
      pelaksana_terkait:
        item.pelaksana_terkait,
    });

    setShowForm(true);
  };

  const selectedIndikator = indikator.find(
    (item) =>
      Number(item.id) ===
      Number(form.indikator_perencanaan_id)
  );

  const nilaiRealisasi =
    form.nilai_realisasi !== ""
      ? Number(form.nilai_realisasi)
      : null;

  const gap =
    selectedIndikator &&
    nilaiRealisasi !== null
      ? Number(
          (
            nilaiRealisasi -
            Number(selectedIndikator.nilai_target)
          ).toFixed(2)
        )
      : null;

  const handleSave = async () => {
    try {
      clearNotification();

      if (!form.indikator_perencanaan_id) {
        setError(
          "Indikator perencanaan wajib dipilih."
        );
        return;
      }

      if (!form.tanggal_evaluasi) {
        setError(
          "Tanggal evaluasi wajib diisi."
        );
        return;
      }

      if (form.nilai_realisasi === "") {
        setError(
          "Nilai realisasi wajib diisi."
        );
        return;
      }

      const realisasi = Number(
        form.nilai_realisasi
      );

      if (
        !Number.isFinite(realisasi) ||
        realisasi < 0 ||
        realisasi > 100
      ) {
        setError(
          "Nilai realisasi harus berada antara 0 sampai 100."
        );
        return;
      }

      if (!form.pelaksana_terkait.trim()) {
        setError(
          "Pelaksana terkait wajib diisi."
        );
        return;
      }

      if (
        form.pelaksana_terkait.trim()
          .length > 255
      ) {
        setError(
          "Pelaksana terkait maksimal 255 karakter."
        );
        return;
      }

      setSaving(true);

      const payload = {
        indikator_perencanaan_id: Number(
          form.indikator_perencanaan_id
        ),
        tanggal_evaluasi:
          form.tanggal_evaluasi,
        nilai_realisasi: realisasi,
        analisis:
          form.analisis.trim() || null,
        tindak_lanjut:
          form.tindak_lanjut.trim() || null,
        pelaksana_terkait:
          form.pelaksana_terkait.trim(),
      };

      const url = editingItem
        ? `${API}/pengetahuan/evaluasi/${editingItem.id}`
        : `${API}/pengetahuan/evaluasi`;

      const result = await request(url, {
        method: editingItem
          ? "PUT"
          : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        result?.message ||
          "Data evaluasi berhasil disimpan."
      );

      setShowForm(false);
      resetForm();

      await fetchEvaluasi();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data evaluasi."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    item: EvaluasiItem
  ) => {
    const confirmed = window.confirm(
      `Hapus evaluasi "${
        indikatorLabels[item.kode_indikator]
      }"?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/pengetahuan/evaluasi/${item.id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        result?.message ||
          "Data evaluasi berhasil dihapus."
      );

      await fetchEvaluasi();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data evaluasi."
      );
    }
  };

  const getGap = (
    target: number,
    realisasi: number
  ) => {
    if (Number(realisasi) >= Number(target)) {
      return "-";
    }

    return Number(
      (
        Number(realisasi) -
        Number(target)
      ).toFixed(2)
    );
  };

  const processSteps = [
    {
      number: 1,
      label: "Perencanaan",
    },
    {
      number: 2,
      label: "Pengumpulan & Pengolahan",
    },
    {
      number: 3,
      label: "Pemanfaatan & Alih Pengetahuan",
    },
    {
      number: 4,
      label: "Evaluasi",
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          MPN04 - Evaluasi
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Evaluasi pencapaian indikator
          Manajemen Pengetahuan terhadap target
          perencanaan.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 4;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-[130px] flex-col items-center text-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                      active
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {step.number}
                  </div>

                  <span
                    className={`mt-2 text-xs ${
                      active
                        ? "font-semibold text-slate-800"
                        : "text-slate-500"
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

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Formulir 4 - Evaluasi
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Perbandingan target perencanaan
                dengan realisasi indikator.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={handleTambah}
                disabled={!selectedPerencanaanId}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Tambah Evaluasi
              </button>
            )}
          </div>
        </div>

        <div className="p-5">
          <div className="mb-5 grid gap-4 lg:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Perencanaan Pengetahuan
              </label>

              <select
                value={selectedPerencanaanId}
                onChange={(e) =>
                  setSelectedPerencanaanId(
                    e.target.value
                  )
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
              >
                <option value="">
                  Pilih perencanaan
                </option>

                {perencanaan.map((item) => (
                  <option
                    key={item.id}
                    value={item.id}
                  >
                    {item.nama_instansi} -{" "}
                    {item.tahun_perencanaan} -{" "}
                    {item.status}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Pencarian
              </label>

              <input
                type="text"
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
                placeholder="Cari indikator, analisis, tindak lanjut, atau pelaksana..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
              />
            </div>
          </div>

          {selectedPerencanaan && (
            <div className="mb-5 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
              {selectedPerencanaan.nama_instansi} •{" "}
              {selectedPerencanaan.tahun_perencanaan} •{" "}
              {selectedPerencanaan.status}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1350px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-3 py-3 font-semibold">
                    No
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Indikator Manajemen Pengetahuan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Target Perencanaan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Realisasi
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Gap
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Analisis
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Tindak Lanjut
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Pelaksana Terkait
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Tanggal Evaluasi
                  </th>
                  <th className="px-3 py-3 text-center font-semibold">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredEvaluasi.length ===
                  0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Belum ada data evaluasi.
                    </td>
                  </tr>
                ) : (
                  filteredEvaluasi.map(
                    (item, index) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 align-top hover:bg-slate-50"
                      >
                        <td className="px-3 py-3">
                          {index + 1}
                        </td>

                        <td className="max-w-[280px] px-3 py-3">
                          {
                            indikatorLabels[
                              item.kode_indikator
                            ]
                          }
                        </td>

                        <td className="px-3 py-3">
                          {item.nilai_target}
                        </td>

                        <td className="px-3 py-3">
                          {item.nilai_realisasi}
                        </td>

                        <td className="px-3 py-3">
                          {getGap(
                            item.nilai_target,
                            item.nilai_realisasi
                          )}
                        </td>

                        <td className="max-w-[280px] px-3 py-3">
                          {item.analisis || "-"}
                        </td>

                        <td className="max-w-[280px] px-3 py-3">
                          {item.tindak_lanjut ||
                            "-"}
                        </td>

                        <td className="px-3 py-3">
                          {
                            item.pelaksana_terkait
                          }
                        </td>

                        <td className="px-3 py-3">
                          {item.tanggal_evaluasi}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-2">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(item)
                                }
                                className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                              >
                                Edit
                              </button>
                            )}

                            {canDelete && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleDelete(item)
                                }
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingItem
                  ? "Edit Evaluasi"
                  : "Tambah Evaluasi"}
              </h3>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Indikator Manajemen Pengetahuan
                </label>

                <select
                  value={
                    form.indikator_perencanaan_id
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      indikator_perencanaan_id:
                        e.target.value,
                    })
                  }
                  disabled={loadingIndikator}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Pilih indikator
                  </option>

                  {indikator.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {
                        indikatorLabels[
                          item.kode_indikator
                        ]
                      }{" "}
                      - Target {item.nilai_target}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Target Perencanaan
                </label>

                <input
                  type="text"
                  value={
                    selectedIndikator
                      ? selectedIndikator.nilai_target
                      : ""
                  }
                  disabled
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tanggal Evaluasi
                </label>

                <input
                  type="date"
                  value={form.tanggal_evaluasi}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tanggal_evaluasi:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Realisasi
                </label>

                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={form.nilai_realisasi}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nilai_realisasi:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Gap
                </label>

                <input
                  type="text"
                  value={
                    gap === null
                      ? ""
                      : gap >= 0
                        ? "-"
                        : gap
                  }
                  disabled
                  className="w-full rounded-md border border-slate-200 bg-slate-100 px-3 py-2 text-sm text-slate-600"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Analisis
                </label>

                <textarea
                  rows={4}
                  value={form.analisis}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      analisis:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tindak Lanjut
                </label>

                <textarea
                  rows={4}
                  value={form.tindak_lanjut}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tindak_lanjut:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pelaksana Terkait
                </label>

                <input
                  type="text"
                  value={
                    form.pelaksana_terkait
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pelaksana_terkait:
                        e.target.value,
                    })
                  }
                  maxLength={255}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}