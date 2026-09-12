import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type RuangLingkupItem = {
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
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  jenis_instansi: string | null;
  scope_layanan: string | null;
  kategori_layanan: string | null;
  pengguna_utama: string | null;
  jumlah_pengguna: number | null;
  target_ola: string | null;
  terkait_ekosistem: number | boolean;
  ekosistem_pemerintah_digital: string | null;
  deskripsi_ekosistem: string | null;
  created_by: number | null;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
};

type LayananPrioritasOption = {
  id: number;
  kode_prioritas: string;
  nama_layanan: string;
};

type LayananPrioritasDetail = {
  id: number;
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
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  jenis_instansi: string | null;
};

type PegawaiOption = {
  id: number;
  nip: string | null;
  nama: string;
  email: string | null;
  jabatan: string | null;
  unit_kerja_id: number;
  kode_unit: string;
  nama_unit: string;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
};

type TimManajemenItem = {
  id: number;
  layanan_prioritas_id: number;
  pegawai_id: number;
  peran_mkb: string;
  tanggung_jawab: string | null;
  urutan: number | null;
  kode_prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  nip: string | null;
  nama_pegawai: string;
  email_pegawai: string | null;
  jabatan: string | null;
  unit_kerja_id: number;
  kode_unit: string;
  nama_unit: string;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  created_by: number | null;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
};

type TimManajemenForm = {
  layanan_prioritas_id: string;
  pegawai_id: string;
  peran_mkb: string;
  tanggung_jawab: string;
  urutan: string;
};

const emptyTimManajemenForm: TimManajemenForm = {
  layanan_prioritas_id: '',
  pegawai_id: '',
  peran_mkb: '',
  tanggung_jawab: '',
  urutan: '',
};

type TimTanggapInsidenItem = {
  id: number;
  layanan_prioritas_id: number;
  pegawai_id: number;
  peran_tanggap_insiden: string;
  tanggung_jawab: string | null;
  urutan: number | null;
  kode_prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  nip: string | null;
  nama_pegawai: string;
  email_pegawai: string | null;
  jabatan: string | null;
  unit_kerja_id: number;
  kode_unit: string;
  nama_unit: string;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  created_by: number | null;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
};

type TimTanggapInsidenForm = {
  layanan_prioritas_id: string;
  pegawai_id: string;
  peran_tanggap_insiden: string;
  tanggung_jawab: string;
  urutan: string;
};

type TimPemulihanLayananItem = {
  id: number;
  layanan_prioritas_id: number;
  pegawai_id: number;
  peran_pemulihan: string;
  tanggung_jawab: string | null;
  urutan: number | null;
  kode_prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  nip: string | null;
  nama_pegawai: string;
  email_pegawai: string | null;
  jabatan: string | null;
  unit_kerja_id: number;
  kode_unit: string;
  nama_unit: string;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  created_by: number | null;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
};

type TimPemulihanLayananForm = {
  layanan_prioritas_id: string;
  pegawai_id: string;
  peran_pemulihan: string;
  tanggung_jawab: string;
  urutan: string;
};

const emptyTimPemulihanLayananForm: TimPemulihanLayananForm = {
  layanan_prioritas_id: '',
  pegawai_id: '',
  peran_pemulihan: '',
  tanggung_jawab: '',
  urutan: '',
};

const emptyTimTanggapInsidenForm: TimTanggapInsidenForm = {
  layanan_prioritas_id: '',
  pegawai_id: '',
  peran_tanggap_insiden: '',
  tanggung_jawab: '',
  urutan: '',
};

type FormState = {
  layanan_prioritas_id: string;
  scope_layanan: string;
  kategori_layanan: string;
  pengguna_utama: string;
  jumlah_pengguna: string;
  target_ola: string;
  terkait_ekosistem: string;
  ekosistem_pemerintah_digital: string;
  deskripsi_ekosistem: string;
};

const emptyForm: FormState = {
  layanan_prioritas_id: '',
  scope_layanan: '',
  kategori_layanan: '',
  pengguna_utama: '',
  jumlah_pengguna: '',
  target_ola: '',
  terkait_ekosistem: '0',
  ekosistem_pemerintah_digital: '',
  deskripsi_ekosistem: '',
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
    route: '/keberlangsungan/bia',
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

const PenetapanKonteksKeberlangsunganPage = () => {
  const navigate = useNavigate();

  const [data, setData] = useState<RuangLingkupItem[]>([]);
  const [layananOptions, setLayananOptions] = useState<LayananPrioritasOption[]>([]);

  const [layananDetail, setLayananDetail] = useState<LayananPrioritasDetail | null>(null);
  const [loadingLayananDetail, setLoadingLayananDetail] = useState(false);

  const [formData, setFormData] = useState<FormState>(emptyForm);

  const [editingId, setEditingId] = useState<number | null>(null);

  const [selectedItem, setSelectedItem] = useState<RuangLingkupItem | null>(null);

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showDetail, setShowDetail] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [timManajemen, setTimManajemen] = useState<TimManajemenItem[]>([]);
  const [pegawaiOptions, setPegawaiOptions] = useState<PegawaiOption[]>([]);
  const [timForm, setTimForm] = useState<TimManajemenForm>(emptyTimManajemenForm);
  const [editingTimId, setEditingTimId] = useState<number | null>(null);
  const [showTimForm, setShowTimForm] = useState(false);
  const [savingTim, setSavingTim] = useState(false);

  const [timTanggapInsiden, setTimTanggapInsiden] = useState<TimTanggapInsidenItem[]>([]);
  const [tanggapInsidenForm, setTanggapInsidenForm] = useState<TimTanggapInsidenForm>(emptyTimTanggapInsidenForm);
  const [editingTanggapInsidenId, setEditingTanggapInsidenId] = useState<number | null>(null);
  const [showTanggapInsidenForm, setShowTanggapInsidenForm] = useState(false);
  const [savingTanggapInsiden, setSavingTanggapInsiden] = useState(false);

  const [timPemulihanLayanan, setTimPemulihanLayanan] = useState<TimPemulihanLayananItem[]>([]);
  const [pemulihanLayananForm, setPemulihanLayananForm] = useState<TimPemulihanLayananForm>(emptyTimPemulihanLayananForm);
  const [editingPemulihanLayananId, setEditingPemulihanLayananId] = useState<number | null>(null);
  const [showPemulihanLayananForm, setShowPemulihanLayananForm] = useState(false);
  const [savingPemulihanLayanan, setSavingPemulihanLayanan] = useState(false);

  const fetchRuangLingkup = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/ruang-lingkup',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal mengambil data penetapan ruang lingkup.'
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
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/risiko/layanan-prioritas-options',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

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

  const fetchLayananPrioritasDetail = async (
    layananPrioritasId: string
  ) => {
    if (!layananPrioritasId) {
      setLayananDetail(null);
      return;
    }

    try {
      setLoadingLayananDetail(true);
      setError('');

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/layanan-prioritas/${layananPrioritasId}/detail`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal mengambil detail layanan prioritas.'
        );
      }

      setLayananDetail(result.data);
    } catch (err) {
      setLayananDetail(null);

      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil detail layanan prioritas.'
      );
    } finally {
      setLoadingLayananDetail(false);
    }
  };

  const fetchTimManajemen = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/tim-manajemen',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal mengambil struktur tim manajemen.'
        );
      }

      setTimManajemen(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil struktur tim manajemen.'
      );
    }
  };

  const fetchPegawaiOptions = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/pegawai-options',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal mengambil daftar pegawai.'
        );
      }

      setPegawaiOptions(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil daftar pegawai.'
      );
    }
  };

  const fetchTimTanggapInsiden = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/tanggap-insiden',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal mengambil data pelaksana tanggap insiden.'
        );
      }

      setTimTanggapInsiden(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil pelaksana tanggap insiden.'
      );
    }
  };

  const fetchTimPemulihanLayanan = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/pemulihan-layanan',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Gagal mengambil data pelaksana pemulihan layanan.'
        );
      }

      setTimPemulihanLayanan(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil pelaksana pemulihan layanan.'
      );
    }
  };

  useEffect(() => {
    fetchRuangLingkup();
    fetchLayananOptions();
    fetchTimManajemen();
    fetchPegawaiOptions();
    fetchTimTanggapInsiden();
    fetchTimPemulihanLayanan();
  }, []);

  const availableLayananOptions = useMemo(() => {
    const usedIds = new Set(
      data
        .filter((item) => item.id !== editingId)
        .map((item) =>
          Number(item.layanan_prioritas_id)
        )
    );

    return layananOptions.filter(
      (option) =>
        !usedIds.has(Number(option.id))
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
        item.nama_instansi,
        item.kategori_layanan,
        item.pengguna_utama,
      ].some((value) =>
        value
          ?.toLowerCase()
          .includes(keyword)
      );
    });
  }, [data, search]);

  const resetForm = () => {
    setFormData(emptyForm);
    setLayananDetail(null);
    setEditingId(null);
    setShowForm(false);
  };

  const handleTambah = () => {
    setEditingId(null);
    setFormData(emptyForm);
    setLayananDetail(null);
    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleEdit = (
    item: RuangLingkupItem
  ) => {
    setEditingId(item.id);

    setFormData({
      layanan_prioritas_id:
        String(
          item.layanan_prioritas_id
        ),
      scope_layanan:
        item.scope_layanan || '',
      kategori_layanan:
        item.kategori_layanan || '',
      pengguna_utama:
        item.pengguna_utama || '',
      jumlah_pengguna:
        item.jumlah_pengguna === null
          ? ''
          : String(
            item.jumlah_pengguna
          ),
      target_ola:
        item.target_ola || '',
      terkait_ekosistem:
        Number(
          item.terkait_ekosistem
        ) === 1
          ? '1'
          : '0',
      ekosistem_pemerintah_digital:
        item.ekosistem_pemerintah_digital ||
        '',
      deskripsi_ekosistem:
        item.deskripsi_ekosistem ||
        '',
    });

    setMessage('');
    setError('');
    setShowForm(true);

    fetchLayananPrioritasDetail(String(item.layanan_prioritas_id));
  };

  const handleDetail = (
    item: RuangLingkupItem
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
      !formData.layanan_prioritas_id
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
        string | number | boolean | null
      > = {
        scope_layanan:
          formData.scope_layanan.trim() ||
          null,
        kategori_layanan:
          formData.kategori_layanan.trim() ||
          null,
        pengguna_utama:
          formData.pengguna_utama.trim() ||
          null,
        jumlah_pengguna:
          formData.jumlah_pengguna === ''
            ? null
            : Number(
              formData.jumlah_pengguna
            ),
        target_ola:
          formData.target_ola.trim() ||
          null,
        terkait_ekosistem:
          formData.terkait_ekosistem ===
          '1',
        ekosistem_pemerintah_digital:
          formData.terkait_ekosistem ===
            '1'
            ? formData
              .ekosistem_pemerintah_digital
              .trim() || null
            : null,
        deskripsi_ekosistem:
          formData.terkait_ekosistem ===
            '1'
            ? formData.deskripsi_ekosistem.trim() ||
            null
            : null,
      };

      if (!editingId) {
        payload.layanan_prioritas_id =
          Number(
            formData.layanan_prioritas_id
          );
      }

      const response = await fetch(
        editingId
          ? `http://localhost:5000/api/bcp/ruang-lingkup/${editingId}`
          : 'http://localhost:5000/api/bcp/ruang-lingkup',
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
          'Gagal menyimpan data ruang lingkup.'
        );
      }

      setMessage(
        result.message ||
        'Data ruang lingkup berhasil disimpan.'
      );

      resetForm();
      await fetchRuangLingkup();
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
    item: RuangLingkupItem
  ) => {
    const confirmed = window.confirm(
      `Hapus penetapan ruang lingkup untuk ${item.nama_layanan}?`
    );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token =
        localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/ruang-lingkup/${item.id}`,
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
          'Gagal menghapus data ruang lingkup.'
        );
      }

      setMessage(
        result.message ||
        'Data ruang lingkup berhasil dihapus.'
      );

      await fetchRuangLingkup();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus data.'
      );
    }
  };

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500';

  const labelClass =
    'text-sm font-medium text-slate-700';

  const handleTambahTim = () => {
    setEditingTimId(null);
    setTimForm(emptyTimManajemenForm);
    setMessage('');
    setError('');
    setShowTimForm(true);
  };

  const handleEditTim = (
    item: TimManajemenItem
  ) => {
    setEditingTimId(item.id);

    setTimForm({
      layanan_prioritas_id: String(
        item.layanan_prioritas_id
      ),
      pegawai_id: String(item.pegawai_id),
      peran_mkb: item.peran_mkb,
      tanggung_jawab:
        item.tanggung_jawab || '',
      urutan:
        item.urutan === null
          ? ''
          : String(item.urutan),
    });

    setMessage('');
    setError('');
    setShowTimForm(true);
  };

  const resetTimForm = () => {
    setEditingTimId(null);
    setTimForm(emptyTimManajemenForm);
    setShowTimForm(false);
  };

  const handleSubmitTim = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !editingTimId &&
      !timForm.layanan_prioritas_id
    ) {
      setError(
        'Layanan prioritas wajib dipilih.'
      );
      return;
    }

    if (!timForm.pegawai_id) {
      setError('Pegawai wajib dipilih.');
      return;
    }

    if (!timForm.peran_mkb.trim()) {
      setError('Peran MKB wajib diisi.');
      return;
    }

    try {
      setSavingTim(true);
      setMessage('');
      setError('');

      const token =
        localStorage.getItem('token');

      const payload: Record<
        string,
        string | number | null
      > = {
        pegawai_id: Number(
          timForm.pegawai_id
        ),
        peran_mkb:
          timForm.peran_mkb.trim(),
        tanggung_jawab:
          timForm.tanggung_jawab.trim() ||
          null,
        urutan:
          timForm.urutan === ''
            ? null
            : Number(timForm.urutan),
      };

      if (!editingTimId) {
        payload.layanan_prioritas_id =
          Number(
            timForm.layanan_prioritas_id
          );
      }

      const response = await fetch(
        editingTimId
          ? `http://localhost:5000/api/bcp/tim-manajemen/${editingTimId}`
          : 'http://localhost:5000/api/bcp/tim-manajemen',
        {
          method: editingTimId
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal menyimpan struktur tim manajemen.'
        );
      }

      setMessage(
        result.message ||
        'Struktur tim manajemen berhasil disimpan.'
      );

      resetTimForm();
      await fetchTimManajemen();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menyimpan struktur tim.'
      );
    } finally {
      setSavingTim(false);
    }
  };

  const handleDeleteTim = async (
    item: TimManajemenItem
  ) => {
    const confirmed = window.confirm(
      `Hapus ${item.nama_pegawai} dari struktur tim manajemen?`
    );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token =
        localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/tim-manajemen/${item.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal menghapus struktur tim manajemen.'
        );
      }

      setMessage(
        result.message ||
        'Struktur tim manajemen berhasil dihapus.'
      );

      await fetchTimManajemen();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus struktur tim.'
      );
    }
  };

  const handleTambahTanggapInsiden = () => {
    setEditingTanggapInsidenId(null);
    setTanggapInsidenForm(
      emptyTimTanggapInsidenForm
    );
    setMessage('');
    setError('');
    setShowTanggapInsidenForm(true);
  };

  const handleEditTanggapInsiden = (
    item: TimTanggapInsidenItem
  ) => {
    setEditingTanggapInsidenId(item.id);

    setTanggapInsidenForm({
      layanan_prioritas_id: String(
        item.layanan_prioritas_id
      ),
      pegawai_id: String(item.pegawai_id),
      peran_tanggap_insiden:
        item.peran_tanggap_insiden,
      tanggung_jawab:
        item.tanggung_jawab || '',
      urutan:
        item.urutan === null
          ? ''
          : String(item.urutan),
    });

    setMessage('');
    setError('');
    setShowTanggapInsidenForm(true);
  };

  const resetTanggapInsidenForm = () => {
    setEditingTanggapInsidenId(null);
    setTanggapInsidenForm(
      emptyTimTanggapInsidenForm
    );
    setShowTanggapInsidenForm(false);
  };

  const handleSubmitTanggapInsiden = async (
    event: FormEvent
  ) => {
    event.preventDefault();

    if (
      !editingTanggapInsidenId &&
      !tanggapInsidenForm.layanan_prioritas_id
    ) {
      setError(
        'Layanan prioritas wajib dipilih.'
      );
      return;
    }

    if (!tanggapInsidenForm.pegawai_id) {
      setError('Pegawai wajib dipilih.');
      return;
    }

    if (
      !tanggapInsidenForm.peran_tanggap_insiden.trim()
    ) {
      setError(
        'Peran tanggap insiden wajib diisi.'
      );
      return;
    }

    try {
      setSavingTanggapInsiden(true);
      setMessage('');
      setError('');

      const token =
        localStorage.getItem('token');

      const payload: Record<
        string,
        string | number | null
      > = {
        pegawai_id: Number(
          tanggapInsidenForm.pegawai_id
        ),
        peran_tanggap_insiden:
          tanggapInsidenForm.peran_tanggap_insiden.trim(),
        tanggung_jawab:
          tanggapInsidenForm.tanggung_jawab.trim() ||
          null,
        urutan:
          tanggapInsidenForm.urutan === ''
            ? null
            : Number(
              tanggapInsidenForm.urutan
            ),
      };

      if (!editingTanggapInsidenId) {
        payload.layanan_prioritas_id =
          Number(
            tanggapInsidenForm.layanan_prioritas_id
          );
      }

      const response = await fetch(
        editingTanggapInsidenId
          ? `http://localhost:5000/api/bcp/tanggap-insiden/${editingTanggapInsidenId}`
          : 'http://localhost:5000/api/bcp/tanggap-insiden',
        {
          method: editingTanggapInsidenId
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

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal menyimpan pelaksana tanggap insiden.'
        );
      }

      setMessage(
        result.message ||
        'Pelaksana tanggap insiden berhasil disimpan.'
      );

      resetTanggapInsidenForm();
      await fetchTimTanggapInsiden();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menyimpan pelaksana tanggap insiden.'
      );
    } finally {
      setSavingTanggapInsiden(false);
    }
  };

  const handleDeleteTanggapInsiden = async (
    item: TimTanggapInsidenItem
  ) => {
    const confirmed = window.confirm(
      `Hapus ${item.nama_pegawai} dari pelaksana tanggap insiden?`
    );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token =
        localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/tanggap-insiden/${item.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type':
              'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
          'Gagal menghapus pelaksana tanggap insiden.'
        );
      }

      setMessage(
        result.message ||
        'Pelaksana tanggap insiden berhasil dihapus.'
      );

      await fetchTimTanggapInsiden();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus pelaksana tanggap insiden.'
      );
    }
  };

  const handleTambahPemulihanLayanan = () => {
  setEditingPemulihanLayananId(null);
  setPemulihanLayananForm(
    emptyTimPemulihanLayananForm
  );
  setMessage('');
  setError('');
  setShowPemulihanLayananForm(true);
};

const handleEditPemulihanLayanan = (
  item: TimPemulihanLayananItem
) => {
  setEditingPemulihanLayananId(item.id);

  setPemulihanLayananForm({
    layanan_prioritas_id: String(
      item.layanan_prioritas_id
    ),
    pegawai_id: String(item.pegawai_id),
    peran_pemulihan: item.peran_pemulihan,
    tanggung_jawab: item.tanggung_jawab || '',
    urutan:
      item.urutan === null
        ? ''
        : String(item.urutan),
  });

  setMessage('');
  setError('');
  setShowPemulihanLayananForm(true);
};

const resetPemulihanLayananForm = () => {
  setEditingPemulihanLayananId(null);
  setPemulihanLayananForm(
    emptyTimPemulihanLayananForm
  );
  setShowPemulihanLayananForm(false);
};

const handleSubmitPemulihanLayanan = async (
  event: FormEvent
) => {
  event.preventDefault();

  if (
    !editingPemulihanLayananId &&
    !pemulihanLayananForm.layanan_prioritas_id
  ) {
    setError('Layanan prioritas wajib dipilih.');
    return;
  }

  if (!pemulihanLayananForm.pegawai_id) {
    setError('Pegawai wajib dipilih.');
    return;
  }

  if (!pemulihanLayananForm.peran_pemulihan.trim()) {
    setError('Peran pemulihan wajib diisi.');
    return;
  }

  try {
    setSavingPemulihanLayanan(true);
    setMessage('');
    setError('');

    const token = localStorage.getItem('token');

    const payload: Record<
      string,
      string | number | null
    > = {
      pegawai_id: Number(
        pemulihanLayananForm.pegawai_id
      ),
      peran_pemulihan:
        pemulihanLayananForm.peran_pemulihan.trim(),
      tanggung_jawab:
        pemulihanLayananForm.tanggung_jawab.trim() ||
        null,
      urutan:
        pemulihanLayananForm.urutan === ''
          ? null
          : Number(
              pemulihanLayananForm.urutan
            ),
    };

    if (!editingPemulihanLayananId) {
      payload.layanan_prioritas_id = Number(
        pemulihanLayananForm.layanan_prioritas_id
      );
    }

    const response = await fetch(
      editingPemulihanLayananId
        ? `http://localhost:5000/api/bcp/pemulihan-layanan/${editingPemulihanLayananId}`
        : 'http://localhost:5000/api/bcp/pemulihan-layanan',
      {
        method: editingPemulihanLayananId
          ? 'PUT'
          : 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message ||
          'Gagal menyimpan pelaksana pemulihan layanan.'
      );
    }

    setMessage(
      result.message ||
        'Pelaksana pemulihan layanan berhasil disimpan.'
    );

    resetPemulihanLayananForm();
    await fetchTimPemulihanLayanan();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan pelaksana pemulihan layanan.'
    );
  } finally {
    setSavingPemulihanLayanan(false);
  }
};

const handleDeletePemulihanLayanan = async (
    item: TimPemulihanLayananItem
  ) => {
    const confirmed = window.confirm(
      `Hapus ${item.nama_pegawai} dari pelaksana pemulihan layanan?`
    );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token = localStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/pemulihan-layanan/${item.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.message ||
            'Gagal menghapus pelaksana pemulihan layanan.'
        );
      }

      setMessage(
        result.message ||
          'Pelaksana pemulihan layanan berhasil dihapus.'
      );

      await fetchTimPemulihanLayanan();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus pelaksana pemulihan layanan.'
      );
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Keberlangsungan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 1 - Penetapan Konteks
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map(
            (step, index) => {
              const active =
                step.number === 1;

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
                      className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${active
                          ? 'border-slate-800 bg-slate-800 text-white'
                          : 'border-slate-300 bg-white text-slate-500'
                        }`}
                    >
                      {step.number}
                    </div>

                    <span
                      className={`mt-2 text-xs ${active
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
              Formulir 1 - Penetapan
              Ruang Lingkup
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Penetapan ruang lingkup
              Manajemen Keberlangsungan
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
            placeholder="Cari layanan, instansi, kategori, atau pengguna..."
            className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  No
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Instansi
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  ID Layanan
                  Prioritas
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Nama Layanan
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Jenis Layanan
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Kategori
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Pengguna Utama
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Jumlah Pengguna
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Ekosistem
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
                    penetapan ruang
                    lingkup.
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

                      <td className="px-4 py-3 text-sm text-slate-700">
                        {
                          item.nama_instansi
                        }
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

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.jenis_layanan ||
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.kategori_layanan ||
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.pengguna_utama ||
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.jumlah_pengguna ??
                          '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {Number(
                          item.terkait_ekosistem
                        ) === 1
                          ? 'Ya'
                          : 'Tidak'}
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
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 2 - Struktur Tim Manajemen Keberlangsungan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Penetapan struktur, peran, dan tanggung jawab Tim Manajemen Keberlangsungan.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTambahTim}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tambah Anggota
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  No
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Layanan Prioritas
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Nama Pegawai
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Jabatan
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Unit Kerja
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Peran MKB
                </th>

                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Urutan
                </th>

                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {timManajemen.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Belum ada struktur Tim Manajemen Keberlangsungan.
                  </td>
                </tr>
              ) : (
                timManajemen.map(
                  (item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium">
                          {item.kode_prioritas}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.nama_layanan}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium">
                          {item.nama_pegawai}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.nip || '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.jabatan || '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.nama_unit}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.peran_mkb}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.urutan ?? '-'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditTim(item)
                            }
                            className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                          >
                            Edit
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleDeleteTim(item)
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
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 3 - Pelaksana Tanggap Insiden
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Penetapan anggota, peran, dan tanggung jawab pelaksana tanggap insiden.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTambahTanggapInsiden}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tambah Pelaksana
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Layanan Prioritas
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Nama Pegawai
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Jabatan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Unit Kerja
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Peran Tanggap Insiden
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Urutan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {timTanggapInsiden.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Belum ada pelaksana tanggap insiden.
                  </td>
                </tr>
              ) : (
                timTanggapInsiden.map(
                  (item, index) => (
                    <tr
                      key={item.id}
                      className="border-b border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {index + 1}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium">
                          {item.kode_prioritas}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.nama_layanan}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="font-medium">
                          {item.nama_pegawai}
                        </div>
                        <div className="text-xs text-slate-500">
                          {item.nip || '-'}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.jabatan || '-'}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.nama_unit}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.peran_tanggap_insiden}
                      </td>

                      <td className="px-4 py-3 text-sm text-slate-600">
                        {item.urutan ?? '-'}
                      </td>

                      <td className="px-4 py-3">
                        <div className="flex justify-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleEditTanggapInsiden(
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
                              handleDeleteTanggapInsiden(
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
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 4 - Pelaksana Pemulihan Layanan Digital
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Penetapan anggota, peran, dan tanggung jawab pelaksana pemulihan layanan digital.
            </p>
          </div>

          <button
            type="button"
            onClick={handleTambahPemulihanLayanan}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tambah Pelaksana
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Layanan Prioritas
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Nama Pegawai
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Jabatan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Unit Kerja
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Peran Pemulihan
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
                  Urutan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase text-slate-600">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {timPemulihanLayanan.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Belum ada pelaksana pemulihan layanan digital.
                  </td>
                </tr>
              ) : (
                timPemulihanLayanan.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="font-medium">
                        {item.kode_prioritas}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.nama_layanan}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      <div className="font-medium">
                        {item.nama_pegawai}
                      </div>
                      <div className="text-xs text-slate-500">
                        {item.nip || '-'}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.jabatan || '-'}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.nama_unit}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.peran_pemulihan}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {item.urutan ?? '-'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleEditPemulihanLayanan(item)
                          }
                          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleDeletePemulihanLayanan(item)
                          }
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId
                    ? 'Edit Penetapan Ruang Lingkup'
                    : 'Tambah Penetapan Ruang Lingkup'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 1 Manajemen
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
                      formData.layanan_prioritas_id
                    }
                    disabled={
                      editingId !== null
                    }
                    required={!editingId}
                    onChange={(event) => {
                      const value = event.target.value;

                      setFormData((prev) => ({
                        ...prev,
                        layanan_prioritas_id: value,
                      }));

                      fetchLayananPrioritasDetail(value);
                    }}
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option value="">
                      Pilih layanan
                      prioritas
                    </option>

                    {editingId && (
                      <option
                        value={
                          formData.layanan_prioritas_id
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
                            return formData.layanan_prioritas_id;
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

                  {loadingLayananDetail && (
                    <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
                      Memuat detail layanan prioritas...
                    </div>
                  )}

                  {layananDetail && !loadingLayananDetail && (
                    <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-5">
                      <div className="mb-4">
                        <h3 className="text-sm font-semibold text-slate-800">
                          Data Layanan Prioritas
                        </h3>

                        <p className="mt-1 text-xs text-slate-500">
                          Data berikut diambil otomatis dari master layanan.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className={labelClass}>
                            Nama Instansi
                          </label>

                          <input
                            type="text"
                            value={layananDetail.nama_instansi || ''}
                            readOnly
                            className={`${inputClass} bg-slate-100`}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            ID Layanan Prioritas
                          </label>

                          <input
                            type="text"
                            value={layananDetail.kode_prioritas || ''}
                            readOnly
                            className={`${inputClass} bg-slate-100`}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Nama Layanan Prioritas
                          </label>

                          <input
                            type="text"
                            value={layananDetail.nama_layanan || ''}
                            readOnly
                            className={`${inputClass} bg-slate-100`}
                          />
                        </div>

                        <div>
                          <label className={labelClass}>
                            Jenis Layanan
                          </label>

                          <input
                            type="text"
                            value={layananDetail.jenis_layanan || ''}
                            readOnly
                            className={`${inputClass} bg-slate-100`}
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className={labelClass}>
                            Deskripsi Layanan
                          </label>

                          <textarea
                            rows={3}
                            value={layananDetail.deskripsi_layanan || ''}
                            readOnly
                            className={`${inputClass} bg-slate-100`}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Scope / Ruang
                    Lingkup Layanan
                  </label>

                  <textarea
                    rows={3}
                    value={
                      formData.scope_layanan
                    }
                    onChange={(
                      event
                    ) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          scope_layanan:
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
                    Kategori Layanan
                  </label>

                  <input
                    type="text"
                    maxLength={100}
                    value={
                      formData.kategori_layanan
                    }
                    onChange={(
                      event
                    ) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          kategori_layanan:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Contoh: Layanan Prioritas"
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
                    Pengguna Utama
                  </label>

                  <input
                    type="text"
                    maxLength={150}
                    value={
                      formData.pengguna_utama
                    }
                    onChange={(
                      event
                    ) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          pengguna_utama:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="Contoh: Masyarakat Umum"
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
                    Jumlah Pengguna
                  </label>

                  <input
                    type="number"
                    min={0}
                    value={
                      formData.jumlah_pengguna
                    }
                    onChange={(
                      event
                    ) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          jumlah_pengguna:
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
                    Target OLA
                  </label>

                  <input
                    type="text"
                    maxLength={200}
                    value={
                      formData.target_ola
                    }
                    onChange={(
                      event
                    ) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          target_ola:
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
                    Keterkaitan dengan
                    Ekosistem Pemerintah
                    Digital
                  </label>

                  <select
                    value={
                      formData.terkait_ekosistem
                    }
                    onChange={(
                      event
                    ) =>
                      setFormData(
                        (prev) => ({
                          ...prev,
                          terkait_ekosistem:
                            event
                              .target
                              .value,
                          ekosistem_pemerintah_digital:
                            event
                              .target
                              .value ===
                              '1'
                              ? prev.ekosistem_pemerintah_digital
                              : '',
                          deskripsi_ekosistem:
                            event
                              .target
                              .value ===
                              '1'
                              ? prev.deskripsi_ekosistem
                              : '',
                        })
                      )
                    }
                    className={
                      inputClass
                    }
                  >
                    <option value="0">
                      Tidak
                    </option>
                    <option value="1">
                      Ya
                    </option>
                  </select>
                </div>

                {formData.terkait_ekosistem ===
                  '1' && (
                    <>
                      <div className="md:col-span-2">
                        <label
                          className={
                            labelClass
                          }
                        >
                          Ekosistem
                          Pemerintah
                          Digital
                        </label>

                        <input
                          type="text"
                          maxLength={
                            200
                          }
                          value={
                            formData.ekosistem_pemerintah_digital
                          }
                          onChange={(
                            event
                          ) =>
                            setFormData(
                              (
                                prev
                              ) => ({
                                ...prev,
                                ekosistem_pemerintah_digital:
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
                          Deskripsi
                          Ekosistem
                          Pemerintah
                          Digital
                        </label>

                        <textarea
                          rows={3}
                          value={
                            formData.deskripsi_ekosistem
                          }
                          onChange={(
                            event
                          ) =>
                            setFormData(
                              (
                                prev
                              ) => ({
                                ...prev,
                                deskripsi_ekosistem:
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
                    </>
                  )}
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

      {showTimForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingTimId
                    ? 'Edit Struktur Tim Manajemen'
                    : 'Tambah Struktur Tim Manajemen'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 2 Manajemen Keberlangsungan.
                </p>
              </div>

              <button
                type="button"
                onClick={resetTimForm}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitTim}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>

                  <select
                    value={
                      timForm.layanan_prioritas_id
                    }
                    disabled={
                      editingTimId !== null
                    }
                    required={!editingTimId}
                    onChange={(event) =>
                      setTimForm((prev) => ({
                        ...prev,
                        layanan_prioritas_id:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>

                    {editingTimId && (
                      <option
                        value={
                          timForm.layanan_prioritas_id
                        }
                      >
                        {(() => {
                          const current =
                            timManajemen.find(
                              (item) =>
                                item.id ===
                                editingTimId
                            );

                          if (!current) {
                            return timForm
                              .layanan_prioritas_id;
                          }

                          return `${current.kode_prioritas} - ${current.nama_layanan}`;
                        })()}
                      </option>
                    )}

                    {!editingTimId &&
                      data.map((item) => (
                        <option
                          key={
                            item.layanan_prioritas_id
                          }
                          value={
                            item.layanan_prioritas_id
                          }
                        >
                          {item.kode_prioritas} -{' '}
                          {item.nama_layanan}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Pegawai
                  </label>

                  <select
                    value={timForm.pegawai_id}
                    required
                    onChange={(event) =>
                      setTimForm((prev) => ({
                        ...prev,
                        pegawai_id:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Pilih pegawai
                    </option>

                    {pegawaiOptions.map(
                      (pegawai) => (
                        <option
                          key={pegawai.id}
                          value={pegawai.id}
                        >
                          {pegawai.nama}
                          {pegawai.jabatan
                            ? ` - ${pegawai.jabatan}`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {timForm.pegawai_id && (
                  <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const pegawai =
                        pegawaiOptions.find(
                          (item) =>
                            String(item.id) ===
                            timForm.pegawai_id
                        );

                      if (!pegawai) return null;

                      return (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <DetailField
                            label="NIP"
                            value={
                              pegawai.nip
                            }
                          />

                          <DetailField
                            label="Jabatan"
                            value={
                              pegawai.jabatan
                            }
                          />

                          <DetailField
                            label="Unit Kerja"
                            value={
                              pegawai.nama_unit
                            }
                          />

                          <DetailField
                            label="Instansi"
                            value={
                              pegawai.nama_instansi
                            }
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Peran MKB
                  </label>

                  <input
                    type="text"
                    maxLength={150}
                    required
                    value={
                      timForm.peran_mkb
                    }
                    onChange={(event) =>
                      setTimForm((prev) => ({
                        ...prev,
                        peran_mkb:
                          event.target.value,
                      }))
                    }
                    placeholder="Contoh: Ketua Tim"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Urutan Struktur
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={timForm.urutan}
                    onChange={(event) =>
                      setTimForm((prev) => ({
                        ...prev,
                        urutan:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Tanggung Jawab
                  </label>

                  <textarea
                    rows={4}
                    value={
                      timForm.tanggung_jawab
                    }
                    onChange={(event) =>
                      setTimForm((prev) => ({
                        ...prev,
                        tanggung_jawab:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={resetTimForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingTim}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTim
                    ? 'Menyimpan...'
                    : editingTimId
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
                    Detail
                    Penetapan Ruang
                    Lingkup
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
                  label="Nama Instansi"
                  value={
                    selectedItem.nama_instansi
                  }
                />

                <DetailField
                  label="ID Layanan Prioritas"
                  value={
                    selectedItem.kode_prioritas
                  }
                />

                <DetailField
                  label="Nama Layanan Prioritas"
                  value={
                    selectedItem.nama_layanan
                  }
                />

                <DetailField
                  label="Jenis Layanan"
                  value={
                    selectedItem.jenis_layanan
                  }
                />

                <DetailField
                  label="Kategori Layanan"
                  value={
                    selectedItem.kategori_layanan
                  }
                />

                <DetailField
                  label="Pengguna Utama"
                  value={
                    selectedItem.pengguna_utama
                  }
                />

                <DetailField
                  label="Jumlah Pengguna"
                  value={
                    selectedItem.jumlah_pengguna
                  }
                />

                <DetailField
                  label="Target OLA"
                  value={
                    selectedItem.target_ola
                  }
                />

                <DetailField
                  label="Deskripsi Layanan"
                  value={
                    selectedItem.deskripsi_layanan
                  }
                  full
                />

                <DetailField
                  label="Scope / Ruang Lingkup Layanan"
                  value={
                    selectedItem.scope_layanan
                  }
                  full
                />

                <DetailField
                  label="Keterkaitan dengan Ekosistem Pemerintah Digital"
                  value={
                    Number(
                      selectedItem.terkait_ekosistem
                    ) === 1
                      ? 'Ya'
                      : 'Tidak'
                  }
                />

                {Number(
                  selectedItem.terkait_ekosistem
                ) === 1 && (
                    <>
                      <DetailField
                        label="Ekosistem Pemerintah Digital"
                        value={
                          selectedItem.ekosistem_pemerintah_digital
                        }
                      />

                      <DetailField
                        label="Deskripsi Ekosistem Pemerintah Digital"
                        value={
                          selectedItem.deskripsi_ekosistem
                        }
                        full
                      />
                    </>
                  )}
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

      {showTanggapInsidenForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingTanggapInsidenId
                    ? 'Edit Pelaksana Tanggap Insiden'
                    : 'Tambah Pelaksana Tanggap Insiden'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 3 Manajemen Keberlangsungan.
                </p>
              </div>

              <button
                type="button"
                onClick={resetTanggapInsidenForm}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitTanggapInsiden}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>

                  <select
                    value={
                      tanggapInsidenForm.layanan_prioritas_id
                    }
                    disabled={
                      editingTanggapInsidenId !== null
                    }
                    required={
                      !editingTanggapInsidenId
                    }
                    onChange={(event) =>
                      setTanggapInsidenForm(
                        (prev) => ({
                          ...prev,
                          layanan_prioritas_id:
                            event.target.value,
                        })
                      )
                    }
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>

                    {editingTanggapInsidenId && (
                      <option
                        value={
                          tanggapInsidenForm.layanan_prioritas_id
                        }
                      >
                        {(() => {
                          const current =
                            timTanggapInsiden.find(
                              (item) =>
                                item.id ===
                                editingTanggapInsidenId
                            );

                          if (!current) {
                            return tanggapInsidenForm
                              .layanan_prioritas_id;
                          }

                          return `${current.kode_prioritas} - ${current.nama_layanan}`;
                        })()}
                      </option>
                    )}

                    {!editingTanggapInsidenId &&
                      data.map((item) => (
                        <option
                          key={
                            item.layanan_prioritas_id
                          }
                          value={
                            item.layanan_prioritas_id
                          }
                        >
                          {item.kode_prioritas} -{' '}
                          {item.nama_layanan}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Pegawai
                  </label>

                  <select
                    value={
                      tanggapInsidenForm.pegawai_id
                    }
                    required
                    onChange={(event) =>
                      setTanggapInsidenForm(
                        (prev) => ({
                          ...prev,
                          pegawai_id:
                            event.target.value,
                        })
                      )
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Pilih pegawai
                    </option>

                    {pegawaiOptions.map(
                      (pegawai) => (
                        <option
                          key={pegawai.id}
                          value={pegawai.id}
                        >
                          {pegawai.nama}
                          {pegawai.jabatan
                            ? ` - ${pegawai.jabatan}`
                            : ''}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {tanggapInsidenForm.pegawai_id && (
                  <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const pegawai =
                        pegawaiOptions.find(
                          (item) =>
                            String(item.id) ===
                            tanggapInsidenForm.pegawai_id
                        );

                      if (!pegawai) return null;

                      return (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <DetailField
                            label="NIP"
                            value={pegawai.nip}
                          />

                          <DetailField
                            label="Jabatan"
                            value={pegawai.jabatan}
                          />

                          <DetailField
                            label="Unit Kerja"
                            value={pegawai.nama_unit}
                          />

                          <DetailField
                            label="Instansi"
                            value={pegawai.nama_instansi}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Peran Tanggap Insiden
                  </label>

                  <input
                    type="text"
                    maxLength={150}
                    required
                    value={
                      tanggapInsidenForm.peran_tanggap_insiden
                    }
                    onChange={(event) =>
                      setTanggapInsidenForm(
                        (prev) => ({
                          ...prev,
                          peran_tanggap_insiden:
                            event.target.value,
                        })
                      )
                    }
                    placeholder="Contoh: Koordinator Tanggap Insiden"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Urutan Struktur
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={
                      tanggapInsidenForm.urutan
                    }
                    onChange={(event) =>
                      setTanggapInsidenForm(
                        (prev) => ({
                          ...prev,
                          urutan:
                            event.target.value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Tanggung Jawab
                  </label>

                  <textarea
                    rows={4}
                    value={
                      tanggapInsidenForm.tanggung_jawab
                    }
                    onChange={(event) =>
                      setTanggapInsidenForm(
                        (prev) => ({
                          ...prev,
                          tanggung_jawab:
                            event.target.value,
                        })
                      )
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={
                    resetTanggapInsidenForm
                  }
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingTanggapInsiden}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingTanggapInsiden
                    ? 'Menyimpan...'
                    : editingTanggapInsidenId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showPemulihanLayananForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingPemulihanLayananId
                    ? 'Edit Pelaksana Pemulihan Layanan Digital'
                    : 'Tambah Pelaksana Pemulihan Layanan Digital'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 4 Manajemen Keberlangsungan.
                </p>
              </div>

              <button
                type="button"
                onClick={resetPemulihanLayananForm}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitPemulihanLayanan}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>

                  <select
                    value={
                      pemulihanLayananForm.layanan_prioritas_id
                    }
                    disabled={
                      editingPemulihanLayananId !== null
                    }
                    required={
                      !editingPemulihanLayananId
                    }
                    onChange={(event) =>
                      setPemulihanLayananForm((prev) => ({
                        ...prev,
                        layanan_prioritas_id:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100 disabled:text-slate-500`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>

                    {editingPemulihanLayananId && (
                      <option
                        value={
                          pemulihanLayananForm.layanan_prioritas_id
                        }
                      >
                        {(() => {
                          const current =
                            timPemulihanLayanan.find(
                              (item) =>
                                item.id ===
                                editingPemulihanLayananId
                            );

                          if (!current) {
                            return pemulihanLayananForm
                              .layanan_prioritas_id;
                          }

                          return `${current.kode_prioritas} - ${current.nama_layanan}`;
                        })()}
                      </option>
                    )}

                    {!editingPemulihanLayananId &&
                      data.map((item) => (
                        <option
                          key={item.layanan_prioritas_id}
                          value={item.layanan_prioritas_id}
                        >
                          {item.kode_prioritas} - {item.nama_layanan}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Pegawai
                  </label>

                  <select
                    value={pemulihanLayananForm.pegawai_id}
                    required
                    onChange={(event) =>
                      setPemulihanLayananForm((prev) => ({
                        ...prev,
                        pegawai_id: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">
                      Pilih pegawai
                    </option>

                    {pegawaiOptions.map((pegawai) => (
                      <option
                        key={pegawai.id}
                        value={pegawai.id}
                      >
                        {pegawai.nama}
                        {pegawai.jabatan
                          ? ` - ${pegawai.jabatan}`
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {pemulihanLayananForm.pegawai_id && (
                  <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const pegawai =
                        pegawaiOptions.find(
                          (item) =>
                            String(item.id) ===
                            pemulihanLayananForm.pegawai_id
                        );

                      if (!pegawai) return null;

                      return (
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <DetailField
                            label="NIP"
                            value={pegawai.nip}
                          />

                          <DetailField
                            label="Jabatan"
                            value={pegawai.jabatan}
                          />

                          <DetailField
                            label="Unit Kerja"
                            value={pegawai.nama_unit}
                          />

                          <DetailField
                            label="Instansi"
                            value={pegawai.nama_instansi}
                          />
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                  <label className={labelClass}>
                    Peran Pemulihan
                  </label>

                  <input
                    type="text"
                    maxLength={150}
                    required
                    value={
                      pemulihanLayananForm.peran_pemulihan
                    }
                    onChange={(event) =>
                      setPemulihanLayananForm((prev) => ({
                        ...prev,
                        peran_pemulihan:
                          event.target.value,
                      }))
                    }
                    placeholder="Contoh: Koordinator Pemulihan Layanan"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Urutan Struktur
                  </label>

                  <input
                    type="number"
                    min={1}
                    value={pemulihanLayananForm.urutan}
                    onChange={(event) =>
                      setPemulihanLayananForm((prev) => ({
                        ...prev,
                        urutan: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Tanggung Jawab
                  </label>

                  <textarea
                    rows={4}
                    value={
                      pemulihanLayananForm.tanggung_jawab
                    }
                    onChange={(event) =>
                      setPemulihanLayananForm((prev) => ({
                        ...prev,
                        tanggung_jawab:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={resetPemulihanLayananForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingPemulihanLayanan}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingPemulihanLayanan
                    ? 'Menyimpan...'
                    : editingPemulihanLayananId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
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

export default PenetapanKonteksKeberlangsunganPage;