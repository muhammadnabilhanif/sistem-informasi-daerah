'use client';

import { useEffect, useState } from 'react';
import { servicesApi, ServiceType } from '@/lib/api/services';

export default function ServicesPage() {
  const [types, setTypes] = useState<ServiceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [userVillage, setUserVillage] = useState('');
  const [userName, setUserName] = useState('');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState<ServiceType | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [form, setForm] = useState({
    purpose: '',
    notes: '',
    applicantNik: '',
    applicantPhone: '',
    applicantAddress: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      const parsed = JSON.parse(user);
      setUserVillage(parsed.villageId || '');
      setUserName(parsed.name || '');
    }
  }, []);

  useEffect(() => {
    if (!userVillage) return;

    const fetchTypes = async () => {
      setLoading(true);
      try {
        const data = await servicesApi.getPublicTypes(userVillage);
        setTypes(data);
      } catch (err) {
        setError('Gagal mengambil data layanan');
      } finally {
        setLoading(false);
      }
    };
    fetchTypes();
  }, [userVillage]);

  const handleOpenModal = (type: ServiceType) => {
    setSelectedType(type);
    setShowModal(true);
    setForm({
      purpose: '',
      notes: '',
      applicantNik: '',
      applicantPhone: '',
      applicantAddress: '',
    });
    setUploadedFiles([]);
    setError('');
    setSuccess('');
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType) return;

    console.log("Mengirim form. Total file:", uploadedFiles.length);

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const response = await servicesApi.createRequestWithFiles(
        {
          serviceTypeId: selectedType.id,
          purpose: form.purpose,
          notes: form.notes,
          applicantNik: form.applicantNik,
          applicantPhone: form.applicantPhone,
          applicantAddress: form.applicantAddress,
        },
        uploadedFiles,
      );

      setSuccess(`Pengajuan berhasil! Nomor: ${response.requestNumber}`);
      setTimeout(() => {
        handleCloseModal();
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gagal mengajukan surat');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 skeleton"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-48 skeleton"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <span className="text-4xl">📋</span>
            Layanan Surat
          </h1>
          <p className="text-gray-500 mt-1">
            Ajukan surat keterangan secara online ({types.length} layanan tersedia)
          </p>
        </div>
        <a
          href="/dashboard/services/requests"
          className="btn-secondary"
        >
          📊 Riwayat Pengajuan
        </a>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border-l-4 border-green-500 rounded-xl">
          <p className="text-green-700 text-sm">✅ {success}</p>
        </div>
      )}

      {types.length === 0 ? (
        <div className="card text-center py-12">
          <span className="text-5xl">📭</span>
          <p className="text-gray-500 mt-4">Belum ada layanan tersedia</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {types.map((type) => (
            <div
              key={type.id}
              className="card hover:shadow-lg transition-all hover:-translate-y-1 group"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center text-2xl shadow-lg group-hover:scale-110 transition-transform">
                  📄
                </div>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                  {type.code}
                </span>
              </div>

              <h3 className="text-lg font-bold text-gray-800 mb-2">
                {type.name}
              </h3>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {type.description || 'Tidak ada deskripsi'}
              </p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>⏱️</span>
                  <span>Proses {type.processingDays} hari</span>
                </div>
                {type.requirements && type.requirements.length > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <span>📎</span>
                    <span>{type.requirements.length} persyaratan</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleOpenModal(type)}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-medium shadow-md"
              >
                📝 Ajukan Sekarang
              </button>
            </div>
          ))}
        </div>
      )}

      {/* MODAL FORM PENGAJUAN */}
      {showModal && selectedType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center text-2xl border border-white/30">
                    📄
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">{selectedType.name}</h2>
                    <p className="text-blue-100 text-sm">Kode: {selectedType.code}</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center hover:bg-white/30"
                >
                  ✕
                </button>
              </div>

              {/* Requirements */}
              {selectedType.requirements && selectedType.requirements.length > 0 && (
                <div className="mt-4 p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/20">
                  <p className="text-xs text-white/80 font-medium mb-2">📎 Persyaratan:</p>
                  <ul className="text-sm text-white space-y-1">
                    {selectedType.requirements.map((req, idx) => (
                      <li key={idx}>• {req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded-lg">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="p-3 bg-green-50 border-l-4 border-green-500 rounded-lg">
                  <p className="text-green-700 text-sm">✅ {success}</p>
                </div>
              )}

              {/* Keperluan */}
              <div>
                <label className="label">
                  Keperluan <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Contoh: Untuk keperluan pendaftaran beasiswa"
                  value={form.purpose}
                  onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  required
                />
              </div>

              {/* NIK */}
              <div>
                <label className="label">NIK (opsional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="16 digit NIK"
                  maxLength={16}
                  value={form.applicantNik}
                  onChange={(e) => setForm({ ...form, applicantNik: e.target.value })}
                />
              </div>

              {/* Telepon */}
              <div>
                <label className="label">No. Telepon (opsional)</label>
                <input
                  type="text"
                  className="input"
                  placeholder="08xx-xxxx-xxxx"
                  value={form.applicantPhone}
                  onChange={(e) => setForm({ ...form, applicantPhone: e.target.value })}
                />
              </div>

              {/* Alamat */}
              <div>
                <label className="label">Alamat (opsional)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Alamat lengkap"
                  value={form.applicantAddress}
                  onChange={(e) => setForm({ ...form, applicantAddress: e.target.value })}
                />
              </div>

              {/* Catatan */}
              <div>
                <label className="label">Catatan Tambahan (opsional)</label>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Catatan tambahan..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              {/* Upload Dokumen Persyaratan */}
              <div>
                <label className="label">📎 Upload Dokumen Persyaratan</label>
                <div
                  className="border-2 border-dashed border-blue-300 rounded-xl p-5 text-center bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer relative z-10"
                  onClick={() => document.getElementById('file-upload-input')?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const dropped = Array.from(e.dataTransfer.files);
                    setUploadedFiles((prev) => [...prev, ...dropped]);
                  }}
                >
                  <span className="text-3xl block mb-2">☁️</span>
                  <p className="text-sm font-medium text-blue-700">Klik atau seret file ke sini</p>
                  <p className="text-xs text-blue-500 mt-1">JPG, PNG, PDF, DOC (maks. 5 MB per file)</p>
                  <input
                    id="file-upload-input"
                    type="file"
                    multiple
                    accept="image/*,application/pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        // ✅ PERBAIKAN: Memastikan file array tergabung dengan state sebelumnya
                        const newFiles = Array.from(e.target.files);
                        setUploadedFiles((prev) => [...prev, ...newFiles]);
                      }
                    }}
                  />
                </div>

                {/* File list preview */}
                {uploadedFiles.length > 0 && (
                  <ul className="mt-3 space-y-2">
                    {uploadedFiles.map((file, idx) => (
                      <li
                        key={idx}
                        className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm shadow-sm"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg">
                            {file.type.startsWith('image/') ? '🖼️' : '📄'}
                          </span>
                          <span className="truncate text-gray-700 font-medium">{file.name}</span>
                          <span className="text-gray-400 text-xs flex-shrink-0">
                            ({(file.size / 1024).toFixed(0)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setUploadedFiles((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="ml-2 text-red-400 hover:text-red-600 flex-shrink-0 font-bold text-base leading-none"
                          title="Hapus file"
                        >
                          ✕
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-700">
                  ℹ️ Estimasi proses: <strong>{selectedType.processingDays} hari kerja</strong>
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex-1 disabled:opacity-50"
                >
                  {submitting ? '⏳ Mengirim...' : '📤 Kirim Pengajuan'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn-secondary"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}