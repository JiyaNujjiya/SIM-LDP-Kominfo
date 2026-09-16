import { FormEvent, ReactNode, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api/relasi-pengguna';

type LayananOption = {
  id: number;
  kode_layanan: string;
  nama_layanan: string;
};

type UserOption = {
  id: number;
  nama: string;
  email: string;
  role: string;
};

type StandarItem = {
  id: number;
  katalog_layanan_id: number;
  versi: number;
  status: string;
  kode_layanan: string;
  nama_layanan: string;
  layanan_id?: number;
};

type PermintaanItem = {
  id: number;
  kode_request: string;
  pengguna_id: number | null;
  nama_pengguna: string | null;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  standar_layanan_id: number | null;
  versi_standar: number | null;
  waktu_masuk: string;
  cakupan_layanan_terkait: string | null;
  email_pelapor: string | null;
  nomor_hp_pelapor: string | null;
  kanal_masuk: string;
  url_persyaratan_bukti: string | null;
  deskripsi_permintaan: string;
  urgensi: string;
  status: string;
  dibuat_oleh: string;
};

type TanggapanItem = {
  id: number;
  permintaan_layanan_id: number;
  kode_request: string;
  layanan_id: number;
  kode_layanan: string;
  nama_layanan: string;
  status_permintaan: string;
  pic_id: number;
  nama_pic: string;
  jenis_tindakan: string;
  tindakan: string;
  status_setelah: string;
  waktu_update: string;
  catatan: string | null;
  nama_pencatat: string;
};

type EvaluasiItem = {
  id: number;
  permintaan_layanan_id: number;
  kode_request: string;
  layanan_id: number;
  standar_layanan_id: number | null;
  waktu_masuk: string;
  urgensi: string;
  status_permintaan: string;
  kode_layanan: string;
  nama_layanan: string;
  target_waktu_respon_menit: number | null;
  realisasi_waktu_respon_menit: number | null;
  pencapaian_respon_persen: number | null;
  target_waktu_penyelesaian_menit: number | null;
  realisasi_waktu_penyelesaian_menit: number | null;
  pencapaian_penyelesaian_persen: number | null;
  keterangan_ketepatan: string;
  nama_evaluator: string;
  tanggal_evaluasi: string;
  catatan: string | null;
};

type PermintaanForm = {
  kode_request: string;
  pengguna_id: string;
  layanan_id: string;
  waktu_masuk: string;
  cakupan_layanan_terkait: string;
  email_pelapor: string;
  nomor_hp_pelapor: string;
  kanal_masuk: string;
  url_persyaratan_bukti: string;
  deskripsi_permintaan: string;
  urgensi: string;
};

type TanggapanForm = {
  permintaan_layanan_id: string;
  pic_id: string;
  jenis_tindakan: string;
  tindakan: string;
  status_setelah: string;
  catatan: string;
};

type EvaluasiForm = {
  permintaan_layanan_id: string;
  realisasi_waktu_respon_menit: string;
  realisasi_waktu_penyelesaian_menit: string;
  catatan: string;
};

const emptyPermintaanForm: PermintaanForm = {
  kode_request: '',
  pengguna_id: '',
  layanan_id: '',
  waktu_masuk: '',
  cakupan_layanan_terkait: '',
  email_pelapor: '',
  nomor_hp_pelapor: '',
  kanal_masuk: '',
  url_persyaratan_bukti: '',
  deskripsi_permintaan: '',
  urgensi: 'Rendah',
};

const emptyTanggapanForm: TanggapanForm = {
  permintaan_layanan_id: '',
  pic_id: '',
  jenis_tindakan: 'Verifikasi',
  tindakan: '',
  status_setelah: 'Diverifikasi',
  catatan: '',
};

const emptyEvaluasiForm: EvaluasiForm = {
  permintaan_layanan_id: '',
  realisasi_waktu_respon_menit: '',
  realisasi_waktu_penyelesaian_menit: '',
  catatan: '',
};

const processSteps = [
  { number: 1, label: 'Perencanaan Layanan', route: '/relasi-pengguna/perencanaan' },
  { number: 2, label: 'Pengajuan Layanan', route: '/relasi-pengguna/permintaan-layanan' },
  { number: 3, label: 'Penanganan Kueri', route: '/relasi-pengguna/penanganan' },
  { number: 4, label: 'Evaluasi', route: '/relasi-pengguna/evaluasi' },
];

const PermintaanRelasiPenggunaPage = () => {
  const navigate = useNavigate();

  const [layananOptions, setLayananOptions] = useState<LayananOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [standar, setStandar] = useState<StandarItem[]>([]);
  const [permintaan, setPermintaan] = useState<PermintaanItem[]>([]);
  const [tanggapan, setTanggapan] = useState<TanggapanItem[]>([]);
  const [evaluasi, setEvaluasi] = useState<EvaluasiItem[]>([]);

  const [permintaanForm, setPermintaanForm] = useState<PermintaanForm>(emptyPermintaanForm);
  const [tanggapanForm, setTanggapanForm] = useState<TanggapanForm>(emptyTanggapanForm);
  const [evaluasiForm, setEvaluasiForm] = useState<EvaluasiForm>(emptyEvaluasiForm);

  const [editingPermintaanId, setEditingPermintaanId] = useState<number | null>(null);
  const [showPermintaanForm, setShowPermintaanForm] = useState(false);
  const [showTanggapanForm, setShowTanggapanForm] = useState(false);
  const [showEvaluasiForm, setShowEvaluasiForm] = useState(false);

  const [searchPermintaan, setSearchPermintaan] = useState('');
  const [selectedPermintaanId, setSelectedPermintaanId] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputClass = 'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500';

  const request = async (url: string, options: RequestInit = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('token')}`,
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

      const [layananResult, userResult, standarResult, permintaanResult, tanggapanResult, evaluasiResult] = await Promise.all([
        request(`${API}/layanan-options`),
        request(`${API}/user-options`),
        request(`${API}/standar-layanan`),
        request(`${API}/permintaan-layanan`),
        request(`${API}/tanggapan-permintaan`),
        request(`${API}/evaluasi-permintaan`),
      ]);

      setLayananOptions(rowsOf<LayananOption>(layananResult));
      setUserOptions(rowsOf<UserOption>(userResult));
      setStandar(rowsOf<StandarItem>(standarResult));
      setPermintaan(rowsOf<PermintaanItem>(permintaanResult));
      setTanggapan(rowsOf<TanggapanItem>(tanggapanResult));
      setEvaluasi(rowsOf<EvaluasiItem>(evaluasiResult));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data MRP2.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (permintaan.length === 0) {
      setSelectedPermintaanId(null);
      return;
    }

    setSelectedPermintaanId((current) => {
      if (current !== null && permintaan.some((item) => item.id === current)) return current;
      return permintaan[0].id;
    });
  }, [permintaan]);

  const selectedPermintaan = useMemo(
    () => permintaan.find((item) => item.id === selectedPermintaanId) || null,
    [permintaan, selectedPermintaanId]
  );

  const filteredPermintaan = useMemo(() => {
    const keyword = searchPermintaan.toLowerCase().trim();

    if (!keyword) return permintaan;

    return permintaan.filter((item) =>
      [
        item.kode_request,
        item.kode_layanan,
        item.nama_layanan,
        item.nama_pengguna,
        item.kanal_masuk,
        item.deskripsi_permintaan,
        item.urgensi,
        item.status,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [permintaan, searchPermintaan]);

  const selectedTanggapan = useMemo(
    () => tanggapan.filter((item) => item.permintaan_layanan_id === selectedPermintaanId),
    [tanggapan, selectedPermintaanId]
  );

  const selectedEvaluasi = useMemo(
    () => evaluasi.find((item) => item.permintaan_layanan_id === selectedPermintaanId) || null,
    [evaluasi, selectedPermintaanId]
  );

  const getStandarForLayanan = (layananId: number) => {
    const kandidat = standar.filter((item) => {
      if (item.layanan_id !== undefined) return Number(item.layanan_id) === Number(layananId);

      return permintaan.some(
        (requestItem) =>
          requestItem.layanan_id === Number(layananId) &&
          requestItem.standar_layanan_id === item.id
      );
    });

    return kandidat.find((item) => item.status === 'Aktif') || kandidat[0] || null;
  };

  const openTambahPermintaan = () => {
    setEditingPermintaanId(null);
    setPermintaanForm({
      ...emptyPermintaanForm,
      kode_request: `MRP-${Date.now()}`,
    });
    setShowPermintaanForm(true);
  };

  const openEditPermintaan = (item: PermintaanItem) => {
    setEditingPermintaanId(item.id);
    setPermintaanForm({
      kode_request: item.kode_request,
      pengguna_id: item.pengguna_id ? String(item.pengguna_id) : '',
      layanan_id: String(item.layanan_id),
      waktu_masuk: item.waktu_masuk ? item.waktu_masuk.slice(0, 16) : '',
      cakupan_layanan_terkait: item.cakupan_layanan_terkait || '',
      email_pelapor: item.email_pelapor || '',
      nomor_hp_pelapor: item.nomor_hp_pelapor || '',
      kanal_masuk: item.kanal_masuk || '',
      url_persyaratan_bukti: item.url_persyaratan_bukti || '',
      deskripsi_permintaan: item.deskripsi_permintaan || '',
      urgensi: item.urgensi || 'Rendah',
    });
    setShowPermintaanForm(true);
  };

  const submitPermintaan = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const layananId = Number(permintaanForm.layanan_id);
      const standarAktif = getStandarForLayanan(layananId);

      const payload = {
        kode_request: permintaanForm.kode_request.trim(),
        pengguna_id: permintaanForm.pengguna_id ? Number(permintaanForm.pengguna_id) : null,
        layanan_id: layananId,
        standar_layanan_id: standarAktif?.id || null,
        waktu_masuk: permintaanForm.waktu_masuk,
        cakupan_layanan_terkait: permintaanForm.cakupan_layanan_terkait.trim() || null,
        email_pelapor: permintaanForm.email_pelapor.trim() || null,
        nomor_hp_pelapor: permintaanForm.nomor_hp_pelapor.trim() || null,
        kanal_masuk: permintaanForm.kanal_masuk.trim(),
        url_persyaratan_bukti: permintaanForm.url_persyaratan_bukti.trim() || null,
        deskripsi_permintaan: permintaanForm.deskripsi_permintaan.trim(),
        urgensi: permintaanForm.urgensi,
        ...(editingPermintaanId ? {} : { status: 'Diajukan' }),
      };

      const result = await request(
        editingPermintaanId
          ? `${API}/permintaan-layanan/${editingPermintaanId}`
          : `${API}/permintaan-layanan`,
        {
          method: editingPermintaanId ? 'PUT' : 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(result.message || 'Permintaan layanan berhasil disimpan.');
      setShowPermintaanForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan permintaan layanan.');
    } finally {
      setSaving(false);
    }
  };

  const deletePermintaan = async (item: PermintaanItem) => {
    if (!window.confirm(`Hapus permintaan ${item.kode_request}?`)) return;

    try {
      setMessage('');
      setError('');

      const result = await request(`${API}/permintaan-layanan/${item.id}`, {
        method: 'DELETE',
      });

      setMessage(result.message || 'Permintaan layanan berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus permintaan layanan.');
    }
  };

  const openTambahTanggapan = () => {
    if (!selectedPermintaan) return;

    setTanggapanForm({
      ...emptyTanggapanForm,
      permintaan_layanan_id: String(selectedPermintaan.id),
    });
    setShowTanggapanForm(true);
  };

  const submitTanggapan = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const result = await request(`${API}/tanggapan-permintaan`, {
        method: 'POST',
        body: JSON.stringify({
          permintaan_layanan_id: Number(tanggapanForm.permintaan_layanan_id),
          pic_id: Number(tanggapanForm.pic_id),
          jenis_tindakan: tanggapanForm.jenis_tindakan,
          tindakan: tanggapanForm.tindakan.trim(),
          status_setelah: tanggapanForm.status_setelah,
          catatan: tanggapanForm.catatan.trim() || null,
        }),
      });

      setMessage(result.message || 'Tanggapan berhasil dicatat.');
      setShowTanggapanForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mencatat tanggapan.');
    } finally {
      setSaving(false);
    }
  };

  const openTambahEvaluasi = () => {
    if (!selectedPermintaan) return;

    setEvaluasiForm({
      ...emptyEvaluasiForm,
      permintaan_layanan_id: String(selectedPermintaan.id),
    });
    setShowEvaluasiForm(true);
  };

  const submitEvaluasi = async (event: FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const selected = permintaan.find(
        (item) => item.id === Number(evaluasiForm.permintaan_layanan_id)
      );

      const targetStandar = selected?.standar_layanan_id
        ? standar.find((item) => item.id === selected.standar_layanan_id)
        : null;

      const slaItem = targetStandar
        ? await request(`${API}/standar-layanan/${targetStandar.id}/sla`)
        : null;

      const slaData = Array.isArray(slaItem) ? slaItem[0] : slaItem?.data || slaItem;

      const targetRespon = Number(slaData?.target_waktu_respon_menit || 0);
      const targetPenyelesaian = Number(slaData?.target_waktu_penyelesaian_menit || 0);
      const realisasiRespon = Number(evaluasiForm.realisasi_waktu_respon_menit);
      const realisasiPenyelesaian = Number(evaluasiForm.realisasi_waktu_penyelesaian_menit);

      const pencapaianRespon =
        targetRespon > 0 && realisasiRespon > 0
          ? Number(((targetRespon / realisasiRespon) * 100).toFixed(2))
          : null;

      const pencapaianPenyelesaian =
        targetPenyelesaian > 0 && realisasiPenyelesaian > 0
          ? Number(((targetPenyelesaian / realisasiPenyelesaian) * 100).toFixed(2))
          : null;

      const result = await request(`${API}/evaluasi-permintaan`, {
        method: 'POST',
        body: JSON.stringify({
          permintaan_layanan_id: Number(evaluasiForm.permintaan_layanan_id),
          realisasi_waktu_respon_menit: realisasiRespon,
          pencapaian_respon_persen: pencapaianRespon,
          realisasi_waktu_penyelesaian_menit: realisasiPenyelesaian,
          pencapaian_penyelesaian_persen: pencapaianPenyelesaian,
          catatan: evaluasiForm.catatan.trim() || null,
        }),
      });

      setMessage(result.message || 'Evaluasi permintaan berhasil disimpan.');
      setShowEvaluasiForm(false);
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan evaluasi.');
    } finally {
      setSaving(false);
    }
  };

  const statusAfterJenis = (jenis: string) => {
    if (jenis === 'Verifikasi') return 'Diverifikasi';
    if (jenis === 'Penugasan') return 'Ditugaskan';
    if (jenis === 'Respons') return 'Diproses';
    if (jenis === 'Proses') return 'Diproses';
    if (jenis === 'Penyelesaian') return 'Selesai';
    if (jenis === 'Penolakan') return 'Ditolak';
    if (jenis === 'Pembatalan') return 'Dibatalkan';
    return selectedPermintaan?.status || 'Diajukan';
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
          Proses 2 - Pengajuan Layanan
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 2;

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
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir MRP2 - Permintaan Layanan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pencatatan, verifikasi, penugasan, pemrosesan, dan penyelesaian service request.
            </p>
          </div>

          <button
            type="button"
            onClick={openTambahPermintaan}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Tambah Permintaan
          </button>
        </div>

        <div className="border-b border-slate-200 p-5">
          <input
            value={searchPermintaan}
            onChange={(e) => setSearchPermintaan(e.target.value)}
            placeholder="Cari kode request, layanan, pengguna, kanal, urgensi, atau status..."
            className="w-full max-w-lg rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
          />
        </div>

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1500px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Kode Request</Th>
                <Th>Pengguna</Th>
                <Th>Layanan</Th>
                <Th>Waktu Masuk</Th>
                <Th>Kanal</Th>
                <Th>Deskripsi</Th>
                <Th>Urgensi</Th>
                <Th>Status</Th>
                <Th>Aksi</Th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <EmptyRow colSpan={9} text="Memuat data..." />
              ) : filteredPermintaan.length === 0 ? (
                <EmptyRow colSpan={9} text="Belum ada permintaan layanan." />
              ) : (
                filteredPermintaan.map((item) => (
                  <tr
                    key={item.id}
                    className={`border-b border-slate-100 align-top hover:bg-slate-50 ${
                      selectedPermintaanId === item.id ? 'bg-slate-50' : ''
                    }`}
                  >
                    <Td>
                      <button
                        type="button"
                        onClick={() => setSelectedPermintaanId(item.id)}
                        className="font-semibold text-slate-800 hover:underline"
                      >
                        {item.kode_request}
                      </button>
                    </Td>

                    <Td>{item.nama_pengguna || '-'}</Td>

                    <Td>
                      <div className="font-medium">{item.kode_layanan}</div>
                      <div className="text-xs text-slate-500">{item.nama_layanan}</div>
                    </Td>

                    <Td>{formatDateTime(item.waktu_masuk)}</Td>
                    <Td>{item.kanal_masuk}</Td>
                    <Td>{item.deskripsi_permintaan}</Td>
                    <Td>{item.urgensi}</Td>
                    <Td>{item.status}</Td>

                    <Td>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedPermintaanId(item.id);
                            openEditPermintaan(item);
                          }}
                          className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => deletePermintaan(item)}
                          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100"
                        >
                          Hapus
                        </button>
                      </div>
                    </Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-y border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-800">
            Tanggapan / Penanganan Permintaan
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Riwayat verifikasi, penugasan, respons, proses, dan penyelesaian permintaan.
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div className="w-full max-w-xl">
            <label className="text-xs font-semibold uppercase text-slate-500">
              Permintaan Layanan
            </label>

            <select
              value={selectedPermintaanId || ''}
              onChange={(e) => setSelectedPermintaanId(Number(e.target.value))}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            >
              {permintaan.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.kode_request} - {item.nama_layanan}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            disabled={!selectedPermintaan}
            onClick={openTambahTanggapan}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Tambah Tanggapan
          </button>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1200px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Waktu</Th>
                <Th>PIC</Th>
                <Th>Jenis Tindakan</Th>
                <Th>Tindakan</Th>
                <Th>Status Setelah</Th>
                <Th>Catatan</Th>
                <Th>Dicatat Oleh</Th>
              </tr>
            </thead>

            <tbody>
              {!selectedPermintaan ? (
                <EmptyRow colSpan={7} text="Pilih permintaan layanan terlebih dahulu." />
              ) : selectedTanggapan.length === 0 ? (
                <EmptyRow colSpan={7} text="Belum ada riwayat tanggapan." />
              ) : (
                selectedTanggapan.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <Td>{formatDateTime(item.waktu_update)}</Td>
                    <Td>{item.nama_pic}</Td>
                    <Td>{item.jenis_tindakan}</Td>
                    <Td>{item.tindakan}</Td>
                    <Td>{item.status_setelah}</Td>
                    <Td>{item.catatan || '-'}</Td>
                    <Td>{item.nama_pencatat}</Td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="border-y border-slate-200 bg-slate-50 p-5">
          <h3 className="font-semibold text-slate-800">
            Evaluasi Permintaan Layanan
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Evaluasi realisasi waktu respon dan penyelesaian terhadap target SLA.
          </p>
        </div>

        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            {selectedPermintaan && (
              <>
                <p className="text-sm font-semibold text-slate-800">
                  {selectedPermintaan.kode_request} - {selectedPermintaan.nama_layanan}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Status saat ini: {selectedPermintaan.status}
                </p>
              </>
            )}
          </div>

          <button
            type="button"
            disabled={
              !selectedPermintaan ||
              selectedPermintaan.status !== 'Selesai' ||
              selectedEvaluasi !== null
            }
            onClick={openTambahEvaluasi}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {selectedEvaluasi ? 'Sudah Dievaluasi' : 'Tambah Evaluasi'}
          </button>
        </div>

        <div className="overflow-x-auto p-5">
          <table className="min-w-[1400px] w-full">
            <thead className="bg-slate-50">
              <tr>
                <Th>Request</Th>
                <Th>Target Respon</Th>
                <Th>Realisasi Respon</Th>
                <Th>Pencapaian Respon</Th>
                <Th>Target Penyelesaian</Th>
                <Th>Realisasi Penyelesaian</Th>
                <Th>Pencapaian Penyelesaian</Th>
                <Th>Ketepatan</Th>
                <Th>Evaluator</Th>
                <Th>Catatan</Th>
              </tr>
            </thead>

            <tbody>
              {!selectedEvaluasi ? (
                <EmptyRow colSpan={10} text="Belum ada evaluasi untuk permintaan ini." />
              ) : (
                <tr className="border-b border-slate-100 hover:bg-slate-50">
                  <Td>{selectedEvaluasi.kode_request}</Td>
                  <Td>{selectedEvaluasi.target_waktu_respon_menit ?? '-'} menit</Td>
                  <Td>{selectedEvaluasi.realisasi_waktu_respon_menit ?? '-'} menit</Td>
                  <Td>{selectedEvaluasi.pencapaian_respon_persen ?? '-'}%</Td>
                  <Td>{selectedEvaluasi.target_waktu_penyelesaian_menit ?? '-'} menit</Td>
                  <Td>{selectedEvaluasi.realisasi_waktu_penyelesaian_menit ?? '-'} menit</Td>
                  <Td>{selectedEvaluasi.pencapaian_penyelesaian_persen ?? '-'}%</Td>
                  <Td>{selectedEvaluasi.keterangan_ketepatan}</Td>
                  <Td>{selectedEvaluasi.nama_evaluator}</Td>
                  <Td>{selectedEvaluasi.catatan || '-'}</Td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showPermintaanForm && (
        <Modal
          title={editingPermintaanId ? 'Edit Permintaan Layanan' : 'Tambah Permintaan Layanan'}
          onClose={() => setShowPermintaanForm(false)}
        >
          <form onSubmit={submitPermintaan}>
            <FormGrid>
              <Field label="Kode Request">
                <input
                  required
                  value={permintaanForm.kode_request}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, kode_request: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Waktu Masuk">
                <input
                  type="datetime-local"
                  required
                  value={permintaanForm.waktu_masuk}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, waktu_masuk: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Pengguna / Pelapor">
                <select
                  value={permintaanForm.pengguna_id}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, pengguna_id: e.target.value })}
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

              <Field label="Layanan Digital">
                <select
                  required
                  value={permintaanForm.layanan_id}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, layanan_id: e.target.value })}
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

              <Field label="Email Pelapor">
                <input
                  type="email"
                  value={permintaanForm.email_pelapor}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, email_pelapor: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Nomor HP Pelapor">
                <input
                  value={permintaanForm.nomor_hp_pelapor}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, nomor_hp_pelapor: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Kanal Masuk">
                <input
                  required
                  value={permintaanForm.kanal_masuk}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, kanal_masuk: e.target.value })}
                  placeholder="Contoh: Website"
                  className={inputClass}
                />
              </Field>

              <Field label="Urgensi">
                <select
                  value={permintaanForm.urgensi}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, urgensi: e.target.value })}
                  className={inputClass}
                >
                  <option value="Rendah">Rendah</option>
                  <option value="Sedang">Sedang</option>
                  <option value="Tinggi">Tinggi</option>
                </select>
              </Field>

              <Field label="Cakupan Layanan Terkait" full>
                <input
                  value={permintaanForm.cakupan_layanan_terkait}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, cakupan_layanan_terkait: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="URL Persyaratan / Bukti" full>
                <input
                  value={permintaanForm.url_persyaratan_bukti}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, url_persyaratan_bukti: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Deskripsi Permintaan" full>
                <textarea
                  required
                  rows={4}
                  value={permintaanForm.deskripsi_permintaan}
                  onChange={(e) => setPermintaanForm({ ...permintaanForm, deskripsi_permintaan: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowPermintaanForm(false)}
            />
          </form>
        </Modal>
      )}

      {showTanggapanForm && (
        <Modal
          title="Tambah Tanggapan Permintaan"
          onClose={() => setShowTanggapanForm(false)}
        >
          <form onSubmit={submitTanggapan}>
            <FormGrid>
              <Field label="Permintaan Layanan" full>
                <input
                  disabled
                  value={
                    selectedPermintaan
                      ? `${selectedPermintaan.kode_request} - ${selectedPermintaan.nama_layanan}`
                      : ''
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="PIC">
                <select
                  required
                  value={tanggapanForm.pic_id}
                  onChange={(e) => setTanggapanForm({ ...tanggapanForm, pic_id: e.target.value })}
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
                  value={tanggapanForm.jenis_tindakan}
                  onChange={(e) => {
                    const jenis = e.target.value;

                    setTanggapanForm({
                      ...tanggapanForm,
                      jenis_tindakan: jenis,
                      status_setelah: statusAfterJenis(jenis),
                    });
                  }}
                  className={inputClass}
                >
                  <option value="Verifikasi">Verifikasi</option>
                  <option value="Penugasan">Penugasan</option>
                  <option value="Respons">Respons</option>
                  <option value="Proses">Proses</option>
                  <option value="Penyelesaian">Penyelesaian</option>
                  <option value="Penolakan">Penolakan</option>
                  <option value="Pembatalan">Pembatalan</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </Field>

              <Field label="Status Setelah">
                <select
                  value={tanggapanForm.status_setelah}
                  onChange={(e) => setTanggapanForm({ ...tanggapanForm, status_setelah: e.target.value })}
                  className={inputClass}
                >
                  <option value="Diajukan">Diajukan</option>
                  <option value="Diverifikasi">Diverifikasi</option>
                  <option value="Ditugaskan">Ditugaskan</option>
                  <option value="Diproses">Diproses</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Ditolak">Ditolak</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </Field>

              <Field label="Tindakan" full>
                <textarea
                  required
                  rows={4}
                  value={tanggapanForm.tindakan}
                  onChange={(e) => setTanggapanForm({ ...tanggapanForm, tindakan: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Catatan" full>
                <textarea
                  rows={3}
                  value={tanggapanForm.catatan}
                  onChange={(e) => setTanggapanForm({ ...tanggapanForm, catatan: e.target.value })}
                  className={inputClass}
                />
              </Field>
            </FormGrid>

            <ModalButtons
              saving={saving}
              onCancel={() => setShowTanggapanForm(false)}
            />
          </form>
        </Modal>
      )}

      {showEvaluasiForm && (
        <Modal
          title="Evaluasi Permintaan Layanan"
          onClose={() => setShowEvaluasiForm(false)}
        >
          <form onSubmit={submitEvaluasi}>
            <FormGrid>
              <Field label="Permintaan Layanan" full>
                <input
                  disabled
                  value={
                    selectedPermintaan
                      ? `${selectedPermintaan.kode_request} - ${selectedPermintaan.nama_layanan}`
                      : ''
                  }
                  className={inputClass}
                />
              </Field>

              <Field label="Realisasi Waktu Respon (menit)">
                <input
                  type="number"
                  min="0"
                  required
                  value={evaluasiForm.realisasi_waktu_respon_menit}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, realisasi_waktu_respon_menit: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Realisasi Waktu Penyelesaian (menit)">
                <input
                  type="number"
                  min="0"
                  required
                  value={evaluasiForm.realisasi_waktu_penyelesaian_menit}
                  onChange={(e) => setEvaluasiForm({ ...evaluasiForm, realisasi_waktu_penyelesaian_menit: e.target.value })}
                  className={inputClass}
                />
              </Field>

              <Field label="Catatan Evaluasi" full>
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
    </div>
  );
};

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

const EmptyRow = ({ colSpan, text }: { colSpan: number; text: string }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-10 text-center text-sm text-slate-500">
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

export default PermintaanRelasiPenggunaPage;