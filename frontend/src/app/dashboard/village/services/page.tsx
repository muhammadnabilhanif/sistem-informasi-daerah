'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi ${newStatus}?`)) return;

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

      alert(`Berhasil! Status surat diubah menjadi ${newStatus}`);
      fetchRequests(); 
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'VERIFIED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daftar Pengajuan Warga</h1>
          <p className="text-gray-500 mt-1">Kelola dan verifikasi surat pengajuan dari warga desa Anda.</p>
        </div>
        <Link href="/dashboard/village" className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-700">
          Kembali ke Dashboard
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
            <p className="text-gray-500">Belum ada warga yang mengajukan surat.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b text-gray-600 text-sm">
                  <th className="p-4 font-semibold">No. Surat</th>
                  <th className="p-4 font-semibold">Pemohon</th>
                  <th className="p-4 font-semibold">Layanan</th>
                  <th className="p-4 font-semibold">Keperluan</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="p-4 font-semibold text-blue-600">{req.requestNumber}</td>
                    <td className="p-4 font-medium">{req.applicantName || req.applicant?.name || '-'}</td>
                    <td className="p-4 text-gray-600">{req.serviceType?.name || '-'}</td>
                    <td className="p-4 text-gray-600 truncate max-w-[150px]" title={req.purpose}>{req.purpose}</td>
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
                          className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                        >
                          Verifikasi
                        </button>
                      )}
                      {req.status === 'VERIFIED' && (
                        <button 
                          onClick={() => handleUpdateStatus(req.id, 'COMPLETED')}
                          disabled={isProcessing === req.id}
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 disabled:opacity-50"
                        >
                          Selesaikan
                        </button>
                      )}
                      {(req.status === 'PENDING' || req.status === 'VERIFIED') && (
                         <button 
                         onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                         disabled={isProcessing === req.id}
                         className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50"
                       >
                         Tolak
                       </button>
                      )}
                      {(req.status === 'COMPLETED' || req.status === 'REJECTED') && (
                        <span className="text-gray-400 text-sm italic">Selesai</span>
                      )}
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