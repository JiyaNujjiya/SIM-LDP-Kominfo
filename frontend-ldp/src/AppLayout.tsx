import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShieldAlert,
  RotateCw,
  BookOpen,
  ShieldCheck,
  UserRound,
  ArrowLeft,
  Bell,
  ChevronDown,
  ChevronRight,
  LogOut,
  UserCog,
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
  read_at: string | null;
  due_at: string | null;
  created_at: string;
};

type MenuItem = {
  id: string;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    color?: string;
    strokeWidth?: number;
  }>;
  permission?: string;
  adminOnly?: boolean;
};

const menuItems: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    Icon: LayoutDashboard,
    permission: "dashboard.view",
  },
  {
    id: "accounts",
    label: "Kelola Akun",
    Icon: UserCog,
    adminOnly: true,
  },
  {
    id: "risiko",
    label: "Manajemen Risiko",
    Icon: ShieldAlert,
    permission: "risk.view",
  },
  {
    id: "perubahan",
    label: "Manajemen Perubahan",
    Icon: RotateCw,
    permission: "change.view",
  },
  {
    id: "pengetahuan",
    label: "Manajemen Pengetahuan",
    Icon: BookOpen,
    permission: "knowledge.view",
  },
  {
    id: "bcp",
    label: "Manajemen Keberlangsungan",
    Icon: ShieldCheck,
    permission: "continuity.view",
  },
  {
    id: "relasi-pengguna",
    label: "Manajemen Relasi Pengguna",
    Icon: UserRound,
    permission: "user_relation.view",
  },
];

const subMenuStyle = (active: boolean) => ({
  width: "100%",
  border: "none",
  background: active ? "rgba(255,255,255,0.12)" : "transparent",
  color: C.sidebarText,
  padding: "9px 12px",
  borderRadius: 6,
  textAlign: "left" as const,
  fontSize: 11,
  lineHeight: "15px",
  cursor: "pointer",
  fontWeight: active ? 600 : 400,
});

export default function AppLayout({ onLogout }: AppLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState(false);
  const [riskOpen, setRiskOpen] = useState(location.pathname.startsWith("/risiko"));
  const [riskForm3Open, setRiskForm3Open] = useState(
    location.pathname.startsWith("/risiko/peta-risiko") ||
      location.pathname.startsWith("/risiko/monitoring")
  );
  const [changeOpen, setChangeOpen] = useState(location.pathname.startsWith("/perubahan"));
  const [knowledgeOpen, setKnowledgeOpen] = useState(location.pathname.startsWith("/pengetahuan"));
  const [continuityOpen, setContinuityOpen] = useState(
    location.pathname.startsWith("/keberlangsungan")
  );
  const [userRelationOpen, setUserRelationOpen] = useState(
    location.pathname.startsWith("/relasi-pengguna")
  );
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const savedUser = sessionStorage.getItem("user");

  let user: any = null;

  if (savedUser) {
    try {
      user = JSON.parse(savedUser);
    } catch {
      user = null;
    }
  }

  const permissions: string[] = user?.permissions || [];

  const can = (permission?: string) => {
    if (!permission) return true;
    return permissions.includes(permission);
  };

  const normalizedRole = String(
    user?.nama_role || user?.role_name || user?.role || ""
  )
    .trim()
    .toLowerCase();

  const isAdmin = Number(user?.role_id) === 1 || normalizedRole === "admin";

  const roleLabel = (() => {
    if (normalizedRole === "admin") return "Administrator";
    if (normalizedRole === "pengelola") return "Pengelola LDP";
    if (normalizedRole === "pimpinan") return "Pimpinan";
    if (normalizedRole === "auditor") return "Auditor";

    if (Number(user?.role_id) === 1) return "Administrator";
    if (Number(user?.role_id) === 2) return "Pengelola LDP";
    if (Number(user?.role_id) === 3) return "Pimpinan";
    if (Number(user?.role_id) === 4) return "Auditor";

    return user?.role || "-";
  })();

  const sidebarW = collapsed ? 64 : 220;

  const isActive = (path: string) => location.pathname === path;

  const risikoActive = location.pathname.startsWith("/risiko");
  const perubahanActive = location.pathname.startsWith("/perubahan");
  const pengetahuanActive = location.pathname.startsWith("/pengetahuan");
  const keberlangsunganActive = location.pathname.startsWith("/keberlangsungan");
  const relasiPenggunaActive = location.pathname.startsWith("/relasi-pengguna");
  const accountsActive = location.pathname.startsWith("/admin/accounts");

  const closeAllMenus = () => {
    setRiskOpen(false);
    setChangeOpen(false);
    setKnowledgeOpen(false);
    setContinuityOpen(false);
    setUserRelationOpen(false);
  };

  const getBreadcrumb = () => {
    const path = location.pathname;

    if (path === "/dashboard") {
      return { parent: "", current: "Dashboard" };
    }

    if (path === "/admin/accounts") {
      return { parent: "Administrasi", current: "Kelola Akun" };
    }

    if (path === "/risiko/overview") {
      return { parent: "Manajemen Risiko", current: "Overview" };
    }

    if (path === "/risiko/konteks") {
      return { parent: "Manajemen Risiko", current: "Penetapan Konteks" };
    }

    if (path === "/risiko") {
      return {
        parent: "Manajemen Risiko",
        current: "Profil dan Penilaian Risiko",
      };
    }

    if (path === "/risiko/layanan-prioritas") {
      return {
        parent: "Manajemen Risiko",
        current: "Daftar Layanan Digital Prioritas",
      };
    }

    if (path === "/risiko/peta-risiko") {
      return { parent: "Manajemen Risiko", current: "Peta Risiko" };
    }

    if (path === "/risiko/monitoring/semester-1") {
      return {
        parent: "Manajemen Risiko",
        current: "Monitoring Semester I",
      };
    }

    if (path === "/risiko/monitoring/semester-2") {
      return {
        parent: "Manajemen Risiko",
        current: "Monitoring Semester II",
      };
    }

    if (path === "/risiko/monitoring/tahunan") {
      return {
        parent: "Manajemen Risiko",
        current: "Monitoring Tahunan",
      };
    }

    if (path === "/perubahan/perencanaan") {
      return {
        parent: "Manajemen Perubahan",
        current: "MPR01 - Perencanaan Perubahan",
      };
    }

    if (path === "/perubahan/analisis") {
      return {
        parent: "Manajemen Perubahan",
        current: "MPR02 - Analisis Dampak",
      };
    }

    if (path === "/perubahan/implementasi") {
      return {
        parent: "Manajemen Perubahan",
        current: "MPR03 - Implementasi Perubahan",
      };
    }

    if (path === "/perubahan/evaluasi") {
      return {
        parent: "Manajemen Perubahan",
        current: "Evaluasi Perubahan",
      };
    }

    if (path === "/perubahan/logbook") {
      return {
        parent: "Manajemen Perubahan",
        current: "MPR05 - Logbook Perubahan",
      };
    }

    if (path === "/pengetahuan/perencanaan") {
      return {
        parent: "Manajemen Pengetahuan",
        current: "MPN01 - Perencanaan Pengetahuan",
      };
    }

    if (path === "/pengetahuan/pengumpulan-pengolahan") {
      return {
        parent: "Manajemen Pengetahuan",
        current: "MPN02 - Pengumpulan & Pengolahan Pengetahuan",
      };
    }

    if (path === "/pengetahuan/pemanfaatan-alih") {
      return {
        parent: "Manajemen Pengetahuan",
        current: "MPN03 - Pemanfaatan & Alih Pengetahuan",
      };
    }

    if (path === "/pengetahuan/evaluasi") {
      return {
        parent: "Manajemen Pengetahuan",
        current: "MPN04 - Evaluasi Pengetahuan",
      };
    }

    if (path === "/keberlangsungan/penetapan-konteks") {
      return {
        parent: "Manajemen Keberlangsungan",
        current: "MKB01 - Penetapan Konteks",
      };
    }

    if (path === "/keberlangsungan/analisis-dampak-bisnis") {
      return {
        parent: "Manajemen Keberlangsungan",
        current: "MKB02 - Business Impact Analysis (BIA)",
      };
    }

    if (path === "/keberlangsungan/strategi") {
      return {
        parent: "Manajemen Keberlangsungan",
        current: "MKB03 - Strategi Keberlangsungan Bisnis (BCS)",
      };
    }

    if (path === "/keberlangsungan/uji-evaluasi") {
      return {
        parent: "Manajemen Keberlangsungan",
        current: "MKB04 Ujicoba & Evaluasi",
      };
    }

    if (path === "/relasi-pengguna/perencanaan") {
      return {
        parent: "Manajemen Relasi Pengguna",
        current: "MRP01 - Perencanaan Layanan",
      };
    }

    if (path === "/relasi-pengguna/permintaan") {
      return {
        parent: "Manajemen Relasi Pengguna",
        current: "MRP02 - Permintaan Layanan",
      };
    }

    if (path === "/relasi-pengguna/penanganan") {
      return {
        parent: "Manajemen Relasi Pengguna",
        current: "MRP03 - Penanganan Kueri",
      };
    }

    if (path === "/relasi-pengguna/evaluasi") {
      return {
        parent: "Manajemen Relasi Pengguna",
        current: "MRP04 - Evaluasi",
      };
    }

    return { parent: "", current: "Dashboard" };
  };

  const breadcrumb = getBreadcrumb();

  const fetchNotifications = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications?limit=20",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      const result = await response.json();

      setNotifications(Array.isArray(result?.data) ? result.data : []);
      setUnreadCount(Number(result?.unread_count || 0));
    } catch {
      return;
    }
  };

  const markNotificationAsRead = async (notification: NotificationItem) => {
    const token = sessionStorage.getItem("token");

    if (!token) return;

    try {
      if (!Boolean(notification.is_read)) {
        const response = await fetch(
          `http://localhost:5000/api/notifications/${notification.id}/read`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) return;
      }

      setNotificationOpen(false);
      await fetchNotifications();

      if (notification.action_url) {
        navigate(notification.action_url);
      }
    } catch {
      return;
    }
  };

  const markAllNotificationsAsRead = async () => {
    const token = sessionStorage.getItem("token");

    if (!token) return;

    try {
      const response = await fetch(
        "http://localhost:5000/api/notifications/read-all",
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) return;

      await fetchNotifications();
    } catch {
      return;
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = window.setInterval(fetchNotifications, 30000);

    const handleFocus = () => {
      fetchNotifications();
    };

    window.addEventListener("focus", handleFocus);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener("focus", handleFocus);
    };
  }, []);

  const collapsedNavigate = (id: string) => {
    if (id === "dashboard") {
      navigate("/dashboard");
      return;
    }

    if (id === "accounts") {
      navigate("/admin/accounts");
      return;
    }

    if (id === "risiko") {
      navigate("/risiko/overview");
      return;
    }

    if (id === "perubahan") {
      navigate("/perubahan/perencanaan");
      return;
    }

    if (id === "pengetahuan") {
      navigate("/pengetahuan/perencanaan");
      return;
    }

    if (id === "bcp") {
      navigate("/keberlangsungan/penetapan-konteks");
      return;
    }

    if (id === "relasi-pengguna") {
      navigate("/relasi-pengguna/perencanaan");
    }
  };

  const collapsedActive = (id: string) => {
    if (id === "dashboard") return isActive("/dashboard");
    if (id === "accounts") return accountsActive;
    if (id === "risiko") return risikoActive;
    if (id === "perubahan") return perubahanActive;
    if (id === "pengetahuan") return pengetahuanActive;
    if (id === "bcp") return keberlangsunganActive;
    if (id === "relasi-pengguna") return relasiPenggunaActive;

    return false;
  };

  const moduleButtonStyle = (active: boolean) => ({
    display: "flex",
    alignItems: "center",
    gap: 12,
    padding: "12px 16px",
    width: "100%",
    border: "none",
    borderRadius: 6,
    background: active ? C.sidebarActive : "transparent",
    cursor: "pointer",
  });

  const moduleTextStyle = {
    flex: 1,
    textAlign: "left" as const,
    fontWeight: 500,
    fontSize: 13,
    color: C.sidebarText,
  };

  const subMenuContainerStyle = {
    display: "flex",
    flexDirection: "column" as const,
    marginLeft: 28,
    marginTop: 4,
    gap: 2,
  };

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
              background: "linear-gradient(135deg, #3B82F6, #1D4ED8)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
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
                  color: "#FFFFFF",
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

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 1,
          }}
        >
          {menuItems
            .filter((item) => {
              if (item.adminOnly) return isAdmin;
              return can(item.permission);
            })
            .map((item) => {
              if (collapsed) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    title={item.label}
                    onClick={() => collapsedNavigate(item.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 42,
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                      background: collapsedActive(item.id)
                        ? C.sidebarActive
                        : "transparent",
                    }}
                  >
                    <item.Icon
                      size={18}
                      color={C.sidebarText}
                      strokeWidth={2}
                    />
                  </button>
                );
              }

              if (item.id === "risiko") {
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        setRiskOpen(true);
                        navigate("/risiko/overview");
                      }}
                      style={moduleButtonStyle(risikoActive)}
                    >
                      <ShieldAlert
                        size={18}
                        color={C.sidebarText}
                        strokeWidth={2}
                      />

                      <span style={moduleTextStyle}>
                        Manajemen Risiko
                      </span>

                      {riskOpen ? (
                        <ChevronDown size={16} color={C.sidebarText} />
                      ) : (
                        <ChevronRight size={16} color={C.sidebarText} />
                      )}
                    </button>

                    {riskOpen && (
                      <div style={subMenuContainerStyle}>
                        <button
                          type="button"
                          onClick={() => navigate("/risiko/konteks")}
                          style={subMenuStyle(
                            isActive("/risiko/konteks")
                          )}
                        >
                          Form 0.0 Penetapan Konteks
                        </button>

                        <button
                          type="button"
                          onClick={() => navigate("/risiko")}
                          style={subMenuStyle(isActive("/risiko"))}
                        >
                          Form 1.0 Profil dan Penilaian Risiko
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/risiko/layanan-prioritas")
                          }
                          style={subMenuStyle(
                            isActive("/risiko/layanan-prioritas")
                          )}
                        >
                          Form 2.0 Daftar Layanan Online Prioritas
                        </button>

                        <div>
                          <button
                            type="button"
                            onClick={() =>
                              setRiskForm3Open(!riskForm3Open)
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
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <span>
                              Form 3.0 Peta Risiko dan Monitoring
                            </span>

                            {riskForm3Open ? (
                              <ChevronDown size={14} />
                            ) : (
                              <ChevronRight size={14} />
                            )}
                          </button>

                          {riskForm3Open && (
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                marginLeft: 18,
                                marginTop: 2,
                                gap: 2,
                              }}
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  navigate("/risiko/peta-risiko")
                                }
                                style={subMenuStyle(
                                  isActive("/risiko/peta-risiko")
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

              if (item.id === "perubahan") {
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        setChangeOpen(true);
                        navigate("/perubahan/perencanaan");
                      }}
                      style={moduleButtonStyle(perubahanActive)}
                    >
                      <RotateCw
                        size={18}
                        color={C.sidebarText}
                        strokeWidth={2}
                      />

                      <span style={moduleTextStyle}>
                        Manajemen Perubahan
                      </span>

                      {changeOpen ? (
                        <ChevronDown size={16} color={C.sidebarText} />
                      ) : (
                        <ChevronRight size={16} color={C.sidebarText} />
                      )}
                    </button>

                    {changeOpen && (
                      <div style={subMenuContainerStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/perubahan/perencanaan")
                          }
                          style={subMenuStyle(
                            isActive("/perubahan/perencanaan")
                          )}
                        >
                          MPR01 Perencanaan Perubahan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/perubahan/analisis")
                          }
                          style={subMenuStyle(
                            isActive("/perubahan/analisis")
                          )}
                        >
                          MPR02 Analisis Dampak
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/perubahan/implementasi")
                          }
                          style={subMenuStyle(
                            isActive("/perubahan/implementasi")
                          )}
                        >
                          MPR03 Implementasi Perubahan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/perubahan/evaluasi")
                          }
                          style={subMenuStyle(
                            isActive("/perubahan/evaluasi")
                          )}
                        >
                          Evaluasi Perubahan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/perubahan/logbook")
                          }
                          style={subMenuStyle(
                            isActive("/perubahan/logbook")
                          )}
                        >
                          MPR05 Logbook Perubahan
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (item.id === "pengetahuan") {
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        setKnowledgeOpen(true);
                        navigate("/pengetahuan/perencanaan");
                      }}
                      style={moduleButtonStyle(pengetahuanActive)}
                    >
                      <BookOpen
                        size={18}
                        color={C.sidebarText}
                        strokeWidth={2}
                      />

                      <span style={moduleTextStyle}>
                        Manajemen Pengetahuan
                      </span>

                      {knowledgeOpen ? (
                        <ChevronDown size={16} color={C.sidebarText} />
                      ) : (
                        <ChevronRight size={16} color={C.sidebarText} />
                      )}
                    </button>

                    {knowledgeOpen && (
                      <div style={subMenuContainerStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate("/pengetahuan/perencanaan")
                          }
                          style={subMenuStyle(
                            isActive("/pengetahuan/perencanaan")
                          )}
                        >
                          MPN01 Perencanaan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/pengetahuan/pengumpulan-pengolahan"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/pengetahuan/pengumpulan-pengolahan"
                            )
                          )}
                        >
                          MPN02 Pengumpulan & Pengolahan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/pengetahuan/pemanfaatan-alih")
                          }
                          style={subMenuStyle(
                            isActive(
                              "/pengetahuan/pemanfaatan-alih"
                            )
                          )}
                        >
                          MPN03 Pemanfaatan & Alih Pengetahuan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/pengetahuan/evaluasi")
                          }
                          style={subMenuStyle(
                            isActive("/pengetahuan/evaluasi")
                          )}
                        >
                          MPN04 Evaluasi
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (item.id === "bcp") {
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        setContinuityOpen(true);
                        navigate(
                          "/keberlangsungan/penetapan-konteks"
                        );
                      }}
                      style={moduleButtonStyle(
                        keberlangsunganActive
                      )}
                    >
                      <ShieldCheck
                        size={18}
                        color={C.sidebarText}
                        strokeWidth={2}
                      />

                      <span style={moduleTextStyle}>
                        Manajemen Keberlangsungan
                      </span>

                      {continuityOpen ? (
                        <ChevronDown size={16} color={C.sidebarText} />
                      ) : (
                        <ChevronRight size={16} color={C.sidebarText} />
                      )}
                    </button>

                    {continuityOpen && (
                      <div style={subMenuContainerStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/keberlangsungan/penetapan-konteks"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/keberlangsungan/penetapan-konteks"
                            )
                          )}
                        >
                          MKB01 Penetapan Konteks
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/keberlangsungan/analisis-dampak-bisnis"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/keberlangsungan/analisis-dampak-bisnis"
                            )
                          )}
                        >
                          MKB02 Business Impact Analysis (BIA)
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/keberlangsungan/strategi")
                          }
                          style={subMenuStyle(
                            isActive("/keberlangsungan/strategi")
                          )}
                        >
                          MKB03 Strategi Keberlangsungan Bisnis
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/keberlangsungan/uji-evaluasi"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/keberlangsungan/uji-evaluasi"
                            )
                          )}
                        >
                          MKB04 Ujicoba & Evaluasi
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              if (item.id === "relasi-pengguna") {
                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      onClick={() => {
                        closeAllMenus();
                        setUserRelationOpen(true);
                        navigate("/relasi-pengguna/perencanaan");
                      }}
                      style={moduleButtonStyle(
                        relasiPenggunaActive
                      )}
                    >
                      <UserRound
                        size={18}
                        color={C.sidebarText}
                        strokeWidth={2}
                      />

                      <span style={moduleTextStyle}>
                        Manajemen Relasi Pengguna
                      </span>

                      {userRelationOpen ? (
                        <ChevronDown size={16} color={C.sidebarText} />
                      ) : (
                        <ChevronRight size={16} color={C.sidebarText} />
                      )}
                    </button>

                    {userRelationOpen && (
                      <div style={subMenuContainerStyle}>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/relasi-pengguna/perencanaan"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/relasi-pengguna/perencanaan"
                            )
                          )}
                        >
                          MRP01 Perencanaan Layanan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/relasi-pengguna/permintaan"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/relasi-pengguna/permintaan"
                            )
                          )}
                        >
                          MRP02 Permintaan Layanan
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              "/relasi-pengguna/penanganan"
                            )
                          }
                          style={subMenuStyle(
                            isActive(
                              "/relasi-pengguna/penanganan"
                            )
                          )}
                        >
                          MRP03 Penanganan Kueri
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            navigate("/relasi-pengguna/evaluasi")
                          }
                          style={subMenuStyle(
                            isActive("/relasi-pengguna/evaluasi")
                          )}
                        >
                          MRP04 Evaluasi
                        </button>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => collapsedNavigate(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 16px",
                    width: "100%",
                    border: "none",
                    borderRadius: 6,
                    background: collapsedActive(item.id)
                      ? C.sidebarActive
                      : "transparent",
                    cursor: "pointer",
                  }}
                >
                  <item.Icon
                    size={18}
                    color={C.sidebarText}
                    strokeWidth={2}
                  />

                  <span
                    style={{
                      fontSize: 13,
                      color: C.sidebarText,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              );
            })}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 12,
            border: "none",
            borderRadius: 6,
            background: C.sidebarActive,
            cursor: "pointer",
            justifyContent: collapsed ? "center" : "flex-start",
          }}
        >
          <ArrowLeft
            size={16}
            color={C.sidebarText}
            strokeWidth={2}
            style={{
              transform: collapsed ? "rotate(180deg)" : "none",
              transition: "transform .25s",
            }}
          />

          {!collapsed && (
            <span
              style={{
                fontSize: 12,
                color: C.sidebarText,
              }}
            >
              Kecilkan Menu
            </span>
          )}
        </button>
      </aside>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
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
                      color: C.muted,
                    }}
                  >
                    &gt;
                  </span>

                  <span
                    style={{
                      fontSize: 12,
                      color: C.muted,
                    }}
                  >
                    {breadcrumb.parent}
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
                position: "relative",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  const nextOpen = !notificationOpen;
                  setNotificationOpen(nextOpen);

                  if (nextOpen) {
                    fetchNotifications();
                  }
                }}
                style={{
                  position: "relative",
                  width: 36,
                  height: 36,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: C.bg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <Bell size={18} color={C.title} />

                {unreadCount > 0 && (
                  <div
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      minWidth: 18,
                      height: 18,
                      padding: "0 5px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: C.red,
                      border: "2px solid #FFFFFF",
                      borderRadius: 999,
                      color: "#FFFFFF",
                      fontSize: 9,
                      fontWeight: 700,
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </div>
                )}
              </button>

              {notificationOpen && (
                <div
                  style={{
                    position: "absolute",
                    top: 44,
                    right: 0,
                    width: 360,
                    maxHeight: 480,
                    overflowY: "auto",
                    background: "#FFFFFF",
                    border: `1px solid ${C.border}`,
                    borderRadius: 10,
                    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.16)",
                    zIndex: 100,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "14px 16px",
                      borderBottom: `1px solid ${C.border}`,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                          color: C.title,
                        }}
                      >
                        Notifikasi
                      </div>

                      <div
                        style={{
                          marginTop: 2,
                          fontSize: 11,
                          color: C.muted,
                        }}
                      >
                        {unreadCount} belum dibaca
                      </div>
                    </div>

                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsAsRead}
                        style={{
                          border: "none",
                          background: "transparent",
                          color: "#2563EB",
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                  </div>

                  {notifications.length === 0 ? (
                    <div
                      style={{
                        padding: 24,
                        textAlign: "center",
                        fontSize: 12,
                        color: C.muted,
                      }}
                    >
                      Belum ada notifikasi.
                    </div>
                  ) : (
                    notifications.map((notification) => {
                      const unread = !Boolean(notification.is_read);

                      return (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() =>
                            markNotificationAsRead(notification)
                          }
                          style={{
                            width: "100%",
                            padding: "12px 16px",
                            border: "none",
                            borderBottom: `1px solid ${C.border}`,
                            background: unread
                              ? "#EFF6FF"
                              : "#FFFFFF",
                            textAlign: "left",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "flex-start",
                              gap: 10,
                            }}
                          >
                            <div
                              style={{
                                width: 8,
                                height: 8,
                                marginTop: 5,
                                borderRadius: 999,
                                background: unread
                                  ? notification.priority === "URGENT"
                                    ? "#DC2626"
                                    : notification.priority === "HIGH"
                                    ? "#F59E0B"
                                    : "#2563EB"
                                  : "#CBD5E1",
                                flexShrink: 0,
                              }}
                            />

                            <div
                              style={{
                                minWidth: 0,
                                flex: 1,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: unread ? 700 : 600,
                                  color: C.title,
                                }}
                              >
                                {notification.title}
                              </div>

                              <div
                                style={{
                                  marginTop: 4,
                                  fontSize: 11,
                                  lineHeight: "16px",
                                  color: C.body,
                                }}
                              >
                                {notification.message}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 2,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: C.title,
                  }}
                >
                  {user?.nama || user?.name || "Administrator"}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    color: C.muted,
                  }}
                >
                  {roleLabel}
                </span>
              </div>

              <button
                type="button"
                onClick={onLogout}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "8px 10px",
                  border: "1px solid #FCA5A5",
                  borderRadius: 8,
                  background: "#FEF2F2",
                  color: "#DC2626",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all .2s ease",
                }}
                onMouseEnter={(event) => {
                  event.currentTarget.style.background = "#FEE2E2";
                  event.currentTarget.style.borderColor = "#F87171";
                }}
                onMouseLeave={(event) => {
                  event.currentTarget.style.background = "#FEF2F2";
                  event.currentTarget.style.borderColor = "#FCA5A5";
                }}
              >
                <LogOut size={14} strokeWidth={2} />
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