import React, { useState } from 'react';

import RisikoPage from './pages/RisikoPage';
import BcpPage from './pages/BcpPage';
import PerubahanPage from './pages/PerubahanPage';
import PengetahuanPage from './pages/PengetahuanPage';
import RelasiPenggunaPage from './pages/RelasiPenggunaPage';

type MenuType = 'risiko' | 'bcp' | 'perubahan' | 'pengetahuan' | 'relasi';

export default function Dashboard() {

  const [activeMenu, setActiveMenu] = useState<MenuType>('bcp');

  const menuItems: { id: MenuType; label: string }[] = [
    { id: 'risiko', label: 'Manajemen Risiko' },
    { id: 'bcp', label: 'Keberlangsungan (BCP)' },
    { id: 'perubahan', label: 'Manajemen Perubahan' },
    { id: 'pengetahuan', label: 'Manajemen Pengetahuan' },
    { id: 'relasi', label: 'Relasi Pengguna (Helpdesk)' },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
     
      <aside className="w-64 bg-blue-900 text-white flex flex-col justify-between shadow-lg">
        <div>
          {/* Dashboard Header */}
          <div className="p-6 border-b border-blue-800">
            <h1 className="text-2xl font-bold tracking-wide">LDP Digital</h1>
            <p className="text-xs text-blue-200 mt-1">Layanan Digital Pemerintah</p>
          </div>

          {/* Daftar Menu */}
          <nav className="p-4 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveMenu(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  activeMenu === item.id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-blue-100 hover:bg-blue-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer Sidebar */}
        <div className="p-4 border-t border-blue-800 text-xs text-blue-300 text-center">
          &copy; {new Date().getFullYear()} SPBE System
        </div>
      </aside>

      {/* 2. AREA KONTEN UTAMA */}
      <div className="flex-1 flex flex-col">
        {/* Header Atas */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Sistem Manajemen Layanan Digital
            </h2>
          </div>

          {/* Profil User */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="block text-sm font-semibold text-gray-700">Operator LDP</span>
              <span className="text-xs text-gray-500">operator@pemerintah.go.id</span>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase">
              Operator
            </span>
          </div>
        </header>

        {/* Area Render Komponen Halaman */}
        <main className="flex-1 p-8">
          {activeMenu === 'risiko' && <RisikoPage />}
          {activeMenu === 'bcp' && <BcpPage />}
          {activeMenu === 'perubahan' && <PerubahanPage />}
          {activeMenu === 'pengetahuan' && <PengetahuanPage />}
          {activeMenu === 'relasi' && <RelasiPenggunaPage />}
        </main>
      </div>
    </div>
  );
}