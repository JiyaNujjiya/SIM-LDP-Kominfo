import { useEffect, useMemo, useState } from 'react';

type PerencanaanItem = {
  id: number;
  instansi_id: number;
  nama_instansi: string;
  tahun_perencanaan: number;
  status: string;
  created_by: number;
  pembuat: string;
  created_at: string;
  updated_at: string;
};

type IndikatorItem = {
  id: number;
  perencanaan_id: number;
  kode_indikator: string;
  nilai_saat_ini: number | string;
  nilai_target: number | string;
  created_at?: string;
  updated_at?: string;
};

type RencanaDokumentasiItem = {
  id: number;
  perencanaan_id: number;
  pengetahuan_id: number;
  kode_pengetahuan: string;
  nama_pengetahuan: string;
  ditargetkan_tahun_ini: number;
  penanggung_jawab_id: number;
  penanggung_jawab: string | null;
  target_waktu_dokumentasi: string | null;
  tipe_dokumentasi: string[];
};

type InstansiOption = {
  id: number;
  kode_instansi: string;
  nama_instansi: string;
};

type LayananOption = {
  id: number;
  kode_layanan: string;
  nama_layanan: string;
  instansi_id: number;
  unit_kerja_id?: number | null;
};

type UnitOption = {
  id: number;
  instansi_id: number;
  kode_unit: string;
  nama_unit: string;
};

type UserOption = {
  id: number;
  nama: string;
  email: string;
  role: string;
  role_id?: number | null;
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

const API = 'http://localhost:5000/api';

export default function PerencanaanPengetahuanPage() {
  const savedUser = localStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes('knowledge.create');
  const canUpdate = permissions.includes('knowledge.update');
  const canDelete = permissions.includes('knowledge.delete');

  const [dataPerencanaan, setDataPerencanaan] = useState<
    PerencanaanItem[]
  >([]);

  const [selectedPerencanaan, setSelectedPerencanaan] =
    useState<PerencanaanItem | null>(null);

  const [indikatorList, setIndikatorList] = useState<
    IndikatorItem[]
  >([]);

  const [rencanaDokumentasi, setRencanaDokumentasi] = useState<
    RencanaDokumentasiItem[]
  >([]);

  const [instansiOptions, setInstansiOptions] = useState<
    InstansiOption[]
  >([]);

  const [layananOptions, setLayananOptions] = useState<
    LayananOption[]
  >([]);

  const [unitOptions, setUnitOptions] = useState<UnitOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  const [pengetahuanOptions, setPengetahuanOptions] = useState<
    PengetahuanOption[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const [showPerencanaanForm, setShowPerencanaanForm] =
    useState(false);

  const [editingPerencanaan, setEditingPerencanaan] =
    useState<PerencanaanItem | null>(null);

  const [showIndikatorForm, setShowIndikatorForm] =
    useState(false);

  const [editingIndikator, setEditingIndikator] =
    useState<IndikatorItem | null>(null);

  const [showRencanaForm, setShowRencanaForm] = useState(false);

  const [editingRencana, setEditingRencana] =
    useState<RencanaDokumentasiItem | null>(null);

  const [showPengetahuanForm, setShowPengetahuanForm] =
    useState(false);

  const [perencanaanForm, setPerencanaanForm] = useState({
    instansi_id: '',
    tahun_perencanaan: String(new Date().getFullYear()),
    status: 'Draft',
  });

  const [indikatorForm, setIndikatorForm] = useState({
    kode_indikator: 'CAKUPAN_DOKUMENTASI',
    nilai_saat_ini: '',
    nilai_target: '',
  });

  const [rencanaForm, setRencanaForm] = useState({
    pengetahuan_id: '',
    ditargetkan_tahun_ini: '1',
    penanggung_jawab_id: '',
    target_waktu_dokumentasi: '',
    tipe_dokumentasi: [] as string[],
  });

  const [pengetahuanForm, setPengetahuanForm] = useState({
    kode_pengetahuan: '',
    layanan_id: '',
    nama_pengetahuan: '',
    jenis_pengetahuan: 'Eksplisit',
    sudah_terdokumentasi: '0',
    aspek_pemdi: '',
    indikator_pemdi: '',
    pemilik_instansi_id: '',
    pemilik_unit_kerja_id: '',
  });

  const getToken = () => localStorage.getItem('token');

  const request = async (
    url: string,
    options: RequestInit = {}
  ) => {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${getToken()}`,
        'Content-Type': 'application/json',
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
          'Terjadi kesalahan saat memproses permintaan.'
      );
    }

    return result;
  };

  const clearNotification = () => {
    setMessage('');
    setError('');
  };

  const fetchPerencanaan = async () => {
    try {
      setLoading(true);

      const result = await request(
        `${API}/pengetahuan/perencanaan`
      );

      setDataPerencanaan(
        Array.isArray(result?.data) ? result.data : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data perencanaan.'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchInstansiOptions = async () => {
    const result = await request(
      `${API}/pengetahuan/instansi-options`
    );

    setInstansiOptions(
      Array.isArray(result?.data) ? result.data : []
    );
  };

  const fetchLayananOptions = async () => {
    const result = await request(
      `${API}/pengetahuan/layanan-options`
    );

    setLayananOptions(
      Array.isArray(result?.data) ? result.data : []
    );
  };

  const fetchUnitOptions = async () => {
    const result = await request(
      `${API}/pengetahuan/unit-options`
    );

    setUnitOptions(
      Array.isArray(result?.data) ? result.data : []
    );
  };

  const fetchUserOptions = async () => {
    const result = await request(
      `${API}/pengetahuan/user-options`
    );

    setUserOptions(
      Array.isArray(result?.data) ? result.data : []
    );
  };

  const fetchPengetahuanOptions = async () => {
    const result = await request(
      `${API}/pengetahuan/pengetahuan-options`
    );

    setPengetahuanOptions(
      Array.isArray(result?.data) ? result.data : []
    );
  };

  const fetchAllOptions = async () => {
    try {
      setLoadingOptions(true);

      await Promise.all([
        fetchInstansiOptions(),
        fetchLayananOptions(),
        fetchUnitOptions(),
        fetchUserOptions(),
        fetchPengetahuanOptions(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data pilihan.'
      );
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchIndikator = async (perencanaanId: number) => {
    const result = await request(
      `${API}/pengetahuan/perencanaan/${perencanaanId}/indikator`
    );

    setIndikatorList(
      Array.isArray(result?.data) ? result.data : []
    );
  };

  const fetchRencanaDokumentasi = async (
    perencanaanId: number
  ) => {
    const result = await request(
      `${API}/pengetahuan/perencanaan/${perencanaanId}/rencana-dokumentasi`
    );

    setRencanaDokumentasi(
      Array.isArray(result?.data) ? result.data : []
    );
  };

  const openDetail = async (item: PerencanaanItem) => {
    try {
      clearNotification();
      setSelectedPerencanaan(item);
      setLoadingDetail(true);

      await Promise.all([
        fetchIndikator(item.id),
        fetchRencanaDokumentasi(item.id),
        fetchPengetahuanOptions(),
      ]);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil detail MPN01.'
      );
    } finally {
      setLoadingDetail(false);
    }
  };

  useEffect(() => {
    fetchPerencanaan();
    fetchAllOptions();
  }, []);

  const filteredPerencanaan = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    if (!keyword) {
      return dataPerencanaan;
    }

    return dataPerencanaan.filter((item) =>
      [
        item.nama_instansi,
        String(item.tahun_perencanaan),
        item.status,
        item.pembuat,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(keyword)
        )
    );
  }, [dataPerencanaan, search]);

  const resetPerencanaanForm = () => {
    setPerencanaanForm({
      instansi_id: '',
      tahun_perencanaan: String(new Date().getFullYear()),
      status: 'Draft',
    });

    setEditingPerencanaan(null);
  };

  const handleTambahPerencanaan = () => {
    clearNotification();
    resetPerencanaanForm();
    setShowPerencanaanForm(true);
  };

  const handleEditPerencanaan = (
    item: PerencanaanItem
  ) => {
    clearNotification();

    setEditingPerencanaan(item);

    setPerencanaanForm({
      instansi_id: String(item.instansi_id),
      tahun_perencanaan: String(item.tahun_perencanaan),
      status: item.status,
    });

    setShowPerencanaanForm(true);
  };

  const handleSavePerencanaan = async () => {
    try {
      clearNotification();

      if (!perencanaanForm.instansi_id) {
        setError('Instansi wajib dipilih.');
        return;
      }

      if (!perencanaanForm.tahun_perencanaan) {
        setError('Tahun perencanaan wajib diisi.');
        return;
      }

      const tahun = Number(
        perencanaanForm.tahun_perencanaan
      );

      if (
        !Number.isInteger(tahun) ||
        tahun < 1901 ||
        tahun > 2155
      ) {
        setError('Tahun perencanaan tidak valid.');
        return;
      }

      setSaving(true);

      const payload = {
        instansi_id: Number(perencanaanForm.instansi_id),
        tahun_perencanaan: tahun,
        status: perencanaanForm.status,
      };

      const url = editingPerencanaan
        ? `${API}/pengetahuan/perencanaan/${editingPerencanaan.id}`
        : `${API}/pengetahuan/perencanaan`;

      const result = await request(url, {
        method: editingPerencanaan ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result?.message ||
          'Data perencanaan berhasil disimpan.'
      );

      setShowPerencanaanForm(false);
      resetPerencanaanForm();

      await fetchPerencanaan();

      if (
        selectedPerencanaan &&
        editingPerencanaan?.id ===
          selectedPerencanaan.id
      ) {
        const detail = await request(
          `${API}/pengetahuan/perencanaan/${selectedPerencanaan.id}`
        );

        if (detail?.data) {
          setSelectedPerencanaan(detail.data);
        }
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan perencanaan.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeletePerencanaan = async (
    item: PerencanaanItem
  ) => {
    const confirmed = window.confirm(
      `Hapus perencanaan ${item.nama_instansi} tahun ${item.tahun_perencanaan}?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/pengetahuan/perencanaan/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result?.message ||
          'Data perencanaan berhasil dihapus.'
      );

      if (selectedPerencanaan?.id === item.id) {
        setSelectedPerencanaan(null);
        setIndikatorList([]);
        setRencanaDokumentasi([]);
      }

      await fetchPerencanaan();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus perencanaan.'
      );
    }
  };

  const resetIndikatorForm = () => {
    setIndikatorForm({
      kode_indikator: 'CAKUPAN_DOKUMENTASI',
      nilai_saat_ini: '',
      nilai_target: '',
    });

    setEditingIndikator(null);
  };

  const handleTambahIndikator = () => {
    clearNotification();
    resetIndikatorForm();

    const tersedia = [
      'CAKUPAN_DOKUMENTASI',
      'KESESUAIAN_PENGGUNA',
    ].find(
      (kode) =>
        !indikatorList.some(
          (item) => item.kode_indikator === kode
        )
    );

    if (!tersedia) {
      setError(
        'Seluruh indikator perencanaan sudah tersedia.'
      );
      return;
    }

    setIndikatorForm({
      kode_indikator: tersedia,
      nilai_saat_ini: '',
      nilai_target: '',
    });

    setShowIndikatorForm(true);
  };

  const handleEditIndikator = (item: IndikatorItem) => {
    clearNotification();

    setEditingIndikator(item);

    setIndikatorForm({
      kode_indikator: item.kode_indikator,
      nilai_saat_ini: String(item.nilai_saat_ini),
      nilai_target: String(item.nilai_target),
    });

    setShowIndikatorForm(true);
  };

  const handleSaveIndikator = async () => {
    if (!selectedPerencanaan) return;

    try {
      clearNotification();

      if (
        indikatorForm.nilai_saat_ini === '' ||
        indikatorForm.nilai_target === ''
      ) {
        setError(
          'Kondisi saat ini dan kondisi target wajib diisi.'
        );
        return;
      }

      const nilaiSaatIni = Number(
        indikatorForm.nilai_saat_ini
      );

      const nilaiTarget = Number(
        indikatorForm.nilai_target
      );

      if (
        !Number.isFinite(nilaiSaatIni) ||
        !Number.isFinite(nilaiTarget)
      ) {
        setError('Nilai indikator harus berupa angka.');
        return;
      }

      if (
        indikatorForm.kode_indikator ===
        'CAKUPAN_DOKUMENTASI'
      ) {
        if (
          nilaiSaatIni < 0 ||
          nilaiSaatIni > 100 ||
          nilaiTarget < 0 ||
          nilaiTarget > 100
        ) {
          setError(
            'Nilai cakupan dokumentasi harus antara 0 sampai 100.'
          );
          return;
        }
      }

      if (
        indikatorForm.kode_indikator ===
        'KESESUAIAN_PENGGUNA'
      ) {
        if (
          nilaiSaatIni < 1 ||
          nilaiSaatIni > 5 ||
          nilaiTarget < 1 ||
          nilaiTarget > 5
        ) {
          setError(
            'Nilai kesesuaian pengguna harus antara 1 sampai 5.'
          );
          return;
        }
      }

      setSaving(true);

      const payload = {
        kode_indikator: indikatorForm.kode_indikator,
        nilai_saat_ini: nilaiSaatIni,
        nilai_target: nilaiTarget,
      };

      const url = editingIndikator
        ? `${API}/pengetahuan/indikator/${editingIndikator.id}`
        : `${API}/pengetahuan/perencanaan/${selectedPerencanaan.id}/indikator`;

      const result = await request(url, {
        method: editingIndikator ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result?.message ||
          'Indikator perencanaan berhasil disimpan.'
      );

      setShowIndikatorForm(false);
      resetIndikatorForm();

      await fetchIndikator(selectedPerencanaan.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan indikator.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteIndikator = async (
    item: IndikatorItem
  ) => {
    if (!selectedPerencanaan) return;

    const confirmed = window.confirm(
      'Hapus indikator perencanaan ini?'
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/pengetahuan/indikator/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result?.message ||
          'Indikator perencanaan berhasil dihapus.'
      );

      await fetchIndikator(selectedPerencanaan.id);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus indikator.'
      );
    }
  };

  const resetRencanaForm = () => {
    setRencanaForm({
      pengetahuan_id: '',
      ditargetkan_tahun_ini: '1',
      penanggung_jawab_id: '',
      target_waktu_dokumentasi: '',
      tipe_dokumentasi: [],
    });

    setEditingRencana(null);
  };

  const handleTambahRencana = () => {
    clearNotification();
    resetRencanaForm();
    setShowRencanaForm(true);
  };

  const handleEditRencana = (
    item: RencanaDokumentasiItem
  ) => {
    clearNotification();

    setEditingRencana(item);

    setRencanaForm({
      pengetahuan_id: String(item.pengetahuan_id),
      ditargetkan_tahun_ini: String(
        item.ditargetkan_tahun_ini
      ),
      penanggung_jawab_id: String(
        item.penanggung_jawab_id || ''
      ),
      target_waktu_dokumentasi:
        item.target_waktu_dokumentasi || '',
      tipe_dokumentasi: Array.isArray(
        item.tipe_dokumentasi
      )
        ? item.tipe_dokumentasi
        : [],
    });

    setShowRencanaForm(true);
  };

  const toggleTipeDokumentasi = (tipe: string) => {
    setRencanaForm((prev) => ({
      ...prev,
      tipe_dokumentasi: prev.tipe_dokumentasi.includes(
        tipe
      )
        ? prev.tipe_dokumentasi.filter(
            (item) => item !== tipe
          )
        : [...prev.tipe_dokumentasi, tipe],
    }));
  };

  const handleSaveRencana = async () => {
    if (!selectedPerencanaan) return;

    try {
      clearNotification();

      if (!rencanaForm.pengetahuan_id) {
        setError('Pengetahuan wajib dipilih.');
        return;
      }

      if (!rencanaForm.penanggung_jawab_id) {
        setError(
          'Penanggung jawab dokumentasi wajib dipilih.'
        );
        return;
      }

      if (rencanaForm.tipe_dokumentasi.length === 0) {
        setError(
          'Minimal satu tipe dokumentasi wajib dipilih.'
        );
        return;
      }

      setSaving(true);

      const payload = {
        pengetahuan_id: Number(
          rencanaForm.pengetahuan_id
        ),
        ditargetkan_tahun_ini: Number(
          rencanaForm.ditargetkan_tahun_ini
        ),
        penanggung_jawab_id: Number(
          rencanaForm.penanggung_jawab_id
        ),
        target_waktu_dokumentasi:
          rencanaForm.target_waktu_dokumentasi || null,
        tipe_dokumentasi:
          rencanaForm.tipe_dokumentasi,
      };

      const url = editingRencana
        ? `${API}/pengetahuan/rencana-dokumentasi/${editingRencana.id}`
        : `${API}/pengetahuan/perencanaan/${selectedPerencanaan.id}/rencana-dokumentasi`;

      const result = await request(url, {
        method: editingRencana ? 'PUT' : 'POST',
        body: JSON.stringify(payload),
      });

      setMessage(
        result?.message ||
          'Rencana dokumentasi berhasil disimpan.'
      );

      setShowRencanaForm(false);
      resetRencanaForm();

      await fetchRencanaDokumentasi(
        selectedPerencanaan.id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan rencana dokumentasi.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRencana = async (
    item: RencanaDokumentasiItem
  ) => {
    if (!selectedPerencanaan) return;

    const confirmed = window.confirm(
      `Hapus rencana dokumentasi "${item.nama_pengetahuan}"?`
    );

    if (!confirmed) return;

    try {
      clearNotification();

      const result = await request(
        `${API}/pengetahuan/rencana-dokumentasi/${item.id}`,
        {
          method: 'DELETE',
        }
      );

      setMessage(
        result?.message ||
          'Rencana dokumentasi berhasil dihapus.'
      );

      await fetchRencanaDokumentasi(
        selectedPerencanaan.id
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menghapus rencana dokumentasi.'
      );
    }
  };

  const resetPengetahuanForm = () => {
    setPengetahuanForm({
      kode_pengetahuan: '',
      layanan_id: '',
      nama_pengetahuan: '',
      jenis_pengetahuan: 'Eksplisit',
      sudah_terdokumentasi: '0',
      aspek_pemdi: '',
      indikator_pemdi: '',
      pemilik_instansi_id:
        selectedPerencanaan?.instansi_id
          ? String(selectedPerencanaan.instansi_id)
          : '',
      pemilik_unit_kerja_id: '',
    });
  };

  const handleTambahPengetahuan = () => {
    clearNotification();
    resetPengetahuanForm();
    setShowPengetahuanForm(true);
  };

  const handleSavePengetahuan = async () => {
    try {
      clearNotification();

      if (!pengetahuanForm.kode_pengetahuan.trim()) {
        setError('ID Pengetahuan wajib diisi.');
        return;
      }

      if (!pengetahuanForm.layanan_id) {
        setError('Nama layanan wajib dipilih.');
        return;
      }

      if (!pengetahuanForm.nama_pengetahuan.trim()) {
        setError('Nama pengetahuan wajib diisi.');
        return;
      }

      setSaving(true);

      const payload = {
        kode_pengetahuan:
          pengetahuanForm.kode_pengetahuan.trim(),
        layanan_id: Number(
          pengetahuanForm.layanan_id
        ),
        nama_pengetahuan:
          pengetahuanForm.nama_pengetahuan.trim(),
        jenis_pengetahuan:
          pengetahuanForm.jenis_pengetahuan,
        sudah_terdokumentasi: Number(
          pengetahuanForm.sudah_terdokumentasi
        ),
        aspek_pemdi:
          pengetahuanForm.aspek_pemdi.trim() || null,
        indikator_pemdi:
          pengetahuanForm.indikator_pemdi.trim() ||
          null,
        pemilik_instansi_id:
          pengetahuanForm.pemilik_instansi_id
            ? Number(
                pengetahuanForm.pemilik_instansi_id
              )
            : null,
        pemilik_unit_kerja_id:
          pengetahuanForm.pemilik_unit_kerja_id
            ? Number(
                pengetahuanForm.pemilik_unit_kerja_id
              )
            : null,
      };

      const result = await request(
        `${API}/pengetahuan`,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        }
      );

      setMessage(
        result?.message ||
          'Data pengetahuan berhasil disimpan.'
      );

      setShowPengetahuanForm(false);
      resetPengetahuanForm();

      await fetchPengetahuanOptions();

      if (result?.data?.id) {
        setRencanaForm((prev) => ({
          ...prev,
          pengetahuan_id: String(result.data.id),
        }));
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal menyimpan data pengetahuan.'
      );
    } finally {
      setSaving(false);
    }
  };

  const getIndikatorLabel = (kode: string) => {
    if (kode === 'CAKUPAN_DOKUMENTASI') {
      return 'Cakupan Dokumentasi Pengetahuan';
    }

    if (kode === 'KESESUAIAN_PENGGUNA') {
      return 'Kesesuaian Pengetahuan dengan Kebutuhan Pengguna';
    }

    return kode;
  };

  const getIndikatorSatuan = (kode: string) => {
    if (kode === 'CAKUPAN_DOKUMENTASI') {
      return '%';
    }

    if (kode === 'KESESUAIAN_PENGGUNA') {
      return 'Skala 1-5';
    }

    return '';
  };

  const getStatusStyle = (status: string) => {
    if (status === 'Selesai') {
      return 'bg-green-100 text-green-700';
    }

    if (status === 'Aktif') {
      return 'bg-blue-100 text-blue-700';
    }

    return 'bg-slate-100 text-slate-600';
  };

  const getPengetahuanDetail = (id: number) => {
    return pengetahuanOptions.find(
      (item) => Number(item.id) === Number(id)
    );
  };

  const filteredUnitOptions = useMemo(() => {
    if (!pengetahuanForm.pemilik_instansi_id) {
      return unitOptions;
    }

    return unitOptions.filter(
      (item) =>
        Number(item.instansi_id) ===
        Number(pengetahuanForm.pemilik_instansi_id)
    );
  }, [
    unitOptions,
    pengetahuanForm.pemilik_instansi_id,
  ]);

  const processSteps = [
    {
      number: 1,
      label: 'Perencanaan',
    },
    {
      number: 2,
      label: 'Pengumpulan & Pengolahan',
    },
    {
      number: 3,
      label: 'Pemanfaatan & Alih Pengetahuan',
    },
    {
      number: 4,
      label: 'Evaluasi',
    },
  ];

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          MPN01 - Perencanaan Pengetahuan
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Perencanaan indikator dan dokumentasi
          pengetahuan Layanan Digital Pemerintah.
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 1;

            return (
              <div
                key={step.number}
                className="flex flex-1 items-start"
              >
                <div className="flex min-w-[130px] flex-col items-center text-center">
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

      {!selectedPerencanaan ? (
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-800">
                Daftar Perencanaan Pengetahuan
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Daftar perencanaan Manajemen Pengetahuan
                berdasarkan instansi dan tahun.
              </p>
            </div>

            {canCreate && (
              <button
                type="button"
                onClick={handleTambahPerencanaan}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tambah Perencanaan
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
                placeholder="Cari instansi, tahun, status, atau pembuat..."
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 md:max-w-md"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-semibold">
                      No
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Nama Instansi
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Tahun Perencanaan
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Status
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Dibuat Oleh
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Memuat data...
                      </td>
                    </tr>
                  ) : filteredPerencanaan.length ===
                    0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Belum ada data perencanaan
                        pengetahuan.
                      </td>
                    </tr>
                  ) : (
                    filteredPerencanaan.map(
                      (item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100 hover:bg-slate-50"
                        >
                          <td className="px-4 py-3">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3 font-medium text-slate-800">
                            {item.nama_instansi}
                          </td>

                          <td className="px-4 py-3">
                            {item.tahun_perencanaan}
                          </td>

                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                                item.status
                              )}`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            {item.pembuat}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  openDetail(item)
                                }
                                className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                              >
                                Detail
                              </button>

                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditPerencanaan(
                                      item
                                    )
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
                                    handleDeletePerencanaan(
                                      item
                                    )
                                  }
                                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              )}
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
        </div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Informasi Perencanaan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Identitas perencanaan Manajemen
                  Pengetahuan.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedPerencanaan(null);
                  setIndikatorList([]);
                  setRencanaDokumentasi([]);
                  clearNotification();
                }}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Kembali ke Daftar
              </button>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-4">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Nama Instansi
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerencanaan.nama_instansi}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Tahun Perencanaan
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerencanaan.tahun_perencanaan}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Status
                </p>

                <span
                  className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusStyle(
                    selectedPerencanaan.status
                  )}`}
                >
                  {selectedPerencanaan.status}
                </span>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Dibuat Oleh
                </p>

                <p className="mt-1 text-sm font-medium text-slate-800">
                  {selectedPerencanaan.pembuat}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 p-5">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Formulir 1.1 - Perencanaan Indikator
                  Manajemen Pengetahuan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Penetapan kondisi saat ini dan target
                  indikator Manajemen Pengetahuan.
                </p>
              </div>

              {canCreate &&
                indikatorList.length < 2 && (
                  <button
                    type="button"
                    onClick={handleTambahIndikator}
                    className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Tambah Indikator
                  </button>
                )}
            </div>

            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[800px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-semibold">
                      No
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Indikator
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Kondisi Saat Ini (As-Is)
                    </th>

                    <th className="px-4 py-3 font-semibold">
                      Kondisi Target (To-Be)
                    </th>

                    <th className="px-4 py-3 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {loadingDetail ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-500"
                      >
                        Memuat detail...
                      </td>
                    </tr>
                  ) : indikatorList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Belum ada indikator
                        perencanaan.
                      </td>
                    </tr>
                  ) : (
                    indikatorList.map(
                      (item, index) => (
                        <tr
                          key={item.id}
                          className="border-b border-slate-100"
                        >
                          <td className="px-4 py-3">
                            {index + 1}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-slate-800">
                              {getIndikatorLabel(
                                item.kode_indikator
                              )}
                            </div>

                            <div className="mt-1 text-xs text-slate-400">
                              {getIndikatorSatuan(
                                item.kode_indikator
                              )}
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {item.nilai_saat_ini}
                            {item.kode_indikator ===
                              'CAKUPAN_DOKUMENTASI' &&
                              '%'}
                          </td>

                          <td className="px-4 py-3">
                            {item.nilai_target}
                            {item.kode_indikator ===
                              'CAKUPAN_DOKUMENTASI' &&
                              '%'}
                          </td>

                          <td className="px-4 py-3">
                            <div className="flex justify-center gap-2">
                              {canUpdate && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleEditIndikator(
                                      item
                                    )
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
                                    handleDeleteIndikator(
                                      item
                                    )
                                  }
                                  className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                >
                                  Hapus
                                </button>
                              )}
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

          <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Formulir 1.2 - Rencana Dokumentasi
                  Pengetahuan
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Penetapan pengetahuan yang akan
                  didokumentasikan beserta target dan
                  penanggung jawabnya.
                </p>
              </div>

              {canCreate && (
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleTambahPengetahuan}
                    className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Tambah Pengetahuan
                  </button>

                  <button
                    type="button"
                    onClick={handleTambahRencana}
                    className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
                  >
                    Tambah Rencana Dokumentasi
                  </button>
                </div>
              )}
            </div>

            <div className="overflow-x-auto p-5">
              <table className="w-full min-w-[1300px] border-collapse text-left text-sm">
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
                      Sudah Terdokumentasi?
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Aspek PemDi
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Indikator PemDi
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Target Tahun Ini?
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Tipe Dokumentasi
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Penanggung Jawab
                    </th>

                    <th className="px-3 py-3 font-semibold">
                      Target Waktu
                    </th>

                    <th className="px-3 py-3 text-center font-semibold">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {rencanaDokumentasi.length === 0 ? (
                    <tr>
                      <td
                        colSpan={12}
                        className="px-4 py-8 text-center text-slate-400"
                      >
                        Belum ada rencana dokumentasi
                        pengetahuan.
                      </td>
                    </tr>
                  ) : (
                    rencanaDokumentasi.map(
                      (item, index) => {
                        const pengetahuan =
                          getPengetahuanDetail(
                            item.pengetahuan_id
                          );

                        return (
                          <tr
                            key={item.id}
                            className="border-b border-slate-100 align-top"
                          >
                            <td className="px-3 py-3">
                              {index + 1}
                            </td>

                            <td className="px-3 py-3">
                              {pengetahuan?.nama_layanan ||
                                '-'}
                            </td>

                            <td className="px-3 py-3 font-medium text-slate-800">
                              {item.kode_pengetahuan}
                            </td>

                            <td className="px-3 py-3">
                              {item.nama_pengetahuan}
                            </td>

                            <td className="px-3 py-3">
                              {Number(
                                pengetahuan?.sudah_terdokumentasi
                              ) === 1
                                ? 'Ya'
                                : 'Tidak'}
                            </td>

                            <td className="px-3 py-3">
                              {pengetahuan?.aspek_pemdi ||
                                '-'}
                            </td>

                            <td className="px-3 py-3">
                              {pengetahuan?.indikator_pemdi ||
                                '-'}
                            </td>

                            <td className="px-3 py-3">
                              {Number(
                                item.ditargetkan_tahun_ini
                              ) === 1
                                ? 'Ya'
                                : 'Tidak'}
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex flex-wrap gap-1">
                                {item.tipe_dokumentasi?.map(
                                  (tipe) => (
                                    <span
                                      key={tipe}
                                      className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-700"
                                    >
                                      {tipe}
                                    </span>
                                  )
                                )}
                              </div>
                            </td>

                            <td className="px-3 py-3">
                              {item.penanggung_jawab ||
                                '-'}
                            </td>

                            <td className="px-3 py-3">
                              {item.target_waktu_dokumentasi ||
                                '-'}
                            </td>

                            <td className="px-3 py-3">
                              <div className="flex flex-col items-center gap-2">
                                {canUpdate && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleEditRencana(
                                        item
                                      )
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
                                      handleDeleteRencana(
                                        item
                                      )
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
      )}

      {showPerencanaanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingPerencanaan
                  ? 'Edit Perencanaan Pengetahuan'
                  : 'Tambah Perencanaan Pengetahuan'}
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Nama Instansi
                </label>

                <select
                  value={perencanaanForm.instansi_id}
                  onChange={(e) =>
                    setPerencanaanForm({
                      ...perencanaanForm,
                      instansi_id: e.target.value,
                    })
                  }
                  disabled={loadingOptions}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="">
                    Pilih instansi
                  </option>

                  {instansiOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.kode_instansi} -{' '}
                      {item.nama_instansi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tahun Perencanaan
                </label>

                <input
                  type="number"
                  min="1901"
                  max="2155"
                  value={
                    perencanaanForm.tahun_perencanaan
                  }
                  onChange={(e) =>
                    setPerencanaanForm({
                      ...perencanaanForm,
                      tahun_perencanaan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Status
                </label>

                <select
                  value={perencanaanForm.status}
                  onChange={(e) =>
                    setPerencanaanForm({
                      ...perencanaanForm,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500"
                >
                  <option value="Draft">Draft</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Selesai">
                    Selesai
                  </option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowPerencanaanForm(false);
                  resetPerencanaanForm();
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePerencanaan}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showIndikatorForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingIndikator
                  ? 'Edit Indikator Perencanaan'
                  : 'Tambah Indikator Perencanaan'}
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Indikator
                </label>

                <select
                  value={indikatorForm.kode_indikator}
                  onChange={(e) =>
                    setIndikatorForm({
                      ...indikatorForm,
                      kode_indikator:
                        e.target.value,
                      nilai_saat_ini: '',
                      nilai_target: '',
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="CAKUPAN_DOKUMENTASI">
                    Cakupan Dokumentasi Pengetahuan
                  </option>

                  <option value="KESESUAIAN_PENGGUNA">
                    Kesesuaian dengan Kebutuhan
                    Pengguna
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Kondisi Saat Ini (As-Is)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min={
                    indikatorForm.kode_indikator ===
                    'CAKUPAN_DOKUMENTASI'
                      ? 0
                      : 1
                  }
                  max={
                    indikatorForm.kode_indikator ===
                    'CAKUPAN_DOKUMENTASI'
                      ? 100
                      : 5
                  }
                  value={
                    indikatorForm.nilai_saat_ini
                  }
                  onChange={(e) =>
                    setIndikatorForm({
                      ...indikatorForm,
                      nilai_saat_ini: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Kondisi Target (To-Be)
                </label>

                <input
                  type="number"
                  step="0.01"
                  min={
                    indikatorForm.kode_indikator ===
                    'CAKUPAN_DOKUMENTASI'
                      ? 0
                      : 1
                  }
                  max={
                    indikatorForm.kode_indikator ===
                    'CAKUPAN_DOKUMENTASI'
                      ? 100
                      : 5
                  }
                  value={indikatorForm.nilai_target}
                  onChange={(e) =>
                    setIndikatorForm({
                      ...indikatorForm,
                      nilai_target: e.target.value,
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
                  setShowIndikatorForm(false);
                  resetIndikatorForm();
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveIndikator}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showRencanaForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-6 w-full max-w-2xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingRencana
                  ? 'Edit Rencana Dokumentasi'
                  : 'Tambah Rencana Dokumentasi'}
              </h3>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pengetahuan
                </label>

                <select
                  value={rencanaForm.pengetahuan_id}
                  onChange={(e) =>
                    setRencanaForm({
                      ...rencanaForm,
                      pengetahuan_id:
                        e.target.value,
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
                      {item.kode_pengetahuan} -{' '}
                      {item.nama_pengetahuan}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Ditargetkan Tahun Ini?
                </label>

                <select
                  value={
                    rencanaForm.ditargetkan_tahun_ini
                  }
                  onChange={(e) =>
                    setRencanaForm({
                      ...rencanaForm,
                      ditargetkan_tahun_ini:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="1">Ya</option>
                  <option value="0">Tidak</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Tipe Dokumentasi
                </label>

                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    'Teks',
                    'Gambar',
                    'Audio',
                    'Video',
                  ].map((tipe) => (
                    <label
                      key={tipe}
                      className="flex items-center gap-2 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={rencanaForm.tipe_dokumentasi.includes(
                          tipe
                        )}
                        onChange={() =>
                          toggleTipeDokumentasi(
                            tipe
                          )
                        }
                      />

                      {tipe}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Penanggung Jawab Dokumentasi
                </label>

                <select
                  value={
                    rencanaForm.penanggung_jawab_id
                  }
                  onChange={(e) =>
                    setRencanaForm({
                      ...rencanaForm,
                      penanggung_jawab_id:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Pilih penanggung jawab
                  </option>

                  {userOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nama} - {item.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Target Waktu Dokumentasi
                </label>

                <input
                  type="date"
                  value={
                    rencanaForm.target_waktu_dokumentasi
                  }
                  onChange={(e) =>
                    setRencanaForm({
                      ...rencanaForm,
                      target_waktu_dokumentasi:
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
                  setShowRencanaForm(false);
                  resetRencanaForm();
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSaveRencana}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showPengetahuanForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/40 p-4">
          <div className="my-6 w-full max-w-3xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Tambah Pengetahuan
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Tambahkan pengetahuan yang akan
                dimasukkan ke dalam rencana dokumentasi.
              </p>
            </div>

            <div className="grid gap-4 p-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  ID Pengetahuan
                </label>

                <input
                  type="text"
                  value={
                    pengetahuanForm.kode_pengetahuan
                  }
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      kode_pengetahuan:
                        e.target.value,
                    })
                  }
                  placeholder="Contoh: KNW-001"
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Nama Layanan
                </label>

                <select
                  value={pengetahuanForm.layanan_id}
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      layanan_id: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Pilih layanan
                  </option>

                  {layananOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.kode_layanan} -{' '}
                      {item.nama_layanan}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Nama Pengetahuan
                </label>

                <input
                  type="text"
                  value={
                    pengetahuanForm.nama_pengetahuan
                  }
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      nama_pengetahuan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Jenis Pengetahuan
                </label>

                <select
                  value={
                    pengetahuanForm.jenis_pengetahuan
                  }
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      jenis_pengetahuan:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="Eksplisit">
                    Eksplisit
                  </option>
                  <option value="Implisit">
                    Implisit
                  </option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Sudah Terdokumentasi?
                </label>

                <select
                  value={
                    pengetahuanForm.sudah_terdokumentasi
                  }
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      sudah_terdokumentasi:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="0">Tidak</option>
                  <option value="1">Ya</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Aspek PemDi
                </label>

                <input
                  type="text"
                  value={pengetahuanForm.aspek_pemdi}
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      aspek_pemdi: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Indikator PemDi
                </label>

                <input
                  type="text"
                  value={
                    pengetahuanForm.indikator_pemdi
                  }
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      indikator_pemdi:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pemilik Instansi
                </label>

                <select
                  value={
                    pengetahuanForm.pemilik_instansi_id
                  }
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      pemilik_instansi_id:
                        e.target.value,
                      pemilik_unit_kerja_id: '',
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Pilih instansi
                  </option>

                  {instansiOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.nama_instansi}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">
                  Pemilik Unit Kerja
                </label>

                <select
                  value={
                    pengetahuanForm.pemilik_unit_kerja_id
                  }
                  onChange={(e) =>
                    setPengetahuanForm({
                      ...pengetahuanForm,
                      pemilik_unit_kerja_id:
                        e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">
                    Pilih unit kerja
                  </option>

                  {filteredUnitOptions.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.kode_unit} -{' '}
                      {item.nama_unit}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => {
                  setShowPengetahuanForm(false);
                  resetPengetahuanForm();
                }}
                disabled={saving}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleSavePengetahuan}
                disabled={saving}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
              >
                {saving
                  ? 'Menyimpan...'
                  : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}