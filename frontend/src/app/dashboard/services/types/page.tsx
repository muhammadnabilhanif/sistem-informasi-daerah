'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { showConfirm, showSuccess, showError } from '@/lib/swal'; // ✅ Import Popup

interface Attachment {
  name: string;
  url: string;
  type: string;
  size?: number;
}

export default function SuperAdminServicesPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  // Lampiran modal state
  const [attachmentModal, setAttachmentModal] = useState<{
    open: boolean;
    requestNumber: string;
    attachments: Attachment[];
  }>({ open: false, requestNumber: '', attachments: [] });

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');

      if (!token) {
        setErrorMsg('Token tidak ditemukan. Silakan login ulang.');
        return;
      }

      // Karena ini Super Admin, backend akan mengembalikan SEMUA data pengajuan
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

  // ✅ PERBAIKAN: Gunakan Popup Modern
  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const result = await showConfirm(
      `Ubah Status ke ${newStatus}?`,
      'Pastikan Anda telah memeriksa data dengan benar.'
    );

    if (!result.isConfirmed) return;

    try {
      setIsProcessing(id);
      const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');

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
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'VERIFIED': return 'bg-blue-100 text-blue-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const openAttachmentModal = (req: any) => {
    const raw = req.attachments;
    let attachments: Attachment[] = [];
    if (Array.isArray(raw)) {
      attachments = raw as Attachment[];
    }
    setAttachmentModal({
      open: true,
      requestNumber: req.requestNumber,
      attachments,
    });
  };

  const getFileIcon = (type: string) => {
    if (type?.startsWith('image/')) return '🖼️';
    if (type?.includes('pdf')) return '📕';
    if (type?.includes('word') || type?.includes('document')) return '📘';
    return '📄';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto text-gray-800 dark:text-gray-100">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Semua Pengajuan Layanan</h1>
          <p className="text-gray-500 mt-1">Daftar seluruh pengajuan surat dari semua desa.</p>
        </div>
        <Link href="/dashboard/admin" className="px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
          Kembali ke Dashboard
        </Link>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
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
            <h3 className="text-lg font-medium">Belum Ada Pengajuan</h3>
            <p className="text-gray-500">Belum ada warga yang mengajukan surat di sistem.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 text-sm">
                  <th className="p-4 font-semibold">No. Surat</th>
                  <th className="p-4 font-semibold">Asal Desa</th>
                  <th className="p-4 font-semibold">Pemohon</th>
                  <th className="p-4 font-semibold">Layanan</th>
                  <th className="p-4 font-semibold">Lampiran</th>
                  <th className="p-4 font-semibold">Status</th>
                  <th className="p-4 font-semibold text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {requests.map((req) => {
                  const attachCount = Array.isArray(req.attachments) ? req.attachments.length : 0;
                  return (
                    <tr key={req.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                      <td className="p-4 font-semibold text-blue-600 dark:text-blue-400">{req.requestNumber}</td>
                      <td className="p-4 font-medium text-purple-700 dark:text-purple-400">
                        {req.serviceType?.village?.name || '-'}
                      </td>
                      <td className="p-4 font-medium">{req.applicantName || req.applicant?.name || '-'}</td>
                      <td className="p-4 text-gray-600 dark:text-gray-300">{req.serviceType?.name || '-'}</td>
                      <td className="p-4">
                        {attachCount > 0 ? (
                          <button
                            onClick={() => openAttachmentModal(req)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                          >
                            📎 {attachCount} file
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Tidak ada</span>
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
                        {(req.status === 'COMPLETED' || req.status === 'REJECTED') && (
                          <span className="text-gray-400 text-sm italic">Selesai</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ====== MODAL LAMPIRAN ====== */}
      {attachmentModal.open && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg animate-fade-in border border-gray-100 dark:border-gray-700">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-t-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">📎 Lampiran Dokumen</h2>
                <p className="text-indigo-200 text-sm mt-0.5">
                  No. Surat: <span className="font-semibold text-white">{attachmentModal.requestNumber}</span>
                </p>
              </div>
              <button
                onClick={() => setAttachmentModal({ open: false, requestNumber: '', attachments: [] })}
                className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/30 font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div className="p-5">
              {attachmentModal.attachments.length === 0 ? (
                <div className="text-center py-8">
                  <span className="text-4xl">📭</span>
                  <p className="text-gray-500 mt-3">Tidak ada lampiran yang diunggah.</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {attachmentModal.attachments.map((att, idx) => (
                    <li
                      key={idx}
                      className="flex items-center justify-between bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-2xl flex-shrink-0">{getFileIcon(att.type)}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold truncate">{att.name}</p>
                          {att.size && (
                            <p className="text-xs text-gray-400">{(att.size / 1024).toFixed(0)} KB</p>
                          )}
                        </div>
                      </div>
                      <a
                        href={`${API_URL}${att.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-3 flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                      >
                        ⬇ Unduh
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="px-5 pb-5">
              <button
                onClick={() => setAttachmentModal({ open: false, requestNumber: '', attachments: [] })}
                className="w-full py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors font-medium"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}