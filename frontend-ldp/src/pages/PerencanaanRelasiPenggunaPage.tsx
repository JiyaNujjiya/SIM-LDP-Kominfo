
import { FormEvent, useEffect, useState } from 'react';
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

type TabType = 'mrp1a' | 'mrp1b';

type FieldType = 'text' | 'number' | 'date' | 'textarea' | 'select';

type FieldConfig = {
  key: string;
  label: string;
  type?: FieldType;
  required?: boolean;
  options?: { value: string; label: string }[];
  placeholder?: string;
  maxLength?: number;
  min?: number;
  max?: number;
  step?: number;
  full?: boolean;
  disabledOnEdit?: boolean;
};

type TableColumn = {
  label: string;
  key?: string;
  render?: (item: DataRow) => React.ReactNode;
};

type DetailItem = {
  title: string;
  fields: { label: string; value: string }[];
};

type UserOption = {
  id: number;
  nama: string;
  email?: string;
  role?: string;
};

const processSteps = [
  {
    number: 1,
    label: 'Perencanaan Layanan',
    route: '/relasi-pengguna/perencanaan',
  },
  {
    number: 2,
    label: 'Pengajuan Layanan',
    route: '/relasi-pengguna/pengajuan',
  },
  {
    number: 3,
    label: 'Penanganan Kueri',
    route: '/relasi-pengguna/penanganan',
  },
  {
    number: 4,
    label: 'Evaluasi',
    route: '/relasi-pengguna/evaluasi',
  },
];

const modalTitles: Record<ModalType, string> = {
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

const endpointMap: Record<ModalType, string> = {
  katalog: '/katalog-layanan',
  standar: '/standar-layanan',
  sla: '/sla-layanan',
  ola: '/ola-layanan',
  indikator: '/indikator-tambahan-standar',
  target: '/target-kueri-insiden',
  'layanan-terkait': '/katalog-layanan-terkait',
  rencana: '/rencana-komunikasi',
  media: '/media-komunikasi',
};

const statusKatalog = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Tidak Aktif', label: 'Tidak Aktif' },
];

const statusStandar = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Berakhir', label: 'Berakhir' },
];

const statusRencana = [
  { value: 'Draft', label: 'Draft' },
  { value: 'Aktif', label: 'Aktif' },
  { value: 'Selesai', label: 'Selesai' },
  { value: 'Dibatalkan', label: 'Dibatalkan' },
];

const prioritasOptions = [
  { value: 'Rendah', label: 'Rendah' },
  { value: 'Sedang', label: 'Sedang' },
  { value: 'Tinggi', label: 'Tinggi' },
];

const valueText = (value: any): string => {
  if (value === null || value === undefined || value === '') return '-';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
};

const dateValue = (value: any) => {
  if (!value) return '';
  const text = String(value);
  return text.slice(0, 10);
};

const displayDate = (value: any) => dateValue(value) || '-';

const minuteText = (value: any) =>
  value === null || value === undefined || value === ''
    ? '-'
    : `${value} menit`;

const percentText = (value: any) =>
  value === null || value === undefined || value === ''
    ? '-'
    : `${value}%`;

const layananLabel = (item: DataRow) => {
  const kode = item.kode_layanan || '';
  const nama = item.nama_layanan || '';
  return [kode, nama].filter(Boolean).join(' - ') || '-';
};

const tableColumns: Record<ModalType, TableColumn[]> = {
  katalog: [
    { label: 'Layanan', render: layananLabel },
    { label: 'Kategori', key: 'kategori_layanan' },
    { label: 'Tipe', key: 'tipe_layanan' },
    { label: 'Cakupan Pengguna', key: 'target_cakupan_pengguna' },
    { label: 'Service Owner', key: 'service_owner' },
    { label: 'Status', key: 'status' },
  ],
  standar: [
    { label: 'Layanan', render: layananLabel },
    { label: 'Versi', key: 'versi' },
    { label: 'Berlaku Mulai', render: (item) => displayDate(item.berlaku_mulai) },
    { label: 'Berlaku Sampai', render: (item) => displayDate(item.berlaku_sampai) },
    { label: 'Status', key: 'status' },
  ],
  sla: [
    { label: 'Layanan', render: layananLabel },
    { label: 'Versi', key: 'versi_standar' },
    { label: 'Jam Layanan', key: 'jam_layanan' },
    { label: 'Service Desk', key: 'jam_service_desk' },
    {
      label: 'Respon',
      render: (item) => minuteText(item.target_waktu_respon_menit),
    },
    {
      label: 'Penyelesaian',
      render: (item) => minuteText(item.target_waktu_penyelesaian_menit),
    },
    {
      label: 'Ketersediaan',
      render: (item) => percentText(item.target_ketersediaan_persen),
    },
  ],
  ola: [
    { label: 'Layanan', render: layananLabel },
    {
      label: 'Kecepatan',
      render: (item) =>
        item.target_kecepatan == null
          ? '-'
          : `${item.target_kecepatan} ${item.satuan_kecepatan || ''}`,
    },
    {
      label: 'Kapasitas',
      render: (item) =>
        item.target_kapasitas == null
          ? '-'
          : `${item.target_kapasitas} ${item.satuan_kapasitas || ''}`,
    },
    {
      label: 'Ketersediaan',
      render: (item) => percentText(item.target_ketersediaan_persen),
    },
    {
      label: 'RTO',
      render: (item) => minuteText(item.target_rto_menit),
    },
    {
      label: 'RPO',
      render: (item) => minuteText(item.target_rpo_menit),
    },
    {
      label: 'Respon',
      render: (item) => minuteText(item.target_waktu_respon_menit),
    },
    {
      label: 'Penyelesaian',
      render: (item) => minuteText(item.target_waktu_penyelesaian_menit),
    },
  ],
  indikator: [
    { label: 'Layanan', render: layananLabel },
    { label: 'Objek', key: 'objek' },
    { label: 'Jenis Standar', key: 'jenis_standar' },
    { label: 'Prioritas', key: 'prioritas' },
    { label: 'Indikator', key: 'nama_indikator' },
    {
      label: 'Target',
      render: (item) =>
        `${valueText(item.target_nilai)} ${item.satuan || ''}`,
    },
    { label: 'Arah Target', key: 'arah_target' },
  ],
  target: [
    { label: 'Layanan', render: layananLabel },
    { label: 'Jenis', key: 'jenis' },
    { label: 'Prioritas', key: 'prioritas' },
    {
      label: 'Respon SLA',
      render: (item) => minuteText(item.sla_waktu_respon_menit),
    },
    {
      label: 'Penyelesaian SLA',
      render: (item) => minuteText(item.sla_waktu_penyelesaian_menit),
    },
    {
      label: 'Respon OLA',
      render: (item) => minuteText(item.ola_waktu_respon_menit),
    },
    {
      label: 'Penyelesaian OLA',
      render: (item) => minuteText(item.ola_waktu_penyelesaian_menit),
    },
  ],
  'layanan-terkait': [
    { label: 'Katalog Layanan', render: layananLabel },
    {
      label: 'Layanan Terkait',
      render: (item) =>
        item.nama_layanan_terkait ||
        item.layanan_terkait ||
        item.nama_terkait ||
        valueText(item.layanan_terkait_id),
    },
    { label: 'Keterangan', key: 'keterangan' },
  ],
  rencana: [
    { label: 'Layanan', render: layananLabel },
    { label: 'Informasi', key: 'informasi' },
    { label: 'Manajemen Terkait', key: 'manajemen_terkait' },
    { label: 'Pembuat Informasi', key: 'pembuat_informasi' },
    { label: 'Target Audiens', key: 'target_audiens' },
    { label: 'Periode', key: 'periode_komunikasi' },
    { label: 'Status', key: 'status' },
  ],
  media: [
    { label: 'Layanan', render: layananLabel },
    { label: 'Informasi', key: 'informasi' },
    { label: 'Bentuk Media', key: 'bentuk_media' },
    { label: 'Kanal Komunikasi', key: 'kanal_komunikasi' },
    { label: 'Keterangan', key: 'keterangan' },
  ],
};

const formatFieldLabel = (key: string) =>
  key
    .replace(/_id$/i, ' ID')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

const numberFields = new Set([
  'versi',
  'target_kecepatan',
  'target_kapasitas',
  'target_ketersediaan_persen',
  'target_rto_menit',
  'target_rpo_menit',
  'target_waktu_respon_menit',
  'target_waktu_penyelesaian_menit',
  'target_nilai',
  'sla_waktu_respon_menit',
  'sla_waktu_penyelesaian_menit',
  'ola_waktu_respon_menit',
  'ola_waktu_penyelesaian_menit',
]);

const getDefaults = (type: ModalType): Record<string, string> => {
  switch (type) {
    case 'katalog':
    case 'rencana':
      return { status: 'Draft' };
    case 'standar':
      return { versi: '1', status: 'Draft' };
    case 'indikator':
      return {
        objek: 'Layanan',
        jenis_standar: 'SLA',
        prioritas: 'Tidak Berlaku',
        arah_target: 'Minimal',
      };
    case 'target':
      return { jenis: 'Kueri', prioritas: 'Rendah' };
    default:
      return {};
  }
};

const getSubmitConfig = (
  type: ModalType,
  editingId: number | null,
  form: Record<string, string>
) => {
  const textOrNull = (key: string) =>
    !form[key]?.trim() ? null : form[key].trim();

  const numberOrNull = (key: string) =>
    form[key] === undefined || form[key] === ''
      ? null
      : Number(form[key]);

  let payload: Record<string, any> = {};

  if (type === 'katalog') {
    payload = {
      nama_layanan: form.nama_layanan.trim(),
      kategori_layanan: textOrNull('kategori_layanan'),
      tipe_layanan: textOrNull('tipe_layanan'),
      target_cakupan_pengguna: textOrNull('target_cakupan_pengguna'),
      service_owner_id: numberOrNull('service_owner_id'),
      kanal_layanan: textOrNull('kanal_layanan'),
      tautan_layanan: textOrNull('tautan_layanan'),
      ruang_lingkup_layanan: textOrNull('ruang_lingkup_layanan'),
      stakeholder_terkait: textOrNull('stakeholder_terkait'),
      status: form.status || 'Draft',
    };
  }

  if (type === 'standar') {
    payload = {
      berlaku_mulai: form.berlaku_mulai,
      berlaku_sampai: form.berlaku_sampai || null,
      status: form.status || 'Draft',
      catatan: textOrNull('catatan'),
    };

    if (editingId === null) {
      payload.katalog_layanan_id = Number(form.katalog_layanan_id);
      payload.versi = Number(form.versi || 1);
    }
  }

  if (type === 'sla') {
    payload = {
      jam_layanan: textOrNull('jam_layanan'),
      jam_service_desk: textOrNull('jam_service_desk'),
      target_waktu_respon_menit: numberOrNull('target_waktu_respon_menit'),
      target_waktu_penyelesaian_menit: numberOrNull(
        'target_waktu_penyelesaian_menit'
      ),
      target_ketersediaan_persen: numberOrNull(
        'target_ketersediaan_persen'
      ),
    };
  }

  if (type === 'ola') {
    payload = {
      target_kecepatan: numberOrNull('target_kecepatan'),
      satuan_kecepatan: textOrNull('satuan_kecepatan'),
      target_kapasitas: numberOrNull('target_kapasitas'),
      satuan_kapasitas: textOrNull('satuan_kapasitas'),
      target_ketersediaan_persen: numberOrNull(
        'target_ketersediaan_persen'
      ),
      target_rto_menit: numberOrNull('target_rto_menit'),
      target_rpo_menit: numberOrNull('target_rpo_menit'),
      target_waktu_respon_menit: numberOrNull('target_waktu_respon_menit'),
      target_waktu_penyelesaian_menit: numberOrNull(
        'target_waktu_penyelesaian_menit'
      ),
    };
  }

  if (type === 'indikator') {
    payload = {
      objek: form.objek || 'Layanan',
      jenis_standar: form.objek === 'Insiden'
        ? 'OLA'
        : form.jenis_standar || 'SLA',
      prioritas: form.objek === 'Layanan'
        ? 'Tidak Berlaku'
        : form.prioritas || 'Rendah',
      nama_indikator: form.nama_indikator.trim(),
      target_nilai: Number(form.target_nilai),
      satuan: form.satuan.trim(),
      arah_target: form.arah_target || 'Minimal',
    };
  }

  if (type === 'target') {
    payload = {
      jenis: form.jenis || 'Kueri',
      prioritas: form.prioritas || 'Rendah',
      sla_jam_layanan: textOrNull('sla_jam_layanan'),
      sla_jam_service_desk: textOrNull('sla_jam_service_desk'),
      sla_waktu_respon_menit: numberOrNull('sla_waktu_respon_menit'),
      sla_waktu_penyelesaian_menit: numberOrNull(
        'sla_waktu_penyelesaian_menit'
      ),
      ola_waktu_respon_menit: numberOrNull('ola_waktu_respon_menit'),
      ola_waktu_penyelesaian_menit: numberOrNull(
        'ola_waktu_penyelesaian_menit'
      ),
    };
  }

  if (type === 'layanan-terkait') {
    payload = {
      layanan_terkait_id: Number(form.layanan_terkait_id),
      keterangan: textOrNull('keterangan'),
    };

    if (editingId === null) {
      payload.katalog_layanan_id = Number(form.katalog_layanan_id);
    }
  }

  if (type === 'rencana') {
    payload = {
      katalog_layanan_id: Number(form.katalog_layanan_id),
      informasi: form.informasi.trim(),
      manajemen_terkait: textOrNull('manajemen_terkait'),
      pembuat_informasi_id: numberOrNull('pembuat_informasi_id'),
      target_audiens: form.target_audiens.trim(),
      periode_komunikasi: form.periode_komunikasi.trim(),
      status: form.status || 'Draft',
    };
  }

  if (type === 'media') {
    payload = {
      bentuk_media: form.bentuk_media.trim(),
      kanal_komunikasi: form.kanal_komunikasi.trim(),
      keterangan: textOrNull('keterangan'),
    };

    if (editingId === null) {
      payload.rencana_komunikasi_id = Number(form.rencana_komunikasi_id);
    }
  }

  
    if (editingId === null) {
      if (['sla', 'ola', 'target'].includes(type)) {
        payload.katalog_layanan_id = Number(form.katalog_layanan_id);
      }

      if (type === 'indikator') {
        payload.standar_layanan_id = Number(form.standar_layanan_id);
      }
    }


  return {
    endpoint: editingId === null
      ? endpointMap[type]
      : `${endpointMap[type]}/${editingId}`,
    payload,
  };
};

const getFields = (
  type: ModalType,
  katalog: DataRow[],
  standar: DataRow[],
  rencana: DataRow[],
  layananOptions: DataRow[],
  userOptions: UserOption[],
  form: Record<string, string>
): FieldConfig[] => {
  const katalogField: FieldConfig = {
    key: 'katalog_layanan_id',
    label: 'Katalog Layanan',
    type: 'select',
    required: true,
    disabledOnEdit: true,
    options: katalog.map((item) => ({
      value: String(item.id),
      label: layananLabel(item),
    })),
  };

  const standarField: FieldConfig = {
    key: 'standar_layanan_id',
    label: 'Standar Layanan',
    type: 'select',
    required: true,
    disabledOnEdit: true,
    options: standar.map((item) => ({
      value: String(item.id),
      label: `${layananLabel(item)} - Versi ${item.versi}`,
    })),
  };

  const statusField = (
    options: { value: string; label: string }[]
  ): FieldConfig => ({
    key: 'status',
    label: 'Status',
    type: 'select',
    required: true,
    options,
  });

  switch (type) {
    case 'katalog':
      return [
        {
          key: 'nama_layanan',
          label: 'Nama Layanan',
          required: true,
          maxLength: 200,
          placeholder: 'Contoh: Layanan Pengaduan Masyarakat Online',
        },
        {
          key: 'kategori_layanan',
          label: 'Kategori Layanan',
          maxLength: 100,
        },
        {
          key: 'tipe_layanan',
          label: 'Tipe Layanan',
          maxLength: 100,
        },
        {
          key: 'target_cakupan_pengguna',
          label: 'Target / Cakupan Pengguna',
        },
        {
          key: 'service_owner_id',
          label: 'Service Owner',
          type: 'select',
          options: userOptions.map((item) => ({
            value: String(item.id),
            label: item.nama,
          })),
        },
        {
          key: 'kanal_layanan',
          label: 'Kanal Layanan',
          maxLength: 150,
        },
        {
          key: 'tautan_layanan',
          label: 'Tautan Layanan',
          maxLength: 255,
        },
        statusField(statusKatalog),
        {
          key: 'ruang_lingkup_layanan',
          label: 'Ruang Lingkup Layanan',
          type: 'textarea',
          full: true,
        },
        {
          key: 'stakeholder_terkait',
          label: 'Stakeholder Terkait',
          type: 'textarea',
          full: true,
        },
      ];

    case 'standar':
      return [
        katalogField,
        {
          key: 'versi',
          label: 'Versi',
          type: 'number',
          required: true,
          min: 1,
          step: 1,
          disabledOnEdit: true,
        },
        {
          key: 'berlaku_mulai',
          label: 'Berlaku Mulai',
          type: 'date',
          required: true,
        },
        {
          key: 'berlaku_sampai',
          label: 'Berlaku Sampai',
          type: 'date',
        },
        statusField(statusStandar),
        {
          key: 'catatan',
          label: 'Catatan',
          type: 'textarea',
          full: true,
        },
      ];

    case 'sla':
      return [
        katalogField,
        {
          key: 'jam_layanan',
          label: 'Jam Layanan',
          placeholder: 'Contoh: Senin-Jumat 08.00-16.00',
        },
        {
          key: 'jam_service_desk',
          label: 'Jam Service Desk',
          placeholder: 'Contoh: 24x7',
        },
        {
          key: 'target_waktu_respon_menit',
          label: 'Target Waktu Respon (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'target_waktu_penyelesaian_menit',
          label: 'Target Waktu Penyelesaian (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'target_ketersediaan_persen',
          label: 'Target Ketersediaan (%)',
          type: 'number',
          min: 0,
          max: 100,
          step: 0.01,
        },
      ];

    case 'ola':
      return [
        katalogField,
        {
          key: 'target_kecepatan',
          label: 'Target Kecepatan',
          type: 'number',
          min: 0,
          step: 0.01,
        },
        {
          key: 'satuan_kecepatan',
          label: 'Satuan Kecepatan',
          placeholder: 'Contoh: Mbps',
        },
        {
          key: 'target_kapasitas',
          label: 'Target Kapasitas',
          type: 'number',
          min: 0,
          step: 0.01,
        },
        {
          key: 'satuan_kapasitas',
          label: 'Satuan Kapasitas',
          placeholder: 'Contoh: Pengguna bersamaan',
        },
        {
          key: 'target_ketersediaan_persen',
          label: 'Target Ketersediaan (%)',
          type: 'number',
          min: 0,
          max: 100,
          step: 0.01,
        },
        {
          key: 'target_rto_menit',
          label: 'Target RTO (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'target_rpo_menit',
          label: 'Target RPO (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'target_waktu_respon_menit',
          label: 'Target Waktu Respon (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'target_waktu_penyelesaian_menit',
          label: 'Target Waktu Penyelesaian (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
      ];

    case 'indikator':
      return [
        standarField,
        {
          key: 'objek',
          label: 'Objek',
          type: 'select',
          required: true,
          options: [
            { value: 'Layanan', label: 'Layanan' },
            { value: 'Kueri', label: 'Kueri' },
            { value: 'Insiden', label: 'Insiden' },
          ],
        },
        {
          key: 'jenis_standar',
          label: 'Jenis Standar',
          type: 'select',
          required: true,
          options: form.objek === 'Insiden'
            ? [{ value: 'OLA', label: 'OLA' }]
            : [
                { value: 'SLA', label: 'SLA' },
                { value: 'OLA', label: 'OLA' },
              ],
        },
        {
          key: 'prioritas',
          label: 'Prioritas',
          type: 'select',
          required: true,
          options: form.objek === 'Layanan'
            ? [
                {
                  value: 'Tidak Berlaku',
                  label: 'Tidak Berlaku',
                },
              ]
            : prioritasOptions,
        },
        {
          key: 'nama_indikator',
          label: 'Nama Indikator',
          required: true,
          maxLength: 150,
        },
        {
          key: 'target_nilai',
          label: 'Target Nilai',
          type: 'number',
          required: true,
          min: 0,
          step: 0.01,
        },
        {
          key: 'satuan',
          label: 'Satuan',
          required: true,
          maxLength: 50,
        },
        {
          key: 'arah_target',
          label: 'Arah Target',
          type: 'select',
          required: true,
          options: [
            { value: 'Minimal', label: 'Minimal' },
            { value: 'Maksimal', label: 'Maksimal' },
            { value: 'Tepat', label: 'Tepat' },
          ],
        },
      ];

    case 'target':
      return [
        katalogField,
        {
          key: 'jenis',
          label: 'Jenis',
          type: 'select',
          required: true,
          options: [
            { value: 'Kueri', label: 'Kueri' },
            { value: 'Insiden', label: 'Insiden' },
          ],
        },
        {
          key: 'prioritas',
          label: 'Prioritas',
          type: 'select',
          required: true,
          options: prioritasOptions,
        },
        {
          key: 'sla_jam_layanan',
          label: 'Jam Layanan SLA',
        },
        {
          key: 'sla_jam_service_desk',
          label: 'Jam Service Desk SLA',
        },
        {
          key: 'sla_waktu_respon_menit',
          label: 'Waktu Respon SLA (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'sla_waktu_penyelesaian_menit',
          label: 'Waktu Penyelesaian SLA (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'ola_waktu_respon_menit',
          label: 'Waktu Respon OLA (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
        {
          key: 'ola_waktu_penyelesaian_menit',
          label: 'Waktu Penyelesaian OLA (menit)',
          type: 'number',
          min: 0,
          step: 1,
        },
      ];

    case 'layanan-terkait':
      return [
        katalogField,
        {
          key: 'layanan_terkait_id',
          label: 'Layanan Terkait',
          type: 'select',
          required: true,
          options: layananOptions.map((item) => ({
            value: String(item.id),
            label: layananLabel(item),
          })),
        },
        {
          key: 'keterangan',
          label: 'Keterangan',
          type: 'textarea',
          full: true,
        },
      ];

    case 'rencana':
      return [
        {
          ...katalogField,
          disabledOnEdit: false,
        },
        {
          key: 'pembuat_informasi_id',
          label: 'Pembuat Informasi',
          type: 'select',
          options: userOptions.map((item) => ({
            value: String(item.id),
            label: item.nama,
          })),
        },
        {
          key: 'informasi',
          label: 'Informasi',
          type: 'textarea',
          required: true,
          full: true,
        },
        {
          key: 'manajemen_terkait',
          label: 'Manajemen Terkait',
          maxLength: 100,
        },
        {
          key: 'target_audiens',
          label: 'Target Audiens',
          required: true,
        },
        {
          key: 'periode_komunikasi',
          label: 'Periode Komunikasi',
          required: true,
          maxLength: 100,
          placeholder: 'Contoh: Setiap bulan',
        },
        statusField(statusRencana),
      ];

    case 'media':
      return [
        {
          key: 'rencana_komunikasi_id',
          label: 'Rencana Komunikasi',
          type: 'select',
          required: true,
          disabledOnEdit: true,
          options: rencana.map((item) => ({
            value: String(item.id),
            label: `${layananLabel(item)} - ${item.informasi || ''}`,
          })),
        },
        {
          key: 'bentuk_media',
          label: 'Bentuk Media',
          required: true,
          maxLength: 100,
          placeholder: 'Contoh: Infografis',
        },
        {
          key: 'kanal_komunikasi',
          label: 'Kanal Komunikasi',
          required: true,
          maxLength: 100,
          placeholder: 'Contoh: Website Resmi',
        },
        {
          key: 'keterangan',
          label: 'Keterangan',
          type: 'textarea',
          full: true,
        },
      ];
  }
};


const validateForm = (
  type: ModalType,
  fields: FieldConfig[],
  form: Record<string, string>
): string[] => {
  for (const field of fields) {
    const value = String(form[field.key] ?? '').trim();

    if (field.required && !value) {
      const action = field.type === 'select' ? 'dipilih' : 'diisi';
      return [`${field.label} wajib ${action}.`];
    }

    if (field.maxLength && value.length > field.maxLength) {
      return [`${field.label} maksimal ${field.maxLength} karakter.`];
    }

    if (field.type === 'number' && value !== '') {
      const number = Number(value);

      if (!Number.isFinite(number)) {
        return [`${field.label} harus berupa angka.`];
      }

      if (field.min !== undefined && number < field.min) {
        return [`${field.label} minimal ${field.min}.`];
      }

      if (field.max !== undefined && number > field.max) {
        return [`${field.label} maksimal ${field.max}.`];
      }

      if (
        (field.key.endsWith('_menit') || field.key === 'versi') &&
        !Number.isInteger(number)
      ) {
        return [`${field.label} harus berupa bilangan bulat.`];
      }
    }
  }

  if (
    type === 'standar' &&
    form.berlaku_mulai &&
    form.berlaku_sampai &&
    form.berlaku_sampai < form.berlaku_mulai
  ) {
    return ['Berlaku Sampai tidak boleh sebelum Berlaku Mulai.'];
  }

  return [];
};

const PerencanaanRelasiPenggunaPage = () => {
  const navigate = useNavigate();

  const [activeFormTab, setActiveFormTab] = useState<TabType>('mrp1a');

  const [layananOptions, setLayananOptions] = useState<DataRow[]>([]);
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

  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});

  const [detailItem, setDetailItem] = useState<DetailItem | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [formErrors, setFormErrors] = useState<string[]>([]);

  const [searches, setSearches] = useState<Partial<Record<ModalType, string>>>({});

  const inputClass =
    'mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 disabled:bg-slate-100 disabled:text-slate-500';

  let permissions: string[] = [];

  try {
    const saved = sessionStorage.getItem('user');
    const user = saved ? JSON.parse(saved) : null;
    permissions = Array.isArray(user?.permissions) ? user.permissions : [];
  } catch {
    permissions = [];
  }

  const canCreate = permissions.includes('user_relation.create');
  const canUpdate = permissions.includes('user_relation.update');
  const canDelete = permissions.includes('user_relation.delete');

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
      throw new Error(
        result.message || 'Terjadi kesalahan saat memproses data.'
      );
    }

    return result;
  };

  const rows = (result: any): DataRow[] => {
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
        terkaitResult,
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
      setUserOptions(rows(userResult) as UserOption[]);
      setKatalog(rows(katalogResult));
      setStandar(rows(standarResult));
      setSla(rows(slaResult));
      setOla(rows(olaResult));
      setIndikator(rows(indikatorResult));
      setTarget(rows(targetResult));
      setLayananTerkait(rows(terkaitResult));
      setRencana(rows(rencanaResult));
      setMedia(rows(mediaResult));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Gagal mengambil data perencanaan layanan.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const dataMap: Record<ModalType, DataRow[]> = {
    katalog,
    standar,
    sla,
    ola,
    indikator,
    target,
    'layanan-terkait': layananTerkait,
    rencana,
    media,
  };

  const fields = modalType
    ? getFields(
        modalType,
        katalog,
        standar,
        rencana,
        layananOptions,
        userOptions,
        form
      )
    : [];

  const openCreate = (type: ModalType) => {
    setEditingId(null);
    setModalType(type);
    setForm(getDefaults(type));
    setFormErrors([]);
    setMessage('');
    setError('');
  };

  const openEdit = (type: ModalType, item: DataRow) => {
    const values: Record<string, string> = {};

    const currentFields = getFields(
      type,
      katalog,
      standar,
      rencana,
      layananOptions,
      userOptions,
      {}
    );

    for (const field of currentFields) {
      if (field.type === 'date') {
        values[field.key] = dateValue(item[field.key]);
      } else {
        values[field.key] =
          item[field.key] === null || item[field.key] === undefined
            ? ''
            : String(item[field.key]);
      }
    }

    setForm({ ...getDefaults(type), ...values });
    setEditingId(Number(item.id));
    setModalType(type);
    setFormErrors([]);
    setMessage('');
    setError('');
  };

  const closeModal = () => {
    setModalType(null);
    setEditingId(null);
    setForm({});
    setFormErrors([]);
  };

  const setField = (key: string, value: string) => {
    setForm((current) => {
      if (key === 'objek') {
        return {
          ...current,
          objek: value,
          jenis_standar:
            value === 'Insiden'
              ? 'OLA'
              : current.jenis_standar || 'SLA',
          prioritas: value === 'Layanan' ? 'Tidak Berlaku' : 'Rendah',
        };
      }

      if (key === 'katalog_layanan_id' && modalType === 'rencana') {
        return {
          ...current,
          katalog_layanan_id: value,
          pembuat_informasi_id: '',
        };
      }

      return { ...current, [key]: value };
    });

    setFormErrors([]);
  };

  const openDetail = (type: ModalType, item: DataRow) => {
    const currentFields = getFields(
      type,
      katalog,
      standar,
      rencana,
      layananOptions,
      userOptions,
      {}
    );

    const knownLabels = new Map(
      currentFields.map((field) => [field.key, field.label])
    );

    const excluded = new Set([
      'id',
      'created_by',
      'updated_by',
      'created_at',
      'updated_at',
    ]);

    const detailFields = Object.entries(item)
      .filter(([key]) => !excluded.has(key))
      .map(([key, value]) => {
        let formattedValue = valueText(value);

        if (
          (key === 'berlaku_mulai' || key === 'berlaku_sampai') &&
          value
        ) {
          formattedValue = displayDate(value);
        }

        return {
          label: knownLabels.get(key) || formatFieldLabel(key),
          value: formattedValue,
        };
      });

    setDetailItem({
      title: modalTitles[type],
      fields: detailFields,
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!modalType || saving) return;

    const errors = validateForm(modalType, fields, form);

    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSaving(true);
      setMessage('');
      setError('');
      setFormErrors([]);

      const config = getSubmitConfig(modalType, editingId, form);

      const result = await request(`${API}${config.endpoint}`, {
        method: editingId !== null ? 'PUT' : 'POST',
        body: JSON.stringify(config.payload),
      });

      closeModal();
      await fetchAll();
      setMessage(result.message || 'Data berhasil disimpan.');
    } catch (err) {
      setFormErrors([
        err instanceof Error ? err.message : 'Gagal menyimpan data.',
      ]);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (type: ModalType, item: DataRow) => {
    if (!window.confirm(`Hapus data ${modalTitles[type]} ini?`)) return;

    try {
      setMessage('');
      setError('');

      const result = await request(
        `${API}${endpointMap[type]}/${item.id}`,
        { method: 'DELETE' }
      );

      await fetchAll();
      setMessage(result.message || 'Data berhasil dihapus.');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Gagal menghapus data.'
      );
    }
  };

  const renderTable = (
    type: ModalType,
    title: string,
    subtitle: string,
    buttonLabel: string,
    options: {
      searchable?: boolean;
      disabled?: boolean;
      data?: DataRow[];
    } = {}
  ) => {
    const data = options.data || dataMap[type];
    const keyword = (searches[type] || '').trim().toLowerCase();

    const displayedData = keyword
      ? data.filter((item) =>
          Object.values(item).some((value) =>
            valueText(value).toLowerCase().includes(keyword)
          )
        )
      : data;

    const columns = tableColumns[type];

    return (
      <div className="border-b border-slate-200">
        <div className="flex flex-col gap-4 border-b border-slate-200 p-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
          </div>

          {canCreate && (
            <button
              type="button"
              disabled={options.disabled}
              onClick={() => openCreate(type)}
              className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {buttonLabel}
            </button>
          )}
        </div>

        {options.searchable && (
          <div className="border-b border-slate-200 p-5">
            <input
              type="text"
              value={searches[type] || ''}
              onChange={(event) =>
                setSearches((current) => ({
                  ...current,
                  [type]: event.target.value,
                }))
              }
              placeholder={`Cari ${title.toLowerCase()}...`}
              className="w-full max-w-md rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500"
            />
          </div>
        )}

        <div className="overflow-x-auto p-5">
          <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 text-left font-semibold">No</th>

                {columns.map((column, index) => (
                  <th
                    key={`${column.label}-${index}`}
                    className="px-4 py-3 text-left font-semibold"
                  >
                    {column.label}
                  </th>
                ))}

                <th className="px-4 py-3 text-center font-semibold">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Memuat data...
                  </td>
                </tr>
              ) : displayedData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + 2}
                    className="px-4 py-10 text-center text-sm text-slate-500"
                  >
                    Belum ada data {title.toLowerCase()}.
                  </td>
                </tr>
              ) : (
                displayedData.map((item, index) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {index + 1}
                    </td>

                    {columns.map((column, columnIndex) => (
                      <td
                        key={`${column.label}-${columnIndex}`}
                        className="max-w-[260px] px-4 py-3 align-middle text-sm text-slate-700"
                      >
                        <div className="line-clamp-2 break-words">
                          {column.render
                            ? column.render(item)
                            : valueText(item[column.key || ''])}
                        </div>
                      </td>
                    ))}

                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => openDetail(type, item)}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                        >
                          Detail
                        </button>

                        {canUpdate && (
                          <button
                            type="button"
                            onClick={() => openEdit(type, item)}
                            className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
                          >
                            Edit
                          </button>
                        )}

                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => handleDelete(type, item)}
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
    );
  };

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
          {processSteps.map((step, index) => (
            <div key={step.number} className="flex flex-1 items-start">
              <button
                type="button"
                onClick={() => navigate(step.route)}
                className="flex min-w-[120px] flex-col items-center text-center"
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold ${
                    step.number === 1
                      ? 'border-slate-800 bg-slate-800 text-white'
                      : 'border-slate-300 bg-white text-slate-500'
                  }`}
                >
                  {step.number}
                </div>

                <span
                  className={`mt-2 text-xs ${
                    step.number === 1
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
          ))}
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
                Dokumentasi katalog layanan serta target SLA dan OLA.
              </p>
            </div>

            {renderTable(
              'katalog',
              'Katalog Layanan',
              'Informasi dasar dan cakupan setiap layanan.',
              'Tambah Katalog',
              { searchable: true }
            )}

            {renderTable(
              'sla',
              'Service Level Agreement (SLA)',
              'Target layanan yang disepakati terhadap pengguna.',
              'Tambah SLA'
            )}

            {renderTable(
              'ola',
              'Operational Level Agreement (OLA)',
              'Target operasional internal untuk mendukung SLA.',
              'Tambah OLA',
              { disabled: standar.length === 0 }
            )}

            <div className="border-y border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-800">
                Bagian 2 - SLA, OLA Kueri & Insiden
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Target penanganan kueri dan insiden berdasarkan prioritas.
              </p>
            </div>

            {renderTable(
              'target',
              'Target SLA & OLA Kueri / Insiden',
              'Target waktu penanganan berdasarkan jenis dan prioritas.',
              'Tambah Target',
              {
                searchable: true,
                disabled: standar.length === 0,
              }
            )}
          </div>
        )}

        {activeFormTab === 'mrp1b' && (
          <div>
            <div className="border-b border-slate-200 bg-slate-50 p-5">
              <h3 className="font-semibold text-slate-800">
                Formulir MRP1b - Komunikasi Pengguna
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Perencanaan informasi, audiens, media, kanal, dan jadwal komunikasi.
              </p>
            </div>

            {renderTable(
              'rencana',
              'Rencana Komunikasi',
              'Rencana penyampaian informasi layanan kepada pengguna.',
              'Tambah Rencana',
              { searchable: true, disabled: katalog.length === 0 }
            )}

            {renderTable(
              'media',
              'Media Komunikasi',
              'Bentuk media dan kanal pada setiap rencana komunikasi.',
              'Tambah Media',
              { disabled: rencana.length === 0 }
            )}
          </div>
        )}
      </div>

      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="border-b border-slate-200 p-5">
              <h3 className="text-lg font-semibold text-slate-800">
                Detail {detailItem.title}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
              {detailItem.fields.map((field, index) => (
                <div key={`${field.label}-${index}`}>
                  <p className="text-xs font-semibold text-slate-500">
                    {field.label}
                  </p>
                  <p className="mt-1 break-words whitespace-pre-wrap text-sm text-slate-800">
                    {field.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end border-t border-slate-200 p-5">
              <button
                type="button"
                onClick={() => setDetailItem(null)}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId !== null ? 'Edit' : 'Tambah'} {modalTitles[modalType]}
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Manajemen Relasi Pengguna - Perencanaan Layanan
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="text-xl text-slate-400 hover:text-slate-600"
                aria-label="Tutup formulir"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate className="p-6"> 
              {formErrors.length > 0 && (
                <div className="mb-5 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {formErrors[0]}
                </div>
              )}

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                {fields.map((field) => {
                  const disabled =
                    field.disabledOnEdit === true && editingId !== null;

                  const value =
                    field.key === 'prioritas' &&
                    modalType === 'indikator' &&
                    form.objek === 'Layanan'
                      ? 'Tidak Berlaku'
                      : field.key === 'jenis_standar' &&
                        modalType === 'indikator' &&
                        form.objek === 'Insiden'
                        ? 'OLA'
                        : form[field.key] || '';

                  return (
                    <div
                      key={field.key}
                      className={field.full ? 'md:col-span-2' : ''}
                    >
                      <label
                        htmlFor={`mrp-${field.key}`}
                        className="text-sm font-medium text-slate-700"
                      >
                        {field.label}
                        {field.required && (
                          <span className="ml-1">*</span>
                        )}
                      </label>

                      {field.type === 'select' ? (
                        <select
                          id={`mrp-${field.key}`}
                          value={value}
                          disabled={
                            disabled ||
                            (modalType === 'indikator' &&
                              field.key === 'prioritas' &&
                              form.objek === 'Layanan')
                          }
                          onChange={(event) =>
                            setField(field.key, event.target.value)
                          }
                          className={inputClass}
                        >
                          <option value="">
                            Pilih {field.label.toLowerCase()}
                          </option>

                          {(field.options || []).map((option) => (
                            <option
                              key={option.value}
                              value={option.value}
                            >
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : field.type === 'textarea' ? (
                        <textarea
                          id={`mrp-${field.key}`}
                          rows={3}
                          value={value}
                          onChange={(event) =>
                            setField(field.key, event.target.value)
                          }
                          className={inputClass}
                        />
                      ) : (
                        <input
                          id={`mrp-${field.key}`}
                          type={field.type || 'text'}
                          value={value}
                          disabled={disabled}
                          placeholder={field.placeholder}
                          maxLength={field.maxLength}
                          min={field.min}
                          max={field.max}
                          step={field.step}
                          onChange={(event) =>
                            setField(field.key, event.target.value)
                          }
                          className={inputClass}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end gap-3 border-t border-slate-200 pt-5">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving
                    ? 'Menyimpan...'
                    : editingId !== null
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

export default PerencanaanRelasiPenggunaPage;
