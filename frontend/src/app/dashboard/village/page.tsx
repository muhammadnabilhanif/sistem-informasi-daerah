'use client';

import { useEffect, useState } from 'react';
import { statisticsApi } from '@/lib/api/statistics';

export default function VillageDashboard() {
  const [stats, setStats] = useState({
    totalResidents: 0,
    maleCount: 0,
    femaleCount: 0,
    totalHouseholds: 0,
    totalPrograms: 0,
    totalNews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Admin Desa');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserName(parsed.name || 'Admin Desa');
    }

    const fetchStats = async () => {
      try {
        const data = await statisticsApi.getVillageStats();
        setStats(data);
      } catch (error) {
        console.error('Error:', error);
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
    {
      title: 'Total Penduduk',
      value: stats.totalResidents,
      icon: '👥',
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: 'Laki-laki',
      value: stats.maleCount,
      icon: '👨',
      gradient: 'from-green-500 to-green-600',
    },
    {
      title: 'Perempuan',
      value: stats.femaleCount,
      icon: '👩',
      gradient: 'from-pink-500 to-pink-600',
    },
    {
      title: 'Kepala Keluarga',
      value: stats.totalHouseholds,
      icon: '🏠',
      gradient: 'from-purple-500 to-purple-600',
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">🏘️</span>
            Dashboard Desa Sukamaju
          </h1>
          <p className="text-gray-500 mt-1">
            Selamat datang, {userName}! Berikut ringkasan desa hari ini.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 bg-white px-4 py-2 rounded-xl shadow-sm">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Desa Aktif
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

      {/* Program & Berita */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg">
              📋
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Program Aktif</h2>
              <p className="text-sm text-gray-500">Program yang sedang berjalan</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold text-gray-800">{stats.totalPrograms}</p>
            <span className="text-gray-500">program</span>
          </div>
          <a
            href="/dashboard/villages/programs"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Lihat semua program →
          </a>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg">
              📰
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Berita Terbaru</h2>
              <p className="text-sm text-gray-500">Berita yang sudah dipublikasikan</p>
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl font-bold text-gray-800">{stats.totalNews}</p>
            <span className="text-gray-500">berita</span>
          </div>
          <a
            href="/dashboard/news"
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
          >
            Lihat semua berita →
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          ⚡ Aksi Cepat
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Edit Profil Desa', icon: '🏘️', href: '/dashboard/villages/profile' },
            { name: 'Tambah Berita', icon: '📰', href: '/dashboard/news' },
            { name: 'Buat Pengumuman', icon: '📢', href: '/dashboard/announcements' },
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

      {/* Statistik Penduduk Chart */}
      {stats.totalResidents > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            📊 Distribusi Penduduk
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">👨 Laki-laki</span>
                <span className="font-semibold text-blue-600">{stats.maleCount} jiwa</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${(stats.maleCount / stats.totalResidents) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700">👩 Perempuan</span>
                <span className="font-semibold text-pink-600">{stats.femaleCount} jiwa</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${(stats.femaleCount / stats.totalResidents) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}