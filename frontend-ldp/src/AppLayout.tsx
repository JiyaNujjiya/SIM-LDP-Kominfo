import { useState } from "react";
import {
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";

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
  ChevronDown,
  ChevronRight,
} from "lucide-react";

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
  red: "#EF4444",
};

type AppLayoutProps = {
  onLogout: () => void;
};

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
  {
    id: "bcp",
    label: "Manajemen Keberlangsungan",
    Icon: RotateCw,
  },
  {
    id: "pengetahuan",
    label: "Manajemen Pengetahuan",
    Icon: BookOpen,
  },
  {
    id: "keamanan",
    label: "Manajemen Keamanan",
    Icon: ShieldCheck,
  },
  {
    id: "relasi",
    label: "Manajemen Relasi Pengguna",
    Icon: UserRound,
  },
  {
    id: "aset",
    label: "Layanan Digital",
    Icon: Layers3,
  },
  {
    id: "kepatuhan",
    label: "Kertas Kerja",
    Icon: FileCheck,
  },
  {
    id: "pelaporan",
    label: "Laporan",
    Icon: BarChart3,
  },
  {
    id: "pengaturan",
    label: "Pengaturan",
    Icon: Settings,
  },
];

const subMenuStyle = (active: boolean) => ({
  width: "100%",
  border: "none",
  background: active
    ? "rgba(255,255,255,0.12)"
    : "transparent",
  color: "#E8F0FE",
  padding: "9px 12px",
  borderRadius: 6,
  textAlign: "left" as const,
  fontSize: 11,
  lineHeight: "15px",
  cursor: "pointer",
  fontWeight: active ? 600 : 400,
});

export default function AppLayout({
  onLogout,
}: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);

  const [riskOpen, setRiskOpen] = useState(
    location.pathname.startsWith("/risiko")
  );

  const [riskForm3Open, setRiskForm3Open] =
    useState(
      location.pathname.startsWith(
        "/risiko/peta-risiko"
      ) ||
        location.pathname.startsWith(
          "/risiko/monitoring"
        )
    );

  const savedUser = localStorage.getItem("user");
  const user = savedUser
    ? JSON.parse(savedUser)
    : null;

  const permissions: string[] =
    user?.permissions || [];

  const can = (permission?: string) => {
    if (!permission) return true;

    return permissions.includes(permission);
  };

  const sidebarW = collapsed ? 64 : 220;

  const isActive = (path: string) =>
    location.pathname === path;

  const risikoActive =
    location.pathname.startsWith("/risiko");

  const getBreadcrumb = () => {
    const path = location.pathname;

    if (path === "/risiko/overview") {
      return {
        parent: "Manajemen Risiko",
        current: "Overview",
      }
    }

    if (path === "/risiko/konteks") {
      return {
        parent: "Manajemen Risiko",
        current: "Penetapan Konteks",
      };
    }

    if (path === "/risiko") {
      return {
        parent: "Manajemen Risiko",
        current: "Profil dan Penilaian Risiko",
      };
    }

    if (
      path === "/risiko/layanan-prioritas"
    ) {
      return {
        parent: "Manajemen Risiko",
        current: "Daftar Layanan Digital Prioritas",
      };
    }

    if (path === "/risiko/peta-risiko") {
      return {
        parent: "Manajemen Risiko",
        current: "Peta Risiko",
      };
    }

    if (
      path ===
      "/risiko/monitoring/semester-1"
    ) {
      return {
        parent: "Manajemen Risiko",
        current: "Monitoring Semester I",
      };
    }

    if (
      path ===
      "/risiko/monitoring/semester-2"
    ) {
      return {
        parent: "Manajemen Risiko",
        current: "Monitoring Semester II",
      };
    }

    if (
      path ===
      "/risiko/monitoring/tahunan"
    ) {
      return {
        parent: "Manajemen Risiko",
        current: "Monitoring Tahunan",
      };
    }

    return {
      parent: "",
      current: "Dashboard",
    };
  };

  const breadcrumb = getBreadcrumb();

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        minHeight: "100vh",
        background: C.bg,
        fontFamily:
          "Inter, system-ui, sans-serif",
      }}
    >
      {/* SIDEBAR */}
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
        {/* BRAND */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 31,
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              background:
                "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              fontWeight: 800,
              fontSize: 14,
              flexShrink: 0,
            }}
          >
            S
          </div>

          {!collapsed && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 14,
                  color: "#FFF",
                }}
              >
                SIM-LDP
              </span>

              <span
                style={{
                  fontWeight: 500,
                  fontSize: 10,
                  color: C.sidebarText,
                }}
              >
                Layanan Digital Pemerintah
              </span>
            </div>
          )}
        </div>

        {/* MENU */}
        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 1,
          }}
        >
          {menuItems
            .filter((m) =>
              can(m.permission)
            )
            .map((m) => {
              if (collapsed) {
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      if (
                        m.id === "dashboard"
                      ) {
                        navigate("/dashboard");
                      }

                      if (
                        m.id === "risiko"
                      ) {
                        navigate(
                          "/risiko/overview"
                        );
                      }
                    }}
                    title={m.label}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent:
                        "center",
                      width: 32,
                      height: 42,
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      background:
                        m.id === "risiko"
                          ? risikoActive
                            ? C.sidebarActive
                            : "transparent"
                          : m.id ===
                              "dashboard" &&
                            isActive(
                              "/dashboard"
                            )
                          ? C.sidebarActive
                          : "transparent",
                    }}
                  >
                    <m.Icon
                      size={18}
                      color={
                        C.sidebarText
                      }
                      strokeWidth={2}
                    />
                  </button>
                );
              }

              if (m.id === "risiko") {
                return (
                  <div key={m.id}>
                    <button
                      type="button"
                      onClick={() => {
                        navigate("/risiko/overview");
                        setRiskOpen(true)
                      }}
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 12,
                        padding:
                          "12px 16px",
                        width: "100%",
                        border: "none",
                        borderRadius: 6,
                        background:
                          risikoActive
                            ? C.sidebarActive
                            : "transparent",
                        cursor: "pointer",
                      }}
                    >
                      <ShieldAlert
                        size={18}
                        color={
                          C.sidebarText
                        }
                        strokeWidth={2}
                      />

                      <span
                        style={{
                          flex: 1,
                          textAlign:
                            "left",
                          fontWeight: 500,
                          fontSize: 13,
                          color:
                            C.sidebarText,
                        }}
                      >
                        Manajemen Risiko
                      </span>

                      {riskOpen ? (
                        <ChevronDown
                          size={16}
                          color={
                            C.sidebarText
                          }
                        />
                      ) : (
                        <ChevronRight
                          size={16}
                          color={
                            C.sidebarText
                          }
                        />
                      )}
                    </button>

                    {riskOpen && (
                      <div
                        style={{
                          display: "flex",
                          flexDirection:
                            "column",
                          marginLeft: 28,
                          marginTop: 4,
                          gap: 2,
                        }}
                      >
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/risiko/konteks"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/risiko/konteks"
                            )
                          )}
                        >
                          0.0 Penetapan Konteks
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/risiko"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/risiko"
                            )
                          )}
                        >
                          1.0 Profil dan Penilaian Risiko
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/risiko/layanan-prioritas"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/risiko/layanan-prioritas"
                            )
                          )}
                        >
                          2.0 Daftar Layanan Online Prioritas
                        </button>

                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setRiskForm3Open(
                                !riskForm3Open
                              )
                            }
                            style={{
                              ...subMenuStyle(
                                location.pathname.startsWith(
                                  "/risiko/peta-risiko"
                                ) ||
                                  location.pathname.startsWith(
                                    "/risiko/monitoring"
                                  )
                              ),
                              display:
                                "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                            }}
                          >
                            <span>
                              3.0 Pemantauan dan Pelaporan
                            </span>

                            {riskForm3Open ? (
                              <ChevronDown
                                size={14}
                              />
                            ) : (
                              <ChevronRight
                                size={14}
                              />
                            )}
                          </button>

                          {riskForm3Open && (
                            <div
                              style={{
                                display:
                                  "flex",
                                flexDirection:
                                  "column",
                                marginLeft: 18,
                                marginTop: 2,
                                gap: 2,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    "/risiko/peta-risiko"
                                  )
                                }
                                style={subMenuStyle(
                                  isActive(
                                    "/risiko/peta-risiko"
                                  )
                                )}
                              >
                                Peta Risiko
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    "/risiko/monitoring/semester-1"
                                  )
                                }
                                style={subMenuStyle(
                                  isActive(
                                    "/risiko/monitoring/semester-1"
                                  )
                                )}
                              >
                                Monitoring Semester I
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    "/risiko/monitoring/semester-2"
                                  )
                                }
                                style={subMenuStyle(
                                  isActive(
                                    "/risiko/monitoring/semester-2"
                                  )
                                )}
                              >
                                Monitoring Semester II
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    "/risiko/monitoring/tahunan"
                                  )
                                }
                                style={subMenuStyle(
                                  isActive(
                                    "/risiko/monitoring/tahunan"
                                  )
                                )}
                              >
                                Monitoring Tahunan
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    if (
                      m.id ===
                      "dashboard"
                    ) {
                      navigate(
                        "/dashboard"
                      );
                    }
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding:
                      "12px 16px",
                    width: "100%",
                    border: "none",
                    borderRadius: 6,
                    background:
                      m.id ===
                        "dashboard" &&
                      isActive(
                        "/dashboard"
                      )
                        ? C.sidebarActive
                        : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <m.Icon
                    size={18}
                    color={C.sidebarText}
                    strokeWidth={2}
                  />

                  <span
                    style={{
                      fontSize: 13,
                      color:
                        C.sidebarText,
                    }}
                  >
                    {m.label}
                  </span>
                </button>
              );
            })}
        </nav>

        {/* COLLAPSE */}
        <button
          type="button"
          onClick={() =>
            setCollapsed(!collapsed)
          }
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            border: "none",
            borderRadius: 6,
            background:
              C.sidebarActive,
            cursor: "pointer",
            justifyContent:
              collapsed
                ? "center"
                : "flex-start",
          }}
        >
          <ArrowLeft
            size={16}
            color={C.sidebarText}
            strokeWidth={2}
            style={{
              transform: collapsed
                ? "rotate(180deg)"
                : "none",
              transition:
                "transform .25s",
            }}
          />

          {!collapsed && (
            <span
              style={{
                fontSize: 12,
                color:
                  C.sidebarText,
              }}
            >
              Sembunyikan Menu
            </span>
          )}
        </button>
      </aside>

      {/* WORKSPACE */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
        {/* TOPBAR */}
        <header
          style={{
            boxSizing: "border-box",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems: "center",
            padding: "0 24px",
            height: 72,
            background: C.white,
            borderBottom: `1px solid ${C.border}`,
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                Beranda
              </span>

              {breadcrumb.parent && (
                <>
                  <span
                    style={{
                      fontSize: 12,
                      color:
                        C.muted,
                    }}
                  >
                    &gt;
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color:
                        C.muted,
                    }}
                  >
                    {
                      breadcrumb.parent
                    }
                  </span>
                </>
              )}

              <span
                style={{
                  fontSize: 12,
                  color: C.muted,
                }}
              >
                &gt;
              </span>

              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.title,
                }}
              >
                {breadcrumb.current}
              </span>
            </div>

            <span
              style={{
                fontWeight: 700,
                fontSize: 13,
                color: C.subtitle,
              }}
            >
              Kementerian Komunikasi dan Informatika
            </span>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 8,
                padding:
                  "8px 12px",
                width: 220,
                height: 32,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
              }}
            >
              <Search
                size={16}
                color={C.muted}
              />

              <span
                style={{
                  fontSize: 13,
                  color: C.muted,
                }}
              >
                Cari layanan...
              </span>
            </div>

            <div
              style={{
                position:
                  "relative",
                width: 36,
                height: 36,
                display: "flex",
                alignItems:
                  "center",
                justifyContent:
                  "center",
                background: C.bg,
                borderRadius: 8,
              }}
            >
              <Bell
                size={18}
                color={C.title}
              />

              <div
                style={{
                  position:
                    "absolute",
                  top: 6,
                  right: 6,
                  width: 8,
                  height: 8,
                  background: C.red,
                  borderRadius: 4,
                }}
              />
            </div>

            <div
              style={{
                display: "flex",
                alignItems:
                  "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection:
                    "column",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color:
                      C.title,
                  }}
                >
                  {user?.nama ||
                    user?.name ||
                    "Administrator"}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color:
                      C.muted,
                  }}
                >
                  Administrator
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="text-xs font-semibold text-red-600 hover:text-red-700"
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main
          style={{
            flex: 1,
            padding: 24,
            overflowY: "auto",
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}