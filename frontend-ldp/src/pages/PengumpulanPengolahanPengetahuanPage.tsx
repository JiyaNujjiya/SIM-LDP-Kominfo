import { useEffect, useMemo, useState } from "react";
import DokumentasiPengetahuanSection from "../components/DokumentasiPengetahuanSection";

type PengumpulanItem = {
  id: number;
  rencana_dokumentasi_id: number | null;
  pengetahuan_id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  tanggal_pengumpulan: string;
  unit_pengumpulan_id: number;
  unit_pengumpulan: string;
  lokasi_penyimpanan: string | null;
  keterangan_lokasi_lainnya: string | null;
  status_publikasi_simpan: string | null;
  metode_pengolahan: string | null;
  deskripsi_pengolahan: string | null;
  pengetahuan_hasil_id: number | null;
  kode_pengetahuan_hasil: string | null;
  nama_pengetahuan_hasil: string | null;
  created_by: number;
  pembuat: string;
  created_at: string;
  updated_at: string;
};

type PengetahuanOption = {
  id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  layanan_id: number;
  nama_layanan: string;
  jenis_pengetahuan: string;
  sudah_terdokumentasi: number;
  aspek_pemdi?: string | null;
  indikator_pemdi?: string | null;
};

type UnitOption = {
  id: number;
  instansi_id: number;
  kode_unit: string;
  nama_unit: string;
};

const API = "http://localhost:5000/api";

export default function PengumpulanPengolahanPengetahuanPage() {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes("knowledge.create");
  const canUpdate = permissions.includes("knowledge.update");
  const canDelete = permissions.includes("knowledge.delete");

  const [data, setData] = useState<PengumpulanItem[]>([]);
  const [pengetahuanOptions, setPengetahuanOptions] = useState<
    PengetahuanOption[]
  >([]);
  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] =
    useState<PengumpulanItem | null>(null);

  const [form, setForm] = useState({
    pengetahuan_id: "",
    tanggal_pengumpulan: "",
    unit_pengumpulan_id: "",
    lokasi_penyimpanan: "",
    keterangan_lokasi_lainnya: "",
    status_publikasi_simpan: "",
    metode_pengolahan: "",
    deskripsi_pengolahan: "",
    pengetahuan_hasil_id: "",
  });

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

      const result = await request(
        `${API}/pengetahuan/pengumpulan-pengolahan`
      );

      setData(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data pengumpulan dan pengolahan."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);

      const [pengetahuanResult, unitResult] =
        await Promise.all([
          request(
            `${API}/pengetahuan/pengetahuan-options`
          ),
          request(`${API}/pengetahuan/unit-options`),
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
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data pilihan."
      );
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((item) =>
      [
        item.kode_pengetahuan,
        item.nama_pengetahuan,
        item.tanggal_pengumpulan,
        item.unit_pengumpulan,
        item.lokasi_penyimpanan,
        item.status_publikasi_simpan,
        item.metode_pengolahan,
        item.nama_pengetahuan_hasil,
        item.pembuat,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        )
    );
  }, [data, search]);

  const getPengetahuan = (id: number) => {
    return pengetahuanOptions.find(
      (item) => Number(item.id) === Number(id)
    );
  };

  const resetForm = () => {
    setForm({
      pengetahuan_id: "",
      tanggal_pengumpulan: "",
      unit_pengumpulan_id: "",
      lokasi_penyimpanan: "",
      keterangan_lokasi_lainnya: "",
      status_publikasi_simpan: "",
      metode_pengolahan: "",
      deskripsi_pengolahan: "",
      pengetahuan_hasil_id: "",
    });

    setEditingItem(null);
  };

  const handleTambah = () => {
    clearNotification();
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item: PengumpulanItem) => {
    clearNotification();

    setEditingItem(item);

    setForm({
      pengetahuan_id: String(item.pengetahuan_id),
      tanggal_pengumpulan:
        item.tanggal_pengumpulan || "",
      unit_pengumpulan_id: String(
        item.unit_pengumpulan_id
      ),
      lokasi_penyimpanan:
        item.lokasi_penyimpanan || "",
      keterangan_lokasi_lainnya:
        item.keterangan_lokasi_lainnya || "",
      status_publikasi_simpan:
        item.status_publikasi_simpan || "",
      metode_pengolahan:
        item.metode_pengolahan || "",
      deskripsi_pengolahan:
        item.deskripsi_pengolahan || "",
      pengetahuan_hasil_id:
        item.pengetahuan_hasil_id
          ? String(item.pengetahuan_hasil_id)
          : "",
    });

    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      clearNotification();

      if (!form.pengetahuan_id) {
        setError("Pengetahuan wajib dipilih.");
        return;
      }

      if (!form.tanggal_pengumpulan) {
        setError("Tanggal pengumpulan wajib diisi.");
        return;
      }

      if (!form.unit_pengumpulan_id) {
        setError("Unit pengumpulan wajib dipilih.");
        return;
      }

      if (form.lokasi_penyimpanan.length > 255) {
        setError(
          "Lokasi penyimpanan maksimal 255 karakter."
        );
        return;
      }

      if (
        form.status_publikasi_simpan.length > 100
      ) {
        setError(
          "Status publikasi/simpan maksimal 100 karakter."
        );
        return;
      }

      if (form.metode_pengolahan.length > 150) {
        setError(
          "Metode pengolahan maksimal 150 karakter."
        );
        return;
      }

      setSaving(true);

      const payload = {
        rencana_dokumentasi_id: null,
        pengetahuan_id: Number(
          form.pengetahuan_id
        ),
        tanggal_pengumpulan:
          form.tanggal_pengumpulan,
        unit_pengumpulan_id: Number(
          form.unit_pengumpulan_id
        ),
        lokasi_penyimpanan:
          form.lokasi_penyimpanan.trim() || null,
        keterangan_lokasi_lainnya:
          form.keterangan_lokasi_lainnya.trim() ||
          null,
        status_publikasi_simpan:
          form.status_publikasi_simpan.trim() ||
          null,
        metode_pengolahan:
          form.metode_pengolahan.trim() || null,
        deskripsi_pengolahan:
          form.deskripsi_pengolahan.trim() || null,
        pengetahuan_hasil_id:
          form.pengetahuan_hasil_id
            ? Number(form.pengetahuan_hasil_id)
            : null,
      };

      const url = editingItem
        ? `${API}/pengetahuan/pengumpulan-pengolahan/${editingItem.id}`
        : `${API}/pengetahuan/pengumpulan-pengolahan`;

      const result = await request(url, {
        method: editingItem ? "PUT" : "POST",
        body: JSON.stringify(payload),
      });

      setMessage(
        result?.message ||
          "Data pengumpulan dan pengolahan berhasil disimpan."
      );

      setShowForm(false);
      resetForm();

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data pengumpulan dan pengolahan."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    item: PengumpulanItem
  ) => {
    const confirmed = window.confirm(
      `Hapus data pengumpulan "${item.nama_pengetahuan}"?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/pengetahuan/pengumpulan-pengolahan/${item.id}`,
        {
          method: "DELETE",
        }
      );

      setMessage(
        result?.message ||
          "Data pengumpulan dan pengolahan berhasil dihapus."
      );

      await fetchData();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data."
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
          MPN02 - Pengumpulan & Pengolahan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Pengumpulan, penyimpanan, dan pengolahan
          pengetahuan Layanan Digital Pemerintah.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 2;

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
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir MPN02 - Pengumpulan &
              Pengolahan Pengetahuan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pencatatan proses pengumpulan,
              penyimpanan, dan pengolahan
              pengetahuan.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleTambah}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Tambah Pengumpulan
            </button>
          )}
        </div>

        <div className="p-5">
          <div className="mb-5">
            <input
              type="text"
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
              placeholder="Cari layanan, pengetahuan, unit, metode, atau status..."
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-lg"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1500px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-3 py-3 font-semibold">
                    No
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Nama Layanan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    ID Pengetahuan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Nama Pengetahuan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Tanggal Pengumpulan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Unit Pengumpulan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Lokasi Penyimpanan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Status Publikasi / Simpan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Metode Pengolahan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Deskripsi Pengolahan
                  </th>

                  <th className="px-3 py-3 font-semibold">
                    Pengetahuan Hasil
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
                      colSpan={13}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Memuat data...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={13}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Belum ada data pengumpulan dan
                      pengolahan pengetahuan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map(
                    (item, index) => {
                      const pengetahuan =
                        getPengetahuan(
                          item.pengetahuan_id
                        );

                      return (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 align-top hover:bg-slate-50"
                        >
                          <td className="px-3 py-3">
                            {index + 1}
                          </td>

                          <td className="px-3 py-3">
                            {pengetahuan?.nama_layanan ||
                              "-"}
                          </td>

                          <td className="px-3 py-3 font-medium text-slate-800">
                            {item.kode_pengetahuan}
                          </td>

                          <td className="px-3 py-3">
                            {item.nama_pengetahuan}
                          </td>

                          <td className="px-3 py-3">
                            {item.tanggal_pengumpulan}
                          </td>

                          <td className="px-3 py-3">
                            {item.unit_pengumpulan}
                          </td>

                          <td className="px-3 py-3">
                            <div>
                              {item.lokasi_penyimpanan ||
                                "-"}
                            </div>

                            {item.keterangan_lokasi_lainnya && (
                              <div className="mt-1 text-xs text-slate-500">
                                {
                                  item.keterangan_lokasi_lainnya
                                }
                              </div>
                            )}
                          </td>

                          <td className="px-3 py-3">
                            {item.status_publikasi_simpan ||
                              "-"}
                          </td>

                          <td className="px-3 py-3">
                            {item.metode_pengolahan ||
                              "-"}
                          </td>

                          <td className="max-w-[260px] px-3 py-3">
                            {item.deskripsi_pengolahan ||
                              "-"}
                          </td>

                          <td className="px-3 py-3">
                            {item.nama_pengetahuan_hasil ? (
                              <>
                                <div className="font-medium text-slate-800">
                                  {item.kode_pengetahuan_hasil}
                                </div>

                                <div className="mt-1 text-xs text-slate-500">
                                  {
                                    item.nama_pengetahuan_hasil
                                  }
                                </div>
                              </>
                            ) : (
                              "-"
                            )}
                          </td>

                          <td className="px-3 py-3">
                            {item.pembuat}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col items-center gap-2">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEdit(item)
                                  }
                                  className="w-[72px] rounded-md border border-blue-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
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
                                  className="w-[72px] rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <DokumentasiPengetahuanSection
        pengumpulanItems={data.map((item) => ({
            id: item.id,
            pengetahuan_id: item.pengetahuan_id,
            kode_pengetahuan: item.kode_pengetahuan,
            nama_pengetahuan: item.nama_pengetahuan,
            tanggal_pengumpulan: item.tanggal_pengumpulan,
        }))}
      />

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-4xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingItem
                  ? "Edit Pengumpulan & Pengolahan"
                  : "Tambah Pengumpulan & Pengolahan"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Isi informasi proses pengumpulan dan
                pengolahan pengetahuan.
              </p>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pengetahuan
                </label>

                <select
                  value={form.pengetahuan_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pengetahuan_id:
                        e.target.value,
                      pengetahuan_hasil_id:
                        form.pengetahuan_hasil_id ===
                        e.target.value
                          ? ""
                          : form.pengetahuan_hasil_id,
                    })
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">
                    Pilih pengetahuan
                  </option>

                  {pengetahuanOptions.map(
                    (item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.kode_pengetahuan} -{" "}
                        {item.nama_pengetahuan} -{" "}
                        {item.nama_layanan}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tanggal Pengumpulan
                </label>

                <input
                  type="date"
                  value={
                    form.tanggal_pengumpulan
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      tanggal_pengumpulan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Unit Pengumpulan
                </label>

                <select
                  value={
                    form.unit_pengumpulan_id
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      unit_pengumpulan_id:
                        e.target.value,
                    })
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">
                    Pilih unit kerja
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
                  Lokasi / Link Pengetahuan
                </label>

                <input
                  type="text"
                  value={
                    form.lokasi_penyimpanan
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      lokasi_penyimpanan:
                        e.target.value,
                    })
                  }
                  maxLength={255}
                  placeholder="Contoh: Repository internal atau URL"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Status Publikasi / Simpan
                </label>

                <input
                  type="text"
                  value={
                    form.status_publikasi_simpan
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status_publikasi_simpan:
                        e.target.value,
                    })
                  }
                  maxLength={100}
                  placeholder="Contoh: Tersimpan Internal"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Keterangan Lokasi Lainnya
                </label>

                <textarea
                  rows={2}
                  value={
                    form.keterangan_lokasi_lainnya
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      keterangan_lokasi_lainnya:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Metode Pengolahan
                </label>

                <input
                  type="text"
                  value={form.metode_pengolahan}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      metode_pengolahan:
                        e.target.value,
                    })
                  }
                  maxLength={150}
                  placeholder="Contoh: Klasifikasi dan validasi"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pengetahuan Hasil Pengolahan
                </label>

                <select
                  value={
                    form.pengetahuan_hasil_id
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pengetahuan_hasil_id:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">
                    Belum ada pengetahuan hasil
                  </option>

                  {pengetahuanOptions
                    .filter(
                      (item) =>
                        String(item.id) !==
                        form.pengetahuan_id
                    )
                    .map((item) => (
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

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Deskripsi Pengolahan
                </label>

                <textarea
                  rows={4}
                  value={
                    form.deskripsi_pengolahan
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      deskripsi_pengolahan:
                        e.target.value,
                    })
                  }
                  placeholder="Jelaskan proses pengolahan pengetahuan"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
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
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
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