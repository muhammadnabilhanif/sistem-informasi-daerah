'use client';

import { useEffect, useState } from 'react';

export default function RtDashboard() {
  const [userName, setUserName] = useState('');
  // ✅ Tambahkan state untuk maleCount, femaleCount, dan agendas
  const [stats, setStats] = useState<any>({ 
    pendingRequests: 0, 
    totalCitizens: 0, 
    maleCount: 0,
    femaleCount: 0,
    totalPendingComplaints: 0,
    agendas: []
  });

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) setUserName(JSON.parse(user).name || 'Ketua RT');

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const res = await fetch(`${API_URL}/statistics/rt`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch (error) {
        console.error('Gagal ambil statistik', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-gray-800 dark:text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🏘️</span> Dashboard Ketua RT
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang, {userName}! Berikut ringkasan wilayah Anda.
          </p>
        </div>
      </div>

      {/* 3 Kartu Utama */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kartu 1: Pengajuan Surat */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">📋</div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Pengajuan Surat</h3>
          </div>
          <p className="text-4xl font-bold">{stats.pendingRequests}</p>
          <p className="text-sm text-gray-500 mt-2">Menunggu persetujuan Anda</p>
        </div>

        {/* Kartu 2: Total Warga */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center text-2xl">👥</div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Warga</h3>
          </div>
          <p className="text-4xl font-bold">{stats.totalCitizens}</p>
          <p className="text-sm text-gray-500 mt-2">Jiwa terdaftar di RT Anda</p>
        </div>

        {/* Kartu 3: Aduan Warga */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center text-2xl">📢</div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Aduan Warga</h3>
          </div>
          <p className="text-4xl font-bold">{stats.totalPendingComplaints ?? 0}</p>
          <p className="text-sm text-gray-500 mt-2">Aduan baru dari warga RT</p>
        </div>
      </div>

      {/* ✅ SECTION BARU: Grafik Kependudukan & Agenda */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
        
        {/* KIRI: Grafik Kependudukan */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            📊 Kependudukan RT
          </h3>
          <div className="space-y-5">
            {/* Laki-laki */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">👨 Laki-laki</span>
                <span className="font-bold">{stats.maleCount} Jiwa</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-blue-500 h-3 rounded-full transition-all" 
                  style={{ width: `${stats.totalCitizens ? (stats.maleCount / stats.totalCitizens) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            {/* Perempuan */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">👩 Perempuan</span>
                <span className="font-bold">{stats.femaleCount} Jiwa</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div 
                  className="bg-pink-500 h-3 rounded-full transition-all" 
                  style={{ width: `${stats.totalCitizens ? (stats.femaleCount / stats.totalCitizens) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* KANAN: Agenda Mendatang */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            📅 Agenda Mendatang
          </h3>
          {stats.agendas?.length === 0 ? (
            <p className="text-gray-500 text-sm italic">Belum ada agenda desa terdekat.</p>
          ) : (
            <ul className="space-y-3">
              {stats.agendas?.map((agenda: any) => (
                <li key={agenda.id} className="flex flex-col border-b pb-3 border-gray-100 dark:border-gray-700 last:border-0 last:pb-0">
                  <span className="font-semibold text-sm text-gray-800 dark:text-gray-200">{agenda.title}</span>
                  <span className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                    <span>🗓️ {new Date(agenda.startDatetime).toLocaleDateString('id-ID')}</span>
                    {agenda.location && <span>📍 {agenda.location}</span>}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

      </div>
    </div>
  );
}