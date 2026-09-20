import { useEffect, useState, useMemo} from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  BellRing,
  BookOpen,
  ClipboardCheck,
  Database,
  Eye,
  FileClock,
  RefreshCw,
  Repeat2,
  ShieldAlert,
  UserCog,
  Users,
} from "lucide-react";
import API from "./api";

const C = {
  bg: "#F9FAFB",
  white: "#FFFFFF",
  border: "#D1D5DB",
  title: "#1B2A4A",
  subtitle: "#4B5B84",
  body: "#4B5563",
  muted: "#9CA3AF",
  green: "#10B981",
  red: "#EF4444",
  amber: "#F59E0B",
  blue: "#2563EB",
  purple: "#7C3AED",
  blueLight: "#E8F0FE",
  greenLight: "#D1FAE5",
  redLight: "#FEE2E2",
  amberLight: "#FEF3C7",
  purpleLight: "#EDE9FE",
};

type RisikoTerbaru = {
  id: number;
  kode_risiko: string;
  peristiwa_risiko: string;
  besaran_risiko: string | number | null;
  status_risiko: string | null;
  created_at: string;
  nama_layanan: string | null;
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
  entity_type: string | null;
  entity_id: number | null;
  notification_type: "APPROVAL" | "REMINDER" | "STATUS" | "INFO";
  priority: "NORMAL" | "HIGH" | "URGENT";
  title: string;
  message: string;
  action_url: string | null;
  is_read: number | boolean;
  due_at: string | null;
  created_at: string;
};

type KpiCardProps = {
  label: string;
  value: string | number;
  description: string;
  iconBg: string;
  iconColor: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
};

type PimpinanDashboardData = {
  approval: {
    total: number;
    risiko: RisikoTerbaru[];
  };
  risiko: {
    diajukan: number;
    tinggi: number;
    terbaru: RisikoTerbaru[];
  };
  perubahan: {
    total: number;
    aktif: number;
  };
};

type PengelolaDashboardData = {
  risiko: {
    total: number;
    draft: number;
    perlu_perbaikan: number;
    terbaru: RisikoTerbaru[];
  };
  pengetahuan: {
    total: number;
    terdokumentasi: number;
  };
  notifikasi: {
    unread: number;
  };
};

type AdminAccount = {
  id: number;
  nama: string;
  email: string;
  role: string;
  role_id: number;
  nama_role: string | null;
  upr_instansi: string | null;
  created_at: string;
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

const normalizeRole = (user: any) => {
  const role = String(
    user?.role || user?.role_name || user?.nama_role || ""
  )
    .trim()
    .toLowerCase();

  if (role) return role;
  if (Number(user?.role_id) === 1) return "admin";
  if (Number(user?.role_id) === 2) return "pengelola";
  if (Number(user?.role_id) === 3) return "pimpinan";
  if (Number(user?.role_id) === 4) return "auditor";

  return "";
};

const getRiskStyle = (value: string | number | null) => {
  const numeric = Number(value);

  if (Number.isFinite(numeric)) {
    if (numeric >= 17) {
      return {
        color: C.red,
        background: C.redLight,
      };
    }

    if (numeric >= 10) {
      return {
        color: C.amber,
        background: C.amberLight,
      };
    }

    return {
      color: C.green,
      background: C.greenLight,
    };
  }

  const text = String(value ?? "").trim().toLowerCase();

  if (
    text.includes("sangat tinggi") ||
    text.includes("ekstrem") ||
    text === "tinggi"
  ) {
    return {
      color: C.red,
      background: C.redLight,
    };
  }

  if (text.includes("sedang") || text.includes("menengah")) {
    return {
      color: C.amber,
      background: C.amberLight,
    };
  }

  return {
    color: C.green,
    background: C.greenLight,
  };
};

function KpiCard({
  label,
  value,
  description,
  iconBg,
  iconColor,
  Icon,
}: KpiCardProps) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 180,
        padding: 20,
        boxSizing: "border-box",
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        display: "flex",
        flexDirection: "column",
        gap: 14,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          style={{
            fontWeight: 600,
            fontSize: 12,
            color: C.body,
          }}
        >
          {label}
        </span>

        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 8,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon size={19} color={iconColor} strokeWidth={2} />
        </div>
      </div>

      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 28,
            lineHeight: "34px",
            color: C.title,
          }}
        >
          {value}
        </div>

        <div
          style={{
            marginTop: 5,
            fontSize: 11,
            color: C.muted,
          }}
        >
          {description}
        </div>
      </div>
    </div>
  );
}

function RisikoTable({
  items,
  navigate,
}: {
  items: RisikoTerbaru[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <div
      style={{
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        padding: 20,
        minWidth: 0,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontWeight: 700,
            fontSize: 15,
            color: C.title,
          }}
        >
          Risiko Terbaru
        </div>

        <div
          style={{
            marginTop: 4,
            fontSize: 12,
            color: C.muted,
          }}
        >
          Risiko terakhir yang tercatat pada sistem
        </div>
      </div>

      <div
        style={{
          border: `1px solid ${C.border}`,
          borderRadius: 8,
          overflowX: "auto",
        }}
      >
        <div style={{ minWidth: 700 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "95px 1.1fr 1.6fr 90px 100px 100px",
              gap: 10,
              padding: "10px 14px",
              background: C.bg,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            {[
              "ID Risiko",
              "Layanan",
              "Peristiwa Risiko",
              "Tingkat",
              "Status",
              "Tanggal",
            ].map((heading) => (
              <span
                key={heading}
                style={{
                  fontWeight: 600,
                  fontSize: 11,
                  color: C.subtitle,
                }}
              >
                {heading}
              </span>
            ))}
          </div>

          {items.length === 0 ? (
            <div
              style={{
                padding: 24,
                textAlign: "center",
                fontSize: 13,
                color: C.muted,
              }}
            >
              Belum ada data risiko.
            </div>
          ) : (
            items.map((risk, index) => {
              const riskStyle = getRiskStyle(risk.besaran_risiko);

              return (
                <div
                  key={risk.id}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "95px 1.1fr 1.6fr 90px 100px 100px",
                    gap: 10,
                    padding: "12px 14px",
                    alignItems: "center",
                    borderBottom:
                      index < items.length - 1
                        ? `1px solid ${C.border}`
                        : "none",
                  }}
                >
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: C.title,
                    }}
                  >
                    {risk.kode_risiko || `#${risk.id}`}
                  </span>

                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: 12,
                      color: C.title,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {risk.nama_layanan || "-"}
                  </span>

                  <span
                    title={risk.peristiwa_risiko}
                    style={{
                      fontSize: 12,
                      color: C.body,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {risk.peristiwa_risiko || "-"}
                  </span>

                  <span
                    style={{
                      justifySelf: "start",
                      padding: "4px 8px",
                      borderRadius: 5,
                      fontWeight: 600,
                      fontSize: 10,
                      color: riskStyle.color,
                      background: riskStyle.background,
                    }}
                  >
                    {risk.besaran_risiko ?? "-"}
                  </span>

                  <span
                    style={{
                      fontWeight: 500,
                      fontSize: 11,
                      color: C.title,
                    }}
                  >
                    {risk.status_risiko || "-"}
                  </span>

                  <span
                    style={{
                      fontSize: 11,
                      color: C.body,
                    }}
                  >
                    {formatDate(risk.created_at)}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={() => navigate("/risiko")}
        style={{
          display: "block",
          margin: "16px auto 0",
          border: "none",
          background: "transparent",
          color: C.title,
          fontWeight: 600,
          fontSize: 12,
          textDecoration: "underline",
          cursor: "pointer",
        }}
      >
        Lihat Semua Risiko →
      </button>
    </div>
  );
}

function ModuleCard({
  title,
  value,
  description,
  Icon,
  color,
  route,
  navigate,
}: {
  title: string;
  value: number | string;
  description: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  color: string;
  route: string;
  navigate: ReturnType<typeof useNavigate>;
}) {
  return (
    <button
      type="button"
      onClick={() => navigate(route)}
      style={{
        minWidth: 0,
        padding: 14,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        background: C.white,
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 7,
          background: C.bg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={17} color={color} strokeWidth={2} />
      </div>

      <div
        style={{
          marginTop: 10,
          minHeight: 32,
          fontWeight: 700,
          fontSize: 12,
          lineHeight: "16px",
          color: C.title,
        }}
      >
        {title}
      </div>

      <div
        style={{
          marginTop: 8,
          fontWeight: 700,
          fontSize: 20,
          lineHeight: "24px",
          color: C.title,
        }}
      >
        {value}
      </div>

      <div
        style={{
          marginTop: 3,
          fontSize: 10,
          lineHeight: "14px",
          color: C.muted,
        }}
      >
        {description}
      </div>
    </button>
  );
}

export default function SimLdpDashboard() {
  const navigate = useNavigate();

  const savedUser = sessionStorage.getItem("user");

  let user: any = null;

  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
    } catch {
      user = null;
    }
  }

  const role = normalizeRole(user);

  const [data, setData] = useState<DashboardData | null>(null);
  const [pimpinanData, setPimpinanData] = useState<PimpinanDashboardData | null>(null);
  const [pengelolaData, setPengelolaData] = useState<PengelolaDashboardData | null>(null);
  const [adminData, setAdminData] = useState<AdminDashboardData | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const changeApprovalNotifications = useMemo(
    () =>
      notifications.filter(
        (item) =>
          item.module_code === "PERUBAHAN" &&
          item.notification_type === "APPROVAL" &&
          !Boolean(item.is_read)
      ),
    [notifications]
  );

  const changeStatusNotifications = useMemo(
    () =>
      notifications.filter(
        (item) =>
          item.module_code === "PERUBAHAN" &&
          item.notification_type === "STATUS"
      ),
    [notifications]
  );

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      if (role === "pimpinan") {
        const [summaryResponse, pimpinanResponse, notificationResponse] =
          await Promise.all([
            API.get("/dashboard/summary"),
            API.get("/dashboard/pimpinan"),
            API.get("/notifications?limit=100"),
          ]);

        setData(summaryResponse.data);
        setPimpinanData(pimpinanResponse.data);
        setNotifications(
          Array.isArray(notificationResponse.data?.data)
            ? notificationResponse.data.data
            : []
        );

        return;
      }

      if (role === "pengelola") {
        const [summaryResponse, pengelolaResponse, notificationResponse] =
          await Promise.all([
            API.get("/dashboard/summary"),
            API.get("/dashboard/pengelola"),
            API.get("/notifications?limit=100"),
          ]);

        setData(summaryResponse.data);
        setPengelolaData(pengelolaResponse.data);
        setNotifications(
          Array.isArray(notificationResponse.data?.data)
            ? notificationResponse.data.data
            : []
        );

        return;
      }

      if (role === "admin") {
        const [summaryResponse, adminResponse, notificationResponse] =
          await Promise.all([
            API.get("/dashboard/summary"),
            API.get("/dashboard/admin"),
            API.get("/notifications?limit=100"),
          ]);

        setData(summaryResponse.data);
        setAdminData(adminResponse.data);
        setNotifications(
          Array.isArray(notificationResponse.data?.data)
            ? notificationResponse.data.data
            : []
        );

        return;
      }

      const [dashboardResponse, notificationResponse] = await Promise.all([
        API.get("/dashboard/summary"),
        API.get("/notifications?limit=100"),
      ]);

      setData(dashboardResponse.data);
      setNotifications(
        Array.isArray(notificationResponse.data?.data)
          ? notificationResponse.data.data
          : []
      );
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

  useEffect(() => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "auto",
    });
  }, []);

  if (loading) {
    return (
      <div
        style={{
          width: "100%",
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: C.body,
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <RefreshCw size={18} />
          Memuat dashboard...
        </div>
      </div>
    );
  }

  if (
    error ||
    !data ||
    (role === "pimpinan" && !pimpinanData) ||
    (role === "pengelola" && !pengelolaData) ||
    (role === "admin" && !adminData)
  ) {
    return (
      <div
        style={{
          padding: 24,
          background: C.redLight,
          border: `1px solid ${C.red}`,
          borderRadius: 10,
        }}
      >
        <div
          style={{
            fontWeight: 700,
            color: C.red,
            marginBottom: 8,
          }}
        >
          Dashboard gagal dimuat
        </div>

        <div
          style={{
            fontSize: 13,
            color: C.body,
            marginBottom: 16,
          }}
        >
          {error}
        </div>

        <button
          type="button"
          onClick={loadDashboard}
          style={{
            border: "none",
            borderRadius: 6,
            padding: "9px 14px",
            background: C.title,
            color: C.white,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(
    (item) => !Boolean(item.is_read)
  );

  const title =
    role === "pimpinan"
      ? "Dashboard Pimpinan"
      : role === "pengelola"
      ? "Dashboard Pengelola LDP"
      : role === "admin"
      ? "Dashboard Administrator"
      : role === "auditor"
      ? "Dashboard Auditor"
      : "Dashboard Overview";

  const subtitle =
    role === "pimpinan"
      ? "Ringkasan keputusan dan item yang membutuhkan perhatian pimpinan"
      : role === "pengelola"
      ? "Ringkasan pekerjaan operasional dan tindak lanjut pengelolaan LDP"
      : role === "admin"
      ? "Ringkasan kondisi sistem, akun pengguna, dan lima modul SIM-LDP"
      : role === "auditor"
      ? "Ringkasan informasi lintas modul untuk kebutuhan pemantauan dan audit"
      : "Ringkasan data lima modul manajemen layanan digital pemerintah";

  let kpis: KpiCardProps[] = [];

  if (role === "pimpinan" && pimpinanData) {
    kpis = [
      {
        label: "Persetujuan Perubahan",
        value: changeApprovalNotifications.length,
        description: "Analisis perubahan yang menunggu keputusan",
        iconBg: C.amberLight,
        iconColor: C.amber,
        Icon: ClipboardCheck,
      },
      {
        label: "Perubahan Aktif",
        value: pimpinanData.perubahan.aktif,
        description: `${pimpinanData.perubahan.total} total perubahan`,
        iconBg: C.blueLight,
        iconColor: C.blue,
        Icon: Repeat2,
      },
      {
        label: "Risiko Tinggi",
        value: pimpinanData.risiko.tinggi,
        description: "Risiko untuk kebutuhan pemantauan",
        iconBg: C.redLight,
        iconColor: C.red,
        Icon: AlertTriangle,
      },
      {
        label: "Total Risiko",
        value: data.risiko.total,
        description: "Seluruh risiko yang tercatat",
        iconBg: C.purpleLight,
        iconColor: C.purple,
        Icon: ShieldAlert,
      },
    ];
  } else if (role === "pengelola" && pengelolaData) {
    kpis = [
      {
        label: "Total Risiko",
        value: pengelolaData.risiko.total,
        description: "Seluruh risiko yang tercatat",
        iconBg: C.redLight,
        iconColor: C.red,
        Icon: ShieldAlert,
      },
      {
        label: "Perubahan Aktif",
        value: data.perubahan.aktif,
        description: `${data.perubahan.total} total perubahan`,
        iconBg: C.amberLight,
        iconColor: C.amber,
        Icon: Repeat2,
      },
      {
        label: "Keputusan Perubahan",
        value: changeStatusNotifications.length,
        description: "Riwayat keputusan analisis perubahan",
        iconBg: C.blueLight,
        iconColor: C.blue,
        Icon: BellRing,
      },
      {
        label: "Notifikasi Baru",
        value: pengelolaData.notifikasi.unread,
        description: "Informasi yang belum dibaca",
        iconBg: C.blueLight,
        iconColor: C.blue,
        Icon: BellRing,
      },
      {
        label: "Pengetahuan",
        value: pengelolaData.pengetahuan.total,
        description: `${pengelolaData.pengetahuan.terdokumentasi} terdokumentasi`,
        iconBg: C.greenLight,
        iconColor: C.green,
        Icon: BookOpen,
      },
    ];
  } else if (role === "admin" && adminData) {
    kpis = [
      {
        label: "Total Akun",
        value: adminData.akun.total,
        description: "Seluruh akun pengguna SIM-LDP",
        iconBg: C.blueLight,
        iconColor: C.blue,
        Icon: Users,
      },
      {
        label: "Pengelola",
        value: adminData.akun.pengelola,
        description: "Akun Pengelola LDP",
        iconBg: C.greenLight,
        iconColor: C.green,
        Icon: UserCog,
      },
      {
        label: "Pimpinan",
        value: adminData.akun.pimpinan,
        description: "Akun pimpinan",
        iconBg: C.purpleLight,
        iconColor: C.purple,
        Icon: ClipboardCheck,
      },
      {
        label: "Auditor",
        value: adminData.akun.auditor,
        description: "Akun auditor",
        iconBg: C.amberLight,
        iconColor: C.amber,
        Icon: Eye,
      },
      {
        label: "Total Risiko",
        value: data.risiko.total,
        description: `${data.risiko.tinggi} risiko kategori tinggi`,
        iconBg: C.redLight,
        iconColor: C.red,
        Icon: ShieldAlert,
      },
    ];
  } else if (role === "auditor") {
    kpis = [
      {
        label: "Total Risiko",
        value: data.risiko.total,
        description: "Data risiko tercatat",
        iconBg: C.redLight,
        iconColor: C.red,
        Icon: ShieldAlert,
      },
      {
        label: "Risiko Tinggi",
        value: data.risiko.tinggi,
        description: "Risiko untuk perhatian audit",
        iconBg: C.redLight,
        iconColor: C.red,
        Icon: AlertTriangle,
      },
      {
        label: "Perubahan",
        value: data.perubahan.total,
        description: `${data.perubahan.selesai} selesai`,
        iconBg: C.amberLight,
        iconColor: C.amber,
        Icon: Repeat2,
      },
      {
        label: "BCP Aktif",
        value: data.keberlangsungan.bcp_aktif,
        description: `${data.keberlangsungan.uji_total} pengujian`,
        iconBg: C.greenLight,
        iconColor: C.green,
        Icon: Activity,
      },
      {
        label: "Relasi Pengguna",
        value: data.relasi_pengguna.total,
        description: `${data.relasi_pengguna.insiden_aktif} insiden aktif`,
        iconBg: C.purpleLight,
        iconColor: C.purple,
        Icon: Eye,
      },
    ];
  } else {
    kpis = [
      {
        label: "Total Risiko",
        value: data.risiko.total,
        description: `${data.risiko.tinggi} risiko kategori tinggi`,
        iconBg: C.redLight,
        iconColor: C.red,
        Icon: ShieldAlert,
      },
      {
        label: "Perubahan Aktif",
        value: data.perubahan.aktif,
        description: `${data.perubahan.total} total perubahan`,
        iconBg: C.amberLight,
        iconColor: C.amber,
        Icon: Repeat2,
      },
      {
        label: "Pengetahuan",
        value: data.pengetahuan.total,
        description: `${data.pengetahuan.terdokumentasi} sudah terdokumentasi`,
        iconBg: C.blueLight,
        iconColor: C.blue,
        Icon: BookOpen,
      },
      {
        label: "BCP Aktif",
        value: data.keberlangsungan.bcp_aktif,
        description: `${data.keberlangsungan.uji_total} pengujian keberlangsungan`,
        iconBg: C.greenLight,
        iconColor: C.green,
        Icon: Activity,
      },
      {
        label: "Relasi Pengguna",
        value: data.relasi_pengguna.total,
        description: `${data.relasi_pengguna.insiden_aktif} insiden aktif`,
        iconBg: C.purpleLight,
        iconColor: C.purple,
        Icon: Users,
      },
    ];
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        width: "100%",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 22,
              lineHeight: "28px",
              color: C.title,
            }}
          >
            {title}
          </h1>

          <p
            style={{
              margin: "4px 0 0",
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
            height: 36,
            padding: "0 14px",
            border: `1px solid ${C.border}`,
            borderRadius: 7,
            background: C.white,
            color: C.title,
            fontWeight: 600,
            fontSize: 12,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 7,
          }}
        >
          <RefreshCw size={15} />
          Perbarui Data
        </button>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        {kpis.map((kpi) => (
          <KpiCard key={kpi.label} {...kpi} />
        ))}
      </div>

      {role === "admin" && adminData && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "minmax(300px, 0.72fr) minmax(0, 1.7fr)",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 18,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: C.title,
                }}
              >
                Administrasi Sistem
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: C.muted,
                }}
              >
                Pengelolaan akun dan akses pengguna SIM-LDP
              </div>

              <button
                type="button"
                onClick={() => navigate("/admin/accounts")}
                style={{
                  width: "100%",
                  marginTop: 14,
                  padding: 13,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.bg,
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 7,
                    background: C.blueLight,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <UserCog size={18} color={C.blue} />
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontWeight: 700,
                      fontSize: 12,
                      color: C.title,
                    }}
                  >
                    Kelola Akun
                  </div>

                  <div
                    style={{
                      marginTop: 2,
                      fontSize: 10,
                      color: C.muted,
                    }}
                  >
                    {adminData.akun.total} akun terdaftar
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.blue,
                  }}
                >
                  Buka →
                </span>
              </button>

              <div
                style={{
                  marginTop: 18,
                  fontWeight: 700,
                  fontSize: 12,
                  color: C.title,
                }}
              >
                Akun Terbaru
              </div>

              <div
                style={{
                  marginTop: 9,
                  display: "flex",
                  flexDirection: "column",
                  gap: 7,
                }}
              >
                {adminData.akun.terbaru.length === 0 ? (
                  <div
                    style={{
                      padding: 14,
                      background: C.bg,
                      borderRadius: 8,
                      fontSize: 11,
                      color: C.muted,
                    }}
                  >
                    Belum ada akun.
                  </div>
                ) : (
                  adminData.akun.terbaru.map((account) => (
                    <div
                      key={account.id}
                      style={{
                        padding: "9px 10px",
                        border: `1px solid ${C.border}`,
                        borderRadius: 7,
                        background: C.white,
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 11,
                            color: C.title,
                          }}
                        >
                          {account.nama}
                        </div>

                        <div
                          style={{
                            marginTop: 2,
                            fontSize: 9,
                            color: C.muted,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {account.email}
                        </div>
                      </div>

                      <span
                        style={{
                          flexShrink: 0,
                          padding: "3px 6px",
                          borderRadius: 5,
                          background: C.bg,
                          fontSize: 9,
                          fontWeight: 600,
                          color: C.title,
                        }}
                      >
                        {account.nama_role || account.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div
              style={{
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
                padding: 18,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: C.title,
                }}
              >
                Ringkasan 5 Modul
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  color: C.muted,
                }}
              >
                Kondisi utama seluruh modul manajemen layanan digital
              </div>

              <div
                style={{
                  marginTop: 14,
                  display: "grid",
                  gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <ModuleCard
                  title="Manajemen Risiko"
                  value={data.risiko.total}
                  description={`${data.risiko.tinggi} risiko tinggi`}
                  Icon={ShieldAlert}
                  color={C.red}
                  route="/risiko/overview"
                  navigate={navigate}
                />

                <ModuleCard
                  title="Manajemen Perubahan"
                  value={data.perubahan.aktif}
                  description={`${data.perubahan.total} total perubahan`}
                  Icon={Repeat2}
                  color={C.amber}
                  route="/perubahan/perencanaan"
                  navigate={navigate}
                />

                <ModuleCard
                  title="Manajemen Pengetahuan"
                  value={data.pengetahuan.total}
                  description={`${data.pengetahuan.terdokumentasi} terdokumentasi`}
                  Icon={BookOpen}
                  color={C.blue}
                  route="/pengetahuan/perencanaan"
                  navigate={navigate}
                />

                <ModuleCard
                  title="Manajemen Keberlangsungan"
                  value={data.keberlangsungan.bcp_aktif}
                  description={`${data.keberlangsungan.bcp_total} total BCP`}
                  Icon={Database}
                  color={C.green}
                  route="/keberlangsungan/penetapan-konteks"
                  navigate={navigate}
                />

                <ModuleCard
                  title="Manajemen Relasi Pengguna"
                  value={data.relasi_pengguna.total}
                  description={`${data.relasi_pengguna.insiden_aktif} insiden aktif`}
                  Icon={Users}
                  color={C.purple}
                  route="/relasi-pengguna/perencanaan"
                  navigate={navigate}
                />
              </div>

              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 12,
                    color: C.title,
                  }}
                >
                  Status Sistem
                </div>

                <div
                  style={{
                    marginTop: 10,
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 8,
                  }}
                >
                  <div
                    style={{
                      padding: 10,
                      borderRadius: 7,
                      background: C.bg,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: C.muted,
                      }}
                    >
                      Admin
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.title,
                      }}
                    >
                      {adminData.akun.admin}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 7,
                      background: C.bg,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: C.muted,
                      }}
                    >
                      Pengelola
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.title,
                      }}
                    >
                      {adminData.akun.pengelola}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 7,
                      background: C.bg,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: C.muted,
                      }}
                    >
                      Pimpinan
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.title,
                      }}
                    >
                      {adminData.akun.pimpinan}
                    </div>
                  </div>

                  <div
                    style={{
                      padding: 10,
                      borderRadius: 7,
                      background: C.bg,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 9,
                        color: C.muted,
                      }}
                    >
                      Auditor
                    </div>

                    <div
                      style={{
                        marginTop: 3,
                        fontSize: 15,
                        fontWeight: 700,
                        color: C.title,
                      }}
                    >
                      {adminData.akun.auditor}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <RisikoTable
            items={data.risiko.terbaru}
            navigate={navigate}
          />
        </>
      )}

      {role === "pimpinan" && pimpinanData && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.9fr) minmax(0, 1.4fr)",
            gap: 20,
          }}
        >
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: C.title,
              }}
            >
              Menunggu Persetujuan
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: C.muted,
              }}
            >
              Daftar item yang membutuhkan keputusan pimpinan
            </div>

            <div
              style={{
                marginTop: 16,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {changeApprovalNotifications.length === 0 ? (
                <div
                  style={{
                    padding: "24px 16px",
                    background: C.bg,
                    borderRadius: 8,
                    textAlign: "center",
                    fontSize: 12,
                    color: C.muted,
                  }}
                >
                  Tidak ada persetujuan perubahan yang menunggu.
                </div>
              ) : (
                changeApprovalNotifications.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      navigate(
                        item.action_url ||
                          "/perubahan/analisis"
                      )
                    }
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      border: `1px solid ${C.border}`,
                      borderRadius: 8,
                      background: C.bg,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: 12,
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
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
                            marginTop: 4,
                            fontSize: 11,
                            lineHeight: "16px",
                            color: C.body,
                          }}
                        >
                          {item.message}
                        </div>

                        <div
                          style={{
                            marginTop: 6,
                            fontSize: 10,
                            color: C.muted,
                          }}
                        >
                          {formatDate(item.created_at)}
                        </div>
                      </div>

                      <span
                        style={{
                          flexShrink: 0,
                          padding: "4px 8px",
                          borderRadius: 6,
                          background: C.amberLight,
                          color: C.amber,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        Menunggu
                      </span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <RisikoTable
            items={pimpinanData.risiko.terbaru}
            navigate={navigate}
          />
        </div>
      )}

      {role === "pengelola" && pengelolaData && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 0.8fr) minmax(0, 1.5fr)",
            gap: 20,
          }}
        >
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 10,
              padding: 20,
            }}
          >
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: C.title,
              }}
            >
              Pekerjaan Saya
            </div>

            <div
              style={{
                marginTop: 4,
                fontSize: 12,
                color: C.muted,
              }}
            >
              Ringkasan aktivitas yang perlu ditindaklanjuti
            </div>

            <div
              style={{
                marginTop: 18,
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <button
                type="button"
                onClick={() =>
                  navigate("/perubahan/perencanaan")
                }
                style={{
                  padding: 14,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.bg,
                  display: "flex",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: C.title,
                  }}
                >
                  Perubahan Aktif
                </span>

                <strong>
                  {data.perubahan.aktif}
                </strong>
              </button>

              <button
                type="button"
                onClick={() =>
                  navigate("/perubahan/analisis")
                }
                style={{
                  padding: 14,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.bg,
                  display: "flex",
                  justifyContent: "space-between",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: C.title,
                  }}
                >
                  Keputusan Perubahan
                </span>

                <strong>
                  {changeStatusNotifications.length}
                </strong>
              </button>

              <div
                style={{
                  padding: 14,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  background: C.bg,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: C.title,
                  }}
                >
                  Notifikasi Baru
                </span>

                <strong>
                  {pengelolaData.notifikasi.unread}
                </strong>
              </div>
            </div>
          </div>

          <RisikoTable
            items={pengelolaData.risiko.terbaru}
            navigate={navigate}
          />
        </div>
      )}

      {role === "auditor" && (
        <RisikoTable
          items={data.risiko.terbaru}
          navigate={navigate}
        />
      )}

      {!role && (
        <RisikoTable
          items={data.risiko.terbaru}
          navigate={navigate}
        />
      )}

      {role !== "admin" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <ModuleCard
            title="Risiko"
            value={data.risiko.total}
            description="Manajemen Risiko"
            Icon={ShieldAlert}
            color={C.red}
            route="/risiko/overview"
            navigate={navigate}
          />

          <ModuleCard
            title="Perubahan"
            value={data.perubahan.total}
            description={`${data.perubahan.aktif} aktif`}
            Icon={Repeat2}
            color={C.amber}
            route="/perubahan/perencanaan"
            navigate={navigate}
          />

          <ModuleCard
            title="Pengetahuan"
            value={data.pengetahuan.total}
            description={`${data.pengetahuan.terdokumentasi} terdokumentasi`}
            Icon={BookOpen}
            color={C.blue}
            route="/pengetahuan/perencanaan"
            navigate={navigate}
          />

          <ModuleCard
            title="Keberlangsungan"
            value={data.keberlangsungan.bcp_total}
            description={`${data.keberlangsungan.bcp_aktif} BCP aktif`}
            Icon={Database}
            color={C.green}
            route="/keberlangsungan/penetapan-konteks"
            navigate={navigate}
          />

          <ModuleCard
            title="Relasi Pengguna"
            value={data.relasi_pengguna.total}
            description={`${data.relasi_pengguna.insiden_aktif} insiden aktif`}
            Icon={Users}
            color={C.purple}
            route="/relasi-pengguna/perencanaan"
            navigate={navigate}
          />
        </div>
      )}
    </div>
  );
}