import { useEffect, useMemo, useState } from "react";

type PengetahuanOption = {
  id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  layanan_id: number;
  nama_layanan: string;
};

type UnitOption = {
  id: number;
  instansi_id: number;
  kode_unit: string;
  nama_unit: string;
};

type PemanfaatanItem = {
  id: number;
  pengetahuan_id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  tanggal_pemanfaatan: string;
  jenis_pengguna: "Publik" | "Internal";
  unit_pengguna_id: number | null;
  unit_pengguna: string | null;
  tujuan_pemanfaatan: string;
  rating_pengetahuan: number | null;
  created_by: number;
  pembuat: string;
  created_at: string;
  updated_at: string;
};

type MetodeAlih = {
  id?: number;
  metode:
    | "Pelatihan"
    | "Workshop"
    | "Sosialisasi"
    | "Mentoring"
    | "Sharing"
    | "Lainnya";
  keterangan?: string | null;
};

type AlihPengetahuanItem = {
  id: number;
  pengetahuan_id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  tanggal_kegiatan: string;
  penerima_pengetahuan: string;
  lesson_learned_evaluasi: string | null;
  created_by: number;
  pembuat: string;
  metode_alih: MetodeAlih[];
  created_at: string;
  updated_at: string;
};

const API = "http://localhost:5000/api";

const metodeOptions: MetodeAlih["metode"][] = [
  "Pelatihan",
  "Workshop",
  "Sosialisasi",
  "Mentoring",
  "Sharing",
  "Lainnya",
];

export default function PemanfaatanAlihPengetahuanPage() {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes("knowledge.create");
  const canUpdate = permissions.includes("knowledge.update");
  const canDelete = permissions.includes("knowledge.delete");

  const [pengetahuanOptions, setPengetahuanOptions] = useState<
    PengetahuanOption[]
  >([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);

  const [pemanfaatan, setPemanfaatan] = useState<PemanfaatanItem[]>([]);
  const [alihPengetahuan, setAlihPengetahuan] = useState<
    AlihPengetahuanItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [searchPemanfaatan, setSearchPemanfaatan] = useState("");
  const [searchAlih, setSearchAlih] = useState("");

  const [showPemanfaatanForm, setShowPemanfaatanForm] =
    useState(false);
  const [showAlihForm, setShowAlihForm] = useState(false);

  const [editingPemanfaatan, setEditingPemanfaatan] =
    useState<PemanfaatanItem | null>(null);
  const [editingAlih, setEditingAlih] =
    useState<AlihPengetahuanItem | null>(null);

  const [pemanfaatanForm, setPemanfaatanForm] = useState({
    pengetahuan_id: "",
    tanggal_pemanfaatan: "",
    jenis_pengguna: "Internal" as "Publik" | "Internal",
    unit_pengguna_id: "",
    tujuan_pemanfaatan: "",
    rating_pengetahuan: "",
  });

  const [alihForm, setAlihForm] = useState({
    pengetahuan_id: "",
    tanggal_kegiatan: "",
    penerima_pengetahuan: "",
    lesson_learned_evaluasi: "",
  });

  const [selectedMetode, setSelectedMetode] = useState<
    MetodeAlih["metode"][]
  >([]);

  const [keteranganLainnya, setKeteranganLainnya] = useState("");

  const getToken = () => localStorage.getItem("token");

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

  const fetchData = async () => {
    try {
      setLoading(true);

      const [
        pengetahuanResult,
        unitResult,
        pemanfaatanResult,
        alihResult,
      ] = await Promise.all([
        request(`${API}/pengetahuan/pengetahuan-options`),
        request(`${API}/pengetahuan/unit-options`),
        request(`${API}/pengetahuan/pemanfaatan`),
        request(`${API}/pengetahuan/alih-pengetahuan`),
      ]);

      setPengetahuanOptions(
        Array.isArray(pengetahuanResult?.data)
          ? pengetahuanResult.data
          : []
      );

      setUnitOptions(
        Array.isArray(unitResult?.data)
          ? unitResult.data
          : []
      );

      setPemanfaatan(
        Array.isArray(pemanfaatanResult?.data)
          ? pemanfaatanResult.data
          : []
      );

      setAlihPengetahuan(
        Array.isArray(alihResult?.data)
          ? alihResult.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data MPN03."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredPemanfaatan = useMemo(() => {
    const keyword = searchPemanfaatan.trim().toLowerCase();

    if (!keyword) return pemanfaatan;

    return pemanfaatan.filter((item) =>
      [
        item.kode_pengetahuan,
        item.nama_pengetahuan,
        item.tanggal_pemanfaatan,
        item.jenis_pengguna,
        item.unit_pengguna,
        item.tujuan_pemanfaatan,
        item.rating_pengetahuan,
        item.pembuat,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        )
    );
  }, [pemanfaatan, searchPemanfaatan]);

  const filteredAlih = useMemo(() => {
    const keyword = searchAlih.trim().toLowerCase();

    if (!keyword) return alihPengetahuan;

    return alihPengetahuan.filter((item) =>
      [
        item.kode_pengetahuan,
        item.nama_pengetahuan,
        item.tanggal_kegiatan,
        item.penerima_pengetahuan,
        item.lesson_learned_evaluasi,
        item.pembuat,
        ...(item.metode_alih || []).map(
          (metode) => metode.metode
        ),
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        )
    );
  }, [alihPengetahuan, searchAlih]);

  const resetPemanfaatanForm = () => {
    setEditingPemanfaatan(null);

    setPemanfaatanForm({
      pengetahuan_id: "",
      tanggal_pemanfaatan: "",
      jenis_pengguna: "Internal",
      unit_pengguna_id: "",
      tujuan_pemanfaatan: "",
      rating_pengetahuan: "",
    });
  };

  const resetAlihForm = () => {
    setEditingAlih(null);

    setAlihForm({
      pengetahuan_id: "",
      tanggal_kegiatan: "",
      penerima_pengetahuan: "",
      lesson_learned_evaluasi: "",
    });

    setSelectedMetode([]);
    setKeteranganLainnya("");
  };

  const openTambahPemanfaatan = () => {
    clearNotification();
    resetPemanfaatanForm();
    setShowPemanfaatanForm(true);
  };

  const openEditPemanfaatan = (item: PemanfaatanItem) => {
    clearNotification();

    setEditingPemanfaatan(item);

    setPemanfaatanForm({
      pengetahuan_id: String(item.pengetahuan_id),
      tanggal_pemanfaatan: item.tanggal_pemanfaatan,
      jenis_pengguna: item.jenis_pengguna,
      unit_pengguna_id: item.unit_pengguna_id
        ? String(item.unit_pengguna_id)
        : "",
      tujuan_pemanfaatan: item.tujuan_pemanfaatan,
      rating_pengetahuan: item.rating_pengetahuan
        ? String(item.rating_pengetahuan)
        : "",
    });

    setShowPemanfaatanForm(true);
  };

  const handleSavePemanfaatan = async () => {
    try {
      clearNotification();

      if (!pemanfaatanForm.pengetahuan_id) {
        setError("Pengetahuan wajib dipilih.");
        return;
      }

      if (!pemanfaatanForm.tanggal_pemanfaatan) {
        setError("Tanggal pemanfaatan wajib diisi.");
        return;
      }

      if (!pemanfaatanForm.tujuan_pemanfaatan.trim()) {
        setError("Tujuan pemanfaatan wajib diisi.");
        return;
      }

      if (
        pemanfaatanForm.rating_pengetahuan &&
        (Number(pemanfaatanForm.rating_pengetahuan) < 1 ||
          Number(pemanfaatanForm.rating_pengetahuan) > 5)
      ) {
        setError("Rating pengetahuan harus bernilai 1 sampai 5.");
        return;
      }

      setSaving(true);

      const payload = {
        pengetahuan_id: Number(
          pemanfaatanForm.pengetahuan_id
        ),
        tanggal_pemanfaatan:
          pemanfaatanForm.tanggal_pemanfaatan,
        jenis_pengguna:
          pemanfaatanForm.jenis_pengguna,
        unit_pengguna_id:
          pemanfaatanForm.unit_pengguna_id
            ? Number(pemanfaatanForm.unit_pengguna_id)
            : null,
        tujuan_pemanfaatan:
          pemanfaatanForm.tujuan_pemanfaatan.trim(),
        rating_pengetahuan:
          pemanfaatanForm.rating_pengetahuan
            ? Number(pemanfaatanForm.rating_pengetahuan)
            : null,
      };

      const url = editingPemanfaatan
        ? `${API}/pengetahuan/pemanfaatan/${editingPemanfaatan.id}`
        : `${API}/pengetahuan/pemanfaatan`;

      const result = await request(url, {
        method: editingPemanfaatan ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        result?.message ||
          "Data pemanfaatan pengetahuan berhasil disimpan."
      );

      setShowPemanfaatanForm(false);
      resetPemanfaatanForm();

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data pemanfaatan."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePemanfaatan = async (
    item: PemanfaatanItem
  ) => {
    const confirmed = window.confirm(
      `Hapus data pemanfaatan "${item.nama_pengetahuan}"?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/pengetahuan/pemanfaatan/${item.id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        result?.message ||
          "Data pemanfaatan pengetahuan berhasil dihapus."
      );

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data pemanfaatan."
      );
    }
  };

  const openTambahAlih = () => {
    clearNotification();
    resetAlihForm();
    setShowAlihForm(true);
  };

  const openEditAlih = (item: AlihPengetahuanItem) => {
    clearNotification();

    setEditingAlih(item);

    setAlihForm({
      pengetahuan_id: String(item.pengetahuan_id),
      tanggal_kegiatan: item.tanggal_kegiatan,
      penerima_pengetahuan: item.penerima_pengetahuan,
      lesson_learned_evaluasi:
        item.lesson_learned_evaluasi || "",
    });

    const metode =
      item.metode_alih?.map((value) => value.metode) || [];

    setSelectedMetode(metode);

    const lainnya = item.metode_alih?.find(
      (value) => value.metode === "Lainnya"
    );

    setKeteranganLainnya(lainnya?.keterangan || "");

    setShowAlihForm(true);
  };

  const toggleMetode = (metode: MetodeAlih["metode"]) => {
    setSelectedMetode((current) => {
      if (current.includes(metode)) {
        return current.filter((item) => item !== metode);
      }

      return [...current, metode];
    });

    if (
      metode === "Lainnya" &&
      selectedMetode.includes("Lainnya")
    ) {
      setKeteranganLainnya("");
    }
  };

  const handleSaveAlih = async () => {
    try {
      clearNotification();

      if (!alihForm.pengetahuan_id) {
        setError("Pengetahuan wajib dipilih.");
        return;
      }

      if (!alihForm.tanggal_kegiatan) {
        setError("Tanggal kegiatan wajib diisi.");
        return;
      }

      if (!alihForm.penerima_pengetahuan.trim()) {
        setError("Penerima pengetahuan wajib diisi.");
        return;
      }

      if (alihForm.penerima_pengetahuan.trim().length > 255) {
        setError(
          "Penerima pengetahuan maksimal 255 karakter."
        );
        return;
      }

      if (
        selectedMetode.includes("Lainnya") &&
        !keteranganLainnya.trim()
      ) {
        setError(
          "Keterangan metode lainnya wajib diisi."
        );
        return;
      }

      setSaving(true);

      const metode_alih = selectedMetode.map((metode) => ({
        metode,
        keterangan:
          metode === "Lainnya"
            ? keteranganLainnya.trim()
            : null,
      }));

      const payload = {
        pengetahuan_id: Number(alihForm.pengetahuan_id),
        tanggal_kegiatan: alihForm.tanggal_kegiatan,
        penerima_pengetahuan:
          alihForm.penerima_pengetahuan.trim(),
        lesson_learned_evaluasi:
          alihForm.lesson_learned_evaluasi.trim() ||
          null,
        metode_alih,
      };

      const url = editingAlih
        ? `${API}/pengetahuan/alih-pengetahuan/${editingAlih.id}`
        : `${API}/pengetahuan/alih-pengetahuan`;

      const result = await request(url, {
        method: editingAlih ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        result?.message ||
          "Data alih pengetahuan berhasil disimpan."
      );

      setShowAlihForm(false);
      resetAlihForm();

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data alih pengetahuan."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAlih = async (
    item: AlihPengetahuanItem
  ) => {
    const confirmed = window.confirm(
      `Hapus kegiatan alih pengetahuan "${item.nama_pengetahuan}"?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/pengetahuan/alih-pengetahuan/${item.id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        result?.message ||
          "Data alih pengetahuan berhasil dihapus."
      );

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data alih pengetahuan."
      );
    }
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
          MPN03 - Pemanfaatan & Alih Pengetahuan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Pemanfaatan pengetahuan dan pelaksanaan alih
          pengetahuan Layanan Digital Pemerintah.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 3;

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

      <div className="mb-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 3.1 - Pemanfaatan Pengetahuan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pencatatan penggunaan pengetahuan oleh pengguna
              publik maupun internal.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openTambahPemanfaatan}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Tambah Pemanfaatan
            </button>
          )}
        </div>

        <div className="p-5">
          <input
            type="text"
            value={searchPemanfaatan}
            onChange={(e) =>
              setSearchPemanfaatan(e.target.value)
            }
            placeholder="Cari pengetahuan, pengguna, unit, atau tujuan..."
            className="mb-5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-lg"
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-3 py-3 font-semibold">
                    No
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    ID Pengetahuan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Nama Pengetahuan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Tanggal Pemanfaatan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Akses
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Unit Pengguna
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Tujuan Pemanfaatan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Rating
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Dibuat Oleh
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
                ) : filteredPemanfaatan.length === 0 ? (
                  <tr>
                    <td
                      colSpan={10}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Belum ada data pemanfaatan pengetahuan.
                    </td>
                  </tr>
                ) : (
                  filteredPemanfaatan.map((item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 align-top hover:bg-slate-50"
                    >
                      <td className="px-3 py-3">
                        {index + 1}
                      </td>

                      <td className="px-3 py-3 font-medium text-slate-800">
                        {item.kode_pengetahuan}
                      </td>

                      <td className="px-3 py-3">
                        {item.nama_pengetahuan}
                      </td>

                      <td className="px-3 py-3">
                        {item.tanggal_pemanfaatan}
                      </td>

                      <td className="px-3 py-3">
                        {item.jenis_pengguna}
                      </td>

                      <td className="px-3 py-3">
                        {item.unit_pengguna || "-"}
                      </td>

                      <td className="max-w-[280px] px-3 py-3">
                        {item.tujuan_pemanfaatan}
                      </td>

                      <td className="px-3 py-3">
                        {item.rating_pengetahuan || "-"}
                      </td>

                      <td className="px-3 py-3">
                        {item.pembuat}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex justify-center gap-2">
                          {canUpdate && (
                            <button
                              type="button"
                              onClick={() =>
                                openEditPemanfaatan(item)
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
                                handleDeletePemanfaatan(item)
                              }
                              className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
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
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 3.2 - Alih Pengetahuan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pencatatan kegiatan transfer dan berbagi
              pengetahuan kepada pihak penerima.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={openTambahAlih}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Tambah Alih Pengetahuan
            </button>
          )}
        </div>

        <div className="p-5">
          <input
            type="text"
            value={searchAlih}
            onChange={(e) => setSearchAlih(e.target.value)}
            placeholder="Cari pengetahuan, penerima, metode, atau lesson learned..."
            className="mb-5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-lg"
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1300px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-3 py-3 font-semibold">
                    No
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    ID Pengetahuan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Nama Pengetahuan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Tanggal Kegiatan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Pelatihan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Workshop
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Sosialisasi
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Mentoring
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Sharing
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Lainnya
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Penerima Pengetahuan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Lesson Learned / Evaluasi
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
                      colSpan={13}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredAlih.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Belum ada data alih pengetahuan.
                    </td>
                  </tr>
                ) : (
                  filteredAlih.map((item, index) => {
                    const hasMetode = (
                      metode: MetodeAlih["metode"]
                    ) =>
                      item.metode_alih?.some(
                        (value) => value.metode === metode
                      );

                    const lainnya = item.metode_alih?.find(
                      (value) => value.metode === "Lainnya"
                    );

                    return (
                      <tr
                        key={item.id}
                        className="border-b border-slate-100 align-top hover:bg-slate-50"
                      >
                        <td className="px-3 py-3">
                          {index + 1}
                        </td>

                        <td className="px-3 py-3 font-medium text-slate-800">
                          {item.kode_pengetahuan}
                        </td>

                        <td className="px-3 py-3">
                          {item.nama_pengetahuan}
                        </td>

                        <td className="px-3 py-3">
                          {item.tanggal_kegiatan}
                        </td>

                        {[
                          "Pelatihan",
                          "Workshop",
                          "Sosialisasi",
                          "Mentoring",
                          "Sharing",
                        ].map((metode) => (
                          <td
                            key={metode}
                            className="px-3 py-3 text-center"
                          >
                            {hasMetode(
                              metode as MetodeAlih["metode"]
                            )
                              ? "✓"
                              : "-"}
                          </td>
                        ))}

                        <td className="px-3 py-3">
                          {hasMetode("Lainnya")
                            ? lainnya?.keterangan || "✓"
                            : "-"}
                        </td>

                        <td className="px-3 py-3">
                          {item.penerima_pengetahuan}
                        </td>

                        <td className="max-w-[280px] px-3 py-3">
                          {item.lesson_learned_evaluasi ||
                            "-"}
                        </td>

                        <td className="px-3 py-3">
                          <div className="flex justify-center gap-2">
                            {canUpdate && (
                              <button
                                type="button"
                                onClick={() =>
                                  openEditAlih(item)
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
                                  handleDeleteAlih(item)
                                }
                                className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                              >
                                Hapus
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showPemanfaatanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingPemanfaatan
                  ? "Edit Pemanfaatan Pengetahuan"
                  : "Tambah Pemanfaatan Pengetahuan"}
              </h3>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pengetahuan
                </label>

                <select
                  value={pemanfaatanForm.pengetahuan_id}
                  onChange={(e) =>
                    setPemanfaatanForm({
                      ...pemanfaatanForm,
                      pengetahuan_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Pilih pengetahuan
                  </option>

                  {pengetahuanOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.kode_pengetahuan} -{" "}
                      {item.nama_pengetahuan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tanggal Pemanfaatan
                </label>

                <input
                  type="date"
                  value={
                    pemanfaatanForm.tanggal_pemanfaatan
                  }
                  onChange={(e) =>
                    setPemanfaatanForm({
                      ...pemanfaatanForm,
                      tanggal_pemanfaatan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Akses Pengetahuan
                </label>

                <select
                  value={
                    pemanfaatanForm.jenis_pengguna
                  }
                  onChange={(e) =>
                    setPemanfaatanForm({
                      ...pemanfaatanForm,
                      jenis_pengguna: e.target
                        .value as "Publik" | "Internal",
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Internal">
                    Internal
                  </option>
                  <option value="Publik">
                    Publik
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Unit Pengguna
                </label>

                <select
                  value={
                    pemanfaatanForm.unit_pengguna_id
                  }
                  onChange={(e) =>
                    setPemanfaatanForm({
                      ...pemanfaatanForm,
                      unit_pengguna_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Tidak ada / tidak ditentukan
                  </option>

                  {unitOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.kode_unit} -{" "}
                      {item.nama_unit}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Rating Pengetahuan
                </label>

                <select
                  value={
                    pemanfaatanForm.rating_pengetahuan
                  }
                  onChange={(e) =>
                    setPemanfaatanForm({
                      ...pemanfaatanForm,
                      rating_pengetahuan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Belum dinilai
                  </option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                  <option value="5">5</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tujuan Pemanfaatan
                </label>

                <textarea
                  rows={4}
                  value={
                    pemanfaatanForm.tujuan_pemanfaatan
                  }
                  onChange={(e) =>
                    setPemanfaatanForm({
                      ...pemanfaatanForm,
                      tujuan_pemanfaatan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowPemanfaatanForm(false);
                  resetPemanfaatanForm();
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePemanfaatan}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showAlihForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingAlih
                  ? "Edit Alih Pengetahuan"
                  : "Tambah Alih Pengetahuan"}
              </h3>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pengetahuan
                </label>

                <select
                  value={alihForm.pengetahuan_id}
                  onChange={(e) =>
                    setAlihForm({
                      ...alihForm,
                      pengetahuan_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Pilih pengetahuan
                  </option>

                  {pengetahuanOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.kode_pengetahuan} -{" "}
                      {item.nama_pengetahuan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Tanggal Kegiatan
                  </label>

                  <input
                    type="date"
                    value={alihForm.tanggal_kegiatan}
                    onChange={(e) =>
                      setAlihForm({
                        ...alihForm,
                        tanggal_kegiatan:
                          e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Penerima Pengetahuan
                  </label>

                  <input
                    type="text"
                    value={
                      alihForm.penerima_pengetahuan
                    }
                    onChange={(e) =>
                      setAlihForm({
                        ...alihForm,
                        penerima_pengetahuan:
                          e.target.value,
                      })
                    }
                    maxLength={255}
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                  Metode Transfer
                </label>

                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {metodeOptions.map((metode) => (
                    <label
                      key={metode}
                      className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-200 px-3 py-2"
                    >
                      <input
                        type="checkbox"
                        checked={selectedMetode.includes(
                          metode
                        )}
                        onChange={() =>
                          toggleMetode(metode)
                        }
                      />

                      <span className="text-sm text-slate-700">
                        {metode}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {selectedMetode.includes("Lainnya") && (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Keterangan Metode Lainnya
                  </label>

                  <input
                    type="text"
                    value={keteranganLainnya}
                    onChange={(e) =>
                      setKeteranganLainnya(
                        e.target.value
                      )
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Lesson Learned / Evaluasi
                </label>

                <textarea
                  rows={4}
                  value={
                    alihForm.lesson_learned_evaluasi
                  }
                  onChange={(e) =>
                    setAlihForm({
                      ...alihForm,
                      lesson_learned_evaluasi:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowAlihForm(false);
                  resetAlihForm();
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveAlih}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}