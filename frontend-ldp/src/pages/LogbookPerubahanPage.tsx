import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

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
  tanggal_rencana_pelaksanaan?: string;
  jangka_waktu_pelaksanaan?: string;
  nama_unit_pelaksana?: string;
  nama_pic_implementasi?: string;
};

type PersetujuanItem = {
  id: number;
  perubahan_id?: number;
  tahap?: string;
  keputusan?: string;
  nama_pic?: string;
  diputuskan_at?: string;
  catatan_keputusan?: string | null;
};

type LogbookItem = {
  id: number;
  perubahan_id: number;
  kode_perubahan: string;
  detail_perubahan: string;
  klasifikasi: string;
  lingkup: string;
  status_workflow: string;
  tanggal_pelaksanaan: string;
  catatan: string;
  status_perubahan: string;
  created_by: number;
  dibuat_oleh?: string;
  created_at?: string;
};

type BuktiItem = {
  id: number;
  log_perubahan_id: number;
  perubahan_id: number;
  kode_perubahan: string;
  jenis_bukti: "Foto" | "Video" | "Dokumen";
  nama_bukti: string;
  lokasi_bukti: string;
  keterangan?: string | null;
  uploaded_by: number;
  diunggah_oleh?: string;
  created_at?: string;
};

type LogbookForm = {
  tanggal_pelaksanaan: string;
  catatan: string;
  status_perubahan: string;
};

type BuktiForm = {
  jenis_bukti: "Foto" | "Video" | "Dokumen";
  nama_bukti: string;
  lokasi_bukti: string;
  keterangan: string;
};

const API = "http://localhost:5000/api";

const initialLogbookForm: LogbookForm = {
  tanggal_pelaksanaan: "",
  catatan: "",
  status_perubahan: "Berhasil",
};

const initialBuktiForm: BuktiForm = {
  jenis_bukti: "Dokumen",
  nama_bukti: "",
  lokasi_bukti: "",
  keterangan: "",
};

export default function LogbookPerubahanPage() {
  const navigate = useNavigate();

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes("change.create");
  const canUpdate = permissions.includes("change.update");
  const canDelete = permissions.includes("change.delete");

  const [dataPerubahan, setDataPerubahan] = useState<
    PerubahanItem[]
  >([]);

  const [selectedPerubahan, setSelectedPerubahan] =
    useState<PerubahanItem | null>(null);

  const [implementasi, setImplementasi] =
    useState<ImplementasiItem | null>(null);

  const [persetujuanPelaksanaan, setPersetujuanPelaksanaan] =
    useState<PersetujuanItem[]>([]);

  const [logbook, setLogbook] = useState<LogbookItem[]>([]);

  const [buktiMap, setBuktiMap] = useState<
    Record<number, BuktiItem[]>
  >({});

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showLogbookForm, setShowLogbookForm] =
    useState(false);

  const [editingLogbook, setEditingLogbook] =
    useState<LogbookItem | null>(null);

  const [logbookForm, setLogbookForm] =
    useState<LogbookForm>(initialLogbookForm);

  const [showBuktiForm, setShowBuktiForm] =
    useState(false);

  const [selectedLogbookForBukti, setSelectedLogbookForBukti] =
    useState<LogbookItem | null>(null);

  const [editingBukti, setEditingBukti] =
    useState<BuktiItem | null>(null);

  const [buktiForm, setBuktiForm] =
    useState<BuktiForm>(initialBuktiForm);

  const request = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const token = localStorage.getItem("token");

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        result.message || "Terjadi kesalahan pada server."
      );
    }

    return result;
  };

  const clearNotification = () => {
    setMessage("");
    setError("");
  };

  const fetchPerubahan = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await request(
        `${API}/perubahan`
      );

      const rows = Array.isArray(result.data)
        ? result.data
        : [];

      setDataPerubahan(
        rows.filter(
          (item: PerubahanItem) =>
            item.status === "Evaluasi" ||
            item.status === "Selesai"
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil daftar perubahan."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchImplementasi = async (
    perubahanId: number
  ) => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/implementasi`
    );

    const item = result.data || null;

    setImplementasi(item);

    return item;
  };

  const fetchPersetujuanPelaksanaan = async (
    perubahanId: number
  ) => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/persetujuan/pelaksanaan`
    );

    setPersetujuanPelaksanaan(
      Array.isArray(result.data)
        ? result.data
        : []
    );
  };

  const fetchBukti = async (
    logbookId: number
  ) => {
    const result = await request(
      `${API}/perubahan/logbook/${logbookId}/bukti`
    );

    const rows = Array.isArray(result.data)
      ? result.data
      : [];

    setBuktiMap((prev) => ({
      ...prev,
      [logbookId]: rows,
    }));

    return rows;
  };

  const fetchLogbook = async (
    perubahanId: number
  ) => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/logbook`
    );

    const rows: LogbookItem[] =
      Array.isArray(result.data)
        ? result.data
        : [];

    setLogbook(rows);

    await Promise.all(
      rows.map((item) =>
        fetchBukti(item.id)
      )
    );

    return rows;
  };

  const refreshDetail = async (
    perubahanId: number
  ) => {
    await Promise.all([
      fetchImplementasi(perubahanId),
      fetchPersetujuanPelaksanaan(perubahanId),
      fetchLogbook(perubahanId),
    ]);
  };

  const openDetail = async (
    item: PerubahanItem
  ) => {
    try {
      clearNotification();
      setLoadingDetail(true);
      setSelectedPerubahan(item);
      setImplementasi(null);
      setPersetujuanPelaksanaan([]);
      setLogbook([]);
      setBuktiMap({});

      await refreshDetail(item.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil detail pencatatan perubahan."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPerubahan();
  }, []);

  const filteredPerubahan = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

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

  const latestApproval =
    persetujuanPelaksanaan.length > 0
      ? persetujuanPelaksanaan[0]
      : null;

  const resetLogbookForm = () => {
    setLogbookForm(initialLogbookForm);
    setEditingLogbook(null);
  };

  const openTambahLogbook = () => {
    clearNotification();
    resetLogbookForm();
    setShowLogbookForm(true);
  };

  const openEditLogbook = (
    item: LogbookItem
  ) => {
    clearNotification();

    setEditingLogbook(item);

    setLogbookForm({
      tanggal_pelaksanaan:
        item.tanggal_pelaksanaan?.slice(
          0,
          10
        ) || "",
      catatan: item.catatan || "",
      status_perubahan:
        item.status_perubahan || "",
    });

    setShowLogbookForm(true);
  };

  const handleSaveLogbook = async () => {
    if (!selectedPerubahan) {
      return;
    }

    if (!logbookForm.tanggal_pelaksanaan) {
      setError(
        "Tanggal pelaksanaan wajib diisi."
      );
      return;
    }

    if (!logbookForm.catatan.trim()) {
      setError("Catatan wajib diisi.");
      return;
    }

    if (
      !logbookForm.status_perubahan.trim()
    ) {
      setError(
        "Status perubahan wajib diisi."
      );
      return;
    }

    if (
      logbookForm.status_perubahan.trim()
        .length > 50
    ) {
      setError(
        "Status perubahan maksimal 50 karakter."
      );
      return;
    }

    try {
      clearNotification();
      setSaving(true);

      const payload = {
        tanggal_pelaksanaan:
          logbookForm.tanggal_pelaksanaan,
        catatan:
          logbookForm.catatan.trim(),
        status_perubahan:
          logbookForm.status_perubahan.trim(),
      };

      const url = editingLogbook
        ? `${API}/perubahan/logbook/${editingLogbook.id}`
        : `${API}/perubahan/${selectedPerubahan.id}/logbook`;

      const result = await request(url, {
        method: editingLogbook
          ? "PUT"
          : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message ||
          "Logbook perubahan berhasil disimpan."
      );

      setShowLogbookForm(false);
      resetLogbookForm();

      await fetchLogbook(
        selectedPerubahan.id
      );

      await fetchPerubahan();

      const refreshed =
        await request(
          `${API}/perubahan/${selectedPerubahan.id}`
        );

      if (refreshed.data) {
        setSelectedPerubahan(
          refreshed.data
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan logbook perubahan."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLogbook = async (
    item: LogbookItem
  ) => {
    if (!selectedPerubahan) {
      return;
    }

    const confirmed = window.confirm(
      `Hapus logbook tanggal ${formatDate(
        item.tanggal_pelaksanaan
      )}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/logbook/${item.id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        result.message ||
          "Logbook perubahan berhasil dihapus."
      );

      await fetchLogbook(
        selectedPerubahan.id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus logbook perubahan."
      );
    }
  };

  const resetBuktiForm = () => {
    setBuktiForm(initialBuktiForm);
    setEditingBukti(null);
    setSelectedLogbookForBukti(null);
  };

  const openTambahBukti = (
    item: LogbookItem
  ) => {
    clearNotification();
    setEditingBukti(null);
    setSelectedLogbookForBukti(item);
    setBuktiForm(initialBuktiForm);
    setShowBuktiForm(true);
  };

  const openEditBukti = (
    logbookItem: LogbookItem,
    bukti: BuktiItem
  ) => {
    clearNotification();

    setSelectedLogbookForBukti(
      logbookItem
    );

    setEditingBukti(bukti);

    setBuktiForm({
      jenis_bukti:
        bukti.jenis_bukti,
      nama_bukti:
        bukti.nama_bukti || "",
      lokasi_bukti:
        bukti.lokasi_bukti || "",
      keterangan:
        bukti.keterangan || "",
    });

    setShowBuktiForm(true);
  };

  const handleSaveBukti = async () => {
    if (!selectedLogbookForBukti) {
      return;
    }

    if (!buktiForm.nama_bukti.trim()) {
      setError(
        "Nama bukti wajib diisi."
      );
      return;
    }

    if (!buktiForm.lokasi_bukti.trim()) {
      setError(
        "Lokasi bukti wajib diisi."
      );
      return;
    }

    try {
      clearNotification();
      setSaving(true);

      const payload = {
        jenis_bukti:
          buktiForm.jenis_bukti,
        nama_bukti:
          buktiForm.nama_bukti.trim(),
        lokasi_bukti:
          buktiForm.lokasi_bukti.trim(),
        keterangan:
          buktiForm.keterangan.trim() ||
          null,
      };

      const url = editingBukti
        ? `${API}/perubahan/bukti-pelaksanaan/${editingBukti.id}`
        : `${API}/perubahan/logbook/${selectedLogbookForBukti.id}/bukti`;

      const result = await request(url, {
        method: editingBukti
          ? "PUT"
          : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        result.message ||
          "Bukti pelaksanaan berhasil disimpan."
      );

      const logbookId =
        selectedLogbookForBukti.id;

      setShowBuktiForm(false);
      resetBuktiForm();

      await fetchBukti(logbookId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan bukti pelaksanaan."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBukti = async (
    item: BuktiItem
  ) => {
    const confirmed = window.confirm(
      `Hapus bukti "${item.nama_bukti}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      clearNotification();

      const result = await request(
        `${API}/perubahan/bukti-pelaksanaan/${item.id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        result.message ||
          "Bukti pelaksanaan berhasil dihapus."
      );

      await fetchBukti(
        item.log_perubahan_id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus bukti pelaksanaan."
      );
    }
  };

  const formatDate = (
    value?: string | null
  ) => {
    if (!value) {
      return "-";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    return new Intl.DateTimeFormat(
      "id-ID",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    ).format(date);
  };

  const getStatusStyle = (
    status: string
  ) => {
    if (status === "Selesai") {
      return "bg-green-100 text-green-700";
    }

    if (status === "Evaluasi") {
      return "bg-purple-100 text-purple-700";
    }

    return "bg-gray-100 text-gray-700";
  };

  const processSteps = [
    {
      number: 1,
      label: "Perencanaan",
      route: "/perubahan/perencanaan",
    },
    {
      number: 2,
      label: "Analisis",
      route: "/perubahan/analisis",
    },
    {
      number: 3,
      label: "Implementasi",
      route: "/perubahan/implementasi",
    },
    {
      number: 4,
      label: "Evaluasi",
      route: "/perubahan/evaluasi",
    },
    {
      number: 5,
      label: "Pencatatan / Logbook",
      route: "/perubahan/logbook",
    },
  ];

    return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Pencatatan / Logbook Perubahan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Pencatatan historis perubahan sebagai jejak audit pelaksanaan
          Manajemen Perubahan.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 5;
            const available = step.number <= 5;

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
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {step.number}
                  </button>

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

      {!selectedPerubahan ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Daftar Perubahan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pilih perubahan yang akan dicatat ke dalam logbook.
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
              Tidak ada perubahan yang dapat dicatat.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full table-fixed text-sm">
                <thead className="bg-slate-50 text-left text-slate-600">
                  <tr>
                    <th className="w-[18%] px-4 py-3 font-semibold">
                      ID Perubahan
                    </th>
                    <th className="w-[20%] px-4 py-3 font-semibold">
                      Layanan
                    </th>
                    <th className="w-[30%] px-4 py-3 font-semibold">
                      Detail Perubahan
                    </th>
                    <th className="w-[12%] px-4 py-3 font-semibold">
                      Klasifikasi
                    </th>
                    <th className="w-[10%] px-4 py-3 font-semibold">
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
                        {item.nama_layanan || "-"}
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
                setPersetujuanPelaksanaan([]);
                setLogbook([]);
                setBuktiMap({});
              }}
              className="w-fit rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Kembali
            </button>

            {canCreate && selectedPerubahan.status !== "Selesai" && (
              <button
                type="button"
                onClick={openTambahLogbook}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tambah Logbook
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
                  {selectedPerubahan.nama_layanan || "-"}
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
                  {selectedPerubahan.nama_unit_pemohon || "-"}
                </p>
              </div>
            </div>
          </div>

          {loadingDetail ? (
            <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
              Memuat pencatatan perubahan...
            </div>
          ) : (
            <>
              <div className="mb-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-base font-semibold text-slate-800">
                  Informasi Pelaksanaan
                </h3>

                <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">
                      Tanggal Pelaksanaan
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {formatDate(
                        implementasi?.tanggal_rencana_pelaksanaan
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Jangka Waktu
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {implementasi?.jangka_waktu_pelaksanaan ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      Unit Pelaksana
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {implementasi?.nama_unit_pelaksana ||
                        "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      PIC Pelaksana
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {implementasi?.nama_pic_implementasi ||
                        "-"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 border-t border-slate-200 pt-5 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-slate-500">
                      Status Persetujuan Pelaksanaan
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {latestApproval?.keputusan || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-slate-500">
                      PIC yang Menyetujui
                    </p>
                    <p className="mt-1 text-sm font-medium text-slate-800">
                      {latestApproval?.nama_pic || "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 p-5">
                  <h3 className="text-lg font-semibold text-slate-800">
                    Logbook Perubahan
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Catat pelaksanaan, hasil perubahan, dan bukti pendukung.
                  </p>
                </div>

                {logbook.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-sm text-slate-500">
                      Belum ada pencatatan logbook untuk perubahan ini.
                    </p>

                    {canCreate && (
                      <button
                        type="button"
                        onClick={openTambahLogbook}
                        className="mt-4 rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                      >
                        Tambah Logbook
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-200">
                    {logbook.map((item, index) => {
                      const bukti =
                        buktiMap[item.id] || [];

                      return (
                        <div
                          key={item.id}
                          className="p-5"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Pencatatan {index + 1}
                              </p>

                              <h4 className="mt-1 text-base font-semibold text-slate-800">
                                {formatDate(
                                  item.tanggal_pelaksanaan
                                )}
                              </h4>

                              {item.dibuat_oleh && (
                                <p className="mt-1 text-xs text-slate-500">
                                  Dicatat oleh{" "}
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
                                      openEditLogbook(
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
                                      handleDeleteLogbook(
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

                          <div className="mt-5 grid gap-5 lg:grid-cols-3">
                            <div className="lg:col-span-2">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Catatan
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                {item.catatan}
                              </p>
                            </div>

                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                Status Perubahan
                              </p>

                              <p className="mt-2 text-sm font-semibold text-slate-800">
                                {item.status_perubahan}
                              </p>
                            </div>
                          </div>

                          <div className="mt-6 border-t border-slate-200 pt-5">
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <h5 className="text-sm font-semibold text-slate-800">
                                  Bukti Pelaksanaan
                                </h5>

                                <p className="mt-1 text-xs text-slate-500">
                                  Foto, video, atau dokumen pendukung perubahan.
                                </p>
                              </div>

                              {canCreate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openTambahBukti(item)
                                  }
                                  className="w-fit rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                  Tambah Bukti
                                </button>
                              )}
                            </div>

                            {bukti.length === 0 ? (
                              <p className="mt-4 text-sm text-slate-500">
                                Belum ada bukti pelaksanaan.
                              </p>
                            ) : (
                              <div className="mt-4 overflow-x-auto rounded-md border border-slate-200">
                                <table className="w-full table-fixed text-sm">
                                  <thead className="bg-slate-50 text-left text-slate-600">
                                    <tr>
                                      <th className="w-[14%] px-3 py-3 font-semibold">
                                        Jenis
                                      </th>
                                      <th className="w-[24%] px-3 py-3 font-semibold">
                                        Nama Bukti
                                      </th>
                                      <th className="w-[28%] px-3 py-3 font-semibold">
                                        Lokasi Bukti
                                      </th>
                                      <th className="w-[22%] px-3 py-3 font-semibold">
                                        Keterangan
                                      </th>
                                      <th className="w-[12%] px-3 py-3 text-center font-semibold">
                                        Aksi
                                      </th>
                                    </tr>
                                  </thead>

                                  <tbody className="divide-y divide-slate-200">
                                    {bukti.map(
                                      (buktiItem) => (
                                        <tr
                                          key={
                                            buktiItem.id
                                          }
                                          className="align-top"
                                        >
                                          <td className="px-3 py-3 text-slate-600">
                                            {
                                              buktiItem.jenis_bukti
                                            }
                                          </td>

                                          <td className="break-words px-3 py-3 text-slate-700">
                                            {
                                              buktiItem.nama_bukti
                                            }
                                          </td>

                                          <td className="break-words px-3 py-3 text-slate-600">
                                            {
                                              buktiItem.lokasi_bukti
                                            }
                                          </td>

                                          <td className="break-words px-3 py-3 text-slate-600">
                                            {buktiItem.keterangan ||
                                              "-"}
                                          </td>

                                          <td className="px-3 py-3">
                                            <div className="flex justify-center gap-2">
                                              {canUpdate && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    openEditBukti(
                                                      item,
                                                      buktiItem
                                                    )
                                                  }
                                                  className="text-xs font-semibold text-slate-700 hover:text-slate-900"
                                                >
                                                  Edit
                                                </button>
                                              )}

                                              {canDelete && (
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    handleDeleteBukti(
                                                      buktiItem
                                                    )
                                                  }
                                                  className="text-xs font-semibold text-red-600 hover:text-red-700"
                                                >
                                                  Hapus
                                                </button>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      )
                                    )}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {showLogbookForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingLogbook
                  ? "Edit Logbook"
                  : "Tambah Logbook"}
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Tanggal Pelaksanaan
                </label>

                <input
                  type="date"
                  value={
                    logbookForm.tanggal_pelaksanaan
                  }
                  onChange={(event) =>
                    setLogbookForm((prev) => ({
                      ...prev,
                      tanggal_pelaksanaan:
                        event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Catatan
                </label>

                <textarea
                  rows={5}
                  value={logbookForm.catatan}
                  onChange={(event) =>
                    setLogbookForm((prev) => ({
                      ...prev,
                      catatan:
                        event.target.value,
                    }))
                  }
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Status Perubahan
                </label>

                <input
                  type="text"
                  value={
                    logbookForm.status_perubahan
                  }
                  onChange={(event) =>
                    setLogbookForm((prev) => ({
                      ...prev,
                      status_perubahan:
                        event.target.value,
                    }))
                  }
                  placeholder="Contoh: Berhasil"
                  maxLength={50}
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowLogbookForm(false);
                  resetLogbookForm();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveLogbook}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showBuktiForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-800">
                {editingBukti
                  ? "Edit Bukti Pelaksanaan"
                  : "Tambah Bukti Pelaksanaan"}
              </h2>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Jenis Bukti
                </label>

                <select
                  value={buktiForm.jenis_bukti}
                  onChange={(event) =>
                    setBuktiForm((prev) => ({
                      ...prev,
                      jenis_bukti:
                        event.target.value as
                          | "Foto"
                          | "Video"
                          | "Dokumen",
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="Foto">
                    Foto
                  </option>
                  <option value="Video">
                    Video
                  </option>
                  <option value="Dokumen">
                    Dokumen
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Nama Bukti
                </label>

                <input
                  type="text"
                  value={buktiForm.nama_bukti}
                  onChange={(event) =>
                    setBuktiForm((prev) => ({
                      ...prev,
                      nama_bukti:
                        event.target.value,
                    }))
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Lokasi Bukti
                </label>

                <input
                  type="text"
                  value={buktiForm.lokasi_bukti}
                  onChange={(event) =>
                    setBuktiForm((prev) => ({
                      ...prev,
                      lokasi_bukti:
                        event.target.value,
                    }))
                  }
                  placeholder="Contoh: /dokumen/perubahan/integrasi-api.pdf"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">
                  Keterangan
                </label>

                <textarea
                  rows={4}
                  value={buktiForm.keterangan}
                  onChange={(event) =>
                    setBuktiForm((prev) => ({
                      ...prev,
                      keterangan:
                        event.target.value,
                    }))
                  }
                  className="w-full resize-y rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                disabled={saving}
                onClick={() => {
                  setShowBuktiForm(false);
                  resetBuktiForm();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                disabled={saving}
                onClick={handleSaveBukti}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
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