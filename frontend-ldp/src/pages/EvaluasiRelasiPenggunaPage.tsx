import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api/relasi-pengguna';
const PENGETAHUAN_API = 'http://localhost:5000/api/pengetahuan';

type InstansiOption = {
  id: number;
  kode_instansi: string;
  nama_instansi: string;
};

type UserOption = {
  id: number;
  nama: string;
};

type StandarItem = {
  id: number;
  katalog_layanan_id: number;
  versi: number;
  status: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
};

type TargetItem = {
  id: number;
  standar_layanan_id: number;
  jenis: string;
  prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  sla_waktu_respon_menit: number | null;
  sla_waktu_penyelesaian_menit: number | null;
  ola_waktu_respon_menit: number | null;
  ola_waktu_penyelesaian_menit: number | null;
};

type EvaluasiItem = {
  id: number;
  kode_evaluasi: string;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  periode_mulai: string;
  periode_selesai: string;
  tanggal_evaluasi: string;
  status: string;
  dievaluasi_oleh: number;
  nama_evaluator: string;
  catatan: string | null;
};

type EvaluasiLayananItem = {
  id: number;
  evaluasi_id: number;
  kode_evaluasi: string;
  standar_layanan_id: number;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  versi_standar: number;
  cakupan_layanan_snapshot: string | null;
  kesenjangan: string | null;
  lesson_learned: string | null;
  kesimpulan: string | null;
};

type EvaluasiKueriInsidenItem = {
  id: number;
  evaluasi_id: number;
  kode_evaluasi: string;
  target_kueri_insiden_id: number;
  jenis: string;
  prioritas: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  target_waktu_respon_menit: number | null;
  rata_rata_waktu_respon_menit: number | null;
  pencapaian_respon_persen: number | null;
  target_waktu_penyelesaian_menit: number | null;
  rata_rata_waktu_penyelesaian_menit: number | null;
  pencapaian_penyelesaian_persen: number | null;
  kesenjangan: string | null;
  lesson_learned: string | null;
};

type RencanaPerbaikanItem = {
  id: number;
  evaluasi_id: number;
  kode_evaluasi: string;
  evaluasi_layanan_id: number | null;
  evaluasi_kueri_insiden_id: number | null;
  uraian_kesenjangan: string;
  rencana_perbaikan: string;
  prioritas: string;
  pic_id: number;
  nama_pic: string;
  target_selesai: string;
  status: string;
  memerlukan_perubahan: number;
  perubahan_id: number | null;
  kode_perubahan: string | null;
  catatan: string | null;
};

type EvaluasiForm = {
  kode_evaluasi: string;
  instansi_id: string;
  periode_mulai: string;
  periode_selesai: string;
  tanggal_evaluasi: string;
  status: string;
  catatan: string;
};

type EvaluasiLayananForm = {
  standar_layanan_id: string;
  cakupan_layanan_snapshot: string;
  kesenjangan: string;
  lesson_learned: string;
  kesimpulan: string;
};

type EvaluasiKueriInsidenForm = {
  target_kueri_insiden_id: string;
  rata_rata_waktu_respon_menit: string;
  pencapaian_respon_persen: string;
  rata_rata_waktu_penyelesaian_menit: string;
  pencapaian_penyelesaian_persen: string;
  kesenjangan: string;
  lesson_learned: string;
};

type RencanaPerbaikanForm = {
  sumber: 'layanan' | 'kueri-insiden';
  evaluasi_layanan_id: string;
  evaluasi_kueri_insiden_id: string;
  uraian_kesenjangan: string;
  rencana_perbaikan: string;
  prioritas: string;
  pic_id: string;
  target_selesai: string;
  status: string;
  memerlukan_perubahan: string;
  perubahan_id: string;
  catatan: string;
};

const emptyEvaluasiForm: EvaluasiForm = {
  kode_evaluasi: '',
  instansi_id: '',
  periode_mulai: '',
  periode_selesai: '',
  tanggal_evaluasi: '',
  status: 'Draft',
  catatan: '',
};

const emptyEvaluasiLayananForm: EvaluasiLayananForm = {
  standar_layanan_id: '',
  cakupan_layanan_snapshot: '',
  kesenjangan: '',
  lesson_learned: '',
  kesimpulan: '',
};

const emptyEvaluasiKueriInsidenForm: EvaluasiKueriInsidenForm = {
  target_kueri_insiden_id: '',
  rata_rata_waktu_respon_menit: '',
  pencapaian_respon_persen: '',
  rata_rata_waktu_penyelesaian_menit: '',
  pencapaian_penyelesaian_persen: '',
  kesenjangan: '',
  lesson_learned: '',
};

const emptyRencanaPerbaikanForm: RencanaPerbaikanForm = {
  sumber: 'layanan',
  evaluasi_layanan_id: '',
  evaluasi_kueri_insiden_id: '',
  uraian_kesenjangan: '',
  rencana_perbaikan: '',
  prioritas: 'Sedang',
  pic_id: '',
  target_selesai: '',
  status: 'Direncanakan',
  memerlukan_perubahan: '0',
  perubahan_id: '',
  catatan: '',
};

const processSteps = [
  { number: 1, label: 'Perencanaan Layanan', route: '/relasi-pengguna/perencanaan' },
  { number: 2, label: 'Pengajuan Layanan', route: '/relasi-pengguna/permintaan' },
  { number: 3, label: 'Penanganan Kueri', route: '/relasi-pengguna/penanganan' },
  { number: 4, label: 'Evaluasi', route: '/relasi-pengguna/evaluasi' },
];

const EvaluasiRelasiPenggunaPage = () => {
  const navigate = useNavigate();

  const [instansiOptions, setInstansiOptions] = useState<InstansiOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [standar, setStandar] = useState<StandarItem[]>([]);
  const [target, setTarget] = useState<TargetItem[]>([]);
  const [evaluasi, setEvaluasi] = useState<EvaluasiItem[]>([]);
  const [evaluasiLayanan, setEvaluasiLayanan] = useState<EvaluasiLayananItem[]>([]);
  const [evaluasiKueriInsiden, setEvaluasiKueriInsiden] = useState<EvaluasiKueriInsidenItem[]>([]);
  const [rencanaPerbaikan, setRencanaPerbaikan] = useState<RencanaPerbaikanItem[]>([]);

  const [selectedEvaluasiId, setSelectedEvaluasiId] = useState<number | null>(null);

  const [evaluasiForm, setEvaluasiForm] = useState<EvaluasiForm>(emptyEvaluasiForm);
  const [evaluasiLayananForm, setEvaluasiLayananForm] = useState<EvaluasiLayananForm>(emptyEvaluasiLayananForm);
  const [evaluasiKueriInsidenForm, setEvaluasiKueriInsidenForm] = useState<EvaluasiKueriInsidenForm>(emptyEvaluasiKueriInsidenForm);
  const [rencanaPerbaikanForm, setRencanaPerbaikanForm] = useState<RencanaPerbaikanForm>(emptyRencanaPerbaikanForm);

  const [editingEvaluasiId, setEditingEvaluasiId] = useState<number | null>(null);
  const [editingEvaluasiLayananId, setEditingEvaluasiLayananId] = useState<number | null>(null);
  const [editingEvaluasiKueriInsidenId, setEditingEvaluasiKueriInsidenId] = useState<number | null>(null);
  const [editingRencanaId, setEditingRencanaId] = useState<number | null>(null);

  const [showEvaluasiForm, setShowEvaluasiForm] = useState(false);
  const [showEvaluasiLayananForm, setShowEvaluasiLayananForm] = useState(false);
  const [showEvaluasiKueriInsidenForm, setShowEvaluasiKueriInsidenForm] = useState(false);
  const [showRencanaForm, setShowRencanaForm] = useState(false);

  const [searchEvaluasi, setSearchEvaluasi] = useState('');
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
        instansiResult,
        userResult,
        standarResult,
        targetResult,
        evaluasiResult,
        evaluasiLayananResult,
        evaluasiKueriInsidenResult,
        rencanaResult,
      ] = await Promise.all([
        request(`${PENGETAHUAN_API}/instansi-options`),
        request(`${API}/user-options`),
        request(`${API}/standar-layanan`),
        request(`${API}/target-kueri-insiden`),
        request(`${API}/evaluasi`),
        request(`${API}/evaluasi-layanan`),
        request(`${API}/evaluasi-kueri-insiden`),
        request(`${API}/rencana-perbaikan`),
      ]);

      setInstansiOptions(rowsOf<InstansiOption>(instansiResult));
      setUserOptions(rowsOf<UserOption>(userResult));
      setStandar(rowsOf<StandarItem>(standarResult));
      setTarget(rowsOf<TargetItem>(targetResult));
      setEvaluasi(rowsOf<EvaluasiItem>(evaluasiResult));
      setEvaluasiLayanan(rowsOf<EvaluasiLayananItem>(evaluasiLayananResult));
      setEvaluasiKueriInsiden(rowsOf<EvaluasiKueriInsidenItem>(evaluasiKueriInsidenResult));
      setRencanaPerbaikan(rowsOf<RencanaPerbaikanItem>(rencanaResult));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data MRP4.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (evaluasi.length === 0) {
      setSelectedEvaluasiId(null);
      return;
    }

    setSelectedEvaluasiId((current) => current !== null && evaluasi.some((item) => item.id === current) ? current : evaluasi[0].id);
  }, [evaluasi]);

  const selectedEvaluasi = useMemo(
    () => evaluasi.find((item) => item.id === selectedEvaluasiId) || null,
    [evaluasi, selectedEvaluasiId]
  );

  const selectedEvaluasiLayanan = useMemo(
    () => evaluasiLayanan.filter((item) => item.evaluasi_id === selectedEvaluasiId),
    [evaluasiLayanan, selectedEvaluasiId]
  );

  const selectedEvaluasiKueriInsiden = useMemo(
    () => evaluasiKueriInsiden.filter((item) => item.evaluasi_id === selectedEvaluasiId),
    [evaluasiKueriInsiden, selectedEvaluasiId]
  );

  const selectedRencana = useMemo(
    () => rencanaPerbaikan.filter((item) => item.evaluasi_id === selectedEvaluasiId),
    [rencanaPerbaikan, selectedEvaluasiId]
  );

  const filteredEvaluasi = useMemo(() => {
    const keyword = searchEvaluasi.toLowerCase().trim();

    if (!keyword) return evaluasi;

    return evaluasi.filter((item) =>
      [
        item.kode_evaluasi,
        item.kode_instansi,
        item.nama_instansi,
        item.status,
        item.nama_evaluator,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [evaluasi, searchEvaluasi]);

  const openTambahEvaluasi = () => {
    setEditingEvaluasiId(null);
    setEvaluasiForm({
      ...emptyEvaluasiForm,
      kode_evaluasi: `EV-${Date.now()}`,
    });
    setShowEvaluasiForm(true);
  };

  const openEditEvaluasi = (item: EvaluasiItem) => {
    setEditingEvaluasiId(item.id);
    setEvaluasiForm({
      kode_evaluasi: item.kode_evaluasi,
      instansi_id: String(item.instansi_id),
      periode_mulai: item.periode_mulai,
      periode_selesai: item.periode_selesai,
      tanggal_evaluasi: item.tanggal_evaluasi,
      status: item.status,
      catatan: item.catatan || '',
    });
    setShowEvaluasiForm(true);
  };

  const submitEvaluasi = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = {
        kode_evaluasi: evaluasiForm.kode_evaluasi.trim(),
        instansi_id: Number(evaluasiForm.instansi_id),
        periode_mulai: evaluasiForm.periode_mulai,
        periode_selesai: evaluasiForm.periode_selesai,
        tanggal_evaluasi: evaluasiForm.tanggal_evaluasi,
        status: evaluasiForm.status,
        catatan: evaluasiForm.catatan.trim() || null,
      };

      const result = await request(
        editingEvaluasiId ? `${API}/evaluasi/${editingEvaluasiId}` : `${API}/evaluasi`,
        {
          method: editingEvaluasiId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Evaluasi berhasil disimpan.');
      setShowEvaluasiForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan evaluasi.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvaluasi = async (item: EvaluasiItem) => {
    if (!window.confirm(`Hapus evaluasi ${item.kode_evaluasi}?`)) return;

    try {
      const result = await request(`${API}/evaluasi/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Evaluasi berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus evaluasi.');
    }
  };

  const openTambahEvaluasiLayanan = () => {
    if (!selectedEvaluasi) return;

    setEditingEvaluasiLayananId(null);
    setEvaluasiLayananForm(emptyEvaluasiLayananForm);
    setShowEvaluasiLayananForm(true);
  };

  const openEditEvaluasiLayanan = (item: EvaluasiLayananItem) => {
    setEditingEvaluasiLayananId(item.id);
    setEvaluasiLayananForm({
      standar_layanan_id: String(item.standar_layanan_id),
      cakupan_layanan_snapshot: item.cakupan_layanan_snapshot || '',
      kesenjangan: item.kesenjangan || '',
      lesson_learned: item.lesson_learned || '',
      kesimpulan: item.kesimpulan || '',
    });
    setShowEvaluasiLayananForm(true);
  };

  const submitEvaluasiLayanan = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedEvaluasi) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const payload = editingEvaluasiLayananId
        ? {
            cakupan_layanan_snapshot: evaluasiLayananForm.cakupan_layanan_snapshot.trim() || null,
            kesenjangan: evaluasiLayananForm.kesenjangan.trim() || null,
            lesson_learned: evaluasiLayananForm.lesson_learned.trim() || null,
            kesimpulan: evaluasiLayananForm.kesimpulan.trim() || null,
          }
        : {
            evaluasi_id: selectedEvaluasi.id,
            standar_layanan_id: Number(evaluasiLayananForm.standar_layanan_id),
            cakupan_layanan_snapshot: evaluasiLayananForm.cakupan_layanan_snapshot.trim() || null,
            kesenjangan: evaluasiLayananForm.kesenjangan.trim() || null,
            lesson_learned: evaluasiLayananForm.lesson_learned.trim() || null,
            kesimpulan: evaluasiLayananForm.kesimpulan.trim() || null,
          };

      const result = await request(
        editingEvaluasiLayananId
          ? `${API}/evaluasi-layanan/${editingEvaluasiLayananId}`
          : `${API}/evaluasi-layanan`,
        {
          method: editingEvaluasiLayananId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Evaluasi layanan berhasil disimpan.');
      setShowEvaluasiLayananForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan evaluasi layanan.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvaluasiLayanan = async (item: EvaluasiLayananItem) => {
    if (!window.confirm(`Hapus evaluasi layanan ${item.kode_layanan}?`)) return;

    try {
      const result = await request(`${API}/evaluasi-layanan/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Evaluasi layanan berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus evaluasi layanan.');
    }
  };

  const openTambahEvaluasiKueriInsiden = () => {
    if (!selectedEvaluasi) return;

    setEditingEvaluasiKueriInsidenId(null);
    setEvaluasiKueriInsidenForm(emptyEvaluasiKueriInsidenForm);
    setShowEvaluasiKueriInsidenForm(true);
  };

  const openEditEvaluasiKueriInsiden = (item: EvaluasiKueriInsidenItem) => {
    setEditingEvaluasiKueriInsidenId(item.id);
    setEvaluasiKueriInsidenForm({
      target_kueri_insiden_id: String(item.target_kueri_insiden_id),
      rata_rata_waktu_respon_menit: item.rata_rata_waktu_respon_menit !== null ? String(item.rata_rata_waktu_respon_menit) : '',
      pencapaian_respon_persen: item.pencapaian_respon_persen !== null ? String(item.pencapaian_respon_persen) : '',
      rata_rata_waktu_penyelesaian_menit: item.rata_rata_waktu_penyelesaian_menit !== null ? String(item.rata_rata_waktu_penyelesaian_menit) : '',
      pencapaian_penyelesaian_persen: item.pencapaian_penyelesaian_persen !== null ? String(item.pencapaian_penyelesaian_persen) : '',
      kesenjangan: item.kesenjangan || '',
      lesson_learned: item.lesson_learned || '',
    });
    setShowEvaluasiKueriInsidenForm(true);
  };

  const submitEvaluasiKueriInsiden = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedEvaluasi) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const nilai = (value: string) => value === '' ? null : Number(value);

      const payload = editingEvaluasiKueriInsidenId
        ? {
            rata_rata_waktu_respon_menit: nilai(evaluasiKueriInsidenForm.rata_rata_waktu_respon_menit),
            pencapaian_respon_persen: nilai(evaluasiKueriInsidenForm.pencapaian_respon_persen),
            rata_rata_waktu_penyelesaian_menit: nilai(evaluasiKueriInsidenForm.rata_rata_waktu_penyelesaian_menit),
            pencapaian_penyelesaian_persen: nilai(evaluasiKueriInsidenForm.pencapaian_penyelesaian_persen),
            kesenjangan: evaluasiKueriInsidenForm.kesenjangan.trim() || null,
            lesson_learned: evaluasiKueriInsidenForm.lesson_learned.trim() || null,
          }
        : {
            evaluasi_id: selectedEvaluasi.id,
            target_kueri_insiden_id: Number(evaluasiKueriInsidenForm.target_kueri_insiden_id),
            rata_rata_waktu_respon_menit: nilai(evaluasiKueriInsidenForm.rata_rata_waktu_respon_menit),
            pencapaian_respon_persen: nilai(evaluasiKueriInsidenForm.pencapaian_respon_persen),
            rata_rata_waktu_penyelesaian_menit: nilai(evaluasiKueriInsidenForm.rata_rata_waktu_penyelesaian_menit),
            pencapaian_penyelesaian_persen: nilai(evaluasiKueriInsidenForm.pencapaian_penyelesaian_persen),
            kesenjangan: evaluasiKueriInsidenForm.kesenjangan.trim() || null,
            lesson_learned: evaluasiKueriInsidenForm.lesson_learned.trim() || null,
          };

      const result = await request(
        editingEvaluasiKueriInsidenId
          ? `${API}/evaluasi-kueri-insiden/${editingEvaluasiKueriInsidenId}`
          : `${API}/evaluasi-kueri-insiden`,
        {
          method: editingEvaluasiKueriInsidenId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Evaluasi kueri dan insiden berhasil disimpan.');
      setShowEvaluasiKueriInsidenForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan evaluasi kueri dan insiden.');
    } finally {
      setSaving(false);
    }
  };

  const deleteEvaluasiKueriInsiden = async (item: EvaluasiKueriInsidenItem) => {
    if (!window.confirm(`Hapus evaluasi ${item.jenis} ${item.prioritas}?`)) return;

    try {
      const result = await request(`${API}/evaluasi-kueri-insiden/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Evaluasi kueri dan insiden berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus evaluasi kueri dan insiden.');
    }
  };

  const openTambahRencana = () => {
    if (!selectedEvaluasi) return;

    setEditingRencanaId(null);
    setRencanaPerbaikanForm(emptyRencanaPerbaikanForm);
    setShowRencanaForm(true);
  };

  const openEditRencana = (item: RencanaPerbaikanItem) => {
    setEditingRencanaId(item.id);
    setRencanaPerbaikanForm({
      sumber: item.evaluasi_layanan_id ? 'layanan' : 'kueri-insiden',
      evaluasi_layanan_id: item.evaluasi_layanan_id ? String(item.evaluasi_layanan_id) : '',
      evaluasi_kueri_insiden_id: item.evaluasi_kueri_insiden_id ? String(item.evaluasi_kueri_insiden_id) : '',
      uraian_kesenjangan: item.uraian_kesenjangan,
      rencana_perbaikan: item.rencana_perbaikan,
      prioritas: item.prioritas,
      pic_id: String(item.pic_id),
      target_selesai: item.target_selesai,
      status: item.status,
      memerlukan_perubahan: String(item.memerlukan_perubahan || 0),
      perubahan_id: item.perubahan_id ? String(item.perubahan_id) : '',
      catatan: item.catatan || '',
    });
    setShowRencanaForm(true);
  };

  const submitRencana = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedEvaluasi) return;

    try {
      setSaving(true);
      setError('');
      setMessage('');

      const basePayload = {
        uraian_kesenjangan: rencanaPerbaikanForm.uraian_kesenjangan.trim(),
        rencana_perbaikan: rencanaPerbaikanForm.rencana_perbaikan.trim(),
        prioritas: rencanaPerbaikanForm.prioritas,
        pic_id: Number(rencanaPerbaikanForm.pic_id),
        target_selesai: rencanaPerbaikanForm.target_selesai,
        status: rencanaPerbaikanForm.status,
        memerlukan_perubahan: Number(rencanaPerbaikanForm.memerlukan_perubahan),
        perubahan_id: rencanaPerbaikanForm.memerlukan_perubahan === '1' && rencanaPerbaikanForm.perubahan_id
          ? Number(rencanaPerbaikanForm.perubahan_id)
          : null,
        catatan: rencanaPerbaikanForm.catatan.trim() || null,
      };

      const payload = editingRencanaId
        ? basePayload
        : {
            evaluasi_id: selectedEvaluasi.id,
            evaluasi_layanan_id: rencanaPerbaikanForm.sumber === 'layanan'
              ? Number(rencanaPerbaikanForm.evaluasi_layanan_id)
              : null,
            evaluasi_kueri_insiden_id: rencanaPerbaikanForm.sumber === 'kueri-insiden'
              ? Number(rencanaPerbaikanForm.evaluasi_kueri_insiden_id)
              : null,
            ...basePayload,
          };

      const result = await request(
        editingRencanaId ? `${API}/rencana-perbaikan/${editingRencanaId}` : `${API}/rencana-perbaikan`,
        {
          method: editingRencanaId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Rencana perbaikan berhasil disimpan.');
      setShowRencanaForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan rencana perbaikan.');
    } finally {
      setSaving(false);
    }
  };

  const deleteRencana = async (item: RencanaPerbaikanItem) => {
    if (!window.confirm('Hapus rencana perbaikan ini?')) return;

    try {
      const result = await request(`${API}/rencana-perbaikan/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Rencana perbaikan berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus rencana perbaikan.');
    }
  };

  const formatDate = (value: string | null | undefined) => {
    if (!value) return '-';
    return new Date(`${value}T00:00:00`).toLocaleDateString('id-ID');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Relasi Pengguna
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 4 - Evaluasi
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 4;

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
        <SectionHeader
          title="Formulir MRP4 - Evaluasi"
          subtitle="Evaluasi pencapaian SLA dan OLA, kesenjangan kinerja, lesson learned, dan rencana perbaikan."
          button="Tambah Evaluasi"
          onClick={openTambahEvaluasi}
        />

        <div className="border-b border-slate-200 p-5">
          <input
            value={searchEvaluasi}
            onChange={(e) => setSearchEvaluasi(e.target.value)}
            placeholder="Cari kode evaluasi, instansi, status, atau evaluator..."
            className="w-full max-w-lg rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Kode Evaluasi</Th>
                <Th>Instansi</Th>
                <Th>Periode</Th>
                <Th>Tanggal Evaluasi</Th>
                <Th>Evaluator</Th>
                <Th>Status</Th>
                <Th>Catatan</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <EmptyRow colSpan={8} text="Memuat data..." />
              ) : filteredEvaluasi.length === 0 ? (
                <EmptyRow colSpan={8} text="Belum ada data evaluasi." />
              ) : (
                filteredEvaluasi.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 align-top hover:bg-slate-50 ${
                      selectedEvaluasiId === item.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <Td>
                      <button
                        type="button"
                        onClick={() => setSelectedEvaluasiId(item.id)}
                        className="font-semibold text-slate-800 hover:underline"
                      >
                        {item.kode_evaluasi}
                      </button>
                    </Td>

                    <Td>{item.kode_instansi} - {item.nama_instansi}</Td>
                    <Td>{formatDate(item.periode_mulai)} s.d. {formatDate(item.periode_selesai)}</Td>
                    <Td>{formatDate(item.tanggal_evaluasi)}</Td>
                    <Td>{item.nama_evaluator}</Td>
                    <Td>{item.status}</Td>
                    <Td>{item.catatan || '-'}</Td>

                    <Td>
                      <ActionButtons
                        onEdit={() => openEditEvaluasi(item)}
                        onDelete={() => deleteEvaluasi(item)}
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-y border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-800">
            Bagian 1 - Evaluasi Capaian SLA-OLA Layanan
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Evaluasi kinerja penyelenggaraan layanan terhadap standar SLA dan OLA.
          </p>
        </div>

        <SubSectionHeader
          title={selectedEvaluasi ? `${selectedEvaluasi.kode_evaluasi} - ${selectedEvaluasi.nama_instansi}` : 'Pilih evaluasi terlebih dahulu'}
          button="Tambah Evaluasi Layanan"
          disabled={!selectedEvaluasi}
          onClick={openTambahEvaluasiLayanan}
        />

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1400px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Layanan</Th>
                <Th>Versi</Th>
                <Th>Cakupan Layanan</Th>
                <Th>Kesenjangan</Th>
                <Th>Lesson Learned</Th>
                <Th>Kesimpulan</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>

            <tbody>
              {!selectedEvaluasi ? (
                <EmptyRow colSpan={7} text="Pilih evaluasi terlebih dahulu." />
              ) : selectedEvaluasiLayanan.length === 0 ? (
                <EmptyRow colSpan={7} text="Belum ada evaluasi capaian layanan." />
              ) : (
                selectedEvaluasiLayanan.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                    <Td>
                      <div className="font-medium">{item.kode_layanan}</div>
                      <div className="text-xs text-slate-500">{item.nama_layanan}</div>
                    </Td>

                    <Td>{item.versi_standar}</Td>
                    <Td>{item.cakupan_layanan_snapshot || '-'}</Td>
                    <Td>{item.kesenjangan || '-'}</Td>
                    <Td>{item.lesson_learned || '-'}</Td>
                    <Td>{item.kesimpulan || '-'}</Td>

                    <Td>
                      <ActionButtons
                        onEdit={() => openEditEvaluasiLayanan(item)}
                        onDelete={() => deleteEvaluasiLayanan(item)}
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-y border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-800">
            Bagian 2 - Evaluasi Capaian SLA-OLA Manajemen Kueri & Insiden
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Evaluasi pencapaian target waktu respon dan penyelesaian kueri maupun insiden.
          </p>
        </div>

        <SubSectionHeader
          title={selectedEvaluasi ? `${selectedEvaluasi.kode_evaluasi} - ${selectedEvaluasi.nama_instansi}` : 'Pilih evaluasi terlebih dahulu'}
          button="Tambah Evaluasi Kueri / Insiden"
          disabled={!selectedEvaluasi}
          onClick={openTambahEvaluasiKueriInsiden}
        />

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1700px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Layanan</Th>
                <Th>Jenis</Th>
                <Th>Prioritas</Th>
                <Th>Target Respon</Th>
                <Th>Rata-rata Respon</Th>
                <Th>Pencapaian Respon</Th>
                <Th>Target Penyelesaian</Th>
                <Th>Rata-rata Penyelesaian</Th>
                <Th>Pencapaian Penyelesaian</Th>
                <Th>Kesenjangan</Th>
                <Th>Lesson Learned</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>

            <tbody>
              {!selectedEvaluasi ? (
                <EmptyRow colSpan={12} text="Pilih evaluasi terlebih dahulu." />
              ) : selectedEvaluasiKueriInsiden.length === 0 ? (
                <EmptyRow colSpan={12} text="Belum ada evaluasi kueri dan insiden." />
              ) : (
                selectedEvaluasiKueriInsiden.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                    <Td>
                      <div className="font-medium">{item.kode_layanan}</div>
                      <div className="text-xs text-slate-500">{item.nama_layanan}</div>
                    </Td>

                    <Td>{item.jenis}</Td>
                    <Td>{item.prioritas}</Td>
                    <Td>{item.target_waktu_respon_menit ?? '-'} menit</Td>
                    <Td>{item.rata_rata_waktu_respon_menit ?? '-'} menit</Td>
                    <Td>{item.pencapaian_respon_persen ?? '-'}%</Td>
                    <Td>{item.target_waktu_penyelesaian_menit ?? '-'} menit</Td>
                    <Td>{item.rata_rata_waktu_penyelesaian_menit ?? '-'} menit</Td>
                    <Td>{item.pencapaian_penyelesaian_persen ?? '-'}%</Td>
                    <Td>{item.kesenjangan || '-'}</Td>
                    <Td>{item.lesson_learned || '-'}</Td>

                    <Td>
                      <ActionButtons
                        onEdit={() => openEditEvaluasiKueriInsiden(item)}
                        onDelete={() => deleteEvaluasiKueriInsiden(item)}
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-y border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-800">
            Rencana Perbaikan Layanan
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Tindak lanjut terhadap kesenjangan hasil evaluasi untuk siklus peningkatan layanan berikutnya.
          </p>
        </div>

        <SubSectionHeader
          title={selectedEvaluasi ? `${selectedEvaluasi.kode_evaluasi} - ${selectedEvaluasi.nama_instansi}` : 'Pilih evaluasi terlebih dahulu'}
          button="Tambah Rencana Perbaikan"
          disabled={!selectedEvaluasi}
          onClick={openTambahRencana}
        />

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1500px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Sumber Evaluasi</Th>
                <Th>Uraian Kesenjangan</Th>
                <Th>Rencana Perbaikan</Th>
                <Th>Prioritas</Th>
                <Th>PIC</Th>
                <Th>Target Selesai</Th>
                <Th>Status</Th>
                <Th>Perubahan</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>

            <tbody>
              {!selectedEvaluasi ? (
                <EmptyRow colSpan={9} text="Pilih evaluasi terlebih dahulu." />
              ) : selectedRencana.length === 0 ? (
                <EmptyRow colSpan={9} text="Belum ada rencana perbaikan." />
              ) : (
                selectedRencana.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                    <Td>
                      {item.evaluasi_layanan_id
                        ? 'Evaluasi Layanan'
                        : 'Evaluasi Kueri / Insiden'}
                    </Td>

                    <Td>{item.uraian_kesenjangan}</Td>
                    <Td>{item.rencana_perbaikan}</Td>
                    <Td>{item.prioritas}</Td>
                    <Td>{item.nama_pic}</Td>
                    <Td>{formatDate(item.target_selesai)}</Td>
                    <Td>{item.status}</Td>
                    <Td>{Number(item.memerlukan_perubahan) === 1 ? item.kode_perubahan || 'Ya' : 'Tidak'}</Td>

                    <Td>
                      <ActionButtons
                        onEdit={() => openEditRencana(item)}
                        onDelete={() => deleteRencana(item)}
                      />
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showEvaluasiForm && (
        <Modal
          title={editingEvaluasiId ? 'Edit Evaluasi' : 'Tambah Evaluasi'}
          onClose={() => setShowEvaluasiForm(false)}
        >
          <form onSubmit={submitEvaluasi}>
            <FormGrid>
              <Field label="Kode Evaluasi">
                <input
                  required
                  value={evaluasiForm.kode_evaluasi}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, kode_evaluasi: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Instansi">
                <select
                  required
                  value={evaluasiForm.instansi_id}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, instansi_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Pilih instansi</option>

                  {instansiOptions.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode_instansi} - {item.nama_instansi}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Periode Mulai">
                <input
                  type="date"
                  required
                  value={evaluasiForm.periode_mulai}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, periode_mulai: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Periode Selesai">
                <input
                  type="date"
                  required
                  value={evaluasiForm.periode_selesai}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, periode_selesai: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Tanggal Evaluasi">
                <input
                  type="date"
                  required
                  value={evaluasiForm.tanggal_evaluasi}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, tanggal_evaluasi: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={evaluasiForm.status}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="Draft">Draft</option>
                  <option value="Final">Final</option>
                </select>
              </Field>

              <Field label="Catatan" full>
                <textarea
                  rows={4}
                  value={evaluasiForm.catatan}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, catatan: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowEvaluasiForm(false)}
            />
          </form>
        </Modal>
      )}

      {showEvaluasiLayananForm && (
        <Modal
          title={editingEvaluasiLayananId ? 'Edit Evaluasi SLA-OLA Layanan' : 'Tambah Evaluasi SLA-OLA Layanan'}
          onClose={() => setShowEvaluasiLayananForm(false)}
        >
          <form onSubmit={submitEvaluasiLayanan}>
            <FormGrid>
              <Field label="Layanan / Standar" full>
                <select
                  required
                  disabled={editingEvaluasiLayananId !== null}
                  value={evaluasiLayananForm.standar_layanan_id}
                  onChange={(e) => setEvaluasiLayananForm({ ...evaluasiLayananForm, standar_layanan_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Pilih layanan</option>

                  {standar.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode_layanan} - {item.nama_layanan} - Versi {item.versi}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Cakupan Layanan" full>
                <textarea
                  rows={3}
                  value={evaluasiLayananForm.cakupan_layanan_snapshot}
                  onChange={(e) => setEvaluasiLayananForm({ ...evaluasiLayananForm, cakupan_layanan_snapshot: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Kesenjangan" full>
                <textarea
                  rows={3}
                  value={evaluasiLayananForm.kesenjangan}
                  onChange={(e) => setEvaluasiLayananForm({ ...evaluasiLayananForm, kesenjangan: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Lesson Learned" full>
                <textarea
                  rows={3}
                  value={evaluasiLayananForm.lesson_learned}
                  onChange={(e) => setEvaluasiLayananForm({ ...evaluasiLayananForm, lesson_learned: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Kesimpulan" full>
                <textarea
                  rows={3}
                  value={evaluasiLayananForm.kesimpulan}
                  onChange={(e) => setEvaluasiLayananForm({ ...evaluasiLayananForm, kesimpulan: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowEvaluasiLayananForm(false)}
            />
          </form>
        </Modal>
      )}

      {showEvaluasiKueriInsidenForm && (
        <Modal
          title={editingEvaluasiKueriInsidenId ? 'Edit Evaluasi Kueri / Insiden' : 'Tambah Evaluasi Kueri / Insiden'}
          onClose={() => setShowEvaluasiKueriInsidenForm(false)}
        >
          <form onSubmit={submitEvaluasiKueriInsiden}>
            <FormGrid>
              <Field label="Target Kueri / Insiden" full>
                <select
                  required
                  disabled={editingEvaluasiKueriInsidenId !== null}
                  value={evaluasiKueriInsidenForm.target_kueri_insiden_id}
                  onChange={(e) => setEvaluasiKueriInsidenForm({ ...evaluasiKueriInsidenForm, target_kueri_insiden_id: e.target.value })}
                  className={inputClass}
                >
                  <option value="">Pilih target</option>

                  {target.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.kode_layanan} - {item.nama_layanan} - {item.jenis} - {item.prioritas}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Rata-rata Waktu Respon (menit)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={evaluasiKueriInsidenForm.rata_rata_waktu_respon_menit}
                  onChange={(e) => setEvaluasiKueriInsidenForm({ ...evaluasiKueriInsidenForm, rata_rata_waktu_respon_menit: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Pencapaian Respon (%)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={evaluasiKueriInsidenForm.pencapaian_respon_persen}
                  onChange={(e) => setEvaluasiKueriInsidenForm({ ...evaluasiKueriInsidenForm, pencapaian_respon_persen: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Rata-rata Waktu Penyelesaian (menit)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={evaluasiKueriInsidenForm.rata_rata_waktu_penyelesaian_menit}
                  onChange={(e) => setEvaluasiKueriInsidenForm({ ...evaluasiKueriInsidenForm, rata_rata_waktu_penyelesaian_menit: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Pencapaian Penyelesaian (%)">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={evaluasiKueriInsidenForm.pencapaian_penyelesaian_persen}
                  onChange={(e) => setEvaluasiKueriInsidenForm({ ...evaluasiKueriInsidenForm, pencapaian_penyelesaian_persen: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Kesenjangan" full>
                <textarea
                  rows={3}
                  value={evaluasiKueriInsidenForm.kesenjangan}
                  onChange={(e) => setEvaluasiKueriInsidenForm({ ...evaluasiKueriInsidenForm, kesenjangan: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Lesson Learned" full>
                <textarea
                  rows={3}
                  value={evaluasiKueriInsidenForm.lesson_learned}
                  onChange={(e) => setEvaluasiKueriInsidenForm({ ...evaluasiKueriInsidenForm, lesson_learned: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowEvaluasiKueriInsidenForm(false)}
            />
          </form>
        </Modal>
      )}

      {showRencanaForm && (
        <Modal
          title={editingRencanaId ? 'Edit Rencana Perbaikan' : 'Tambah Rencana Perbaikan'}
          onClose={() => setShowRencanaForm(false)}
        >
          <form onSubmit={submitRencana}>
            <FormGrid>
              {!editingRencanaId && (
                <>
                  <Field label="Sumber Evaluasi">
                    <select
                      value={rencanaPerbaikanForm.sumber}
                      onChange={(e) =>
                        setRencanaPerbaikanForm({
                          ...rencanaPerbaikanForm,
                          sumber: e.target.value as 'layanan' | 'kueri-insiden',
                          evaluasi_layanan_id: '',
                          evaluasi_kueri_insiden_id: '',
                        })
                      }
                      className={inputClass}
                    >
                      <option value="layanan">Evaluasi Layanan</option>
                      <option value="kueri-insiden">Evaluasi Kueri / Insiden</option>
                    </select>
                  </Field>

                  {rencanaPerbaikanForm.sumber === 'layanan' ? (
                    <Field label="Evaluasi Layanan">
                      <select
                        required
                        value={rencanaPerbaikanForm.evaluasi_layanan_id}
                        onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, evaluasi_layanan_id: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Pilih evaluasi layanan</option>

                        {selectedEvaluasiLayanan.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.kode_layanan} - {item.nama_layanan}
                          </option>
                        ))}
                      </select>
                    </Field>
                  ) : (
                    <Field label="Evaluasi Kueri / Insiden">
                      <select
                        required
                        value={rencanaPerbaikanForm.evaluasi_kueri_insiden_id}
                        onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, evaluasi_kueri_insiden_id: e.target.value })}
                        className={inputClass}
                      >
                        <option value="">Pilih evaluasi</option>

                        {selectedEvaluasiKueriInsiden.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.kode_layanan} - {item.jenis} - {item.prioritas}
                          </option>
                        ))}
                      </select>
                    </Field>
                  )}
                </>
              )}

              <Field label="Prioritas">
                <select
                  value={rencanaPerbaikanForm.prioritas}
                  onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, prioritas: e.target.value })}
                  className={inputClass}
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </Field>

              <Field label="PIC">
                <select
                  required
                  value={rencanaPerbaikanForm.pic_id}
                  onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, pic_id: e.target.value })}
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

              <Field label="Uraian Kesenjangan" full>
                <textarea
                  required
                  rows={3}
                  value={rencanaPerbaikanForm.uraian_kesenjangan}
                  onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, uraian_kesenjangan: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Rencana Perbaikan" full>
                <textarea
                  required
                  rows={4}
                  value={rencanaPerbaikanForm.rencana_perbaikan}
                  onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, rencana_perbaikan: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Target Selesai">
                <input
                  type="date"
                  required
                  value={rencanaPerbaikanForm.target_selesai}
                  onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, target_selesai: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Status">
                <select
                  value={rencanaPerbaikanForm.status}
                  onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, status: e.target.value })}
                  className={inputClass}
                >
                  <option value="Direncanakan">Direncanakan</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </Field>

              <Field label="Memerlukan Perubahan">
                <select
                  value={rencanaPerbaikanForm.memerlukan_perubahan}
                  onChange={(e) =>
                    setRencanaPerbaikanForm({
                      ...rencanaPerbaikanForm,
                      memerlukan_perubahan: e.target.value,
                      perubahan_id: e.target.value === '1'
                        ? rencanaPerbaikanForm.perubahan_id
                        : '',
                    })
                  }
                  className={inputClass}
                >
                  <option value="0">Tidak</option>
                  <option value="1">Ya</option>
                </select>
              </Field>

              {rencanaPerbaikanForm.memerlukan_perubahan === '1' && (
                <Field label="ID Perubahan">
                  <input
                    type="number"
                    min="1"
                    value={rencanaPerbaikanForm.perubahan_id}
                    onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, perubahan_id: e.target.value })}
                    className={inputClass}
                  />
                </Field>
              )}

              <Field label="Catatan" full>
                <textarea
                  rows={3}
                  value={rencanaPerbaikanForm.catatan}
                  onChange={(e) => setRencanaPerbaikanForm({ ...rencanaPerbaikanForm, catatan: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowRencanaForm(false)}
            />
          </form>
        </Modal>
      )}
    </div>
  );
};

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
      <h2 className="text-lg font-semibold text-slate-800">
        {title}
      </h2>

      <p className="mt-1 text-sm text-slate-500">
        {subtitle}
      </p>
    </div>

    <button
      type="button"
      onClick={onClick}
      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
    >
      {button}
    </button>
  </div>
);

const SubSectionHeader = ({
  title,
  button,
  disabled,
  onClick,
}: {
  title: string;
  button: string;
  disabled?: boolean;
  onClick: () => void;
}) => (
  <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
    <p className="text-sm font-semibold text-slate-800">
      {title}
    </p>

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

export default EvaluasiRelasiPenggunaPage;