import {FormEvent, useEffect, useMemo, useState,} from 'react';
import { useNavigate } from 'react-router-dom';

type BiaItem = {
  id: number;
  layanan_prioritas_id: number;
  kode_prioritas: string;
  alasan_prioritas: string | null;
  membutuhkan_mkb: number | boolean | null;
  pic_id: number | null;
  target_penyusunan: string | null;
  status_layanan_prioritas: string | null;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  deskripsi_layanan: string | null;
  jenis_layanan: string | null;
  dampak_operasional: string | null;
  ketergantungan_pengguna: string | null;
  solusi_alternatif: string | null;
  ketergantungan_antar_sistem: string | null;
  tingkat_kritikalitas: string | null;
  mekanisme_keberlangsungan: string | null;
  mtpd: number | null;
  rto: number | null;
  rpo: number | null;
  mbco: string | null;
  created_at: string;
  updated_at: string;
};

type LayananPrioritasOption = {
  id: number;
  kode_prioritas: string;
  nama_layanan: string;
};

type BiaForm = {
  layanan_prioritas_id: string;
  dampak_operasional: string;
  ketergantungan_pengguna: string;
  solusi_alternatif: string;
  ketergantungan_antar_sistem: string;
  tingkat_kritikalitas: string;
  mekanisme_keberlangsungan: string;
};

type InsidenItem = {
  id: number;
  bia_id: number;
  nama_insiden: string;
  jenis_kejadian: string | null;
  kategori_dampak: string | null;
  deskripsi: string | null;
};

type InsidenForm = {
  bia_id: string;
  nama_insiden: string;
  jenis_kejadian: string;
  kategori_dampak: string;
  deskripsi: string;
};

type ModuleOption = {
  id: number;
  kode_modul: string;
  nama_modul: string;
  deskripsi: string | null;
};

type InsidenModulItem = {
  id: number;
  insiden_id: number;
  module_id: number;
  keterangan_dampak: string | null;
  nama_insiden: string;
  jenis_kejadian: string | null;
  kategori_dampak: string | null;
  kode_modul: string;
  nama_modul: string;
  deskripsi_modul: string | null;
  modul_aktif: number | boolean;
};

type InsidenModulForm = {
  insiden_id: string;
  module_id: string;
  keterangan_dampak: string;
};

const emptyInsidenModulForm: InsidenModulForm = {
  insiden_id: '',
  module_id: '',
  keterangan_dampak: '',
};

type KetergantunganItem = {
  id: number;
  bia_id: number;
  jenis_ketergantungan: string;
  nama_ketergantungan: string;
  deskripsi: string | null;
  tingkat_ketergantungan: string | null;
};

type KetergantunganForm = {
  bia_id: string;
  jenis_ketergantungan: string;
  nama_ketergantungan: string;
  deskripsi: string;
  tingkat_ketergantungan: string;
};

type TargetForm = {
  mtpd: string;
  rto: string;
  rpo: string;
  mbco: string;
};

const emptyTargetForm: TargetForm = {
  mtpd: '',
  rto: '',
  rpo: '',
  mbco: '',
};

const emptyInsidenForm: InsidenForm = {
  bia_id: '',
  nama_insiden: '',
  jenis_kejadian: '',
  kategori_dampak: '',
  deskripsi: '',
};

const emptyKetergantunganForm: KetergantunganForm = {
  bia_id: '',
  jenis_ketergantungan: '',
  nama_ketergantungan: '',
  deskripsi: '',
  tingkat_ketergantungan: '',
};

const emptyBiaForm: BiaForm = {
  layanan_prioritas_id: '',
  dampak_operasional: '',
  ketergantungan_pengguna: '',
  solusi_alternatif: '',
  ketergantungan_antar_sistem: '',
  tingkat_kritikalitas: '',
  mekanisme_keberlangsungan: '',
};

const processSteps = [
  {
    number: 1,
    label: 'Penetapan Konteks',
    route: '/keberlangsungan/penetapan-konteks',
  },
  {
    number: 2,
    label: 'Analisis Dampak Bisnis',
    route: '/keberlangsungan/analisis-dampak-bisnis',
  },
  {
    number: 3,
    label: 'Strategi Keberlangsungan',
    route: '/keberlangsungan/strategi',
  },
  {
    number: 4,
    label: 'Ujicoba & Evaluasi',
    route: '/keberlangsungan/uji-evaluasi',
  },
];

const AnalisisDampakBisnisPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<BiaItem[]>([]);
  const [layananOptions, setLayananOptions] =
    useState<LayananPrioritasOption[]>([]);

  const [form, setForm] =
    useState<BiaForm>(emptyBiaForm);

  const [editingId, setEditingId] =
    useState<number | null>(null);

  const [selectedItem, setSelectedItem] =
    useState<BiaItem | null>(null);

  const [search, setSearch] =
    useState('');

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [showForm, setShowForm] =
    useState(false);

  const [showDetail, setShowDetail] =
    useState(false);

  const [message, setMessage] =
    useState('');

  const [error, setError] =
    useState('');

  const [activeForm10Tab, setActiveForm10Tab] = useState<'dampak' | 'ketergantungan'>('dampak');

  const [insiden, setInsiden] = useState<InsidenItem[]>([]);
  const [insidenForm, setInsidenForm] = useState<InsidenForm>(emptyInsidenForm);
  const [editingInsidenId, setEditingInsidenId] = useState<number | null>(null);
  const [showInsidenForm, setShowInsidenForm] = useState(false);
  const [savingInsiden, setSavingInsiden] = useState(false);

  const [ketergantungan, setKetergantungan] = useState<KetergantunganItem[]>([]);
  const [ketergantunganForm, setKetergantunganForm] = useState<KetergantunganForm>(emptyKetergantunganForm);
  const [editingKetergantunganId, setEditingKetergantunganId] = useState<number | null>(null);
  const [showKetergantunganForm, setShowKetergantunganForm] = useState(false);
  const [savingKetergantungan, setSavingKetergantungan] = useState(false);
  const [selectedTargetBiaId, setSelectedTargetBiaId] = useState<number | null>(null);
  const [targetForm, setTargetForm] = useState<TargetForm>(emptyTargetForm);
  const [showTargetForm, setShowTargetForm] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);

  const [moduleOptions, setModuleOptions] = useState<ModuleOption[]>([]);
  const [insidenModul, setInsidenModul] = useState<InsidenModulItem[]>([]);
  const [insidenModulForm, setInsidenModulForm] = useState<InsidenModulForm>(emptyInsidenModulForm);
  const [editingInsidenModulId, setEditingInsidenModulId] = useState<number | null>(null);
  const [showInsidenModulForm, setShowInsidenModulForm] = useState(false);
  const [savingInsidenModul, setSavingInsidenModul] = useState(false);

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500';

  const labelClass =
    'text-sm font-medium text-slate-700';

  const fetchBia = async () => {
    try {
      setLoading(true);
      setError('');

      const token =
        localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/bia',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Gagal mengambil data analisis dampak bisnis.'
        );
      }

      setData(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat mengambil data.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchLayananOptions = async () => {
      try {
        const token =
          localStorage.getItem('token');

        const response = await fetch(
          'http://localhost:5000/api/risiko/layanan-prioritas-options',
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type':
                'application/json',
            },
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.message ||
              result.error ||
              'Gagal mengambil daftar layanan prioritas.'
          );
        }

        setLayananOptions(
          Array.isArray(result)
            ? result
            : Array.isArray(result.data)
              ? result.data
              : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil daftar layanan prioritas.'
        );
      }
    };

    const fetchModuleOptions = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch('http://localhost:5000/api/bcp/module-options', {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal mengambil daftar modul.');
      }

      setModuleOptions(Array.isArray(result.data) ? result.data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil daftar modul.');
    }
  };

  const fetchInsidenModul = async () => {
  try {
    const token = localStorage.getItem('token');

    const results = await Promise.all(
      insiden.map(async (item) => {
        const response = await fetch(`http://localhost:5000/api/bcp/insiden/${item.id}/modul`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return [];

        const result = await response.json();
        return Array.isArray(result.data) ? result.data : [];
      })
    );

    setInsidenModul(results.flat());
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Gagal mengambil modul terkait.');
  }
};

useEffect(() => {
  if (insiden.length > 0) {
    fetchInsidenModul();
  } else {
    setInsidenModul([]);
  }
}, [insiden]);

  useEffect(() => {
    fetchBia();
    fetchLayananOptions();
    fetchModuleOptions();
  }, []);

  const availableLayananOptions =
    useMemo(() => {
      const usedIds = new Set(
        data
          .filter(
            (item) =>
              item.id !== editingId
          )
          .map((item) =>
            Number(
              item.layanan_prioritas_id
            )
          )
      );

      return layananOptions.filter(
        (option) =>
          !usedIds.has(
            Number(option.id)
          )
      );
    }, [
      data,
      layananOptions,
      editingId,
    ]);

  const filteredData = useMemo(() => {
    const keyword =
      search.trim().toLowerCase();

    if (!keyword) {
      return data;
    }

    return data.filter((item) => {
      return [
        item.kode_prioritas,
        item.kode_layanan,
        item.nama_layanan,
        item.jenis_layanan,
        item.dampak_operasional,
        item.ketergantungan_pengguna,
        item.solusi_alternatif,
        item.ketergantungan_antar_sistem,
        item.tingkat_kritikalitas,
        item.mekanisme_keberlangsungan,
      ].some((value) =>
        value
          ?.toString()
          .toLowerCase()
          .includes(keyword)
      );
    });
  }, [data, search]);

  const selectedTargetBia = useMemo(() => {
    if (data.length === 0) return null;

    if (selectedTargetBiaId !== null) {
      const selected = data.find((item) => item.id === selectedTargetBiaId);
      if (selected) return selected;
    }

    return data[0];
  }, [data, selectedTargetBiaId]);

  useEffect(() => {
    if (data.length === 0) {
      setSelectedTargetBiaId(null);
      return;
    }

    setSelectedTargetBiaId((current) => {
      if (current !== null && data.some((item) => item.id === current)) return current;
      return data[0].id;
    });
  }, [data]);

  const resetForm = () => {
    setForm(emptyBiaForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleTambah = () => {
    setEditingId(null);
    setForm(emptyBiaForm);
    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleEdit = (
    item: BiaItem
  ) => {
    setEditingId(item.id);

    setForm({
      layanan_prioritas_id:
        String(
          item.layanan_prioritas_id
        ),
      dampak_operasional:
        item.dampak_operasional || '',
      ketergantungan_pengguna:
        item.ketergantungan_pengguna ||
        '',
      solusi_alternatif:
        item.solusi_alternatif || '',
      ketergantungan_antar_sistem:
        item.ketergantungan_antar_sistem ||
        '',
      tingkat_kritikalitas:
        item.tingkat_kritikalitas || '',
      mekanisme_keberlangsungan:
        item.mekanisme_keberlangsungan ||
        '',
    });

    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleDetail = (
    item: BiaItem
  ) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleSubmit = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !editingId &&
      !form.layanan_prioritas_id
    ) {
      setError(
        'Layanan prioritas wajib dipilih.'
      );
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const token =
        localStorage.getItem('token');

      const payload: Record<
        string,
        string | number | null
      > = {
        dampak_operasional:
          form.dampak_operasional.trim() ||
          null,
        ketergantungan_pengguna:
          form.ketergantungan_pengguna.trim() ||
          null,
        solusi_alternatif:
          form.solusi_alternatif.trim() ||
          null,
        ketergantungan_antar_sistem:
          form.ketergantungan_antar_sistem.trim() ||
          null,
        tingkat_kritikalitas:
          form.tingkat_kritikalitas ||
          null,
        mekanisme_keberlangsungan:
          form.mekanisme_keberlangsungan ||
          null,
      };

      if (!editingId) {
        payload.layanan_prioritas_id =
          Number(
            form.layanan_prioritas_id
          );
      }

      const response = await fetch(
        editingId
          ? `http://localhost:5000/api/bcp/bia/${editingId}`
          : 'http://localhost:5000/api/bcp/bia',
        {
          method: editingId
            ? 'PUT'
            : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Gagal menyimpan analisis dampak bisnis.'
        );
      }

      setMessage(
        result.message ||
          'Analisis dampak bisnis berhasil disimpan.'
      );

      resetForm();
      await fetchBia();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menyimpan data.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (
    item: BiaItem
  ) => {
    const confirmed =
      window.confirm(
        `Hapus analisis dampak bisnis untuk ${item.nama_layanan}?`
      );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token =
        localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/bia/${item.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Gagal menghapus analisis dampak bisnis.'
        );
      }

      setMessage(
        result.message ||
          'Analisis dampak bisnis berhasil dihapus.'
      );

      await fetchBia();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus data.'
      );
    }
  };

  const fetchInsiden = async () => {
  try {
    const token = localStorage.getItem('token');
    const results = await Promise.all(
      data.map(async (bia) => {
        const response = await fetch(`http://localhost:5000/api/bcp/bia/${bia.id}/insiden`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return [];

        const result = await response.json();
        return Array.isArray(result.data) ? result.data : [];
      })
    );

    setInsiden(results.flat());
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Gagal mengambil data insiden.');
  }
};

useEffect(() => {
  if (data.length > 0) {
    fetchInsiden();
  } else {
    setInsiden([]);
  }
}, [data]);

const handleTambahInsiden = () => {
  setEditingInsidenId(null);
  setInsidenForm(emptyInsidenForm);
  setMessage('');
  setError('');
  setShowInsidenForm(true);
};

const handleEditInsiden = (item: InsidenItem) => {
  setEditingInsidenId(item.id);
  setInsidenForm({
    bia_id: String(item.bia_id),
    nama_insiden: item.nama_insiden,
    jenis_kejadian: item.jenis_kejadian || '',
    kategori_dampak: item.kategori_dampak || '',
    deskripsi: item.deskripsi || '',
  });
  setMessage('');
  setError('');
  setShowInsidenForm(true);
};

const resetInsidenForm = () => {
  setEditingInsidenId(null);
  setInsidenForm(emptyInsidenForm);
  setShowInsidenForm(false);
};

const handleSubmitInsiden = async (event: FormEvent) => {
  event.preventDefault();

  if (!editingInsidenId && !insidenForm.bia_id) {
    setError('Layanan prioritas wajib dipilih.');
    return;
  }

  if (!insidenForm.nama_insiden.trim()) {
    setError('Insiden / gangguan wajib diisi.');
    return;
  }

  try {
    setSavingInsiden(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');

    const payload = {
      nama_insiden: insidenForm.nama_insiden.trim(),
      jenis_kejadian: insidenForm.jenis_kejadian.trim() || null,
      kategori_dampak: insidenForm.kategori_dampak || null,
      deskripsi: insidenForm.deskripsi.trim() || null,
    };

    const response = await fetch(
      editingInsidenId
        ? `http://localhost:5000/api/bcp/insiden/${editingInsidenId}`
        : `http://localhost:5000/api/bcp/bia/${insidenForm.bia_id}/insiden`,
      {
        method: editingInsidenId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan insiden.');
    }

    setMessage(result.message || 'Insiden berhasil disimpan.');
    resetInsidenForm();
    await fetchInsiden();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan insiden.');
  } finally {
    setSavingInsiden(false);
  }
};

const handleDeleteInsiden = async (item: InsidenItem) => {
  if (!window.confirm(`Hapus insiden "${item.nama_insiden}"?`)) return;

  try {
    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/bcp/insiden/${item.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menghapus insiden.');
    }

    setMessage(result.message || 'Insiden berhasil dihapus.');
    await fetchInsiden();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus insiden.');
  }
};

const fetchKetergantungan = async () => {
  try {
    const token = localStorage.getItem('token');

    const results = await Promise.all(
      data.map(async (bia) => {
        const response = await fetch(`http://localhost:5000/api/bcp/bia/${bia.id}/ketergantungan`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) return [];

        const result = await response.json();
        return Array.isArray(result.data) ? result.data : [];
      })
    );

    setKetergantungan(results.flat());
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Gagal mengambil data ketergantungan.');
  }
};

useEffect(() => {
  if (data.length > 0) {
    fetchKetergantungan();
  } else {
    setKetergantungan([]);
  }
}, [data]);

const handleTambahKetergantungan = () => {
  setEditingKetergantunganId(null);
  setKetergantunganForm(emptyKetergantunganForm);
  setMessage('');
  setError('');
  setShowKetergantunganForm(true);
};

const handleEditKetergantungan = (item: KetergantunganItem) => {
  setEditingKetergantunganId(item.id);
  setKetergantunganForm({
    bia_id: String(item.bia_id),
    jenis_ketergantungan: item.jenis_ketergantungan,
    nama_ketergantungan: item.nama_ketergantungan,
    deskripsi: item.deskripsi || '',
    tingkat_ketergantungan: item.tingkat_ketergantungan || '',
  });
  setShowKetergantunganForm(true);
};

const resetKetergantunganForm = () => {
  setEditingKetergantunganId(null);
  setKetergantunganForm(emptyKetergantunganForm);
  setShowKetergantunganForm(false);
};

const handleSubmitKetergantungan = async (event: FormEvent) => {
  event.preventDefault();

  if (!editingKetergantunganId && !ketergantunganForm.bia_id) {
    setError('Layanan prioritas wajib dipilih.');
    return;
  }

  if (!ketergantunganForm.jenis_ketergantungan || !ketergantunganForm.nama_ketergantungan.trim()) {
    setError('Jenis dan nama ketergantungan wajib diisi.');
    return;
  }

  try {
    setSavingKetergantungan(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');

    const payload = {
      jenis_ketergantungan: ketergantunganForm.jenis_ketergantungan,
      nama_ketergantungan: ketergantunganForm.nama_ketergantungan.trim(),
      deskripsi: ketergantunganForm.deskripsi.trim() || null,
      tingkat_ketergantungan: ketergantunganForm.tingkat_ketergantungan || null,
    };

    const response = await fetch(
      editingKetergantunganId
        ? `http://localhost:5000/api/bcp/ketergantungan/${editingKetergantunganId}`
        : `http://localhost:5000/api/bcp/bia/${ketergantunganForm.bia_id}/ketergantungan`,
      {
        method: editingKetergantunganId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan ketergantungan.');
    }

    setMessage(result.message || 'Data ketergantungan berhasil disimpan.');
    resetKetergantunganForm();
    await fetchKetergantungan();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan ketergantungan.');
  } finally {
    setSavingKetergantungan(false);
  }
};

const handleEditTarget = () => {
  if (!selectedTargetBia) {
    setError('Belum ada data BIA yang dapat diedit.');
    return;
  }

  setTargetForm({
    mtpd: selectedTargetBia.mtpd === null ? '' : String(selectedTargetBia.mtpd),
    rto: selectedTargetBia.rto === null ? '' : String(selectedTargetBia.rto),
    rpo: selectedTargetBia.rpo === null ? '' : String(selectedTargetBia.rpo),
    mbco: selectedTargetBia.mbco || '',
  });

  setMessage('');
  setError('');
  setShowTargetForm(true);
};

const resetTargetForm = () => {
  setTargetForm(emptyTargetForm);
  setShowTargetForm(false);
};

const handleSubmitTarget = async (event: FormEvent) => {
  event.preventDefault();

  if (!selectedTargetBia) {
    setError('Data BIA tidak ditemukan.');
    return;
  }

  const mtpd = targetForm.mtpd === '' ? null : Number(targetForm.mtpd);
  const rto = targetForm.rto === '' ? null : Number(targetForm.rto);
  const rpo = targetForm.rpo === '' ? null : Number(targetForm.rpo);

  if (
    (mtpd !== null && (!Number.isInteger(mtpd) || mtpd < 0)) ||
    (rto !== null && (!Number.isInteger(rto) || rto < 0)) ||
    (rpo !== null && (!Number.isInteger(rpo) || rpo < 0))
  ) {
    setError('MTPD, RTO, dan RPO harus berupa bilangan bulat 0 atau lebih.');
    return;
  }

  try {
    setSavingTarget(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/bcp/bia/${selectedTargetBia.id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        mtpd,
        rto,
        rpo,
        mbco: targetForm.mbco.trim() || null,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal memperbarui target keberlangsungan.');
    }

    setMessage(result.message || 'Target keberlangsungan berhasil diperbarui.');
    resetTargetForm();
    await fetchBia();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat memperbarui target keberlangsungan.');
  } finally {
    setSavingTarget(false);
  }
};

const handleDeleteKetergantungan = async (item: KetergantunganItem) => {
  if (!window.confirm(`Hapus ketergantungan "${item.nama_ketergantungan}"?`)) return;

  try {
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/bcp/ketergantungan/${item.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menghapus data ketergantungan.');
    }

    setMessage(result.message || 'Data ketergantungan berhasil dihapus.');
    await fetchKetergantungan();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus data ketergantungan.');
  }
};

const handleTambahInsidenModul = () => {
  setEditingInsidenModulId(null);
  setInsidenModulForm(emptyInsidenModulForm);
  setMessage('');
  setError('');
  setShowInsidenModulForm(true);
};

const handleEditInsidenModul = (item: InsidenModulItem) => {
  setEditingInsidenModulId(item.id);
  setInsidenModulForm({
    insiden_id: String(item.insiden_id),
    module_id: String(item.module_id),
    keterangan_dampak: item.keterangan_dampak || '',
  });
  setMessage('');
  setError('');
  setShowInsidenModulForm(true);
};

const resetInsidenModulForm = () => {
  setEditingInsidenModulId(null);
  setInsidenModulForm(emptyInsidenModulForm);
  setShowInsidenModulForm(false);
};

const handleSubmitInsidenModul = async (event: FormEvent) => {
  event.preventDefault();

  if (!editingInsidenModulId && !insidenModulForm.insiden_id) {
    setError('Insiden wajib dipilih.');
    return;
  }

  if (!insidenModulForm.module_id) {
    setError('Modul wajib dipilih.');
    return;
  }

  try {
    setSavingInsidenModul(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');

    const payload = {
      module_id: Number(insidenModulForm.module_id),
      keterangan_dampak: insidenModulForm.keterangan_dampak.trim() || null,
    };

    const response = await fetch(
      editingInsidenModulId
        ? `http://localhost:5000/api/bcp/insiden-modul/${editingInsidenModulId}`
        : `http://localhost:5000/api/bcp/insiden/${insidenModulForm.insiden_id}/modul`,
      {
        method: editingInsidenModulId ? 'PUT' : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menyimpan modul terkait.');
    }

    setMessage(result.message || 'Modul terkait berhasil disimpan.');
    resetInsidenModulForm();
    await fetchInsidenModul();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menyimpan modul terkait.');
  } finally {
    setSavingInsidenModul(false);
  }
};

const handleDeleteInsidenModul = async (item: InsidenModulItem) => {
  if (!window.confirm(`Hapus modul "${item.nama_modul}" dari insiden ini?`)) return;

  try {
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');

    const response = await fetch(`http://localhost:5000/api/bcp/insiden-modul/${item.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal menghapus modul terkait.');
    }

    setMessage(result.message || 'Modul terkait berhasil dihapus.');
    await fetchInsidenModul();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus modul terkait.');
  }
};

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Keberlangsungan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 2 - Analisis Dampak Bisnis
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map(
            (step, index) => {
              const active =
                step.number === 2;

              return (
                <div
                  key={step.number}
                  className="flex flex-1 items-start"
                >
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        step.route
                      )
                    }
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

                  {index <
                    processSteps.length -
                      1 && (
                    <div className="mt-[18px] h-px flex-1 bg-slate-200" />
                  )}
                </div>
              );
            }
          )}
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
              Formulir 9 - Kriteria Kritikalitas Layanan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Penilaian kritikalitas
              untuk setiap layanan
              prioritas.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTambah}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tambah Data
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <input
            type="text"
            value={search}
            onChange={(event) =>
              setSearch(
                event.target.value
              )
            }
            placeholder="Cari layanan, kritikalitas, atau mekanisme..."
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1450px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  No
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  ID Layanan Prioritas
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Nama Layanan
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Dampak Operasional
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Ketergantungan Pengguna
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Solusi Alternatif
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Ketergantungan Antar Sistem
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Kritikalitas
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Mekanisme
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : filteredData.length ===
                0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Belum ada data
                    analisis dampak
                    bisnis.
                  </td>
                </tr>
              ) : (
                filteredData.map(
                  (item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 text-sm font-medium text-slate-700">
                        {
                          item.kode_prioritas
                        }
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        {
                          item.nama_layanan
                        }
                      </td>

                      <td className="max-w-[240px] px-4 py-3 text-sm text-slate-600">
                        {item.dampak_operasional ||
                          '-'}
                      </td>

                      <td className="max-w-[240px] px-4 py-3 text-sm text-slate-600">
                        {item.ketergantungan_pengguna ||
                          '-'}
                      </td>

                      <td className="max-w-[240px] px-4 py-3 text-sm text-slate-600">
                        {item.solusi_alternatif ||
                          '-'}
                      </td>

                      <td className="max-w-[240px] px-4 py-3 text-sm text-slate-600">
                        {item.ketergantungan_antar_sistem ||
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.tingkat_kritikalitas ||
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.mekanisme_keberlangsungan ||
                          '-'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleDetail(
                                item
                              )
                            }
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Detail
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleEdit(
                                item
                              )
                            }
                            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDelete(
                                item
                              )
                            }
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Hapus
                          </button>
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

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Formulir 10 - Business Impact Analysis
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Analisis dampak gangguan, target pemulihan, ketergantungan,
            dan jalur keberlangsungan layanan.
          </p>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() =>
              setActiveForm10Tab('dampak')
            }
            className={`px-5 py-3 text-sm font-semibold ${
              activeForm10Tab === 'dampak'
                ? 'border-b-2 border-slate-800 text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Analisis Dampak & Target Pemulihan
          </button>

          <button
            type="button"
            onClick={() =>
              setActiveForm10Tab('ketergantungan')
            }
            className={`px-5 py-3 text-sm font-semibold ${
              activeForm10Tab === 'ketergantungan'
                ? 'border-b-2 border-slate-800 text-slate-800'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Ketergantungan & Keberlangsungan
          </button>
        </div>

        {activeForm10Tab === 'dampak' ? (
          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  Daftar Insiden / Gangguan Potensial
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Identifikasi gangguan yang dapat memengaruhi
                  keberlangsungan layanan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTambahInsiden}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tambah Insiden
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="w-[22%] px-3 py-3">
                        Insiden / Gangguan
                      </th>

                      <th className="w-[18%] px-3 py-3">
                        Jenis Kejadian
                      </th>

                      <th className="w-[18%] px-3 py-3">
                        Kategori Dampak
                      </th>

                      <th className="w-[32%] px-3 py-3">
                        Deskripsi
                      </th>

                      <th className="w-[10%] px-3 py-3 text-center">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {insiden.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada insiden atau gangguan potensial.
                        </td>
                      </tr>
                    ) : (
                      insiden.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 align-top">
                          <td className="break-words px-3 py-3 font-semibold text-slate-800">{item.nama_insiden}</td>
                          <td className="break-words px-3 py-3">{item.jenis_kejadian || '-'}</td>
                          <td className="px-3 py-3">{item.kategori_dampak || '-'}</td>
                          <td className="break-words px-3 py-3">{item.deskripsi || '-'}</td>
                          <td className="px-3 py-3">
                            <div className="flex flex-col items-center gap-2">
                              <button type="button" onClick={() => handleEditInsiden(item)} className="w-[70px] rounded-md border border-blue-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                                Edit
                              </button>

                              <button type="button" onClick={() => handleDeleteInsiden(item)} className="w-[70px] rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200">
                <div className="flex flex-col gap-4 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h4 className="font-semibold text-slate-800">
                      Modul Terkait
                    </h4>

                    <p className="mt-1 text-sm text-slate-500">
                      Modul, fitur, fungsi, atau komponen layanan yang terdampak langsung oleh insiden.
                    </p>
                  </div>

                  <button type="button" onClick={handleTambahInsidenModul} disabled={insiden.length === 0} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                    Tambah Modul
                  </button>
                </div>

                <div className="overflow-x-auto p-4">
                  <table className="w-full table-fixed border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="w-[25%] px-3 py-3">
                          Insiden
                        </th>

                        <th className="w-[15%] px-3 py-3">
                          Kode Modul
                        </th>

                        <th className="w-[20%] px-3 py-3">
                          Nama Modul
                        </th>

                        <th className="w-[30%] px-3 py-3">
                          Keterangan Dampak
                        </th>

                        <th className="w-[10%] px-3 py-3 text-center">
                          Aksi
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {insidenModul.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-400">
                            Belum ada modul terkait.
                          </td>
                        </tr>
                      ) : (
                        insidenModul.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                            <td className="break-words px-3 py-3 font-medium text-slate-800">
                              {item.nama_insiden}
                            </td>

                            <td className="break-words px-3 py-3">
                              {item.kode_modul}
                            </td>

                            <td className="break-words px-3 py-3">
                              {item.nama_modul}
                            </td>

                            <td className="break-words px-3 py-3">
                              {item.keterangan_dampak || '-'}
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex flex-col items-center gap-2">
                                <button type="button" onClick={() => handleEditInsidenModul(item)} className="w-[70px] rounded-md border border-blue-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                                  Edit
                                </button>

                                <button type="button" onClick={() => handleDeleteInsidenModul(item)} className="w-[70px] rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                                  Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Target Keberlangsungan
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Penetapan MTPD, RTO, RPO, dan MBCO.
                    </p>
                  </div>

                  <button type="button" onClick={handleEditTarget} disabled={!selectedTargetBia} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50">
                    Edit Target
                  </button>
                </div>

                <div className="mt-4">
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Layanan Prioritas
                  </label>

                  <select
                    value={selectedTargetBia?.id ?? ''}
                    onChange={(event) => setSelectedTargetBiaId(Number(event.target.value))}
                    className="w-full max-w-lg rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                  >
                    {data.length === 0 ? (
                      <option value="">
                        Belum ada data BIA
                      </option>
                    ) : (
                      data.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.kode_prioritas} - {item.nama_layanan}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-4">
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      MTPD
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedTargetBia?.mtpd ?? '-'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      RTO
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedTargetBia?.rto ?? '-'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      RPO
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedTargetBia?.rpo ?? '-'}
                    </p>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase text-slate-500">
                      MBCO
                    </p>

                    <p className="mt-2 text-sm font-medium text-slate-800">
                      {selectedTargetBia?.mbco || '-'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200">
                <div className="border-b border-slate-200 p-4">
                  <h4 className="font-semibold text-slate-800">
                    Matriks Dampak
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Pedoman klasifikasi tingkat dampak insiden terhadap layanan.
                  </p>
                </div>

                <div className="overflow-x-auto p-4">
                  <table className="w-full table-fixed border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="w-[15%] px-4 py-3">
                          Kategori
                        </th>

                        <th className="w-[45%] px-4 py-3">
                          Ringkasan Dampak
                        </th>

                        <th className="w-[40%] px-4 py-3">
                          Insiden Umum
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr className="border-b border-slate-100 align-top">
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          Dampak Tinggi
                        </td>

                        <td className="px-4 py-4 leading-6 text-slate-700">
                          Insiden menyebabkan layanan prioritas berhenti atau hanya dapat berjalan secara sangat terbatas. Sistem utama, data kritis, atau sumber daya penting tidak tersedia sehingga operasional normal tidak dapat dilaksanakan. Dampaknya meluas ke banyak pengguna atau unit kerja dan memerlukan pemulihan secara terkoordinasi.
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          <ol className="list-decimal space-y-1 pl-5">
                            <li>Layanan prioritas berhenti.</li>
                            <li>Sistem utama atau data kritis tidak tersedia.</li>
                            <li>Pusat data atau layanan cloud utama tidak dapat digunakan.</li>
                            <li>Basis data rusak, tidak dapat diakses, atau mengalami kehilangan data.</li>
                            <li>Infrastruktur TIK utama mengalami kegagalan besar.</li>
                            <li>Gangguan berdampak pada banyak pengguna atau unit kerja.</li>
                          </ol>
                        </td>
                      </tr>

                      <tr className="border-b border-slate-100 align-top">
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          Dampak Menengah
                        </td>

                        <td className="px-4 py-4 leading-6 text-slate-700">
                          Insiden mengganggu sebagian layanan atau operasional, tetapi fungsi utama masih dapat dijalankan secara terbatas melalui prosedur alternatif, sumber daya cadangan, atau mekanisme sementara. Penanganan dan pemulihan masih dapat dilakukan oleh unit terkait.
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          <ol className="list-decimal space-y-1 pl-5">
                            <li>Sebagian fungsi layanan tidak tersedia.</li>
                            <li>Integrasi dengan sistem eksternal mengalami gangguan.</li>
                            <li>Kapasitas layanan menurun.</li>
                            <li>Sebagian perangkat atau infrastruktur tidak dapat digunakan.</li>
                            <li>Layanan harus dijalankan secara manual atau melalui prosedur alternatif.</li>
                            <li>Gangguan masih dapat ditangani oleh unit terkait.</li>
                          </ol>
                        </td>
                      </tr>

                      <tr className="align-top">
                        <td className="px-4 py-4 font-semibold text-slate-800">
                          Dampak Rendah
                        </td>

                        <td className="px-4 py-4 leading-6 text-slate-700">
                          Insiden menimbulkan gangguan kecil dan tidak memengaruhi keberlangsungan layanan utama. Operasional tetap berjalan normal atau hanya mengalami penurunan kecil serta dapat ditangani dengan cepat tanpa eskalasi tingkat tinggi.
                        </td>

                        <td className="px-4 py-4 text-slate-700">
                          <ol className="list-decimal space-y-1 pl-5">
                            <li>Gangguan pada satu perangkat kerja.</li>
                            <li>Kesalahan konfigurasi ringan.</li>
                            <li>Gangguan koneksi sementara.</li>
                            <li>Keterlambatan kecil pada proses layanan.</li>
                            <li>Kendala operasional dapat diselesaikan oleh petugas unit kerja.</li>
                            <li>Gangguan tidak memerlukan eskalasi ke tingkat manajemen.</li>
                          </ol>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-semibold text-slate-800">
                  Peta Ketergantungan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Identifikasi ketergantungan yang diperlukan untuk
                  menjaga dan memulihkan layanan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTambahKetergantungan}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tambah Ketergantungan
              </button>
            </div>

            <div className="p-5">
              <div className="overflow-x-auto">
                <table className="w-full table-fixed border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="w-[24%] px-3 py-3">
                        Jenis Ketergantungan
                      </th>

                      <th className="w-[28%] px-3 py-3">
                        Nama Ketergantungan
                      </th>

                      <th className="w-[30%] px-3 py-3">
                        Deskripsi
                      </th>

                      <th className="w-[10%] px-3 py-3">
                        Tingkat
                      </th>

                      <th className="w-[8%] px-3 py-3 text-center">
                        Aksi
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {ketergantungan.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          Belum ada data ketergantungan.
                        </td>
                      </tr>
                    ) : (
                      ketergantungan.map((item) => (
                        <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                          <td className="break-words px-3 py-3 font-semibold text-slate-800">
                            {item.jenis_ketergantungan}
                          </td>

                          <td className="break-words px-3 py-3">
                            {item.nama_ketergantungan}
                          </td>

                          <td className="break-words px-3 py-3">
                            {item.deskripsi || '-'}
                          </td>

                          <td className="px-3 py-3">
                            {item.tingkat_ketergantungan || '-'}
                          </td>

                          <td className="px-3 py-3">
                            <div className="flex flex-col items-center gap-2">
                              <button type="button" onClick={() => handleEditKetergantungan(item)} className="w-[70px] rounded-md border border-blue-200 px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50">
                                Edit
                              </button>

                              <button type="button" onClick={() => handleDeleteKetergantungan(item)} className="w-[70px] rounded-md border border-red-200 px-2 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50">
                                Hapus
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Jalur Keberlangsungan
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      Mekanisme keberlangsungan berdasarkan hasil penilaian kritikalitas layanan.
                    </p>
                  </div>

                  {selectedTargetBia?.mekanisme_keberlangsungan && (
                    <span className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700">
                      {selectedTargetBia.mekanisme_keberlangsungan}
                    </span>
                  )}
                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div
                    className={`rounded-lg border p-4 transition ${
                      selectedTargetBia?.mekanisme_keberlangsungan === 'BCP'
                        ? 'border-slate-800 bg-white ring-1 ring-slate-800'
                        : 'border-slate-200 bg-white opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Business Continuity Plan
                      </p>

                      {selectedTargetBia?.mekanisme_keberlangsungan === 'BCP' && (
                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Aktif
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-800">
                      Menjaga layanan atau aktivitas prioritas tetap berjalan selama gangguan.
                    </p>
                  </div>

                  <div
                    className={`rounded-lg border p-4 transition ${
                      selectedTargetBia?.mekanisme_keberlangsungan === 'DRP'
                        ? 'border-slate-800 bg-white ring-1 ring-slate-800'
                        : 'border-slate-200 bg-white opacity-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs font-semibold uppercase text-slate-500">
                        Disaster Recovery Plan
                      </p>

                      {selectedTargetBia?.mekanisme_keberlangsungan === 'DRP' && (
                        <span className="rounded-full bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-white">
                          Aktif
                        </span>
                      )}
                    </div>

                    <p className="mt-2 text-sm text-slate-800">
                      Memulihkan sistem, infrastruktur, aplikasi, dan data TIK setelah gangguan.
                    </p>
                  </div>
                </div>

                {!selectedTargetBia?.mekanisme_keberlangsungan && (
                  <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Mekanisme keberlangsungan belum ditentukan pada Formulir 9.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId
                    ? 'Edit Kriteria Kritikalitas Layanan'
                    : 'Tambah Kriteria Kritikalitas Layanan'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 9 Manajemen
                  Keberlangsungan.
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
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Layanan Prioritas
                  </label>

                  <select
                    value={
                      form.layanan_prioritas_id
                    }
                    disabled={
                      editingId !== null
                    }
                    required={!editingId}
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          layanan_prioritas_id:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option value="">
                      Pilih layanan
                      prioritas
                    </option>

                    {editingId && (
                      <option
                        value={
                          form.layanan_prioritas_id
                        }
                      >
                        {(() => {
                          const current =
                            data.find(
                              (
                                item
                              ) =>
                                item.id ===
                                editingId
                            );

                          if (
                            !current
                          ) {
                            return form.layanan_prioritas_id;
                          }

                          return `${current.kode_prioritas} - ${current.nama_layanan}`;
                        })()}
                      </option>
                    )}

                    {!editingId &&
                      availableLayananOptions.map(
                        (
                          option
                        ) => (
                          <option
                            key={
                              option.id
                            }
                            value={
                              option.id
                            }
                          >
                            {
                              option.kode_prioritas
                            }{' '}
                            -{' '}
                            {
                              option.nama_layanan
                            }
                          </option>
                        )
                      )}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Dampak Operasional
                    Instansi
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.dampak_operasional
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          dampak_operasional:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Ketergantungan
                    Pengguna terhadap
                    Layanan
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.ketergantungan_pengguna
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          ketergantungan_pengguna:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Solusi Alternatif
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.solusi_alternatif
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          solusi_alternatif:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <div className="md:col-span-2">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Ketergantungan
                    Antar Sistem
                  </label>

                  <textarea
                    rows={3}
                    value={
                      form.ketergantungan_antar_sistem
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          ketergantungan_antar_sistem:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  />
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Tingkat Kritikalitas
                  </label>

                  <select
                    value={
                      form.tingkat_kritikalitas
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          tingkat_kritikalitas:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Pilih tingkat
                      kritikalitas
                    </option>

                    <option value="Tinggi">
                      Tinggi
                    </option>

                    <option value="Menengah">
                      Menengah
                    </option>

                    <option value="Rendah">
                      Rendah
                    </option>
                  </select>
                </div>

                <div>
                  <label
                    className={
                      labelClass
                    }
                  >
                    Mekanisme
                    Keberlangsungan
                  </label>

                  <select
                    value={
                      form.mekanisme_keberlangsungan
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (prev) => ({
                          ...prev,
                          mekanisme_keberlangsungan:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="">
                      Pilih mekanisme
                    </option>

                    <option value="BCP">
                      BCP
                    </option>

                    <option value="DRP">
                      DRP
                    </option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={
                    resetForm
                  }
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDetail &&
        selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Detail Kriteria
                    Kritikalitas Layanan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {
                      selectedItem.kode_prioritas
                    }{' '}
                    -{' '}
                    {
                      selectedItem.nama_layanan
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setShowDetail(
                      false
                    )
                  }
                  className="text-xl text-slate-400 hover:text-slate-600"
                >
                  ×
                </button>
              </div>

              <div className="grid grid-cols-1 gap-5 p-6 md:grid-cols-2">
                <DetailField
                  label="ID Layanan Prioritas"
                  value={
                    selectedItem.kode_prioritas
                  }
                />

                <DetailField
                  label="Nama Layanan"
                  value={
                    selectedItem.nama_layanan
                  }
                />

                <DetailField
                  label="Kode Layanan"
                  value={
                    selectedItem.kode_layanan
                  }
                />

                <DetailField
                  label="Jenis Layanan"
                  value={
                    selectedItem.jenis_layanan
                  }
                />

                <DetailField
                  label="Dampak Operasional Instansi"
                  value={
                    selectedItem.dampak_operasional
                  }
                  full
                />

                <DetailField
                  label="Ketergantungan Pengguna terhadap Layanan"
                  value={
                    selectedItem.ketergantungan_pengguna
                  }
                  full
                />

                <DetailField
                  label="Solusi Alternatif"
                  value={
                    selectedItem.solusi_alternatif
                  }
                  full
                />

                <DetailField
                  label="Ketergantungan Antar Sistem"
                  value={
                    selectedItem.ketergantungan_antar_sistem
                  }
                  full
                />

                <DetailField
                  label="Tingkat Kritikalitas"
                  value={
                    selectedItem.tingkat_kritikalitas
                  }
                />

                <DetailField
                  label="Mekanisme Keberlangsungan"
                  value={
                    selectedItem.mekanisme_keberlangsungan
                  }
                />
              </div>

              <div className="flex justify-end border-t border-slate-200 px-6 py-4">
                <button
                  type="button"
                  onClick={() =>
                    setShowDetail(
                      false
                    )
                  }
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {showInsidenForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingInsidenId ? 'Edit Insiden / Gangguan Potensial' : 'Tambah Insiden / Gangguan Potensial'}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Formulir 10 Business Impact Analysis
                  </p>
                </div>

                <button type="button" onClick={resetInsidenForm} className="text-xl text-slate-400 hover:text-slate-600">
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitInsiden} className="p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Layanan Prioritas
                    </label>

                    <select
                      required={!editingInsidenId}
                      disabled={editingInsidenId !== null}
                      value={insidenForm.bia_id}
                      onChange={(event) =>
                        setInsidenForm((prev) => ({
                          ...prev,
                          bia_id: event.target.value,
                        }))
                      }
                      className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                    >
                      <option value="">
                        Pilih layanan prioritas
                      </option>

                      {editingInsidenId && (
                        <option value={insidenForm.bia_id}>
                          {(() => {
                            const bia = data.find((item) => item.id === Number(insidenForm.bia_id));
                            return bia ? `${bia.kode_prioritas} - ${bia.nama_layanan}` : insidenForm.bia_id;
                          })()}
                        </option>
                      )}

                      {!editingInsidenId &&
                        data.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.kode_prioritas} - {item.nama_layanan}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Insiden / Gangguan Potensial
                    </label>

                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={insidenForm.nama_insiden}
                      onChange={(event) =>
                        setInsidenForm((prev) => ({
                          ...prev,
                          nama_insiden: event.target.value,
                        }))
                      }
                      placeholder="Contoh: Server aplikasi tidak dapat diakses"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Jenis Kejadian
                    </label>

                    <input
                      type="text"
                      maxLength={100}
                      value={insidenForm.jenis_kejadian}
                      onChange={(event) =>
                        setInsidenForm((prev) => ({
                          ...prev,
                          jenis_kejadian: event.target.value,
                        }))
                      }
                      placeholder="Contoh: Kegagalan Server"
                      className={inputClass}
                    />
                  </div>

                  <div>
                    <label className={labelClass}>
                      Kategori Dampak
                    </label>

                    <select
                      value={insidenForm.kategori_dampak}
                      onChange={(event) =>
                        setInsidenForm((prev) => ({
                          ...prev,
                          kategori_dampak: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">
                        Pilih kategori dampak
                      </option>
                      <option value="Tinggi">Tinggi</option>
                      <option value="Menengah">Menengah</option>
                      <option value="Rendah">Rendah</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Deskripsi
                    </label>

                    <textarea
                      rows={4}
                      value={insidenForm.deskripsi}
                      onChange={(event) =>
                        setInsidenForm((prev) => ({
                          ...prev,
                          deskripsi: event.target.value,
                        }))
                      }
                      placeholder="Jelaskan dampak insiden terhadap layanan."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button type="button" onClick={resetInsidenForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Batal
                  </button>

                  <button type="submit" disabled={savingInsiden} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                    {savingInsiden ? 'Menyimpan...' : editingInsidenId ? 'Simpan Perubahan' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTargetForm && selectedTargetBia && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    Edit Target Keberlangsungan
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {selectedTargetBia.kode_prioritas} - {selectedTargetBia.nama_layanan}
                  </p>
                </div>

                <button type="button" onClick={resetTargetForm} className="text-xl text-slate-400 hover:text-slate-600">
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitTarget} className="p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>
                      MTPD
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={targetForm.mtpd}
                      onChange={(event) =>
                        setTargetForm((prev) => ({
                          ...prev,
                          mtpd: event.target.value,
                        }))
                      }
                      placeholder="Contoh: 8"
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Maximum Tolerable Period of Disruption.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>
                      RTO
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={targetForm.rto}
                      onChange={(event) =>
                        setTargetForm((prev) => ({
                          ...prev,
                          rto: event.target.value,
                        }))
                      }
                      placeholder="Contoh: 2"
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Recovery Time Objective.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>
                      RPO
                    </label>

                    <input
                      type="number"
                      min="0"
                      step="1"
                      value={targetForm.rpo}
                      onChange={(event) =>
                        setTargetForm((prev) => ({
                          ...prev,
                          rpo: event.target.value,
                        }))
                      }
                      placeholder="Contoh: 1"
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Recovery Point Objective.
                    </p>
                  </div>

                  <div>
                    <label className={labelClass}>
                      MBCO
                    </label>

                    <textarea
                      rows={4}
                      value={targetForm.mbco}
                      onChange={(event) =>
                        setTargetForm((prev) => ({
                          ...prev,
                          mbco: event.target.value,
                        }))
                      }
                      placeholder="Contoh: Pelayanan minimum 50% dari kapasitas normal"
                      className={inputClass}
                    />

                    <p className="mt-1 text-xs text-slate-500">
                      Minimum Business Continuity Objective.
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button type="button" onClick={resetTargetForm} disabled={savingTarget} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Batal
                  </button>

                  <button type="submit" disabled={savingTarget} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                    {savingTarget ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showKetergantunganForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingKetergantunganId ? 'Edit Peta Ketergantungan' : 'Tambah Peta Ketergantungan'}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Formulir 10 Business Impact Analysis
                  </p>
                </div>

                <button type="button" onClick={resetKetergantunganForm} className="text-xl text-slate-400 hover:text-slate-600">
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitKetergantungan} className="p-6">
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Layanan Prioritas
                    </label>

                    <select
                      required={!editingKetergantunganId}
                      disabled={editingKetergantunganId !== null}
                      value={ketergantunganForm.bia_id}
                      onChange={(event) =>
                        setKetergantunganForm((prev) => ({
                          ...prev,
                          bia_id: event.target.value,
                        }))
                      }
                      className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                    >
                      <option value="">
                        Pilih layanan prioritas
                      </option>

                      {editingKetergantunganId && (
                        <option value={ketergantunganForm.bia_id}>
                          {(() => {
                            const bia = data.find((item) => item.id === Number(ketergantunganForm.bia_id));
                            return bia ? `${bia.kode_prioritas} - ${bia.nama_layanan}` : ketergantunganForm.bia_id;
                          })()}
                        </option>
                      )}

                      {!editingKetergantunganId &&
                        data.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.kode_prioritas} - {item.nama_layanan}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Jenis Ketergantungan
                    </label>

                    <select
                      required
                      value={ketergantunganForm.jenis_ketergantungan}
                      onChange={(event) =>
                        setKetergantunganForm((prev) => ({
                          ...prev,
                          jenis_ketergantungan: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">
                        Pilih jenis ketergantungan
                      </option>
                      <option value="Manusia">Manusia</option>
                      <option value="Informasi dan Data">Informasi dan Data</option>
                      <option value="Bangunan, Lingkungan kerja, fasilitas umum">Bangunan, Lingkungan kerja, fasilitas umum</option>
                      <option value="Fasilitas, peralatan, Bahan habis pakai">Fasilitas, peralatan, Bahan habis pakai</option>
                      <option value="Sistem TIK">Sistem TIK</option>
                      <option value="Transportasi">Transportasi</option>
                      <option value="Pembiayaan Anggaran">Pembiayaan Anggaran</option>
                      <option value="Mitra/Pemasok">Mitra/Pemasok</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Tingkat Ketergantungan
                    </label>

                    <select
                      value={ketergantunganForm.tingkat_ketergantungan}
                      onChange={(event) =>
                        setKetergantunganForm((prev) => ({
                          ...prev,
                          tingkat_ketergantungan: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">
                        Pilih tingkat
                      </option>
                      <option value="Tinggi">Tinggi</option>
                      <option value="Menengah">Menengah</option>
                      <option value="Rendah">Rendah</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Nama Ketergantungan
                    </label>

                    <input
                      type="text"
                      required
                      maxLength={200}
                      value={ketergantunganForm.nama_ketergantungan}
                      onChange={(event) =>
                        setKetergantunganForm((prev) => ({
                          ...prev,
                          nama_ketergantungan: event.target.value,
                        }))
                      }
                      placeholder="Contoh: Server Aplikasi Utama"
                      className={inputClass}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className={labelClass}>
                      Deskripsi
                    </label>

                    <textarea
                      rows={4}
                      value={ketergantunganForm.deskripsi}
                      onChange={(event) =>
                        setKetergantunganForm((prev) => ({
                          ...prev,
                          deskripsi: event.target.value,
                        }))
                      }
                      placeholder="Jelaskan hubungan ketergantungan terhadap layanan."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button type="button" onClick={resetKetergantunganForm} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                    Batal
                  </button>

                  <button type="submit" disabled={savingKetergantungan} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                    {savingKetergantungan ? 'Menyimpan...' : editingKetergantunganId ? 'Simpan Perubahan' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showInsidenModulForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
                <div>
                  <h2 className="text-lg font-semibold text-slate-800">
                    {editingInsidenModulId ? 'Edit Modul Terkait' : 'Tambah Modul Terkait'}
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Formulir 10 Business Impact Analysis
                  </p>
                </div>

                <button type="button" onClick={resetInsidenModulForm} className="text-xl text-slate-400 hover:text-slate-600">
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmitInsidenModul} className="p-6">
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className={labelClass}>
                      Insiden / Gangguan
                    </label>

                    <select
                      required={!editingInsidenModulId}
                      disabled={editingInsidenModulId !== null}
                      value={insidenModulForm.insiden_id}
                      onChange={(event) =>
                        setInsidenModulForm((prev) => ({
                          ...prev,
                          insiden_id: event.target.value,
                        }))
                      }
                      className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                    >
                      <option value="">
                        Pilih insiden
                      </option>

                      {editingInsidenModulId && (
                        <option value={insidenModulForm.insiden_id}>
                          {insiden.find((item) => item.id === Number(insidenModulForm.insiden_id))?.nama_insiden || insidenModulForm.insiden_id}
                        </option>
                      )}

                      {!editingInsidenModulId &&
                        insiden.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.nama_insiden}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Modul Terkait
                    </label>

                    <select
                      required
                      value={insidenModulForm.module_id}
                      onChange={(event) =>
                        setInsidenModulForm((prev) => ({
                          ...prev,
                          module_id: event.target.value,
                        }))
                      }
                      className={inputClass}
                    >
                      <option value="">
                        Pilih modul
                      </option>

                      {moduleOptions.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.kode_modul} - {item.nama_modul}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>
                      Keterangan Dampak
                    </label>

                    <textarea
                      rows={4}
                      value={insidenModulForm.keterangan_dampak}
                      onChange={(event) =>
                        setInsidenModulForm((prev) => ({
                          ...prev,
                          keterangan_dampak: event.target.value,
                        }))
                      }
                      placeholder="Jelaskan dampak insiden terhadap modul yang dipilih."
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                  <button type="button" onClick={resetInsidenModulForm} disabled={savingInsidenModul} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                    Batal
                  </button>

                  <button type="submit" disabled={savingInsidenModul} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
                    {savingInsidenModul ? 'Menyimpan...' : editingInsidenModulId ? 'Simpan Perubahan' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </div>
  );
};

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

export default AnalisisDampakBisnisPage;