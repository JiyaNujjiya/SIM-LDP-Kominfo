import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

type RuangLingkupItem = {
  id: number;
  layanan_prioritas_id: number | null;
  mkb_layanan_prioritas_id?: number | null;
  kode_prioritas: string | null;
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

type TimOperasionalItem = {
  id: number;
  layanan_prioritas_id: number;
  pegawai_id: number;
  peran_operasional: string;
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

type TimOperasionalForm = {
  layanan_prioritas_id: string;
  pegawai_id: string;
  peran_operasional: string;
  tanggung_jawab: string;
  urutan: string;
};

type RencanaKomunikasiItem = {
  id: number;
  layanan_prioritas_id: number | null;
  mkb_layanan_prioritas_id: number;
  informasi_disampaikan: string;
  kategori_komunikasi: string;
  pengirim: string;
  penerima: string;
  media_komunikasi: string;
  waktu_frekuensi: string | null;
  aktivitas: string | null;
  tujuan: string | null;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
  jenis_layanan: string | null;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  created_by: number | null;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
};

type RencanaKomunikasiForm = {
  mkb_layanan_prioritas_id: string;
  informasi_disampaikan: string;
  kategori_komunikasi: string;
  pengirim: string;
  penerima: string;
  media_komunikasi: string;
  waktu_frekuensi: string;
  aktivitas: string;
  tujuan: string;
};

const emptyRencanaKomunikasiForm: RencanaKomunikasiForm = {
  mkb_layanan_prioritas_id: '',
  informasi_disampaikan: '',
  kategori_komunikasi: '',
  pengirim: '',
  penerima: '',
  media_komunikasi: '',
  waktu_frekuensi: '',
  aktivitas: '',
  tujuan: '',
};

const emptyTimOperasionalForm: TimOperasionalForm = {
  layanan_prioritas_id: '',
  pegawai_id: '',
  peran_operasional: '',
  tanggung_jawab: '',
  urutan: '',
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

type SumberDayaManusiaItem = {
  id: number;
  mkb_layanan_prioritas_id: number;
  nama_instansi: string;
  kebutuhan_personel: string;
  jumlah_minimum: number | null;
  kompetensi: string | null;
  sumber_penyedia_sdm: string | null;
  personel_pengganti: string | null;
  keterangan: string | null;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
};

type SumberDayaManusiaForm = {
  mkb_layanan_prioritas_id: string;
  kebutuhan_personel: string;
  jumlah_minimum: string;
  kompetensi: string;
  sumber_penyedia_sdm: string;
  personel_pengganti: string;
  keterangan: string;
};

const emptySumberDayaManusiaForm: SumberDayaManusiaForm = {
  mkb_layanan_prioritas_id: '',
  kebutuhan_personel: '',
  jumlah_minimum: '',
  kompetensi: '',
  sumber_penyedia_sdm: '',
  personel_pengganti: '',
  keterangan: '',
};

type FasilitasOperasionalItem = {
  id: number;
  mkb_layanan_prioritas_id: number;
  nama_instansi: string;
  nama_fasilitas: string;
  jenis_fasilitas: string | null;
  jumlah_minimum: number | null;
  lokasi: string | null;
  fungsi: string | null;
  alternatif: string | null;
  keterangan: string | null;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
};

type FasilitasOperasionalForm = {
  mkb_layanan_prioritas_id: string;
  nama_fasilitas: string;
  jenis_fasilitas: string;
  jumlah_minimum: string;
  lokasi: string;
  fungsi: string;
  alternatif: string;
  keterangan: string;
};

const emptyFasilitasOperasionalForm: FasilitasOperasionalForm = {
  mkb_layanan_prioritas_id: '',
  nama_fasilitas: '',
  jenis_fasilitas: '',
  jumlah_minimum: '',
  lokasi: '',
  fungsi: '',
  alternatif: '',
  keterangan: '',
};

type SumberDayaTikItem = {
  id: number;
  mkb_layanan_prioritas_id: number;
  nama_instansi: string;
  jenis_sumber_daya: string;
  nama_sumber_daya: string;
  jumlah_minimum: number | null;
  spesifikasi: string | null;
  lokasi: string | null;
  sumber_cadangan: string | null;
  keterangan: string | null;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
};

type SumberDayaTikForm = {
  mkb_layanan_prioritas_id: string;
  jenis_sumber_daya: string;
  nama_sumber_daya: string;
  jumlah_minimum: string;
  spesifikasi: string;
  lokasi: string;
  sumber_cadangan: string;
  keterangan: string;
};

const emptySumberDayaTikForm: SumberDayaTikForm = {
  mkb_layanan_prioritas_id: '',
  jenis_sumber_daya: '',
  nama_sumber_daya: '',
  jumlah_minimum: '',
  spesifikasi: '',
  lokasi: '',
  sumber_cadangan: '',
  keterangan: '',
};

type AksesSistemTikItem = {
  id: number;
  mkb_layanan_prioritas_id: number;
  nama_instansi: string;
  nama_sistem: string;
  jenis_sistem: string | null;
  jenis_akses: string;
  personel_berwenang: string | null;
  mekanisme_akses: string | null;
  akses_darurat: string | null;
  keterangan: string | null;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
};

type AksesSistemTikForm = {
  mkb_layanan_prioritas_id: string;
  nama_sistem: string;
  jenis_sistem: string;
  jenis_akses: string;
  personel_berwenang: string;
  mekanisme_akses: string;
  akses_darurat: string;
  keterangan: string;
};

const emptyAksesSistemTikForm: AksesSistemTikForm = {
  mkb_layanan_prioritas_id: '',
  nama_sistem: '',
  jenis_sistem: '',
  jenis_akses: '',
  personel_berwenang: '',
  mekanisme_akses: '',
  akses_darurat: '',
  keterangan: '',
};

type SumberDayaEksternalTikItem = {
  id: number;
  mkb_layanan_prioritas_id: number;
  nama_instansi: string;
  nama_vendor_mitra: string;
  jenis_sumber_daya: string;
  deskripsi_sumber_daya: string | null;
  kontak_dukungan: string | null;
  mekanisme_aktivasi: string | null;
  alternatif_penyedia: string | null;
  keterangan: string | null;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
};

type SumberDayaEksternalTikForm = {
  mkb_layanan_prioritas_id: string;
  nama_vendor_mitra: string;
  jenis_sumber_daya: string;
  deskripsi_sumber_daya: string;
  kontak_dukungan: string;
  mekanisme_aktivasi: string;
  alternatif_penyedia: string;
  keterangan: string;
};

const emptySumberDayaEksternalTikForm: SumberDayaEksternalTikForm = {
  mkb_layanan_prioritas_id: '',
  nama_vendor_mitra: '',
  jenis_sumber_daya: '',
  deskripsi_sumber_daya: '',
  kontak_dukungan: '',
  mekanisme_aktivasi: '',
  alternatif_penyedia: '',
  keterangan: '',
};

type DaftarKontakItem = {
  id: number;
  layanan_prioritas_id: number | null;
  mkb_layanan_prioritas_id: number;
  nama: string;
  jabatan: string | null;
  organisasi: string | null;
  alamat: string | null;
  telepon: string | null;
  email: string | null;
  kode_prioritas: string;
  kode_layanan: string;
  nama_layanan: string;
  jenis_layanan: string | null;
  instansi_id: number;
  kode_instansi: string;
  nama_instansi: string;
  created_by: number | null;
  dibuat_oleh: string | null;
  created_at: string;
  updated_at: string;
};

type DaftarKontakForm = {
  mkb_layanan_prioritas_id: string;
  nama: string;
  jabatan: string;
  organisasi: string;
  alamat: string;
  telepon: string;
  email: string;
};

const emptyDaftarKontakForm: DaftarKontakForm = {
  mkb_layanan_prioritas_id: '',
  nama: '',
  jabatan: '',
  organisasi: '',
  alamat: '',
  telepon: '',
  email: '',
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

type StrukturTimMkbItem = {
  id: number;
  mkb_layanan_prioritas_id: number;
  jenis_tim: string;
  nama_pegawai: string;
  nip: string | null;
  jabatan: string;
  unit_kerja: string;
  peran_tim: string;
  tanggung_jawab: string;
  kode_layanan: string;
  nama_layanan: string;
  nama_instansi: string;
};

type StrukturTimMkbForm = {
  mkb_layanan_prioritas_id: string;
  jenis_tim: string;
  nama_pegawai: string;
  nip: string;
  jabatan: string;
  unit_kerja: string;
  peran_tim: string;
  tanggung_jawab: string;
};

const emptyStrukturTimMkbForm: StrukturTimMkbForm = {
  mkb_layanan_prioritas_id: '',
  jenis_tim: '',
  nama_pegawai: '',
  nip: '',
  jabatan: '',
  unit_kerja: '',
  peran_tim: '',
  tanggung_jawab: ''
};

const jenisTimMkbOptions = [
  'Tim Manajemen Keberlangsungan',
  'Tim Tanggap Insiden',
  'Tim Pemulihan Layanan Digital',
  'Tim Operasional'
];

type FormState = {
  layanan_prioritas_id: string;
  nama_layanan_prioritas: string;
  kode_layanan_mkb: string;
  jenis_layanan_mkb: string;
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
  nama_layanan_prioritas: '',
  kode_layanan_mkb: '',
  jenis_layanan_mkb: '',
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

  const savedUser = sessionStorage.getItem('user');
  const user = savedUser ? JSON.parse(savedUser) : null;
  const permissions: string[] = user?.permissions || [];

  const canCreate = permissions.includes('continuity.create');
  const canUpdate = permissions.includes('continuity.update');
  const canDelete = permissions.includes('continuity.delete');
  const canManage = canCreate || canUpdate || canDelete;

  const [data, setData] = useState<RuangLingkupItem[]>([]);
  const [strukturTimMkb, setStrukturTimMkb] = useState<StrukturTimMkbItem[]>([]);
  const [strukturTimMkbForm, setStrukturTimMkbForm] = useState<StrukturTimMkbForm>(emptyStrukturTimMkbForm);
  const [editingStrukturTimMkbId, setEditingStrukturTimMkbId] = useState<number | null>(null);
  const [showStrukturTimMkbForm, setShowStrukturTimMkbForm] = useState(false);
  const [savingStrukturTimMkb, setSavingStrukturTimMkb] = useState(false);
  const [strukturTimMkbError, setStrukturTimMkbError] = useState('');
  const [selectedStrukturTimMkb, setSelectedStrukturTimMkb] = useState<StrukturTimMkbItem | null>(null);
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
  const [ruangLingkupFormError, setRuangLingkupFormError] = useState('');

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

  const [timOperasional, setTimOperasional] =
    useState<TimOperasionalItem[]>([]);

  const [operasionalForm, setOperasionalForm] =
    useState<TimOperasionalForm>(
      emptyTimOperasionalForm
    );

  const [editingOperasionalId, setEditingOperasionalId] =
    useState<number | null>(null);

  const [showOperasionalForm, setShowOperasionalForm] =
    useState(false);

  const [savingOperasional, setSavingOperasional] =
    useState(false);

  const [rencanaKomunikasi, setRencanaKomunikasi] =
    useState<RencanaKomunikasiItem[]>([]);

  const [komunikasiForm, setKomunikasiForm] =
    useState<RencanaKomunikasiForm>(
      emptyRencanaKomunikasiForm
    );

  const [editingKomunikasiId, setEditingKomunikasiId] =
    useState<number | null>(null);

  const [showKomunikasiForm, setShowKomunikasiForm] =
    useState(false);

  const [komunikasiFormError, setKomunikasiFormError] = 
    useState('');
  
  const [selectedKomunikasi, setSelectedKomunikasi] =
    useState<RencanaKomunikasiItem | null>(null);

  const [savingKomunikasi, setSavingKomunikasi] =
    useState(false);

  const [daftarKontak, setDaftarKontak] =
    useState<DaftarKontakItem[]>([]);

  const [kontakForm, setKontakForm] =
    useState<DaftarKontakForm>(
      emptyDaftarKontakForm
    );

  const [editingKontakId, setEditingKontakId] =
    useState<number | null>(null);

  const [showKontakForm, setShowKontakForm] =
    useState(false);

  const [savingKontak, setSavingKontak] =
    useState(false);

  const [kontakFormError, setKontakFormError] = 
    useState('');
  const [selectedKontak, setSelectedKontak] =
    useState<DaftarKontakItem | null>(null);

  const [sumberDayaManusia, setSumberDayaManusia] =
    useState<SumberDayaManusiaItem[]>([]);

  const [sdmForm, setSdmForm] =
    useState<SumberDayaManusiaForm>(
      emptySumberDayaManusiaForm
    );

  const [editingSdmId, setEditingSdmId] =
    useState<number | null>(null);

  const [showSdmForm, setShowSdmForm] =
    useState(false);

  const [savingSdm, setSavingSdm] =
    useState(false);

  const [fasilitasOperasional, setFasilitasOperasional] =
    useState<FasilitasOperasionalItem[]>([]);

  const [fasilitasForm, setFasilitasForm] =
    useState<FasilitasOperasionalForm>(
      emptyFasilitasOperasionalForm
    );

  const [editingFasilitasId, setEditingFasilitasId] =
    useState<number | null>(null);

  const [showFasilitasForm, setShowFasilitasForm] =
    useState(false);

  const [savingFasilitas, setSavingFasilitas] =
    useState(false);

  const [sumberDayaTik, setSumberDayaTik] =
    useState<SumberDayaTikItem[]>([]);

  const [tikForm, setTikForm] =
    useState<SumberDayaTikForm>(
      emptySumberDayaTikForm
    );

  const [editingTikId, setEditingTikId] =
    useState<number | null>(null);

  const [showTikForm, setShowTikForm] =
    useState(false);

  const [savingTik, setSavingTik] =
    useState(false);

  const [aksesSistemTik, setAksesSistemTik] =
    useState<AksesSistemTikItem[]>([]);

  const [aksesForm, setAksesForm] =
    useState<AksesSistemTikForm>(
      emptyAksesSistemTikForm
    );

  const [editingAksesId, setEditingAksesId] =
    useState<number | null>(null);

  const [showAksesForm, setShowAksesForm] =
    useState(false);

  const [savingAkses, setSavingAkses] =
    useState(false);

  const [sumberDayaEksternalTik, setSumberDayaEksternalTik] =
    useState<SumberDayaEksternalTikItem[]>([]);

  const [eksternalTikForm, setEksternalTikForm] =
    useState<SumberDayaEksternalTikForm>(
      emptySumberDayaEksternalTikForm
    );

  const [editingEksternalTikId, setEditingEksternalTikId] =
    useState<number | null>(null);

  const [showEksternalTikForm, setShowEksternalTikForm] =
    useState(false);

  const [savingEksternalTik, setSavingEksternalTik] =
    useState(false);

  const [form8Error, setForm8Error] = useState('');
  const [form8Detail, setForm8Detail] = useState<{ title: string; fields: [string, string | number | null | undefined][] } | null>(null);

  const fetchRuangLingkup = async () => {
    try {
      setLoading(true);
      setError('');

      const token = sessionStorage.getItem('token');

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

  const fetchTimManajemen = async () => {
    try {
      const token = sessionStorage.getItem('token');

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
        const token = sessionStorage.getItem('token');

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
        const token = sessionStorage.getItem('token');

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
        const token = sessionStorage.getItem('token');

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

    const fetchTimOperasional = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/operasional',
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
            'Gagal mengambil data pelaksana operasional.'
        );
      }

      setTimOperasional(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil pelaksana operasional.'
      );
    }
  };

  const fetchRencanaKomunikasi = async () => {
      try {
        const token = sessionStorage.getItem('token');

        const response = await fetch(
          'http://localhost:5000/api/bcp/rencana-komunikasi',
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
              'Gagal mengambil rencana komunikasi.'
          );
        }

        setRencanaKomunikasi(
          Array.isArray(result.data)
            ? result.data
            : []
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Gagal mengambil rencana komunikasi.'
        );
      }
    };

    const fetchDaftarKontak = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/daftar-kontak',
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
            'Gagal mengambil daftar kontak.'
        );
      }

      setDaftarKontak(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil daftar kontak.'
      );
    }
  };

  const fetchSumberDayaManusia = async () => {
  try {
    const token = sessionStorage.getItem('token');

    const response = await fetch(
      'http://localhost:5000/api/bcp/sumber-daya-manusia',
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
          'Gagal mengambil sumber daya manusia.'
      );
    }

    setSumberDayaManusia(
      Array.isArray(result.data)
        ? result.data
        : []
    );
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Gagal mengambil sumber daya manusia.'
    );
  }
};

const fetchFasilitasOperasional = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/fasilitas-operasional',
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
            'Gagal mengambil fasilitas operasional.'
        );
      }

      setFasilitasOperasional(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil fasilitas operasional.'
      );
    }
  };

  const fetchSumberDayaTik = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/sumber-daya-tik',
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
            'Gagal mengambil sumber daya TIK.'
        );
      }

      setSumberDayaTik(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil sumber daya TIK.'
      );
    }
  };

  const fetchAksesSistemTik = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/akses-sistem-tik',
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
            'Gagal mengambil akses sistem TIK.'
        );
      }

      setAksesSistemTik(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil akses sistem TIK.'
      );
    }
  };

  const fetchSumberDayaEksternalTik = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        'http://localhost:5000/api/bcp/sumber-daya-eksternal-tik',
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
            'Gagal mengambil sumber daya eksternal TIK.'
        );
      }

      setSumberDayaEksternalTik(
        Array.isArray(result.data)
          ? result.data
          : []
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil sumber daya eksternal TIK.'
      );
    }
  };

  useEffect(() => {
    fetchRuangLingkup();
    fetchStrukturTimMkb();
    fetchTimManajemen();
    fetchTimTanggapInsiden();
    fetchTimPemulihanLayanan();
    fetchTimOperasional();
    fetchRencanaKomunikasi();
    fetchDaftarKontak();
    fetchSumberDayaManusia();
    fetchFasilitasOperasional();
    fetchSumberDayaTik();
    fetchAksesSistemTik();
    fetchSumberDayaEksternalTik();

    if (canManage) {
      fetchPegawaiOptions();
    }
  }, []);

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
    setEditingId(null);
    setShowForm(false);
  };

  const handleTambah = () => {
    setEditingId(null);
    setRuangLingkupFormError('');
    setFormData(emptyForm);
    setMessage('');
    setError('');
    setShowForm(true);
  };

  const handleEdit = (
    item: RuangLingkupItem
  ) => {
    setEditingId(item.id);
    setRuangLingkupFormError('');

    setFormData({
      layanan_prioritas_id: String(item.layanan_prioritas_id || ''),
      nama_layanan_prioritas: item.nama_layanan || '',
      kode_layanan_mkb: item.kode_prioritas || '',
      jenis_layanan_mkb: item.jenis_layanan || '',
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

  };

  const handleDetail = (
    item: RuangLingkupItem
  ) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setRuangLingkupFormError('');

    if (!formData.kode_layanan_mkb.trim()) {
      setRuangLingkupFormError('ID Layanan Prioritas wajib diisi.');
      return;
    }

    if (!/^[A-Za-z0-9_-]+$/.test(formData.kode_layanan_mkb.trim())) {
      setRuangLingkupFormError('ID Layanan hanya boleh menggunakan huruf, angka, - dan _.');
      return;
    }

    if (!formData.jenis_layanan_mkb.trim()) {
      setRuangLingkupFormError('Jenis Layanan wajib diisi.');
      return;
    }

    if (!formData.nama_layanan_prioritas.trim()) {
      setRuangLingkupFormError('Layanan Prioritas wajib diisi.');
      return;
    }

    if (!formData.scope_layanan.trim()) {
      setRuangLingkupFormError('Scope / Ruang Lingkup Layanan wajib diisi.');
      return;
    }

    if (!formData.kategori_layanan.trim()) {
      setRuangLingkupFormError('Kategori Layanan wajib diisi.');
      return;
    }

    if (!formData.pengguna_utama.trim()) {
      setRuangLingkupFormError('Pengguna Utama wajib diisi.');
      return;
    }

    if (formData.jumlah_pengguna.trim() === '') {
      setRuangLingkupFormError('Jumlah Pengguna wajib diisi.');
      return;
    }

    const jumlahPengguna = Number(formData.jumlah_pengguna);

    if (!Number.isInteger(jumlahPengguna) || jumlahPengguna < 0) {
      setRuangLingkupFormError('Jumlah Pengguna harus berupa bilangan bulat positif atau nol.');
      return;
    }

    if (!formData.target_ola.trim()) {
      setRuangLingkupFormError('Target OLA wajib diisi.');
      return;
    }

    if (formData.terkait_ekosistem === '1') {
      if (!formData.ekosistem_pemerintah_digital.trim()) {
        setRuangLingkupFormError('Ekosistem Pemerintah Digital wajib diisi.');
        return;
      }

      if (!formData.deskripsi_ekosistem.trim()) {
        setRuangLingkupFormError('Deskripsi Ekosistem wajib diisi.');
        return;
      }
    }

    try {
      setSaving(true);
      setMessage('');
      setError('');

      const token = sessionStorage.getItem('token');

      const payload: Record<string, string | number | boolean | null> = {
        nama_layanan_prioritas: formData.nama_layanan_prioritas.trim(),
        kode_layanan: formData.kode_layanan_mkb.trim().toUpperCase(),
        jenis_layanan: formData.jenis_layanan_mkb.trim(),
        instansi_id: user?.instansi_id ? Number(user.instansi_id) : null,
        scope_layanan: formData.scope_layanan.trim(),
        kategori_layanan: formData.kategori_layanan.trim(),
        pengguna_utama: formData.pengguna_utama.trim(),
        jumlah_pengguna: jumlahPengguna,
        target_ola: formData.target_ola.trim(),
        terkait_ekosistem: formData.terkait_ekosistem === '1',
        ekosistem_pemerintah_digital:
          formData.terkait_ekosistem === '1'
            ? formData.ekosistem_pemerintah_digital.trim()
            : null,
        deskripsi_ekosistem:
          formData.terkait_ekosistem === '1'
            ? formData.deskripsi_ekosistem.trim()
            : null,
      };


      const response = await fetch(
        editingId
          ? `http://localhost:5000/api/bcp/ruang-lingkup/${editingId}`
          : 'http://localhost:5000/api/bcp/ruang-lingkup',
        {
          method: editingId ? 'PUT' : 'POST',
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
          result.message || 'Gagal menyimpan data ruang lingkup.'
        );
      }

      setMessage(
        result.message || 'Data ruang lingkup berhasil disimpan.'
      );

      setRuangLingkupFormError('');
      resetForm();
      await fetchRuangLingkup();
    } catch (err) {
      setRuangLingkupFormError(
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
        sessionStorage.getItem('token');

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

  const fetchStrukturTimMkb = async () => {
  try {
    const token = sessionStorage.getItem('token');

    const response = await fetch(
      'http://localhost:5000/api/bcp/struktur-tim',
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.message || 'Gagal mengambil struktur tim.');
    }

    setStrukturTimMkb(Array.isArray(result.data) ? result.data : []);
  } catch (err) {
    setError(
      err instanceof Error ? err.message : 'Gagal mengambil struktur tim.'
    );
  }
};

  const handleTambahStrukturTimMkb = () => {
    setEditingStrukturTimMkbId(null);
    setStrukturTimMkbForm(emptyStrukturTimMkbForm);
    setStrukturTimMkbError('');
    setShowStrukturTimMkbForm(true);
  };

  const handleEditStrukturTimMkb = (item: StrukturTimMkbItem) => {
    setEditingStrukturTimMkbId(item.id);
    setStrukturTimMkbError('');
    setStrukturTimMkbForm({
      mkb_layanan_prioritas_id: String(item.mkb_layanan_prioritas_id),
      jenis_tim: item.jenis_tim,
      nama_pegawai: item.nama_pegawai,
      nip: item.nip || '',
      jabatan: item.jabatan,
      unit_kerja: item.unit_kerja,
      peran_tim: item.peran_tim,
      tanggung_jawab: item.tanggung_jawab
    });
    setShowStrukturTimMkbForm(true);
  };

  const handleSubmitStrukturTimMkb = async (event: FormEvent) => {
    event.preventDefault();
    setStrukturTimMkbError('');

    if (
      !strukturTimMkbForm.mkb_layanan_prioritas_id ||
      !strukturTimMkbForm.jenis_tim ||
      !strukturTimMkbForm.nama_pegawai.trim() ||
      !strukturTimMkbForm.jabatan.trim() ||
      !strukturTimMkbForm.unit_kerja.trim() ||
      !strukturTimMkbForm.peran_tim.trim() ||
      !strukturTimMkbForm.tanggung_jawab.trim()
    ) {
      setStrukturTimMkbError('Semua kolom bertanda * wajib diisi.');
      return;
    }

    try {
      setSavingStrukturTimMkb(true);

      const token = sessionStorage.getItem('token');
      const payload = {
        mkb_layanan_prioritas_id: Number(
          strukturTimMkbForm.mkb_layanan_prioritas_id
        ),
        jenis_tim: strukturTimMkbForm.jenis_tim,
        nama_pegawai: strukturTimMkbForm.nama_pegawai.trim(),
        nip: strukturTimMkbForm.nip.trim() || null,
        jabatan: strukturTimMkbForm.jabatan.trim(),
        unit_kerja: strukturTimMkbForm.unit_kerja.trim(),
        peran_tim: strukturTimMkbForm.peran_tim.trim(),
        tanggung_jawab: strukturTimMkbForm.tanggung_jawab.trim()
      };

      const response = await fetch(
        editingStrukturTimMkbId
          ? `http://localhost:5000/api/bcp/struktur-tim/${editingStrukturTimMkbId}`
          : 'http://localhost:5000/api/bcp/struktur-tim',
        {
          method: editingStrukturTimMkbId ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan anggota tim.');
      }

      setShowStrukturTimMkbForm(false);
      setEditingStrukturTimMkbId(null);
      setStrukturTimMkbForm(emptyStrukturTimMkbForm);
      setMessage(result.message || 'Anggota tim berhasil disimpan.');
      await fetchStrukturTimMkb();
    } catch (err) {
      setStrukturTimMkbError(
        err instanceof Error ? err.message : 'Gagal menyimpan anggota tim.'
      );
    } finally {
      setSavingStrukturTimMkb(false);
    }
  };

  const handleDeleteStrukturTimMkb = async (item: StrukturTimMkbItem) => {
    if (!window.confirm(`Hapus ${item.nama_pegawai} dari struktur tim?`)) {
      return;
    }

    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/struktur-tim/${item.id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menghapus anggota tim.');
      }

      setMessage(result.message || 'Anggota tim berhasil dihapus.');
      await fetchStrukturTimMkb();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menghapus anggota tim.'
      );
    }
  };

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
        sessionStorage.getItem('token');

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
        sessionStorage.getItem('token');

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
        sessionStorage.getItem('token');

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
        sessionStorage.getItem('token');

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

    const token = sessionStorage.getItem('token');

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

      const token = sessionStorage.getItem('token');

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

  const handleTambahOperasional = () => {
  setEditingOperasionalId(null);
  setOperasionalForm(emptyTimOperasionalForm);
  setMessage('');
  setError('');
  setShowOperasionalForm(true);
};

const handleEditOperasional = (
  item: TimOperasionalItem
) => {
  setEditingOperasionalId(item.id);

  setOperasionalForm({
    layanan_prioritas_id: String(
      item.layanan_prioritas_id
    ),
    pegawai_id: String(item.pegawai_id),
    peran_operasional: item.peran_operasional,
    tanggung_jawab: item.tanggung_jawab || '',
    urutan:
      item.urutan === null
        ? ''
        : String(item.urutan),
  });

  setMessage('');
  setError('');
  setShowOperasionalForm(true);
};

const resetOperasionalForm = () => {
  setEditingOperasionalId(null);
  setOperasionalForm(emptyTimOperasionalForm);
  setShowOperasionalForm(false);
};

const handleSubmitOperasional = async (
  event: FormEvent
) => {
  event.preventDefault();

  if (
    !editingOperasionalId &&
    !operasionalForm.layanan_prioritas_id
  ) {
    setError('Layanan prioritas wajib dipilih.');
    return;
  }

  if (!operasionalForm.pegawai_id) {
    setError('Pegawai wajib dipilih.');
    return;
  }

  if (!operasionalForm.peran_operasional.trim()) {
    setError('Peran operasional wajib diisi.');
    return;
  }

  try {
    setSavingOperasional(true);
    setMessage('');
    setError('');

    const token = sessionStorage.getItem('token');

    const payload: Record<
      string,
      string | number | null
    > = {
      pegawai_id: Number(
        operasionalForm.pegawai_id
      ),
      peran_operasional:
        operasionalForm.peran_operasional.trim(),
      tanggung_jawab:
        operasionalForm.tanggung_jawab.trim() ||
        null,
      urutan:
        operasionalForm.urutan === ''
          ? null
          : Number(operasionalForm.urutan),
    };

    if (!editingOperasionalId) {
      payload.layanan_prioritas_id = Number(
        operasionalForm.layanan_prioritas_id
      );
    }

    const response = await fetch(
      editingOperasionalId
        ? `http://localhost:5000/api/bcp/operasional/${editingOperasionalId}`
        : 'http://localhost:5000/api/bcp/operasional',
      {
        method: editingOperasionalId
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
          'Gagal menyimpan pelaksana operasional.'
      );
    }

    setMessage(
      result.message ||
        'Pelaksana operasional berhasil disimpan.'
    );

    resetOperasionalForm();
    await fetchTimOperasional();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan pelaksana operasional.'
    );
  } finally {
    setSavingOperasional(false);
  }
};

const handleDeleteOperasional = async (
    item: TimOperasionalItem
  ) => {
    const confirmed = window.confirm(
      `Hapus ${item.nama_pegawai} dari pelaksana operasional?`
    );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/operasional/${item.id}`,
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
            'Gagal menghapus pelaksana operasional.'
        );
      }

      setMessage(
        result.message ||
          'Pelaksana operasional berhasil dihapus.'
      );

      await fetchTimOperasional();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus pelaksana operasional.'
      );
    }
  };

  const handleTambahKomunikasi = () => {
  setEditingKomunikasiId(null);
  setKomunikasiFormError('');
  setKomunikasiForm(
    emptyRencanaKomunikasiForm
  );
  setMessage('');
  setError('');
  setShowKomunikasiForm(true);
};

  const handleEditKomunikasi = (item: RencanaKomunikasiItem) => {
    setEditingKomunikasiId(item.id);
    setKomunikasiFormError('');

    setKomunikasiForm({
      mkb_layanan_prioritas_id: String(item.mkb_layanan_prioritas_id),
      informasi_disampaikan: item.informasi_disampaikan,
      kategori_komunikasi: item.kategori_komunikasi,
      pengirim: item.pengirim,
      penerima: item.penerima,
      media_komunikasi: item.media_komunikasi,
      waktu_frekuensi: item.waktu_frekuensi || '',
      aktivitas: item.aktivitas || '',
      tujuan: item.tujuan || '',
    });

    setMessage('');
    setError('');
    setShowKomunikasiForm(true);
  };

  const resetKomunikasiForm = () => {
    setEditingKomunikasiId(null);
    setKomunikasiFormError('');
    setKomunikasiForm(
      emptyRencanaKomunikasiForm
    );
    setShowKomunikasiForm(false);
  };

  const handleSubmitKomunikasi = async (event: FormEvent) => {
    event.preventDefault();
    setKomunikasiFormError('');

    if (!komunikasiForm.mkb_layanan_prioritas_id) {
      setKomunikasiFormError('ID Layanan Prioritas wajib dipilih.');
      return;
    }

    if (!komunikasiForm.informasi_disampaikan.trim()) {
      setKomunikasiFormError('Informasi yang Disampaikan wajib diisi.');
      return;
    }

    if (!komunikasiForm.kategori_komunikasi.trim()) {
      setKomunikasiFormError('Kategori Komunikasi wajib diisi.');
      return;
    }

    if (!komunikasiForm.media_komunikasi.trim()) {
      setKomunikasiFormError('Media Komunikasi wajib diisi.');
      return;
    }

    try {
      setSavingKomunikasi(true);
      setKomunikasiFormError('');
      setMessage('');
      setError('');

      const token = sessionStorage.getItem('token');

      const payload = {
        mkb_layanan_prioritas_id: Number(
          komunikasiForm.mkb_layanan_prioritas_id
        ),
        informasi_disampaikan: komunikasiForm.informasi_disampaikan.trim(),
        kategori_komunikasi: komunikasiForm.kategori_komunikasi.trim(),
        pengirim: komunikasiForm.pengirim.trim(),
        penerima: komunikasiForm.penerima.trim(),
        media_komunikasi: komunikasiForm.media_komunikasi.trim(),
        waktu_frekuensi: komunikasiForm.waktu_frekuensi.trim() || null,
        aktivitas: komunikasiForm.aktivitas.trim() || null,
        tujuan: komunikasiForm.tujuan.trim() || null,
      };

      const response = await fetch(
        editingKomunikasiId
          ? `http://localhost:5000/api/bcp/rencana-komunikasi/${editingKomunikasiId}`
          : 'http://localhost:5000/api/bcp/rencana-komunikasi',
        {
          method: editingKomunikasiId ? 'PUT' : 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Gagal menyimpan rencana komunikasi.');
      }

      setMessage(result.message || 'Rencana komunikasi berhasil disimpan.');
      resetKomunikasiForm();
      await fetchRencanaKomunikasi();
    } catch (err) {
      setKomunikasiFormError(
        err instanceof Error ? err.message : 'Gagal menyimpan rencana komunikasi.'
      );
    } finally {
      setSavingKomunikasi(false);
    }
  };

const handleDeleteKomunikasi = async (
    item: RencanaKomunikasiItem
  ) => {
    const confirmed = window.confirm(
      `Hapus rencana komunikasi ${item.informasi_disampaikan}?`
    );

    if (!confirmed) return;

    try {
      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/rencana-komunikasi/${item.id}`,
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
            'Gagal menghapus rencana komunikasi.'
        );
      }

      setMessage(
        result.message ||
          'Rencana komunikasi berhasil dihapus.'
      );

      await fetchRencanaKomunikasi();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus rencana komunikasi.'
      );
    }
  };

  const handleTambahKontak = () => {
  setEditingKontakId(null);
  setKontakFormError('');
  setKontakForm(emptyDaftarKontakForm);
  setMessage('');
  setError('');
  setShowKontakForm(true);
};

const handleEditKontak = (
  item: DaftarKontakItem
) => {
  setEditingKontakId(item.id);
  setKontakFormError('');

  setKontakForm({
    mkb_layanan_prioritas_id: String(item.mkb_layanan_prioritas_id),
    nama: item.nama,
    jabatan: item.jabatan || '',
    organisasi: item.organisasi || '',
    alamat: item.alamat || '',
    telepon: item.telepon || '',
    email: item.email || '',
  });

  setMessage('');
  setError('');
  setShowKontakForm(true);
};

const resetKontakForm = () => {
  setEditingKontakId(null);
  setKontakFormError('');
  setKontakForm(emptyDaftarKontakForm);
  setShowKontakForm(false);
};

const handleSubmitKontak = async (event: FormEvent) => {
  event.preventDefault();
  setKontakFormError('');

  if (!kontakForm.mkb_layanan_prioritas_id) {
    setKontakFormError('ID Layanan Prioritas wajib dipilih.');
    return;
  }

  if (!kontakForm.nama.trim()) {
    setKontakFormError('Nama Kontak wajib diisi.');
    return;
  }

  if (kontakForm.nama.trim().length > 200) {
    setKontakFormError('Nama Kontak maksimal 200 karakter.');
    return;
  }

  if (kontakForm.jabatan.trim().length > 200) {
    setKontakFormError('Jabatan maksimal 200 karakter.');
    return;
  }

  if (kontakForm.organisasi.trim().length > 200) {
    setKontakFormError('Organisasi maksimal 200 karakter.');
    return;
  }

  if (kontakForm.telepon.trim().length > 100) {
    setKontakFormError('Nomor Telepon maksimal 100 karakter.');
    return;
  }

  if (kontakForm.email.trim().length > 200) {
    setKontakFormError('Email maksimal 200 karakter.');
    return;
  }

  if (
    kontakForm.email.trim() &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(kontakForm.email.trim())
  ) {
    setKontakFormError('Format Email tidak valid.');
    return;
  }

  try {
    setSavingKontak(true);
    setMessage('');
    setError('');

    const token = sessionStorage.getItem('token');

    const payload = {
      mkb_layanan_prioritas_id: Number(
        kontakForm.mkb_layanan_prioritas_id
      ),
      nama: kontakForm.nama.trim(),
      jabatan: kontakForm.jabatan.trim() || null,
      organisasi: kontakForm.organisasi.trim() || null,
      alamat: kontakForm.alamat.trim() || null,
      telepon: kontakForm.telepon.trim() || null,
      email: kontakForm.email.trim() || null,
    };

    const response = await fetch(
      editingKontakId
        ? `http://localhost:5000/api/bcp/daftar-kontak/${editingKontakId}`
        : 'http://localhost:5000/api/bcp/daftar-kontak',
      {
        method: editingKontakId ? 'PUT' : 'POST',
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
        result.message || 'Gagal menyimpan daftar kontak.'
      );
    }

    setMessage(
      result.message || 'Daftar kontak berhasil disimpan.'
    );

    resetKontakForm();
    await fetchDaftarKontak();
  } catch (err) {
    setKontakFormError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan daftar kontak.'
    );
  } finally {
    setSavingKontak(false);
  }
};

const handleDeleteKontak = async (
    item: DaftarKontakItem
  ) => {
    const confirmed = window.confirm(
      `Hapus kontak ${item.nama}?`
    );

    if (!confirmed) return;

    try {
      setMessage('');
      setError('');

      const token = sessionStorage.getItem('token');

      const response = await fetch(
        `http://localhost:5000/api/bcp/daftar-kontak/${item.id}`,
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
            'Gagal menghapus daftar kontak.'
        );
      }

      setMessage(
        result.message ||
          'Daftar kontak berhasil dihapus.'
      );

      await fetchDaftarKontak();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Terjadi kesalahan saat menghapus daftar kontak.'
      );
    }
  };

  const handleTambahSdm = () => {
  setForm8Error('');
  setEditingSdmId(null);
  setSdmForm(emptySumberDayaManusiaForm);
  setMessage('');
  setError('');
  setShowSdmForm(true);
};

const handleEditSdm = (
  item: SumberDayaManusiaItem
) => {
  setForm8Error('');
  setEditingSdmId(item.id);

  setSdmForm({
    mkb_layanan_prioritas_id: String(
      item.mkb_layanan_prioritas_id
    ),
    kebutuhan_personel: item.kebutuhan_personel,
    jumlah_minimum:
      item.jumlah_minimum === null
        ? ''
        : String(item.jumlah_minimum),
    kompetensi: item.kompetensi || '',
    sumber_penyedia_sdm:
      item.sumber_penyedia_sdm || '',
    personel_pengganti:
      item.personel_pengganti || '',
    keterangan: item.keterangan || '',
  });

  setMessage('');
  setError('');
  setShowSdmForm(true);
};

const resetSdmForm = () => {
  setEditingSdmId(null);
  setSdmForm(emptySumberDayaManusiaForm);
  setShowSdmForm(false);
};

const handleSubmitSdm = async (
  event: FormEvent
) => {
  event.preventDefault();
  setForm8Error('');

  if (
    !sdmForm.mkb_layanan_prioritas_id
  ) {
    setForm8Error('Layanan prioritas wajib dipilih.');
    return;
  }

  if (!sdmForm.kebutuhan_personel.trim()) {
    setForm8Error('Kebutuhan personel wajib diisi.');
    return;
  }

  try {
    setSavingSdm(true);
    setMessage('');
    setForm8Error('');

    const token = sessionStorage.getItem('token');

    const payload: Record<
      string,
      string | number | null
    > = {
      kebutuhan_personel:
        sdmForm.kebutuhan_personel.trim(),
      jumlah_minimum:
        sdmForm.jumlah_minimum === ''
          ? null
          : Number(sdmForm.jumlah_minimum),
      kompetensi:
        sdmForm.kompetensi.trim() || null,
      sumber_penyedia_sdm:
        sdmForm.sumber_penyedia_sdm.trim() || null,
      personel_pengganti:
        sdmForm.personel_pengganti.trim() || null,
      keterangan:
        sdmForm.keterangan.trim() || null,
    };

    payload.mkb_layanan_prioritas_id = Number(
        sdmForm.mkb_layanan_prioritas_id
      );

    const response = await fetch(
      editingSdmId
        ? `http://localhost:5000/api/bcp/sumber-daya-manusia/${editingSdmId}`
        : 'http://localhost:5000/api/bcp/sumber-daya-manusia',
      {
        method: editingSdmId ? 'PUT' : 'POST',
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
          'Gagal menyimpan sumber daya manusia.'
      );
    }

    setMessage(
      result.message ||
        'Sumber daya manusia berhasil disimpan.'
    );

    resetSdmForm();
    await fetchSumberDayaManusia();
  } catch (err) {
    setForm8Error(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan sumber daya manusia.'
    );
  } finally {
    setSavingSdm(false);
  }
};

const handleDeleteSdm = async (
  item: SumberDayaManusiaItem
) => {
  if (
    !window.confirm(
      `Hapus kebutuhan personel ${item.kebutuhan_personel}?`
    )
  ) {
    return;
  }

  try {
    setMessage('');
    setError('');

    const token = sessionStorage.getItem('token');

    const response = await fetch(
      `http://localhost:5000/api/bcp/sumber-daya-manusia/${item.id}`,
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
          'Gagal menghapus sumber daya manusia.'
      );
    }

    setMessage(
      result.message ||
        'Sumber daya manusia berhasil dihapus.'
    );

    await fetchSumberDayaManusia();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menghapus sumber daya manusia.'
    );
  }
};

const handleTambahFasilitas = () => {
  setForm8Error('');
  setEditingFasilitasId(null);
  setFasilitasForm(
    emptyFasilitasOperasionalForm
  );
  setMessage('');
  setError('');
  setShowFasilitasForm(true);
};

const handleEditFasilitas = (
  item: FasilitasOperasionalItem
) => {
  setForm8Error('');
  setEditingFasilitasId(item.id);

  setFasilitasForm({
    mkb_layanan_prioritas_id: String(
      item.mkb_layanan_prioritas_id
    ),
    nama_fasilitas: item.nama_fasilitas,
    jenis_fasilitas: item.jenis_fasilitas || '',
    jumlah_minimum:
      item.jumlah_minimum === null
        ? ''
        : String(item.jumlah_minimum),
    lokasi: item.lokasi || '',
    fungsi: item.fungsi || '',
    alternatif: item.alternatif || '',
    keterangan: item.keterangan || '',
  });

  setMessage('');
  setError('');
  setShowFasilitasForm(true);
};

const resetFasilitasForm = () => {
  setEditingFasilitasId(null);
  setFasilitasForm(
    emptyFasilitasOperasionalForm
  );
  setShowFasilitasForm(false);
};

const handleSubmitFasilitas = async (
  event: FormEvent
) => {
  event.preventDefault();
  setForm8Error('');

  if (
    !fasilitasForm.mkb_layanan_prioritas_id
  ) {
    setForm8Error('Layanan prioritas wajib dipilih.');
    return;
  }

  if (!fasilitasForm.nama_fasilitas.trim()) {
    setForm8Error('Nama fasilitas wajib diisi.');
    return;
  }

  try {
    setSavingFasilitas(true);
    setMessage('');
    setForm8Error('');

    const token = sessionStorage.getItem('token');

    const payload: Record<
      string,
      string | number | null
    > = {
      nama_fasilitas:
        fasilitasForm.nama_fasilitas.trim(),
      jenis_fasilitas:
        fasilitasForm.jenis_fasilitas.trim() || null,
      jumlah_minimum:
        fasilitasForm.jumlah_minimum === ''
          ? null
          : Number(fasilitasForm.jumlah_minimum),
      lokasi:
        fasilitasForm.lokasi.trim() || null,
      fungsi:
        fasilitasForm.fungsi.trim() || null,
      alternatif:
        fasilitasForm.alternatif.trim() || null,
      keterangan:
        fasilitasForm.keterangan.trim() || null,
    };

    payload.mkb_layanan_prioritas_id = Number(
        fasilitasForm.mkb_layanan_prioritas_id
      );

    const response = await fetch(
      editingFasilitasId
        ? `http://localhost:5000/api/bcp/fasilitas-operasional/${editingFasilitasId}`
        : 'http://localhost:5000/api/bcp/fasilitas-operasional',
      {
        method: editingFasilitasId
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
          'Gagal menyimpan fasilitas operasional.'
      );
    }

    setMessage(
      result.message ||
        'Fasilitas operasional berhasil disimpan.'
    );

    resetFasilitasForm();
    await fetchFasilitasOperasional();
  } catch (err) {
    setForm8Error(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan fasilitas operasional.'
    );
  } finally {
    setSavingFasilitas(false);
  }
};

const handleDeleteFasilitas = async (
  item: FasilitasOperasionalItem
) => {
  if (
    !window.confirm(
      `Hapus fasilitas ${item.nama_fasilitas}?`
    )
  ) {
    return;
  }

  try {
    const token = sessionStorage.getItem('token');

    const response = await fetch(
      `http://localhost:5000/api/bcp/fasilitas-operasional/${item.id}`,
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
          'Gagal menghapus fasilitas operasional.'
      );
    }

    setMessage(
      result.message ||
        'Fasilitas operasional berhasil dihapus.'
    );

    await fetchFasilitasOperasional();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menghapus fasilitas operasional.'
    );
  }
};

const handleTambahTik = () => {
  setForm8Error('');
  setEditingTikId(null);
  setTikForm(emptySumberDayaTikForm);
  setMessage('');
  setError('');
  setShowTikForm(true);
};

const handleEditTik = (
  item: SumberDayaTikItem
) => {
  setForm8Error('');
  setEditingTikId(item.id);

  setTikForm({
    mkb_layanan_prioritas_id: String(
      item.mkb_layanan_prioritas_id
    ),
    jenis_sumber_daya: item.jenis_sumber_daya,
    nama_sumber_daya: item.nama_sumber_daya,
    jumlah_minimum:
      item.jumlah_minimum === null
        ? ''
        : String(item.jumlah_minimum),
    spesifikasi: item.spesifikasi || '',
    lokasi: item.lokasi || '',
    sumber_cadangan:
      item.sumber_cadangan || '',
    keterangan: item.keterangan || '',
  });

  setMessage('');
  setError('');
  setShowTikForm(true);
};

const resetTikForm = () => {
  setEditingTikId(null);
  setTikForm(emptySumberDayaTikForm);
  setShowTikForm(false);
};

const handleSubmitTik = async (
  event: FormEvent
) => {
  event.preventDefault();
  setForm8Error('');

  if (
    !tikForm.mkb_layanan_prioritas_id
  ) {
    setForm8Error('Layanan prioritas wajib dipilih.');
    return;
  }

  if (
    !tikForm.jenis_sumber_daya ||
    !tikForm.nama_sumber_daya.trim()
  ) {
    setForm8Error(
      'Jenis dan nama sumber daya TIK wajib diisi.'
    );
    return;
  }

  try {
    setSavingTik(true);
    setMessage('');
    setForm8Error('');

    const token = sessionStorage.getItem('token');

    const payload: Record<
      string,
      string | number | null
    > = {
      jenis_sumber_daya:
        tikForm.jenis_sumber_daya,
      nama_sumber_daya:
        tikForm.nama_sumber_daya.trim(),
      jumlah_minimum:
        tikForm.jumlah_minimum === ''
          ? null
          : Number(tikForm.jumlah_minimum),
      spesifikasi:
        tikForm.spesifikasi.trim() || null,
      lokasi:
        tikForm.lokasi.trim() || null,
      sumber_cadangan:
        tikForm.sumber_cadangan.trim() || null,
      keterangan:
        tikForm.keterangan.trim() || null,
    };

    payload.mkb_layanan_prioritas_id = Number(
        tikForm.mkb_layanan_prioritas_id
      );

    const response = await fetch(
      editingTikId
        ? `http://localhost:5000/api/bcp/sumber-daya-tik/${editingTikId}`
        : 'http://localhost:5000/api/bcp/sumber-daya-tik',
      {
        method: editingTikId ? 'PUT' : 'POST',
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
          'Gagal menyimpan sumber daya TIK.'
      );
    }

    setMessage(
      result.message ||
        'Sumber daya TIK berhasil disimpan.'
    );

    resetTikForm();
    await fetchSumberDayaTik();
  } catch (err) {
    setForm8Error(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan sumber daya TIK.'
    );
  } finally {
    setSavingTik(false);
  }
};

const handleDeleteTik = async (
  item: SumberDayaTikItem
) => {
  if (
    !window.confirm(
      `Hapus sumber daya ${item.nama_sumber_daya}?`
    )
  ) {
    return;
  }

  try {
    const token = sessionStorage.getItem('token');

    const response = await fetch(
      `http://localhost:5000/api/bcp/sumber-daya-tik/${item.id}`,
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
          'Gagal menghapus sumber daya TIK.'
      );
    }

    setMessage(
      result.message ||
        'Sumber daya TIK berhasil dihapus.'
    );

    await fetchSumberDayaTik();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menghapus sumber daya TIK.'
    );
  }
};

const handleTambahAkses = () => {
  setForm8Error('');
  setEditingAksesId(null);
  setAksesForm(emptyAksesSistemTikForm);
  setMessage('');
  setError('');
  setShowAksesForm(true);
};

const handleEditAkses = (
  item: AksesSistemTikItem
) => {
  setForm8Error('');
  setEditingAksesId(item.id);

  setAksesForm({
    mkb_layanan_prioritas_id: String(
      item.mkb_layanan_prioritas_id
    ),
    nama_sistem: item.nama_sistem,
    jenis_sistem: item.jenis_sistem || '',
    jenis_akses: item.jenis_akses,
    personel_berwenang:
      item.personel_berwenang || '',
    mekanisme_akses:
      item.mekanisme_akses || '',
    akses_darurat:
      item.akses_darurat || '',
    keterangan: item.keterangan || '',
  });

  setMessage('');
  setError('');
  setShowAksesForm(true);
};

const resetAksesForm = () => {
  setEditingAksesId(null);
  setAksesForm(emptyAksesSistemTikForm);
  setShowAksesForm(false);
};

const handleSubmitAkses = async (
  event: FormEvent
) => {
  event.preventDefault();
  setForm8Error('');

  if (
    !aksesForm.mkb_layanan_prioritas_id
  ) {
    setForm8Error('Layanan prioritas wajib dipilih.');
    return;
  }

  if (
    !aksesForm.nama_sistem.trim() ||
    !aksesForm.jenis_akses.trim()
  ) {
    setForm8Error(
      'Nama sistem dan jenis akses wajib diisi.'
    );
    return;
  }

  try {
    setSavingAkses(true);
    setMessage('');
    setForm8Error('');

    const token = sessionStorage.getItem('token');

    const payload: Record<
      string,
      string | number | null
    > = {
      nama_sistem:
        aksesForm.nama_sistem.trim(),
      jenis_sistem:
        aksesForm.jenis_sistem || null,
      jenis_akses:
        aksesForm.jenis_akses.trim(),
      personel_berwenang:
        aksesForm.personel_berwenang.trim() ||
        null,
      mekanisme_akses:
        aksesForm.mekanisme_akses.trim() ||
        null,
      akses_darurat:
        aksesForm.akses_darurat.trim() ||
        null,
      keterangan:
        aksesForm.keterangan.trim() || null,
    };

    payload.mkb_layanan_prioritas_id = Number(
        aksesForm.mkb_layanan_prioritas_id
      );

    const response = await fetch(
      editingAksesId
        ? `http://localhost:5000/api/bcp/akses-sistem-tik/${editingAksesId}`
        : 'http://localhost:5000/api/bcp/akses-sistem-tik',
      {
        method: editingAksesId ? 'PUT' : 'POST',
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
          'Gagal menyimpan akses sistem TIK.'
      );
    }

    setMessage(
      result.message ||
        'Akses sistem TIK berhasil disimpan.'
    );

    resetAksesForm();
    await fetchAksesSistemTik();
  } catch (err) {
    setForm8Error(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan akses sistem TIK.'
    );
  } finally {
    setSavingAkses(false);
  }
};

const handleDeleteAkses = async (
  item: AksesSistemTikItem
) => {
  if (
    !window.confirm(
      `Hapus akses sistem ${item.nama_sistem}?`
    )
  ) {
    return;
  }

  try {
    const token = sessionStorage.getItem('token');

    const response = await fetch(
      `http://localhost:5000/api/bcp/akses-sistem-tik/${item.id}`,
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
          'Gagal menghapus akses sistem TIK.'
      );
    }

    setMessage(
      result.message ||
        'Akses sistem TIK berhasil dihapus.'
    );

    await fetchAksesSistemTik();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menghapus akses sistem TIK.'
    );
  }
};

const handleTambahEksternalTik = () => {
  setForm8Error('');
  setEditingEksternalTikId(null);
  setEksternalTikForm(
    emptySumberDayaEksternalTikForm
  );
  setMessage('');
  setError('');
  setShowEksternalTikForm(true);
};

const handleEditEksternalTik = (
  item: SumberDayaEksternalTikItem
) => {
  setForm8Error('');
  setEditingEksternalTikId(item.id);

  setEksternalTikForm({
    mkb_layanan_prioritas_id: String(
      item.mkb_layanan_prioritas_id
    ),
    nama_vendor_mitra: item.nama_vendor_mitra,
    jenis_sumber_daya: item.jenis_sumber_daya,
    deskripsi_sumber_daya:
      item.deskripsi_sumber_daya || '',
    kontak_dukungan:
      item.kontak_dukungan || '',
    mekanisme_aktivasi:
      item.mekanisme_aktivasi || '',
    alternatif_penyedia:
      item.alternatif_penyedia || '',
    keterangan: item.keterangan || '',
  });

  setMessage('');
  setError('');
  setShowEksternalTikForm(true);
};

const resetEksternalTikForm = () => {
  setEditingEksternalTikId(null);
  setEksternalTikForm(
    emptySumberDayaEksternalTikForm
  );
  setShowEksternalTikForm(false);
};

const handleSubmitEksternalTik = async (
  event: FormEvent
) => {
  event.preventDefault();
  setForm8Error('');

  if (
    !eksternalTikForm.mkb_layanan_prioritas_id
  ) {
    setForm8Error('Layanan prioritas wajib dipilih.');
    return;
  }

  if (
    !eksternalTikForm.nama_vendor_mitra.trim() ||
    !eksternalTikForm.jenis_sumber_daya
  ) {
    setForm8Error(
      'Nama vendor atau mitra dan jenis sumber daya wajib diisi.'
    );
    return;
  }

  try {
    setSavingEksternalTik(true);
    setMessage('');
    setForm8Error('');

    const token = sessionStorage.getItem('token');

    const payload: Record<
      string,
      string | number | null
    > = {
      nama_vendor_mitra:
        eksternalTikForm.nama_vendor_mitra.trim(),
      jenis_sumber_daya:
        eksternalTikForm.jenis_sumber_daya,
      deskripsi_sumber_daya:
        eksternalTikForm.deskripsi_sumber_daya.trim() ||
        null,
      kontak_dukungan:
        eksternalTikForm.kontak_dukungan.trim() ||
        null,
      mekanisme_aktivasi:
        eksternalTikForm.mekanisme_aktivasi.trim() ||
        null,
      alternatif_penyedia:
        eksternalTikForm.alternatif_penyedia.trim() ||
        null,
      keterangan:
        eksternalTikForm.keterangan.trim() ||
        null,
    };

    payload.mkb_layanan_prioritas_id = Number(
        eksternalTikForm.mkb_layanan_prioritas_id
      );

    const response = await fetch(
      editingEksternalTikId
        ? `http://localhost:5000/api/bcp/sumber-daya-eksternal-tik/${editingEksternalTikId}`
        : 'http://localhost:5000/api/bcp/sumber-daya-eksternal-tik',
      {
        method: editingEksternalTikId
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
          'Gagal menyimpan sumber daya eksternal TIK.'
      );
    }

    setMessage(
      result.message ||
        'Sumber daya eksternal TIK berhasil disimpan.'
    );

    resetEksternalTikForm();
    await fetchSumberDayaEksternalTik();
  } catch (err) {
    setForm8Error(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menyimpan sumber daya eksternal TIK.'
    );
  } finally {
    setSavingEksternalTik(false);
  }
};

const handleDeleteEksternalTik = async (
  item: SumberDayaEksternalTikItem
) => {
  if (
    !window.confirm(
      `Hapus sumber daya dari ${item.nama_vendor_mitra}?`
    )
  ) {
    return;
  }

  try {
    const token = sessionStorage.getItem('token');

    const response = await fetch(
      `http://localhost:5000/api/bcp/sumber-daya-eksternal-tik/${item.id}`,
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
          'Gagal menghapus sumber daya eksternal TIK.'
      );
    }

    setMessage(
      result.message ||
        'Sumber daya eksternal TIK berhasil dihapus.'
    );

    await fetchSumberDayaEksternalTik();
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Terjadi kesalahan saat menghapus sumber daya eksternal TIK.'
    );
  }
};

  const form8Rows = [
    ...sumberDayaManusia.map((item) => ({
      key: `sdm-${item.id}`, instansi: item.nama_instansi, kode: item.kode_prioritas,
      layanan: item.nama_layanan, kategori: '8.1 - Sumber Daya Manusia', ringkasan: item.kebutuhan_personel,
      fields: Object.entries({ 'Kebutuhan Personel': item.kebutuhan_personel, 'Jumlah Minimum': item.jumlah_minimum, 'Kompetensi': item.kompetensi, 'Sumber Penyedia': item.sumber_penyedia_sdm, 'Personel Pengganti': item.personel_pengganti, 'Keterangan': item.keterangan }),
      edit: () => handleEditSdm(item), hapus: () => handleDeleteSdm(item)
    })),
    ...fasilitasOperasional.map((item) => ({
      key: `fasilitas-${item.id}`, instansi: item.nama_instansi, kode: item.kode_prioritas,
      layanan: item.nama_layanan, kategori: '8.2 - Fasilitas Operasional', ringkasan: item.nama_fasilitas,
      fields: Object.entries({ 'Nama Fasilitas': item.nama_fasilitas, 'Jenis Fasilitas': item.jenis_fasilitas, 'Jumlah Minimum': item.jumlah_minimum, 'Lokasi': item.lokasi, 'Fungsi': item.fungsi, 'Alternatif': item.alternatif, 'Keterangan': item.keterangan }),
      edit: () => handleEditFasilitas(item), hapus: () => handleDeleteFasilitas(item)
    })),
    ...sumberDayaTik.map((item) => ({
      key: `tik-${item.id}`, instansi: item.nama_instansi, kode: item.kode_prioritas,
      layanan: item.nama_layanan, kategori: '8.3 - Sumber Daya TIK', ringkasan: item.nama_sumber_daya,
      fields: Object.entries({ 'Jenis Sumber Daya': item.jenis_sumber_daya, 'Nama Sumber Daya': item.nama_sumber_daya, 'Jumlah Minimum': item.jumlah_minimum, 'Spesifikasi': item.spesifikasi, 'Lokasi': item.lokasi, 'Sumber Cadangan': item.sumber_cadangan, 'Keterangan': item.keterangan }),
      edit: () => handleEditTik(item), hapus: () => handleDeleteTik(item)
    })),
    ...aksesSistemTik.map((item) => ({
      key: `akses-${item.id}`, instansi: item.nama_instansi, kode: item.kode_prioritas,
      layanan: item.nama_layanan, kategori: '8.4 - Akses Sistem TIK', ringkasan: item.nama_sistem,
      fields: Object.entries({ 'Nama Sistem': item.nama_sistem, 'Jenis Sistem': item.jenis_sistem, 'Jenis Akses': item.jenis_akses, 'Personel Berwenang': item.personel_berwenang, 'Mekanisme Akses': item.mekanisme_akses, 'Akses Darurat': item.akses_darurat, 'Keterangan': item.keterangan }),
      edit: () => handleEditAkses(item), hapus: () => handleDeleteAkses(item)
    })),
    ...sumberDayaEksternalTik.map((item) => ({
      key: `eksternal-${item.id}`, instansi: item.nama_instansi, kode: item.kode_prioritas,
      layanan: item.nama_layanan, kategori: '8.5 - Sumber Daya Eksternal TIK', ringkasan: item.nama_vendor_mitra,
      fields: Object.entries({ 'Vendor/Mitra': item.nama_vendor_mitra, 'Jenis Sumber Daya': item.jenis_sumber_daya, 'Deskripsi': item.deskripsi_sumber_daya, 'Kontak Dukungan': item.kontak_dukungan, 'Mekanisme Aktivasi': item.mekanisme_aktivasi, 'Alternatif Penyedia': item.alternatif_penyedia, 'Keterangan': item.keterangan }),
      edit: () => handleEditEksternalTik(item), hapus: () => handleDeleteEksternalTik(item)
    }))
  ];

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

          {canCreate && (
            <button
            type="button"
            onClick={handleTambah}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tambah Data
          </button>
          )}
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

        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[1200px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-semibold">
                  No
                </th>

                <th className="px-4 py-3 font-semibold">
                  Instansi
                </th>

                <th className="px-4 py-3 font-semibold">
                  ID Layanan
                  Prioritas
                </th>

                <th className="px-4 py-3 font-semibold">
                  Nama Layanan
                </th>

                <th className="px-4 py-3 font-semibold">
                  Jenis Layanan
                </th>

                <th className="px-4 py-3 font-semibold">
                  Kategori
                </th>

                <th className="px-4 py-3 font-semibold">
                  Pengguna Utama
                </th>

                <th className="px-4 py-3 font-semibold">
                  Jumlah Pengguna
                </th>

                <th className="px-4 py-3 font-semibold">
                  Ekosistem
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
                        {item.kode_prioritas || '-'}
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
                            className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                          >
                            Detail
                          </button>

                          {canUpdate && (
                            <button
                            type="button"
                            onClick={() =>
                              handleEdit(
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
                              handleDelete(
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

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 2–5 - Struktur Tim Manajemen Keberlangsungan
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Daftar anggota dari empat jenis tim Manajemen Keberlangsungan.
            </p>
          </div>

          {canCreate && (
            <button
              type="button"
              onClick={handleTambahStrukturTimMkb}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
            >
              Tambah Anggota Tim
            </button>
          )}
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                {[
                  'No',
                  'ID Layanan Prioritas',
                  'Nama Layanan',
                  'Jenis Tim',
                  'Nama Pegawai',
                  'Peran Tim',
                  'Aksi'
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`px-4 py-3 font-semibold ${
                      heading === 'Aksi' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {strukturTimMkb.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    Belum ada anggota tim Manajemen Keberlangsungan.
                  </td>
                </tr>
              ) : (
                strukturTimMkb.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.kode_layanan}
                    </td>
                    <td className="px-4 py-3">{item.nama_layanan}</td>
                    <td className="px-4 py-3">{item.jenis_tim}</td>
                    <td className="px-4 py-3">{item.nama_pegawai}</td>
                    <td className="px-4 py-3">{item.peran_tim}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedStrukturTimMkb(item)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Detail
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => handleEditStrukturTimMkb(item)}
                            className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteStrukturTimMkb(item)}
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

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 6 - Rencana Komunikasi
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Penetapan mekanisme komunikasi selama pelaksanaan Manajemen Keberlangsungan.
            </p>
          </div>

          {canCreate && (
            <button
            type="button"
            onClick={handleTambahKomunikasi}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tambah Komunikasi
          </button>
          )}
        </div>

        <div className="overflow-x-auto p-5">
         <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
            <thead>     
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                {[
                  'No',
                  'Instansi',
                  'ID Layanan Prioritas',
                  'Nama Layanan',
                  'Informasi',
                  'Kategori',
                  'Pengirim',
                  'Penerima',
                  'Media',
                  'Aksi'
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`px-4 py-3 font-semibold ${
                      heading === 'Aksi' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {rencanaKomunikasi.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Belum ada rencana komunikasi.
                  </td>
                </tr>
              ) : (
                rencanaKomunikasi.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-slate-600">
                      {index + 1}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {item.nama_instansi || '-'}
                    </td>

                    <td className="px-4 py-3 font-medium text-slate-800">
                      {item.kode_layanan || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-700">
                      {item.nama_layanan || '-'}
                    </td>

                    <td className="max-w-[260px] px-4 py-3 text-slate-600">
                      <p className="line-clamp-2">
                        {item.informasi_disampaikan || '-'}
                      </p>
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {item.kategori_komunikasi || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {item.pengirim || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {item.penerima || '-'}
                    </td>

                    <td className="px-4 py-3 text-slate-600">
                      {item.media_komunikasi || '-'}
                    </td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedKomunikasi(item)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Detail
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => handleEditKomunikasi(item)}
                            className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteKomunikasi(item)}
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

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">
              Formulir 7 - Daftar Kontak
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Daftar kontak pihak yang diperlukan dalam pelaksanaan Manajemen Keberlangsungan.
            </p>
          </div>

          {canCreate && (
            <button
            type="button"
            onClick={handleTambahKontak}
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
          >
            Tambah Kontak
          </button>
          )}
        </div>

        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[1250px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                {[
                  'No',
                  'Instansi',
                  'ID Layanan Prioritas',
                  'Nama Layanan',
                  'Nama Kontak',
                  'Jabatan',
                  'Organisasi',
                  'Telepon',
                  'Email',
                  'Aksi',
                ].map((heading) => (
                  <th
                    key={heading}
                    className={`px-4 py-3 font-semibold ${
                      heading === 'Aksi' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {daftarKontak.length === 0 ? (
                <tr>
                  <td
                    colSpan={10}
                    className="px-4 py-10 text-center text-slate-500"
                  >
                    Belum ada daftar kontak.
                  </td>
                </tr>
              ) : (
                daftarKontak.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">{item.nama_instansi || '-'}</td>
                    <td className="px-4 py-3 font-medium">
                      {item.kode_layanan || '-'}
                    </td>
                    <td className="px-4 py-3">{item.nama_layanan || '-'}</td>
                    <td className="px-4 py-3">{item.nama}</td>
                    <td className="px-4 py-3">{item.jabatan || '-'}</td>
                    <td className="px-4 py-3">{item.organisasi || '-'}</td>
                    <td className="px-4 py-3">{item.telepon || '-'}</td>
                    <td className="px-4 py-3">{item.email || '-'}</td>

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedKontak(item)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Detail
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => handleEditKontak(item)}
                            className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDeleteKontak(item)}
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

      <div className="mt-6 rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Formulir 8 - Kebutuhan Sumber Daya Manajemen Keberlangsungan</h2>
            <p className="mt-1 text-sm text-slate-500">Kebutuhan sumber daya kategori 8.1 sampai 8.5 dalam satu tabel.</p>
          </div>
          {canCreate && (
            <button type="button" onClick={handleTambahSdm} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700">Tambah Data</button>
          )}
        </div>
        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead><tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
              {['No', 'Instansi', 'ID Layanan Prioritas', 'Nama Layanan', 'Jenis Sumber Daya', 'Ringkasan Kebutuhan', 'Aksi'].map((judul) => (
                <th key={judul} className="px-4 py-3 font-semibold">{judul}</th>
              ))}
            </tr></thead>
            <tbody>
              {form8Rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-500">Belum ada kebutuhan sumber daya.</td></tr>
              ) : form8Rows.map((item, index) => (
                <tr key={item.key} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3">{index + 1}</td>
                  <td className="px-4 py-3">{item.instansi || '-'}</td>
                  <td className="px-4 py-3 font-medium">{item.kode || '-'}</td>
                  <td className="px-4 py-3">{item.layanan || '-'}</td>
                  <td className="px-4 py-3">{item.kategori}</td>
                  <td className="px-4 py-3">{item.ringkasan || '-'}</td>
                  <td className="px-4 py-3"><div className="flex gap-2 whitespace-nowrap">
                    <button type="button" onClick={() => setForm8Detail({ title: item.kategori, fields: [['Instansi', item.instansi], ['ID Layanan Prioritas', item.kode], ['Nama Layanan', item.layanan], ...item.fields] })} className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold">Detail</button>
                    {canUpdate && <button type="button" onClick={item.edit} className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700">Edit</button>}
                    {canDelete && <button type="button" onClick={item.hapus} className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600">Hapus</button>}
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {form8Detail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5"><h3 className="text-lg font-semibold">Detail {form8Detail.title}</h3></div>
            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              {form8Detail.fields.map(([label, value]) => <DetailField key={label} label={label} value={value} />)}
            </div>
            <div className="flex justify-end border-t p-5"><button type="button" onClick={() => setForm8Detail(null)} className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white">Tutup</button></div>
          </div>
        </div>
      )}

      {showStrukturTimMkbForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingStrukturTimMkbId
                  ? 'Edit Anggota Tim'
                  : 'Tambah Anggota Tim'}
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Formulir 2–5 - Struktur Tim Manajemen Keberlangsungan
              </p>
            </div>

            <form onSubmit={handleSubmitStrukturTimMkb}>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                {strukturTimMkbError && (
                  <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 md:col-span-2">
                    {strukturTimMkbError}
                  </div>
                )}

                <div>
                  <label className={labelClass}>ID Layanan Prioritas *</label>
                  <select
                    value={strukturTimMkbForm.mkb_layanan_prioritas_id}
                    onChange={(e) =>
                      setStrukturTimMkbForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id: e.target.value
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Pilih layanan prioritas</option>
                    {data
                      .filter((item) => item.mkb_layanan_prioritas_id)
                      .map((item) => (
                        <option
                          key={item.id}
                          value={item.mkb_layanan_prioritas_id!}
                        >
                          {item.kode_prioritas} - {item.nama_layanan}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>Jenis Tim *</label>
                  <select
                    value={strukturTimMkbForm.jenis_tim}
                    onChange={(e) =>
                      setStrukturTimMkbForm((prev) => ({
                        ...prev,
                        jenis_tim: e.target.value
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Pilih jenis tim</option>
                    {jenisTimMkbOptions.map((jenis) => (
                      <option key={jenis} value={jenis}>
                        {jenis}
                      </option>
                    ))}
                  </select>
                </div>

                {[
                  ['nama_pegawai', 'Nama Pegawai *'],
                  ['nip', 'NIP'],
                  ['jabatan', 'Jabatan *'],
                  ['unit_kerja', 'Unit Kerja *'],
                  ['peran_tim', 'Peran Tim *']
                ].map(([field, label]) => (
                  <div key={field}>
                    <label className={labelClass}>{label}</label>
                    <input
                      type="text"
                      value={
                        strukturTimMkbForm[
                          field as keyof StrukturTimMkbForm
                        ]
                      }
                      onChange={(e) =>
                        setStrukturTimMkbForm((prev) => ({
                          ...prev,
                          [field]: e.target.value
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                ))}

                <div className="md:col-span-2">
                  <label className={labelClass}>Tanggung Jawab *</label>
                  <textarea
                    rows={3}
                    value={strukturTimMkbForm.tanggung_jawab}
                    onChange={(e) =>
                      setStrukturTimMkbForm((prev) => ({
                        ...prev,
                        tanggung_jawab: e.target.value
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 p-5">
                <button
                  type="button"
                  onClick={() => {
                    setShowStrukturTimMkbForm(false);
                    setStrukturTimMkbError('');
                  }}
                  disabled={savingStrukturTimMkb}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingStrukturTimMkb}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                >
                  {savingStrukturTimMkb ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedStrukturTimMkb && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-xl rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Detail Anggota Tim
              </h3>
            </div>

            <div className="space-y-3 p-5 text-sm">
              {[
                ['ID Layanan', selectedStrukturTimMkb.kode_layanan],
                ['Nama Layanan', selectedStrukturTimMkb.nama_layanan],
                ['Instansi', selectedStrukturTimMkb.nama_instansi],
                ['Jenis Tim', selectedStrukturTimMkb.jenis_tim],
                ['Nama Pegawai', selectedStrukturTimMkb.nama_pegawai],
                ['NIP', selectedStrukturTimMkb.nip || '-'],
                ['Jabatan', selectedStrukturTimMkb.jabatan],
                ['Unit Kerja', selectedStrukturTimMkb.unit_kerja],
                ['Peran Tim', selectedStrukturTimMkb.peran_tim],
                ['Tanggung Jawab', selectedStrukturTimMkb.tanggung_jawab]
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-3 gap-3">
                  <span className="font-semibold text-slate-600">{label}</span>
                  <span className="col-span-2 whitespace-pre-wrap text-slate-800">
                    {value}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setSelectedStrukturTimMkb(null)}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

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

            {ruangLingkupFormError && (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {ruangLingkupFormError}
              </div>
            )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <label className={labelClass}>ID Layanan Prioritas *</label>
                  <input type="text" maxLength={60} value={formData.kode_layanan_mkb}
                    onChange={(e) => setFormData(prev => ({...prev, kode_layanan_mkb: e.target.value.toUpperCase()}))}
                    placeholder="Contoh: MKB-DUKCAPIL-001" className={inputClass} />
                </div>
                <div>
                  <label className={labelClass}>Jenis Layanan *</label>
                  <input type="text" maxLength={100} value={formData.jenis_layanan_mkb}
                    onChange={(e) => setFormData(prev => ({...prev, jenis_layanan_mkb: e.target.value}))}
                    placeholder="Contoh: Layanan Pemerintahan" className={inputClass} />
                </div>
                <div className="md:col-span-2">
                  <label
                    className={
                      labelClass
                    }
                  >
                    Layanan Prioritas
                  </label>

                  <input
                    type="text"
                    maxLength={200}
                    value={formData.nama_layanan_prioritas}
                    onChange={(event) =>
                      setFormData((prev) => ({
                        ...prev,
                        nama_layanan_prioritas: event.target.value,
                      }))
                    }
                    placeholder="Ketik nama layanan prioritas"
                    className={inputClass}
                  />
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
                    Target OLA (Operational Level Agreement)
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

      {showOperasionalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingOperasionalId
                    ? 'Edit Pelaksana Operasional'
                    : 'Tambah Pelaksana Operasional'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 5 Manajemen Keberlangsungan.
                </p>
              </div>

              <button
                type="button"
                onClick={resetOperasionalForm}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitOperasional}
              className="p-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>

                  <select
                    value={
                      operasionalForm.layanan_prioritas_id
                    }
                    disabled={editingOperasionalId !== null}
                    required={!editingOperasionalId}
                    onChange={(event) =>
                      setOperasionalForm((prev) => ({
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

                    {editingOperasionalId && (
                      <option
                        value={
                          operasionalForm.layanan_prioritas_id
                        }
                      >
                        {(() => {
                          const current =
                            timOperasional.find(
                              (item) =>
                                item.id === editingOperasionalId
                            );

                          if (!current) {
                            return operasionalForm
                              .layanan_prioritas_id;
                          }

                          return `${current.kode_prioritas} - ${current.nama_layanan}`;
                        })()}
                      </option>
                    )}

                    {!editingOperasionalId &&
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
                    value={operasionalForm.pegawai_id}
                    required
                    onChange={(event) =>
                      setOperasionalForm((prev) => ({
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

                {operasionalForm.pegawai_id && (
                  <div className="md:col-span-2 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    {(() => {
                      const pegawai =
                        pegawaiOptions.find(
                          (item) =>
                            String(item.id) ===
                            operasionalForm.pegawai_id
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
                    Peran Operasional
                  </label>

                  <input
                    type="text"
                    maxLength={150}
                    required
                    value={operasionalForm.peran_operasional}
                    onChange={(event) =>
                      setOperasionalForm((prev) => ({
                        ...prev,
                        peran_operasional:
                          event.target.value,
                      }))
                    }
                    placeholder="Contoh: Koordinator Operasional"
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
                    value={operasionalForm.urutan}
                    onChange={(event) =>
                      setOperasionalForm((prev) => ({
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
                    value={operasionalForm.tanggung_jawab}
                    onChange={(event) =>
                      setOperasionalForm((prev) => ({
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
                  onClick={resetOperasionalForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingOperasional}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingOperasional
                    ? 'Menyimpan...'
                    : editingOperasionalId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKomunikasi && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Detail Rencana Komunikasi
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formulir 6 Manajemen Keberlangsungan
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKomunikasi(null)}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-6 text-sm">
              {[
                ['Instansi', selectedKomunikasi.nama_instansi],
                ['ID Layanan Prioritas', selectedKomunikasi.kode_layanan],
                ['Nama Layanan', selectedKomunikasi.nama_layanan],
                ['Informasi yang Disampaikan', selectedKomunikasi.informasi_disampaikan],
                ['Kategori Komunikasi', selectedKomunikasi.kategori_komunikasi],
                ['Media Komunikasi', selectedKomunikasi.media_komunikasi],
                ['Pengirim', selectedKomunikasi.pengirim],
                ['Penerima', selectedKomunikasi.penerima],
                ['Waktu / Frekuensi', selectedKomunikasi.waktu_frekuensi],
                ['Aktivitas', selectedKomunikasi.aktivitas],
                ['Tujuan', selectedKomunikasi.tujuan]
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-1 border-b border-slate-100 pb-3 sm:grid-cols-3 sm:gap-4"
                >
                  <span className="font-semibold text-slate-600">
                    {label}
                  </span>
                  <span className="whitespace-pre-wrap break-words text-slate-800 sm:col-span-2">
                    {value || '-'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedKomunikasi(null)}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showKomunikasiForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingKomunikasiId
                    ? 'Edit Rencana Komunikasi'
                    : 'Tambah Rencana Komunikasi'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 6 Manajemen Keberlangsungan.
                </p>
              </div>

              <button
                type="button"
                onClick={resetKomunikasiForm}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitKomunikasi}
              className="p-6"
            >

            {komunikasiFormError && (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {komunikasiFormError}
              </div>
            )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>

                  <select
                    value={komunikasiForm.mkb_layanan_prioritas_id}
                    onChange={(event) => {
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id: event.target.value
                      }));
                      setKomunikasiFormError('');
                    }}
                    className={inputClass}
                  >
                    <option value="">Pilih layanan prioritas</option>
                    {data
                      .filter((item) => item.mkb_layanan_prioritas_id != null)
                      .map((item) => (
                        <option
                          key={item.mkb_layanan_prioritas_id}
                          value={String(item.mkb_layanan_prioritas_id)}
                        >
                          {item.kode_prioritas} - {item.nama_layanan}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Informasi yang Disampaikan
                  </label>

                  <textarea
                    rows={3}
                    required
                    value={
                      komunikasiForm.informasi_disampaikan
                    }
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        informasi_disampaikan:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Kategori Komunikasi
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      komunikasiForm.kategori_komunikasi
                    }
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        kategori_komunikasi:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Media Komunikasi
                  </label>

                  <input
                    type="text"
                    required
                    value={
                      komunikasiForm.media_komunikasi
                    }
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        media_komunikasi:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Pengirim
                  </label>

                  <input
                    type="text"
                    required
                    value={komunikasiForm.pengirim}
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        pengirim:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Penerima
                  </label>

                  <input
                    type="text"
                    required
                    value={komunikasiForm.penerima}
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        penerima:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Waktu / Frekuensi
                  </label>

                  <input
                    type="text"
                    value={
                      komunikasiForm.waktu_frekuensi
                    }
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        waktu_frekuensi:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Aktivitas
                  </label>

                  <textarea
                    rows={3}
                    value={komunikasiForm.aktivitas}
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        aktivitas:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Tujuan
                  </label>

                  <textarea
                    rows={3}
                    value={komunikasiForm.tujuan}
                    onChange={(event) =>
                      setKomunikasiForm((prev) => ({
                        ...prev,
                        tujuan:
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
                  onClick={resetKomunikasiForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingKomunikasi}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingKomunikasi
                    ? 'Menyimpan...'
                    : editingKomunikasiId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedKontak && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Detail Daftar Kontak
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formulir 7 Manajemen Keberlangsungan
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedKontak(null)}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 p-6 text-sm">
              {[
                ['Instansi', selectedKontak.nama_instansi],
                ['ID Layanan Prioritas', selectedKontak.kode_layanan],
                ['Nama Layanan', selectedKontak.nama_layanan],
                ['Nama Kontak', selectedKontak.nama],
                ['Jabatan', selectedKontak.jabatan],
                ['Organisasi', selectedKontak.organisasi],
                ['Alamat', selectedKontak.alamat],
                ['Telepon', selectedKontak.telepon],
                ['Email', selectedKontak.email],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="grid grid-cols-1 gap-1 border-b border-slate-100 pb-3 sm:grid-cols-3 sm:gap-4"
                >
                  <span className="font-semibold text-slate-600">
                    {label}
                  </span>
                  <span className="whitespace-pre-wrap break-words text-slate-800 sm:col-span-2">
                    {value || '-'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={() => setSelectedKontak(null)}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {showKontakForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingKontakId
                    ? 'Edit Daftar Kontak'
                    : 'Tambah Daftar Kontak'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Formulir 7 Manajemen Keberlangsungan.
                </p>
              </div>

              <button
                type="button"
                onClick={resetKontakForm}
                className="text-xl text-slate-400 hover:text-slate-600"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitKontak}
              className="p-6"
            >

            {kontakFormError && (
              <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {kontakFormError}
              </div>
            )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    ID Layanan Prioritas *
                  </label>

                  <select
                    value={kontakForm.mkb_layanan_prioritas_id}
                    onChange={(event) =>
                      setKontakForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id: event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Pilih layanan prioritas</option>
                    {data
                      .filter((item) => item.mkb_layanan_prioritas_id)
                      .map((item) => (
                        <option
                          key={item.mkb_layanan_prioritas_id}
                          value={String(item.mkb_layanan_prioritas_id)}
                        >
                          {item.kode_prioritas} - {item.nama_layanan}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Nama
                  </label>

                  <input
                    type="text"
                    value={kontakForm.nama}
                    onChange={(event) =>
                      setKontakForm((prev) => ({
                        ...prev,
                        nama: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jabatan
                  </label>

                  <input
                    type="text"
                    value={kontakForm.jabatan}
                    onChange={(event) =>
                      setKontakForm((prev) => ({
                        ...prev,
                        jabatan: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Organisasi
                  </label>

                  <input
                    type="text"
                    value={kontakForm.organisasi}
                    onChange={(event) =>
                      setKontakForm((prev) => ({
                        ...prev,
                        organisasi: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Alamat
                  </label>

                  <textarea
                    rows={3}
                    value={kontakForm.alamat}
                    onChange={(event) =>
                      setKontakForm((prev) => ({
                        ...prev,
                        alamat: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Telepon
                  </label>

                  <input
                    type="text"
                    value={kontakForm.telepon}
                    onChange={(event) =>
                      setKontakForm((prev) => ({
                        ...prev,
                        telepon: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Email
                  </label>

                  <input
                    type="email"
                    value={kontakForm.email}
                    onChange={(event) =>
                      setKontakForm((prev) => ({
                        ...prev,
                        email: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={resetKontakForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={savingKontak}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {savingKontak
                    ? 'Menyimpan...'
                    : editingKontakId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSdmForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingSdmId
                    ? 'Edit Sumber Daya Manusia'
                    : 'Tambah Sumber Daya Manusia'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formulir 8.1 Manajemen Keberlangsungan.
                </p>
              </div>

              <button
                type="button"
                onClick={resetSdmForm}
                className="text-xl text-slate-400"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitSdm}
              noValidate
              className="p-6"
            >
              {form8Error && (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form8Error}</div>
              )}
              <div className="mb-5">
                <label className={labelClass}>Jenis Sumber Daya *</label>
                <select
                  value="8.1"
                  disabled={editingSdmId !== null}
                  onChange={(event) => {
                    setShowSdmForm(false);
                    setShowFasilitasForm(false);
                    setShowTikForm(false);
                    setShowAksesForm(false);
                    setShowEksternalTikForm(false);
                      if (event.target.value === '8.1') handleTambahSdm();
                      if (event.target.value === '8.2') handleTambahFasilitas();
                      if (event.target.value === '8.3') handleTambahTik();
                      if (event.target.value === '8.4') handleTambahAkses();
                      if (event.target.value === '8.5') handleTambahEksternalTik();
                  }}
                  className={`${inputClass} disabled:bg-slate-100`}
                >
                    <option value="8.1">8.1 - Sumber Daya Manusia</option>
                    <option value="8.2">8.2 - Fasilitas Operasional</option>
                    <option value="8.3">8.3 - Sumber Daya TIK</option>
                    <option value="8.4">8.4 - Akses Sistem TIK</option>
                    <option value="8.5">8.5 - Sumber Daya Eksternal TIK</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>
                  <select
                    value={sdmForm.mkb_layanan_prioritas_id}
                    onChange={(event) =>
                      setSdmForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>
                    {data.filter((item) => item.mkb_layanan_prioritas_id != null).map((item) => (
                      <option
                        key={item.mkb_layanan_prioritas_id}
                        value={String(item.mkb_layanan_prioritas_id)}
                      >
                        {item.kode_prioritas} - {item.nama_layanan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Kebutuhan Personel
                  </label>
                  <input
                    type="text"
                    required
                    value={sdmForm.kebutuhan_personel}
                    onChange={(event) =>
                      setSdmForm((prev) => ({
                        ...prev,
                        kebutuhan_personel:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jumlah Minimum
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={sdmForm.jumlah_minimum}
                    onChange={(event) =>
                      setSdmForm((prev) => ({
                        ...prev,
                        jumlah_minimum:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Kompetensi
                  </label>
                  <textarea
                    rows={3}
                    value={sdmForm.kompetensi}
                    onChange={(event) =>
                      setSdmForm((prev) => ({
                        ...prev,
                        kompetensi: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Sumber Penyedia SDM
                  </label>
                  <input
                    type="text"
                    value={sdmForm.sumber_penyedia_sdm}
                    onChange={(event) =>
                      setSdmForm((prev) => ({
                        ...prev,
                        sumber_penyedia_sdm:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Personel Pengganti
                  </label>
                  <input
                    type="text"
                    value={sdmForm.personel_pengganti}
                    onChange={(event) =>
                      setSdmForm((prev) => ({
                        ...prev,
                        personel_pengganti:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Keterangan
                  </label>
                  <textarea
                    rows={3}
                    value={sdmForm.keterangan}
                    onChange={(event) =>
                      setSdmForm((prev) => ({
                        ...prev,
                        keterangan: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={resetSdmForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingSdm}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingSdm
                    ? 'Menyimpan...'
                    : editingSdmId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFasilitasForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingFasilitasId
                    ? 'Edit Fasilitas Operasional'
                    : 'Tambah Fasilitas Operasional'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formulir 8.2 Manajemen Keberlangsungan.
                </p>
              </div>
              <button
                type="button"
                onClick={resetFasilitasForm}
                className="text-xl text-slate-400"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitFasilitas}
              noValidate
              className="p-6"
            >
              {form8Error && (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form8Error}</div>
              )}
              <div className="mb-5">
                <label className={labelClass}>Jenis Sumber Daya *</label>
                <select
                  value="8.2"
                  disabled={editingFasilitasId !== null}
                  onChange={(event) => {
                    setShowSdmForm(false);
                    setShowFasilitasForm(false);
                    setShowTikForm(false);
                    setShowAksesForm(false);
                    setShowEksternalTikForm(false);
                      if (event.target.value === '8.1') handleTambahSdm();
                      if (event.target.value === '8.2') handleTambahFasilitas();
                      if (event.target.value === '8.3') handleTambahTik();
                      if (event.target.value === '8.4') handleTambahAkses();
                      if (event.target.value === '8.5') handleTambahEksternalTik();
                  }}
                  className={`${inputClass} disabled:bg-slate-100`}
                >
                    <option value="8.1">8.1 - Sumber Daya Manusia</option>
                    <option value="8.2">8.2 - Fasilitas Operasional</option>
                    <option value="8.3">8.3 - Sumber Daya TIK</option>
                    <option value="8.4">8.4 - Akses Sistem TIK</option>
                    <option value="8.5">8.5 - Sumber Daya Eksternal TIK</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>
                  <select
                    value={fasilitasForm.mkb_layanan_prioritas_id}
                    onChange={(event) =>
                      setFasilitasForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>
                    {data.filter((item) => item.mkb_layanan_prioritas_id != null).map((item) => (
                      <option
                        key={item.mkb_layanan_prioritas_id}
                        value={String(item.mkb_layanan_prioritas_id)}
                      >
                        {item.kode_prioritas} - {item.nama_layanan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Nama Fasilitas
                  </label>
                  <input
                    required
                    value={fasilitasForm.nama_fasilitas}
                    onChange={(event) =>
                      setFasilitasForm((prev) => ({
                        ...prev,
                        nama_fasilitas:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jenis Fasilitas
                  </label>
                  <input
                    value={fasilitasForm.jenis_fasilitas}
                    onChange={(event) =>
                      setFasilitasForm((prev) => ({
                        ...prev,
                        jenis_fasilitas:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jumlah Minimum
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={fasilitasForm.jumlah_minimum}
                    onChange={(event) =>
                      setFasilitasForm((prev) => ({
                        ...prev,
                        jumlah_minimum:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Lokasi
                  </label>
                  <input
                    value={fasilitasForm.lokasi}
                    onChange={(event) =>
                      setFasilitasForm((prev) => ({
                        ...prev,
                        lokasi: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                {[
                  ['fungsi', 'Fungsi'],
                  ['alternatif', 'Alternatif'],
                  ['keterangan', 'Keterangan'],
                ].map(([field, label]) => (
                  <div
                    key={field}
                    className="md:col-span-2"
                  >
                    <label className={labelClass}>
                      {label}
                    </label>
                    <textarea
                      rows={3}
                      value={
                        fasilitasForm[
                          field as keyof FasilitasOperasionalForm
                        ]
                      }
                      onChange={(event) =>
                        setFasilitasForm((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={resetFasilitasForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingFasilitas}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingFasilitas
                    ? 'Menyimpan...'
                    : editingFasilitasId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showTikForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingTikId
                    ? 'Edit Sumber Daya TIK'
                    : 'Tambah Sumber Daya TIK'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formulir 8.3 Manajemen Keberlangsungan.
                </p>
              </div>
              <button
                type="button"
                onClick={resetTikForm}
                className="text-xl text-slate-400"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitTik}
              noValidate
              className="p-6"
            >
              {form8Error && (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form8Error}</div>
              )}
              <div className="mb-5">
                <label className={labelClass}>Jenis Sumber Daya *</label>
                <select
                  value="8.3"
                  disabled={editingTikId !== null}
                  onChange={(event) => {
                    setShowSdmForm(false);
                    setShowFasilitasForm(false);
                    setShowTikForm(false);
                    setShowAksesForm(false);
                    setShowEksternalTikForm(false);
                      if (event.target.value === '8.1') handleTambahSdm();
                      if (event.target.value === '8.2') handleTambahFasilitas();
                      if (event.target.value === '8.3') handleTambahTik();
                      if (event.target.value === '8.4') handleTambahAkses();
                      if (event.target.value === '8.5') handleTambahEksternalTik();
                  }}
                  className={`${inputClass} disabled:bg-slate-100`}
                >
                    <option value="8.1">8.1 - Sumber Daya Manusia</option>
                    <option value="8.2">8.2 - Fasilitas Operasional</option>
                    <option value="8.3">8.3 - Sumber Daya TIK</option>
                    <option value="8.4">8.4 - Akses Sistem TIK</option>
                    <option value="8.5">8.5 - Sumber Daya Eksternal TIK</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>
                  <select
                    value={tikForm.mkb_layanan_prioritas_id}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>
                    {data.filter((item) => item.mkb_layanan_prioritas_id != null).map((item) => (
                      <option
                        key={item.mkb_layanan_prioritas_id}
                        value={String(item.mkb_layanan_prioritas_id)}
                      >
                        {item.kode_prioritas} - {item.nama_layanan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Jenis Sumber Daya
                  </label>
                  <select
                    required
                    value={tikForm.jenis_sumber_daya}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        jenis_sumber_daya:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Pilih jenis</option>
                    <option value="Perangkat Keras">
                      Perangkat Keras
                    </option>
                    <option value="Aplikasi">
                      Aplikasi
                    </option>
                    <option value="Jaringan">
                      Jaringan
                    </option>
                    <option value="Data">
                      Data
                    </option>
                    <option value="Server">
                      Server
                    </option>
                    <option value="Infrastruktur TIK">
                      Infrastruktur TIK
                    </option>
                    <option value="Lainnya">
                      Lainnya
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Nama Sumber Daya
                  </label>
                  <input
                    required
                    value={tikForm.nama_sumber_daya}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        nama_sumber_daya:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jumlah Minimum
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={tikForm.jumlah_minimum}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        jumlah_minimum:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Lokasi
                  </label>
                  <input
                    value={tikForm.lokasi}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        lokasi: event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Spesifikasi
                  </label>
                  <textarea
                    rows={3}
                    value={tikForm.spesifikasi}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        spesifikasi:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Sumber Cadangan
                  </label>
                  <textarea
                    rows={3}
                    value={tikForm.sumber_cadangan}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        sumber_cadangan:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Keterangan
                  </label>
                  <textarea
                    rows={3}
                    value={tikForm.keterangan}
                    onChange={(event) =>
                      setTikForm((prev) => ({
                        ...prev,
                        keterangan:
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
                  onClick={resetTikForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingTik}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingTik
                    ? 'Menyimpan...'
                    : editingTikId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAksesForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingAksesId
                    ? 'Edit Akses Sistem TIK'
                    : 'Tambah Akses Sistem TIK'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formulir 8.4 Manajemen Keberlangsungan.
                </p>
              </div>
              <button
                type="button"
                onClick={resetAksesForm}
                className="text-xl text-slate-400"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitAkses}
              noValidate
              className="p-6"
            >
              {form8Error && (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form8Error}</div>
              )}
              <div className="mb-5">
                <label className={labelClass}>Jenis Sumber Daya *</label>
                <select
                  value="8.4"
                  disabled={editingAksesId !== null}
                  onChange={(event) => {
                    setShowSdmForm(false);
                    setShowFasilitasForm(false);
                    setShowTikForm(false);
                    setShowAksesForm(false);
                    setShowEksternalTikForm(false);
                      if (event.target.value === '8.1') handleTambahSdm();
                      if (event.target.value === '8.2') handleTambahFasilitas();
                      if (event.target.value === '8.3') handleTambahTik();
                      if (event.target.value === '8.4') handleTambahAkses();
                      if (event.target.value === '8.5') handleTambahEksternalTik();
                  }}
                  className={`${inputClass} disabled:bg-slate-100`}
                >
                    <option value="8.1">8.1 - Sumber Daya Manusia</option>
                    <option value="8.2">8.2 - Fasilitas Operasional</option>
                    <option value="8.3">8.3 - Sumber Daya TIK</option>
                    <option value="8.4">8.4 - Akses Sistem TIK</option>
                    <option value="8.5">8.5 - Sumber Daya Eksternal TIK</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>
                  <select
                    value={aksesForm.mkb_layanan_prioritas_id}
                    onChange={(event) =>
                      setAksesForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>
                    {data.filter((item) => item.mkb_layanan_prioritas_id != null).map((item) => (
                      <option
                        key={item.mkb_layanan_prioritas_id}
                        value={String(item.mkb_layanan_prioritas_id)}
                      >
                        {item.kode_prioritas} - {item.nama_layanan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Nama Sistem
                  </label>
                  <input
                    required
                    value={aksesForm.nama_sistem}
                    onChange={(event) =>
                      setAksesForm((prev) => ({
                        ...prev,
                        nama_sistem:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jenis Sistem
                  </label>
                  <select
                    value={aksesForm.jenis_sistem}
                    onChange={(event) =>
                      setAksesForm((prev) => ({
                        ...prev,
                        jenis_sistem:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Pilih jenis</option>
                    <option value="Aplikasi">
                      Aplikasi
                    </option>
                    <option value="Basis Data">
                      Basis Data
                    </option>
                    <option value="Jaringan">
                      Jaringan
                    </option>
                    <option value="Server">
                      Server
                    </option>
                    <option value="Infrastruktur TIK">
                      Infrastruktur TIK
                    </option>
                    <option value="Lainnya">
                      Lainnya
                    </option>
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Jenis Akses
                  </label>
                  <input
                    required
                    value={aksesForm.jenis_akses}
                    onChange={(event) =>
                      setAksesForm((prev) => ({
                        ...prev,
                        jenis_akses:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Personel Berwenang
                  </label>
                  <input
                    value={aksesForm.personel_berwenang}
                    onChange={(event) =>
                      setAksesForm((prev) => ({
                        ...prev,
                        personel_berwenang:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                {[
                  ['mekanisme_akses', 'Mekanisme Akses'],
                  ['akses_darurat', 'Akses Darurat'],
                  ['keterangan', 'Keterangan'],
                ].map(([field, label]) => (
                  <div
                    key={field}
                    className="md:col-span-2"
                  >
                    <label className={labelClass}>
                      {label}
                    </label>
                    <textarea
                      rows={3}
                      value={
                        aksesForm[
                          field as keyof AksesSistemTikForm
                        ]
                      }
                      onChange={(event) =>
                        setAksesForm((prev) => ({
                          ...prev,
                          [field]: event.target.value,
                        }))
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={resetAksesForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingAkses}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingAkses
                    ? 'Menyimpan...'
                    : editingAksesId
                      ? 'Simpan Perubahan'
                      : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEksternalTikForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingEksternalTikId
                    ? 'Edit Sumber Daya Eksternal TIK'
                    : 'Tambah Sumber Daya Eksternal TIK'}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Formulir 8.5 Manajemen Keberlangsungan.
                </p>
              </div>
              <button
                type="button"
                onClick={resetEksternalTikForm}
                className="text-xl text-slate-400"
              >
                ×
              </button>
            </div>

            <form
              onSubmit={handleSubmitEksternalTik}
              noValidate
              className="p-6"
            >
              {form8Error && (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{form8Error}</div>
              )}
              <div className="mb-5">
                <label className={labelClass}>Jenis Sumber Daya *</label>
                <select
                  value="8.5"
                  disabled={editingEksternalTikId !== null}
                  onChange={(event) => {
                    setShowSdmForm(false);
                    setShowFasilitasForm(false);
                    setShowTikForm(false);
                    setShowAksesForm(false);
                    setShowEksternalTikForm(false);
                      if (event.target.value === '8.1') handleTambahSdm();
                      if (event.target.value === '8.2') handleTambahFasilitas();
                      if (event.target.value === '8.3') handleTambahTik();
                      if (event.target.value === '8.4') handleTambahAkses();
                      if (event.target.value === '8.5') handleTambahEksternalTik();
                  }}
                  className={`${inputClass} disabled:bg-slate-100`}
                >
                    <option value="8.1">8.1 - Sumber Daya Manusia</option>
                    <option value="8.2">8.2 - Fasilitas Operasional</option>
                    <option value="8.3">8.3 - Sumber Daya TIK</option>
                    <option value="8.4">8.4 - Akses Sistem TIK</option>
                    <option value="8.5">8.5 - Sumber Daya Eksternal TIK</option>
                </select>
              </div>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Layanan Prioritas
                  </label>
                  <select
                    value={
                      eksternalTikForm.mkb_layanan_prioritas_id
                    }
                    disabled={
                      editingEksternalTikId !== null
                    }
                    required={!editingEksternalTikId}
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        mkb_layanan_prioritas_id:
                          event.target.value,
                      }))
                    }
                    className={`${inputClass} disabled:bg-slate-100`}
                  >
                    <option value="">
                      Pilih layanan prioritas
                    </option>
                    {data.filter((item) => item.mkb_layanan_prioritas_id != null).map((item) => (
                      <option
                        key={item.mkb_layanan_prioritas_id}
                        value={String(item.mkb_layanan_prioritas_id)}
                      >
                        {item.kode_prioritas} - {item.nama_layanan}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className={labelClass}>
                    Nama Vendor / Mitra
                  </label>
                  <input
                    required
                    value={
                      eksternalTikForm.nama_vendor_mitra
                    }
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        nama_vendor_mitra:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Jenis Sumber Daya
                  </label>
                  <select
                    required
                    value={
                      eksternalTikForm.jenis_sumber_daya
                    }
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        jenis_sumber_daya:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  >
                    <option value="">Pilih jenis</option>
                    <option value="Layanan TIK">
                      Layanan TIK
                    </option>
                    <option value="Infrastruktur TIK">
                      Infrastruktur TIK
                    </option>
                    <option value="Dukungan Teknis">
                      Dukungan Teknis
                    </option>
                    <option value="Fasilitas TIK">
                      Fasilitas TIK
                    </option>
                    <option value="Lainnya">
                      Lainnya
                    </option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Deskripsi Sumber Daya
                  </label>
                  <textarea
                    rows={3}
                    value={
                      eksternalTikForm.deskripsi_sumber_daya
                    }
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        deskripsi_sumber_daya:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Kontak Dukungan
                  </label>
                  <input
                    value={
                      eksternalTikForm.kontak_dukungan
                    }
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        kontak_dukungan:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>
                    Alternatif Penyedia
                  </label>
                  <input
                    value={
                      eksternalTikForm.alternatif_penyedia
                    }
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        alternatif_penyedia:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Mekanisme Aktivasi
                  </label>
                  <textarea
                    rows={3}
                    value={
                      eksternalTikForm.mekanisme_aktivasi
                    }
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        mekanisme_aktivasi:
                          event.target.value,
                      }))
                    }
                    className={inputClass}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className={labelClass}>
                    Keterangan
                  </label>
                  <textarea
                    rows={3}
                    value={eksternalTikForm.keterangan}
                    onChange={(event) =>
                      setEksternalTikForm((prev) => ({
                        ...prev,
                        keterangan:
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
                  onClick={resetEksternalTikForm}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingEksternalTik}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {savingEksternalTik
                    ? 'Menyimpan...'
                    : editingEksternalTikId
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
      <div className="text-xs font-medium tracking-wide text-slate-500">
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