'use client';

import { useEffect, useState } from 'react';
import { statisticsApi } from '@/lib/api/statistics';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalProvinces: 0,
    totalRegencies: 0,
    totalDistricts: 0,
    totalVillages: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await statisticsApi.getSuperAdminStats();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Provinsi', value: stats.totalProvinces, icon: '🏛️', gradient: 'from-blue-500 to-blue-600' },
    { title: 'Total Kabupaten', value: stats.totalRegencies, icon: '🏙️', gradient: 'from-green-500 to-green-600' },
    { title: 'Total Kecamatan', value: stats.totalDistricts, icon: '🏘️', gradient: 'from-purple-500 to-purple-600' },
    { title: 'Total Desa', value: stats.totalVillages, icon: '🏡', gradient: 'from-orange-500 to-orange-600' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">👑</span>
            Dashboard Super Admin
          </h1>
          <p className="text-gray-500 mt-1">
            Selamat datang kembali! Berikut ringkasan sistem hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Sistem Online
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card) => (
          <div
            key={card.title}
            className={`card-gradient bg-gradient-to-br ${card.gradient} text-white`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{card.title}</p>
                <p className="text-4xl font-bold mt-2">{card.value}</p>
              </div>
              <div className="text-4xl opacity-80">{card.icon}</div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/20">
              <p className="text-white/70 text-xs">Data dari database</p>
            </div>
          </div>
        ))}
      </div>

      {/* Stats User & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg">
              👥
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Total User</h2>
              <p className="text-sm text-gray-500">Pengguna terdaftar</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold text-gray-800">{stats.totalUsers}</p>
            <span className="text-gray-500">user</span>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg">
              ✅
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Status Sistem</h2>
              <p className="text-sm text-gray-500">Koneksi database</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <p className="text-lg font-semibold text-green-600">
              Database terhubung dengan {stats.totalUsers} user
            </p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          ⚡ Quick Actions
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Tambah Wilayah', icon: '📍', href: '/dashboard/regions/provinces' },
            { name: 'Tambah User', icon: '👥', href: '/dashboard/users' },
            { name: 'Lihat Audit', icon: '📋', href: '/dashboard/audit-logs' },
            { name: 'AI Assistant', icon: '🤖', href: '/dashboard/ai-assistant' },
          ].map((action) => (
            <a
              key={action.name}
              href={action.href}
              className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all text-center group"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {action.icon}
              </div>
              <p className="text-sm font-medium text-gray-700">{action.name}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}