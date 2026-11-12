'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { showConfirm, showSuccess, showError } from '@/lib/swal'; // ✅ Import popup modern

export default function AdminServicesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');

      if (!token) {
        setErrorMsg('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      // Backend otomatis memfilter data berdasarkan desa Admin yang login
      const res = await fetch(`${API_URL}/services/requests`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengambil data');

      setRequests(Array.isArray(json) ? json : (json.data || []));
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  // ✅ PERBAIKAN: Gunakan Popup Modern SweetAlert2
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const result = await showConfirm(
      `Ubah Status ke ${newStatus}?`,
      'Pastikan Anda telah memeriksa data dan lampiran dengan benar.'
    );

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(id);
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(`${API_URL}/services/requests/${id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengubah status');

      showSuccess('Berhasil!', `Status surat diubah menjadi ${newStatus}`);
      fetchRequests();
    } catch (error: any) {
      showError('Gagal', error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'VERIFIED': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'COMPLETED': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'REJECTED': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Daftar Pengajuan Warga</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola dan verifikasi surat pengajuan dari warga desa Anda.</p>
        </div>
        <Link href="/dashboard/village" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500 dark:text-gray-400">Memuat data...</div>
        ) : errorMsg ? (
          <div className="p-10 text-center">
            <div className="inline-block p-4 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg border border-red-300 dark:border-red-800 font-medium">
              Error: {errorMsg}
            </div>
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-medium">Belum Ada Pengajuan</h3>
            <p className="text-gray-500 dark:text-gray-400">Belum ada warga yang mengajukan surat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-semibold">No. Surat</th>
                  <th className="p-4 font-semibold">Pemohon</th>
                  <th className="p-4 font-semibold">Layanan</th>
                  <th className="p-4 font-semibold">Keperluan</th>
                  <th className="p-4 font-semibold">Lampiran</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">{req.requestNumber}</td>
                    <td className="p-4 font-medium">{req.applicantName || req.applicant?.name || '-'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300">{req.serviceType?.name || '-'}</td>
                    <td className="p-4 text-gray-600 dark:text-gray-300 truncate max-w-[150px]" title={req.purpose}>{req.purpose}</td>

                    {/* KOLOM LAMPIRAN */}
                    <td className="p-4">
                      {req.attachments && Array.isArray(req.attachments) && req.attachments.length > 0 ? (
                        <div className="flex flex-col space-y-1">
                          {req.attachments.map((file: any, idx: number) => {
                            let rawUrl = '';
                            if (typeof file === 'string') {
                              rawUrl = file;
                            } else if (typeof file === 'object' && file !== null) {
                              rawUrl = file.url || file.path || file.filename || file.name || '';
                            }

                            let fileUrl = rawUrl;
                            if (rawUrl && !rawUrl.startsWith('http')) {
                              const cleanPath = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;
                              fileUrl = `http://localhost:3000${cleanPath}`;
                            }

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => {
                                  if (fileUrl) window.open(fileUrl, '_blank');
                                }}
                                className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold flex items-center gap-1 text-left"
                              >
                                📄 File {idx + 1}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500 text-sm italic">Tidak ada</span>
                      )}
                    </td>

                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusBadge(req.status)}`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-center space-x-2">
                      {req.status === 'PENDING' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'VERIFIED')}
                          disabled={isProcessing === req.id}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 transition-colors"
                        >
                          Verifikasi
                        </button>
                      )}
                      {req.status === 'VERIFIED' && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                          disabled={isProcessing === req.id}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50 transition-colors"
                        >
                          Selesaikan
                        </button>
                      )}
                      {(req.status === 'PENDING' || req.status === 'VERIFIED') && (
                        <button
                          onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                          disabled={isProcessing === req.id}
                          className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Tolak
                        </button>
                      )}
                      {req.status === 'COMPLETED' && req.resultFileUrl ? (
                        <button
                          onClick={() => window.open(`http://localhost:3000${req.resultFileUrl}`, '_blank')}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 font-semibold shadow-sm transition-colors"
                        >
                          📄 Unduh Surat
                        </button>
                      ) : req.status === 'COMPLETED' ? (
                        <span className="text-gray-400 dark:text-gray-500 text-sm italic">PDF Belum Tersedia</span>
                      ) : req.status === 'REJECTED' ? (
                        <span className="text-red-400 dark:text-red-500 text-sm italic">Ditolak</span>
                      ) : null}
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