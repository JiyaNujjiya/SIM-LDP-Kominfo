import { useEffect, useMemo, useState } from "react";

const API = "http://localhost:5000/api";

type PerubahanItem = {
  id: number;
  kode_perubahan: string;
  detail_perubahan: string;
  lingkup: string;
  klasifikasi: string;
  status: string;
  nama_layanan?: string;
  nama_unit_pemohon?: string;
};

type ImplementasiItem = {
  id: number;
  perubahan_id: number;
  kode_perubahan: string;
  detail_perubahan: string;
  lingkup: string;
  klasifikasi: string;
  status: string;
  tanggal_rencana_pelaksanaan: string;
  jangka_waktu_pelaksanaan: string;
  unit_pelaksana_id: number;
  kode_unit_pelaksana?: string;
  nama_unit_pelaksana?: string;
  pic_implementasi_id: number;
  nama_pic_implementasi?: string;
  created_by?: number;
  dibuat_oleh?: string;
};

type UnitOption = {
  id: number;
  kode_unit: string;
  nama_unit: string;
  nama_instansi?: string;
};

type UserOption = {
  id: number;
  nama: string;
  email?: string;
  role?: string;
};

type SumberDayaItem = {
  id: number;
  implementasi_id: number;
  jenis_sumber_daya: "Manusia" | "TIK";
  deskripsi: string;
};

type AnggaranItem = {
  id: number;
  implementasi_id: number;
  alokasi_anggaran: number | string;
  skema_pembiayaan: string;
};

type IndikatorItem = {
  id: number;
  implementasi_id: number;
  indikator: string;
};

type StrategiItem = {
  id: number;
  implementasi_id: number;
  strategi_it_generik: string | null;
  deskripsi_strategi_it: string | null;
  rollback_plan: string | null;
  strategi_organisasi_generik: string | null;
  detail_strategi_organisasi: string | null;
};

type StakeholderItem = {
  id: number;
  implementasi_id: number;
  nama_stakeholder: string;
  kategori_pemangku_kepentingan: string;
  sifat_resistensi: string;
  tingkat_resistensi: string;
};

type MediaKomunikasiItem = {
  id: number;
  komunikasi_id: number;
  media_komunikasi: string;
};

type KomunikasiItem = {
  id: number;
  implementasi_id: number;
  informasi: string;
  pengirim_informan: string;
  target_audiens: string;
  tanggal_rencana_komunikasi: string;
  media_komunikasi: MediaKomunikasiItem[];
};

type PelatihanItem = {
  id: number;
  implementasi_id: number;
  nama_pelatihan: string;
  target_peserta: string;
  target_jumlah: number;
  metode_pelatihan: string;
  tanggal_rencana_pelaksanaan: string;
};

type ApprovalItem = {
  id: number;
  keputusan: string;
  catatan_keputusan?: string | null;
  nama_pic?: string;
  diputuskan_at?: string;
};

const getToken = () => localStorage.getItem("token") || "";

const getUser = () => {
  const raw = localStorage.getItem("user");

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const getPermissions = () => {
  const user = getUser();

  if (!user) {
    return [];
  }

  if (Array.isArray(user.permissions)) {
    return user.permissions;
  }

  return [];
};

const request = async (
  url: string,
  options: RequestInit = {}
) => {
  const token = getToken();

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
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
      result?.message || "Terjadi kesalahan pada server."
    );
  }

  return result;
};

const formatDate = (value?: string | null) => {
  if (!value) {
    return "-";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const formatRupiah = (
  value: number | string | null | undefined
) => {
  const number = Number(value || 0);

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
};

const getStatusClass = (status: string) => {
  if (status === "Implementasi") {
    return "bg-blue-50 text-blue-700";
  }

  if (status === "Evaluasi") {
    return "bg-purple-50 text-purple-700";
  }

  if (status === "Selesai") {
    return "bg-green-50 text-green-700";
  }

  return "bg-slate-100 text-slate-600";
};

export default function ImplementasiPerubahanPage() {
  const permissions = getPermissions();

  const canCreate =
    permissions.includes("change.create");
  const canUpdate =
    permissions.includes("change.update");
  const canDelete =
    permissions.includes("change.delete");
  const canApprove =
    permissions.includes("change.approve");
  const canReject =
    permissions.includes("change.reject");

  const [perubahanList, setPerubahanList] = useState<
    PerubahanItem[]
  >([]);

  const [selectedPerubahan, setSelectedPerubahan] =
    useState<PerubahanItem | null>(null);

  const [implementasi, setImplementasi] =
    useState<ImplementasiItem | null>(null);

  const [unitOptions, setUnitOptions] = useState<
    UnitOption[]
  >([]);

  const [userOptions, setUserOptions] = useState<
    UserOption[]
  >([]);

  const [sumberDaya, setSumberDaya] = useState<
    SumberDayaItem[]
  >([]);

  const [anggaran, setAnggaran] = useState<
    AnggaranItem[]
  >([]);

  const [indikator, setIndikator] = useState<
    IndikatorItem[]
  >([]);

  const [strategi, setStrategi] =
    useState<StrategiItem | null>(null);

  const [stakeholder, setStakeholder] = useState<
    StakeholderItem[]
  >([]);

  const [komunikasi, setKomunikasi] = useState<
    KomunikasiItem[]
  >([]);

  const [pelatihan, setPelatihan] = useState<
    PelatihanItem[]
  >([]);

  const [approvals, setApprovals] = useState<
    ApprovalItem[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] =
    useState(false);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [showImplementasiForm, setShowImplementasiForm] =
    useState(false);

  const [showStrategiForm, setShowStrategiForm] =
    useState(false);

  const [showStakeholderForm, setShowStakeholderForm] =
    useState(false);

  const [showKomunikasiForm, setShowKomunikasiForm] =
    useState(false);

  const [showPelatihanForm, setShowPelatihanForm] =
    useState(false);

  const [showApproval, setShowApproval] = useState(false);
  const [approvalAction, setApprovalAction] = useState<
    "approve" | "reject" | null
  >(null);

  const [editingStakeholder, setEditingStakeholder] =
    useState<StakeholderItem | null>(null);

  const [editingKomunikasi, setEditingKomunikasi] =
    useState<KomunikasiItem | null>(null);

  const [editingPelatihan, setEditingPelatihan] =
    useState<PelatihanItem | null>(null);

  const [implementasiForm, setImplementasiForm] = useState({
    tanggal_rencana_pelaksanaan: "",
    jangka_waktu_pelaksanaan: "",
    unit_pelaksana_id: "",
    pic_implementasi_id: "",
    sumber_daya_manusia: "",
    sumber_daya_tik: "",
    alokasi_anggaran: "",
    skema_pembiayaan: "",
    indikator_keberhasilan: [""],
  });

  const [strategiForm, setStrategiForm] = useState({
    strategi_it_generik: "",
    deskripsi_strategi_it: "",
    rollback_plan: "",
    strategi_organisasi_generik: "",
    detail_strategi_organisasi: "",
  });

  const [stakeholderForm, setStakeholderForm] = useState({
    nama_stakeholder: "",
    kategori_pemangku_kepentingan: "",
    sifat_resistensi: "",
    tingkat_resistensi: "",
  });

  const [komunikasiForm, setKomunikasiForm] = useState({
    informasi: "",
    pengirim_informan: "",
    target_audiens: "",
    tanggal_rencana_komunikasi: "",
    media_komunikasi: [""],
  });

  const [pelatihanForm, setPelatihanForm] = useState({
    nama_pelatihan: "",
    target_peserta: "",
    target_jumlah: "",
    metode_pelatihan: "",
    tanggal_rencana_pelaksanaan: "",
  });

  const [catatanKeputusan, setCatatanKeputusan] =
    useState("");

  const filteredPerubahan = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return perubahanList;
    }

    return perubahanList.filter((item) =>
      [
        item.kode_perubahan,
        item.detail_perubahan,
        item.lingkup,
        item.klasifikasi,
        item.status,
        item.nama_layanan,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        )
    );
  }, [perubahanList, search]);

  const latestApproval =
    approvals.length > 0 ? approvals[0] : null;

  const fetchPerubahan = async () => {
    setLoading(true);
    setError("");

    try {
      const result = await request(
        `${API}/perubahan`
      );

      const rows = Array.isArray(result?.data)
        ? result.data
        : [];

      setPerubahanList(
        rows.filter(
          (item: PerubahanItem) =>
            item.status === "Implementasi" ||
            item.status === "Evaluasi" ||
            item.status === "Selesai"
        )
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data perubahan."
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchOptions = async () => {
    try {
      const [unitResult, userResult] =
        await Promise.all([
          request(
            `${API}/perubahan/unit-options`
          ),
          request(
            `${API}/perubahan/user-options`
          ),
        ]);

      setUnitOptions(
        Array.isArray(unitResult?.data)
          ? unitResult.data
          : []
      );

      setUserOptions(
        Array.isArray(userResult?.data)
          ? userResult.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil data pilihan."
      );
    }
  };

  const fetchImplementasi = async (
    perubahanId: number
  ) => {
    try {
      const result = await request(
        `${API}/perubahan/${perubahanId}/implementasi`
      );

      setImplementasi(result.data || null);

      return result.data || null;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          "Data implementasi perubahan belum tersedia."
      ) {
        setImplementasi(null);
        return null;
      }

      throw err;
    }
  };

  const fetchSumberDaya = async (
    implementasiId: number
  ) => {
    const result = await request(
      `${API}/perubahan/implementasi/${implementasiId}/sumber-daya`
    );

    setSumberDaya(
      Array.isArray(result?.data)
        ? result.data
        : []
    );
  };

  const fetchAnggaran = async (
    implementasiId: number
  ) => {
    const result = await request(
      `${API}/perubahan/implementasi/${implementasiId}/anggaran`
    );

    setAnggaran(
      Array.isArray(result?.data)
        ? result.data
        : []
    );
  };

  const fetchIndikator = async (
    implementasiId: number
  ) => {
    const result = await request(
      `${API}/perubahan/implementasi/${implementasiId}/indikator-keberhasilan`
    );

    setIndikator(
      Array.isArray(result?.data)
        ? result.data
        : []
    );
  };

  const fetchStrategi = async (
    implementasiId: number
  ) => {
    try {
      const result = await request(
        `${API}/perubahan/implementasi/${implementasiId}/strategi-implementasi`
      );

      setStrategi(result.data || null);
    } catch (err) {
      if (
        err instanceof Error &&
        err.message ===
          "Strategi implementasi belum tersedia."
      ) {
        setStrategi(null);
        return;
      }

      throw err;
    }
  };

  const fetchStakeholder = async (
    implementasiId: number
  ) => {
    const result = await request(
      `${API}/perubahan/implementasi/${implementasiId}/stakeholder`
    );

    setStakeholder(
      Array.isArray(result?.data)
        ? result.data
        : []
    );
  };

  const fetchKomunikasi = async (
    implementasiId: number
  ) => {
    const result = await request(
      `${API}/perubahan/implementasi/${implementasiId}/komunikasi`
    );

    setKomunikasi(
      Array.isArray(result?.data)
        ? result.data
        : []
    );
  };

  const fetchPelatihan = async (
    implementasiId: number
  ) => {
    const result = await request(
      `${API}/perubahan/implementasi/${implementasiId}/pelatihan`
    );

    setPelatihan(
      Array.isArray(result?.data)
        ? result.data
        : []
    );
  };

  const fetchApproval = async (
    perubahanId: number
  ) => {
    const result = await request(
      `${API}/perubahan/${perubahanId}/persetujuan/pelaksanaan`
    );

    setApprovals(
      Array.isArray(result?.data)
        ? result.data
        : []
    );
  };

  const fetchDetail = async (
    item: PerubahanItem
  ) => {
    setLoadingDetail(true);
    setError("");
    setMessage("");

    try {
      setSelectedPerubahan(item);

      const implementasiData =
        await fetchImplementasi(item.id);

      await fetchApproval(item.id);

      if (implementasiData?.id) {
        await Promise.all([
          fetchSumberDaya(implementasiData.id),
          fetchAnggaran(implementasiData.id),
          fetchIndikator(implementasiData.id),
          fetchStrategi(implementasiData.id),
          fetchStakeholder(implementasiData.id),
          fetchKomunikasi(implementasiData.id),
          fetchPelatihan(implementasiData.id),
        ]);
      } else {
        setSumberDaya([]);
        setAnggaran([]);
        setIndikator([]);
        setStrategi(null);
        setStakeholder([]);
        setKomunikasi([]);
        setPelatihan([]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal mengambil detail implementasi."
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPerubahan();
    fetchOptions();
  }, []);

  const resetImplementasiForm = () => {
    setImplementasiForm({
      tanggal_rencana_pelaksanaan: "",
      jangka_waktu_pelaksanaan: "",
      unit_pelaksana_id: "",
      pic_implementasi_id: "",
      sumber_daya_manusia: "",
      sumber_daya_tik: "",
      alokasi_anggaran: "",
      skema_pembiayaan: "",
      indikator_keberhasilan: [""],
    });
  };

  const openImplementasiForm = () => {
    setError("");
    setMessage("");

    if (implementasi) {
      const sumberDayaManusia = sumberDaya.find(
        (item) => item.jenis_sumber_daya === "Manusia"
      );

      const sumberDayaTIK = sumberDaya.find(
        (item) => item.jenis_sumber_daya === "TIK"
      );

      const anggaranUtama =
        anggaran.length > 0 ? anggaran[0] : null;

      setImplementasiForm({
        tanggal_rencana_pelaksanaan:
          implementasi.tanggal_rencana_pelaksanaan?.slice(
            0,
            10
          ) || "",
        jangka_waktu_pelaksanaan:
          implementasi.jangka_waktu_pelaksanaan || "",
        unit_pelaksana_id: String(
          implementasi.unit_pelaksana_id || ""
        ),
        pic_implementasi_id: String(
          implementasi.pic_implementasi_id || ""
        ),
        sumber_daya_manusia:
          sumberDayaManusia?.deskripsi || "",
        sumber_daya_tik:
          sumberDayaTIK?.deskripsi || "",
        alokasi_anggaran: anggaranUtama
          ? String(anggaranUtama.alokasi_anggaran ?? "")
          : "",
        skema_pembiayaan:
          anggaranUtama?.skema_pembiayaan || "",
        indikator_keberhasilan:
          indikator.length > 0
            ? indikator.map((item) => item.indikator)
            : [""],
      });
    } else {
      resetImplementasiForm();
    }

    setShowImplementasiForm(true);
  };

  const handleSaveImplementasi = async () => {
    if (!selectedPerubahan) {
      return;
    }

    const indikatorBersih =
      implementasiForm.indikator_keberhasilan
        .map((item) => item.trim())
        .filter(Boolean);

    if (
      !implementasiForm.tanggal_rencana_pelaksanaan ||
      !implementasiForm.jangka_waktu_pelaksanaan.trim() ||
      !implementasiForm.unit_pelaksana_id ||
      !implementasiForm.pic_implementasi_id ||
      !implementasiForm.sumber_daya_manusia.trim() ||
      !implementasiForm.sumber_daya_tik.trim() ||
      implementasiForm.alokasi_anggaran === "" ||
      Number(implementasiForm.alokasi_anggaran) < 0 ||
      !implementasiForm.skema_pembiayaan.trim() ||
      indikatorBersih.length === 0
    ) {
      setError(
        "Seluruh data Formulir 3.1 wajib diisi dengan benar."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payloadImplementasi = {
        tanggal_rencana_pelaksanaan:
          implementasiForm.tanggal_rencana_pelaksanaan,
        jangka_waktu_pelaksanaan:
          implementasiForm.jangka_waktu_pelaksanaan.trim(),
        unit_pelaksana_id: Number(
          implementasiForm.unit_pelaksana_id
        ),
        pic_implementasi_id: Number(
          implementasiForm.pic_implementasi_id
        ),
      };

      let resultImplementasi;

      if (implementasi) {
        resultImplementasi = await request(
          `${API}/perubahan/implementasi/${implementasi.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payloadImplementasi),
          }
        );
      } else {
        resultImplementasi = await request(
          `${API}/perubahan/${selectedPerubahan.id}/implementasi`,
          {
            method: "POST",
            body: JSON.stringify(payloadImplementasi),
          }
        );
      }

      const implementasiId =
        implementasi?.id ||
        resultImplementasi.data?.id;

      if (!implementasiId) {
        throw new Error(
          "ID implementasi tidak ditemukan setelah penyimpanan."
        );
      }

      const sumberManusiaLama = sumberDaya.find(
        (item) =>
          item.jenis_sumber_daya === "Manusia"
      );

      const sumberTIKLama = sumberDaya.find(
        (item) =>
          item.jenis_sumber_daya === "TIK"
      );

      if (sumberManusiaLama) {
        await request(
          `${API}/perubahan/sumber-daya/${sumberManusiaLama.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              jenis_sumber_daya: "Manusia",
              deskripsi:
                implementasiForm.sumber_daya_manusia.trim(),
            }),
          }
        );
      } else {
        await request(
          `${API}/perubahan/implementasi/${implementasiId}/sumber-daya`,
          {
            method: "POST",
            body: JSON.stringify({
              jenis_sumber_daya: "Manusia",
              deskripsi:
                implementasiForm.sumber_daya_manusia.trim(),
            }),
          }
        );
      }

      if (sumberTIKLama) {
        await request(
          `${API}/perubahan/sumber-daya/${sumberTIKLama.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              jenis_sumber_daya: "TIK",
              deskripsi:
                implementasiForm.sumber_daya_tik.trim(),
            }),
          }
        );
      } else {
        await request(
          `${API}/perubahan/implementasi/${implementasiId}/sumber-daya`,
          {
            method: "POST",
            body: JSON.stringify({
              jenis_sumber_daya: "TIK",
              deskripsi:
                implementasiForm.sumber_daya_tik.trim(),
            }),
          }
        );
      }

      const anggaranLama =
        anggaran.length > 0
          ? anggaran[0]
          : null;

      const payloadAnggaran = {
        alokasi_anggaran: Number(
          implementasiForm.alokasi_anggaran
        ),
        skema_pembiayaan:
          implementasiForm.skema_pembiayaan.trim(),
      };

      if (anggaranLama) {
        await request(
          `${API}/perubahan/anggaran/${anggaranLama.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payloadAnggaran),
          }
        );
      } else {
        await request(
          `${API}/perubahan/implementasi/${implementasiId}/anggaran`,
          {
            method: "POST",
            body: JSON.stringify(payloadAnggaran),
          }
        );
      }

      for (
        let index = 0;
        index < indikatorBersih.length;
        index++
      ) {
        const indikatorLama =
          indikator[index];

        if (indikatorLama) {
          await request(
            `${API}/perubahan/indikator-keberhasilan/${indikatorLama.id}`,
            {
              method: "PUT",
              body: JSON.stringify({
                indikator:
                  indikatorBersih[index],
              }),
            }
          );
        } else {
          await request(
            `${API}/perubahan/implementasi/${implementasiId}/indikator-keberhasilan`,
            {
              method: "POST",
              body: JSON.stringify({
                indikator:
                  indikatorBersih[index],
              }),
            }
          );
        }
      }

      if (
        indikator.length >
        indikatorBersih.length
      ) {
        const indikatorDihapus =
          indikator.slice(
            indikatorBersih.length
          );

        for (const item of indikatorDihapus) {
          await request(
            `${API}/perubahan/indikator-keberhasilan/${item.id}`,
            {
              method: "DELETE",
            }
          );
        }
      }

      const refreshedImplementasi =
        await fetchImplementasi(
          selectedPerubahan.id
        );

      if (refreshedImplementasi?.id) {
        await Promise.all([
          fetchSumberDaya(
            refreshedImplementasi.id
          ),
          fetchAnggaran(
            refreshedImplementasi.id
          ),
          fetchIndikator(
            refreshedImplementasi.id
          ),
          fetchStrategi(
            refreshedImplementasi.id
          ),
          fetchStakeholder(
            refreshedImplementasi.id
          ),
          fetchKomunikasi(
            refreshedImplementasi.id
          ),
          fetchPelatihan(
            refreshedImplementasi.id
          ),
        ]);
      }

      setShowImplementasiForm(false);

      setMessage(
        "Formulir 3.1 berhasil disimpan."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan Formulir 3.1."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteImplementasi = async () => {
    if (!implementasi || !selectedPerubahan) {
      return;
    }

    const confirmed = window.confirm(
      "Hapus data implementasi perubahan ini?"
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await request(
        `${API}/perubahan/implementasi/${implementasi.id}`,
        {
          method: "DELETE",
        }
      );

      setImplementasi(null);
      setSumberDaya([]);
      setAnggaran([]);
      setIndikator([]);
      setStrategi(null);
      setStakeholder([]);
      setKomunikasi([]);
      setPelatihan([]);

      setMessage(
        result.message ||
          "Data implementasi berhasil dihapus."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data implementasi."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIndikator = async (
    id: number
  ) => {
    if (!implementasi) {
      return;
    }

    if (
      !window.confirm(
        "Hapus indikator keberhasilan ini?"
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await request(
        `${API}/perubahan/indikator-keberhasilan/${id}`,
        {
          method: "DELETE",
        }
      );

      await fetchIndikator(implementasi.id);

      setMessage(
        result.message ||
          "Indikator keberhasilan berhasil dihapus."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus indikator keberhasilan."
      );
    }
  };

  const openStrategiForm = () => {
    setError("");
    setMessage("");

    setStrategiForm({
      strategi_it_generik:
        strategi?.strategi_it_generik || "",
      deskripsi_strategi_it:
        strategi?.deskripsi_strategi_it || "",
      rollback_plan:
        strategi?.rollback_plan || "",
      strategi_organisasi_generik:
        strategi?.strategi_organisasi_generik || "",
      detail_strategi_organisasi:
        strategi?.detail_strategi_organisasi || "",
    });

    setShowStrategiForm(true);
  };

  const handleSaveStrategi = async () => {
    if (!implementasi) {
      return;
    }

    const adaStrategiIT =
      strategiForm.strategi_it_generik.trim() ||
      strategiForm.deskripsi_strategi_it.trim() ||
      strategiForm.rollback_plan.trim();

    const adaStrategiOrganisasi =
      strategiForm.strategi_organisasi_generik.trim() ||
      strategiForm.detail_strategi_organisasi.trim();

    if (
      !adaStrategiIT &&
      !adaStrategiOrganisasi
    ) {
      setError(
        "Minimal salah satu strategi IT atau strategi organisasi wajib diisi."
      );
      return;
    }

    if (
      adaStrategiIT &&
      (!strategiForm.strategi_it_generik.trim() ||
        !strategiForm.deskripsi_strategi_it.trim())
    ) {
      setError(
        "Strategi IT dan deskripsi strategi IT wajib diisi secara lengkap."
      );
      return;
    }

    if (
      adaStrategiOrganisasi &&
      (!strategiForm.strategi_organisasi_generik.trim() ||
        !strategiForm.detail_strategi_organisasi.trim())
    ) {
      setError(
        "Strategi organisasi dan detail strategi organisasi wajib diisi secara lengkap."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        strategi_it_generik:
          strategiForm.strategi_it_generik,
        deskripsi_strategi_it:
          strategiForm.deskripsi_strategi_it,
        rollback_plan:
          strategiForm.rollback_plan,
        strategi_organisasi_generik:
          strategiForm.strategi_organisasi_generik,
        detail_strategi_organisasi:
          strategiForm.detail_strategi_organisasi,
      };

      let result;

      if (strategi) {
        result = await request(
          `${API}/perubahan/strategi-implementasi/${strategi.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        result = await request(
          `${API}/perubahan/implementasi/${implementasi.id}/strategi-implementasi`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      await fetchStrategi(implementasi.id);

      setShowStrategiForm(false);

      setMessage(
        result.message ||
          "Strategi implementasi berhasil disimpan."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan strategi implementasi."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStrategi = async () => {
    if (!strategi || !implementasi) {
      return;
    }

    if (
      !window.confirm(
        "Hapus strategi implementasi ini?"
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await request(
        `${API}/perubahan/strategi-implementasi/${strategi.id}`,
        {
          method: "DELETE",
        }
      );

      setStrategi(null);

      setMessage(
        result.message ||
          "Strategi implementasi berhasil dihapus."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus strategi implementasi."
      );
    }
  };

  const openStakeholderForm = (
    item?: StakeholderItem
  ) => {
    setError("");
    setMessage("");

    if (item) {
      setEditingStakeholder(item);

      setStakeholderForm({
        nama_stakeholder:
          item.nama_stakeholder,
        kategori_pemangku_kepentingan:
          item.kategori_pemangku_kepentingan,
        sifat_resistensi:
          item.sifat_resistensi,
        tingkat_resistensi:
          item.tingkat_resistensi,
      });
    } else {
      setEditingStakeholder(null);

      setStakeholderForm({
        nama_stakeholder: "",
        kategori_pemangku_kepentingan: "",
        sifat_resistensi: "",
        tingkat_resistensi: "",
      });
    }

    setShowStakeholderForm(true);
  };

  const handleSaveStakeholder = async () => {
    if (!implementasi) {
      return;
    }

    if (
      !stakeholderForm.nama_stakeholder.trim() ||
      !stakeholderForm.kategori_pemangku_kepentingan.trim() ||
      !stakeholderForm.sifat_resistensi.trim() ||
      !stakeholderForm.tingkat_resistensi.trim()
    ) {
      setError(
        "Seluruh data stakeholder wajib diisi."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        nama_stakeholder:
          stakeholderForm.nama_stakeholder.trim(),
        kategori_pemangku_kepentingan:
          stakeholderForm.kategori_pemangku_kepentingan.trim(),
        sifat_resistensi:
          stakeholderForm.sifat_resistensi.trim(),
        tingkat_resistensi:
          stakeholderForm.tingkat_resistensi.trim(),
      };

      let result;

      if (editingStakeholder) {
        result = await request(
          `${API}/perubahan/stakeholder/${editingStakeholder.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        result = await request(
          `${API}/perubahan/implementasi/${implementasi.id}/stakeholder`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      await fetchStakeholder(
        implementasi.id
      );

      setShowStakeholderForm(false);
      setEditingStakeholder(null);

      setMessage(
        result.message ||
          "Data stakeholder berhasil disimpan."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan stakeholder."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteStakeholder = async (
    id: number
  ) => {
    if (!implementasi) {
      return;
    }

    if (
      !window.confirm(
        "Hapus stakeholder ini?"
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await request(
        `${API}/perubahan/stakeholder/${id}`,
        {
          method: "DELETE",
        }
      );

      await fetchStakeholder(
        implementasi.id
      );

      setMessage(
        result.message ||
          "Stakeholder berhasil dihapus."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus stakeholder."
      );
    }
  };

  const openKomunikasiForm = (
    item?: KomunikasiItem
  ) => {
    setError("");
    setMessage("");

    if (item) {
      setEditingKomunikasi(item);

      setKomunikasiForm({
        informasi: item.informasi,
        pengirim_informan:
          item.pengirim_informan,
        target_audiens:
          item.target_audiens,
        tanggal_rencana_komunikasi:
          item.tanggal_rencana_komunikasi?.slice(
            0,
            10
          ) || "",
        media_komunikasi:
          item.media_komunikasi.length > 0
            ? item.media_komunikasi.map(
                (media) =>
                  media.media_komunikasi
              )
            : [""],
      });
    } else {
      setEditingKomunikasi(null);

      setKomunikasiForm({
        informasi: "",
        pengirim_informan: "",
        target_audiens: "",
        tanggal_rencana_komunikasi: "",
        media_komunikasi: [""],
      });
    }

    setShowKomunikasiForm(true);
  };

  const updateMediaKomunikasi = (
    index: number,
    value: string
  ) => {
    const media = [
      ...komunikasiForm.media_komunikasi,
    ];

    media[index] = value;

    setKomunikasiForm({
      ...komunikasiForm,
      media_komunikasi: media,
    });
  };

  const addMediaKomunikasi = () => {
    setKomunikasiForm({
      ...komunikasiForm,
      media_komunikasi: [
        ...komunikasiForm.media_komunikasi,
        "",
      ],
    });
  };

  const removeMediaKomunikasi = (
    index: number
  ) => {
    if (
      komunikasiForm.media_komunikasi.length === 1
    ) {
      return;
    }

    setKomunikasiForm({
      ...komunikasiForm,
      media_komunikasi:
        komunikasiForm.media_komunikasi.filter(
          (_, currentIndex) =>
            currentIndex !== index
        ),
    });
  };

  const handleSaveKomunikasi = async () => {
    if (!implementasi) {
      return;
    }

    const media =
      komunikasiForm.media_komunikasi
        .map((item) => item.trim())
        .filter(Boolean);

    if (
      !komunikasiForm.informasi.trim() ||
      !komunikasiForm.pengirim_informan.trim() ||
      !komunikasiForm.target_audiens.trim() ||
      !komunikasiForm.tanggal_rencana_komunikasi ||
      media.length === 0
    ) {
      setError(
        "Informasi, pengirim, target audiens, tanggal, dan minimal satu media komunikasi wajib diisi."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        informasi:
          komunikasiForm.informasi.trim(),
        pengirim_informan:
          komunikasiForm.pengirim_informan.trim(),
        target_audiens:
          komunikasiForm.target_audiens.trim(),
        tanggal_rencana_komunikasi:
          komunikasiForm.tanggal_rencana_komunikasi,
        media_komunikasi: media,
      };

      let result;

      if (editingKomunikasi) {
        result = await request(
          `${API}/perubahan/komunikasi/${editingKomunikasi.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        result = await request(
          `${API}/perubahan/implementasi/${implementasi.id}/komunikasi`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      await fetchKomunikasi(
        implementasi.id
      );

      setShowKomunikasiForm(false);
      setEditingKomunikasi(null);

      setMessage(
        result.message ||
          "Rencana komunikasi berhasil disimpan."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan rencana komunikasi."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteKomunikasi = async (
    id: number
  ) => {
    if (!implementasi) {
      return;
    }

    if (
      !window.confirm(
        "Hapus rencana komunikasi ini?"
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await request(
        `${API}/perubahan/komunikasi/${id}`,
        {
          method: "DELETE",
        }
      );

      await fetchKomunikasi(
        implementasi.id
      );

      setMessage(
        result.message ||
          "Rencana komunikasi berhasil dihapus."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus rencana komunikasi."
      );
    }
  };

  const openPelatihanForm = (
    item?: PelatihanItem
  ) => {
    setError("");
    setMessage("");

    if (item) {
      setEditingPelatihan(item);

      setPelatihanForm({
        nama_pelatihan:
          item.nama_pelatihan,
        target_peserta:
          item.target_peserta,
        target_jumlah: String(
          item.target_jumlah
        ),
        metode_pelatihan:
          item.metode_pelatihan,
        tanggal_rencana_pelaksanaan:
          item.tanggal_rencana_pelaksanaan?.slice(
            0,
            10
          ) || "",
      });
    } else {
      setEditingPelatihan(null);

      setPelatihanForm({
        nama_pelatihan: "",
        target_peserta: "",
        target_jumlah: "",
        metode_pelatihan: "",
        tanggal_rencana_pelaksanaan: "",
      });
    }

    setShowPelatihanForm(true);
  };

  const handleSavePelatihan = async () => {
    if (!implementasi) {
      return;
    }

    if (
      !pelatihanForm.nama_pelatihan.trim() ||
      !pelatihanForm.target_peserta.trim() ||
      !pelatihanForm.target_jumlah ||
      Number(pelatihanForm.target_jumlah) <= 0 ||
      !pelatihanForm.metode_pelatihan.trim() ||
      !pelatihanForm.tanggal_rencana_pelaksanaan
    ) {
      setError(
        "Seluruh data pelatihan wajib diisi dengan benar."
      );
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const payload = {
        nama_pelatihan:
          pelatihanForm.nama_pelatihan.trim(),
        target_peserta:
          pelatihanForm.target_peserta.trim(),
        target_jumlah: Number(
          pelatihanForm.target_jumlah
        ),
        metode_pelatihan:
          pelatihanForm.metode_pelatihan.trim(),
        tanggal_rencana_pelaksanaan:
          pelatihanForm.tanggal_rencana_pelaksanaan,
      };

      let result;

      if (editingPelatihan) {
        result = await request(
          `${API}/perubahan/pelatihan/${editingPelatihan.id}`,
          {
            method: "PUT",
            body: JSON.stringify(payload),
          }
        );
      } else {
        result = await request(
          `${API}/perubahan/implementasi/${implementasi.id}/pelatihan`,
          {
            method: "POST",
            body: JSON.stringify(payload),
          }
        );
      }

      await fetchPelatihan(
        implementasi.id
      );

      setShowPelatihanForm(false);
      setEditingPelatihan(null);

      setMessage(
        result.message ||
          "Data pelatihan berhasil disimpan."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan data pelatihan."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePelatihan = async (
    id: number
  ) => {
    if (!implementasi) {
      return;
    }

    if (
      !window.confirm(
        "Hapus data pelatihan ini?"
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    try {
      const result = await request(
        `${API}/perubahan/pelatihan/${id}`,
        {
          method: "DELETE",
        }
      );

      await fetchPelatihan(
        implementasi.id
      );

      setMessage(
        result.message ||
          "Data pelatihan berhasil dihapus."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menghapus data pelatihan."
      );
    }
  };

  const openApproval = (
    action: "approve" | "reject"
  ) => {
    setApprovalAction(action);
    setCatatanKeputusan("");
    setShowApproval(true);
    setError("");
    setMessage("");
  };

  const handleSaveApproval = async () => {
    if (
      !selectedPerubahan ||
      !approvalAction
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const result = await request(
        `${API}/perubahan/${selectedPerubahan.id}/persetujuan/pelaksanaan/${approvalAction}`,
        {
          method: "POST",
          body: JSON.stringify({
            catatan_keputusan:
              catatanKeputusan.trim() || null,
          }),
        }
      );

      await fetchApproval(
        selectedPerubahan.id
      );

      await fetchPerubahan();

      setShowApproval(false);
      setApprovalAction(null);
      setCatatanKeputusan("");

      setMessage(
        result.message ||
          "Keputusan pelaksanaan berhasil disimpan."
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Gagal menyimpan keputusan pelaksanaan."
      );
    } finally {
      setSaving(false);
    }
  };

  const kembaliKeDaftar = () => {
    setSelectedPerubahan(null);
    setImplementasi(null);
    setSumberDaya([]);
    setAnggaran([]);
    setIndikator([]);
    setStrategi(null);
    setStakeholder([]);
    setKomunikasi([]);
    setPelatihan([]);
    setApprovals([]);
    setError("");
    setMessage("");
  };

    if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Memuat data implementasi perubahan...
      </div>
    );
  }

  if (!selectedPerubahan) {
    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">
            MPR03 - Implementasi Perubahan
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Pelaksanaan strategi dan rencana implementasi perubahan Layanan Digital Pemerintah.
          </p>
        </div>

       <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-2">
            {[1, 2, 3, 4, 5].map((step, index) => {
              const labels = [
                "Perencanaan",
                "Analisis",
                "Implementasi",
                "Evaluasi",
                "Pencatatan / Logbook",
              ];

              const active = step === 3;

              return (
                <div
                  key={step}
                  className="flex flex-1 items-start"
                >
                  <div className="flex min-w-[110px] flex-col items-center text-center">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                        active
                          ? "border-slate-800 bg-slate-800 text-white"
                          : "border-slate-300 bg-white text-slate-500"
                      }`}
                    >
                      {step}
                    </div>

                    <span
                      className={`mt-2 text-xs ${
                        active
                          ? "font-semibold text-slate-800"
                          : "text-slate-500"
                      }`}
                    >
                      {labels[index]}
                    </span>
                  </div>

                  {index < 4 && (
                    <div className="mt-[18px] h-px flex-1 bg-slate-200" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Daftar Perubahan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pilih perubahan yang telah masuk tahap implementasi.
            </p>
          </div>

          <div className="p-5">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari ID perubahan, layanan, detail, lingkup, klasifikasi, atau status..."
              className="mb-5 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-md"
            />

            {error && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {message && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {message}
              </div>
            )}

            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full table-fixed">
                <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">
                      ID Perubahan
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Layanan Digital
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Detail Perubahan
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Klasifikasi
                    </th>
                    <th className="px-4 py-3 font-semibold">
                      Lingkup
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Status
                    </th>
                    <th className="px-4 py-3 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200">
                  {filteredPerubahan.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-10 text-center text-sm text-slate-400"
                      >
                        Belum ada perubahan yang dapat masuk tahap implementasi.
                      </td>
                    </tr>
                  ) : (
                    filteredPerubahan.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-4 align-top font-semibold text-slate-800">
                          {item.kode_perubahan}
                        </td>

                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {item.nama_layanan || "-"}
                        </td>

                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {item.detail_perubahan}
                        </td>

                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {item.klasifikasi}
                        </td>

                        <td className="px-4 py-4 align-top text-sm text-slate-700">
                          {item.lingkup}
                        </td>

                        <td className="px-4 py-4 text-center align-top">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                              item.status
                            )}`}
                          >
                            {item.status}
                          </span>
                        </td>

                        <td className="px-4 py-4 text-center align-top">
                          <button
                            type="button"
                            onClick={() => fetchDetail(item)}
                            className="whitespace-nowrap rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                          >
                            Implementasi
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          MPR03 - Implementasi Perubahan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Pelaksanaan strategi dan rencana implementasi perubahan Layanan Digital Pemerintah.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white px-6 py-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          {[1, 2, 3, 4, 5].map((step, index) => {
            const labels = [
              "Perencanaan",
              "Analisis",
              "Implementasi",
              "Evaluasi",
              "Pencatatan / Logbook",
            ];

            const active = step === 3;

            return (
              <div
                key={step}
                className="flex flex-1 items-center"
              >
                <div className="flex min-w-[110px] flex-col items-center text-center">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold ${
                      active
                        ? "border-slate-800 bg-slate-800 text-white"
                        : "border-slate-300 bg-white text-slate-500"
                    }`}
                  >
                    {step}
                  </div>

                  <span
                    className={`mt-2 text-sm ${
                      active
                        ? "font-semibold text-slate-900"
                        : "text-slate-500"
                    }`}
                  >
                    {labels[index]}
                  </span>
                </div>

                {step < 5 && (
                  <div className="mx-4 h-px flex-1 bg-slate-200" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-xl font-semibold text-slate-900">
                {selectedPerubahan.kode_perubahan}
              </h2>

              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                  selectedPerubahan.status
                )}`}
              >
                {selectedPerubahan.status}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={kembaliKeDaftar}
            className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Kembali ke Daftar
          </button>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Klasifikasi
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              {selectedPerubahan.klasifikasi}
            </p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Lingkup
            </p>
            <p className="mt-1 font-semibold text-slate-800">
              {selectedPerubahan.lingkup}
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="text-xs font-semibold uppercase text-slate-500">
              Detail Perubahan
            </p>
            <p className="mt-1 text-sm text-slate-800">
              {selectedPerubahan.detail_perubahan}
            </p>
          </div>
        </div>
      </div>

      {loadingDetail ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm">
          Memuat detail implementasi...
        </div>
      ) : (
        <>
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 p-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Formulir 3.1 - Informasi Umum Perubahan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Informasi pelaksanaan, sumber daya, anggaran, PIC, dan indikator keberhasilan.
                </p>
              </div>

              {canCreate && !implementasi && (
                <button
                  type="button"
                  onClick={openImplementasiForm}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                >
                  Tambah Implementasi
                </button>
              )}

              {implementasi && canUpdate && (
                <div className="flex gap-2">
                  {canDelete && (
                    <button
                      type="button"
                      onClick={handleDeleteImplementasi}
                      className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                      Hapus
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={openImplementasiForm}
                    className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            {!implementasi ? (
              <div className="p-10 text-center text-sm text-slate-400">
                Data implementasi belum tersedia.
              </div>
            ) : (
              <>
                <div className="grid gap-5 p-6 md:grid-cols-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Tanggal Pelaksanaan
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {formatDate(
                        implementasi.tanggal_rencana_pelaksanaan
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Jangka Waktu
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {implementasi.jangka_waktu_pelaksanaan}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      Unit Pelaksana
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {implementasi.nama_unit_pelaksana || "-"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      PIC Implementasi
                    </p>
                    <p className="mt-1 font-semibold text-slate-800">
                      {implementasi.nama_pic_implementasi || "-"}
                    </p>
                  </div>
                </div>

                <div className="border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Sumber Daya
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Sumber daya manusia dan TIK yang mendukung implementasi.
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full table-fixed">
                        <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-700">
                          <tr>
                            <th className="w-[25%] px-4 py-3">
                              Jenis
                            </th>
                            <th className="w-[75%] px-4 py-3">
                              Deskripsi
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                          {sumberDaya.length === 0 ? (
                            <tr>
                              <td
                                colSpan={2}
                                className="px-4 py-8 text-center text-sm text-slate-400"
                              >
                                Belum ada sumber daya.
                              </td>
                            </tr>
                          ) : (
                            sumberDaya.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                  {item.jenis_sumber_daya}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-700">
                                  {item.deskripsi}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Anggaran
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Alokasi anggaran dan skema pembiayaan implementasi.
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full table-fixed">
                        <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-700">
                          <tr>
                            <th className="w-[40%] px-4 py-3">
                              Alokasi Anggaran
                            </th>
                            <th className="w-[60%] px-4 py-3">
                              Skema Pembiayaan
                            </th>
                          </tr>
                        </thead>

                        <tbody className="divide-y divide-slate-200">
                          {anggaran.length === 0 ? (
                            <tr>
                              <td
                                colSpan={2}
                                className="px-4 py-8 text-center text-sm text-slate-400"
                              >
                                Belum ada data anggaran.
                              </td>
                            </tr>
                          ) : (
                            anggaran.map((item) => (
                              <tr key={item.id}>
                                <td className="px-4 py-3 font-semibold text-slate-800">
                                  {formatRupiah(
                                    item.alokasi_anggaran
                                  )}
                                </td>

                                <td className="px-4 py-3 text-sm text-slate-700">
                                  {item.skema_pembiayaan}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 p-6">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-900">
                        Indikator Keberhasilan
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Kriteria keberhasilan pelaksanaan perubahan.
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    {indikator.length === 0 ? (
                      <p className="text-center text-sm text-slate-400">
                        Belum ada indikator keberhasilan.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {indikator.map((item, index) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 p-4"
                          >
                            <div className="flex gap-3">
                              <span className="font-semibold text-slate-500">
                                {index + 1}.
                              </span>

                              <span className="text-sm text-slate-800">
                                {item.indikator}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="border-t border-slate-200 p-6">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-slate-900">
                        Persetujuan Pelaksanaan
                      </h3>

                      <p className="mt-1 text-sm text-slate-500">
                        Keputusan persetujuan pelaksanaan perubahan.
                      </p>

                      {latestApproval ? (
                        <div className="mt-4">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                              latestApproval.keputusan === "Disetujui"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {latestApproval.keputusan}
                          </span>

                          {latestApproval.nama_pic && (
                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase text-slate-500">
                                PIC Persetujuan
                              </p>

                              <p className="mt-1 text-sm font-semibold text-slate-800">
                                {latestApproval.nama_pic}
                              </p>
                            </div>
                          )}

                          {latestApproval.catatan_keputusan && (
                            <div className="mt-4">
                              <p className="text-xs font-semibold uppercase text-slate-500">
                                Catatan Keputusan
                              </p>

                              <p className="mt-1 text-sm leading-6 text-slate-700">
                                {latestApproval.catatan_keputusan}
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-slate-500">
                          Belum ada keputusan persetujuan pelaksanaan.
                        </p>
                      )}
                    </div>

                    {!latestApproval && (
                      <div className="flex shrink-0 gap-2">
                        {canReject && (
                          <button
                            type="button"
                            onClick={() => openApproval("reject")}
                            className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                          >
                            Tolak
                          </button>
                        )}

                        {canApprove && (
                          <button
                            type="button"
                            onClick={() => openApproval("approve")}
                            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                          >
                            Setujui
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

            {implementasi && (
             <>
              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Formulir 3.2 - Informasi Strategi Perubahan
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Strategi implementasi IT dan organisasi.
                    </p>
                  </div>

                  {(canCreate || canUpdate) && (
                    <div className="flex gap-2">
                      {strategi && canDelete && (
                        <button
                          type="button"
                          onClick={handleDeleteStrategi}
                          className="rounded-md border border-red-300 px-4 py-2 text-sm font-semibold text-red-600"
                        >
                          Hapus
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={openStrategiForm}
                        className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                      >
                        {strategi
                          ? "Edit Strategi"
                          : "Tambah Strategi"}
                      </button>
                    </div>
                  )}
                </div>

                {!strategi ? (
                  <div className="p-10 text-center text-sm text-slate-400">
                    Belum ada strategi implementasi.
                  </div>
                ) : (
                  <div className="grid gap-5 p-6 md:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Strategi IT
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {strategi.strategi_it_generik || "-"}
                      </p>

                      <p className="mt-4 text-xs font-semibold uppercase text-slate-500">
                        Deskripsi Strategi IT
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {strategi.deskripsi_strategi_it ||
                          "-"}
                      </p>

                      <p className="mt-4 text-xs font-semibold uppercase text-slate-500">
                        Rollback Plan
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {strategi.rollback_plan || "-"}
                      </p>
                    </div>

                    <div className="rounded-lg border border-slate-200 p-4">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Strategi Organisasi
                      </p>
                      <p className="mt-2 font-semibold text-slate-800">
                        {strategi.strategi_organisasi_generik ||
                          "-"}
                      </p>

                      <p className="mt-4 text-xs font-semibold uppercase text-slate-500">
                        Detail Strategi Organisasi
                      </p>
                      <p className="mt-2 text-sm text-slate-700">
                        {strategi.detail_strategi_organisasi ||
                          "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Formulir 3.3 - Stakeholder Perubahan
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Pemetaan stakeholder, kategori, serta tingkat resistensi.
                    </p>
                  </div>

                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => openStakeholderForm()}
                      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Tambah Stakeholder
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full table-fixed">
                      <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-700">
                        <tr>
                          <th className="w-[25%] px-4 py-3">
                            Nama Stakeholder
                          </th>
                          <th className="w-[25%] px-4 py-3">
                            Kategori
                          </th>
                          <th className="w-[20%] px-4 py-3">
                            Sifat Resistensi
                          </th>
                          <th className="w-[15%] px-4 py-3">
                            Tingkat Resistensi
                          </th>
                          <th className="w-[15%] px-4 py-3 text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {stakeholder.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-sm text-slate-400"
                            >
                              Belum ada stakeholder.
                            </td>
                          </tr>
                        ) : (
                          stakeholder.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                {item.nama_stakeholder}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {
                                  item.kategori_pemangku_kepentingan
                                }
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.sifat_resistensi}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.tingkat_resistensi}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-2">
                                  {canUpdate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openStakeholderForm(
                                          item
                                        )
                                      }
                                      className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-600"
                                    >
                                      Edit
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteStakeholder(
                                          item.id
                                        )
                                      }
                                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
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

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Formulir 3.4 - Media Komunikasi
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Rencana komunikasi perubahan kepada target audiens.
                    </p>
                  </div>

                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => openKomunikasiForm()}
                      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Tambah Komunikasi
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full table-fixed">
                      <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-700">
                        <tr>
                          <th className="w-[25%] px-4 py-3">
                            Informasi
                          </th>
                          <th className="w-[20%] px-4 py-3">
                            Pengirim
                          </th>
                          <th className="w-[20%] px-4 py-3">
                            Target Audiens
                          </th>
                          <th className="w-[15%] px-4 py-3">
                            Tanggal
                          </th>
                          <th className="w-[10%] px-4 py-3">
                            Media
                          </th>
                          <th className="w-[10%] px-4 py-3 text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {komunikasi.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-sm text-slate-400"
                            >
                              Belum ada rencana komunikasi.
                            </td>
                          </tr>
                        ) : (
                          komunikasi.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.informasi}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.pengirim_informan}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.target_audiens}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {formatDate(
                                  item.tanggal_rencana_komunikasi
                                )}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.media_komunikasi
                                  .map(
                                    (media) =>
                                      media.media_komunikasi
                                  )
                                  .join(", ")}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-2">
                                  {canUpdate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openKomunikasiForm(
                                          item
                                        )
                                      }
                                      className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-600"
                                    >
                                      Edit
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteKomunikasi(
                                          item.id
                                        )
                                      }
                                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
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

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-200 p-6">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      Formulir 3.5 - Pelatihan Perubahan
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Rencana pelatihan untuk mendukung implementasi perubahan.
                    </p>
                  </div>

                  {canCreate && (
                    <button
                      type="button"
                      onClick={() => openPelatihanForm()}
                      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
                    >
                      Tambah Pelatihan
                    </button>
                  )}
                </div>

                <div className="p-6">
                  <div className="overflow-hidden rounded-lg border border-slate-200">
                    <table className="w-full table-fixed">
                      <thead className="bg-slate-50 text-left text-sm font-semibold text-slate-700">
                        <tr>
                          <th className="w-[25%] px-4 py-3">
                            Nama Pelatihan
                          </th>
                          <th className="w-[20%] px-4 py-3">
                            Target Peserta
                          </th>
                          <th className="w-[10%] px-4 py-3">
                            Jumlah
                          </th>
                          <th className="w-[20%] px-4 py-3">
                            Metode
                          </th>
                          <th className="w-[15%] px-4 py-3">
                            Tanggal
                          </th>
                          <th className="w-[10%] px-4 py-3 text-center">
                            Aksi
                          </th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-200">
                        {pelatihan.length === 0 ? (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-4 py-8 text-center text-sm text-slate-400"
                            >
                              Belum ada data pelatihan.
                            </td>
                          </tr>
                        ) : (
                          pelatihan.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3 text-sm font-semibold text-slate-800">
                                {item.nama_pelatihan}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.target_peserta}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.target_jumlah}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {item.metode_pelatihan}
                              </td>

                              <td className="px-4 py-3 text-sm text-slate-700">
                                {formatDate(
                                  item.tanggal_rencana_pelaksanaan
                                )}
                              </td>

                              <td className="px-4 py-3">
                                <div className="flex justify-center gap-2">
                                  {canUpdate && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openPelatihanForm(
                                          item
                                        )
                                      }
                                      className="rounded-md border border-blue-200 px-3 py-1.5 text-sm font-semibold text-blue-600"
                                    >
                                      Edit
                                    </button>
                                  )}

                                  {canDelete && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeletePelatihan(
                                          item.id
                                        )
                                      }
                                      className="rounded-md border border-red-200 px-3 py-1.5 text-sm font-semibold text-red-600"
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
            </>
          )}
        </>
      )}

      {showImplementasiForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
          <div className="flex min-h-full items-start justify-center p-4">
            <div className="my-8 w-full max-w-4xl rounded-xl bg-white shadow-xl">
              <div className="sticky top-0 z-10 border-b border-slate-200 bg-white p-5">
                <h3 className="text-lg font-semibold text-slate-900">
                  {implementasi
                    ? "Edit Formulir 3.1 - Informasi Umum Perubahan"
                    : "Tambah Formulir 3.1 - Informasi Umum Perubahan"}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Lengkapi seluruh informasi pelaksanaan perubahan dalam satu formulir.
                </p>
              </div>

              <div className="space-y-6 p-5">
                <div>
                  <h4 className="mb-4 text-sm font-semibold text-slate-900">
                    Informasi Pelaksanaan
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Tanggal Pelaksanaan
                      </label>

                      <input
                        type="date"
                        value={
                          implementasiForm.tanggal_rencana_pelaksanaan
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            tanggal_rencana_pelaksanaan:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Jangka Waktu Pelaksanaan
                      </label>

                      <input
                        type="text"
                        value={
                          implementasiForm.jangka_waktu_pelaksanaan
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            jangka_waktu_pelaksanaan:
                              e.target.value,
                          })
                        }
                        placeholder="Contoh: 30 hari"
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Unit Pelaksana
                      </label>

                      <select
                        value={
                          implementasiForm.unit_pelaksana_id
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            unit_pelaksana_id:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="">
                          Pilih unit pelaksana
                        </option>

                        {unitOptions.map((unit) => (
                          <option
                            key={unit.id}
                            value={unit.id}
                          >
                            {unit.kode_unit} -{" "}
                            {unit.nama_unit}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        PIC Implementasi
                      </label>

                      <select
                        value={
                          implementasiForm.pic_implementasi_id
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            pic_implementasi_id:
                              e.target.value,
                          })
                        }
                        className="w-full rounded-md border border-slate-300 bg-white px-3 py-2"
                      >
                        <option value="">
                          Pilih PIC implementasi
                        </option>

                        {userOptions.map((user) => (
                          <option
                            key={user.id}
                            value={user.id}
                          >
                            {user.nama}
                            {user.role
                              ? ` - ${user.role}`
                              : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <h4 className="mb-4 text-sm font-semibold text-slate-900">
                    Sumber Daya yang Dibutuhkan
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Sumber Daya Manusia
                      </label>

                      <textarea
                        rows={4}
                        value={
                          implementasiForm.sumber_daya_manusia
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            sumber_daya_manusia:
                              e.target.value,
                          })
                        }
                        placeholder="Jelaskan sumber daya manusia yang dibutuhkan"
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Sumber Daya TIK
                      </label>

                      <textarea
                        rows={4}
                        value={
                          implementasiForm.sumber_daya_tik
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            sumber_daya_tik:
                              e.target.value,
                          })
                        }
                        placeholder="Jelaskan sumber daya TIK yang dibutuhkan"
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <h4 className="mb-4 text-sm font-semibold text-slate-900">
                    Anggaran dan Pembiayaan
                  </h4>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Alokasi Anggaran
                      </label>

                      <input
                        type="number"
                        min="0"
                        value={
                          implementasiForm.alokasi_anggaran
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            alokasi_anggaran:
                              e.target.value,
                          })
                        }
                        placeholder="Contoh: 6000000"
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="mb-1 block text-sm font-semibold text-slate-700">
                        Skema Pembiayaan
                      </label>

                      <input
                        type="text"
                        value={
                          implementasiForm.skema_pembiayaan
                        }
                        onChange={(e) =>
                          setImplementasiForm({
                            ...implementasiForm,
                            skema_pembiayaan:
                              e.target.value,
                          })
                        }
                        placeholder="Contoh: APBD"
                        className="w-full rounded-md border border-slate-300 px-3 py-2"
                      />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        Indikator Keberhasilan Perubahan
                      </h4>

                      <p className="mt-1 text-xs text-slate-500">
                        Tambahkan minimal satu indikator keberhasilan.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setImplementasiForm({
                          ...implementasiForm,
                          indikator_keberhasilan: [
                            ...implementasiForm.indikator_keberhasilan,
                            "",
                          ],
                        })
                      }
                      className="rounded-md border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Tambah Indikator
                    </button>
                  </div>

                  <div className="space-y-3">
                    {implementasiForm.indikator_keberhasilan.map(
                      (item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3"
                        >
                          <div className="pt-2 text-sm font-semibold text-slate-500">
                            {index + 1}.
                          </div>

                          <textarea
                            rows={3}
                            value={item}
                            onChange={(e) => {
                              const next =
                                [
                                  ...implementasiForm.indikator_keberhasilan,
                                ];

                              next[index] =
                                e.target.value;

                              setImplementasiForm({
                                ...implementasiForm,
                                indikator_keberhasilan:
                                  next,
                              });
                            }}
                            placeholder="Masukkan indikator keberhasilan"
                            className="flex-1 rounded-md border border-slate-300 px-3 py-2"
                          />

                          {implementasiForm.indikator_keberhasilan
                            .length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setImplementasiForm({
                                  ...implementasiForm,
                                  indikator_keberhasilan:
                                    implementasiForm.indikator_keberhasilan.filter(
                                      (_, currentIndex) =>
                                        currentIndex !==
                                        index
                                    ),
                                })
                              }
                              className="mt-1 rounded-md border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white p-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowImplementasiForm(false)
                  }
                  disabled={saving}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveImplementasi}
                  disabled={saving}
                  className="rounded-md bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : "Simpan Formulir 3.1"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showStakeholderForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold">
                {editingStakeholder
                  ? "Edit Stakeholder"
                  : "Tambah Stakeholder"}
              </h3>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nama stakeholder"
                value={
                  stakeholderForm.nama_stakeholder
                }
                onChange={(e) =>
                  setStakeholderForm({
                    ...stakeholderForm,
                    nama_stakeholder:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Kategori pemangku kepentingan"
                value={
                  stakeholderForm.kategori_pemangku_kepentingan
                }
                onChange={(e) =>
                  setStakeholderForm({
                    ...stakeholderForm,
                    kategori_pemangku_kepentingan:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Sifat resistensi"
                value={
                  stakeholderForm.sifat_resistensi
                }
                onChange={(e) =>
                  setStakeholderForm({
                    ...stakeholderForm,
                    sifat_resistensi:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Tingkat resistensi"
                value={
                  stakeholderForm.tingkat_resistensi
                }
                onChange={(e) =>
                  setStakeholderForm({
                    ...stakeholderForm,
                    tingkat_resistensi:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() =>
                  setShowStakeholderForm(false)
                }
                className="rounded-md border border-slate-300 px-4 py-2"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveStakeholder}
                className="rounded-md bg-slate-800 px-4 py-2 font-semibold text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showKomunikasiForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/40">
          <div className="flex min-h-full items-start justify-center p-4">
            <div className="my-8 w-full max-w-2xl rounded-xl bg-white shadow-xl">
              <div className="border-b border-slate-200 p-5">
                <h3 className="text-lg font-semibold">
                  {editingKomunikasi
                    ? "Edit Rencana Komunikasi"
                    : "Tambah Rencana Komunikasi"}
                </h3>
              </div>

              <div className="space-y-4 p-5">
                <textarea
                  rows={3}
                  placeholder="Informasi yang akan disampaikan"
                  value={
                    komunikasiForm.informasi
                  }
                  onChange={(e) =>
                    setKomunikasiForm({
                      ...komunikasiForm,
                      informasi: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />

                <input
                  type="text"
                  placeholder="Pengirim / informan"
                  value={
                    komunikasiForm.pengirim_informan
                  }
                  onChange={(e) =>
                    setKomunikasiForm({
                      ...komunikasiForm,
                      pengirim_informan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />

                <input
                  type="text"
                  placeholder="Target audiens"
                  value={
                    komunikasiForm.target_audiens
                  }
                  onChange={(e) =>
                    setKomunikasiForm({
                      ...komunikasiForm,
                      target_audiens:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />

                <input
                  type="date"
                  value={
                    komunikasiForm.tanggal_rencana_komunikasi
                  }
                  onChange={(e) =>
                    setKomunikasiForm({
                      ...komunikasiForm,
                      tanggal_rencana_komunikasi:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                />

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold">
                      Media Komunikasi
                    </label>

                    <button
                      type="button"
                      onClick={addMediaKomunikasi}
                      className="text-sm font-semibold text-blue-600"
                    >
                      Tambah Media
                    </button>
                  </div>

                  {komunikasiForm.media_komunikasi.map(
                    (media, index) => (
                      <div
                        key={index}
                        className="flex gap-2"
                      >
                        <input
                          type="text"
                          value={media}
                          onChange={(e) =>
                            updateMediaKomunikasi(
                              index,
                              e.target.value
                            )
                          }
                          placeholder="Contoh: Email, Rapat, Portal Internal"
                          className="flex-1 rounded-md border border-slate-300 px-3 py-2"
                        />

                        {komunikasiForm
                          .media_komunikasi.length >
                          1 && (
                          <button
                            type="button"
                            onClick={() =>
                              removeMediaKomunikasi(
                                index
                              )
                            }
                            className="rounded-md border border-red-200 px-3 text-red-600"
                          >
                            Hapus
                          </button>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
                <button
                  type="button"
                  onClick={() =>
                    setShowKomunikasiForm(false)
                  }
                  className="rounded-md border border-slate-300 px-4 py-2"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleSaveKomunikasi}
                  className="rounded-md bg-slate-800 px-4 py-2 font-semibold text-white"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPelatihanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold">
                {editingPelatihan
                  ? "Edit Pelatihan"
                  : "Tambah Pelatihan"}
              </h3>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <input
                type="text"
                placeholder="Nama pelatihan"
                value={
                  pelatihanForm.nama_pelatihan
                }
                onChange={(e) =>
                  setPelatihanForm({
                    ...pelatihanForm,
                    nama_pelatihan:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Target peserta"
                value={
                  pelatihanForm.target_peserta
                }
                onChange={(e) =>
                  setPelatihanForm({
                    ...pelatihanForm,
                    target_peserta:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />

              <input
                type="number"
                min="1"
                placeholder="Target jumlah"
                value={
                  pelatihanForm.target_jumlah
                }
                onChange={(e) =>
                  setPelatihanForm({
                    ...pelatihanForm,
                    target_jumlah:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />

              <input
                type="text"
                placeholder="Metode pelatihan"
                value={
                  pelatihanForm.metode_pelatihan
                }
                onChange={(e) =>
                  setPelatihanForm({
                    ...pelatihanForm,
                    metode_pelatihan:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2"
              />

              <input
                type="date"
                value={
                  pelatihanForm.tanggal_rencana_pelaksanaan
                }
                onChange={(e) =>
                  setPelatihanForm({
                    ...pelatihanForm,
                    tanggal_rencana_pelaksanaan:
                      e.target.value,
                  })
                }
                className="rounded-md border border-slate-300 px-3 py-2 md:col-span-2"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() =>
                  setShowPelatihanForm(false)
                }
                className="rounded-md border border-slate-300 px-4 py-2"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePelatihan}
                className="rounded-md bg-slate-800 px-4 py-2 font-semibold text-white"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {showApproval && approvalAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-900">
                {approvalAction === "approve"
                  ? "Setujui Pelaksanaan"
                  : "Tolak Pelaksanaan"}
              </h3>
            </div>

            <div className="p-5">
              <label className="mb-1 block text-sm font-semibold text-slate-700">
                Catatan Keputusan
              </label>

              <textarea
                rows={4}
                value={catatanKeputusan}
                onChange={(e) =>
                  setCatatanKeputusan(
                    e.target.value
                  )
                }
                placeholder="Masukkan catatan keputusan"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
              />
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowApproval(false);
                  setApprovalAction(null);
                  setCatatanKeputusan("");
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveApproval}
                disabled={saving}
                className={`rounded-md px-4 py-2 font-semibold text-white ${
                  approvalAction === "approve"
                    ? "bg-slate-800"
                    : "bg-red-600"
                }`}
              >
                {saving
                  ? "Menyimpan..."
                  : approvalAction === "approve"
                    ? "Setujui"
                    : "Tolak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}