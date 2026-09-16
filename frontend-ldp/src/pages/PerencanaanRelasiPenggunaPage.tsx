import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API = 'http://localhost:5000/api/relasi-pengguna';

type DataRow = Record<string, any>;

type ModalType =
  | 'katalog'
  | 'standar'
  | 'sla'
  | 'ola'
  | 'indikator'
  | 'target'
  | 'layanan-terkait'
  | 'rencana'
  | 'media';

type LayananOption = {
  id: number;
  kode_layanan: string;
  nama_layanan: string;
  jenis_layanan: string | null;
  deskripsi: string | null;
};

type UserOption = {
  id: number;
  nama: string;
  email: string;
  role: string;
};

const processSteps = [
  { number: 1, label: 'Perencanaan Layanan', route: '/relasi-pengguna/perencanaan' },
  { number: 2, label: 'Pengajuan Layanan', route: '/relasi-pengguna/pengajuan' },
  { number: 3, label: 'Penanganan Kueri', route: '/relasi-pengguna/penanganan' },
  { number: 4, label: 'Evaluasi', route: '/relasi-pengguna/evaluasi' },
];

const emptyForm: Record<string, string> = {};

const PerencanaanRelasiPenggunaPage = () => {
  const navigate = useNavigate();

  const [activeFormTab, setActiveFormTab] = useState<'mrp1a' | 'mrp1b'>('mrp1a');

  const [layananOptions, setLayananOptions] = useState<LayananOption[]>([]);
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);

  const [katalog, setKatalog] = useState<DataRow[]>([]);
  const [standar, setStandar] = useState<DataRow[]>([]);
  const [sla, setSla] = useState<DataRow[]>([]);
  const [ola, setOla] = useState<DataRow[]>([]);
  const [indikator, setIndikator] = useState<DataRow[]>([]);
  const [target, setTarget] = useState<DataRow[]>([]);
  const [layananTerkait, setLayananTerkait] = useState<DataRow[]>([]);
  const [rencana, setRencana] = useState<DataRow[]>([]);
  const [media, setMedia] = useState<DataRow[]>([]);

  const [searchKatalog, setSearchKatalog] = useState('');
  const [searchStandar, setSearchStandar] = useState('');
  const [searchTarget, setSearchTarget] = useState('');
  const [searchRencana, setSearchRencana] = useState('');

  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>(emptyForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100 disabled:text-slate-500';

  const labelClass = 'text-sm font-medium text-slate-700';

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

    if (!response.ok) {
      throw new Error(result.message || 'Terjadi kesalahan saat memproses data.');
    }

    return result;
  };

  const rows = (result: any) => {
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
        katalogResult,
        standarResult,
        slaResult,
        olaResult,
        indikatorResult,
        targetResult,
        layananTerkaitResult,
        rencanaResult,
        mediaResult,
      ] = await Promise.all([
        request(`${API}/layanan-options`),
        request(`${API}/user-options`),
        request(`${API}/katalog-layanan`),
        request(`${API}/standar-layanan`),
        request(`${API}/sla-layanan`),
        request(`${API}/ola-layanan`),
        request(`${API}/indikator-tambahan-standar`),
        request(`${API}/target-kueri-insiden`),
        request(`${API}/katalog-layanan-terkait`),
        request(`${API}/rencana-komunikasi`),
        request(`${API}/media-komunikasi`),
      ]);

      setLayananOptions(rows(layananResult));
      setUserOptions(rows(userResult));
      setKatalog(rows(katalogResult));
      setStandar(rows(standarResult));
      setSla(rows(slaResult));
      setOla(rows(olaResult));
      setIndikator(rows(indikatorResult));
      setTarget(rows(targetResult));
      setLayananTerkait(rows(layananTerkaitResult));
      setRencana(rows(rencanaResult));
      setMedia(rows(mediaResult));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil data perencanaan layanan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const setField = (field: string, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const closeModal = () => {
    setModalType(null);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = (type: ModalType, defaults: Record<string, string> = {}) => {
    setEditingId(null);
    setModalType(type);
    setForm(defaults);
    setMessage('');
    setError('');
  };

  const openEdit = (type: ModalType, item: DataRow) => {
    setEditingId(item.id);
    setModalType(type);
    setMessage('');
    setError('');

    if (type === 'katalog') {
      setForm({
        layanan_id: String(item.layanan_id),
        kategori_layanan: item.kategori_layanan || '',
        tipe_layanan: item.tipe_layanan || '',
        target_cakupan_pengguna: item.target_cakupan_pengguna || '',
        service_owner_id: item.service_owner_id ? String(item.service_owner_id) : '',
        kanal_layanan: item.kanal_layanan || '',
        tautan_layanan: item.tautan_layanan || '',
        ruang_lingkup_layanan: item.ruang_lingkup_layanan || '',
        stakeholder_terkait: item.stakeholder_terkait || '',
        status: item.status || 'Draft',
      });
    }

    if (type === 'standar') {
      setForm({
        katalog_layanan_id: String(item.katalog_layanan_id),
        versi: String(item.versi),
        berlaku_mulai: dateValue(item.berlaku_mulai),
        berlaku_sampai: dateValue(item.berlaku_sampai),
        status: item.status || 'Draft',
        catatan: item.catatan || '',
      });
    }

    if (type === 'sla') {
      setForm({
        standar_layanan_id: String(item.standar_layanan_id),
        jam_layanan: item.jam_layanan || '',
        jam_service_desk: item.jam_service_desk || '',
        target_waktu_respon_menit: valueString(item.target_waktu_respon_menit),
        target_waktu_penyelesaian_menit: valueString(item.target_waktu_penyelesaian_menit),
        target_ketersediaan_persen: valueString(item.target_ketersediaan_persen),
      });
    }

    if (type === 'ola') {
      setForm({
        standar_layanan_id: String(item.standar_layanan_id),
        target_kecepatan: valueString(item.target_kecepatan),
        satuan_kecepatan: item.satuan_kecepatan || '',
        target_kapasitas: valueString(item.target_kapasitas),
        satuan_kapasitas: item.satuan_kapasitas || '',
        target_ketersediaan_persen: valueString(item.target_ketersediaan_persen),
        target_rto_menit: valueString(item.target_rto_menit),
        target_rpo_menit: valueString(item.target_rpo_menit),
        target_waktu_respon_menit: valueString(item.target_waktu_respon_menit),
        target_waktu_penyelesaian_menit: valueString(item.target_waktu_penyelesaian_menit),
      });
    }

    if (type === 'indikator') {
      setForm({
        standar_layanan_id: String(item.standar_layanan_id),
        objek: item.objek || 'Layanan',
        jenis_standar: item.jenis_standar || 'SLA',
        prioritas: item.prioritas || 'Tidak Berlaku',
        nama_indikator: item.nama_indikator || '',
        target_nilai: valueString(item.target_nilai),
        satuan: item.satuan || '',
        arah_target: item.arah_target || 'Minimal',
      });
    }

    if (type === 'target') {
      setForm({
        standar_layanan_id: String(item.standar_layanan_id),
        jenis: item.jenis || 'Kueri',
        prioritas: item.prioritas || 'Rendah',
        sla_jam_layanan: item.sla_jam_layanan || '',
        sla_jam_service_desk: item.sla_jam_service_desk || '',
        sla_waktu_respon_menit: valueString(item.sla_waktu_respon_menit),
        sla_waktu_penyelesaian_menit: valueString(item.sla_waktu_penyelesaian_menit),
        ola_waktu_respon_menit: valueString(item.ola_waktu_respon_menit),
        ola_waktu_penyelesaian_menit: valueString(item.ola_waktu_penyelesaian_menit),
      });
    }

    if (type === 'layanan-terkait') {
      setForm({
        katalog_layanan_id: String(item.katalog_layanan_id),
        layanan_terkait_id: String(item.layanan_terkait_id),
        keterangan: item.keterangan || '',
      });
    }

    if (type === 'rencana') {
      setForm({
        layanan_id: String(item.layanan_id),
        informasi: item.informasi || '',
        manajemen_terkait: item.manajemen_terkait || '',
        pembuat_informasi_id: item.pembuat_informasi_id ? String(item.pembuat_informasi_id) : '',
        target_audiens: item.target_audiens || '',
        periode_komunikasi: item.periode_komunikasi || '',
        status: item.status || 'Draft',
      });
    }

    if (type === 'media') {
      setForm({
        rencana_komunikasi_id: String(item.rencana_komunikasi_id),
        bentuk_media: item.bentuk_media || '',
        kanal_komunikasi: item.kanal_komunikasi || '',
        keterangan: item.keterangan || '',
      });
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!modalType) return;

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const config = getSubmitConfig(modalType, editingId, form);

      const result = await request(`${API}${config.endpoint}`, {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(config.payload),
      });

      setMessage(result.message || 'Data berhasil disimpan.');
      closeModal();
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: ModalType, item: DataRow) => {
    const endpoint = getDeleteEndpoint(type, item.id);

    if (!window.confirm('Hapus data ini?')) return;

    try {
      setMessage('');
      setError('');

      const result = await request(`${API}${endpoint}`, { method: 'DELETE' });

      setMessage(result.message || 'Data berhasil dihapus.');
      await fetchAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus data.');
    }
  };

  const filteredKatalog = useMemo(() => {
    const keyword = searchKatalog.trim().toLowerCase();

    if (!keyword) return katalog;

    return katalog.filter((item) =>
      [
        item.kode_layanan,
        item.nama_layanan,
        item.kategori_layanan,
        item.tipe_layanan,
        item.service_owner,
        item.status,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [katalog, searchKatalog]);

  const filteredStandar = useMemo(() => {
    const keyword = searchStandar.trim().toLowerCase();

    if (!keyword) return standar;

    return standar.filter((item) =>
      [
        item.kode_layanan,
        item.nama_layanan,
        item.versi,
        item.status,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [standar, searchStandar]);

  const filteredTarget = useMemo(() => {
    const keyword = searchTarget.trim().toLowerCase();

    if (!keyword) return target;

    return target.filter((item) =>
      [
        item.kode_layanan,
        item.nama_layanan,
        item.jenis,
        item.prioritas,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [target, searchTarget]);

  const filteredRencana = useMemo(() => {
    const keyword = searchRencana.trim().toLowerCase();

    if (!keyword) return rencana;

    return rencana.filter((item) =>
      [
        item.kode_layanan,
        item.nama_layanan,
        item.informasi,
        item.target_audiens,
        item.periode_komunikasi,
        item.status,
      ].some((value) => String(value || '').toLowerCase().includes(keyword))
    );
  }, [rencana, searchRencana]);

  const indikatorLayanan = indikator.filter((item) => item.objek === 'Layanan');
  const indikatorKueriInsiden = indikator.filter((item) => ['Kueri', 'Insiden'].includes(item.objek));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          Manajemen Relasi Pengguna
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          Proses 1 - Perencanaan Layanan
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          {processSteps.map((step, index) => {
            const active = step.number === 1;

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
            Perencanaan Layanan
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Formulir MRP1a dan MRP1b Manajemen Relasi Pengguna.
          </p>
        </div>

        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveFormTab('mrp1a')}
            className={`px-5 py-3 text-sm font-semibold ${
              activeFormTab === 'mrp1a'
                ? 'border-b-2 border-slate-800 text-slate-800'
                : 'text-slate-500'
            }`}
          >
            MRP1a - Katalog, SLA, OLA
          </button>

          <button
            type="button"
            onClick={() => setActiveFormTab('mrp1b')}
            className={`px-5 py-3 text-sm font-semibold ${
              activeFormTab === 'mrp1b'
                ? 'border-b-2 border-slate-800 text-slate-800'
                : 'text-slate-500'
            }`}
          >
            MRP1b - Komunikasi Pengguna
          </button>
        </div>

        {activeFormTab === 'mrp1a' && (
          <div>
            <div className="border-b border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-800">
                Bagian 1 - Katalog, SLA, OLA Layanan
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Dokumentasi katalog layanan serta target SLA dan OLA layanan digital.
              </p>
            </div>

            <SectionHeader
              title="Katalog Layanan"
              subtitle="Informasi dasar dan cakupan setiap layanan digital."
              button="Tambah Katalog"
              onClick={() => openCreate('katalog', { status: 'Draft' })}
            />

            <SearchBox
              value={searchKatalog}
              onChange={setSearchKatalog}
              placeholder="Cari katalog layanan..."
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1400px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Layanan</Th>
                    <Th>Kategori</Th>
                    <Th>Tipe</Th>
                    <Th>Cakupan Pengguna</Th>
                    <Th>Service Owner</Th>
                    <Th>Kanal</Th>
                    <Th>Status</Th>
                    <Th center>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <EmptyRow colSpan={8} text="Memuat data..." />
                  ) : filteredKatalog.length === 0 ? (
                    <EmptyRow colSpan={8} text="Belum ada katalog layanan." />
                  ) : (
                    filteredKatalog.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                        <Td>
                          <div className="font-medium">{item.kode_layanan}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.nama_layanan}</div>
                        </Td>

                        <Td>{item.kategori_layanan || '-'}</Td>
                        <Td>{item.tipe_layanan || '-'}</Td>
                        <Td>{item.target_cakupan_pengguna || '-'}</Td>
                        <Td>{item.service_owner || '-'}</Td>
                        <Td>{item.kanal_layanan || '-'}</Td>
                        <Td>{item.status}</Td>

                        <ActionTd
                          onEdit={() => openEdit('katalog', item)}
                          onDelete={() => handleDelete('katalog', item)}
                        />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>  

            <SectionHeader
              title="Service Level Agreement (SLA)"
              subtitle="Target layanan yang disepakati terhadap pengguna."
              button="Tambah SLA"
              disabled={standar.length === 0}
              onClick={() => openCreate('sla')}
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1300px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Layanan</Th>
                    <Th>Versi</Th>
                    <Th>Jam Layanan</Th>
                    <Th>Service Desk</Th>
                    <Th>Respon</Th>
                    <Th>Penyelesaian</Th>
                    <Th>Ketersediaan</Th>
                    <Th center>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {sla.length === 0 ? (
                    <EmptyRow colSpan={8} text="Belum ada SLA layanan." />
                  ) : (
                    sla.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{item.kode_layanan} - {item.nama_layanan}</Td>
                        <Td>{item.versi_standar}</Td>
                        <Td>{item.jam_layanan || '-'}</Td>
                        <Td>{item.jam_service_desk || '-'}</Td>
                        <Td>{minuteText(item.target_waktu_respon_menit)}</Td>
                        <Td>{minuteText(item.target_waktu_penyelesaian_menit)}</Td>
                        <Td>{percentText(item.target_ketersediaan_persen)}</Td>

                        <ActionTd
                          onEdit={() => openEdit('sla', item)}
                          onDelete={() => handleDelete('sla', item)}
                        />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <SectionHeader
              title="Operational Level Agreement (OLA)"
              subtitle="Target operasional internal untuk mendukung pencapaian SLA."
              button="Tambah OLA"
              disabled={standar.length === 0}
              onClick={() => openCreate('ola')}
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1600px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Layanan</Th>
                    <Th>Kecepatan</Th>
                    <Th>Kapasitas</Th>
                    <Th>Ketersediaan</Th>
                    <Th>RTO</Th>
                    <Th>RPO</Th>
                    <Th>Respon</Th>
                    <Th>Penyelesaian</Th>
                    <Th center>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {ola.length === 0 ? (
                    <EmptyRow colSpan={9} text="Belum ada OLA layanan." />
                  ) : (
                    ola.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{item.kode_layanan} - {item.nama_layanan}</Td>
                        <Td>{item.target_kecepatan ?? '-'} {item.satuan_kecepatan || ''}</Td>
                        <Td>{item.target_kapasitas ?? '-'} {item.satuan_kapasitas || ''}</Td>
                        <Td>{percentText(item.target_ketersediaan_persen)}</Td>
                        <Td>{minuteText(item.target_rto_menit)}</Td>
                        <Td>{minuteText(item.target_rpo_menit)}</Td>
                        <Td>{minuteText(item.target_waktu_respon_menit)}</Td>
                        <Td>{minuteText(item.target_waktu_penyelesaian_menit)}</Td>

                        <ActionTd
                          onEdit={() => openEdit('ola', item)}
                          onDelete={() => handleDelete('ola', item)}
                        />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="border-y border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-800">
                Bagian 2 - SLA, OLA Kueri & Insiden
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Target SLA dan OLA penanganan kueri dan insiden berdasarkan prioritas.
              </p>
            </div>

            <SectionHeader
              title="Target SLA & OLA Kueri / Insiden"
              subtitle="Target waktu penanganan berdasarkan jenis dan prioritas."
              button="Tambah Target"
              disabled={standar.length === 0}
              onClick={() =>
                openCreate('target', {
                  jenis: 'Kueri',
                  prioritas: 'Rendah',
                })
              }
            />

            <SearchBox
              value={searchTarget}
              onChange={setSearchTarget}
              placeholder="Cari target kueri atau insiden..."
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1500px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Layanan</Th>
                    <Th>Jenis</Th>
                    <Th>Prioritas</Th>
                    <Th>Jam Layanan SLA</Th>
                    <Th>Service Desk</Th>
                    <Th>Respon SLA</Th>
                    <Th>Penyelesaian SLA</Th>
                    <Th>Respon OLA</Th>
                    <Th>Penyelesaian OLA</Th>
                    <Th center>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTarget.length === 0 ? (
                    <EmptyRow colSpan={10} text="Belum ada target kueri atau insiden." />
                  ) : (
                    filteredTarget.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{item.kode_layanan} - {item.nama_layanan}</Td>
                        <Td>{item.jenis}</Td>
                        <Td>{item.prioritas}</Td>
                        <Td>{item.sla_jam_layanan || '-'}</Td>
                        <Td>{item.sla_jam_service_desk || '-'}</Td>
                        <Td>{minuteText(item.sla_waktu_respon_menit)}</Td>
                        <Td>{minuteText(item.sla_waktu_penyelesaian_menit)}</Td>
                        <Td>{minuteText(item.ola_waktu_respon_menit)}</Td>
                        <Td>{minuteText(item.ola_waktu_penyelesaian_menit)}</Td>

                        <ActionTd
                          onEdit={() => openEdit('target', item)}
                          onDelete={() => handleDelete('target', item)}
                        />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeFormTab === 'mrp1b' && (
          <div>
            <div className="border-b border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-800">
                Formulir MRP1b - Komunikasi Pengguna
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                Perencanaan informasi, target audiens, media, kanal, dan jadwal komunikasi kepada pengguna.
              </p>
            </div>

            <SectionHeader
              title="Rencana Komunikasi"
              subtitle="Rencana penyampaian informasi layanan kepada pengguna."
              button="Tambah Rencana"
              onClick={() =>
                openCreate('rencana', {
                  status: 'Draft',
                })
              }
            />

            <SearchBox
              value={searchRencana}
              onChange={setSearchRencana}
              placeholder="Cari rencana komunikasi..."
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1500px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Layanan</Th>
                    <Th>Informasi</Th>
                    <Th>Manajemen Terkait</Th>
                    <Th>Pembuat Informasi</Th>
                    <Th>Target Audiens</Th>
                    <Th>Periode</Th>
                    <Th>Status</Th>
                    <Th center>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRencana.length === 0 ? (
                    <EmptyRow colSpan={8} text="Belum ada rencana komunikasi." />
                  ) : (
                    filteredRencana.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 align-top hover:bg-slate-50">
                        <Td>{item.kode_layanan} - {item.nama_layanan}</Td>
                        <Td>{item.informasi}</Td>
                        <Td>{item.manajemen_terkait || '-'}</Td>
                        <Td>{item.pembuat_informasi || '-'}</Td>
                        <Td>{item.target_audiens}</Td>
                        <Td>{item.periode_komunikasi}</Td>
                        <Td>{item.status}</Td>

                        <ActionTd
                          onEdit={() => openEdit('rencana', item)}
                          onDelete={() => handleDelete('rencana', item)}
                        />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <SectionHeader
              title="Media Komunikasi"
              subtitle="Bentuk media dan kanal yang digunakan pada setiap rencana komunikasi."
              button="Tambah Media"
              disabled={rencana.length === 0}
              onClick={() => openCreate('media')}
            />

            <div className="overflow-x-auto p-5">
              <table className="min-w-[1100px] w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <Th>Layanan</Th>
                    <Th>Informasi</Th>
                    <Th>Bentuk Media</Th>
                    <Th>Kanal Komunikasi</Th>
                    <Th>Keterangan</Th>
                    <Th center>Aksi</Th>
                  </tr>
                </thead>

                <tbody>
                  {media.length === 0 ? (
                    <EmptyRow colSpan={6} text="Belum ada media komunikasi." />
                  ) : (
                    media.map((item) => (
                      <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <Td>{item.kode_layanan} - {item.nama_layanan}</Td>
                        <Td>{item.informasi}</Td>
                        <Td>{item.bentuk_media}</Td>
                        <Td>{item.kanal_komunikasi}</Td>
                        <Td>{item.keterangan || '-'}</Td>

                        <ActionTd
                          onEdit={() => openEdit('media', item)}
                          onDelete={() => handleDelete('media', item)}
                        />
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId ? 'Edit' : 'Tambah'} {modalTitle(modalType)}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Manajemen Relasi Pengguna - Perencanaan Layanan
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              {modalType === 'katalog' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Layanan Digital"
                    required
                    disabled={editingId !== null}
                    value={form.layanan_id || ''}
                    onChange={(value) => setField('layanan_id', value)}
                    options={layananOptions.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan}`,
                    }))}
                  />

                  <FieldInput
                    label="Kategori Layanan"
                    value={form.kategori_layanan || ''}
                    onChange={(value) => setField('kategori_layanan', value)}
                    maxLength={100}
                  />

                  <FieldInput
                    label="Tipe Layanan"
                    value={form.tipe_layanan || ''}
                    onChange={(value) => setField('tipe_layanan', value)}
                    maxLength={100}
                  />

                  <FieldInput
                    label="Target / Cakupan Pengguna"
                    value={form.target_cakupan_pengguna || ''}
                    onChange={(value) => setField('target_cakupan_pengguna', value)}
                  />

                  <FieldSelect
                    label="Service Owner"
                    value={form.service_owner_id || ''}
                    onChange={(value) => setField('service_owner_id', value)}
                    options={userOptions.map((item) => ({
                      value: String(item.id),
                      label: item.nama,
                    }))}
                  />

                  <FieldInput
                    label="Kanal Layanan"
                    value={form.kanal_layanan || ''}
                    onChange={(value) => setField('kanal_layanan', value)}
                    maxLength={150}
                  />

                  <FieldInput
                    label="Tautan Layanan"
                    value={form.tautan_layanan || ''}
                    onChange={(value) => setField('tautan_layanan', value)}
                    maxLength={255}
                  />

                  <FieldSelect
                    label="Status"
                    required
                    value={form.status || 'Draft'}
                    onChange={(value) => setField('status', value)}
                    options={[
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Aktif', label: 'Aktif' },
                      { value: 'Tidak Aktif', label: 'Tidak Aktif' },
                    ]}
                  />

                  <FieldTextarea
                    label="Ruang Lingkup Layanan"
                    value={form.ruang_lingkup_layanan || ''}
                    onChange={(value) => setField('ruang_lingkup_layanan', value)}
                    full
                  />

                  <FieldTextarea
                    label="Stakeholder Terkait"
                    value={form.stakeholder_terkait || ''}
                    onChange={(value) => setField('stakeholder_terkait', value)}
                    full
                  />
                </div>
              )}

              {modalType === 'standar' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Katalog Layanan"
                    required
                    disabled={editingId !== null}
                    value={form.katalog_layanan_id || ''}
                    onChange={(value) => setField('katalog_layanan_id', value)}
                    options={katalog.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan}`,
                    }))}
                  />

                  <FieldInput
                    label="Versi"
                    type="number"
                    min="1"
                    required
                    disabled={editingId !== null}
                    value={form.versi || '1'}
                    onChange={(value) => setField('versi', value)}
                  />

                  <FieldInput
                    label="Berlaku Mulai"
                    type="date"
                    required
                    value={form.berlaku_mulai || ''}
                    onChange={(value) => setField('berlaku_mulai', value)}
                  />

                  <FieldInput
                    label="Berlaku Sampai"
                    type="date"
                    value={form.berlaku_sampai || ''}
                    onChange={(value) => setField('berlaku_sampai', value)}
                  />

                  <FieldSelect
                    label="Status"
                    required
                    value={form.status || 'Draft'}
                    onChange={(value) => setField('status', value)}
                    options={[
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Aktif', label: 'Aktif' },
                      { value: 'Berakhir', label: 'Berakhir' },
                    ]}
                  />

                  <FieldTextarea
                    label="Catatan"
                    value={form.catatan || ''}
                    onChange={(value) => setField('catatan', value)}
                    full
                  />
                </div>
              )}

              {modalType === 'sla' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Standar Layanan"
                    required
                    disabled={editingId !== null}
                    value={form.standar_layanan_id || ''}
                    onChange={(value) => setField('standar_layanan_id', value)}
                    options={standar.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan} - Versi ${item.versi}`,
                    }))}
                  />

                  <FieldInput
                    label="Jam Layanan"
                    value={form.jam_layanan || ''}
                    onChange={(value) => setField('jam_layanan', value)}
                    placeholder="Contoh: Senin-Jumat 08.00-16.00"
                  />

                  <FieldInput
                    label="Jam Service Desk"
                    value={form.jam_service_desk || ''}
                    onChange={(value) => setField('jam_service_desk', value)}
                    placeholder="Contoh: 24x7"
                  />

                  <FieldInput
                    label="Target Waktu Respon (menit)"
                    type="number"
                    min="0"
                    value={form.target_waktu_respon_menit || ''}
                    onChange={(value) => setField('target_waktu_respon_menit', value)}
                  />

                  <FieldInput
                    label="Target Waktu Penyelesaian (menit)"
                    type="number"
                    min="0"
                    value={form.target_waktu_penyelesaian_menit || ''}
                    onChange={(value) => setField('target_waktu_penyelesaian_menit', value)}
                  />

                  <FieldInput
                    label="Target Ketersediaan (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.target_ketersediaan_persen || ''}
                    onChange={(value) => setField('target_ketersediaan_persen', value)}
                  />
                </div>
              )}

              {modalType === 'ola' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Standar Layanan"
                    required
                    disabled={editingId !== null}
                    value={form.standar_layanan_id || ''}
                    onChange={(value) => setField('standar_layanan_id', value)}
                    options={standar.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan} - Versi ${item.versi}`,
                    }))}
                  />

                  <div />

                  <FieldInput
                    label="Target Kecepatan"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.target_kecepatan || ''}
                    onChange={(value) => setField('target_kecepatan', value)}
                  />

                  <FieldInput
                    label="Satuan Kecepatan"
                    value={form.satuan_kecepatan || ''}
                    onChange={(value) => setField('satuan_kecepatan', value)}
                    placeholder="Contoh: Mbps"
                  />

                  <FieldInput
                    label="Target Kapasitas"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.target_kapasitas || ''}
                    onChange={(value) => setField('target_kapasitas', value)}
                  />

                  <FieldInput
                    label="Satuan Kapasitas"
                    value={form.satuan_kapasitas || ''}
                    onChange={(value) => setField('satuan_kapasitas', value)}
                    placeholder="Contoh: pengguna bersamaan"
                  />

                  <FieldInput
                    label="Target Ketersediaan (%)"
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={form.target_ketersediaan_persen || ''}
                    onChange={(value) => setField('target_ketersediaan_persen', value)}
                  />

                  <FieldInput
                    label="Target RTO (menit)"
                    type="number"
                    min="0"
                    value={form.target_rto_menit || ''}
                    onChange={(value) => setField('target_rto_menit', value)}
                  />

                  <FieldInput
                    label="Target RPO (menit)"
                    type="number"
                    min="0"
                    value={form.target_rpo_menit || ''}
                    onChange={(value) => setField('target_rpo_menit', value)}
                  />

                  <FieldInput
                    label="Target Waktu Respon (menit)"
                    type="number"
                    min="0"
                    value={form.target_waktu_respon_menit || ''}
                    onChange={(value) => setField('target_waktu_respon_menit', value)}
                  />

                  <FieldInput
                    label="Target Waktu Penyelesaian (menit)"
                    type="number"
                    min="0"
                    value={form.target_waktu_penyelesaian_menit || ''}
                    onChange={(value) => setField('target_waktu_penyelesaian_menit', value)}
                  />
                </div>
              )}

              {modalType === 'indikator' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Standar Layanan"
                    required
                    disabled={editingId !== null}
                    value={form.standar_layanan_id || ''}
                    onChange={(value) => setField('standar_layanan_id', value)}
                    options={standar.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan} - Versi ${item.versi}`,
                    }))}
                  />

                  <FieldSelect
                    label="Objek"
                    required
                    value={form.objek || 'Layanan'}
                    onChange={(value) => {
                      setForm((current) => ({
                        ...current,
                        objek: value,
                        prioritas: value === 'Layanan' ? 'Tidak Berlaku' : 'Rendah',
                        jenis_standar:
                          value === 'Insiden' && current.jenis_standar === 'SLA'
                            ? 'OLA'
                            : current.jenis_standar || 'SLA',
                      }));
                    }}
                    options={[
                      { value: 'Layanan', label: 'Layanan' },
                      { value: 'Kueri', label: 'Kueri' },
                      { value: 'Insiden', label: 'Insiden' },
                    ]}
                  />

                  <FieldSelect
                    label="Jenis Standar"
                    required
                    value={form.jenis_standar || 'SLA'}
                    onChange={(value) => setField('jenis_standar', value)}
                    options={
                      form.objek === 'Insiden'
                        ? [{ value: 'OLA', label: 'OLA' }]
                        : [
                            { value: 'SLA', label: 'SLA' },
                            { value: 'OLA', label: 'OLA' },
                          ]
                    }
                  />

                  <FieldSelect
                    label="Prioritas"
                    required
                    disabled={form.objek === 'Layanan'}
                    value={
                      form.objek === 'Layanan'
                        ? 'Tidak Berlaku'
                        : form.prioritas || 'Rendah'
                    }
                    onChange={(value) => setField('prioritas', value)}
                    options={
                      form.objek === 'Layanan'
                        ? [{ value: 'Tidak Berlaku', label: 'Tidak Berlaku' }]
                        : [
                            { value: 'Rendah', label: 'Rendah' },
                            { value: 'Sedang', label: 'Sedang' },
                            { value: 'Tinggi', label: 'Tinggi' },
                          ]
                    }
                  />

                  <FieldInput
                    label="Nama Indikator"
                    required
                    value={form.nama_indikator || ''}
                    onChange={(value) => setField('nama_indikator', value)}
                    maxLength={150}
                  />

                  <FieldInput
                    label="Target Nilai"
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={form.target_nilai || ''}
                    onChange={(value) => setField('target_nilai', value)}
                  />

                  <FieldInput
                    label="Satuan"
                    required
                    value={form.satuan || ''}
                    onChange={(value) => setField('satuan', value)}
                    maxLength={50}
                  />

                  <FieldSelect
                    label="Arah Target"
                    required
                    value={form.arah_target || 'Minimal'}
                    onChange={(value) => setField('arah_target', value)}
                    options={[
                      { value: 'Minimal', label: 'Minimal' },
                      { value: 'Maksimal', label: 'Maksimal' },
                      { value: 'Tepat', label: 'Tepat' },
                    ]}
                  />
                </div>
              )}

              {modalType === 'target' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Standar Layanan"
                    required
                    disabled={editingId !== null}
                    value={form.standar_layanan_id || ''}
                    onChange={(value) => setField('standar_layanan_id', value)}
                    options={standar.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan} - Versi ${item.versi}`,
                    }))}
                  />

                  <FieldSelect
                    label="Jenis"
                    required
                    value={form.jenis || 'Kueri'}
                    onChange={(value) => setField('jenis', value)}
                    options={[
                      { value: 'Kueri', label: 'Kueri' },
                      { value: 'Insiden', label: 'Insiden' },
                    ]}
                  />

                  <FieldSelect
                    label="Prioritas"
                    required
                    value={form.prioritas || 'Rendah'}
                    onChange={(value) => setField('prioritas', value)}
                    options={[
                      { value: 'Rendah', label: 'Rendah' },
                      { value: 'Sedang', label: 'Sedang' },
                      { value: 'Tinggi', label: 'Tinggi' },
                    ]}
                  />

                  <FieldInput
                    label="Jam Layanan SLA"
                    value={form.sla_jam_layanan || ''}
                    onChange={(value) => setField('sla_jam_layanan', value)}
                  />

                  <FieldInput
                    label="Jam Service Desk SLA"
                    value={form.sla_jam_service_desk || ''}
                    onChange={(value) => setField('sla_jam_service_desk', value)}
                  />

                  <FieldInput
                    label="Waktu Respon SLA (menit)"
                    type="number"
                    min="0"
                    value={form.sla_waktu_respon_menit || ''}
                    onChange={(value) => setField('sla_waktu_respon_menit', value)}
                  />

                  <FieldInput
                    label="Waktu Penyelesaian SLA (menit)"
                    type="number"
                    min="0"
                    value={form.sla_waktu_penyelesaian_menit || ''}
                    onChange={(value) => setField('sla_waktu_penyelesaian_menit', value)}
                  />

                  <FieldInput
                    label="Waktu Respon OLA (menit)"
                    type="number"
                    min="0"
                    value={form.ola_waktu_respon_menit || ''}
                    onChange={(value) => setField('ola_waktu_respon_menit', value)}
                  />

                  <FieldInput
                    label="Waktu Penyelesaian OLA (menit)"
                    type="number"
                    min="0"
                    value={form.ola_waktu_penyelesaian_menit || ''}
                    onChange={(value) => setField('ola_waktu_penyelesaian_menit', value)}
                  />
                </div>
              )}

              {modalType === 'layanan-terkait' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Katalog Layanan"
                    required
                    disabled={editingId !== null}
                    value={form.katalog_layanan_id || ''}
                    onChange={(value) => setField('katalog_layanan_id', value)}
                    options={katalog.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan}`,
                    }))}
                  />

                  <FieldSelect
                    label="Layanan Terkait"
                    required
                    value={form.layanan_terkait_id || ''}
                    onChange={(value) => setField('layanan_terkait_id', value)}
                    options={layananOptions.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan}`,
                    }))}
                  />

                  <FieldTextarea
                    label="Keterangan"
                    value={form.keterangan || ''}
                    onChange={(value) => setField('keterangan', value)}
                    full
                  />
                </div>
              )}

              {modalType === 'rencana' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Layanan Digital"
                    required
                    value={form.layanan_id || ''}
                    onChange={(value) => setField('layanan_id', value)}
                    options={layananOptions.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.nama_layanan}`,
                    }))}
                  />

                  <FieldSelect
                    label="Pembuat Informasi"
                    value={form.pembuat_informasi_id || ''}
                    onChange={(value) => setField('pembuat_informasi_id', value)}
                    options={userOptions.map((item) => ({
                      value: String(item.id),
                      label: item.nama,
                    }))}
                  />

                  <FieldTextarea
                    label="Informasi"
                    required
                    value={form.informasi || ''}
                    onChange={(value) => setField('informasi', value)}
                    full
                  />

                  <FieldInput
                    label="Manajemen Terkait"
                    value={form.manajemen_terkait || ''}
                    onChange={(value) => setField('manajemen_terkait', value)}
                    maxLength={100}
                  />

                  <FieldInput
                    label="Target Audiens"
                    required
                    value={form.target_audiens || ''}
                    onChange={(value) => setField('target_audiens', value)}
                  />

                  <FieldInput
                    label="Periode Komunikasi"
                    required
                    value={form.periode_komunikasi || ''}
                    onChange={(value) => setField('periode_komunikasi', value)}
                    placeholder="Contoh: Setiap bulan"
                    maxLength={100}
                  />

                  <FieldSelect
                    label="Status"
                    required
                    value={form.status || 'Draft'}
                    onChange={(value) => setField('status', value)}
                    options={[
                      { value: 'Draft', label: 'Draft' },
                      { value: 'Aktif', label: 'Aktif' },
                      { value: 'Selesai', label: 'Selesai' },
                      { value: 'Dibatalkan', label: 'Dibatalkan' },
                    ]}
                  />
                </div>
              )}

              {modalType === 'media' && (
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <FieldSelect
                    label="Rencana Komunikasi"
                    required
                    disabled={editingId !== null}
                    value={form.rencana_komunikasi_id || ''}
                    onChange={(value) => setField('rencana_komunikasi_id', value)}
                    options={rencana.map((item) => ({
                      value: String(item.id),
                      label: `${item.kode_layanan} - ${item.informasi}`,
                    }))}
                  />

                  <FieldInput
                    label="Bentuk Media"
                    required
                    value={form.bentuk_media || ''}
                    onChange={(value) => setField('bentuk_media', value)}
                    placeholder="Contoh: Infografis"
                    maxLength={100}
                  />

                  <FieldInput
                    label="Kanal Komunikasi"
                    required
                    value={form.kanal_komunikasi || ''}
                    onChange={(value) => setField('kanal_komunikasi', value)}
                    placeholder="Contoh: Website Resmi"
                    maxLength={100}
                  />

                  <FieldTextarea
                    label="Keterangan"
                    value={form.keterangan || ''}
                    onChange={(value) => setField('keterangan', value)}
                    full
                  />
                </div>
              )}

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const getSubmitConfig = (
  type: ModalType,
  editingId: number | null,
  form: Record<string, string>
) => {
  const numberOrNull = (value?: string) =>
    value === undefined || value === '' ? null : Number(value);

  const textOrNull = (value?: string) =>
    value === undefined || value.trim() === '' ? null : value.trim();

  if (type === 'katalog') {
    return {
      endpoint: editingId
        ? `/katalog-layanan/${editingId}`
        : '/katalog-layanan',
      payload: editingId
        ? {
            kategori_layanan: textOrNull(form.kategori_layanan),
            tipe_layanan: textOrNull(form.tipe_layanan),
            target_cakupan_pengguna: textOrNull(form.target_cakupan_pengguna),
            service_owner_id: numberOrNull(form.service_owner_id),
            kanal_layanan: textOrNull(form.kanal_layanan),
            tautan_layanan: textOrNull(form.tautan_layanan),
            ruang_lingkup_layanan: textOrNull(form.ruang_lingkup_layanan),
            stakeholder_terkait: textOrNull(form.stakeholder_terkait),
            status: form.status,
          }
        : {
            layanan_id: Number(form.layanan_id),
            kategori_layanan: textOrNull(form.kategori_layanan),
            tipe_layanan: textOrNull(form.tipe_layanan),
            target_cakupan_pengguna: textOrNull(form.target_cakupan_pengguna),
            service_owner_id: numberOrNull(form.service_owner_id),
            kanal_layanan: textOrNull(form.kanal_layanan),
            tautan_layanan: textOrNull(form.tautan_layanan),
            ruang_lingkup_layanan: textOrNull(form.ruang_lingkup_layanan),
            stakeholder_terkait: textOrNull(form.stakeholder_terkait),
            status: form.status || 'Draft',
          },
    };
  }

  if (type === 'standar') {
    return {
      endpoint: editingId
        ? `/standar-layanan/${editingId}`
        : '/standar-layanan',
      payload: editingId
        ? {
            berlaku_mulai: form.berlaku_mulai,
            berlaku_sampai: form.berlaku_sampai || null,
            status: form.status,
            catatan: textOrNull(form.catatan),
          }
        : {
            katalog_layanan_id: Number(form.katalog_layanan_id),
            versi: Number(form.versi),
            berlaku_mulai: form.berlaku_mulai,
            berlaku_sampai: form.berlaku_sampai || null,
            status: form.status || 'Draft',
            catatan: textOrNull(form.catatan),
          },
    };
  }

  if (type === 'sla') {
    const payload = {
      jam_layanan: textOrNull(form.jam_layanan),
      jam_service_desk: textOrNull(form.jam_service_desk),
      target_waktu_respon_menit: numberOrNull(form.target_waktu_respon_menit),
      target_waktu_penyelesaian_menit: numberOrNull(
        form.target_waktu_penyelesaian_menit
      ),
      target_ketersediaan_persen: numberOrNull(
        form.target_ketersediaan_persen
      ),
    };

    return {
      endpoint: editingId ? `/sla-layanan/${editingId}` : '/sla-layanan',
      payload: editingId
        ? payload
        : {
            standar_layanan_id: Number(form.standar_layanan_id),
            ...payload,
          },
    };
  }

  if (type === 'ola') {
    const payload = {
      target_kecepatan: numberOrNull(form.target_kecepatan),
      satuan_kecepatan: textOrNull(form.satuan_kecepatan),
      target_kapasitas: numberOrNull(form.target_kapasitas),
      satuan_kapasitas: textOrNull(form.satuan_kapasitas),
      target_ketersediaan_persen: numberOrNull(
        form.target_ketersediaan_persen
      ),
      target_rto_menit: numberOrNull(form.target_rto_menit),
      target_rpo_menit: numberOrNull(form.target_rpo_menit),
      target_waktu_respon_menit: numberOrNull(
        form.target_waktu_respon_menit
      ),
      target_waktu_penyelesaian_menit: numberOrNull(
        form.target_waktu_penyelesaian_menit
      ),
    };

    return {
      endpoint: editingId ? `/ola-layanan/${editingId}` : '/ola-layanan',
      payload: editingId
        ? payload
        : {
            standar_layanan_id: Number(form.standar_layanan_id),
            ...payload,
          },
    };
  }

  if (type === 'indikator') {
    const objek = form.objek;
    const prioritas =
      objek === 'Layanan'
        ? 'Tidak Berlaku'
        : form.prioritas;

    const payload = {
      objek,
      jenis_standar: form.jenis_standar,
      prioritas,
      nama_indikator: form.nama_indikator.trim(),
      target_nilai: Number(form.target_nilai),
      satuan: form.satuan.trim(),
      arah_target: form.arah_target,
    };

    return {
      endpoint: editingId
        ? `/indikator-tambahan-standar/${editingId}`
        : '/indikator-tambahan-standar',
      payload: editingId
        ? payload
        : {
            standar_layanan_id: Number(form.standar_layanan_id),
            ...payload,
          },
    };
  }

  if (type === 'target') {
    const payload = {
      jenis: form.jenis,
      prioritas: form.prioritas,
      sla_jam_layanan: textOrNull(form.sla_jam_layanan),
      sla_jam_service_desk: textOrNull(form.sla_jam_service_desk),
      sla_waktu_respon_menit: numberOrNull(form.sla_waktu_respon_menit),
      sla_waktu_penyelesaian_menit: numberOrNull(
        form.sla_waktu_penyelesaian_menit
      ),
      ola_waktu_respon_menit: numberOrNull(form.ola_waktu_respon_menit),
      ola_waktu_penyelesaian_menit: numberOrNull(
        form.ola_waktu_penyelesaian_menit
      ),
    };

    return {
      endpoint: editingId
        ? `/target-kueri-insiden/${editingId}`
        : '/target-kueri-insiden',
      payload: editingId
        ? payload
        : {
            standar_layanan_id: Number(form.standar_layanan_id),
            ...payload,
          },
    };
  }

  if (type === 'layanan-terkait') {
    const payload = {
      layanan_terkait_id: Number(form.layanan_terkait_id),
      keterangan: textOrNull(form.keterangan),
    };

    return {
      endpoint: editingId
        ? `/katalog-layanan-terkait/${editingId}`
        : '/katalog-layanan-terkait',
      payload: editingId
        ? payload
        : {
            katalog_layanan_id: Number(form.katalog_layanan_id),
            ...payload,
          },
    };
  }

  if (type === 'rencana') {
    return {
      endpoint: editingId
        ? `/rencana-komunikasi/${editingId}`
        : '/rencana-komunikasi',
      payload: {
        layanan_id: Number(form.layanan_id),
        informasi: form.informasi.trim(),
        manajemen_terkait: textOrNull(form.manajemen_terkait),
        pembuat_informasi_id: numberOrNull(form.pembuat_informasi_id),
        target_audiens: form.target_audiens.trim(),
        periode_komunikasi: form.periode_komunikasi.trim(),
        status: form.status || 'Draft',
      },
    };
  }

  return {
    endpoint: editingId
      ? `/media-komunikasi/${editingId}`
      : '/media-komunikasi',
    payload: editingId
      ? {
          bentuk_media: form.bentuk_media.trim(),
          kanal_komunikasi: form.kanal_komunikasi.trim(),
          keterangan: textOrNull(form.keterangan),
        }
      : {
          rencana_komunikasi_id: Number(form.rencana_komunikasi_id),
          bentuk_media: form.bentuk_media.trim(),
          kanal_komunikasi: form.kanal_komunikasi.trim(),
          keterangan: textOrNull(form.keterangan),
        },
  };
};

const getDeleteEndpoint = (type: ModalType, id: number) => {
  const endpoints: Record<ModalType, string> = {
    katalog: `/katalog-layanan/${id}`,
    standar: `/standar-layanan/${id}`,
    sla: `/sla-layanan/${id}`,
    ola: `/ola-layanan/${id}`,
    indikator: `/indikator-tambahan-standar/${id}`,
    target: `/target-kueri-insiden/${id}`,
    'layanan-terkait': `/katalog-layanan-terkait/${id}`,
    rencana: `/rencana-komunikasi/${id}`,
    media: `/media-komunikasi/${id}`,
  };

  return endpoints[type];
};

const modalTitle = (type: ModalType) => {
  const titles: Record<ModalType, string> = {
    katalog: 'Katalog Layanan',
    standar: 'Standar Layanan',
    sla: 'SLA Layanan',
    ola: 'OLA Layanan',
    indikator: 'Indikator Tambahan',
    target: 'Target Kueri / Insiden',
    'layanan-terkait': 'Layanan Terkait',
    rencana: 'Rencana Komunikasi',
    media: 'Media Komunikasi',
  };

  return titles[type];
};

const valueString = (value: any) =>
  value === null || value === undefined ? '' : String(value);

const dateValue = (value: any) =>
  value ? String(value).slice(0, 10) : '';

const displayDate = (value: any) =>
  value ? String(value).slice(0, 10) : '-';

const minuteText = (value: any) =>
  value === null || value === undefined ? '-' : `${value} menit`;

const percentText = (value: any) =>
  value === null || value === undefined ? '-' : `${value}%`;

type SectionHeaderProps = {
  title: string;
  subtitle: string;
  button: string;
  onClick: () => void;
  disabled?: boolean;
};

const SectionHeader = ({
  title,
  subtitle,
  button,
  onClick,
  disabled = false,
}: SectionHeaderProps) => (
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
      disabled={disabled}
      className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {button}
    </button>
  </div>
);

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
};

const SearchBox = ({
  value,
  onChange,
  placeholder,
}: SearchBoxProps) => (
  <div className="border-b border-slate-200 p-5">
    <input
      type="text"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
    />
  </div>
);

const Th = ({
  children,
  center = false,
}: {
  children: React.ReactNode;
  center?: boolean;
}) => (
  <th
    className={`border-b border-slate-200 px-4 py-3 text-xs font-semibold uppercase text-slate-600 ${
      center ? 'text-center' : 'text-left'
    }`}
  >
    {children}
  </th>
);

const Td = ({
  children,
}: {
  children: React.ReactNode;
}) => (
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

const ActionTd = ({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) => (
  <td className="px-4 py-3">
    <div className="flex justify-center gap-2">
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
  </td>
);

type Option = {
  value: string;
  label: string;
};

type FieldSelectProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  required?: boolean;
  disabled?: boolean;
};

const FieldSelect = ({
  label,
  value,
  onChange,
  options,
  required = false,
  disabled = false,
}: FieldSelectProps) => (
  <div>
    <label className="text-sm font-medium text-slate-700">
      {label}
    </label>

    <select
      required={required}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
    >
      <option value="">
        Pilih {label.toLowerCase()}
      </option>

      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  </div>
);

type FieldInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
  min?: string;
  max?: string;
  step?: string;
};

const FieldInput = ({
  label,
  value,
  onChange,
  type = 'text',
  required = false,
  disabled = false,
  placeholder,
  maxLength,
  min,
  max,
  step,
}: FieldInputProps) => (
  <div>
    <label className="text-sm font-medium text-slate-700">
      {label}
    </label>

    <input
      type={type}
      required={required}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      min={min}
      max={max}
      step={step}
      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100 disabled:text-slate-500"
    />
  </div>
);

type FieldTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  full?: boolean;
};

const FieldTextarea = ({
  label,
  value,
  onChange,
  required = false,
  full = false,
}: FieldTextareaProps) => (
  <div className={full ? 'md:col-span-2' : ''}>
    <label className="text-sm font-medium text-slate-700">
      {label}
    </label>

    <textarea
      rows={4}
      required={required}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
    />
  </div>
);

export default PerencanaanRelasiPenggunaPage;