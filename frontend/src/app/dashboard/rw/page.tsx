'use client';

import { useEffect, useState } from 'react';

export default function RwDashboard() {
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({ pendingRequests: 0 });
  const [rts, setRts] = useState<any[]>([]);

  useEffect(() => {
    let rwId = '';
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserName(parsed.name || 'Ketua RW');
      rwId = parsed.rwId || parsed.managedRwId || '';
    }

    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        // ✅ Panggil endpoint RW yang sudah kita buat di backend
        const res = await fetch(`${API_URL}/statistics/rw`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        if (res.ok) {
          setStats(await res.json());
        }

        // Ambil data RT berdasarkan rwId
        if (rwId) {
          const resRt = await fetch(`${API_URL}/regions/rts?rwId=${rwId}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (resRt.ok) {
            const dataRt = await resRt.json();
            setRts(Array.isArray(dataRt) ? dataRt : (dataRt.data || []));
          }
        }
      } catch (error) {
        console.error('Gagal ambil data RW', error);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <span className="text-4xl">🏙️</span> Dashboard Ketua RW
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang, {userName}! Berikut ringkasan wilayah RW Anda.
          </p>
        </div>
      </div>

      {/* Kartu Statistik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Kartu 1: Pengajuan Surat */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-2xl">
              📋
            </div>
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Pengajuan Surat
            </h3>
          </div>
          <p className="text-4xl font-bold">{stats.pendingRequests}</p>
          <p className="text-sm text-gray-500 mt-2">Menunggu persetujuan Anda</p>
        </div>
      </div>

      {/* Daftar RT di Wilayah Anda */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <span>🏘️</span> Daftar RT di Wilayah Anda
        </h2>

        {rts.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm">Belum ada RT</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {rts.map((rt: any) => {
              const rtNum = rt.number?.toString() || '';
              const displayLabel = rtNum.toUpperCase().startsWith('RT') ? rtNum : `RT ${rtNum}`;
              return (
                <div
                  key={rt.id}
                  className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl p-4 text-center transition hover:shadow-sm"
                >
                  <div className="text-2xl mb-1">🏡</div>
                  <span className="font-semibold text-gray-800 dark:text-gray-100">
                    {displayLabel}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}