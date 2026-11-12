'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { showConfirm, showSuccess, showError } from '@/lib/swal';

export default function RwServicesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

      const res = await fetch(`${API_URL}/services/requests`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal mengambil data');

      const pendingOnly = (Array.isArray(json) ? json : (json.data || []))
        .filter((req: any) => req.status === 'PENDING');

      setRequests(pendingOnly);
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleVerify = async (id: string) => {
    const result = await showConfirm(
      'Verifikasi Surat?',
      'Anda yakin data warga ini sudah benar dan siap diteruskan ke Desa?'
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
        body: JSON.stringify({ status: 'VERIFIED' })
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Gagal memverifikasi');

      showSuccess('Berhasil!', 'Surat berhasil diverifikasi dan diteruskan ke Desa.');
      fetchRequests();
    } catch (error: any) {
      showError('Gagal', error.message);
    } finally {
      setIsProcessing(null);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Persetujuan Surat Warga</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Daftar pengajuan surat dari warga RW Anda yang menunggu verifikasi.</p>
        </div>
        <Link href="/dashboard/rw" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200">
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-10 text-center text-gray-500">Memuat data...</div>
        ) : errorMsg ? (
          <div className="p-10 text-center text-red-500">{errorMsg}</div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-medium">Tidak Ada Surat Menunggu</h3>
            <p className="text-gray-500">Belum ada surat baru dari warga RW Anda.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                <th className="p-4 font-semibold">No. Surat</th>
                <th className="p-4 font-semibold">Pemohon</th>
                <th className="p-4 font-semibold">Layanan</th>
                <th className="p-4 font-semibold">Keperluan</th>
                <th className="p-4 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {requests.map((req) => (
                <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">{req.requestNumber}</td>
                  <td className="p-4 font-medium">{req.applicantName}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{req.serviceType?.name}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">{req.purpose}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => handleVerify(req.id)}
                      disabled={isProcessing === req.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isProcessing === req.id ? 'Memproses...' : 'Verifikasi'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}