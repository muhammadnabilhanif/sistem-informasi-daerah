'use client';

import { useEffect, useState } from 'react';
import { statisticsApi } from '@/lib/api/statistics';
import { villagesApi } from '@/lib/api/villages';

export default function CitizenDashboard() {
  const [stats, setStats] = useState({
    totalResidents: 0,
    maleCount: 0,
    femaleCount: 0,
    totalHouseholds: 0,
    totalNews: 0,
    totalPrograms: 0,
  });
  const [village, setVillage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Warga');

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserName(parsed.name || 'Warga');
    }

    const fetchData = async () => {
      try {
        const data = await statisticsApi.getCitizenStats();
        setStats(data);

        // Ambil info desa
        const userData = localStorage.getItem('user');
        if (userData) {
          const parsed = JSON.parse(userData);
          if (parsed.villageId) {
            const villageData = await villagesApi.getProfile(parsed.villageId);
            setVillage(villageData);
          }
        }
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton bg-gray-200 dark:bg-gray-800 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 skeleton bg-gray-200 dark:bg-gray-800 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">👤</span>
            Informasi Desa
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang, {userName}! Berikut informasi desa Anda.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-2 rounded-xl shadow-sm border border-transparent dark:border-gray-700">
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Data Terkini
        </div>
      </div>

      {/* Welcome Card */}
      <div className="card-gradient bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-2">Halo, {userName}! 👋</h2>
            <p className="text-blue-100">
              Akses semua informasi desa Anda di satu tempat. Ada yang bisa kami bantu?
            </p>
          </div>
          <a
            href="/dashboard/ai-assistant"
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg flex items-center gap-2"
          >
            🤖 Tanya AI
          </a>
        </div>
      </div>

      {/* Stat Cards - Clickable */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Penduduk */}
        <a
          href="/dashboard/residents"
          className="card group cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
              👥
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Total Penduduk</h3>
            </div>
            <span className="text-gray-300 dark:text-gray-600 group-hover:text-blue-500 group-hover:translate-x-1 transition-all">
              →
            </span>
          </div>
          <p className="text-4xl font-bold group-hover:text-blue-600 transition-colors">
            {stats.totalResidents}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">jiwa</p>
            <p className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat statistik →
            </p>
          </div>
        </a>

        {/* Program Desa */}
        <a
          href="/dashboard/villages/programs"
          className="card group cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
              📋
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Program Desa</h3>
            </div>
            <span className="text-gray-300 dark:text-gray-600 group-hover:text-green-500 group-hover:translate-x-1 transition-all">
              →
            </span>
          </div>
          <p className="text-4xl font-bold group-hover:text-green-600 transition-colors">
            {stats.totalPrograms}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">program aktif</p>
            <p className="text-xs text-green-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat program →
            </p>
          </div>
        </a>

        {/* Berita Terbaru */}
        <a
          href="/dashboard/news"
          className="card group cursor-pointer bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:border-orange-300 dark:hover:border-orange-500 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-2xl text-white shadow-lg group-hover:scale-110 transition-transform">
              📰
            </div>
            <div className="flex-1">
              <h3 className="text-sm text-gray-500 dark:text-gray-400">Berita Terbaru</h3>
            </div>
            <span className="text-gray-300 dark:text-gray-600 group-hover:text-orange-500 group-hover:translate-x-1 transition-all">
              →
            </span>
          </div>
          <p className="text-4xl font-bold group-hover:text-orange-600 transition-colors">
            {stats.totalNews}
          </p>
          <div className="flex items-center justify-between mt-2">
            <p className="text-sm text-gray-500 dark:text-gray-400">berita</p>
            <p className="text-xs text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity">
              Lihat berita →
            </p>
          </div>
        </a>
      </div>

      {/* Statistik Penduduk */}
      {stats.totalResidents > 0 && (
        <div className="card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            📊 Statistik Penduduk (Agregat)
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-700 dark:text-gray-300">👨 Laki-laki</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">{stats.maleCount} jiwa</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
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
                <span className="font-medium text-gray-700 dark:text-gray-300">👩 Perempuan</span>
                <span className="font-semibold text-pink-600 dark:text-pink-400">{stats.femaleCount} jiwa</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-pink-500 to-pink-600 h-3 rounded-full transition-all"
                  style={{
                    width: `${(stats.femaleCount / stats.totalResidents) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Kepala Keluarga</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalHouseholds}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Penduduk</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.totalResidents}</p>
              </div>
            </div>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-4 text-center">
            *Data agregat, tidak termasuk data pribadi
          </p>
        </div>
      )}

      {/* Quick Links */}
      <div className="card bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
          🔗 Akses Cepat
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { name: 'Berita', icon: '📰', href: '/dashboard/news' },
            { name: 'Pengumuman', icon: '📢', href: '/dashboard/announcements' },
            { name: 'Agenda', icon: '📅', href: '/dashboard/agendas' },
            { name: 'Dokumen', icon: '📄', href: '/dashboard/documents' },
          ].map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all text-center group border border-gray-100 dark:border-gray-700"
            >
              <div className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                {link.icon}
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{link.name}</p>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}