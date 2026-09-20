import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import RequirePermission from "./requirePermission";
import Login from "./Login";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./Dashboard";
import AppLayout from "./AppLayout";

import RisikoPage from "./pages/RisikoPage";
import KonteksRisikoPage from "./pages/KonteksRisikoPage";
import LayananPrioritasPage from "./pages/LayananPrioritasRisikoPage";
import PetaRisikoPage from "./pages/PetaRisikoPage";
import MonitoringSemester1Page from "./pages/MonitoringSemester1Page";
import MonitoringSemester2Page from "./pages/MonitoringSemester2Page";
import MonitoringTahunanPage from "./pages/MonitoringTahunanPage";
import RiskOverviewPage from "./pages/RiskOverviewPage";

import PerencanaanPerubahanPage from "./pages/PerencanaanPerubahanPage";
import AnalisisPerubahanPage from "./pages/AnalisisPerubahanPage";
import ImplementasiPerubahanPage from "./pages/ImplementasiPerubahanPage";
import EvaluasiPerubahanPage from "./pages/EvaluasiPerubahanPage";
import LogbookPerubahanPage from "./pages/LogbookPerubahanPage";

import PerencanaanPengetahuanPage from "./pages/PerencanaanPengetahuanPage";
import PengumpulanPengolahanPengetahuanPage from "./pages/PengumpulanPengolahanPengetahuanPage";
import PemanfaatanAlihPengetahuanPage from "./pages/PemanfaatanAlihPengetahuanPage";
import EvaluasiPengetahuanPage from "./pages/EvaluasiPengetahuanPage";

import PenetapanKonteksKeberlangsunganPage from "./pages/PenetapanKonteksKeberlangsunganPage";
import AnalisisDampakBisnisPage from "./pages/AnalisisDampakBisnisPage";
import StrategiKeberlangsunganPage from "./pages/StrategiKeberlangsunganPage";
import UjiEvaluasiKeberlangsunganPage from "./pages/UjiEvaluasiKeberlangsunganPage";

import PerencanaanRelasiPenggunaPage from "./pages/PerencanaanRelasiPenggunaPage";
import PermintaanRelasiPenggunaPage from "./pages/PermintaanRelasiPenggunaPage";
import PenangananRelasiPenggunaPage from "./pages/PenangananRelasiPenggunaPage";
import EvaluasiRelasiPenggunaPage from "./pages/EvaluasiRelasiPenggunaPage";

import KelolaAkunPage from "./pages/KelolaAkunPage";

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const savedUser = sessionStorage.getItem("user");

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("token");

    // Bersihkan sisa login lama dari localStorage
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    localStorage.removeItem("rememberMe");

    setUser(null);
  };

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route
            path="/login"
            element={
              <Login
                onLoginSuccess={(userData: any) =>
                  setUser(userData)
                }
              />
            }
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          <Route
            path="*"
            element={<Navigate to="/login" replace />}
          />
        </Routes>
      ) : (
        <Routes>
          <Route
            element={
              <AppLayout onLogout={handleLogout} />
            }
          >
            {/* ================= DASHBOARD ================= */}

            <Route
              path="/dashboard"
              element={<Dashboard />}
            />

            <Route
              path="/admin/accounts"
              element={
                Number(user?.role_id) === 1 ? (
                  <KelolaAkunPage />
                ) : (
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                )
              }
            />

            {/* ================= RISIKO ================= */}

            <Route
              path="/risiko/overview"
              element={
                <RequirePermission permission="risk.view">
                  <RiskOverviewPage />
                </RequirePermission>
              }
            />

            <Route
              path="/risiko/konteks"
              element={
                <RequirePermission permission="risk.view">
                  <KonteksRisikoPage />
                </RequirePermission>
              }
            />

            <Route
              path="/risiko"
              element={
                <RequirePermission permission="risk.view">
                  <RisikoPage />
                </RequirePermission>
              }
            />

            <Route
              path="/risiko/layanan-prioritas"
              element={
                <RequirePermission permission="risk.view">
                  <LayananPrioritasPage />
                </RequirePermission>
              }
            />

            <Route
              path="/risiko/peta-risiko"
              element={
                <RequirePermission permission="risk.view">
                  <PetaRisikoPage />
                </RequirePermission>
              }
            />

            <Route
              path="/risiko/monitoring/semester-1"
              element={
                <RequirePermission permission="risk.view">
                  <MonitoringSemester1Page />
                </RequirePermission>
              }
            />

            <Route
              path="/risiko/monitoring/semester-2"
              element={
                <RequirePermission permission="risk.view">
                  <MonitoringSemester2Page />
                </RequirePermission>
              }
            />

            <Route
              path="/risiko/monitoring/tahunan"
              element={
                <RequirePermission permission="risk.view">
                  <MonitoringTahunanPage />
                </RequirePermission>
              }
            />

            {/* ================= PERUBAHAN ================= */}

            <Route
              path="/perubahan/perencanaan"
              element={
                <RequirePermission permission="change.view">
                  <PerencanaanPerubahanPage />
                </RequirePermission>
              }
            />

            <Route
              path="/perubahan/analisis"
              element={
                <RequirePermission permission="change.view">
                  <AnalisisPerubahanPage />
                </RequirePermission>
              }
            />

            <Route
              path="/perubahan/implementasi"
              element={
                <RequirePermission permission="change.view">
                  <ImplementasiPerubahanPage />
                </RequirePermission>
              }
            />

            <Route
              path="/perubahan/evaluasi"
              element={
                <RequirePermission permission="change.view">
                  <EvaluasiPerubahanPage />
                </RequirePermission>
              }
            />

            <Route
              path="/perubahan/logbook"
              element={
                <RequirePermission permission="change.view">
                  <LogbookPerubahanPage />
                </RequirePermission>
              }
            />

            {/* ================= PENGETAHUAN ================= */}

            <Route
              path="/pengetahuan/perencanaan"
              element={
                <RequirePermission permission="knowledge.view">
                  <PerencanaanPengetahuanPage />
                </RequirePermission>
              }
            />

            <Route
              path="/pengetahuan/pengumpulan-pengolahan"
              element={
                <RequirePermission permission="knowledge.view">
                  <PengumpulanPengolahanPengetahuanPage />
                </RequirePermission>
              }
            />

            <Route
              path="/pengetahuan/pemanfaatan-alih"
              element={
                <RequirePermission permission="knowledge.view">
                  <PemanfaatanAlihPengetahuanPage />
                </RequirePermission>
              }
            />

            <Route
              path="/pengetahuan/evaluasi"
              element={
                <RequirePermission permission="knowledge.view">
                  <EvaluasiPengetahuanPage />
                </RequirePermission>
              }
            />

            {/* ================= KEBERLANGSUNGAN ================= */}

            <Route
              path="/keberlangsungan/penetapan-konteks"
              element={
                <RequirePermission permission="continuity.view">
                  <PenetapanKonteksKeberlangsunganPage />
                </RequirePermission>
              }
            />

            <Route
              path="/keberlangsungan/analisis-dampak-bisnis"
              element={
                <RequirePermission permission="continuity.view">
                  <AnalisisDampakBisnisPage />
                </RequirePermission>
              }
            />

            <Route
              path="/keberlangsungan/strategi"
              element={
                <RequirePermission permission="continuity.view">
                  <StrategiKeberlangsunganPage />
                </RequirePermission>
              }
            />

            <Route
              path="/keberlangsungan/uji-evaluasi"
              element={
                <RequirePermission permission="continuity.view">
                  <UjiEvaluasiKeberlangsunganPage />
                </RequirePermission>
              }
            />

            {/* ================= RELASI PENGGUNA ================= */}

            <Route
              path="/relasi-pengguna/perencanaan"
              element={
                <RequirePermission permission="user_relation.view">
                  <PerencanaanRelasiPenggunaPage />
                </RequirePermission>
              }
            />

            <Route
              path="/relasi-pengguna/permintaan"
              element={
                <RequirePermission permission="user_relation.view">
                  <PermintaanRelasiPenggunaPage />
                </RequirePermission>
              }
            />

            <Route
              path="/relasi-pengguna/penanganan"
              element={
                <RequirePermission permission="user_relation.view">
                  <PenangananRelasiPenggunaPage />
                </RequirePermission>
              }
            />

            <Route
              path="/relasi-pengguna/evaluasi"
              element={
                <RequirePermission permission="user_relation.view">
                  <EvaluasiRelasiPenggunaPage />
                </RequirePermission>
              }
            />
          </Route>

          {/* ================= FALLBACK ================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}