'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Warga {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: string;
}

export default function RtWargaPage() {
  const [wargaList, setWargaList] = useState<Warga[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchWarga = async () => {
    try {
      setIsLoading(true);
      setErrorMsg('');
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(`${API_URL}/users/warga-rt`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Gagal mengambil data warga');
      }

      setWargaList(Array.isArray(json) ? json : (json.data || []));
    } catch (error: any) {
      setErrorMsg(error.message || 'Terjadi kesalahan saat memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWarga();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 animate-fade-in text-gray-800 dark:text-gray-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span>👥</span> Data Warga RT
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
            Daftar warga yang terdaftar di wilayah RT Anda.
          </p>
        </div>
        <Link
          href="/dashboard/rt"
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium text-sm transition flex items-center gap-2"
        >
          <span>←</span> Kembali ke Dashboard
        </Link>
      </div>

      {/* Konten Tabel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Memuat data warga...</div>
        ) : errorMsg ? (
          <div className="p-10 text-center text-red-500">{errorMsg}</div>
        ) : wargaList.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-lg font-medium">Belum ada warga</h3>
            <p className="text-gray-500 text-sm mt-1">Belum ada warga yang terdaftar di lingkungan RT Anda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-semibold">Nama</th>
                  <th className="p-4 font-semibold">Kontak</th>
                  <th className="p-4 font-semibold">Jenis Kelamin</th>
                  <th className="p-4 font-semibold">Alamat</th>
                  <th className="p-4 font-semibold text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {wargaList.map((warga) => (
                  <tr key={warga.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    {/* Kolom Nama */}
                    <td className="p-4">
                      <div className="font-semibold text-gray-900 dark:text-white">{warga.name}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">
                        Terdaftar: {new Date(warga.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </div>
                    </td>

                    {/* Kolom Kontak */}
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      <div>{warga.phone || '-'}</div>
                      <div className="text-xs text-gray-400 dark:text-gray-500">{warga.email}</div>
                    </td>

                    {/* ✅ KOLOM BARU: Jenis Kelamin */}
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {warga.gender === 'MALE' ? (
                        <span className="inline-flex items-center gap-1">
                          👨 Laki-laki
                        </span>
                      ) : warga.gender === 'FEMALE' ? (
                        <span className="inline-flex items-center gap-1">
                          👩 Perempuan
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Belum diisi</span>
                      )}
                    </td>

                    {/* Kolom Alamat */}
                    <td className="p-4 text-sm text-gray-600 dark:text-gray-300">
                      {warga.address || '-'}
                    </td>

                    {/* Kolom Status */}
                    <td className="p-4 text-center">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${warga.isActive
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          }`}
                      >
                        {warga.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

