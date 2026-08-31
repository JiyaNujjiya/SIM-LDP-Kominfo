import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RequirePermission from './requirePermission';

import Login from './Login';
import Dashboard from './Dashboard';
import RisikoPage from './pages/RisikoPage';
import KonteksRisikoPage from './pages/KonteksRisikoPage';
import LayananPrioritasPage from './pages/LayananPrioritasRisikoPage';

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {;
    const savedUser = localStorage.getItem('user');

    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('rememberMe');
    setUser(null);
  }

  return (
    <BrowserRouter>
      {!user ? (
        <Routes>
          <Route
            path="*"
            element={
              <Login
                onLoginSuccess={(userData: any) => setUser(userData)}
              />
            }
          />
        </Routes>
      ) : (
        <Routes>
          <Route
            path="/dashboard"
            element={<Dashboard onLogout={handleLogout} />}
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
            path="*"
            element={<Navigate to="/dashboard" replace />}
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
            path="/risiko/layanan-prioritas"
            element={
              <RequirePermission permission="risk.view">
                <LayananPrioritasPage />
              </RequirePermission>
            }
          />
        </Routes>
      )}
    </BrowserRouter>
  );
}