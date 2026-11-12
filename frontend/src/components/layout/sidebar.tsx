'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Sidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [role, setRole] = useState<string>('');
  const [userName, setUserName] = useState<string>('');
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setRole(parsed.role);
      setUserName(parsed.name);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const menus = {
    SUPER_ADMIN: [
      { name: 'Dashboard', href: '/dashboard/admin', icon: '📊' },
      { name: 'Wilayah', href: '/dashboard/regions/provinces', icon: '📍' },
      { name: 'Profil Desa', href: '/dashboard/villages/profile', icon: '🏘️' },
      { name: 'Struktur Pemerintahan', href: '/dashboard/villages/officials', icon: '👔' },
      { name: 'Program Kerja', href: '/dashboard/villages/programs', icon: '📋' },
      { name: 'Berita', href: '/dashboard/news', icon: '📰' },
      { name: 'Pengumuman', href: '/dashboard/announcements', icon: '📢' },
      { name: 'Agenda', href: '/dashboard/agendas', icon: '📅' },
      { name: 'Dokumen Publik', href: '/dashboard/documents', icon: '📄' },
      { name: 'Layanan', href: '/dashboard/services/types', icon: '📋' },
      { name: 'Data Penduduk', href: '/dashboard/residents', icon: '📊' },
      { name: 'Users', href: '/dashboard/users', icon: '👥' },
      { name: 'Audit Log', href: '/dashboard/audit-logs', icon: '📋' },
      { name: 'Konfigurasi AI', href: '/dashboard/ai-config', icon: '🧠' },
    ],

    VILLAGE_ADMIN: [
      { name: 'Dashboard Desa', href: '/dashboard/village', icon: '📊' },
      { name: 'Profil Desa', href: '/dashboard/villages/profile', icon: '🏘️' },
      { name: 'Struktur Pemerintahan', href: '/dashboard/villages/officials', icon: '👔' },
      { name: 'Program Kerja', href: '/dashboard/villages/programs', icon: '📋' },
      { name: 'Berita', href: '/dashboard/news', icon: '📰' },
      { name: 'Pengumuman', href: '/dashboard/announcements', icon: '📢' },
      { name: 'Agenda', href: '/dashboard/agendas', icon: '📅' },
      { name: 'Dokumen Publik', href: '/dashboard/documents', icon: '📄' },
      { name: 'Layanan', href: '/dashboard/services/admin', icon: '📋' },
      { name: 'Data Penduduk', href: '/dashboard/residents', icon: '📊' },
      { name: 'Kelola RT/RW', href: '/dashboard/village/users', icon: '👥' },
      { name: 'Audit Log', href: '/dashboard/audit-logs', icon: '📋' },
    ],

    CITIZEN: [
      { name: 'Informasi Desa', href: '/dashboard/citizen', icon: '📋' },
      { name: 'Profil Desa', href: '/dashboard/villages/profile', icon: '🏘️' },
      { name: 'Struktur Pemerintahan', href: '/dashboard/villages/officials', icon: '👔' },
      { name: 'Program Kerja', href: '/dashboard/villages/programs', icon: '📋' },
      { name: 'Berita', href: '/dashboard/news', icon: '📰' },
      { name: 'Pengumuman', href: '/dashboard/announcements', icon: '📢' },
      { name: 'Agenda', href: '/dashboard/agendas', icon: '📅' },
      { name: 'Dokumen Publik', href: '/dashboard/documents', icon: '📄' },
      { name: 'Layanan Surat', href: '/dashboard/services', icon: '📋' },
      { name: 'Statistik', href: '/dashboard/residents', icon: '📊' },
      { name: 'Pengaduan Warga', href: '/dashboard/warga/aduan', icon: '📢' }, // ✅ FITUR BARU
    ],

    RT_ADMIN: [
      { name: 'Dashboard RT', href: '/dashboard/rt', icon: '🏘️' },
      { name: 'Persetujuan Surat', href: '/dashboard/rt/services', icon: '📋' },
      { name: 'Aduan Warga', href: '/dashboard/rt/aduan', icon: '📢' }, // ✅ FITUR BARU
      { name: 'Data Warga', href: '/dashboard/rt/warga', icon: '👥' },
    ],

    RW_ADMIN: [
      { name: 'Dashboard RW', href: '/dashboard/rw', icon: '🏙️' },
      { name: 'Persetujuan Surat', href: '/dashboard/rw/services', icon: '📋' },
      { name: 'Aduan Warga', href: '/dashboard/rw/aduan', icon: '📢' }, // ✅ FITUR BARU
    ],
  };

  const currentMenus = menus[role as keyof typeof menus] || menus.CITIZEN;

  // ✅ Perbaikan Label Role
  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      SUPER_ADMIN: 'Super Admin',
      VILLAGE_ADMIN: 'Admin Desa',
      CITIZEN: 'Warga',
      RT_ADMIN: 'Admin RT',
      RW_ADMIN: 'Admin RW',
    };
    return labels[role] || role;
  };

  const sidebarContent = (
    <>
      {/* Logo */}
      <div className="p-6 border-b border-gray-700 dark:border-gray-600">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center text-xl shadow-lg">
            🏛️
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">Sistem Informasi</h1>
            <p className="text-blue-300 text-xs">Wilayah & Pemerintahan</p>
          </div>
        </div>
      </div>

      {/* User Info & Theme Toggle */}
      <div className="px-6 py-4 border-b border-gray-700 dark:border-gray-600 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium text-sm truncate">{userName}</p>
            <p className="text-blue-300 text-xs">{getRoleLabel(role)}</p>
          </div>
        </div>
        <ThemeToggle />
      </div>

      {/* Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {currentMenus.map((menu) => {
          const isActive = pathname === menu.href;
          return (
            <a
              key={menu.name}
              href={menu.href}
              onClick={() => setIsMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                }`}
            >
              <span className="text-lg">{menu.icon}</span>
              <span className="text-sm font-medium">{menu.name}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white"></span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-700 dark:border-gray-600">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all"
        >
          <span className="text-lg">🚪</span>
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 bg-gray-800 text-white rounded-xl shadow-lg flex items-center justify-center"
      >
        {isMobileOpen ? '✕' : '☰'}
      </button>

      {/* Overlay Mobile */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 z-40
          w-64 h-screen bg-gray-900 dark:bg-gray-950
          flex flex-col
          transition-transform duration-300
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {sidebarContent}
      </div>
    </>
  );
}