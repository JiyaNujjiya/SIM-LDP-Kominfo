import {
  Award,
  CalendarCheck,
  Layers,
  ShieldAlert,
  XCircle,
} from "lucide-react";

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
  blueLight: "#E8F0FE",
  greenLight: "#D1FAE5",
  redLight: "#FEE2E2",
  amberLight: "#FEF3C7",
};

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

const domains = [
  { label: "Kebijakan Internal", score: 4.2, max: 5 },
  { label: "Tata Kelola", score: 3.5, max: 5 },
  { label: "Layanan Digital", score: 3.9, max: 5 },
  { label: "Teknologi Informasi", score: 3.6, max: 5 },
  { label: "Keamanan Informasi", score: 3.8, max: 5 },
];

const risks = [
  {
    id: "RSK-001",
    service: "Portal Layanan Publik",
    desc: "Kerentanan keamanan sistem",
    level: "Tinggi",
    levelColor: C.red,
    levelBg: C.redLight,
    status: "Mitigasi",
  },
  {
    id: "RSK-002",
    service: "Sistem Kependudukan",
    desc: "Gangguan konektivitas jaringan",
    level: "Sedang",
    levelColor: C.amber,
    levelBg: C.amberLight,
    status: "Monitoring",
  },
  {
    id: "RSK-003",
    service: "E-Procurement",
    desc: "Ketidaksesuaian data vendor",
    level: "Rendah",
    levelColor: C.green,
    levelBg: C.greenLight,
    status: "Selesai",
  },
  {
    id: "RSK-004",
    service: "Sistem Perizinan Online",
    desc: "Overload server saat peak",
    level: "Tinggi",
    levelColor: C.red,
    levelBg: C.redLight,
    status: "Tindakan",
  },
  {
    id: "RSK-005",
    service: "Dashboard Analitik",
    desc: "Inkonsistensi data laporan",
    level: "Sedang",
    levelColor: C.amber,
    levelBg: C.amberLight,
    status: "Monitoring",
  },
];

function KpiCard({ kpi }) {
  const {
    label,
    value,
    trend,
    trendText,
    trendColor,
    iconBg,
    iconColor,
    Icon,
  } = kpi;

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
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 600,
            fontSize: 12,
            color: C.body,
          }}
        >
          {label}
        </span>

        <div
          style={{
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: iconBg,
            borderRadius: 6,
          }}
        >
          <Icon
            size={18}
            color={iconColor}
            strokeWidth={2}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 28,
            lineHeight: "34px",
            color: C.title,
          }}
        >
          {value}
        </span>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 600,
              fontSize: 11,
              color: trendColor,
            }}
          >
            {trend}
          </span>

          <span
            style={{
              fontFamily: "Inter, system-ui, sans-serif",
              fontWeight: 400,
              fontSize: 11,
              color: C.muted,
            }}
          >
            {trendText}
          </span>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({ label, score, max }) {
  const pct = (score / max) * 100;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 500,
            fontSize: 13,
            color: C.title,
          }}
        >
          {label}
        </span>

        <span
          style={{
            fontFamily: "Inter, system-ui, sans-serif",
            fontWeight: 700,
            fontSize: 13,
            color: C.title,
          }}
        >
          {score.toFixed(1)} / {max.toFixed(1)}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          height: 8,
          background: C.border,
          borderRadius: 4,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: 8,
            background: C.title,
            borderRadius: 4,
            transition: "width .4s ease",
          }}
        />
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

export default function SimLdpDashboard() {
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
          flexDirection: "column",
          gap: 4,
        }}
      >
        <h1
          style={{
            margin: 0,
            fontWeight: 700,
            fontSize: 22,
            lineHeight: "27px",
            color: C.title,
          }}
        >
          Dashboard Overview
        </h1>

        <p
          style={{
            margin: 0,
            fontWeight: 400,
            fontSize: 13,
            color: C.body,
          }}
        >
          Ringkasan manajemen layanan digital pemerintah secara terpadu
        </p>
      </div>

      <div
        style={{
          display: "flex",
          gap: 16,
        }}
      >
        {kpis.map((kpi, i) => (
          <KpiCard
            key={i}
            kpi={kpi}
          />
        ))}
      </div>

      <div
        style={{
          display: "flex",
          gap: 20,
          flex: 1,
          minHeight: 0,
        }}
      >
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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: C.title,
                }}
              >
                Tingkat Kematangan Layanan
              </span>

              <span
                style={{
                  fontWeight: 400,
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                Periode: Januari – Juni 2024
              </span>
            </div>

            <span
              style={{
                padding: "4px 10px",
                background: C.greenLight,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 12,
                color: C.green,
              }}
            >
              Baik
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                border: `4px solid ${C.title}`,
                background: "#F4F8FF",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 24,
                  color: C.title,
                }}
              >
                3.8
              </span>

              <span
                style={{
                  fontWeight: 400,
                  fontSize: 11,
                  color: C.subtitle,
                }}
              >
                dari 5.0
              </span>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                flex: 1,
              }}
            >
              <p
                style={{
                  margin: 0,
                  fontWeight: 400,
                  fontSize: 13,
                  lineHeight: "16px",
                  color: C.body,
                }}
              >
                Indeks Kematangan Layanan Digital Pemerintah berada pada kategori{" "}
                <strong>BAIK</strong>. Seluruh parameter dipantau berkala.
              </p>

              <button
                type="button"
                style={{
                  boxSizing: "border-box",
                  padding: "8px 16px",
                  border: `1.5px solid ${C.title}`,
                  borderRadius: 6,
                  background: "transparent",
                  fontFamily: "Inter, system-ui, sans-serif",
                  fontWeight: 600,
                  fontSize: 12,
                  color: C.title,
                  cursor: "pointer",
                  alignSelf: "flex-start",
                }}
              >
                Lihat Detail Nilai
              </button>
            </div>
          </div>

          <div
            style={{
              width: "100%",
              height: 1,
              background: C.border,
            }}
          />

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            {domains.map((domain, i) => (
              <ProgressRow
                key={i}
                label={domain.label}
                score={domain.score}
                max={domain.max}
              />
            ))}
          </div>
        </div>

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
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontWeight: 700,
                fontSize: 15,
                color: C.title,
              }}
            >
              Risiko Terbaru
            </span>

            <span
              style={{
                padding: "4px 8px",
                background: C.redLight,
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 11,
                color: C.red,
              }}
            >
              Butuh Tindakan
            </span>
          </div>

          <div
            style={{
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              overflow: "hidden",
              flex: 1,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "80px 1fr 1fr 80px 80px",
                padding: "10px 16px",
                background: C.bg,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              {[
                "ID Risiko",
                "Layanan",
                "Deskripsi Risiko",
                "Tingkat",
                "Status",
              ].map((heading) => (
                <span
                  key={heading}
                  style={{
                    fontWeight: 600,
                    fontSize: 12,
                    color: C.subtitle,
                  }}
                >
                  {heading}
                </span>
              ))}
            </div>

            {risks.map((risk, i) => (
              <div
                key={risk.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "80px 1fr 1fr 80px 80px",
                  padding: "12px 16px",
                  alignItems: "center",
                  borderBottom:
                    i < risks.length - 1
                      ? `1px solid ${C.border}`
                      : "none",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: C.title,
                  }}
                >
                  {risk.id}
                </span>

                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: C.title,
                  }}
                >
                  {risk.service}
                </span>

                <span
                  style={{
                    fontWeight: 400,
                    fontSize: 13,
                    color: C.body,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {risk.desc}
                </span>

                <RiskBadge
                  level={risk.level}
                  color={risk.levelColor}
                  bg={risk.levelBg}
                />

                <span
                  style={{
                    fontWeight: 500,
                    fontSize: 13,
                    color: C.title,
                  }}
                >
                  {risk.status}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              paddingTop: 8,
            }}
          >
            <a
              href="#"
              onClick={(e) => e.preventDefault()}
              style={{
                fontWeight: 600,
                fontSize: 13,
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
    </div>
  );
}