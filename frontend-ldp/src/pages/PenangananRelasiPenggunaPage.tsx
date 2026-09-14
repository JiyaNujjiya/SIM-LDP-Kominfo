    import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api/relasi-pengguna';

type TabType = 'kueri' | 'insiden' | 'masalah';

type LayananOption = {
  id: number;
  kode_layanan: string;
  nama_layanan: string;
};

type UserOption = {
  id: number;
  nama: string;
};

type TargetItem = {
  id: number;
  jenis: string;
  prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  versi_standar: number;
  sla_waktu_respon_menit: number | null;
  sla_waktu_penyelesaian_menit: number | null;
  ola_waktu_respon_menit: number | null;
  ola_waktu_penyelesaian_menit: number | null;
};

type KueriItem = {
  id: number;
  kode_kueri: string;
  waktu_masuk: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  target_kueri_id: number | null;
  prioritas_target: string | null;
  cakupan_layanan_terkait: string | null;
  pengguna_id: number | null;
  nama_pengguna: string | null;
  email_pelapor: string | null;
  nomor_hp_pelapor: string | null;
  kanal_masuk: string;
  judul: string;
  jenis: string;
  deskripsi: string;
  bukti_tambahan: string | null;
  url_bukti: string | null;
  urgensi: string;
  status: string;
};

type TanggapanKueriItem = {
  id: number;
  kueri_id: number;
  kode_kueri: string;
  judul: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  status_kueri: string;
  pic_id: number;
  nama_pic: string;
  jenis_tindakan: string;
  respon: string;
  status_setelah: string;
  waktu_update: string;
  waktu_selesai: string | null;
  realisasi_waktu_penyelesaian_menit: number | null;
  nama_pencatat: string;
};

type InsidenItem = {
  id: number;
  kode_insiden: string;
  kueri_asal_id: number | null;
  kode_kueri_asal: string | null;
  judul_kueri_asal: string | null;
  kanal_masuk: string;
  pelapor_id: number | null;
  nama_pelapor: string | null;
  waktu_terdeteksi: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  target_insiden_id: number | null;
  prioritas_target: string | null;
  deskripsi_insiden: string;
  prioritas: string;
  diagnosa_awal: string | null;
  target_waktu_selesai: string | null;
  status: string;
  waktu_selesai: string | null;
  realisasi_waktu_penyelesaian_menit: number | null;
  apakah_berulang: number;
};

type PenangananInsidenItem = {
  id: number;
  insiden_id: number;
  kode_insiden: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  prioritas: string;
  status_insiden: string;
  pic_id: number;
  nama_pic: string;
  jenis_penanganan: string;
  eskalasi_kepada: string | null;
  tindakan: string;
  status_setelah: string;
  waktu_tindakan: string;
  nama_pencatat: string;
};

type MasalahItem = {
  id: number;
  kode_masalah: string;
  diagnosa_akar_masalah: string;
  deskripsi_akar_masalah: string;
  prioritas: string;
  solusi_sementara: string | null;
  solusi_permanen: string | null;
  target_waktu_selesai: string | null;
  status: string;
  memerlukan_perubahan: number;
  deskripsi_singkat_perubahan: string | null;
  perubahan_id: number | null;
  kode_perubahan: string | null;
  dibuat_oleh: string;
};

type MasalahInsidenItem = {
  id: number;
  masalah_id: number;
  kode_masalah: string;
  insiden_id: number;
  kode_insiden: string;
  prioritas_insiden: string;
  status_insiden: string;
  apakah_berulang: number;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  keterangan: string | null;
};

type KueriForm = {
  kode_kueri: string;
  waktu_masuk: string;
  layanan_id: string;
  target_kueri_id: string;
  cakupan_layanan_terkait: string;
  pengguna_id: string;
  email_pelapor: string;
  nomor_hp_pelapor: string;
  kanal_masuk: string;
  judul: string;
  jenis: string;
  deskripsi: string;
  bukti_tambahan: string;
  url_bukti: string;
  urgensi: string;
  status: string;
};

type TanggapanKueriForm = {
  kueri_id: string;
  pic_id: string;
  jenis_tindakan: string;
  respon: string;
  status_setelah: string;
};

type InsidenForm = {
  kode_insiden: string;
  kueri_asal_id: string;
  kanal_masuk: string;
  pelapor_id: string;
  waktu_terdeteksi: string;
  layanan_id: string;
  target_insiden_id: string;
  deskripsi_insiden: string;
  prioritas: string;
  diagnosa_awal: string;
  target_waktu_selesai: string;
  status: string;
  apakah_berulang: string;
};

type PenangananInsidenForm = {
  insiden_id: string;
  pic_id: string;
  jenis_penanganan: string;
  eskalasi_kepada: string;
  tindakan: string;
  status_setelah: string;
};

type MasalahForm = {
  kode_masalah: string;
  diagnosa_akar_masalah: string;
  deskripsi_akar_masalah: string;
  prioritas: string;
  solusi_sementara: string;
  solusi_permanen: string;
  target_waktu_selesai: string;
  status: string;
  memerlukan_perubahan: string;
  deskripsi_singkat_perubahan: string;
  perubahan_id: string;
};

type MasalahInsidenForm = {
  masalah_id: string;
  insiden_id: string;
  keterangan: string;
};

const emptyKueriForm: KueriForm = {
  kode_kueri: '',
  waktu_masuk: '',
  layanan_id: '',
  target_kueri_id: '',
  cakupan_layanan_terkait: '',
  pengguna_id: '',
  email_pelapor: '',
  nomor_hp_pelapor: '',
  kanal_masuk: '',
  judul: '',
  jenis: 'Pertanyaan',
  deskripsi: '',
  bukti_tambahan: '',
  url_bukti: '',
  urgensi: 'Rendah',
  status: 'Diterima',
};

const emptyTanggapanKueriForm: TanggapanKueriForm = {
  kueri_id: '',
  pic_id: '',
  jenis_tindakan: 'Respons',
  respon: '',
  status_setelah: 'Diproses',
};

const emptyInsidenForm: InsidenForm = {
  kode_insiden: '',
  kueri_asal_id: '',
  kanal_masuk: '',
  pelapor_id: '',
  waktu_terdeteksi: '',
  layanan_id: '',
  target_insiden_id: '',
  deskripsi_insiden: '',
  prioritas: 'Rendah',
  diagnosa_awal: '',
  target_waktu_selesai: '',
  status: 'Terdeteksi',
  apakah_berulang: '0',
};

const emptyPenangananInsidenForm: PenangananInsidenForm = {
  insiden_id: '',
  pic_id: '',
  jenis_penanganan: 'Diagnosis',
  eskalasi_kepada: '',
  tindakan: '',
  status_setelah: 'Didiagnosis',
};

const emptyMasalahForm: MasalahForm = {
  kode_masalah: '',
  diagnosa_akar_masalah: '',
  deskripsi_akar_masalah: '',
  prioritas: 'Rendah',
  solusi_sementara: '',
  solusi_permanen: '',
  target_waktu_selesai: '',
  status: 'Teridentifikasi',
  memerlukan_perubahan: '0',
  deskripsi_singkat_perubahan: '',
  perubahan_id: '',
};

const emptyMasalahInsidenForm: MasalahInsidenForm = {
  masalah_id: '',
  insiden_id: '',
  keterangan: '',
};

const processSteps = [
  { number: 1, label: 'Perencanaan Layanan', route: '/relasi-pengguna/perencanaan' },
  { number: 2, label: 'Pengajuan Layanan', route: '/relasi-pengguna/permintaan' },
  { number: 3, label: 'Penanganan Kueri', route: '/relasi-pengguna/penanganan' },
  { number: 4, label: 'Evaluasi', route: '/relasi-pengguna/evaluasi' },
];

const PenangananRelasiPenggunaPage = () => {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<TabType>('kueri');

  const [layananOptions, setLayananOptions] = useState<LayananOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [targetOptions, setTargetOptions] = useState<TargetItem[]>([]);

  const [kueri, setKueri] = useState<KueriItem[]>([]);
  const [tanggapanKueri, setTanggapanKueri] = useState<TanggapanKueriItem[]>([]);
  const [insiden, setInsiden] = useState<InsidenItem[]>([]);
  const [penangananInsiden, setPenangananInsiden] = useState<PenangananInsidenItem[]>([]);
  const [masalah, setMasalah] = useState<MasalahItem[]>([]);
  const [masalahInsiden, setMasalahInsiden] = useState<MasalahInsidenItem[]>([]);

  const [selectedKueriId, setSelectedKueriId] = useState<number | null>(null);
  const [selectedInsidenId, setSelectedInsidenId] = useState<number | null>(null);
  const [selectedMasalahId, setSelectedMasalahId] = useState<number | null>(null);

  const [kueriForm, setKueriForm] = useState<KueriForm>(emptyKueriForm);
  const [tanggapanKueriForm, setTanggapanKueriForm] = useState<TanggapanKueriForm>(emptyTanggapanKueriForm);
  const [insidenForm, setInsidenForm] = useState<InsidenForm>(emptyInsidenForm);
  const [penangananInsidenForm, setPenangananInsidenForm] = useState<PenangananInsidenForm>(emptyPenangananInsidenForm);
  const [masalahForm, setMasalahForm] = useState<MasalahForm>(emptyMasalahForm);
  const [masalahInsidenForm, setMasalahInsidenForm] = useState<MasalahInsidenForm>(emptyMasalahInsidenForm);

  const [editingKueriId, setEditingKueriId] = useState<number | null>(null);
  const [editingInsidenId, setEditingInsidenId] = useState<number | null>(null);
  const [editingMasalahId, setEditingMasalahId] = useState<number | null>(null);

  const [showKueriForm, setShowKueriForm] = useState(false);
  const [showTanggapanKueriForm, setShowTanggapanKueriForm] = useState(false);
  const [showInsidenForm, setShowInsidenForm] = useState(false);
  const [showPenangananInsidenForm, setShowPenangananInsidenForm] = useState(false);
  const [showMasalahForm, setShowMasalahForm] = useState(false);
  const [showMasalahInsidenForm, setShowMasalahInsidenForm] = useState(false);

  const [searchKueri, setSearchKueri] = useState('');
  const [searchInsiden, setSearchInsiden] = useState('');
  const [searchMasalah, setSearchMasalah] = useState('');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500';

  const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });

    const result = await response.json();

    if (!response.ok) throw new Error(result.message || 'Terjadi kesalahan saat memproses data.');

    return result;
  };

  const rowsOf = <T,>(result: any): T[] => {
    if (Array.isArray(result)) return result;
    if (Array.isArray(result?.data)) return result.data;
    return [];
  };

  const fetchAll = async () => {
    try {
      setLoading(true);
      setError('');

      const [
        layananResult,
        userResult,
        targetResult,
        kueriResult,
        tanggapanKueriResult,
        insidenResult,
        penangananInsidenResult,
        masalahResult,
        masalahInsidenResult,
      ] = await Promise.all([
        request(`${API}/layanan-options`),
        request(`${API}/user-options`),
        request(`${API}/target-kueri-insiden`),
        request(`${API}/kueri`),
        request(`${API}/tanggapan-kueri`),
        request(`${API}/insiden`),
        request(`${API}/penanganan-insiden`),
        request(`${API}/masalah`),
        request(`${API}/masalah-insiden`),
      ]);

      setLayananOptions(rowsOf<LayananOption>(layananResult));
      setUserOptions(rowsOf<UserOption>(userResult));
      setTargetOptions(rowsOf<TargetItem>(targetResult));
      setKueri(rowsOf<KueriItem>(kueriResult));
      setTanggapanKueri(rowsOf<TanggapanKueriItem>(tanggapanKueriResult));
      setInsiden(rowsOf<InsidenItem>(insidenResult));
      setPenangananInsiden(rowsOf<PenangananInsidenItem>(penangananInsidenResult));
      setMasalah(rowsOf<MasalahItem>(masalahResult));
      setMasalahInsiden(rowsOf<MasalahInsidenItem>(masalahInsidenResult));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data MRP3.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (kueri.length === 0) {
      setSelectedKueriId(null);
      return;
    }

    setSelectedKueriId((current) => current !== null && kueri.some((item) => item.id === current) ? current : kueri[0].id);
  }, [kueri]);

  useEffect(() => {
    if (insiden.length === 0) {
      setSelectedInsidenId(null);
      return;
    }

    setSelectedInsidenId((current) => current !== null && insiden.some((item) => item.id === current) ? current : insiden[0].id);
  }, [insiden]);

  useEffect(() => {
    if (masalah.length === 0) {
      setSelectedMasalahId(null);
      return;
    }

    setSelectedMasalahId((current) => current !== null && masalah.some((item) => item.id === current) ? current : masalah[0].id);
  }, [masalah]);

  const selectedKueri = useMemo(() => kueri.find((item) => item.id === selectedKueriId) || null, [kueri, selectedKueriId]);
  const selectedInsiden = useMemo(() => insiden.find((item) => item.id === selectedInsidenId) || null, [insiden, selectedInsidenId]);
  const selectedMasalah = useMemo(() => masalah.find((item) => item.id === selectedMasalahId) || null, [masalah, selectedMasalahId]);

  const selectedTanggapanKueri = useMemo(
    () => tanggapanKueri.filter((item) => item.kueri_id === selectedKueriId),
    [tanggapanKueri, selectedKueriId]
  );

  const selectedPenangananInsiden = useMemo(
    () => penangananInsiden.filter((item) => item.insiden_id === selectedInsidenId),
    [penangananInsiden, selectedInsidenId]
  );

  const selectedMasalahInsiden = useMemo(
    () => masalahInsiden.filter((item) => item.masalah_id === selectedMasalahId),
    [masalahInsiden, selectedMasalahId]
  );

  const filteredKueri = useMemo(() => {
    const keyword = searchKueri.toLowerCase().trim();

    if (!keyword) return kueri;

    return kueri.filter((item) =>
      [
        item.kode_kueri,
        item.kode_layanan,
        item.nama_layanan,
        item.nama_pengguna,
        item.judul,
        item.jenis,
        item.urgensi,
        item.status,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [kueri, searchKueri]);

  const filteredInsiden = useMemo(() => {
    const keyword = searchInsiden.toLowerCase().trim();

    if (!keyword) return insiden;

    return insiden.filter((item) =>
      [
        item.kode_insiden,
        item.kode_kueri_asal,
        item.kode_layanan,
        item.nama_layanan,
        item.prioritas,
        item.status,
        item.deskripsi_insiden,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [insiden, searchInsiden]);

  const filteredMasalah = useMemo(() => {
    const keyword = searchMasalah.toLowerCase().trim();

    if (!keyword) return masalah;

    return masalah.filter((item) =>
      [
        item.kode_masalah,
        item.diagnosa_akar_masalah,
        item.prioritas,
        item.status,
        item.solusi_permanen,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [masalah, searchMasalah]);

  const targetKueriOptions = useMemo(
    () =>
      targetOptions.filter(
        (item) =>
          item.jenis === 'Kueri' &&
          (!kueriForm.layanan_id || Number(item.layanan_id) === Number(kueriForm.layanan_id))
      ),
    [targetOptions, kueriForm.layanan_id]
  );

  const targetInsidenOptions = useMemo(
    () =>
      targetOptions.filter(
        (item) =>
          item.jenis === 'Insiden' &&
          (!insidenForm.layanan_id || Number(item.layanan_id) === Number(insidenForm.layanan_id)) &&
          (!insidenForm.prioritas || item.prioritas === insidenForm.prioritas)
      ),
    [targetOptions, insidenForm.layanan_id, insidenForm.prioritas]
  );

  const kueriUntukInsiden = useMemo(
    () =>
      kueri.filter(
        (item) =>
          !insidenForm.layanan_id ||
          Number(item.layanan_id) === Number(insidenForm.layanan_id)
      ),
    [kueri, insidenForm.layanan_id]
  );

  const openTambahKueri = () => {
    setEditingKueriId(null);
    setKueriForm({
      ...emptyKueriForm,
      kode_kueri: `KR-${Date.now()}`,
    });
    setShowKueriForm(true);
  };

  const openEditKueri = (item: KueriItem) => {
    setEditingKueriId(item.id);
    setKueriForm({
      kode_kueri: item.kode_kueri,
      waktu_masuk: item.waktu_masuk ? item.waktu_masuk.slice(0, 16) : '',
      layanan_id: String(item.layanan_id),
      target_kueri_id: item.target_kueri_id ? String(item.target_kueri_id) : '',
      cakupan_layanan_terkait: item.cakupan_layanan_terkait || '',
      pengguna_id: item.pengguna_id ? String(item.pengguna_id) : '',
      email_pelapor: item.email_pelapor || '',
      nomor_hp_pelapor: item.nomor_hp_pelapor || '',
      kanal_masuk: item.kanal_masuk || '',
      judul: item.judul || '',
      jenis: item.jenis || 'Pertanyaan',
      deskripsi: item.deskripsi || '',
      bukti_tambahan: item.bukti_tambahan || '',
      url_bukti: item.url_bukti || '',
      urgensi: item.urgensi || 'Rendah',
      status: item.status || 'Diterima',
    });
    setShowKueriForm(true);
  };

  const submitKueri = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const payload = {
        kode_kueri: kueriForm.kode_kueri.trim(),
        waktu_masuk: kueriForm.waktu_masuk,
        layanan_id: Number(kueriForm.layanan_id),
        target_kueri_id: kueriForm.target_kueri_id ? Number(kueriForm.target_kueri_id) : null,
        cakupan_layanan_terkait: kueriForm.cakupan_layanan_terkait.trim() || null,
        pengguna_id: kueriForm.pengguna_id ? Number(kueriForm.pengguna_id) : null,
        email_pelapor: kueriForm.email_pelapor.trim() || null,
        nomor_hp_pelapor: kueriForm.nomor_hp_pelapor.trim() || null,
        kanal_masuk: kueriForm.kanal_masuk.trim(),
        judul: kueriForm.judul.trim(),
        jenis: kueriForm.jenis,
        deskripsi: kueriForm.deskripsi.trim(),
        bukti_tambahan: kueriForm.bukti_tambahan.trim() || null,
        url_bukti: kueriForm.url_bukti.trim() || null,
        urgensi: kueriForm.urgensi,
        status: kueriForm.status,
      };

      const result = await request(
        editingKueriId ? `${API}/kueri/${editingKueriId}` : `${API}/kueri`,
        {
          method: editingKueriId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Kueri berhasil disimpan.');
      setShowKueriForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan kueri.');
    } finally {
      setSaving(false);
    }
  };

  const deleteKueri = async (item: KueriItem) => {
    if (!window.confirm(`Hapus kueri ${item.kode_kueri}?`)) return;

    try {
      setMessage('');
      setError('');

      const result = await request(`${API}/kueri/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Kueri berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus kueri.');
    }
  };

  const openTambahTanggapanKueri = () => {
    if (!selectedKueri) return;

    setTanggapanKueriForm({
      ...emptyTanggapanKueriForm,
      kueri_id: String(selectedKueri.id),
    });

    setShowTanggapanKueriForm(true);
  };

  const statusKueriByTindakan = (jenis: string) => {
    if (jenis === 'Penugasan') return 'Ditugaskan';
    if (jenis === 'Respons') return 'Diproses';
    if (jenis === 'Pembaruan') return 'Diproses';
    if (jenis === 'Eskalasi') return 'Dieskalasi';
    if (jenis === 'Penyelesaian') return 'Selesai';
    if (jenis === 'Penutupan') return 'Ditutup';
    return selectedKueri?.status || 'Diterima';
  };

  const submitTanggapanKueri = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const result = await request(`${API}/tanggapan-kueri`, {
        method: 'POST',
        body: JSON.stringify({
          kueri_id: Number(tanggapanKueriForm.kueri_id),
          pic_id: Number(tanggapanKueriForm.pic_id),
          jenis_tindakan: tanggapanKueriForm.jenis_tindakan,
          respon: tanggapanKueriForm.respon.trim(),
          status_setelah: tanggapanKueriForm.status_setelah,
        }),
      });

      setMessage(result.message || 'Tanggapan kueri berhasil dicatat.');
      setShowTanggapanKueriForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat tanggapan kueri.');
    } finally {
      setSaving(false);
    }
  };

  const openTambahInsiden = () => {
    setEditingInsidenId(null);

    setInsidenForm({
      ...emptyInsidenForm,
      kode_insiden: `INS-${Date.now()}`,
    });

    setShowInsidenForm(true);
  };

  const openEditInsiden = (item: InsidenItem) => {
    setEditingInsidenId(item.id);

    setInsidenForm({
      kode_insiden: item.kode_insiden,
      kueri_asal_id: item.kueri_asal_id ? String(item.kueri_asal_id) : '',
      kanal_masuk: item.kanal_masuk || '',
      pelapor_id: item.pelapor_id ? String(item.pelapor_id) : '',
      waktu_terdeteksi: item.waktu_terdeteksi ? item.waktu_terdeteksi.slice(0, 16) : '',
      layanan_id: String(item.layanan_id),
      target_insiden_id: item.target_insiden_id ? String(item.target_insiden_id) : '',
      deskripsi_insiden: item.deskripsi_insiden || '',
      prioritas: item.prioritas || 'Rendah',
      diagnosa_awal: item.diagnosa_awal || '',
      target_waktu_selesai: item.target_waktu_selesai ? item.target_waktu_selesai.slice(0, 16) : '',
      status: item.status || 'Terdeteksi',
      apakah_berulang: String(item.apakah_berulang || 0),
    });

    setShowInsidenForm(true);
  };

  const submitInsiden = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const payload = {
        kode_insiden: insidenForm.kode_insiden.trim(),
        kueri_asal_id: insidenForm.kueri_asal_id ? Number(insidenForm.kueri_asal_id) : null,
        kanal_masuk: insidenForm.kanal_masuk.trim(),
        pelapor_id: insidenForm.pelapor_id ? Number(insidenForm.pelapor_id) : null,
        waktu_terdeteksi: insidenForm.waktu_terdeteksi,
        layanan_id: Number(insidenForm.layanan_id),
        target_insiden_id: insidenForm.target_insiden_id ? Number(insidenForm.target_insiden_id) : null,
        deskripsi_insiden: insidenForm.deskripsi_insiden.trim(),
        prioritas: insidenForm.prioritas,
        diagnosa_awal: insidenForm.diagnosa_awal.trim() || null,
        target_waktu_selesai: insidenForm.target_waktu_selesai || null,
        status: insidenForm.status,
        apakah_berulang: Number(insidenForm.apakah_berulang),
      };

      const result = await request(
        editingInsidenId ? `${API}/insiden/${editingInsidenId}` : `${API}/insiden`,
        {
          method: editingInsidenId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Insiden berhasil disimpan.');
      setShowInsidenForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan insiden.');
    } finally {
      setSaving(false);
    }
  };

  const deleteInsiden = async (item: InsidenItem) => {
    if (!window.confirm(`Hapus insiden ${item.kode_insiden}?`)) return;

    try {
      setMessage('');
      setError('');

      const result = await request(`${API}/insiden/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Insiden berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus insiden.');
    }
  };

  const statusInsidenByPenanganan = (jenis: string) => {
    if (jenis === 'Diagnosis') return 'Didiagnosis';
    if (jenis === 'Eskalasi') return 'Dieskalasi';
    if (jenis === 'Tindakan') return 'Ditangani';
    if (jenis === 'Pemulihan') return 'Dipulihkan';
    if (jenis === 'Penutupan') return 'Ditutup';
    return selectedInsiden?.status || 'Tercatat';
  };

  const openTambahPenangananInsiden = () => {
    if (!selectedInsiden) return;

    setPenangananInsidenForm({
      ...emptyPenangananInsidenForm,
      insiden_id: String(selectedInsiden.id),
    });

    setShowPenangananInsidenForm(true);
  };

  const submitPenangananInsiden = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const result = await request(`${API}/penanganan-insiden`, {
        method: 'POST',
        body: JSON.stringify({
          insiden_id: Number(penangananInsidenForm.insiden_id),
          pic_id: Number(penangananInsidenForm.pic_id),
          jenis_penanganan: penangananInsidenForm.jenis_penanganan,
          eskalasi_kepada: penangananInsidenForm.eskalasi_kepada.trim() || null,
          tindakan: penangananInsidenForm.tindakan.trim(),
          status_setelah: penangananInsidenForm.status_setelah,
        }),
      });

      setMessage(result.message || 'Penanganan insiden berhasil dicatat.');
      setShowPenangananInsidenForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat penanganan insiden.');
    } finally {
      setSaving(false);
    }
  };

  const openTambahMasalah = () => {
    setEditingMasalahId(null);

    setMasalahForm({
      ...emptyMasalahForm,
      kode_masalah: `MSL-${Date.now()}`,
    });

    setShowMasalahForm(true);
  };

  const openEditMasalah = (item: MasalahItem) => {
    setEditingMasalahId(item.id);

    setMasalahForm({
      kode_masalah: item.kode_masalah,
      diagnosa_akar_masalah: item.diagnosa_akar_masalah,
      deskripsi_akar_masalah: item.deskripsi_akar_masalah,
      prioritas: item.prioritas,
      solusi_sementara: item.solusi_sementara || '',
      solusi_permanen: item.solusi_permanen || '',
      target_waktu_selesai: item.target_waktu_selesai ? item.target_waktu_selesai.slice(0, 16) : '',
      status: item.status,
      memerlukan_perubahan: String(item.memerlukan_perubahan || 0),
      deskripsi_singkat_perubahan: item.deskripsi_singkat_perubahan || '',
      perubahan_id: item.perubahan_id ? String(item.perubahan_id) : '',
    });

    setShowMasalahForm(true);
  };

  const submitMasalah = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const payload = {
        kode_masalah: masalahForm.kode_masalah.trim(),
        diagnosa_akar_masalah: masalahForm.diagnosa_akar_masalah.trim(),
        deskripsi_akar_masalah: masalahForm.deskripsi_akar_masalah.trim(),
        prioritas: masalahForm.prioritas,
        solusi_sementara: masalahForm.solusi_sementara.trim() || null,
        solusi_permanen: masalahForm.solusi_permanen.trim() || null,
        target_waktu_selesai: masalahForm.target_waktu_selesai || null,
        status: masalahForm.status,
        memerlukan_perubahan: Number(masalahForm.memerlukan_perubahan),
        deskripsi_singkat_perubahan: masalahForm.deskripsi_singkat_perubahan.trim() || null,
        perubahan_id: masalahForm.perubahan_id ? Number(masalahForm.perubahan_id) : null,
      };

      const result = await request(
        editingMasalahId ? `${API}/masalah/${editingMasalahId}` : `${API}/masalah`,
        {
          method: editingMasalahId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Masalah berhasil disimpan.');
      setShowMasalahForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan masalah.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMasalah = async (item: MasalahItem) => {
    if (!window.confirm(`Hapus masalah ${item.kode_masalah}?`)) return;

    try {
      setMessage('');
      setError('');

      const result = await request(`${API}/masalah/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Masalah berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus masalah.');
    }
  };

  const openHubungkanInsiden = () => {
    if (!selectedMasalah) return;

    setMasalahInsidenForm({
      ...emptyMasalahInsidenForm,
      masalah_id: String(selectedMasalah.id),
    });

    setShowMasalahInsidenForm(true);
  };

  const submitMasalahInsiden = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const result = await request(`${API}/masalah-insiden`, {
        method: 'POST',
        body: JSON.stringify({
          masalah_id: Number(masalahInsidenForm.masalah_id),
          insiden_id: Number(masalahInsidenForm.insiden_id),
          keterangan: masalahInsidenForm.keterangan.trim() || null,
        }),
      });

      setMessage(result.message || 'Insiden berhasil dihubungkan dengan masalah.');
      setShowMasalahInsidenForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghubungkan insiden.');
    } finally {
      setSaving(false);
    }
  };

  const deleteMasalahInsiden = async (item: MasalahInsidenItem) => {
    if (!window.confirm(`Hapus hubungan dengan ${item.kode_insiden}?`)) return;

    try {
      setMessage('');
      setError('');

      const result = await request(`${API}/masalah-insiden/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Relasi insiden berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus relasi insiden.');
    }
  };

  const formatDateTime = (value: string | null | undefined) => {
    if (!value) return '-';
    return new Date(value).toLocaleString('id-ID');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Relasi Pengguna
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 3 - Penanganan Kueri
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 3;

            return (
              <div key={step.number} className="flex flex-1 items-start">
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
        <div className="border-b border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-800">
            Penanganan Kueri, Insiden, dan Masalah
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Formulir MRP3a, MRP3b, dan MRP3c Manajemen Relasi Pengguna.
          </p>
        </div>

        <div className="flex border-b border-slate-200">
          <TabButton
            active={activeTab === 'kueri'}
            onClick={() => setActiveTab('kueri')}
          >
            MRP3a - Manajemen Kueri
          </TabButton>

          <TabButton
            active={activeTab === 'insiden'}
            onClick={() => setActiveTab('insiden')}
          >
            MRP3b - Manajemen Insiden
          </TabButton>

          <TabButton
            active={activeTab === 'masalah'}
            onClick={() => setActiveTab('masalah')}
          >
            MRP3c - Manajemen Masalah
          </TabButton>
        </div>

        {activeTab === 'kueri' && (
          <div>
            <SectionHeader
              title="Daftar Kueri Pengguna"
              subtitle="Pencatatan pertanyaan, pelaporan, masukan, dan keluhan pengguna."
              button="Tambah Kueri"
              onClick={openTambahKueri}
            />

            <SearchBox
              value={searchKueri}
              onChange={setSearchKueri}
              placeholder="Cari kode, layanan, judul, jenis, urgensi, atau status..."
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1500px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Kode Kueri</Th>
                    <Th>Layanan</Th>
                    <Th>Waktu Masuk</Th>
                    <Th>Pelapor</Th>
                    <Th>Jenis</Th>
                    <Th>Judul</Th>
                    <Th>Urgensi</Th>
                    <Th>Status</Th>
                    <Th>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <EmptyRow colSpan={9} text="Memuat data..." />
                  ) : filteredKueri.length === 0 ? (
                    <EmptyRow colSpan={9} text="Belum ada data kueri." />
                  ) : (
                    filteredKueri.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 align-top hover:bg-slate-50 ${
                          selectedKueriId === item.id ? 'bg-slate-50' : ''
                        }`}
                      >
                        <Td>
                          <button
                            type="button"
                            onClick={() => setSelectedKueriId(item.id)}
                            className="font-semibold text-slate-800 hover:underline"
                          >
                            {item.kode_kueri}
                          </button>
                        </Td>

                        <Td>
                          <div className="font-medium">{item.kode_layanan}</div>
                          <div className="text-xs text-slate-500">{item.nama_layanan}</div>
                        </Td>

                        <Td>{formatDateTime(item.waktu_masuk)}</Td>
                        <Td>{item.nama_pengguna || item.email_pelapor || '-'}</Td>
                        <Td>{item.jenis}</Td>
                        <Td>{item.judul}</Td>
                        <Td>{item.urgensi}</Td>
                        <Td>{item.status}</Td>

                        <Td>
                          <ActionButtons
                            onEdit={() => openEditKueri(item)}
                            onDelete={() => deleteKueri(item)}
                          />
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <SubSectionHeader
              title="Tanggapan Kueri"
              subtitle="Riwayat respons, penugasan, eskalasi, penyelesaian, dan penutupan kueri."
              button="Tambah Tanggapan"
              disabled={!selectedKueri}
              onClick={openTambahTanggapanKueri}
            />

            <Selector
              label="Kueri"
              value={selectedKueriId || ''}
              onChange={(value) => setSelectedKueriId(Number(value))}
            >
              {kueri.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.kode_kueri} - {item.judul}
                </option>
              ))}
            </Selector>

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1200px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Waktu</Th>
                    <Th>PIC</Th>
                    <Th>Jenis Tindakan</Th>
                    <Th>Respons</Th>
                    <Th>Status Setelah</Th>
                    <Th>Realisasi Penyelesaian</Th>
                    <Th>Dicatat Oleh</Th>
                  </tr>
                </thead>

                <tbody>
                  {!selectedKueri ? (
                    <EmptyRow colSpan={7} text="Pilih kueri terlebih dahulu." />
                  ) : selectedTanggapanKueri.length === 0 ? (
                    <EmptyRow colSpan={7} text="Belum ada tanggapan kueri." />
                  ) : (
                    selectedTanggapanKueri.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{formatDateTime(item.waktu_update)}</Td>
                        <Td>{item.nama_pic}</Td>
                        <Td>{item.jenis_tindakan}</Td>
                        <Td>{item.respon}</Td>
                        <Td>{item.status_setelah}</Td>
                        <Td>
                          {item.realisasi_waktu_penyelesaian_menit !== null
                            ? `${item.realisasi_waktu_penyelesaian_menit} menit`
                            : '-'}
                        </Td>
                        <Td>{item.nama_pencatat}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'insiden' && (
          <div>
            <SectionHeader
              title="Daftar Insiden Layanan"
              subtitle="Identifikasi, diagnosis, penanganan, eskalasi, dan pemulihan insiden layanan."
              button="Tambah Insiden"
              onClick={openTambahInsiden}
            />

            <SearchBox
              value={searchInsiden}
              onChange={setSearchInsiden}
              placeholder="Cari kode insiden, kueri asal, layanan, prioritas, atau status..."
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1500px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Kode Insiden</Th>
                    <Th>Kueri Asal</Th>
                    <Th>Layanan</Th>
                    <Th>Waktu Terdeteksi</Th>
                    <Th>Prioritas</Th>
                    <Th>Diagnosa Awal</Th>
                    <Th>Berulang</Th>
                    <Th>Status</Th>
                    <Th>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <EmptyRow colSpan={9} text="Memuat data..." />
                  ) : filteredInsiden.length === 0 ? (
                    <EmptyRow colSpan={9} text="Belum ada data insiden." />
                  ) : (
                    filteredInsiden.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 align-top hover:bg-slate-50 ${
                          selectedInsidenId === item.id ? 'bg-slate-50' : ''
                        }`}
                      >
                        <Td>
                          <button
                            type="button"
                            onClick={() => setSelectedInsidenId(item.id)}
                            className="font-semibold text-slate-800 hover:underline"
                          >
                            {item.kode_insiden}
                          </button>
                        </Td>

                        <Td>{item.kode_kueri_asal || '-'}</Td>

                        <Td>
                          <div className="font-medium">{item.kode_layanan}</div>
                          <div className="text-xs text-slate-500">{item.nama_layanan}</div>
                        </Td>

                        <Td>{formatDateTime(item.waktu_terdeteksi)}</Td>
                        <Td>{item.prioritas}</Td>
                        <Td>{item.diagnosa_awal || '-'}</Td>
                        <Td>{Number(item.apakah_berulang) === 1 ? 'Ya' : 'Tidak'}</Td>
                        <Td>{item.status}</Td>

                        <Td>
                          <ActionButtons
                            onEdit={() => openEditInsiden(item)}
                            onDelete={() => deleteInsiden(item)}
                          />
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <SubSectionHeader
              title="Penanganan Insiden"
              subtitle="Riwayat diagnosis, eskalasi, tindakan, pemulihan, dan penutupan insiden."
              button="Tambah Penanganan"
              disabled={!selectedInsiden}
              onClick={openTambahPenangananInsiden}
            />

            <Selector
              label="Insiden"
              value={selectedInsidenId || ''}
              onChange={(value) => setSelectedInsidenId(Number(value))}
            >
              {insiden.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.kode_insiden} - {item.nama_layanan}
                </option>
              ))}
            </Selector>

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1300px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Waktu</Th>
                    <Th>PIC</Th>
                    <Th>Jenis Penanganan</Th>
                    <Th>Eskalasi Kepada</Th>
                    <Th>Tindakan</Th>
                    <Th>Status Setelah</Th>
                    <Th>Dicatat Oleh</Th>
                  </tr>
                </thead>

                <tbody>
                  {!selectedInsiden ? (
                    <EmptyRow colSpan={7} text="Pilih insiden terlebih dahulu." />
                  ) : selectedPenangananInsiden.length === 0 ? (
                    <EmptyRow colSpan={7} text="Belum ada riwayat penanganan insiden." />
                  ) : (
                    selectedPenangananInsiden.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{formatDateTime(item.waktu_tindakan)}</Td>
                        <Td>{item.nama_pic}</Td>
                        <Td>{item.jenis_penanganan}</Td>
                        <Td>{item.eskalasi_kepada || '-'}</Td>
                        <Td>{item.tindakan}</Td>
                        <Td>{item.status_setelah}</Td>
                        <Td>{item.nama_pencatat}</Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'masalah' && (
          <div>
            <SectionHeader
              title="Daftar Masalah / Root Cause Analysis"
              subtitle="Analisis akar penyebab insiden berulang serta penyusunan solusi sementara dan permanen."
              button="Tambah Masalah"
              onClick={openTambahMasalah}
            />

            <SearchBox
              value={searchMasalah}
              onChange={setSearchMasalah}
              placeholder="Cari kode masalah, akar masalah, prioritas, solusi, atau status..."
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1500px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Kode Masalah</Th>
                    <Th>Diagnosa Akar Masalah</Th>
                    <Th>Prioritas</Th>
                    <Th>Solusi Sementara</Th>
                    <Th>Solusi Permanen</Th>
                    <Th>Perlu Perubahan</Th>
                    <Th>Status</Th>
                    <Th>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <EmptyRow colSpan={8} text="Memuat data..." />
                  ) : filteredMasalah.length === 0 ? (
                    <EmptyRow colSpan={8} text="Belum ada data masalah." />
                  ) : (
                    filteredMasalah.map((item) => (
                      <tr
                        key={item.id}
                        className={`border-b border-slate-100 align-top hover:bg-slate-50 ${
                          selectedMasalahId === item.id ? 'bg-slate-50' : ''
                        }`}
                      >
                        <Td>
                          <button
                            type="button"
                            onClick={() => setSelectedMasalahId(item.id)}
                            className="font-semibold text-slate-800 hover:underline"
                          >
                            {item.kode_masalah}
                          </button>
                        </Td>

                        <Td>{item.diagnosa_akar_masalah}</Td>
                        <Td>{item.prioritas}</Td>
                        <Td>{item.solusi_sementara || '-'}</Td>
                        <Td>{item.solusi_permanen || '-'}</Td>
                        <Td>{Number(item.memerlukan_perubahan) === 1 ? 'Ya' : 'Tidak'}</Td>
                        <Td>{item.status}</Td>

                        <Td>
                          <ActionButtons
                            onEdit={() => openEditMasalah(item)}
                            onDelete={() => deleteMasalah(item)}
                          />
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <SubSectionHeader
              title="Insiden Terkait"
              subtitle="Daftar insiden yang menjadi dasar analisis masalah."
              button="Hubungkan Insiden"
              disabled={!selectedMasalah}
              onClick={openHubungkanInsiden}
            />

            <Selector
              label="Masalah"
              value={selectedMasalahId || ''}
              onChange={(value) => setSelectedMasalahId(Number(value))}
            >
              {masalah.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.kode_masalah} - {item.diagnosa_akar_masalah}
                </option>
              ))}
            </Selector>

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1100px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Kode Insiden</Th>
                    <Th>Layanan</Th>
                    <Th>Prioritas</Th>
                    <Th>Status Insiden</Th>
                    <Th>Berulang</Th>
                    <Th>Keterangan</Th>
                    <Th>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {!selectedMasalah ? (
                    <EmptyRow colSpan={7} text="Pilih masalah terlebih dahulu." />
                  ) : selectedMasalahInsiden.length === 0 ? (
                    <EmptyRow colSpan={7} text="Belum ada insiden yang terhubung." />
                  ) : (
                    selectedMasalahInsiden.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{item.kode_insiden}</Td>

                        <Td>
                          <div className="font-medium">{item.kode_layanan}</div>
                          <div className="text-xs text-slate-500">{item.nama_layanan}</div>
                        </Td>

                        <Td>{item.prioritas_insiden}</Td>
                        <Td>{item.status_insiden}</Td>
                        <Td>{Number(item.apakah_berulang) === 1 ? 'Ya' : 'Tidak'}</Td>
                        <Td>{item.keterangan || '-'}</Td>

                        <Td>
                          <button
                            type="button"
                            onClick={() => deleteMasalahInsiden(item)}
                            className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                          >
                            Hapus
                          </button>
                        </Td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {showKueriForm && (
        <Modal
          title={editingKueriId ? 'Edit Kueri' : 'Tambah Kueri'}
          onClose={() => setShowKueriForm(false)}
        >
          <form onSubmit={submitKueri}>
            <FormGrid>
              <Field label="Kode Kueri">
                <input
                  required
                  value={kueriForm.kode_kueri}
                  onChange={(e) => setKueriForm({ ...kueriForm, kode_kueri: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Waktu Masuk">
                <input
                  type="datetime-local"
                  required
                  value={kueriForm.waktu_masuk}
                  onChange={(e) => setKueriForm({ ...kueriForm, waktu_masuk: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Layanan Digital">
                <select
                  required
                  value={kueriForm.layanan_id}
                  onChange={(e) => setKueriForm({ ...kueriForm, layanan_id: e.target.value, target_kueri_id: '' })}
                  className={inputClass}
                >
                  <option value="">Pilih layanan</option>

                  {layananOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode_layanan} - {item.nama_layanan}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Target SLA / OLA Kueri">
                <select
                  value={kueriForm.target_kueri_id}
                  onChange={(e) => setKueriForm({ ...kueriForm, target_kueri_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Tidak ditentukan</option>

                  {targetKueriOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.prioritas} - SLA {item.sla_waktu_respon_menit ?? '-'} / {item.sla_waktu_penyelesaian_menit ?? '-'} menit
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Pengguna / Pelapor">
                <select
                  value={kueriForm.pengguna_id}
                  onChange={(e) => setKueriForm({ ...kueriForm, pengguna_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Tidak ditentukan</option>

                  {userOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Kanal Masuk">
                <input
                  required
                  value={kueriForm.kanal_masuk}
                  onChange={(e) => setKueriForm({ ...kueriForm, kanal_masuk: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Email Pelapor">
                <input
                  type="email"
                  value={kueriForm.email_pelapor}
                  onChange={(e) => setKueriForm({ ...kueriForm, email_pelapor: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Nomor HP Pelapor">
                <input
                  value={kueriForm.nomor_hp_pelapor}
                  onChange={(e) => setKueriForm({ ...kueriForm, nomor_hp_pelapor: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Jenis Kueri">
                <select
                  value={kueriForm.jenis}
                  onChange={(e) => setKueriForm({ ...kueriForm, jenis: e.target.value })}
                  className={inputClass}
                >
                  <option value="Pertanyaan">Pertanyaan</option>
                  <option value="Pelaporan">Pelaporan</option>
                  <option value="Masukan">Masukan</option>
                  <option value="Keluhan">Keluhan</option>
                </select>
              </Field>

              <Field label="Urgensi">
                <select
                  value={kueriForm.urgensi}
                  onChange={(e) => setKueriForm({ ...kueriForm, urgensi: e.target.value })}
                  className={inputClass}
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </Field>

              <Field label="Judul" full>
                <input
                  required
                  value={kueriForm.judul}
                  onChange={(e) => setKueriForm({ ...kueriForm, judul: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Cakupan Layanan Terkait" full>
                <input
                  value={kueriForm.cakupan_layanan_terkait}
                  onChange={(e) => setKueriForm({ ...kueriForm, cakupan_layanan_terkait: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Deskripsi" full>
                <textarea
                  required
                  rows={4}
                  value={kueriForm.deskripsi}
                  onChange={(e) => setKueriForm({ ...kueriForm, deskripsi: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Bukti Tambahan" full>
                <textarea
                  rows={3}
                  value={kueriForm.bukti_tambahan}
                  onChange={(e) => setKueriForm({ ...kueriForm, bukti_tambahan: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="URL Bukti" full>
                <input
                  value={kueriForm.url_bukti}
                  onChange={(e) => setKueriForm({ ...kueriForm, url_bukti: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowKueriForm(false)}
            />
          </form>
        </Modal>
      )}

      {showTanggapanKueriForm && (
        <Modal
          title="Tambah Tanggapan Kueri"
          onClose={() => setShowTanggapanKueriForm(false)}
        >
          <form onSubmit={submitTanggapanKueri}>
            <FormGrid>
              <Field label="Kueri" full>
                <input
                  disabled
                  value={selectedKueri ? `${selectedKueri.kode_kueri} - ${selectedKueri.judul}` : ''}
                  className={inputClass}
                />
              </Field>

              <Field label="PIC">
                <select
                  required
                  value={tanggapanKueriForm.pic_id}
                  onChange={(e) => setTanggapanKueriForm({ ...tanggapanKueriForm, pic_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Pilih PIC</option>

                  {userOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Jenis Tindakan">
                <select
                  value={tanggapanKueriForm.jenis_tindakan}
                  onChange={(e) => {
                    const jenis = e.target.value;

                    setTanggapanKueriForm({
                      ...tanggapanKueriForm,
                      jenis_tindakan: jenis,
                      status_setelah: statusKueriByTindakan(jenis),
                    });
                  }}
                  className={inputClass}
                >
                  <option value="Respons">Respons</option>
                  <option value="Penugasan">Penugasan</option>
                  <option value="Pembaruan">Pembaruan</option>
                  <option value="Eskalasi">Eskalasi</option>
                  <option value="Penyelesaian">Penyelesaian</option>
                  <option value="Penutupan">Penutupan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </Field>

              <Field label="Status Setelah">
                <select
                  value={tanggapanKueriForm.status_setelah}
                  onChange={(e) => setTanggapanKueriForm({ ...tanggapanKueriForm, status_setelah: e.target.value })}
                  className={inputClass}
                >
                  <option value="Diterima">Diterima</option>
                  <option value="Ditugaskan">Ditugaskan</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Dieskalasi">Dieskalasi</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditutup">Ditutup</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </Field>

              <Field label="Respons" full>
                <textarea
                  required
                  rows={4}
                  value={tanggapanKueriForm.respon}
                  onChange={(e) => setTanggapanKueriForm({ ...tanggapanKueriForm, respon: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowTanggapanKueriForm(false)}
            />
          </form>
        </Modal>
      )}

      {showInsidenForm && (
        <Modal
          title={editingInsidenId ? 'Edit Insiden' : 'Tambah Insiden'}
          onClose={() => setShowInsidenForm(false)}
        >
          <form onSubmit={submitInsiden}>
            <FormGrid>
              <Field label="Kode Insiden">
                <input
                  required
                  value={insidenForm.kode_insiden}
                  onChange={(e) => setInsidenForm({ ...insidenForm, kode_insiden: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Waktu Terdeteksi">
                <input
                  required
                  type="datetime-local"
                  value={insidenForm.waktu_terdeteksi}
                  onChange={(e) => setInsidenForm({ ...insidenForm, waktu_terdeteksi: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Layanan Digital">
                <select
                  required
                  value={insidenForm.layanan_id}
                  onChange={(e) =>
                    setInsidenForm({
                      ...insidenForm,
                      layanan_id: e.target.value,
                      kueri_asal_id: '',
                      target_insiden_id: '',
                    })
                  }
                  className={inputClass}
                >
                  <option value="">Pilih layanan</option>

                  {layananOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode_layanan} - {item.nama_layanan}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Kueri Asal">
                <select
                  value={insidenForm.kueri_asal_id}
                  onChange={(e) => setInsidenForm({ ...insidenForm, kueri_asal_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Tanpa kueri asal</option>

                  {kueriUntukInsiden.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode_kueri} - {item.judul}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Pelapor">
                <select
                  value={insidenForm.pelapor_id}
                  onChange={(e) => setInsidenForm({ ...insidenForm, pelapor_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Tidak ditentukan</option>

                  {userOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Kanal Masuk">
                <input
                  required
                  value={insidenForm.kanal_masuk}
                  onChange={(e) => setInsidenForm({ ...insidenForm, kanal_masuk: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Prioritas">
                <select
                  value={insidenForm.prioritas}
                  onChange={(e) =>
                    setInsidenForm({
                      ...insidenForm,
                      prioritas: e.target.value,
                      target_insiden_id: '',
                    })
                  }
                  className={inputClass}
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </Field>

              <Field label="Target SLA / OLA Insiden">
                <select
                  value={insidenForm.target_insiden_id}
                  onChange={(e) => setInsidenForm({ ...insidenForm, target_insiden_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Tidak ditentukan</option>

                  {targetInsidenOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.prioritas} - SLA {item.sla_waktu_respon_menit ?? '-'} / {item.sla_waktu_penyelesaian_menit ?? '-'} menit
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Deskripsi Insiden" full>
                <textarea
                  required
                  rows={4}
                  value={insidenForm.deskripsi_insiden}
                  onChange={(e) => setInsidenForm({ ...insidenForm, deskripsi_insiden: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Diagnosa Awal" full>
                <textarea
                  rows={3}
                  value={insidenForm.diagnosa_awal}
                  onChange={(e) => setInsidenForm({ ...insidenForm, diagnosa_awal: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Target Waktu Selesai">
                <input
                  type="datetime-local"
                  value={insidenForm.target_waktu_selesai}
                  onChange={(e) => setInsidenForm({ ...insidenForm, target_waktu_selesai: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Insiden Berulang">
                <select
                  value={insidenForm.apakah_berulang}
                  onChange={(e) => setInsidenForm({ ...insidenForm, apakah_berulang: e.target.value })}
                  className={inputClass}
                >
                  <option value="0">Tidak</option>
                  <option value="1">Ya</option>
                </select>
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowInsidenForm(false)}
            />
          </form>
        </Modal>
      )}

      {showPenangananInsidenForm && (
        <Modal
          title="Tambah Penanganan Insiden"
          onClose={() => setShowPenangananInsidenForm(false)}
        >
          <form onSubmit={submitPenangananInsiden}>
            <FormGrid>
              <Field label="Insiden" full>
                <input
                  disabled
                  value={selectedInsiden ? `${selectedInsiden.kode_insiden} - ${selectedInsiden.nama_layanan}` : ''}
                  className={inputClass}
                />
              </Field>

              <Field label="PIC">
                <select
                  required
                  value={penangananInsidenForm.pic_id}
                  onChange={(e) => setPenangananInsidenForm({ ...penangananInsidenForm, pic_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Pilih PIC</option>

                  {userOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nama}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Jenis Penanganan">
                <select
                  value={penangananInsidenForm.jenis_penanganan}
                  onChange={(e) => {
                    const jenis = e.target.value;

                    setPenangananInsidenForm({
                      ...penangananInsidenForm,
                      jenis_penanganan: jenis,
                      status_setelah: statusInsidenByPenanganan(jenis),
                    });
                  }}
                  className={inputClass}
                >
                  <option value="Diagnosis">Diagnosis</option>
                  <option value="Eskalasi">Eskalasi</option>
                  <option value="Tindakan">Tindakan</option>
                  <option value="Pemulihan">Pemulihan</option>
                  <option value="Penutupan">Penutupan</option>
                  <option value="Pembaruan">Pembaruan</option>
                </select>
              </Field>

              <Field label="Status Setelah">
                <select
                  value={penangananInsidenForm.status_setelah}
                  onChange={(e) => setPenangananInsidenForm({ ...penangananInsidenForm, status_setelah: e.target.value })}
                  className={inputClass}
                >
                  <option value="Terdeteksi">Terdeteksi</option>
                  <option value="Tercatat">Tercatat</option>
                  <option value="Didiagnosis">Didiagnosis</option>
                  <option value="Dieskalasi">Dieskalasi</option>
                  <option value="Ditangani">Ditangani</option>
                  <option value="Dipulihkan">Dipulihkan</option>
                  <option value="Ditutup">Ditutup</option>
                </select>
              </Field>

              <Field label="Eskalasi Kepada">
                <input
                  required={penangananInsidenForm.jenis_penanganan === 'Eskalasi'}
                  value={penangananInsidenForm.eskalasi_kepada}
                  onChange={(e) => setPenangananInsidenForm({ ...penangananInsidenForm, eskalasi_kepada: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Tindakan" full>
                <textarea
                  required
                  rows={4}
                  value={penangananInsidenForm.tindakan}
                  onChange={(e) => setPenangananInsidenForm({ ...penangananInsidenForm, tindakan: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowPenangananInsidenForm(false)}
            />
          </form>
        </Modal>
      )}

      {showMasalahForm && (
        <Modal
          title={editingMasalahId ? 'Edit Masalah' : 'Tambah Masalah'}
          onClose={() => setShowMasalahForm(false)}
        >
          <form onSubmit={submitMasalah}>
            <FormGrid>
              <Field label="Kode Masalah">
                <input
                  required
                  value={masalahForm.kode_masalah}
                  onChange={(e) => setMasalahForm({ ...masalahForm, kode_masalah: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Prioritas">
                <select
                  value={masalahForm.prioritas}
                  onChange={(e) => setMasalahForm({ ...masalahForm, prioritas: e.target.value })}
                  className={inputClass}
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </Field>

              <Field label="Diagnosa Akar Masalah" full>
                <input
                  required
                  value={masalahForm.diagnosa_akar_masalah}
                  onChange={(e) => setMasalahForm({ ...masalahForm, diagnosa_akar_masalah: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Deskripsi Akar Masalah" full>
                <textarea
                  required
                  rows={4}
                  value={masalahForm.deskripsi_akar_masalah}
                  onChange={(e) => setMasalahForm({ ...masalahForm, deskripsi_akar_masalah: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Solusi Sementara" full>
                <textarea
                  rows={3}
                  value={masalahForm.solusi_sementara}
                  onChange={(e) => setMasalahForm({ ...masalahForm, solusi_sementara: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Solusi Permanen" full>
                <textarea
                  rows={3}
                  value={masalahForm.solusi_permanen}
                  onChange={(e) => setMasalahForm({ ...masalahForm, solusi_permanen: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Target Waktu Selesai">
                <input
                  type="datetime-local"
                  value={masalahForm.target_waktu_selesai}
                  onChange={(e) => setMasalahForm({ ...masalahForm, target_waktu_selesai: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={masalahForm.status}
                  onChange={(e) => setMasalahForm({ ...masalahForm, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="Teridentifikasi">Teridentifikasi</option>
                  <option value="Dianalisis">Dianalisis</option>
                  <option value="Solusi Sementara">Solusi Sementara</option>
                  <option value="Solusi Permanen">Solusi Permanen</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditutup">Ditutup</option>
                </select>
              </Field>

              <Field label="Memerlukan Perubahan">
                <select
                  value={masalahForm.memerlukan_perubahan}
                  onChange={(e) =>
                    setMasalahForm({
                      ...masalahForm,
                      memerlukan_perubahan: e.target.value,
                      deskripsi_singkat_perubahan: e.target.value === '1'
                        ? masalahForm.deskripsi_singkat_perubahan
                        : '',
                      perubahan_id: e.target.value === '1'
                        ? masalahForm.perubahan_id
                        : '',
                    })
                  }
                  className={inputClass}
                >
                  <option value="0">Tidak</option>
                  <option value="1">Ya</option>
                </select>
              </Field>

              {masalahForm.memerlukan_perubahan === '1' && (
                <>
                  <Field label="Deskripsi Singkat Perubahan" full>
                    <textarea
                      required
                      rows={3}
                      value={masalahForm.deskripsi_singkat_perubahan}
                      onChange={(e) => setMasalahForm({ ...masalahForm, deskripsi_singkat_perubahan: e.target.value })}
                      className={inputClass}
                    />
                  </Field>

                  <Field label="ID Perubahan">
                    <input
                      type="number"
                      min="1"
                      value={masalahForm.perubahan_id}
                      onChange={(e) => setMasalahForm({ ...masalahForm, perubahan_id: e.target.value })}
                      className={inputClass}
                    />
                  </Field>
                </>
              )}
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowMasalahForm(false)}
            />
          </form>
        </Modal>
      )}

      {showMasalahInsidenForm && (
        <Modal
          title="Hubungkan Insiden"
          onClose={() => setShowMasalahInsidenForm(false)}
        >
          <form onSubmit={submitMasalahInsiden}>
            <FormGrid>
              <Field label="Masalah" full>
                <input
                  disabled
                  value={selectedMasalah ? `${selectedMasalah.kode_masalah} - ${selectedMasalah.diagnosa_akar_masalah}` : ''}
                  className={inputClass}
                />
              </Field>

              <Field label="Insiden" full>
                <select
                  required
                  value={masalahInsidenForm.insiden_id}
                  onChange={(e) => setMasalahInsidenForm({ ...masalahInsidenForm, insiden_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Pilih insiden</option>

                  {insiden.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode_insiden} - {item.nama_layanan} - {item.status}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Keterangan" full>
                <textarea
                  rows={3}
                  value={masalahInsidenForm.keterangan}
                  onChange={(e) => setMasalahInsidenForm({ ...masalahInsidenForm, keterangan: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowMasalahInsidenForm(false)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
};

const TabButton = ({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`px-5 py-3 text-sm font-semibold ${
      active
        ? 'border-b-2 border-slate-800 text-slate-800'
        : 'text-slate-500 hover:text-slate-700'
    }`}
  >
    {children}
  </button>
);

const SectionHeader = ({
  title,
  subtitle,
  button,
  onClick,
}: {
  title: string;
  subtitle: string;
  button: string;
  onClick: () => void;
}) => (
  <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
    <div>
      <h3 className="font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {subtitle}
      </p>
    </div>

    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
    >
      {button}
    </button>
  </div>
);

const SubSectionHeader = ({
  title,
  subtitle,
  button,
  disabled,
  onClick,
}: {
  title: string;
  subtitle: string;
  button: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <div className="flex flex-col gap-4 border-y border-slate-200 bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
    <div>
      <h3 className="font-semibold text-slate-800">
        {title}
      </h3>

      <p className="mt-1 text-sm text-slate-500">
        {subtitle}
      </p>
    </div>

    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {button}
    </button>
  </div>
);

const SearchBox = ({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) => (
  <div className="border-b border-slate-200 p-5">
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full max-w-lg rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
    />
  </div>
);

const Selector = ({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  children: ReactNode;
}) => (
  <div className="border-b border-slate-200 p-5">
    <div className="w-full max-w-xl">
      <label className="text-xs font-semibold uppercase text-slate-500">
        {label}
      </label>

      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
      >
        {children}
      </select>
    </div>
  </div>
);

const Th = ({ children }: { children: ReactNode }) => (
  <th className="border-b border-slate-200 px-4 py-3 text-left text-xs font-semibold uppercase text-slate-600">
    {children}
  </th>
);

const Td = ({ children }: { children: ReactNode }) => (
  <td className="px-4 py-3 text-sm text-slate-700">
    {children}
  </td>
);

const EmptyRow = ({
  colSpan,
  text,
}: {
  colSpan: number;
  text: string;
}) => (
  <tr>
    <td
      colSpan={colSpan}
      className="px-4 py-10 text-center text-sm text-slate-500"
    >
      {text}
    </td>
  </tr>
);

const ActionButtons = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <div className="flex gap-2">
    <button
      type="button"
      onClick={onEdit}
      className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
    >
      Edit
    </button>

    <button
      type="button"
      onClick={onDelete}
      className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
    >
      Hapus
    </button>
  </div>
);

const Modal = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-slate-800">
          {title}
        </h2>

        <button
          type="button"
          onClick={onClose}
          className="text-xl text-slate-400 hover:text-slate-600"
        >
          ×
        </button>
      </div>

      <div className="p-6">
        {children}
      </div>
    </div>
  </div>
);

const FormGrid = ({ children }: { children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
    {children}
  </div>
);

const Field = ({
  label,
  full = false,
  children,
}: {
  label: string;
  full?: boolean;
  children: ReactNode;
}) => (
  <div className={full ? 'md:col-span-2' : ''}>
    <label className="text-sm font-medium text-slate-700">
      {label}
    </label>

    {children}
  </div>
);

const ModalButtons = ({
  saving,
  onCancel,
}: {
  saving: boolean;
  onCancel: () => void;
}) => (
  <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
    <button
      type="button"
      onClick={onCancel}
      className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Batal
    </button>

    <button
      type="submit"
      disabled={saving}
      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50"
    >
      {saving ? 'Menyimpan...' : 'Simpan'}
    </button>
  </div>
);

export default PenangananRelasiPenggunaPage;