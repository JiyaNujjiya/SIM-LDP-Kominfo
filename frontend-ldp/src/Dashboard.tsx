
import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import API from "./api";

const C = {
  white: "#FFFFFF",
  bg: "#F9FAFB",
  border: "#D1D5DB",
  title: "#1B2A4A",
  body: "#4B5563",
  muted: "#9CA3AF",
  blue: "#2563EB",
  green: "#059669",
  amber: "#D97706",
  red: "#DC2626",
};

type RisikoTerbaru = {
  id: number;
  kode_risiko: string;
  peristiwa_risiko: string;
  besaran_risiko: string | number | null;
  status_risiko: string | null;
  nama_layanan: string | null;
  created_at: string;
};

type DashboardData = {
  risiko: {
    total: number;
    tinggi: number;
    terbaru: RisikoTerbaru[];
  };
  perubahan: {
    total: number;
    aktif: number;
    selesai: number;
    persentase_selesai: number;
  };
  pengetahuan: {
    total: number;
    terdokumentasi: number;
    persentase_terdokumentasi: number;
  };
  keberlangsungan: {
    bcp_total: number;
    bcp_aktif: number;
    uji_total: number;
  };
  relasi_pengguna: {
    permintaan: number;
    kueri: number;
    insiden: number;
    masalah: number;
    insiden_aktif: number;
    total: number;
  };
};

type NotificationItem = {
  id: number;
  module_code: string;
  notification_type: string;
  title: string;
  message: string;
  action_url: string | null;
  is_read: number | boolean;
  created_at: string;
};

type AdminAccount = {
  id: number;
  nama: string;
  email: string;
  role: string;
  nama_role: string | null;
};

type AdminDashboardData = {
  akun: {
    total: number;
    admin: number;
    pengelola: number;
    pimpinan: number;
    auditor: number;
    terbaru: AdminAccount[];
  };
};

type PengelolaDashboardData = {
  notifikasi: {
    unread: number;
  };
};

type KpiItem = {
  label: string;
  value: number | string;
  description: string;
};

const normalizeRole = (user: any) => {
  const role = String(
    user?.role || user?.role_name || user?.nama_role || ""
  ).trim().toLowerCase();

  if (["admin", "administrator"].includes(role)) return "admin";
  if (role.includes("pengelola")) return "pengelola";
  if (role.includes("pimpinan")) return "pimpinan";
  if (role.includes("auditor")) return "auditor";

  if (Number(user?.role_id) === 1) return "admin";
  if (Number(user?.role_id) === 2) return "pengelola";
  if (Number(user?.role_id) === 3) return "pimpinan";
  if (Number(user?.role_id) === 4) return "auditor";

  return role;
};

const formatDate = (value: string) => {
  if (!value) return "-";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

function KpiCard({ label, value, description }: KpiItem) {
  return (
    <div
      style={{
        flex: "1 1 185px",
        minWidth: 0,
        padding: 20,
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: C.body,
          minHeight: 32,
        }}
      >
        {label}
      </div>

      <div
        style={{
          marginTop: 12,
          fontSize: 28,
          fontWeight: 700,
          color: C.title,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          lineHeight: "17px",
          color: C.muted,
        }}
      >
        {description}
      </div>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
        minWidth: 0,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: C.title,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 4,
          fontSize: 12,
          color: C.muted,
        }}
      >
        {subtitle}
      </div>

      <div style={{ marginTop: 18 }}>{children}</div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  onClick,
}: {
  label: string;
  value: number | string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <span
        style={{
          fontSize: 12,
          color: C.body,
          fontWeight: 500,
        }}
      >
        {label}
      </span>

      <strong
        style={{
          fontSize: 13,
          color: C.title,
        }}
      >
        {value}
      </strong>
    </>
  );

  const style = {
    width: "100%",
    padding: "13px 14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    background: C.bg,
    border: `1px solid ${C.border}`,
    borderRadius: 8,
    boxSizing: "border-box" as const,
    textAlign: "left" as const,
  };

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        style={{
          ...style,
          cursor: "pointer",
        }}
      >
        {content}
      </button>
    );
  }

  return <div style={style}>{content}</div>;
}

function ModuleSummary({ data }: { data: DashboardData }) {
  return (
    <Panel
      title="Ringkasan Seluruh Modul"
      subtitle="Kondisi lima modul Manajemen Layanan Digital"
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        <InfoRow
          label="Manajemen Risiko"
          value={`${data.risiko.total} risiko`}
        />

        <InfoRow
          label="Manajemen Perubahan"
          value={`${data.perubahan.total} perubahan`}
        />

        <InfoRow
          label="Manajemen Pengetahuan"
          value={`${data.pengetahuan.total} pengetahuan`}
        />

        <InfoRow
          label="Manajemen Keberlangsungan"
          value={`${data.keberlangsungan.uji_total} pengujian`}
        />

        <InfoRow
          label="Manajemen Relasi Pengguna"
          value={`${data.relasi_pengguna.total} aktivitas`}
        />
      </div>
    </Panel>
  );
}

export default function SimLdpDashboard() {
  const navigate = useNavigate();

  let user: any = null;

  try {
    user = JSON.parse(sessionStorage.getItem("user") || "null");
  } catch {
    user = null;
  }

  const role = normalizeRole(user);

  const [data, setData] = useState<DashboardData | null>(null);
  const [adminData, setAdminData] =
    useState<AdminDashboardData | null>(null);
  const [pengelolaData, setPengelolaData] =
    useState<PengelolaDashboardData | null>(null);
  const [notifications, setNotifications] =
    useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const approvalNotifications = useMemo(
    () =>
      notifications.filter(
        (item) =>
          item.module_code === "PERUBAHAN" &&
          item.notification_type === "APPROVAL" &&
          !Boolean(item.is_read)
      ),
    [notifications]
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const requests: Promise<any>[] = [
        API.get("/dashboard/summary"),
        API.get("/notifications?limit=100"),
      ];

      if (role === "admin") {
        requests.push(API.get("/dashboard/admin"));
      }

      if (role === "pengelola") {
        requests.push(API.get("/dashboard/pengelola"));
      }

      const results = await Promise.all(requests);

      setData(results[0].data);

      setNotifications(
        Array.isArray(results[1].data?.data)
          ? results[1].data.data
          : []
      );

      if (role === "admin") {
        setAdminData(results[2].data);
      }

      if (role === "pengelola") {
        setPengelolaData(results[2].data);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          "Gagal mengambil data dashboard."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div
        style={{
          padding: 60,
          textAlign: "center",
          color: C.body,
        }}
      >
        Memuat dashboard...
      </div>
    );
  }

  if (
    error ||
    !data ||
    (role === "admin" && !adminData) ||
    (role === "pengelola" && !pengelolaData)
  ) {
    return (
      <div
        style={{
          padding: 24,
          background: "#FEE2E2",
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: C.red,
          }}
        >
          Dashboard gagal dimuat
        </div>

        <p style={{ color: C.body, fontSize: 13 }}>
          {error || "Data tidak tersedia."}
        </p>

        <button type="button" onClick={loadDashboard}>
          Coba Lagi
        </button>
      </div>
    );
  }

  const title =
    role === "admin"
      ? "Dashboard Administrator"
      : role === "pengelola"
      ? "Dashboard Pengelola LDP"
      : role === "pimpinan"
      ? "Dashboard Pimpinan"
      : role === "auditor"
      ? "Dashboard Auditor"
      : "Dashboard SIM-LDP";

  const subtitle =
    role === "admin"
      ? "Ringkasan sistem dan pengelolaan pengguna SIM-LDP"
      : role === "pengelola"
      ? "Ringkasan pengelolaan layanan digital instansi"
      : role === "pimpinan"
      ? "Pemantauan kondisi layanan dan pengambilan keputusan"
      : role === "auditor"
      ? "Ringkasan pengawasan dan evaluasi layanan digital"
      : "Ringkasan manajemen layanan digital";

  const kpis: KpiItem[] = [
    {
      label: "Manajemen Risiko",
      value: data.risiko.total,
      description: `${data.risiko.tinggi} risiko tinggi`,
    },
    {
      label: "Manajemen Perubahan",
      value: data.perubahan.total,
      description: `${data.perubahan.aktif} perubahan aktif`,
    },
    {
      label: "Manajemen Pengetahuan",
      value: data.pengetahuan.total,
      description: `${data.pengetahuan.terdokumentasi} terdokumentasi`,
    },
    {
      label: "Manajemen Keberlangsungan",
      value: data.keberlangsungan.uji_total,
      description: "Pengujian keberlangsungan tercatat",
    },
    {
      label: "Manajemen Relasi Pengguna",
      value: data.relasi_pengguna.total,
      description: `${data.relasi_pengguna.insiden_aktif} insiden aktif`,
    },
  ];

  const twoColumns: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
    gap: 18,
    alignItems: "start",
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 22,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 22,
              fontWeight: 700,
              color: C.title,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              margin: "5px 0 0",
              fontSize: 13,
              color: C.body,
            }}
          >
            {subtitle}
          </p>
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            height: 36,
            padding: "0 14px",
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            color: C.title,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <RefreshCw size={15} />
          Perbarui Data
        </button>
      </div>

      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {kpis.map((item) => (
          <KpiCard key={item.label} {...item} />
        ))}
      </div>

      {role === "admin" && adminData && (
        <div style={twoColumns}>
          <Panel
            title="Administrasi Sistem"
            subtitle="Pengelolaan akun dan akses pengguna"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <InfoRow
                label="Total Akun"
                value={adminData.akun.total}
                onClick={() => navigate("/admin/accounts")}
              />

              <InfoRow
                label="Administrator"
                value={adminData.akun.admin}
              />

              <InfoRow
                label="Pengelola LDP"
                value={adminData.akun.pengelola}
              />

              <InfoRow
                label="Pimpinan"
                value={adminData.akun.pimpinan}
              />

              <InfoRow
                label="Auditor"
                value={adminData.akun.auditor}
              />
            </div>

            <div
              style={{
                marginTop: 20,
                fontWeight: 700,
                fontSize: 12,
                color: C.title,
              }}
            >
              Akun Terbaru
            </div>

            <div
              style={{
                marginTop: 10,
                display: "flex",
                flexDirection: "column",
                gap: 8,
              }}
            >
              {adminData.akun.terbaru.length === 0 ? (
                <div style={{ fontSize: 12, color: C.muted }}>
                  Belum ada akun.
                </div>
              ) : (
                adminData.akun.terbaru.map((account) => (
                  <div
                    key={account.id}
                    style={{
                      border: `1px solid ${C.border}`,
                      borderRadius: 7,
                      padding: 11,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: C.title,
                      }}
                    >
                      {account.nama}
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 11,
                        color: C.muted,
                      }}
                    >
                      {account.nama_role || account.role} — {account.email}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Panel>

          <ModuleSummary data={data} />
        </div>
      )}

      {role === "pengelola" && (
        <div style={twoColumns}>
          <Panel
            title="Pekerjaan Saya"
            subtitle="Aktivitas yang perlu dipantau dan ditindaklanjuti"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <InfoRow
                label="Perubahan Aktif"
                value={data.perubahan.aktif}
                onClick={() => navigate("/perubahan/perencanaan")}
              />

              <InfoRow
                label="Keputusan Perubahan"
                value={
                  notifications.filter(
                    (item) =>
                      item.module_code === "PERUBAHAN" &&
                      item.notification_type === "STATUS"
                  ).length
                }
                onClick={() => navigate("/perubahan/analisis")}
              />

              <InfoRow
                label="Pengetahuan Belum Terdokumentasi"
                value={Math.max(
                  0,
                  data.pengetahuan.total -
                    data.pengetahuan.terdokumentasi
                )}
              />

              <InfoRow
                label="Insiden Aktif"
                value={data.relasi_pengguna.insiden_aktif}
              />

              <InfoRow
                label="Notifikasi Baru"
                value={pengelolaData?.notifikasi.unread ?? 0}
              />
            </div>
          </Panel>

          <ModuleSummary data={data} />
        </div>
      )}

      {role === "pimpinan" && (
        <div style={twoColumns}>
          <Panel
            title="Menunggu Persetujuan Perubahan"
            subtitle="Keputusan Manajemen Perubahan yang memerlukan perhatian pimpinan"
          >
            {approvalNotifications.length === 0 ? (
              <div
                style={{
                  padding: 22,
                  textAlign: "center",
                  borderRadius: 8,
                  background: C.bg,
                  color: C.muted,
                  fontSize: 12,
                }}
              >
                Tidak ada persetujuan perubahan yang menunggu.
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                {approvalNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        item.action_url || "/perubahan/analisis"
                      )
                    }
                    style={{
                      padding: 14,
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 12,
                        color: C.title,
                      }}
                    >
                      {item.title}
                    </div>

                    <div
                      style={{
                        marginTop: 5,
                        fontSize: 11,
                        color: C.body,
                      }}
                    >
                      {item.message}
                    </div>

                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 10,
                        color: C.muted,
                      }}
                    >
                      {formatDate(item.created_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Panel>

          <Panel
            title="Pemantauan Kinerja Layanan"
            subtitle="Indikator utama layanan digital instansi"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <InfoRow
                label="Risiko Tinggi"
                value={data.risiko.tinggi}
              />

              <InfoRow
                label="Perubahan Aktif"
                value={data.perubahan.aktif}
              />

              <InfoRow
                label="Dokumentasi Pengetahuan"
                value={`${data.pengetahuan.persentase_terdokumentasi}%`}
              />

              <InfoRow
                label="Pengujian Keberlangsungan"
                value={data.keberlangsungan.uji_total}
              />

              <InfoRow
                label="Insiden Aktif"
                value={data.relasi_pengguna.insiden_aktif}
              />
            </div>
          </Panel>
        </div>
      )}

      {role === "auditor" && (
        <div style={twoColumns}>
          <Panel
            title="Ringkasan Pengawasan"
            subtitle="Indikator pemantauan kelima modul"
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <InfoRow
                label="Risiko Tinggi"
                value={data.risiko.tinggi}
              />

              <InfoRow
                label="Penyelesaian Perubahan"
                value={`${data.perubahan.persentase_selesai}%`}
              />

              <InfoRow
                label="Cakupan Dokumentasi"
                value={`${data.pengetahuan.persentase_terdokumentasi}%`}
              />

              <InfoRow
                label="Pengujian Keberlangsungan"
                value={data.keberlangsungan.uji_total}
              />

              <InfoRow
                label="Insiden Aktif"
                value={data.relasi_pengguna.insiden_aktif}
              />
            </div>
          </Panel>

          <ModuleSummary data={data} />
        </div>
      )}

      {!["admin", "pengelola", "pimpinan", "auditor"].includes(role) && (
        <ModuleSummary data={data} />
      )}
    </div>
  );
}