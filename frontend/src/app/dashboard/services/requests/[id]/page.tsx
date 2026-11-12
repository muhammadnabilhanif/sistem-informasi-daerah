'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

export default function DetailPengajuanPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [request, setRequest] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('WebMCP');
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        
        const res = await fetch(`${API_URL}/services/requests/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Gagal mengambil detail');
        
        setRequest(json);
      } catch (error: any) {
        setErrorMsg(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) fetchDetail();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-600 bg-yellow-100';
      case 'VERIFIED': return 'text-blue-600 bg-blue-100';
      case 'COMPLETED': return 'text-green-600 bg-green-100';
      case 'REJECTED': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (isLoading) return <div className="p-10 text-center">Memuat data...</div>;
  if (errorMsg) return <div className="p-10 text-center text-red-500">{errorMsg}</div>;
  if (!request) return <div className="p-10 text-center">Data tidak ditemukan</div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <Link href="/dashboard/services/requests" className="text-blue-600 hover:underline text-sm mb-2 inline-block">
            &larr; Kembali ke Riwayat
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Detail Pengajuan</h1>
          <p className="text-gray-500">Nomor: {request.requestNumber}</p>
        </div>
        
        {request.status === 'COMPLETED' && request.resultFileUrl && (
          <button 
            onClick={() => window.open(`http://localhost:3000${request.resultFileUrl}`, '_blank')}
            className="bg-green-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-green-700 shadow"
          >
            📄 Unduh Surat PDF
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* KIRI: Info Surat */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Informasi Pengajuan</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Jenis Layanan</p>
                <p className="font-semibold">{request.serviceType?.name}</p>
              </div>
              <div>
                <p className="text-gray-500">Status Saat Ini</p>
                <span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(request.status)}`}>
                  {request.status}
                </span>
              </div>
              <div className="col-span-2">
                <p className="text-gray-500">Keperluan</p>
                <p className="font-semibold">{request.purpose}</p>
              </div>
              {request.notes && (
                <div className="col-span-2">
                  <p className="text-gray-500">Catatan Tambahan</p>
                  <p>{request.notes}</p>
                </div>
              )}
              {request.rejectionReason && (
                <div className="col-span-2 p-3 bg-red-50 rounded border border-red-200">
                  <p className="text-red-700 font-semibold">Alasan Ditolak:</p>
                  <p className="text-red-600">{request.rejectionReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h2 className="text-lg font-bold mb-4 border-b pb-2">Lampiran Dokumen</h2>
            {request.attachments && request.attachments.length > 0 ? (
              <ul className="space-y-2">
                {request.attachments.map((url: string, i: number) => (
                  <li key={i}>
                    <a href={`http://localhost:3000${url}`} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      📄 Lihat Dokumen {i + 1}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500 italic">Tidak ada lampiran.</p>
            )}
          </div>
        </div>

        {/* KANAN: Timeline Status */}
        <div className="bg-white p-6 rounded-xl shadow-sm border h-fit">
          <h2 className="text-lg font-bold mb-6 border-b pb-2">Riwayat Proses</h2>
          <div className="relative border-l border-gray-200 ml-3 space-y-6">
            {request.statusLogs?.map((log: any, idx: number) => (
              <div key={idx} className="relative pl-6">
                <div className="absolute -left-1.5 top-1.5 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
                <p className="text-sm font-bold text-gray-800">{log.status}</p>
                <p className="text-xs text-gray-500 mb-1">
                  {new Date(log.createdAt).toLocaleString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
                {log.notes && <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded">{log.notes}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}