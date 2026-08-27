import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  ShieldAlert,
  RotateCw,
  BookOpen,
  ShieldCheck,
  UserRound,
  Layers3,
  FileCheck,
  BarChart3,
  Settings,
  ArrowLeft,
  Search,
  Bell,
  Award,
  Layers,
  XCircle,
  CalendarCheck,
} from "lucide-react";
/* ── colour tokens (from Figma) ── */
const C = {
  sidebar: "#1B2A4A",
  sidebarActive: "#2C3E6B",
  sidebarText: "#E8F0FE",
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
  blueLight: "#E8F0FE",
  greenLight: "#D1FAE5",
  redLight: "#FEE2E2",
  amberLight: "#FEF3C7",
};

/* ── sidebar menu data ── */
const menuItems = [
  {
    id: "dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    id: "risiko",
    label: "Manajemen Risiko",
    Icon: ShieldAlert,
    permission: "risk.view",
  },

  // sementara menu lain belum kita pasang permission
  { id: "bcp", label: "Keberlangsungan (BCP)", Icon: RotateCw },
  { id: "pengetahuan", label: "Manajemen Pengetahuan", Icon: BookOpen },
  { id: "keamanan", label: "Keamanan Informasi", Icon: ShieldCheck },
  { id: "relasi", label: "Relasi Pengguna", Icon: UserRound },
  { id: "aset", label: "Manajemen Aset", Icon: Layers3 },
  { id: "kepatuhan", label: "Kepatuhan", Icon: FileCheck },
  { id: "pelaporan", label: "Pelaporan", Icon: BarChart3 },
  { id: "pengaturan", label: "Pengaturan", Icon: Settings },
];

/* ── KPI data ── */
const kpis = [
  {
    label: "Total Layanan Digital",
    value: "248",
    trend: "+8%",
    trendText: "dari bulan lalu",
    trendColor: C.green,
    iconBg: C.blueLight,
    iconColor: C.title,
    Icon: Layers,
  },
  {
    label: "Insiden Non-Aktif",
    value: "12",
    trend: "+5%",
    trendText: "dari bulan lalu",
    trendColor: C.green,
    iconBg: C.amberLight,
    iconColor: C.amber,
    Icon: XCircle,
  },
  {
    label: "Risiko Teridentifikasi",
    value: "8",
    trend: "3",
    trendText: "dari bulan lalu",
    trendColor: C.amber,
    iconBg: C.redLight,
    iconColor: C.red,
    Icon: ShieldAlert,
  },
  {
    label: "Kepatuhan SLA",
    value: "97%",
    trend: "+2.5%",
    trendText: "dari bulan lalu",
    trendColor: C.green,
    iconBg: C.greenLight,
    iconColor: C.green,
    Icon: CalendarCheck,
  },
  {
    label: "Skor Kematangan",
    value: "3.8/5.0",
    trend: "+0.4 poin",
    trendText: "dari bulan lalu",
    trendColor: C.green,
    iconBg: C.blueLight,
    iconColor: C.title,
    Icon: Award,
  },
];

/* ── domain scores ── */
const domains = [
  { label: "Kebijakan Internal", score: 4.2, max: 5 },
  { label: "Tata Kelola", score: 3.5, max: 5 },
  { label: "Layanan Digital", score: 3.9, max: 5 },
  { label: "Teknologi Informasi", score: 3.6, max: 5 },
  { label: "Keamanan Informasi", score: 3.8, max: 5 },
];

/* ── risk table data ── */
const risks = [
  { id: "RSK-001", service: "Portal Layanan Publik", desc: "Kerentanan keamanan sistem", level: "Tinggi", levelColor: C.red, levelBg: C.redLight, status: "Mitigasi" },
  { id: "RSK-002", service: "Sistem Kependudukan", desc: "Gangguan konektivitas jaringan", level: "Sedang", levelColor: C.amber, levelBg: C.amberLight, status: "Monitoring" },
  { id: "RSK-003", service: "E-Procurement", desc: "Ketidaksesuaian data vendor", level: "Rendah", levelColor: C.green, levelBg: C.greenLight, status: "Selesai" },
  { id: "RSK-004", service: "Sistem Perizinan Online", desc: "Overload server saat peak", level: "Tinggi", levelColor: C.red, levelBg: C.redLight, status: "Tindakan" },
  { id: "RSK-005", service: "Dashboard Analitik", desc: "Inkonsistensi data laporan", level: "Sedang", levelColor: C.amber, levelBg: C.amberLight, status: "Monitoring" },
];

/* ═══════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════ */

function SidebarItem({ Icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        width: "100%",
        border: "none",
        borderRadius: 6,
        background: active ? C.sidebarActive : "transparent",
        cursor: "pointer",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "rgba(44,62,107,.45)"; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
    >
      <Icon size={18} color={active ? "#FFF" : C.sidebarText} strokeWidth={2} />
      <span
        style={{
          fontFamily: "Inter, system-ui, sans-serif",
          fontWeight: active ? 600 : 500,
          fontSize: 13,
          lineHeight: "16px",
          color: active ? "#FFF" : C.sidebarText,
        }}
      >
        {label}
      </span>
    </button>
  );
}

function KpiCard({ kpi }) {
  const { label, value, trend, trendText, trendColor, iconBg, iconColor, Icon } = kpi;
  return (
    <div
      style={{
        flex: 1,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 12,
        padding: 20,
        background: C.white,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 12, color: C.body }}>{label}</span>
        <div
          style={{
            width: 36, height: 36,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: iconBg, borderRadius: 6,
          }}
        >
          <Icon size={18} color={iconColor} strokeWidth={2} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700, fontSize: 28, lineHeight: "34px", color: C.title }}>{value}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 600, fontSize: 11, color: trendColor }}>{trend}</span>
          <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 400, fontSize: 11, color: C.muted }}>{trendText}</span>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, score, max }) {
  const pct = (score / max) * 100;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 500, fontSize: 13, color: C.title }}>{label}</span>
        <span style={{ fontFamily: "Inter, system-ui, sans-serif", fontWeight: 700, fontSize: 13, color: C.title }}>{score.toFixed(1)} / {max.toFixed(1)}</span>
      </div>
      <div style={{ width: "100%", height: 8, background: C.border, borderRadius: 4 }}>
        <div style={{ width: `${pct}%`, height: 8, background: C.title, borderRadius: 4, transition: "width .4s ease" }} />
      </div>
    </div>
  );
}

function RiskBadge({ level, color, bg }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "4px 8px",
        background: bg,
        borderRadius: 4,
        fontFamily: "Inter, system-ui, sans-serif",
        fontWeight: 600,
        fontSize: 11,
        color,
      }}
    >
      {level}
    </span>
  );
}

/* ═══════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════ */

export default function SimLdpDashboard() {
  const [active, setActive] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);

  const navigate = useNavigate();

  const savedUser = localStorage.getItem("user");
  const user = savedUser ? JSON.parse(savedUser) : null;

  const permissions: string[] = user?.permissions || [];

  const can = (permission?: string) => {
    if (!permission) return true;

    return permissions.includes(permission);
  };

  const handleMenuClick = (id: string) => {
    setActive(id);

    if (id == "dasboard") {
      navigate("/dashboard");
    }

    if (id == "risiko") {
      navigate("/risiko");
    }
      
  };

  const sidebarW = collapsed ? 64 : 220;

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        background: C.bg,
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* ─── LEFT SIDEBAR ─── */}
      <aside
        style={{
          width: sidebarW,
          minHeight: "100vh",
          background: C.sidebar,
          display: "flex",
          flexDirection: "column",
          padding: 16,
          gap: 24,
          transition: "width .25s ease",
          flexShrink: 0,
          overflow: "hidden",
        }}
      >
        {/* brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 31 }}>
          {!collapsed && (
            <>
              <div
                style={{
                  width: 32, height: 32, borderRadius: 6,
                  background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#FFF", fontWeight: 800, fontSize: 14, flexShrink: 0,
                }}
              >
                S
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 700, fontSize: 14, color: "#FFF" }}>SIM-LDP</span>
                <span style={{ fontWeight: 500, fontSize: 10, color: C.sidebarText }}>Layanan Digital Pemerintah</span>
              </div>
            </>
          )}
          {collapsed && (
            <div
              style={{
                width: 32, height: 32, borderRadius: 6,
                background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#FFF", fontWeight: 800, fontSize: 14,
              }}
            >
              S
            </div>
          )}
        </div>

        {/* menu */}
        <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
          {menuItems
            .filter((m) => can(m.permission))
            .map((m) => 
            collapsed ? (
              <button
                key={m.id}
                onClick={() => handleMenuClick(m.id)}
                title={m.label}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 42, border: "none", borderRadius: 6, cursor: "pointer",
                  background: active === m.id ? C.sidebarActive : "transparent",
                }}
              >
                <m.Icon size={18} color={active === m.id ? "#FFF" : C.sidebarText} strokeWidth={2} />
              </button>
            ) : (
              <SidebarItem
                key={m.id}
                Icon={m.Icon}
                label={m.label}
                active={active === m.id}
                onClick={() => handleMenuClick(m.id)}
              />
            )
          )}
        </nav>

        {/* collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: 12, border: "none", borderRadius: 6,
            background: C.sidebarActive, cursor: "pointer",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <ArrowLeft
            size={16}
            color={C.sidebarText}
            strokeWidth={2}
            style={{ transform: collapsed ? "rotate(180deg)" : "none", transition: "transform .25s" }}
          />
          {!collapsed && (
            <span style={{ fontWeight: 400, fontSize: 12, color: C.sidebarText }}>Kecilkan Menu</span>
          )}
        </button>
      </aside>

      {/* ─── WORKSPACE ─── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* header bar */}
        <header
          style={{
            boxSizing: "border-box",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "0 24px",
            height: 72,
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          {/* header left */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 12, color: C.muted }}>Beranda</span>
              <span style={{ fontSize: 12, color: C.muted }}>&gt;</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: C.title }}>Dashboard</span>
            </div>
            <span style={{ fontWeight: 700, fontSize: 13, color: C.subtitle }}>
              Kementerian Komunikasi dan Informatika
            </span>
          </div>

          {/* header right */}
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {/* search */}
            <div
              style={{
                boxSizing: "border-box",
                display: "flex", alignItems: "center", gap: 8,
                padding: "8px 12px",
                width: 220, height: 32,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
              }}
            >
              <Search size={16} color={C.muted} strokeWidth={2} />
              <span style={{ fontSize: 13, color: C.muted }}>Cari layanan...</span>
            </div>

            {/* notification */}
            <div
              style={{
                position: "relative",
                width: 36, height: 36,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: C.bg, borderRadius: 8, cursor: "pointer",
              }}
            >
              <Bell size={18} color={C.title} strokeWidth={2} />
              <div
                style={{
                  position: "absolute", top: 6, right: 6,
                  width: 8, height: 8,
                  background: C.red, borderRadius: 4,
                }}
              />
            </div>

            {/* profile */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 36, height: 36, borderRadius: 18,
                  background: `linear-gradient(135deg, ${C.blueLight}, #C7D2FE)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 14, color: C.title,
                }}
              >
                AW
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: C.title }}>Dr. Andi Wijaya, M.Si</span>
                <span style={{ fontWeight: 400, fontSize: 11, color: C.muted }}>Administrator</span>
              </div>
            </div>
          </div>
        </header>

        {/* ─── BODY CONTENT ─── */}
        <main style={{ flex: 1, padding: 24, display: "flex", flexDirection: "column", gap: 24, overflowY: "auto" }}>
          {/* title block */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <h1 style={{ margin: 0, fontWeight: 700, fontSize: 22, lineHeight: "27px", color: C.title }}>
              Dashboard Overview
            </h1>
            <p style={{ margin: 0, fontWeight: 400, fontSize: 13, color: C.body }}>
              Ringkasan manajemen layanan digital pemerintah secara terpadu
            </p>
          </div>

          {/* KPI row */}
          <div style={{ display: "flex", gap: 16 }}>
            {kpis.map((kpi, i) => (
              <KpiCard key={i} kpi={kpi} />
            ))}
          </div>

          {/* two‑column layout */}
          <div style={{ display: "flex", gap: 20, flex: 1, minHeight: 0 }}>
            {/* ── maturity panel ── */}
            <div
              style={{
                flex: 1,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 20,
                padding: 20,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
              }}
            >
              {/* panel header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  <span style={{ fontWeight: 700, fontSize: 15, color: C.title }}>Tingkat Kematangan Layanan</span>
                  <span style={{ fontWeight: 400, fontSize: 12, color: C.muted }}>Periode: Januari – Juni 2024</span>
                </div>
                <span
                  style={{
                    padding: "4px 10px",
                    background: C.greenLight,
                    borderRadius: 12,
                    fontWeight: 600, fontSize: 12, color: C.green,
                  }}
                >
                  Baik
                </span>
              </div>

              {/* chart summary row */}
              <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
                {/* circular score */}
                <div
                  style={{
                    width: 100, height: 100, borderRadius: 50,
                    border: `4px solid ${C.title}`,
                    background: "#F4F8FF",
                    display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 24, color: C.title }}>3.8</span>
                  <span style={{ fontWeight: 400, fontSize: 11, color: C.subtitle }}>dari 5.0</span>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
                  <p style={{ margin: 0, fontWeight: 400, fontSize: 13, lineHeight: "16px", color: C.body }}>
                    Indeks Kematangan Layanan Digital Pemerintah berada pada kategori <strong>BAIK</strong>.
                    Seluruh parameter dipantau berkala.
                  </p>
                  <button
                    style={{
                      boxSizing: "border-box",
                      padding: "8px 16px",
                      border: `1.5px solid ${C.title}`,
                      borderRadius: 6,
                      background: "transparent",
                      fontFamily: "Inter, system-ui, sans-serif",
                      fontWeight: 600, fontSize: 12, color: C.title,
                      cursor: "pointer",
                      alignSelf: "flex-start",
                    }}
                  >
                    Lihat Detail Nilai
                  </button>
                </div>
              </div>

              {/* divider */}
              <div style={{ width: "100%", height: 1, background: C.border }} />

              {/* domain scores */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {domains.map((d, i) => (
                  <ProgressRow key={i} label={d.label} score={d.score} max={d.max} />
                ))}
              </div>
            </div>

            {/* ── risks panel ── */}
            <div
              style={{
                flex: 1,
                boxSizing: "border-box",
                display: "flex",
                flexDirection: "column",
                gap: 16,
                padding: 20,
                background: C.white,
                border: `1px solid ${C.border}`,
                borderRadius: 10,
              }}
            >
              {/* panel header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: 15, color: C.title }}>Risiko Terbaru</span>
                <span
                  style={{
                    padding: "4px 8px",
                    background: C.redLight,
                    borderRadius: 12,
                    fontWeight: 600, fontSize: 11, color: C.red,
                  }}
                >
                  Butuh Tindakan
                </span>
              </div>

              {/* table */}
              <div
                style={{
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  overflow: "hidden",
                  flex: 1,
                }}
              >
                {/* thead */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "80px 1fr 1fr 80px 80px",
                    padding: "10px 16px",
                    background: C.bg,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  {["ID Risiko", "Layanan", "Deskripsi Risiko", "Tingkat", "Status"].map((h) => (
                    <span key={h} style={{ fontWeight: 600, fontSize: 12, color: C.subtitle }}>{h}</span>
                  ))}
                </div>

                {/* rows */}
                {risks.map((r, i) => (
                  <div
                    key={r.id}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "80px 1fr 1fr 80px 80px",
                      padding: "12px 16px",
                      alignItems: "center",
                      borderBottom: i < risks.length - 1 ? `1px solid ${C.border}` : "none",
                    }}
                  >
                    <span style={{ fontWeight: 600, fontSize: 13, color: C.title }}>{r.id}</span>
                    <span style={{ fontWeight: 500, fontSize: 13, color: C.title }}>{r.service}</span>
                    <span style={{ fontWeight: 400, fontSize: 13, color: C.body, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.desc}</span>
                    <RiskBadge level={r.level} color={r.levelColor} bg={r.levelBg} />
                    <span style={{ fontWeight: 500, fontSize: 13, color: C.title }}>{r.status}</span>
                  </div>
                ))}
              </div>

              {/* table action */}
              <div style={{ display: "flex", justifyContent: "center", paddingTop: 8 }}>
                <a
                  href="#"
                  onClick={(e) => e.preventDefault()}
                  style={{
                    fontWeight: 600, fontSize: 13,
                    color: C.title,
                    textDecoration: "underline",
                    cursor: "pointer",
                  }}
                >
                  Lihat Semua Risiko Layanan →
                </a>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}