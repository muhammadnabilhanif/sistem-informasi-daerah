'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function RiwayatPengajuanPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // ✅ Baca key 'token' (sesuai screenshot DevTools Anda)
        const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');

        if (!token) {
          setErrorMsg('Token login tidak ditemukan. Silakan Logout lalu Login ulang.');
          setIsLoading(false);
          return;
        }

        // ✅ PERHATIKAN URL INI: Hapus '/api' jika backend tidak menggunakannya
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

        const res = await fetch(`${API_URL}/services/requests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (res.status === 404) {
          throw new Error('Endpoint API tidak ditemukan (404). Cek kembali URL di kode ini atau pastikan backend tidak menggunakan prefix /api.');
        }

        const json = await res.json();

        if (!res.ok) {
          throw new Error(json.message || 'Gagal mengambil data dari server');
        }

        setRequests(Array.isArray(json) ? json : (json.data || []));
      } catch (error: any) {
        setErrorMsg(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Tampilan UI sama seperti sebelumnya
  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Riwayat Pengajuan Surat</h1>
          <p className="text-gray-500 mt-1">Daftar surat yang telah Anda ajukan</p>
        </div>
        <Link href="/dashboard/services" className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition">
          Kembali
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Memuat data...</div>
        ) : errorMsg ? (
          <div className="p-10 text-center">
            <div className="inline-block p-4 bg-red-100 text-red-700 rounded-lg border border-red-300 font-medium">
              Error: {errorMsg}
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-medium text-gray-900">Belum Ada Pengajuan</h3>
            <p className="text-gray-500">Anda belum pernah mengajukan surat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 text-sm">
                  <th className="p-4 font-semibold">No. Surat</th>
                  <th className="p-4 font-semibold">Layanan</th>
                  <th className="p-4 font-semibold">Keperluan</th>
                  <th className="p-4 font-semibold">Tanggal</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-blue-600">{req.requestNumber}</td>
                    <td className="p-4">{req.serviceType?.name || '-'}</td>
                    <td className="p-4 text-gray-600">{req.purpose}</td>
                    <td className="p-4 text-gray-500">
                      {new Date(req.createdAt).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric'
                      })}
                    </td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${req.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          req.status === 'VERIFIED' ? 'bg-blue-100 text-blue-800' :
                            req.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              req.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                        {req.status}
                      </span>
                    </td>
                    {/* ✅ TAMBAHKAN KOLOM AKSI INI */}
                    <td className="p-4 text-center">
                      <Link
                        href={`/dashboard/services/requests/${req.id}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-semibold text-sm"
                      >
                        Lihat Detail
                      </Link>
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