import { useEffect, useMemo, useState } from "react";

type PengumpulanOption = {
  id: number;
  pengetahuan_id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  tanggal_pengumpulan: string;
};

type DokumentasiItem = {
  id: number;
  pengetahuan_id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  pengumpulan_pengolahan_id: number | null;
  nama_dokumentasi: string;
  tipe_dokumentasi: "Teks" | "Gambar" | "Audio" | "Video";
  konten_teks: string | null;
  nama_file: string | null;
  file_path: string | null;
  mime_type: string | null;
  uploaded_by: number;
  pengunggah: string;
  created_at: string;
  updated_at: string;
};

type Props = {
  pengumpulanItems: PengumpulanOption[];
};

const API = "http://localhost:5000/api";

export default function DokumentasiPengetahuanSection({
  pengumpulanItems,
}: Props) {
  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes("knowledge.create");
  const canUpdate = permissions.includes("knowledge.update");
  const canDelete = permissions.includes("knowledge.delete");

  const [data, setData] = useState<DokumentasiItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openingFile, setOpeningFile] = useState<number | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] =
    useState<DokumentasiItem | null>(null);

  const [mode, setMode] = useState<"Teks" | "File">("Teks");

  const [form, setForm] = useState({
    pengumpulan_pengolahan_id: "",
    nama_dokumentasi: "",
    konten_teks: "",
  });

  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const getToken = () => localStorage.getItem("token");

  const clearNotification = () => {
    setMessage("");
    setError("");
  };

  const fetchDokumentasi = async () => {
    try {
      setLoading(true);

      const response = await fetch(
        `${API}/pengetahuan/dokumentasi`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Gagal mengambil dokumentasi pengetahuan."
        );
      }

      setData(Array.isArray(result?.data) ? result.data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil dokumentasi pengetahuan."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDokumentasi();
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
        item.nama_dokumentasi,
        item.tipe_dokumentasi,
        item.nama_file,
        item.pengunggah,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        )
    );
  }, [data, search]);

  const resetForm = () => {
    setEditingItem(null);
    setMode("Teks");
    setSelectedFile(null);

    setForm({
      pengumpulan_pengolahan_id: "",
      nama_dokumentasi: "",
      konten_teks: "",
    });
  };

  const handleTambah = () => {
    clearNotification();
    resetForm();
    setShowForm(true);
  };

  const handleEdit = (item: DokumentasiItem) => {
    if (item.tipe_dokumentasi !== "Teks") {
      return;
    }

    clearNotification();

    setEditingItem(item);
    setMode("Teks");
    setSelectedFile(null);

    setForm({
      pengumpulan_pengolahan_id:
        item.pengumpulan_pengolahan_id
          ? String(item.pengumpulan_pengolahan_id)
          : "",
      nama_dokumentasi: item.nama_dokumentasi,
      konten_teks: item.konten_teks || "",
    });

    setShowForm(true);
  };

  const getSelectedPengumpulan = () => {
    return pengumpulanItems.find(
      (item) =>
        Number(item.id) ===
        Number(form.pengumpulan_pengolahan_id)
    );
  };

  const saveTeks = async () => {
    const pengumpulan = getSelectedPengumpulan();

    if (!pengumpulan) {
      setError(
        "Data pengumpulan dan pengolahan wajib dipilih."
      );
      return;
    }

    if (!form.nama_dokumentasi.trim()) {
      setError("Nama dokumentasi wajib diisi.");
      return;
    }

    if (form.nama_dokumentasi.trim().length > 200) {
      setError("Nama dokumentasi maksimal 200 karakter.");
      return;
    }

    if (!form.konten_teks.trim()) {
      setError("Konten teks wajib diisi.");
      return;
    }

    setSaving(true);

    try {
      const url = editingItem
        ? `${API}/pengetahuan/dokumentasi/${editingItem.id}`
        : `${API}/pengetahuan/dokumentasi`;

      const response = await fetch(url, {
        method: editingItem ? "PUT" : "POST",
        headers: {
          Authorization: `Bearer ${getToken()}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          pengetahuan_id: pengumpulan.pengetahuan_id,
          pengumpulan_pengolahan_id: pengumpulan.id,
          nama_dokumentasi: form.nama_dokumentasi.trim(),
          konten_teks: form.konten_teks.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Gagal menyimpan dokumentasi teks."
        );
      }

      setMessage(
        result?.message ||
          "Dokumentasi teks berhasil disimpan."
      );

      setShowForm(false);
      resetForm();
      await fetchDokumentasi();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan dokumentasi teks."
      );
    } finally {
      setSaving(false);
    }
  };

  const saveFile = async () => {
    const pengumpulan = getSelectedPengumpulan();

    if (!pengumpulan) {
      setError(
        "Data pengumpulan dan pengolahan wajib dipilih."
      );
      return;
    }

    if (!form.nama_dokumentasi.trim()) {
      setError("Nama dokumentasi wajib diisi.");
      return;
    }

    if (form.nama_dokumentasi.trim().length > 200) {
      setError("Nama dokumentasi maksimal 200 karakter.");
      return;
    }

    if (!selectedFile) {
      setError("File dokumentasi wajib dipilih.");
      return;
    }

    const allowed =
      selectedFile.type.startsWith("image/") ||
      selectedFile.type.startsWith("audio/") ||
      selectedFile.type.startsWith("video/");

    if (!allowed) {
      setError(
        "File hanya dapat berupa gambar, audio, atau video."
      );
      return;
    }

    setSaving(true);

    try {
      const body = new FormData();

      body.append(
        "pengetahuan_id",
        String(pengumpulan.pengetahuan_id)
      );

      body.append(
        "pengumpulan_pengolahan_id",
        String(pengumpulan.id)
      );

      body.append(
        "nama_dokumentasi",
        form.nama_dokumentasi.trim()
      );

      body.append("file", selectedFile);

      const response = await fetch(
        `${API}/pengetahuan/dokumentasi/file`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
          body,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Gagal mengunggah file dokumentasi."
        );
      }

      setMessage(
        result?.message ||
          "File dokumentasi berhasil diunggah."
      );

      setShowForm(false);
      resetForm();
      await fetchDokumentasi();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengunggah file dokumentasi."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    clearNotification();

    if (mode === "Teks") {
      await saveTeks();
      return;
    }

    await saveFile();
  };

  const handleDelete = async (item: DokumentasiItem) => {
    const confirmed = window.confirm(
      `Hapus dokumentasi "${item.nama_dokumentasi}"?`
    );

    if (!confirmed) {
      return;
    }

    try {
      clearNotification();

      const response = await fetch(
        `${API}/pengetahuan/dokumentasi/${item.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result?.message ||
            "Gagal menghapus dokumentasi."
        );
      }

      setMessage(
        result?.message ||
          "Dokumentasi berhasil dihapus."
      );

      await fetchDokumentasi();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus dokumentasi."
      );
    }
  };

  const handleOpenFile = async (item: DokumentasiItem) => {
    try {
      clearNotification();
      setOpeningFile(item.id);

      const response = await fetch(
        `${API}/pengetahuan/dokumentasi/${item.id}/file`,
        {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        }
      );

      if (!response.ok) {
        let result: any = null;

        try {
          result = await response.json();
        } catch {
          result = null;
        }

        throw new Error(
          result?.message ||
            "Gagal membuka file dokumentasi."
        );
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      window.open(objectUrl, "_blank", "noopener,noreferrer");

      window.setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
      }, 60000);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal membuka file dokumentasi."
      );
    } finally {
      setOpeningFile(null);
    }
  };

  const getPengumpulanLabel = (
    item: DokumentasiItem
  ) => {
    const pengumpulan = pengumpulanItems.find(
      (value) =>
        Number(value.id) ===
        Number(item.pengumpulan_pengolahan_id)
    );

    if (!pengumpulan) {
      return "-";
    }

    return `${pengumpulan.kode_pengetahuan} - ${pengumpulan.tanggal_pengumpulan}`;
  };

  return (
    <>
      {message && (
        <div className="mt-6 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Dokumentasi Pengetahuan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Dokumentasi hasil pengumpulan dan pengolahan
              pengetahuan dalam bentuk teks, gambar, audio,
              atau video.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleTambah}
              disabled={pengumpulanItems.length === 0}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Tambah Dokumentasi
            </button>
          )}
        </div>

        <div className="p-5">
          {pengumpulanItems.length === 0 && (
            <div className="mb-5 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Tambahkan data Pengumpulan & Pengolahan terlebih dahulu
              sebelum membuat dokumentasi pengetahuan.
            </div>
          )}

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari dokumentasi, pengetahuan, tipe, atau pengunggah..."
            className="mb-5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-lg"
          />

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
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
                    Data Pengumpulan
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Nama Dokumentasi
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Tipe
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Isi / File
                  </th>
                  <th className="px-3 py-3 font-semibold">
                    Pengunggah
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
                      colSpan={9}
                      className="px-4 py-8 text-center text-slate-500"
                    >
                      Memuat dokumentasi...
                    </td>
                  </tr>
                ) : filteredData.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-8 text-center text-slate-400"
                    >
                      Belum ada dokumentasi pengetahuan.
                    </td>
                  </tr>
                ) : (
                  filteredData.map((item, index) => (
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
                        {getPengumpulanLabel(item)}
                      </td>

                      <td className="px-3 py-3">
                        {item.nama_dokumentasi}
                      </td>

                      <td className="px-3 py-3">
                        <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {item.tipe_dokumentasi}
                        </span>
                      </td>

                      <td className="max-w-[300px] px-3 py-3">
                        {item.tipe_dokumentasi === "Teks" ? (
                          <span className="line-clamp-3">
                            {item.konten_teks || "-"}
                          </span>
                        ) : (
                          <div>
                            <div>{item.nama_file || "-"}</div>

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenFile(item)
                              }
                              disabled={openingFile === item.id}
                              className="mt-2 text-xs font-semibold text-blue-600 hover:underline disabled:opacity-50"
                            >
                              {openingFile === item.id
                                ? "Membuka..."
                                : "Buka File"}
                            </button>
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-3">
                        {item.pengunggah}
                      </td>

                      <td className="px-3 py-3">
                        <div className="flex justify-center gap-2">
                          {canUpdate &&
                            item.tipe_dokumentasi === "Teks" && (
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-8 w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingItem
                  ? "Edit Dokumentasi Pengetahuan"
                  : "Tambah Dokumentasi Pengetahuan"}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Hubungkan dokumentasi dengan data pengumpulan
                dan pengolahan pengetahuan.
              </p>
            </div>

            <div className="space-y-5 p-5">
              {!editingItem && (
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Bentuk Dokumentasi
                  </label>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("Teks");
                        setSelectedFile(null);
                      }}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                        mode === "Teks"
                          ? "border-slate-800 bg-slate-800 text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      Teks
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setMode("File");
                        setForm({
                          ...form,
                          konten_teks: "",
                        });
                      }}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold ${
                        mode === "File"
                          ? "border-slate-800 bg-slate-800 text-white"
                          : "border-slate-300 bg-white text-slate-700"
                      }`}
                    >
                      Gambar / Audio / Video
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Data Pengumpulan & Pengolahan
                </label>

                <select
                  value={form.pengumpulan_pengolahan_id}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      pengumpulan_pengolahan_id:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">
                    Pilih data pengumpulan
                  </option>

                  {pengumpulanItems.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.kode_pengetahuan} -{" "}
                      {item.nama_pengetahuan} -{" "}
                      {item.tanggal_pengumpulan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Nama Dokumentasi
                </label>

                <input
                  type="text"
                  value={form.nama_dokumentasi}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      nama_dokumentasi:
                        e.target.value,
                    })
                  }
                  maxLength={200}
                  placeholder="Masukkan nama dokumentasi"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              {mode === "Teks" ? (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    Konten Teks
                  </label>

                  <textarea
                    rows={7}
                    value={form.konten_teks}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        konten_teks:
                          e.target.value,
                      })
                    }
                    placeholder="Masukkan isi dokumentasi pengetahuan"
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                  />
                </div>
              ) : (
                <div>
                  <label className="mb-1 block text-sm font-semibold text-slate-700">
                    File Dokumentasi
                  </label>

                  <input
                    type="file"
                    accept="image/*,audio/*,video/*"
                    onChange={(e) =>
                      setSelectedFile(
                        e.target.files?.[0] || null
                      )
                    }
                    className="block w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
                  />

                  <p className="mt-2 text-xs text-slate-500">
                    File yang didukung: gambar, audio, dan video.
                  </p>
                </div>
              )}
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
                  : editingItem
                    ? "Simpan Perubahan"
                    : mode === "Teks"
                      ? "Simpan Dokumentasi"
                      : "Unggah Dokumentasi"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}